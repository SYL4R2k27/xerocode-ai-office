import { useEffect } from "react";

interface ShortcutActions {
  onNewGoal?: () => void;
  onToggleSidebar?: () => void;
  onToggleContextPanel?: () => void;
  onCloseModal?: () => void;
  onFocusInput?: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "n") {
        e.preventDefault();
        actions.onNewGoal?.();
      }
      if (ctrl && e.key === "b") {
        e.preventDefault();
        actions.onToggleSidebar?.();
      }
      if (ctrl && e.key === "j") {
        e.preventDefault();
        actions.onToggleContextPanel?.();
      }
      if (e.key === "Escape") {
        actions.onCloseModal?.();
      }
      if (ctrl && e.key === "/") {
        e.preventDefault();
        actions.onFocusInput?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [actions]);
}
