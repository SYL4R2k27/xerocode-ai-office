import { motion } from "motion/react";
import {
  ArrowLeft, Terminal, FileText, Search, FolderOpen, Shield, RefreshCw,
  Download, Monitor, Cpu, Laptop, Zap,
} from "lucide-react";
import { LogoFull } from "../shared/Logo";
import { AgentConnect } from "../shared/AgentConnect";

interface AgentPageProps {
  onBack: () => void;
  onLogin: () => void;
  hideHeader?: boolean;
}

export function AgentPage({ onBack, onLogin, hideHeader }: AgentPageProps) {
  const capabilities = [
    { icon: FileText, title: "Файлы", desc: "Создание, чтение и редактирование файлов в вашем проекте", color: "#818CF8" },
    { icon: Terminal, title: "Команды", desc: "Запуск npm, git, build и любых CLI-команд", color: "#5EEAD4" },
    { icon: Search, title: "Поиск по коду", desc: "Grep по паттернам, поиск функций и зависимостей", color: "#FBBF24" },
    { icon: FolderOpen, title: "Навигация", desc: "Обзор структуры проекта, list_files, дерево файлов", color: "#FB7185" },
    { icon: Shield, title: "Песочница", desc: "38 опасных команд заблокировано. Безопасное исполнение.", color: "#10B981" },
    { icon: RefreshCw, title: "Авто-переподключение", desc: "При обрыве соединения — восстановление за 3 секунды", color: "#A78BFA" },
  ];

  const platforms = [
    { icon: Laptop, label: "macOS", status: "Готово" },
    { icon: Monitor, label: "Windows", status: "Готово" },
    { icon: Cpu, label: "Linux", status: "Готово" },
  ];

  return (
    <div className="min-h-screen text-white">
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

      <main className="max-w-[900px] mx-auto px-6 py-16 md:py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs mb-6">
            <Terminal size={12} />
            Десктоп-агент
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI работает с вашими{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">файлами напрямую</span>
          </h1>
          <p className="text-white/40 text-lg max-w-[550px] mx-auto">
            Подключите компьютер к XeroCode — AI будет создавать файлы, запускать команды и навигировать по проекту
          </p>
        </motion.div>

        {/* Install options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12"
        >
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Terminal size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">CLI (npm)</h3>
                <p className="text-white/30 text-xs">Для разработчиков</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/[0.06] font-mono text-sm text-white/70">
              npx xerocode-agent
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Download size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Electron App</h3>
                <p className="text-white/30 text-xs">Скачать приложение</p>
              </div>
            </div>
            <div className="flex gap-2">
              {platforms.map(p => (
                <div key={p.label} className="flex-1 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
                  <p.icon size={16} className="text-white/40 mx-auto mb-1" />
                  <div className="text-white/60 text-xs font-medium">{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Agent Connect widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <AgentConnect />
        </motion.div>

        {/* Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Что умеет агент</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                whileHover={{ y: -4 }}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color}12` }}>
                  <c.icon size={20} style={{ color: c.color }} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{c.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-purple-500/[0.06] to-blue-500/[0.04] border border-white/[0.06]"
        >
          <h2 className="text-xl font-bold text-white mb-6 text-center">Как это работает</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Установите агент", desc: "npx xerocode-agent или скачайте Electron-приложение" },
              { num: "02", title: "Подключитесь", desc: "Введите код из веб-интерфейса — агент свяжется с платформой" },
              { num: "03", title: "Работайте", desc: "AI читает файлы, запускает команды, создаёт код — прямо на вашем компьютере" },
            ].map((s, i) => (
              <div key={s.num} className="text-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-400 font-bold flex items-center justify-center mx-auto mb-3">
                  {s.num}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
