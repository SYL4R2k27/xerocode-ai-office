import { useState, useCallback } from "react";

type Lang = "ru" | "en" | "kz";

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  ru: {
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
  en: {
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
  kz: {
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
};

export function useTranslation() {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("xerocode_lang") as Lang) || "ru";
  });

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.ru[key] || key;
  }, [lang]);

  const changeLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("xerocode_lang", newLang);
  }, []);

  return { t, lang, changeLang, availableLangs: ["ru", "en", "kz"] as Lang[] };
}
