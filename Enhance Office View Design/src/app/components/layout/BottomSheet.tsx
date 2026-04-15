/**
 * BottomSheet — slide-up modal for mobile (iOS-style sheet).
 * Drag-to-dismiss, snap points, backdrop blur, safe-area aware.
 */
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { ReactNode, useEffect } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxHeight?: string; // CSS value, default 90vh
}

export function BottomSheet({ open, onClose, children, title, maxHeight = "90vh" }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderTop: "1px solid var(--border-default)",
              maxHeight,
              paddingBottom: "var(--safe-bottom)",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-default)" }} />
            </div>
            {title && (
              <div
                className="px-5 py-3 flex-shrink-0"
                style={{ borderBottom: "1px solid var(--border-default)" }}
              >
                <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h3>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
