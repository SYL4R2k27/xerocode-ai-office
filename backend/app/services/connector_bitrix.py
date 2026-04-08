"""
Bitrix24 Connector — import/export via REST API webhooks.

Supports: deals, contacts, companies, tasks (with checklists), users, projects.
Pagination: 50 per request, uses 'next' parameter for batch fetching.
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime
from typing import Any

import httpx

logger = logging.getLogger(__name__)


def _validate_url(url: str) -> str:
    """Validate URL is not pointing to internal/private networks (SSRF protection)."""
    from urllib.parse import urlparse
    import ipaddress

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"Invalid URL scheme: {parsed.scheme}. Only http/https allowed.")

    hostname = parsed.hostname or ""
    # Block localhost
    if hostname in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
        raise ValueError("URLs pointing to localhost are not allowed")

    # Try to resolve and check IP
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError(f"URLs pointing to private/reserved IP ranges are not allowed: {hostname}")
    except ValueError as e:
        if "not allowed" in str(e):
            raise
        # hostname is a domain, not an IP — that's fine

    # Block common cloud metadata endpoints
    if hostname in ("169.254.169.254", "metadata.google.internal"):
        raise ValueError("Cloud metadata endpoints are not allowed")

    return url


class BitrixConnector:
    """Bitrix24 REST API client for data import/export."""

    def __init__(self, webhook_url: str):
        """
        webhook_url: e.g. https://b24-xxx.bitrix24.ru/rest/1/xxxxxxx/
        """
        self.webhook_url = _validate_url(webhook_url.rstrip("/"))

    async def _call(self, method: str, params: dict | None = None) -> dict:
        """Call Bitrix24 REST API method."""
        url = f"{self.webhook_url}/{method}"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=params or {})
            resp.raise_for_status()
            return resp.json()

    async def test_connection(self) -> dict:
        """Test webhook connectivity."""
        try:
            data = await self._call("profile")
            return {
                "ok": True,
                "user_id": data.get("result", {}).get("ID"),
                "name": f"{data.get('result', {}).get('NAME', '')} {data.get('result', {}).get('LAST_NAME', '')}".strip(),
                "portal": data.get("result", {}).get("ADMIN", False),
            }
        except Exception as e:
            return {"ok": False, "error": str(e)}

    async def fetch_all(self, method: str, params: dict | None = None) -> list[dict]:
        """Fetch all records with pagination (50 per page)."""
        all_items = []
        start = 0
        params = params or {}

        while True:
            params["start"] = start
            data = await self._call(method, params)
            result = data.get("result", [])
            if isinstance(result, list):
                all_items.extend(result)
            elif isinstance(result, dict) and "items" in result:
                all_items.extend(result["items"])
            else:
                break

            next_start = data.get("next")
            if not next_start:
                break
            start = next_start
            await asyncio.sleep(0.5)  # rate limit

        return all_items

    # ── Entity importers ──

    async def fetch_users(self) -> list[dict]:
        """Fetch all Bitrix24 users."""
        raw = await self.fetch_all("user.get", {"ACTIVE": True})
        return [
            {
                "bitrix_id": u.get("ID"),
                "email": u.get("EMAIL", ""),
                "name": f"{u.get('NAME', '')} {u.get('LAST_NAME', '')}".strip(),
                "department": u.get("UF_DEPARTMENT", []),
                "position": u.get("WORK_POSITION", ""),
                "phone": u.get("PERSONAL_MOBILE") or u.get("WORK_PHONE", ""),
                "is_admin": u.get("IS_ADMIN", False),
            }
            for u in raw
        ]

    async def fetch_contacts(self) -> list[dict]:
        """Fetch all CRM contacts."""
        raw = await self.fetch_all("crm.contact.list", {
            "select": ["ID", "NAME", "LAST_NAME", "EMAIL", "PHONE", "COMPANY_ID", "POST", "SOURCE_ID", "COMMENTS"],
        })
        return [
            {
                "bitrix_id": c.get("ID"),
                "name": f"{c.get('NAME', '')} {c.get('LAST_NAME', '')}".strip(),
                "email": _extract_multi(c.get("EMAIL")),
                "phone": _extract_multi(c.get("PHONE")),
                "company_id": c.get("COMPANY_ID"),
                "position": c.get("POST", ""),
                "source": c.get("SOURCE_ID", ""),
                "notes": c.get("COMMENTS", ""),
            }
            for c in raw
        ]

    async def fetch_companies(self) -> list[dict]:
        """Fetch all CRM companies."""
        raw = await self.fetch_all("crm.company.list", {
            "select": ["ID", "TITLE", "EMAIL", "PHONE", "INDUSTRY", "ADDRESS", "COMMENTS"],
        })
        return [
            {
                "bitrix_id": c.get("ID"),
                "name": c.get("TITLE", ""),
                "email": _extract_multi(c.get("EMAIL")),
                "phone": _extract_multi(c.get("PHONE")),
                "company": c.get("TITLE", ""),
                "industry": c.get("INDUSTRY", ""),
                "notes": c.get("COMMENTS", ""),
                "is_company": True,
            }
            for c in raw
        ]

    async def fetch_deals(self) -> list[dict]:
        """Fetch all CRM deals."""
        raw = await self.fetch_all("crm.deal.list", {
            "select": ["ID", "TITLE", "OPPORTUNITY", "CURRENCY_ID", "STAGE_ID", "CONTACT_ID",
                       "COMPANY_ID", "ASSIGNED_BY_ID", "COMMENTS", "SOURCE_ID", "BEGINDATE",
                       "CLOSEDATE", "DATE_CREATE", "DATE_MODIFY"],
        })
        return [
            {
                "bitrix_id": d.get("ID"),
                "title": d.get("TITLE", ""),
                "amount": float(d.get("OPPORTUNITY", 0) or 0),
                "currency": d.get("CURRENCY_ID", "RUB"),
                "stage": _map_deal_stage(d.get("STAGE_ID", "")),
                "contact_bitrix_id": d.get("CONTACT_ID"),
                "company_bitrix_id": d.get("COMPANY_ID"),
                "assignee_bitrix_id": d.get("ASSIGNED_BY_ID"),
                "description": d.get("COMMENTS", ""),
                "source": d.get("SOURCE_ID", ""),
                "expected_close": d.get("CLOSEDATE"),
                "created_at": d.get("DATE_CREATE"),
                "updated_at": d.get("DATE_MODIFY"),
            }
            for d in raw
        ]

    async def fetch_tasks(self) -> list[dict]:
        """Fetch all tasks with checklists."""
        raw = await self.fetch_all("tasks.task.list", {
            "select": ["ID", "TITLE", "DESCRIPTION", "RESPONSIBLE_ID", "CREATED_BY",
                       "DEADLINE", "STATUS", "PRIORITY", "TAGS", "GROUP_ID",
                       "PARENT_ID", "DATE_START", "CREATED_DATE", "CHANGED_DATE"],
        })

        tasks = []
        for t in raw:
            task_data = t.get("task", t) if isinstance(t, dict) and "task" in t else t
            task = {
                "bitrix_id": task_data.get("id") or task_data.get("ID"),
                "title": task_data.get("title") or task_data.get("TITLE", ""),
                "description": task_data.get("description") or task_data.get("DESCRIPTION", ""),
                "assignee_bitrix_id": task_data.get("responsibleId") or task_data.get("RESPONSIBLE_ID"),
                "creator_bitrix_id": task_data.get("createdBy") or task_data.get("CREATED_BY"),
                "deadline": task_data.get("deadline") or task_data.get("DEADLINE"),
                "status": _map_task_status(task_data.get("status") or task_data.get("STATUS", "2")),
                "priority": _map_task_priority(task_data.get("priority") or task_data.get("PRIORITY", "1")),
                "tags": task_data.get("tags") or task_data.get("TAGS", []),
                "parent_bitrix_id": task_data.get("parentId") or task_data.get("PARENT_ID"),
                "project_bitrix_id": task_data.get("groupId") or task_data.get("GROUP_ID"),
                "created_at": task_data.get("createdDate") or task_data.get("CREATED_DATE"),
            }

            # Fetch checklist for each task
            try:
                cl_data = await self._call("task.checklistitem.getlist", {"TASKID": task["bitrix_id"]})
                checklist_raw = cl_data.get("result", [])
                task["checklist"] = [
                    {"text": item.get("TITLE", ""), "done": item.get("IS_COMPLETE") == "Y"}
                    for item in checklist_raw
                ]
            except Exception:
                task["checklist"] = []

            tasks.append(task)
            await asyncio.sleep(0.2)  # rate limit for checklist calls

        return tasks

    async def fetch_deal_activities(self, deal_bitrix_id: str) -> list[dict]:
        """Fetch activities for a specific deal."""
        raw = await self.fetch_all("crm.activity.list", {
            "filter": {"OWNER_TYPE_ID": 2, "OWNER_ID": deal_bitrix_id},
            "select": ["ID", "TYPE_ID", "SUBJECT", "DESCRIPTION", "RESPONSIBLE_ID", "CREATED"],
        })
        type_map = {"1": "call", "2": "email", "3": "meeting", "4": "note"}
        return [
            {
                "bitrix_id": a.get("ID"),
                "activity_type": type_map.get(str(a.get("TYPE_ID")), "note"),
                "description": a.get("SUBJECT") or a.get("DESCRIPTION", ""),
                "created_at": a.get("CREATED"),
            }
            for a in raw
        ]


class OneCConnector:
    """1C OData REST API client for data import."""

    def __init__(self, base_url: str, username: str, password: str):
        """
        base_url: e.g. http://server/base/odata/standard.odata
        """
        self.base_url = _validate_url(base_url.rstrip("/"))
        self.auth = (username, password)

    async def _get(self, entity: str, params: dict | None = None) -> list[dict]:
        """Fetch data from 1C OData endpoint."""
        url = f"{self.base_url}/{entity}"
        headers = {"Accept": "application/json"}
        async with httpx.AsyncClient(timeout=30, auth=self.auth) as client:
            resp = await client.get(url, headers=headers, params=params or {})
            resp.raise_for_status()
            data = resp.json()
            return data.get("value", data.get("d", {}).get("results", []))

    async def test_connection(self) -> dict:
        """Test 1C OData connectivity."""
        try:
            async with httpx.AsyncClient(timeout=15, auth=self.auth) as client:
                resp = await client.get(f"{self.base_url}/$metadata", headers={"Accept": "application/xml"})
                return {"ok": resp.status_code == 200, "status_code": resp.status_code}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    async def fetch_counterparties(self) -> list[dict]:
        """Fetch counterparties (контрагенты)."""
        raw = await self._get("Catalog_Контрагенты", {"$format": "json"})
        return [
            {
                "odata_ref": c.get("Ref_Key"),
                "name": c.get("Description", ""),
                "inn": c.get("ИНН", ""),
                "kpp": c.get("КПП", ""),
                "full_name": c.get("НаименованиеПолное", ""),
                "is_company": True,
            }
            for c in raw
        ]

    async def fetch_nomenclature(self) -> list[dict]:
        """Fetch nomenclature (номенклатура)."""
        raw = await self._get("Catalog_Номенклатура", {"$format": "json"})
        return [
            {
                "odata_ref": n.get("Ref_Key"),
                "name": n.get("Description", ""),
                "article": n.get("Артикул", ""),
                "unit": n.get("ЕдиницаИзмерения", ""),
            }
            for n in raw
        ]

    async def fetch_documents(self, doc_type: str = "Document_СчетНаОплатуПокупателю") -> list[dict]:
        """Fetch documents (invoices, acts, etc.)."""
        raw = await self._get(doc_type, {"$format": "json", "$top": 500})
        return [
            {
                "odata_ref": d.get("Ref_Key"),
                "number": d.get("Number") or d.get("Номер", ""),
                "date": d.get("Date") or d.get("Дата", ""),
                "counterparty_ref": d.get("Контрагент_Key", ""),
                "amount": float(d.get("СуммаДокумента", 0) or 0),
                "comment": d.get("Комментарий", ""),
            }
            for d in raw
        ]


# ── Helpers ──

def _extract_multi(field) -> str:
    """Extract first value from Bitrix24 multi-field (EMAIL, PHONE)."""
    if isinstance(field, list) and field:
        return field[0].get("VALUE", "")
    if isinstance(field, str):
        return field
    return ""


STAGE_MAP = {
    "NEW": "lead", "PREPARATION": "proposal", "PREPAYMENT_INVOICE": "proposal",
    "EXECUTING": "negotiation", "FINAL_INVOICE": "decision",
    "WON": "won", "LOSE": "lost", "APOLOGY": "lost",
}


def _map_deal_stage(bitrix_stage: str) -> str:
    """Map Bitrix24 deal stage to XeroCode stage."""
    if not bitrix_stage:
        return "lead"
    stage_upper = bitrix_stage.upper().split(":")[-1] if ":" in bitrix_stage else bitrix_stage.upper()
    return STAGE_MAP.get(stage_upper, "lead")


def _map_task_status(bitrix_status: str) -> str:
    """Map Bitrix24 task status to XeroCode status."""
    status_map = {
        "1": "backlog",    # New
        "2": "backlog",    # Pending
        "3": "in_progress",  # In progress
        "4": "review_operator",  # Supposedly completed
        "5": "done",       # Completed
        "6": "on_hold",    # Deferred
        "7": "failed",     # Declined
    }
    return status_map.get(str(bitrix_status), "backlog")


def _map_task_priority(bitrix_priority: str) -> int:
    """Map Bitrix24 priority to XeroCode (0-10)."""
    pmap = {"0": 2, "1": 5, "2": 8}  # low, medium, high
    return pmap.get(str(bitrix_priority), 5)
