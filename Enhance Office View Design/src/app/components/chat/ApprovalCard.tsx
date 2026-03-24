import { motion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";

interface ApprovalCardProps {
  agentName: string;
  taskTitle: string;
  result: string;
  onApprove: () => void;
  onRequestChanges: () => void;
}

export function ApprovalCard({ agentName, taskTitle, result, onApprove, onRequestChanges }: ApprovalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", damping: 20 }}
      className="mx-4 my-3 rounded-xl p-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--accent-teal)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "color-mix(in srgb, var(--accent-teal) 15%, transparent)" }}
        >
          <Check size={14} style={{ color: "var(--accent-teal)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {agentName} <span style={{ color: "var(--text-secondary)" }} className="font-normal">завершил задачу</span>
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--accent-teal)" }}>
            {taskTitle}
          </p>
          {result && (
            <p className="text-[12px] mt-2 line-clamp-3" style={{ color: "var(--text-secondary)" }}>
              {result}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onApprove}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:brightness-110"
              style={{ backgroundColor: "var(--accent-teal)", color: "#fff" }}
            >
              <Check size={12} />
              Одобрить
            </button>
            <button
              onClick={onRequestChanges}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-white/5"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
            >
              <RotateCcw size={12} />
              Доработать
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
