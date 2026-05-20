# Nutri Web

A single-user Next.js 16 dashboard for tracking nutrition alongside the Telegram bot. Shares the same Postgres `nutri` schema.

## Features

- **Dashboard** — today's kcal vs target, per-meal progress cards, 7-day bar chart, streak badge
- **Meals** — list with date/type filters, inline item editor with ingredient autocomplete, delete with confirmation
- **Ingredients** — searchable table with inline edit, new ingredient form, alias management
- **Objetivos** — edit `meal_goals` per meal type with history timeline
- **Análises** — 30-day heatmap, stacked bar chart by meal, top 10 ingredients by frequency and kcal

## Setup

```bash
cp .env.example .env.local
# edit .env.local with real values
npm install
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgres://nutri_web:pass@host:5432/nutri` |
| `AUTH_USER` | Login username |
| `AUTH_PASSWORD` | Login password |
| `SESSION_SECRET` | Random string ≥ 32 chars for iron-session |
| `TZ` | `Europe/Lisbon` (recommended) |

### Database user

Create a dedicated DB user with DML-only access:

```sql
CREATE USER nutri_web WITH PASSWORD 'your_password';
GRANT USAGE ON SCHEMA nutri TO nutri_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA nutri TO nutri_web;
ALTER DEFAULT PRIVILEGES IN SCHEMA nutri GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nutri_web;
```

## Docker deployment

```bash
# build and start next to n8n
docker compose up -d --build nutri-web
```

`docker-compose.yml` fragment:

```yaml
services:
  nutri-web:
    build: ./web
    env_file: ./web/.env
    networks: [n8n_default]
    restart: unless-stopped
    labels:
      caddy: nutri.joaodomingos.com
      caddy.reverse_proxy: "{{upstreams 3000}}"
```

## Tech stack

- **Next.js 16** (App Router, React Server Components, Server Actions)
- **Tailwind CSS** + **shadcn/ui** + **lucide-react**
- **Recharts** for charts
- **Drizzle ORM** + **node-postgres** (read schema only, no migrations)
- **iron-session** for encrypted cookie auth
- **zod** for validation
- **date-fns** for date math
