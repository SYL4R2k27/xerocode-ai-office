---
name: xerocode-stack
description: "XeroCode AI Office tech stack, patterns, and conventions. React 19 + TypeScript + Vite 6 + Tailwind 4 + motion/react + lucide-react. CSS variables theming (dark/light). FastAPI + SQLAlchemy async + PostgreSQL. Use this for all frontend development in this project."
---

# XeroCode Stack — Project Conventions

## Tech Stack

### Frontend
- **React 19** + TypeScript (strict)
- **Vite 6** (build + dev server)
- **Tailwind CSS 4** (utility-first, JIT)
- **motion/react** (Framer Motion v12) — all animations
- **lucide-react** — icons (NEVER use emoji as icons)
- **CSS Variables** — theming via `var(--name)`, NOT hardcoded colors
- **react-markdown** + **react-syntax-highlighter** — message rendering
- **sonner** — toast notifications
- **recharts** — data visualization

### Backend
- **FastAPI** + async
- **SQLAlchemy** async + PostgreSQL 16 + pgvector
- **httpx** — async HTTP client (all external API calls)
- **Fernet** — encryption for API keys

### Infrastructure
- Nginx + Gunicorn + Uvicorn
- EU SOCKS5 proxy for all external API calls
- WebSocket for real-time updates

## File Structure

```
src/app/
├── components/
│   ├── chat/          # V2 chat components (ChatAreaV2, ChatInputV2, ChatMessageV2, TeamBar, TaskPlanPanel, EmptyState)
│   ├── corporate/     # Corporate modules (CRM, Kanban, HR, Calendar, etc.)
│   ├── layout/        # SidebarV2, ContextPanel
│   ├── modals/        # ModelSetupV2, ProfileSettings, PricingPage
│   ├── arena/         # ArenaView
│   ├── landing/       # Landing pages
│   ├── auth/          # AuthPage
│   ├── mobile/        # MobileLayout
│   ├── shared/        # Shared components (Logo, StatusDot, etc.)
│   └── ui/            # Radix UI primitives
├── hooks/             # useWebSocket, useTheme, useTranslation, useKeyboardShortcuts
├── store/             # useStore (agents, goals, tasks, messages, status), useAuthStore
├── lib/               # api.ts (API client, types)
└── styles/            # theme.css (CSS variables)
```

## Styling Rules (CRITICAL)

### NEVER do:
- Hardcode colors: `color: "#3B82F6"` → use `color: "var(--accent-blue)"`
- Use inline hex: `bg-[#0f0f11]` → use `bg-[var(--bg-base)]`
- Use emoji as icons: `🔍` → use `<Search size={16} />`
- Use `px` for spacing without system: use `var(--space-2)` etc.
- Use `dangerouslySetInnerHTML`
- Use `eval()` or `Function()`

### ALWAYS do:
- Use CSS variables from theme.css for ALL colors
- Use `motion/react` for animations (AnimatePresence, motion.div)
- Use `lucide-react` for icons
- Export named functions: `export function ComponentName()`
- Use TypeScript interfaces for props
- Use `useCallback` for handlers passed to children
- Use `var(--font-size-base)` for typography

### CSS Variables (from theme.css)
```css
/* Backgrounds */
--bg-base, --bg-surface, --bg-elevated

/* Text */
--text-primary, --text-secondary, --text-tertiary

/* Borders */
--border-default, --border-subtle

/* Accents */
--accent-blue, --accent-teal, --accent-amber, --accent-rose,
--accent-lavender, --accent-green, --accent-arena

/* Typography */
--font-size-xs (11px), --font-size-sm (13px), --font-size-base (15px),
--font-size-md (16px), --font-size-lg (18px), --font-size-xl (22px)

/* Spacing */
--space-1 (4px), --space-2 (8px), --space-3 (12px), --space-4 (16px),
--space-6 (24px), --space-8 (32px)

/* Chat */
--chat-max-width (720px), --sidebar-width (260px)
```

### Provider Colors
```css
--provider-openai (#10a37f), --provider-anthropic (#d4a27f),
--provider-google (#4285f4), --provider-groq (#f97316),
--provider-xai (#1da1f2), --provider-deepseek (#4f46e5),
--provider-meta (#0668e1), --provider-mistral (#ff7000)
```

## Animation Patterns

### Standard transitions:
```tsx
// Entry animation
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>

// Exit animation (faster)
<AnimatePresence>
  {show && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    />
  )}
</AnimatePresence>

// Hover effect
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
/>

// Layout animation (sidebar indicator)
<motion.div layoutId="nav-indicator" />
```

### Timing guidelines:
- Micro-interactions: 150-200ms
- Panel transitions: 200-300ms
- Page transitions: 200ms
- Exit < Enter (60-70% of enter duration)
- Easing: ease-out for entering, ease-in for exiting
- Stagger: 20-50ms between items

## API Pattern

### Backend calls (from components):
```typescript
const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000/api"
  : `${window.location.origin}/api`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("ai_office_token")}`,
  "Content-Type": "application/json",
});
```

### From api.ts (preferred):
```typescript
import { api } from "../../lib/api";
const data = await api.org.getMembers();
```

## Component Template

```tsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, X } from "lucide-react";

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [loading, setLoading] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <h3
        className="font-semibold"
        style={{ color: "var(--text-primary)", fontSize: "var(--font-size-base)" }}
      >
        {title}
      </h3>
    </motion.div>
  );
}
```

## Russian UI Labels
All user-facing text in Russian. Use these standard translations:
- Create → Создать
- Save → Сохранить
- Cancel → Отмена
- Delete → Удалить
- Search → Поиск
- Loading → Загрузка
- Error → Ошибка
- Settings → Настройки
