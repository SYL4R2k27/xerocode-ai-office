"""
Professional roles & permissions system.
Each role has a set of default permissions. Custom overrides via user.permissions JSONB.
"""

# Structured permission matrix: module → available actions
PERMISSION_MATRIX: dict[str, list[str]] = {
    "dashboard": ["view", "finance", "sales", "projects"],
    "crm": ["view", "full"],
    "kanban": ["view", "manage"],
    "workflows": ["view", "manage", "run"],
    "documents": ["view", "create", "sign"],
    "edo": ["view", "send", "sign"],
    "skills": ["view", "manage"],
    "kb": ["view", "upload"],
    "research": ["view", "start", "council"],
    "team": ["view", "manage"],
    "reports": ["view", "finance", "sales", "projects"],
    "settings": ["view", "manage"],
    "chat": ["full"],
    "budget": ["view", "manage"],
    "channels": ["view", "create", "manage"],
    "calendar": ["view", "create", "manage"],
    "hr": ["view", "manage"],
    "files": ["view", "upload", "manage"],
    "integrations": ["view", "manage"],
}

# All available permissions (auto-generated from matrix)
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
    "director": ["dashboard", "chat", "crm", "kanban", "workflows", "documents", "doc_registry", "skills", "knowledge", "research", "analytics", "channels", "calendar", "hr", "team", "reports", "settings"],
    "chief_accountant": ["dashboard", "chat", "documents", "doc_registry", "knowledge", "research", "analytics", "calendar", "reports", "settings"],
    "accountant": ["dashboard", "chat", "documents", "doc_registry", "knowledge", "calendar", "reports"],
    "sales_manager": ["dashboard", "chat", "crm", "kanban", "documents", "knowledge", "research", "analytics", "channels", "calendar", "reports"],
    "project_manager": ["dashboard", "chat", "kanban", "workflows", "documents", "doc_registry", "skills", "knowledge", "research", "analytics", "channels", "calendar", "team", "reports"],
    "logistics": ["dashboard", "chat", "kanban", "documents", "doc_registry", "knowledge", "channels", "calendar"],
    "hr_manager": ["dashboard", "chat", "team", "hr", "documents", "doc_registry", "knowledge", "channels", "calendar", "reports"],
    "legal": ["dashboard", "chat", "documents", "doc_registry", "knowledge", "research", "calendar"],
    "marketer": ["dashboard", "chat", "crm", "kanban", "workflows", "documents", "skills", "knowledge", "research", "analytics", "channels", "calendar", "reports"],
    "operator": ["chat", "kanban", "skills", "knowledge", "channels"],
}


# Industry role templates
INDUSTRY_TEMPLATES: dict[str, dict] = {
    "it": {
        "label": "IT-компания",
        "roles": [
            {"name": "tech_lead", "label": "Техлид", "permissions": ["dashboard_view", "dashboard_projects", "kanban_view", "kanban_manage", "workflows_view", "workflows_manage", "workflows_run", "documents_view", "documents_create", "skills_view", "skills_manage", "kb_view", "kb_upload", "chat_full", "research_view", "research_start", "reports_view", "reports_projects", "team_view"], "modules": ["dashboard", "chat", "kanban", "workflows", "documents", "skills", "knowledge", "research", "team", "reports"]},
            {"name": "developer", "label": "Разработчик", "permissions": ["kanban_view", "kanban_manage", "chat_full", "skills_view", "kb_view", "kb_upload", "research_view", "research_start", "workflows_run"], "modules": ["chat", "kanban", "skills", "knowledge", "research"]},
            {"name": "qa_engineer", "label": "QA-инженер", "permissions": ["kanban_view", "kanban_manage", "chat_full", "kb_view", "documents_view", "reports_view"], "modules": ["chat", "kanban", "knowledge", "documents", "reports"]},
            {"name": "designer", "label": "Дизайнер", "permissions": ["kanban_view", "chat_full", "skills_view", "skills_manage", "kb_view", "documents_view", "documents_create"], "modules": ["chat", "kanban", "skills", "knowledge", "documents"]},
        ],
    },
    "retail": {
        "label": "Торговля",
        "roles": [
            {"name": "store_manager", "label": "Управляющий магазином", "permissions": ["dashboard_view", "dashboard_sales", "crm_view", "crm_full", "kanban_view", "kanban_manage", "documents_view", "documents_create", "reports_view", "reports_sales", "team_view", "team_manage", "chat_full", "kb_view"], "modules": ["dashboard", "chat", "crm", "kanban", "documents", "team", "reports"]},
            {"name": "cashier", "label": "Кассир", "permissions": ["crm_view", "chat_full", "documents_view"], "modules": ["chat", "crm", "documents"]},
            {"name": "warehouse", "label": "Кладовщик", "permissions": ["kanban_view", "kanban_manage", "documents_view", "documents_create", "chat_full"], "modules": ["chat", "kanban", "documents"]},
        ],
    },
    "manufacturing": {
        "label": "Производство",
        "roles": [
            {"name": "production_manager", "label": "Начальник производства", "permissions": ["dashboard_view", "dashboard_projects", "kanban_view", "kanban_manage", "workflows_view", "workflows_manage", "workflows_run", "documents_view", "documents_create", "reports_view", "reports_projects", "team_view", "team_manage", "chat_full", "kb_view", "kb_upload"], "modules": ["dashboard", "chat", "kanban", "workflows", "documents", "team", "reports", "knowledge"]},
            {"name": "engineer", "label": "Инженер", "permissions": ["kanban_view", "kanban_manage", "documents_view", "documents_create", "kb_view", "kb_upload", "chat_full", "workflows_run"], "modules": ["chat", "kanban", "documents", "knowledge"]},
            {"name": "quality_control", "label": "Контроль качества", "permissions": ["kanban_view", "documents_view", "documents_create", "reports_view", "chat_full", "kb_view"], "modules": ["chat", "kanban", "documents", "reports", "knowledge"]},
        ],
    },
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
