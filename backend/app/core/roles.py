"""
Professional roles & permissions system.
Each role has a set of default permissions. Custom overrides via user.permissions JSONB.
"""

# All available permissions
ALL_PERMISSIONS = [
    "dashboard_view", "dashboard_finance", "dashboard_sales", "dashboard_projects",
    "crm_view", "crm_full",
    "kanban_view", "kanban_manage",
    "workflows_view", "workflows_manage", "workflows_run",
    "documents_view", "documents_create", "documents_sign",
    "edo_view", "edo_send", "edo_sign",
    "skills_view", "skills_manage",
    "kb_view", "kb_upload",
    "team_view", "team_manage",
    "reports_view", "reports_finance", "reports_sales", "reports_projects",
    "settings_view", "settings_manage",
    "chat_full",
    "budget_view", "budget_manage",
]

# Default permissions per professional role
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "director": ALL_PERMISSIONS,  # всё

    "chief_accountant": [
        "dashboard_view", "dashboard_finance",
        "documents_view", "documents_create", "documents_sign",
        "edo_view", "edo_send", "edo_sign",
        "reports_view", "reports_finance",
        "kb_view", "kb_upload",
        "chat_full", "budget_view",
        "workflows_view", "workflows_run",
        "skills_view",
    ],

    "accountant": [
        "dashboard_view", "dashboard_finance",
        "documents_view", "documents_create",
        "edo_view", "edo_send",
        "reports_view", "reports_finance",
        "kb_view",
        "chat_full",
        "workflows_view", "workflows_run",
        "skills_view",
    ],

    "sales_manager": [
        "dashboard_view", "dashboard_sales",
        "crm_view", "crm_full",
        "kanban_view", "kanban_manage",
        "documents_view", "documents_create",
        "reports_view", "reports_sales",
        "kb_view", "kb_upload",
        "chat_full",
        "workflows_view", "workflows_run",
        "skills_view",
    ],

    "project_manager": [
        "dashboard_view", "dashboard_projects",
        "crm_view",
        "kanban_view", "kanban_manage",
        "workflows_view", "workflows_manage", "workflows_run",
        "documents_view", "documents_create",
        "reports_view", "reports_projects",
        "team_view",
        "kb_view", "kb_upload",
        "chat_full",
        "skills_view", "skills_manage",
        "budget_view",
    ],

    "logistics": [
        "dashboard_view",
        "kanban_view", "kanban_manage",
        "documents_view", "documents_create",
        "edo_view", "edo_send",
        "kb_view",
        "chat_full",
        "workflows_view", "workflows_run",
        "skills_view",
    ],

    "hr_manager": [
        "dashboard_view",
        "team_view", "team_manage",
        "documents_view", "documents_create",
        "reports_view",
        "kb_view", "kb_upload",
        "chat_full",
        "workflows_view", "workflows_run",
        "skills_view",
    ],

    "legal": [
        "dashboard_view",
        "documents_view", "documents_create", "documents_sign",
        "edo_view", "edo_send", "edo_sign",
        "kb_view", "kb_upload",
        "chat_full",
        "workflows_view", "workflows_run",
        "skills_view",
    ],

    "marketer": [
        "dashboard_view",
        "crm_view",
        "kanban_view",
        "documents_view", "documents_create",
        "reports_view",
        "kb_view", "kb_upload",
        "chat_full",
        "workflows_view", "workflows_manage", "workflows_run",
        "skills_view", "skills_manage",
    ],

    "operator": [
        "kanban_view",
        "chat_full",
        "skills_view",
        "kb_view",
        "workflows_run",
        "documents_view",
    ],
}

# Human-readable labels
ROLE_LABELS: dict[str, str] = {
    "director": "Руководитель",
    "chief_accountant": "Главный бухгалтер",
    "accountant": "Бухгалтер",
    "sales_manager": "Менеджер по продажам",
    "project_manager": "Менеджер проектов",
    "logistics": "Логист",
    "hr_manager": "HR-менеджер",
    "legal": "Юрист",
    "marketer": "Маркетолог",
    "operator": "Оператор",
}

# Which sidebar modules each role sees
ROLE_MODULES: dict[str, list[str]] = {
    "director": ["dashboard", "chat", "crm", "kanban", "workflows", "documents", "skills", "knowledge", "team", "reports", "settings"],
    "chief_accountant": ["dashboard", "chat", "documents", "knowledge", "reports", "settings"],
    "accountant": ["dashboard", "chat", "documents", "knowledge", "reports"],
    "sales_manager": ["dashboard", "chat", "crm", "kanban", "documents", "knowledge", "reports"],
    "project_manager": ["dashboard", "chat", "kanban", "workflows", "documents", "skills", "knowledge", "team", "reports"],
    "logistics": ["dashboard", "chat", "kanban", "documents", "knowledge"],
    "hr_manager": ["dashboard", "chat", "team", "documents", "knowledge", "reports"],
    "legal": ["dashboard", "chat", "documents", "knowledge"],
    "marketer": ["dashboard", "chat", "crm", "kanban", "workflows", "documents", "skills", "knowledge", "reports"],
    "operator": ["chat", "kanban", "skills", "knowledge"],
}


def get_user_permissions(user) -> list[str]:
    """Get effective permissions for a user (role defaults + custom overrides)."""
    # Admin gets everything
    if getattr(user, "is_admin", False) or getattr(user, "plan", "") == "admin":
        return ALL_PERMISSIONS

    # Org owner/manager gets broad access
    org_role = getattr(user, "org_role", None)
    if org_role == "owner":
        return ALL_PERMISSIONS

    # Professional role permissions
    prof_role = getattr(user, "professional_role", None) or "operator"
    base_perms = set(ROLE_PERMISSIONS.get(prof_role, ROLE_PERMISSIONS["operator"]))

    # Manager org_role gets team/reports access
    if org_role == "manager":
        base_perms.update(["team_view", "reports_view", "kanban_manage"])

    # Custom permission overrides
    custom = getattr(user, "permissions", None)
    if custom and isinstance(custom, dict):
        for perm, enabled in custom.items():
            if enabled:
                base_perms.add(perm)
            else:
                base_perms.discard(perm)

    return sorted(base_perms)


def get_user_modules(user) -> list[str]:
    """Get sidebar modules visible to user."""
    if getattr(user, "is_admin", False) or getattr(user, "org_role", None) == "owner":
        return ROLE_MODULES["director"]

    prof_role = getattr(user, "professional_role", None) or "operator"
    return ROLE_MODULES.get(prof_role, ROLE_MODULES["operator"])
