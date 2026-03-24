import { motion } from "motion/react";

type Status = "idle" | "thinking" | "working" | "error" | "completed";

const statusColors: Record<Status, string> = {
  idle: "#6E6E73",
  thinking: "#D4A054",
  working: "#5E9ED6",
  completed: "#5ABFAD",
  error: "#D46A6A",
};

interface StatusDotProps {
  status: Status;
  size?: number;
}

export function StatusDot({ status, size = 8 }: StatusDotProps) {
  const color = statusColors[status] || statusColors.idle;
  const isPulsing = status === "thinking" || status === "working";

  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {isPulsing && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <span
        className="relative inline-block rounded-full"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    </span>
  );
}
