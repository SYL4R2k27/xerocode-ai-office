import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Users, BarChart3, ClipboardList, Shield, Bell,
  Palette, Bot, Zap, FileCheck, Lock, Globe, Settings, TrendingUp,
  FileText, Calendar, MessageSquare, Plug, Search, BookOpen,
  PieChart, Crown, Building2, Check, X, ChevronDown,
  UserCheck, KanbanSquare, GitBranch, Headphones,
} from "lucide-react";
import { LogoFull } from "../shared/Logo";

interface BusinessPageProps {
  onBack: () => void;
  onLogin: () => void;
  hideHeader?: boolean;
}

export function BusinessPage({ onBack, onLogin, hideHeader }: BusinessPageProps) {
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const tiers = [
    { team: "CORPORATE (3-5 чел.)", price: "14 990₽/мес", desc: "Бесплатные AI модели", color: "#F59E0B" },
    { team: "CORPORATE PLUS (3-5 чел.)", price: "49 990₽/мес", desc: "Все премиум модели", color: "#9333EA" },
    { team: "CORPORATE PLUS (6-10 чел.)", price: "89 990₽/мес", desc: "Все премиум модели", color: "#9333EA" },
    { team: "CORPORATE PLUS (11-20 чел.)", price: "129 990₽/мес", desc: "Все премиум модели", color: "#9333EA" },
  ];

  const modules = [
    { icon: TrendingUp, title: "CRM", desc: "Воронка продаж, карточки сделок с timeline, контакты, аналитика конверсий", color: "#10B981" },
    { icon: KanbanSquare, title: "Задачи", desc: "Kanban + Список + Сроки. Чек-листы, подзадачи, соисполнители, комментарии", color: "#3B82F6" },
    { icon: FileText, title: "Документооборот", desc: "Реестр документов, auto-numbering, маршруты согласования, шаблоны", color: "#8B5CF6" },
    { icon: Calendar, title: "Календарь", desc: "Встречи, дедлайны, события. Привязка к задачам и сделкам", color: "#F59E0B" },
    { icon: MessageSquare, title: "Каналы", desc: "Корпоративный мессенджер — каналы по отделам и проектам", color: "#06B6D4" },
    { icon: UserCheck, title: "HR", desc: "Сотрудники, отпуска, больничные, onboarding-чеклисты", color: "#EC4899" },
    { icon: GitBranch, title: "Workflows", desc: "Визуальный конструктор автоматизаций (DAG), шаблоны, webhook-триггеры", color: "#14B8A6" },
    { icon: BookOpen, title: "База знаний", desc: "Загрузка документов (PDF, DOCX, TXT), векторный поиск, RAG-инъекция в AI", color: "#A78BFA" },
    { icon: Search, title: "Deep Research", desc: "Итеративный AI-поиск (2-4 мин), Model Council, Sparkpage HTML-отчёты", color: "#60A5FA" },
    { icon: PieChart, title: "AI Аналитика", desc: "Автоматические отчёты из данных CRM/задач. Запрос на естественном языке", color: "#FB7185" },
    { icon: Plug, title: "Интеграции", desc: "1С (OData REST) + Битрикс24 (webhook/OAuth). Импорт сделок, контактов, задач", color: "#F97316" },
    { icon: Zap, title: "Skills", desc: "6 встроенных + кастомные AI-навыки. Запуск одной кнопкой", color: "#22D3EE" },
  ];

  const roles = [
    { role: "Руководитель", desc: "Дашборд, аналитика, бюджеты, CRM, отчёты, управление ролями и правами", icon: Crown, color: "#F59E0B", perms: "Полный доступ ко всем модулям" },
    { role: "Менеджер", desc: "Kanban, распределение задач, ревью, CRM сделки, документы, HR", icon: ClipboardList, color: "#818CF8", perms: "Управление командой + AI" },
    { role: "Сотрудник", desc: "Чат с AI, задачи, документы, календарь. 10 проф. ролей", icon: Bot, color: "#5EEAD4", perms: "Работа в рамках роли" },
  ];

  const profRoles = [
    "Директор", "Главный бухгалтер", "Бухгалтер", "Менеджер продаж",
    "Менеджер проектов", "Логист", "HR-менеджер", "Юрист", "Маркетолог", "Оператор",
  ];

  const security = [
    { icon: Lock, title: "Шифрование ключей", desc: "API-ключи — Fernet encryption" },
    { icon: FileCheck, title: "Аудит-лог", desc: "Полная история действий" },
    { icon: Shield, title: "Матрица прав", desc: "30+ permissions, модуль+действие" },
    { icon: Globe, title: "Без VPN из РФ", desc: "EU-прокси к OpenAI, Anthropic" },
    { icon: Bell, title: "Webhook + API", desc: "Интеграция с любой системой" },
    { icon: Palette, title: "Брендинг", desc: "Фон workspace, тема оформления" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {!hideHeader && (
        <header className="sticky top-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex items-center justify-between h-16">
            <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
              <ArrowLeft size={16} /> Назад
            </button>
            <LogoFull height={26} />
            <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm hover:bg-white/[0.08] transition-all">
              Войти
            </button>
          </div>
        </header>
      )}

      <main className="max-w-[1100px] mx-auto px-6 py-16 md:py-24">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-6">
            <Building2 size={12} /> Корпоративная платформа
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Битрикс24 + 1С +{" "}
            <span className="bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">430 AI-моделей</span>
          </h1>
          <p className="text-white/40 text-lg max-w-[600px] mx-auto">
            CRM, задачи, документооборот, HR, календарь — всё в одном. Плюс AI-команда из 430+ моделей для автоматизации рутины.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6 text-sm">
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">от 14 990 ₽/мес</span>
            <span className="text-white/20">•</span>
            <span className="text-white/40">3-20 сотрудников</span>
            <span className="text-white/20">•</span>
            <span className="text-white/40">Счёт + НДС</span>
          </div>
        </motion.div>

        {/* Roles */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">3 уровня доступа</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((r, i) => (
              <motion.div key={r.role} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${r.color}12` }}>
                  <r.icon size={24} style={{ color: r.color }} />
                </div>
                <h3 className="text-white font-bold mb-1">{r.role}</h3>
                <p className="text-white/40 text-sm mb-3">{r.desc}</p>
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${r.color}15`, color: r.color }}>{r.perms}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-xs text-white/30 mb-2">10 профессиональных ролей:</p>
            <div className="flex flex-wrap gap-2">
              {profRoles.map(r => (
                <span key={r} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] text-white/50">{r}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Modules grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-2xl font-bold text-white mb-2 text-center">12 модулей</h2>
          <p className="text-white/30 text-sm text-center mb-8">Всё что есть в Битрикс24, плюс AI-суперсилы</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAllFeatures ? modules : modules.slice(0, 6)).map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.04 }}
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}12` }}>
                    <f.icon size={18} style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {!showAllFeatures && (
            <div className="text-center mt-4">
              <button onClick={() => setShowAllFeatures(true)} className="text-sm text-white/40 hover:text-white/60 transition-colors flex items-center gap-1 mx-auto">
                Показать все 12 модулей <ChevronDown size={14} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Integrations highlight */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-orange-500/[0.06] to-purple-500/[0.04] border border-orange-500/20">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Импорт из Битрикс24 и 1С</h2>
          <p className="text-white/30 text-sm text-center mb-6">Подключите за 5 минут — данные перенесутся автоматически</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center"><span className="text-sm font-bold text-blue-400">Б24</span></div>
                <h3 className="text-white font-semibold">Битрикс24</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-white/50">
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Сделки и воронки</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Контакты и компании</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Задачи с чек-листами</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Проекты и пользователи</li>
              </ul>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center"><span className="text-sm font-bold text-yellow-400">1С</span></div>
                <h3 className="text-white font-semibold">1С:Предприятие</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-white/50">
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Контрагенты (ИНН, КПП)</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Номенклатура</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Документы (счета, акты)</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-green-400" /> Договоры</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Безопасность и контроль</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {security.map((s, i) => (
              <div key={s.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <s.icon size={16} className="text-white/30 mb-2" />
                <h4 className="text-white text-xs font-semibold mb-0.5">{s.title}</h4>
                <p className="text-white/30 text-[11px]">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-amber-500/[0.06] to-purple-500/[0.04] border border-amber-500/20">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Тарифы для команд</h2>
          <p className="text-white/30 text-sm text-center mb-6">CORPORATE — бесплатные AI. CORPORATE PLUS — все 430+ моделей</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[700px] mx-auto">
            {tiers.map((t, i) => (
              <motion.div
                key={t.team}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.06 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div>
                  <span className="text-white text-sm font-medium block">{t.team}</span>
                  <span className="text-white/30 text-[11px]">{t.desc}</span>
                </div>
                <span className="font-bold text-sm" style={{ color: t.color }}>{t.price}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-white/30 text-xs text-center mt-4">Юр. лица. Оплата по счёту + акт с НДС. Настройка за 1 день.</p>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-12 text-center">
          <h3 className="text-xl font-bold text-white mb-3">Готовы подключить команду?</h3>
          <p className="text-white/40 text-sm mb-6">Настроим workspace, импортируем данные из Б24/1С за 1 день</p>
          <a
            href="mailto:sales@xerocode.space?subject=Corporate%20подключение"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-purple-500 text-white font-semibold hover:from-amber-400 hover:to-purple-400 transition-all"
          >
            sales@xerocode.space
          </a>
        </motion.div>
      </main>
    </div>
  );
}
