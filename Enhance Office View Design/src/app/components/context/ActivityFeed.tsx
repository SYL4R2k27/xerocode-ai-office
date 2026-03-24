import { Bot, User, Settings, AlertTriangle } from "lucide-react";
import type { Message } from "../../lib/api";

const senderIcons: Record<string, typeof Bot> = {
  agent: Bot,
  user: User,
  system: Settings,
};

interface ActivityFeedProps {
  messages: Message[];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function ActivityFeed({ messages }: ActivityFeedProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
        <Settings size={24} style={{ color: "var(--text-tertiary)" }} />
        <p className="text-[12px] text-center" style={{ color: "var(--text-tertiary)" }}>
          События появятся здесь
        </p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5 overflow-y-auto h-full">
      {messages.map((msg) => {
        const Icon = senderIcons[msg.sender_type] || Settings;
        const isError = msg.message_type === "system" && msg.content.toLowerCase().includes("error");

        return (
          <div
            key={msg.id}
            className="flex items-start gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            <span className="flex-shrink-0 mt-0.5">
              {isError ? (
                <AlertTriangle size={11} style={{ color: "var(--accent-rose)" }} />
              ) : (
                <Icon size={11} style={{ color: "var(--text-tertiary)" }} />
              )}
            </span>
            <span className="text-[10px] flex-shrink-0 tabular-nums" style={{ color: "var(--text-tertiary)" }}>
              {formatTime(msg.created_at)}
            </span>
            <span
              className="text-[11px] truncate flex-1"
              style={{ color: isError ? "var(--accent-rose)" : "var(--text-secondary)" }}
            >
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                {msg.sender_name}
              </span>
              {": "}
              {msg.content.slice(0, 100)}
              {msg.content.length > 100 && "..."}
            </span>
          </div>
        );
      })}
    </div>
  );
}
