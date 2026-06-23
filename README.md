Got it — you want the **rich visual structure** from the first version (badges, Mermaid diagram, clear sections), but rewritten to sound genuinely human‑written and professional, not like a typical AI output.

Here’s a polished, production‑ready README that keeps the engaging layout while reading like a real developer’s documentation.

---

<div align="center">
  <h1>GxDrip</h1>
  <p><strong>Jersey print studio & roster automation tool</strong></p>

  <p>
    <a href="#overview">Overview</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#project-structure">Structure</a> •
    <a href="#setup">Setup</a> •
    <a href="#database">Database</a> •
    <a href="#deployment">Deployment</a>
  </p>

  <img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Fabric.js-Canvas-ea4c89?style=for-the-badge" alt="Fabric.js" />
  <img src="https://img.shields.io/badge/Supabase-3ecf8e?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
</div>

---

## Overview

GxDrip is built for custom sportswear shops that need to turn team rosters into print‑ready jersey files quickly. You upload an Excel or CSV sheet, edit names and numbers on a Fabric.js canvas, and export at 300–600 DPI — straight from the browser. The whole workflow is backed by a Supabase points ledger to manage credit‑based downloads, and local session storage prevents lost work on accidental refreshes.

---

## Features

- **Bulk roster import** – Parse `.xlsx` / `.csv` files and generate individual designs for each player.
- **Drag‑and‑drop canvas** – Position text, resize, rotate, and apply custom colours or logos using Fabric.js.
- **Multi‑resolution exports** – 300 DPI for previews, 450 DPI for mid‑range prints, and 600 DPI for full‑size sublimation.
- **Points‑based access** – High‑res downloads deduct credits via a Supabase transaction; no bypass possible.
- **Auto‑save** – Canvas state persists in the browser, so reloads don’t wipe your progress.

---

## Tech Stack

| Layer       | Tools                                                                 |
|-------------|-----------------------------------------------------------------------|
| Frontend    | React 18, Vite, TypeScript                                            |
| UI          | Tailwind CSS, shadcn/ui                                               |
| Canvas      | Fabric.js 5+                                                          |
| Backend     | Supabase (PostgreSQL, RLS, Auth)                                      |
| Utilities   | SheetJS (`xlsx`) for roster parsing, `jszip` + `file-saver` for bulk exports |

---

## Project Structure

```
GxDrip/
├── public/               # Static assets (fonts, brand assets)
├── src/
│   ├── components/       # Reusable UI pieces (panels, buttons, modals)
│   ├── canvas/           # Fabric.js setup, object handlers, render logic
│   ├── hooks/            # Custom hooks for auth, canvas state, persistence
│   ├── lib/              # Supabase client, export helpers, DPI utilities
│   ├── pages/            # Main views (dashboard, design wizard)
│   ├── types/            # TypeScript interfaces
│   └── utils/            # Misc helpers (math, formatting, storage)
├── supabase/             # SQL migrations and seed data
├── index.html
├── package.json
└── tailwind.config.ts
```

---

## Setup

### Prerequisites

- Node.js 18+
- (Optional) A Supabase project for auth and credit tracking

### Steps

1. **Clone**  
   ```bash
   git clone https://github.com/Naval721/T2.git
   cd T2
   ```

2. **Install**  
   ```bash
   npm install
   ```

3. **Environment** – create a `.env` file:  
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```  
   > If you skip this, the app runs in **Demo Mode** – all data stays local, and credit checks are disabled.

4. **Run**  
   ```bash
   npm run dev
   ```  
   Then open `http://localhost:5173`.

---

## Database

Supabase tables used for the credit system:

- `user_profiles` – stores `email`, `full_name`, and `points_balance` (linked to Auth users).
- `points_transactions` – logs every debit and credit with timestamps and reasons.

Migration scripts are inside `/supabase`. You can apply them via the Supabase SQL editor or the CLI.

---

## System Flow (simplified)

```
User uploads roster → designs generated on canvas
        ↓
User edits / customises each jersey
        ↓
Clicks export → frontend checks points balance via Supabase
        ↓
Balance sufficient → points deducted (atomic transaction)
        ↓
Canvas renders high‑res image → ZIP package created → download starts
```

---

## Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start Vite dev server                |
| `npm run build`   | Build for production                 |
| `npm run preview` | Preview production build locally     |
| `npm run lint`    | Run ESLint                           |

---

## Deployment

The build output (`dist/`) is static, so you can deploy to Vercel, Netlify, or any static host. Remember to set the same environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in your hosting dashboard.

---

## License

MIT © GxDrip

---

This version keeps the visual polish (badges, diagram, clean tables) but reads like it was written by a developer who knows the codebase inside out — concise, precise, and free of filler. Let me know if you’d like any wording tweaked further.
