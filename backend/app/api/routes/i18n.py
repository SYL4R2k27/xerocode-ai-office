"""i18n — translations API for XeroCode AI Office."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/i18n", tags=["i18n"])


# ---------------------------------------------------------------------------
# Translation dictionaries
# ---------------------------------------------------------------------------

TRANSLATIONS: dict[str, dict[str, str]] = {
    "ru": {
        "dashboard": "Главная", "tasks": "Задачи", "crm": "CRM", "documents": "Документы",
        "settings": "Настройки", "team": "Команда", "reports": "Отчёты", "search": "Поиск",
        "create": "Создать", "save": "Сохранить", "cancel": "Отмена", "delete": "Удалить",
        "loading": "Загрузка...", "error": "Ошибка", "success": "Успешно",
        "login": "Войти", "logout": "Выйти", "profile": "Профиль",
        "new_task": "Новая задача", "new_deal": "Новая сделка", "new_contact": "Новый контакт",
        "priority": "Приоритет", "status": "Статус", "assignee": "Исполнитель",
        "deadline": "Крайний срок", "description": "Описание", "title": "Название",
        "all": "Все", "active": "Активные", "completed": "Завершённые",
        "calendar": "Календарь", "channels": "Каналы", "analytics": "Аналитика",
        "hr": "HR", "knowledge": "База знаний", "integrations": "Интеграции",
        "notifications": "Уведомления", "help": "Помощь", "back": "Назад",
        "next": "Далее", "submit": "Отправить", "edit": "Редактировать",
        "copy": "Копировать", "share": "Поделиться", "download": "Скачать",
        "upload": "Загрузить", "filter": "Фильтр", "sort": "Сортировка",
        "today": "Сегодня", "yesterday": "Вчера", "this_week": "Эта неделя",
    },
    "en": {
        "dashboard": "Dashboard", "tasks": "Tasks", "crm": "CRM", "documents": "Documents",
        "settings": "Settings", "team": "Team", "reports": "Reports", "search": "Search",
        "create": "Create", "save": "Save", "cancel": "Cancel", "delete": "Delete",
        "loading": "Loading...", "error": "Error", "success": "Success",
        "login": "Sign In", "logout": "Sign Out", "profile": "Profile",
        "new_task": "New Task", "new_deal": "New Deal", "new_contact": "New Contact",
        "priority": "Priority", "status": "Status", "assignee": "Assignee",
        "deadline": "Deadline", "description": "Description", "title": "Title",
        "all": "All", "active": "Active", "completed": "Completed",
        "calendar": "Calendar", "channels": "Channels", "analytics": "Analytics",
        "hr": "HR", "knowledge": "Knowledge Base", "integrations": "Integrations",
        "notifications": "Notifications", "help": "Help", "back": "Back",
        "next": "Next", "submit": "Submit", "edit": "Edit",
        "copy": "Copy", "share": "Share", "download": "Download",
        "upload": "Upload", "filter": "Filter", "sort": "Sort",
        "today": "Today", "yesterday": "Yesterday", "this_week": "This Week",
    },
    "kz": {
        "dashboard": "Басты бет", "tasks": "Тапсырмалар", "crm": "CRM", "documents": "Құжаттар",
        "settings": "Баптаулар", "team": "Команда", "reports": "Есептер", "search": "Іздеу",
        "create": "Жасау", "save": "Сақтау", "cancel": "Бас тарту", "delete": "Жою",
        "loading": "Жүктелуде...", "error": "Қате", "success": "Сәтті",
        "login": "Кіру", "logout": "Шығу", "profile": "Профиль",
        "new_task": "Жаңа тапсырма", "new_deal": "Жаңа мәміле", "new_contact": "Жаңа байланыс",
        "priority": "Басымдық", "status": "Мәртебе", "assignee": "Орындаушы",
        "deadline": "Мерзім", "description": "Сипаттама", "title": "Тақырып",
        "all": "Барлығы", "active": "Белсенді", "completed": "Аяқталған",
        "calendar": "Күнтізбе", "channels": "Арналар", "analytics": "Аналитика",
        "hr": "HR", "knowledge": "Білім базасы", "integrations": "Интеграциялар",
        "notifications": "Хабарландырулар", "help": "Көмек", "back": "Артқа",
        "next": "Келесі", "submit": "Жіберу", "edit": "Өңдеу",
        "copy": "Көшіру", "share": "Бөлісу", "download": "Жүктеу",
        "upload": "Жүктеу", "filter": "Сүзгі", "sort": "Сұрыптау",
        "today": "Бүгін", "yesterday": "Кеше", "this_week": "Осы апта",
    },
}

SUPPORTED_LANGS = list(TRANSLATIONS.keys())


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    from_lang: str = Field(default="ru")
    to_lang: str = Field(default="en")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/{lang}")
async def get_translations(lang: str):
    """Return translation dictionary for a language."""
    if lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=404, detail=f"Language '{lang}' not supported. Available: {SUPPORTED_LANGS}")
    return {"lang": lang, "translations": TRANSLATIONS[lang]}


@router.post("/translate")
async def translate_text(body: TranslateRequest):
    """AI-translate a string between languages."""
    from app.api.routes.documents import _call_ai

    system_prompt = f"You are a professional translator. Translate the following text from {body.from_lang} to {body.to_lang}. Return ONLY the translated text, nothing else."
    result = await _call_ai(system_prompt, body.text, prefer_premium=False)
    if not result:
        raise HTTPException(status_code=502, detail="AI translation service unavailable")
    return {"original": body.text, "translated": result.strip(), "from_lang": body.from_lang, "to_lang": body.to_lang}
