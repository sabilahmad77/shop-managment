# Shaahi Biryani POS — Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/shaahi_pos"
NEXTAUTH_SECRET="generate-a-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="same-as-nextauth-secret"
```

To generate a secure secret:
```bash
openssl rand -base64 32
```

---

## 3. Setup Database

Create the database in PostgreSQL:

```sql
CREATE DATABASE shaahi_pos;
```

Then run Prisma migrations:

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to DB
npm run db:seed        # Seed with sample data
```

---

## 4. Run the App

```bash
npm run dev
```

Visit http://localhost:3000

---

## Default Credentials

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@shaahi.com    | admin123  |
| Staff | staff@shaahi.com    | staff123  |

**Change these immediately in production!**

---

## Production Deployment

### Option A: Vercel + Supabase (Recommended)

1. Push code to GitHub
2. Create a project on [Vercel](https://vercel.com)
3. Create a database on [Supabase](https://supabase.com) — get the connection string
4. Set environment variables in Vercel dashboard
5. Deploy

### Option B: VPS (e.g. DigitalOcean, Hetzner)

```bash
npm run build
npm run start
```

Use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "shaahi-pos" -- start
pm2 save
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # Protected pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── sales/             # Daily sales entry ⭐
│   │   ├── categories/        # Category management
│   │   ├── items/             # Item management
│   │   ├── reports/           # Analytics & reports
│   │   └── settings/          # App settings
│   └── api/                   # API routes
│       ├── auth/              # NextAuth
│       ├── categories/        # CRUD
│       ├── items/             # CRUD
│       ├── sales/             # Sales entries
│       ├── dashboard/         # Dashboard stats
│       ├── reports/           # Report generation
│       └── settings/          # Settings CRUD
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # Sidebar, Header
│   └── SessionProvider.tsx
├── lib/
│   ├── prisma.ts              # DB client
│   ├── auth.ts                # NextAuth config
│   ├── utils.ts               # Helpers
│   └── validators.ts          # Zod schemas
└── types/index.ts             # TypeScript types
```

---

## Key Features

- **Daily Sales Entry** — Monthly accordion view, per-day item entry, auto-calculation
- **Real-time Totals** — Qty × Price = Amount, Day total, Month total
- **Dashboard** — Today's sales, monthly stats, charts, quick actions
- **Reports** — Daily/Category/Item breakdowns with charts, CSV export
- **Category & Item Management** — Full CRUD with color coding
- **Dark/Light Mode** — Toggle in header
- **Role-based Access** — Admin vs Staff
- **Mobile Responsive** — Works on all screen sizes

---

## Adding More Categories/Items

Log in as Admin → go to Categories or Items → click "Add".

---

## Troubleshooting

**Prisma errors:** Run `npm run db:generate` then `npm run db:push`

**Auth errors:** Make sure `NEXTAUTH_SECRET` and `AUTH_SECRET` are set and match

**Port in use:** Change port with `npm run dev -- -p 3001`
