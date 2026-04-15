/**
 * MobileDrawer — slide-from-left overlay for the sidebar on mobile.
 * Wraps SidebarV2 when activated from BottomNav "История" tab.
 */
import { motion, AnimatePresence } from "motion/react";
import { ReactNode, useEffect } from "react";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: "left" | "right";
  width?: string;
}

export function MobileDrawer({ open, onClose, children, side = "left", width = "85vw" }: MobileDrawerProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: side === "left" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "left" ? "-100%" : "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              const dx = info.offset.x;
              const vx = info.velocity.x;
              if ((side === "left" && (dx < -80 || vx < -500)) ||
                  (side === "right" && (dx > 80 || vx > 500))) {
                onClose();
              }
            }}
            className="fixed top-0 bottom-0 z-50 overflow-y-auto"
            style={{
              [side]: 0,
              width,
              maxWidth: "360px",
              backgroundColor: "var(--bg-base)",
              borderRight: side === "left" ? "1px solid var(--border-default)" : undefined,
              borderLeft: side === "right" ? "1px solid var(--border-default)" : undefined,
              paddingTop: "var(--safe-top)",
              paddingBottom: "var(--safe-bottom)",
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
