import { motion } from "motion/react";
import {
  ArrowLeft, Users, BarChart3, ClipboardList, Shield, Bell,
  Palette, Bot, Zap, FileCheck, Lock, Globe, Settings, TrendingUp,
} from "lucide-react";
import { LogoFull } from "../shared/Logo";

interface BusinessPageProps {
  onBack: () => void;
  onLogin: () => void;
  hideHeader?: boolean;
}

export function BusinessPage({ onBack, onLogin, hideHeader }: BusinessPageProps) {
  const tiers = [
    { team: "3-5 человек", price: "89 990₽/мес" },
    { team: "6-10 человек", price: "179 990₽/мес" },
    { team: "11-15 человек", price: "229 990₽/мес" },
    { team: "16-20 человек", price: "379 990₽/мес" },
  ];

  const features = [
    { icon: BarChart3, title: "Командный дашборд", desc: "Статистика использования, расходы по сотрудникам, ROI от AI", color: "#818CF8" },
    { icon: ClipboardList, title: "Kanban-доска", desc: "Задачи с ревью — менеджер проверяет результаты AI перед отправкой", color: "#5EEAD4" },
    { icon: Users, title: "Роли и доступы", desc: "Руководитель / Менеджер / Сотрудник — каждому свои права", color: "#FBBF24" },
    { icon: TrendingUp, title: "Аналитика расходов", desc: "Сколько токенов потратил каждый сотрудник, на какие задачи", color: "#FB7185" },
    { icon: Lock, title: "SSO (SAML/OIDC)", desc: "Единый вход через Google Workspace, Active Directory", color: "#10B981" },
    { icon: FileCheck, title: "Аудит-лог", desc: "Полная история действий всех сотрудников для compliance", color: "#A78BFA" },
    { icon: Bell, title: "Webhook-уведомления", desc: "Интеграция с Telegram, Slack — уведомления о завершении задач", color: "#F59E0B" },
    { icon: Palette, title: "Брендинг", desc: "Логотип компании, фон рабочего пространства, цветовая схема", color: "#EC4899" },
    { icon: Bot, title: "430+ AI-моделей", desc: "GPT-5, Claude Opus, Gemini, Grok, Stability AI — без ограничений", color: "#6366F1" },
    { icon: Zap, title: "Безлимитные задачи", desc: "Никаких лимитов на задачи, агентов, изображения и токены", color: "#14B8A6" },
    { icon: Shield, title: "Шифрование ключей", desc: "API-ключи шифруются Fernet, расшифровываются только при запросе", color: "#EF4444" },
    { icon: Globe, title: "Без VPN из РФ", desc: "Прозрачный EU-прокси — сотрудники работают без настроек", color: "#8B5CF6" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      {!hideHeader && (
      <header className="sticky top-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex items-center justify-between h-16">
          <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} />
            Назад
          </button>
          <LogoFull height={26} />
          <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm hover:bg-white/[0.08] transition-all">
            Войти
          </button>
        </div>
      </header>
      )}

      <main className="max-w-[1000px] mx-auto px-6 py-16 md:py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-6">
            <Users size={12} />
            Для бизнеса
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI-команда для{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">вашей команды</span>
          </h1>
          <p className="text-white/40 text-lg max-w-[550px] mx-auto">
            Единое рабочее пространство для 3-20 сотрудников. Руководитель ставит цели, менеджеры распределяют, сотрудники работают с AI.
          </p>
        </motion.div>

        {/* Roles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16"
        >
          {[
            { role: "Руководитель", desc: "Дашборд, аналитика, бюджеты, контроль расходов AI", icon: Settings, color: "#F59E0B" },
            { role: "Менеджер", desc: "Kanban, распределение задач, ревью результатов AI", icon: ClipboardList, color: "#818CF8" },
            { role: "Сотрудник", desc: "Чат с AI-командой, инструменты, генерация контента", icon: Bot, color: "#5EEAD4" },
          ].map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: `${r.color}12` }}>
                <r.icon size={24} style={{ color: r.color }} />
              </div>
              <h3 className="text-white font-bold mb-2">{r.role}</h3>
              <p className="text-white/40 text-sm">{r.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Что входит</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
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
        </motion.div>

        {/* Pricing tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04] border border-amber-500/20"
        >
          <h2 className="text-xl font-bold text-white mb-6 text-center">Тарифы для команд</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[600px] mx-auto">
            {tiers.map((t, i) => (
              <motion.div
                key={t.team}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.06 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-amber-400" />
                  <span className="text-white text-sm font-medium">{t.team}</span>
                </div>
                <span className="text-amber-400 font-bold text-sm">{t.price}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-white/30 text-xs text-center mt-4">Только для юр. лиц. Оплата по счёту + акт с НДС.</p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center"
        >
          <h3 className="text-xl font-bold text-white mb-3">Готовы подключить команду?</h3>
          <p className="text-white/40 text-sm mb-6">Настроим workspace за 1 день</p>
          <a
            href="mailto:sales@xerocode.space"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold hover:from-amber-400 hover:to-orange-400 transition-all"
          >
            sales@xerocode.space
          </a>
        </motion.div>
      </main>
    </div>
  );
}
