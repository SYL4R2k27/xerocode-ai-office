import React from "react";
import { Crown, Medal } from "lucide-react";

interface ModelStats {
  rank: number;
  model: string;
  provider: string;
  wins: number;
  losses: number;
  draws: number;
  elo: number;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "var(--provider-openai)",
  anthropic: "var(--provider-anthropic)",
  google: "var(--provider-google)",
  groq: "var(--provider-groq)",
  xai: "var(--provider-xai)",
  deepseek: "var(--provider-deepseek)",
  meta: "var(--provider-meta)",
  mistral: "var(--provider-mistral)",
};

const DEMO_DATA: ModelStats[] = [
  { rank: 1, model: "claude-opus-4.6", provider: "anthropic", wins: 47, losses: 8, draws: 5, elo: 1580 },
  { rank: 2, model: "gpt-5.4", provider: "openai", wins: 42, losses: 12, draws: 6, elo: 1545 },
  { rank: 3, model: "gemini-2.5-pro", provider: "google", wins: 38, losses: 15, draws: 7, elo: 1510 },
  { rank: 4, model: "grok-4", provider: "xai", wins: 35, losses: 18, draws: 7, elo: 1475 },
  { rank: 5, model: "deepseek-v3", provider: "deepseek", wins: 30, losses: 22, draws: 8, elo: 1430 },
  { rank: 6, model: "llama-3.3-70b", provider: "meta", wins: 28, losses: 25, draws: 7, elo: 1405 },
  { rank: 7, model: "claude-sonnet-4.6", provider: "anthropic", wins: 25, losses: 20, draws: 15, elo: 1390 },
  { rank: 8, model: "gpt-5", provider: "openai", wins: 22, losses: 23, draws: 15, elo: 1365 },
  { rank: 9, model: "qwen3-coder", provider: "deepseek", wins: 20, losses: 28, draws: 12, elo: 1340 },
  { rank: 10, model: "mistral-large", provider: "mistral", wins: 18, losses: 30, draws: 12, elo: 1310 },
];

const RANK_BADGES: Record<number, { icon: any; color: string; bg: string }> = {
  1: { icon: Crown, color: "var(--accent-amber)", bg: "color-mix(in srgb, var(--accent-amber) 15%, transparent)" },
  2: { icon: Medal, color: "var(--text-tertiary)", bg: "color-mix(in srgb, var(--text-tertiary) 15%, transparent)" },
  3: { icon: Medal, color: "#cd7f32", bg: "rgba(205,127,50,0.15)" },
};

export const LeaderboardView: React.FC = () => {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* Table header */}
      <div style={{
        display: "grid", gridTemplateColumns: "36px 1fr 56px 56px 70px",
        padding: "8px 12px", borderBottom: "1px solid var(--border-default)",
        fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 600,
      }}>
        <span>#</span>
        <span>Модель</span>
        <span style={{ textAlign: "center" }}>W</span>
        <span style={{ textAlign: "center" }}>L</span>
        <span style={{ textAlign: "center" }}>Elo</span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {DEMO_DATA.map((m, i) => {
          const badge = RANK_BADGES[m.rank];
          const provColor = PROVIDER_COLORS[m.provider] || "var(--text-tertiary)";

          return (
            <div
              key={m.model}
              style={{
                display: "grid", gridTemplateColumns: "36px 1fr 56px 56px 70px",
                padding: "8px 12px", borderBottom: "1px solid var(--border-subtle)",
                alignItems: "center", transition: "background 0.15s",
                background: i % 2 === 0 ? "transparent" : "var(--bg-surface)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in srgb, var(--accent-arena) 5%, transparent)")}
              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "var(--bg-surface)")}
            >
              {/* Rank */}
              <div style={{ display: "flex", alignItems: "center" }}>
                {badge ? (
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%", background: badge.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <badge.icon size={12} color={badge.color} />
                  </div>
                ) : (
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-tertiary)", paddingLeft: "4px" }}>{m.rank}</span>
                )}
              </div>

              {/* Model name + provider */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.model}</div>
                <div style={{ fontSize: "10px", color: provColor, marginTop: "1px" }}>{m.provider}</div>
              </div>

              {/* Wins */}
              <div style={{ textAlign: "center", fontSize: "12px", color: "var(--accent-green, #22c55e)", fontWeight: 600 }}>{m.wins}</div>

              {/* Losses */}
              <div style={{ textAlign: "center", fontSize: "12px", color: "var(--accent-red, #ef4444)" }}>{m.losses}</div>

              {/* Elo */}
              <div style={{ textAlign: "center" }}>
                <span style={{
                  fontSize: "12px", fontWeight: 700,
                  color: m.elo >= 1500 ? "var(--accent-arena)" : m.elo >= 1400 ? "var(--accent-blue)" : "var(--text-tertiary)",
                }}>
                  {m.elo}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
