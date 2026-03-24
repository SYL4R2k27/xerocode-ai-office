import type { GoalStatus } from "../../lib/api";

interface CostMeterProps {
  status: GoalStatus | null;
}

export function CostMeter({ status }: CostMeterProps) {
  const cost = status?.cost;
  if (!cost) return null;

  return (
    <div
      className="px-3 py-2.5"
      style={{ borderTop: "1px solid var(--border-default)" }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Расходы
        </span>
        <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--accent-amber)" }}>
          ${cost.total_cost_usd?.toFixed(4) || "0.0000"}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
        <span>{cost.message_count || 0} сообщ.</span>
        <span>{cost.total_tokens?.toLocaleString() || 0} ток.</span>
        {cost.exchange_count !== undefined && (
          <span>
            {cost.exchange_count} обмен.
            {cost.remaining_exchanges !== undefined && cost.remaining_exchanges !== null && (
              <> / {cost.remaining_exchanges + cost.exchange_count} макс.</>
            )}
          </span>
        )}
      </div>

      {/* Per-agent costs */}
      {cost.cost_by_agent && Object.keys(cost.cost_by_agent).length > 0 && (
        <div className="mt-2 space-y-1">
          {Object.entries(cost.cost_by_agent).map(([name, agentCost]) => (
            <div key={name} className="flex items-center justify-between">
              <span className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>
                {name}
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                ${(agentCost as number).toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
