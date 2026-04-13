# XeroCode AI Office

Multi-model AI orchestration platform. React 19 + TypeScript + Vite 6 + Tailwind 4 + FastAPI + PostgreSQL.

## Skills

This project uses the following Claude Code skills:
- `xerocode-stack` — Project conventions, CSS variables, animation patterns, component templates
- `ui-ux-pro-max` — 99 UX rules, 50+ styles, accessibility, animation timing, typography
- `ui-styling` — shadcn/ui + Tailwind patterns
- `design-system` — Design tokens, spacing scales, component specs

## Rules

1. **V2 UI is default** — use V2 components (SidebarV2, ChatAreaV2, ChatInputV2, ChatMessageV2)
2. **All colors via CSS variables** — never hardcode hex values
3. **All icons from lucide-react** — never use emoji as icons
4. **All animations via motion/react** — never use raw CSS transitions for complex animations
5. **Russian UI** — all user-facing text in Russian
6. **All API calls through proxy** — `use_proxy = bool(proxy)`, never skip proxy
7. **Org isolation** — every endpoint that fetches by ID must check organization_id
8. **Token: ai_office_token** — consistent localStorage key everywhere

## Deploy

```bash
# Frontend
cd "Enhance Office View Design" && npx vite build
rsync -avz --delete dist/ vladimir@213.165.210.250:/var/www/ai-office/

# Backend
rsync -avz --exclude='.env' --exclude='.venv' --exclude='__pycache__' backend/app/ vladimir@213.165.210.250:~/ai-office/backend/app/
ssh vladimir@213.165.210.250 "sudo systemctl restart ai-office"
```

## Domain
- Production: https://xerocode.ru
- Server: 213.165.210.250 (Yandex Cloud)
