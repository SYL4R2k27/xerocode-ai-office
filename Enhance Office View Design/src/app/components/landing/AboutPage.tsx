import { motion } from "motion/react";
import {
  ArrowLeft, Mail, Phone, Globe, Github, Package,
  Shield, Brain, Zap, Users,
} from "lucide-react";
import { LogoFull, LogoIcon } from "../shared/Logo";

interface AboutPageProps {
  onBack: () => void;
  onLogin: () => void;
  hideHeader?: boolean;
}

export function AboutPage({ onBack, onLogin, hideHeader }: AboutPageProps) {
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

      <main className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <LogoIcon size={64} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">О XeroCode</h1>
          <p className="text-white/40 text-lg max-w-[500px] mx-auto">
            Ускоряем работу бизнеса с помощью AI-команды из 430+ моделей
          </p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/[0.06] to-blue-500/[0.04] border border-white/[0.06] mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4">Миссия</h2>
          <p className="text-white/60 leading-relaxed mb-4">
            Мы создаём инструмент, который позволяет бизнесу работать быстрее. Вместо того чтобы выбирать между GPT, Claude или Gemini — используйте все модели сразу, каждую для того, в чём она сильнее.
          </p>
          <p className="text-white/60 leading-relaxed">
            BYOK (Bring Your Own Key) — вы подключаете свои API-ключи и платите только провайдерам. Мы оркестрируем, не перепродаём.
          </p>
        </motion.div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {[
            { icon: Zap, title: "Скорость", desc: "Задачи выполняются в 10 раз быстрее. Секунды вместо часов.", color: "#FBBF24" },
            { icon: Shield, title: "Безопасность", desc: "AES-256 шифрование, JWT, rate limiting. 3 аудита пройдено.", color: "#10B981" },
            { icon: Brain, title: "Мульти-модельность", desc: "430+ моделей от 10 провайдеров. Каждая — для своей задачи.", color: "#818CF8" },
            { icon: Users, title: "Для команд", desc: "От фрилансера до команды в 20 человек. Единое пространство.", color: "#FB7185" },
          ].map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${v.color}12` }}>
                <v.icon size={20} style={{ color: v.color }} />
              </div>
              <h3 className="text-white font-semibold mb-1">{v.title}</h3>
              <p className="text-white/40 text-sm">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Tech stack summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-12"
        >
          <h2 className="text-lg font-bold text-white mb-4">Платформа в цифрах</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: "430+", label: "AI-моделей" },
              { num: "10", label: "провайдеров" },
              { num: "76", label: "API endpoints" },
              { num: "35K+", label: "строк кода" },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-white/[0.02]">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{s.num}</div>
                <div className="text-white/30 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
        >
          <h2 className="text-xl font-bold text-white mb-6">Контакты</h2>

          <div className="mb-6 pb-6 border-b border-white/[0.06]">
            <div className="text-white font-medium mb-1">Тирских Владимир Сергеевич</div>
            <div className="text-white/30 text-sm">ИП · ИНН 503015361714</div>
          </div>

          <div className="space-y-3">
            {[
              { icon: Mail, label: "Поддержка", value: "support@xerocode.space", href: "mailto:support@xerocode.space" },
              { icon: Mail, label: "Коммерческие", value: "sales@xerocode.space", href: "mailto:sales@xerocode.space" },
              { icon: Phone, label: "Телефон", value: "+7 (916) 685-96-58", href: "tel:+79166859658" },
              { icon: Globe, label: "Сайт", value: "xerocode.space", href: "https://xerocode.space" },
              { icon: Github, label: "GitHub", value: "github.com/SYL4R2k27", href: "https://github.com/SYL4R2k27/xerocode-ai-office" },
              { icon: Package, label: "npm", value: "xerocode-agent", href: "https://npmjs.com/package/xerocode-agent" },
            ].map(c => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-white/[0.02] transition-colors group"
              >
                <c.icon size={16} className="text-white/20 group-hover:text-purple-400 transition-colors" />
                <div>
                  <div className="text-white/40 text-[11px]">{c.label}</div>
                  <div className="text-white/70 text-sm">{c.value}</div>
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
