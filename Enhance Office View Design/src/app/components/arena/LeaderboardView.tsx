import React, { useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal } from "lucide-react";

interface ModelStats {
  rank: number;
  model: string;
  provider: string;
  wins: number;
  losses: number;
  draws: number;
  elo: number;
  trend: "up" | "down" | "stable";
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#10a37f",
  anthropic: "#d4a27f",
  google: "#4285f4",
  groq: "#f55036",
  xai: "#1da1f2",
  deepseek: "#4f46e5",
  meta: "#0668e1",
  mistral: "#ff7000",
};

const DEMO_DATA: ModelStats[] = [
  { rank: 1, model: "claude-opus-4.6", provider: "anthropic", wins: 47, losses: 8, draws: 5, elo: 1580, trend: "up" },
  { rank: 2, model: "gpt-5.4", provider: "openai", wins: 42, losses: 12, draws: 6, elo: 1545, trend: "up" },
  { rank: 3, model: "gemini-2.5-pro", provider: "google", wins: 38, losses: 15, draws: 7, elo: 1510, trend: "stable" },
  { rank: 4, model: "grok-4", provider: "xai", wins: 35, losses: 18, draws: 7, elo: 1475, trend: "up" },
  { rank: 5, model: "deepseek-v3", provider: "deepseek", wins: 30, losses: 22, draws: 8, elo: 1430, trend: "down" },
  { rank: 6, model: "llama-3.3-70b", provider: "meta", wins: 28, losses: 25, draws: 7, elo: 1405, trend: "stable" },
  { rank: 7, model: "claude-sonnet-4.6", provider: "anthropic", wins: 25, losses: 20, draws: 15, elo: 1390, trend: "up" },
  { rank: 8, model: "gpt-5", provider: "openai", wins: 22, losses: 23, draws: 15, elo: 1365, trend: "down" },
  { rank: 9, model: "qwen3-coder", provider: "deepseek", wins: 20, losses: 28, draws: 12, elo: 1340, trend: "stable" },
  { rank: 10, model: "mistral-large", provider: "mistral", wins: 18, losses: 30, draws: 12, elo: 1310, trend: "down" },
];

const RANK_BADGES: Record<number, { icon: any; color: string; bg: string }> = {
  1: { icon: Crown, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  2: { icon: Medal, color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  3: { icon: Medal, color: "#cd7f32", bg: "rgba(205,127,50,0.15)" },
};

export const LeaderboardView: React.FC = () => {
  const [category, setCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Все" },
    { id: "code", label: "Код" },
    { id: "text", label: "Текст" },
    { id: "research", label: "Ресёрч" },
    { id: "design", label: "Дизайн" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0a", color: "#e0e0e0" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e1e", display: "flex", alignItems: "center", gap: "10px" }}>
        <Trophy size={20} color="#f59e0b" />
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>Рейтинг моделей</span>
        <span style={{ fontSize: "12px", color: "#666", marginLeft: "auto" }}>Elo рейтинг по результатам Arena</span>
      </div>

      {/* Category filter */}
      <div style={{ padding: "10px 20px", display: "flex", gap: "6px", borderBottom: "1px solid #1e1e1e" }}>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            style={{
              padding: "5px 14px", borderRadius: "12px", border: "none", cursor: "pointer",
              background: category === c.id ? "#8b5cf6" : "#141416",
              color: category === c.id ? "#fff" : "#888",
              fontSize: "11px", fontWeight: category === c.id ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div style={{
        display: "grid", gridTemplateColumns: "50px 1fr 80px 80px 60px 90px 50px",
        padding: "10px 20px", borderBottom: "1px solid #1e1e1e",
        fontSize: "10px", color: "#666", textTransform: "uppercase", fontWeight: 600,
      }}>
        <span>#</span>
        <span>Модель</span>
        <span style={{ textAlign: "center" }}>Победы</span>
        <span style={{ textAlign: "center" }}>Поражения</span>
        <span style={{ textAlign: "center" }}>Win%</span>
        <span style={{ textAlign: "center" }}>Elo</span>
        <span style={{ textAlign: "center" }}>Тренд</span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {DEMO_DATA.map((m, i) => {
          const badge = RANK_BADGES[m.rank];
          const winRate = Math.round((m.wins / (m.wins + m.losses + m.draws)) * 100);
          const provColor = PROVIDER_COLORS[m.provider] || "#888";

          return (
            <div
              key={m.model}
              style={{
                display: "grid", gridTemplateColumns: "50px 1fr 80px 80px 60px 90px 50px",
                padding: "12px 20px", borderBottom: "1px solid #141416",
                alignItems: "center", transition: "background 0.15s",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,92,246,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)")}
            >
              {/* Rank */}
              <div style={{ display: "flex", alignItems: "center" }}>
                {badge ? (
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%", background: badge.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <badge.icon size={14} color={badge.color} />
                  </div>
                ) : (
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#666", paddingLeft: "6px" }}>{m.rank}</span>
                )}
              </div>

              {/* Model name + provider */}
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{m.model}</div>
                <div style={{ fontSize: "10px", color: provColor, marginTop: "2px" }}>{m.provider}</div>
              </div>

              {/* Wins */}
              <div style={{ textAlign: "center", fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>{m.wins}</div>

              {/* Losses */}
              <div style={{ textAlign: "center", fontSize: "13px", color: "#ef4444" }}>{m.losses}</div>

              {/* Win rate */}
              <div style={{ textAlign: "center", fontSize: "12px", color: winRate >= 60 ? "#22c55e" : winRate >= 40 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>
                {winRate}%
              </div>

              {/* Elo */}
              <div style={{ textAlign: "center" }}>
                <span style={{
                  fontSize: "13px", fontWeight: 700,
                  color: m.elo >= 1500 ? "#8b5cf6" : m.elo >= 1400 ? "#3b82f6" : "#888",
                }}>
                  {m.elo}
                </span>
              </div>

              {/* Trend */}
              <div style={{ textAlign: "center" }}>
                {m.trend === "up" && <TrendingUp size={16} color="#22c55e" />}
                {m.trend === "down" && <TrendingDown size={16} color="#ef4444" />}
                {m.trend === "stable" && <Minus size={16} color="#666" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid #1e1e1e", fontSize: "11px", color: "#555", textAlign: "center" }}>
        Рейтинг обновляется после каждого голосования в Arena. Elo: начальный 1200, K=32.
      </div>
    </div>
  );
};
