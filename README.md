<div align="center">

<br />

<h1>
  <img src="https://img.shields.io/badge/GxDrip-Studio-000000?style=for-the-badge&logoColor=white" height="42" alt="GxDrip" />
</h1>

<p><strong>Professional jersey design & roster automation — from spreadsheet to sublimation-ready file, in one browser session.</strong></p>

<br />

<p>
  <a href="#-overview">Overview</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-project-structure">Structure</a> ·
  <a href="#-database">Database</a> ·
  <a href="#-local-development">Setup</a> ·
  <a href="#-deployment">Deployment</a>
</p>

<br />

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Fabric.js-7-EA4C89?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<br />

</div>

---

## 🎯 Overview

**GxDrip** is a browser-based jersey print studio built for custom sportswear shops that process team rosters at scale. The workflow is deliberately linear:

1. **Upload** — Drop jersey images (front, back, left sleeve, right sleeve, collar) and import a `.xlsx` / `.csv` player roster.
2. **Canvas** — Each player's name and number are automatically placed on a live Fabric.js canvas at the correct DPI.
3. **Customize** — Drag, resize, recolor text; drop in logos; switch jersey views; toggle cutting guides.
4. **Preview** — A unified grid renders every player's front + back side-by-side for a final proof.
5. **Export** — Download individual PNGs or a bulk ZIP at 300 / 450 / 600 DPI — gated behind a points ledger stored in Supabase.

No Photoshop. No round-trips to a server. Everything renders client-side on the Fabric.js canvas and exports at print resolution instantly.

---

## ✨ Features

### 🗂 Roster Automation
- Parse `.xlsx` and `.csv` files via **SheetJS** — columns: `playerName`, `jerseyNumber`, `size`, `position`, `teamName`, `customTag`
- Bulk-generate individual canvas designs for an entire squad in one step
- Per-player size scaling — jersey silhouette auto-scales to `XS → 5XL` using a DPI-aware multiplier table

### 🎨 Canvas Design Engine (Fabric.js 7)
- Multi-view canvas: **Front · Back · Left Sleeve · Right Sleeve · Collar**
- Persistent DOM portal trick — `DesignCanvas` is mounted once and teleported between step containers via `createPortal`, preventing canvas teardown when navigating steps
- Global template system — text/logo positions propagate to **all players** automatically; per-player overrides stored separately in IndexedDB
- Debounced state persistence — canvas object coordinates serialised and saved via **localforage** (IndexedDB) at 300 ms intervals; no data lost on refresh
- Cutting outline mode — toggleable black stroke around jersey silhouette for sublimation cutting guides
- Race-condition safe view switching — load token system ensures stale async loads from previous view switches are discarded

### 🖼 Typography & Fonts
- **90+ Google Fonts** purpose-built for sportswear, organised into categories:
  - `Pro Jersey` · `Ultra Condensed` · `Outlined / Hollow` · `Classic` · `Bold & Impact`
  - `Collegiate` · `Modern / Futuristic` · `Display` · `International` · `Hand-Drawn`
- Auto-fit text — long names auto-scale to fill the name bar without overflow
- Full control: font size, family, fill colour, stroke colour, stroke width, text alignment, rotation, scale

### 📦 Export Engine
| Mode | DPI | Points Cost |
|---|---|---|
| Front only | 450 DPI | 1 pt |
| Back only | 450 DPI | 1 pt |
| Per sleeve | 450 DPI | 1 pt each |
| Collar | 450 DPI | 1 pt |
| Full Jersey (F+B+2S) | 450 DPI | 4 pts |
| Full Jersey + Collar | 450 DPI | 5 pts |

- Exports are computed client-side using `canvas.toDataURL()` with a pixel multiplier derived from actual content bounding box and target DPI
- Bulk export all players → **JSZip** → single `.zip` download via **file-saver**
- Source maps **disabled** in production; chunk names are hashed to prevent reverse-engineering

### 🔐 Auth & Credits System
- **Supabase Auth** — email/password, OTP sign-in, session auto-refresh, JWT via `@supabase/supabase-js`
- Supabase Auth UI React — drop-in sign-in / sign-up forms
- **Points ledger** — every high-res export atomically deducts credits via a PostgreSQL stored procedure (`deduct_points_from_user`), preventing race conditions
- 5-point free trial automatically granted on signup via DB trigger
- Rate limiting frozen in a `const` object — console tampering cannot relax limits
- Row-Level Security on all tables — users can only read/write their own rows

### 💾 Session Persistence
- Full session auto-saved to **IndexedDB (localforage)** — jersey images (as data URLs), player roster, current step, selected player, canvas view, zoom level, cutting outline state
- Warm-return detection — if the user navigates back within the same browser session, the previous state is silently restored without a dialog
- Cold-start restore dialog prompts the user to continue or start fresh

### 🛡 Security Headers (Vercel)
- `Content-Security-Policy` — allowlists only self + Google Fonts + Supabase endpoints
- `Strict-Transport-Security` — HSTS with `preload`
- `X-Frame-Options: DENY`, `X-XSS-Protection`, `X-Content-Type-Options`
- `Permissions-Policy` — camera, microphone, geolocation all blocked
- Assets cached with `Cache-Control: public, max-age=31536000, immutable`

---

## 🧰 Tech Stack

### Frontend Runtime
| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | **React** | 19.x | Component model, concurrent rendering |
| Language | **TypeScript** | 5.9 | End-to-end type safety |
| Build Tool | **Vite** | 7.x | Dev server, HMR, ESM bundling |
| Compiler | **@vitejs/plugin-react-swc** | 4.x | SWC-based fast JSX transform |
| Routing | **React Router DOM** | 7.x | Client-side SPA routing |
| Server State | **TanStack React Query** | 5.x | Auth state caching, stale-while-revalidate |

### UI & Styling
| Layer | Technology | Purpose |
|---|---|---|
| CSS Framework | **Tailwind CSS** | 3.x utility classes |
| Component Library | **shadcn/ui** | Radix UI primitives + CVA variants |
| Primitive Layer | **Radix UI** | 25+ accessible, headless components |
| Icons | **Lucide React** | 575+ SVG icons, tree-shakeable |
| Animations | **tailwindcss-animate** | Keyframe utilities |
| Variant Engine | **class-variance-authority** | Type-safe component variants |
| Class Merger | **tailwind-merge + clsx** | Conflict-free class composition |
| Toast Notifications | **Sonner** | Opinionated toast stack |
| Carousel | **Embla Carousel React** | Touch-friendly sliders |
| Drawer | **Vaul** | Sheet/drawer primitives |
| Theme | **next-themes** | Dark/light mode without flash |

### Canvas & Design
| Technology | Version | Purpose |
|---|---|---|
| **Fabric.js** | 7.x | Full canvas engine — objects, transforms, export |
| **browser-image-compression** | 2.x | Client-side image optimisation before upload |
| **localforage** | 1.x | IndexedDB wrapper for canvas state persistence |

### Data & File Handling
| Technology | Purpose |
|---|---|
| **SheetJS (xlsx)** | Parse `.xlsx` / `.csv` roster files |
| **JSZip** | Assemble multi-file ZIP exports in-browser |
| **file-saver** | Trigger browser download of ZIP / PNG |
| **date-fns** | Date formatting for save timestamps |

### Forms & Validation
| Technology | Purpose |
|---|---|
| **React Hook Form** | Performant uncontrolled form management |
| **Zod** | Schema validation, TypeScript-first |
| **@hookform/resolvers** | Zod ↔ React Hook Form bridge |

### Backend & Database
| Layer | Technology | Purpose |
|---|---|---|
| BaaS | **Supabase** | Hosted PostgreSQL + Auth + RLS |
| Client SDK | **@supabase/supabase-js** | 2.x — typed DB queries, realtime, auth |
| Auth UI | **@supabase/auth-ui-react** | Pre-built sign-in/sign-up components |
| Database | **PostgreSQL** (via Supabase) | `user_profiles`, `points_transactions`, `points_packages`, `design_projects` |
| Security | **Row-Level Security** | Every table scoped to `auth.uid()` |
| Stored Procedures | **PL/pgSQL** | Atomic point deduction (`deduct_points_from_user`), signup trigger (`handle_new_user`) |

### Deployment & DevOps
| Technology | Purpose |
|---|---|
| **Vercel** | CDN hosting, edge config, security headers |
| **Bun** | Package manager (lockfile present) |
| **npm** | Fallback package manager |
| **ESLint 9** | Flat config linting with `typescript-eslint` |
| **PostCSS + Autoprefixer** | CSS vendor-prefixing pipeline |

---

## 🏗 Architecture

```
Browser Session
│
├── React 19 + TanStack Query  ←── global state: auth, points
│   │
│   ├── BrowserRouter (React Router 7)
│   │   ├── /           OnboardingPage → HomePage → AuthModal
│   │   ├── /design     Index (5-step wizard)
│   │   │   ├── Step 1  JerseyUpload + PlayerDataUpload
│   │   │   ├── Step 2  Canvas preview (read-only)
│   │   │   ├── Step 3  CustomizationTools + DesignCanvas (edit)
│   │   │   ├── Step 4  Step4Preview (bulk grid, read-only)
│   │   │   └── Step 5  ExportPanel → deductPoints() → ZIP download
│   │   ├── /pricing    Pricing
│   │   └── /contact    Contact
│   │
│   └── DesignCanvas (Fabric.js)  ←── single instance, portal-mounted
│       ├── globalTemplate (textRef) — positions for all players
│       ├── playerElements (localforage) — per-player logo overrides
│       └── exportCleanJerseyDesign() — toDataURL at target DPI
│
├── localforage (IndexedDB)
│   ├── jerseyDesigner:session    — full session snapshot
│   ├── jerseyDesigner:globalTemplate  — font/position template
│   └── jerseyDesigner:playerElements_<name>_<number>  — per-player
│
└── Supabase (remote)
    ├── Auth — JWT session, OTP, auto-refresh
    ├── user_profiles — points_balance, totals
    ├── points_transactions — full audit log
    └── points_packages — pricing catalogue
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Single canvas instance + portal** | Fabric.js canvas teardown is expensive and lossy. Mounting once into a stable `div` and teleporting it via `createPortal` avoids re-initialisation on every step switch. |
| **Global template, per-player overrides** | One set of text/logo positions covers the whole squad. Individual players can deviate without breaking the global layout. |
| **IndexedDB over localStorage** | Player logo images (data URLs) can easily exceed the 5 MB localStorage quota. IndexedDB handles 50–100 MB without issue. |
| **Atomic SQL for point deduction** | Server-side `deduct_points_from_user()` reads and updates in a single transaction — no double-spend race condition possible from the client. |
| **Client-side export** | Zero server load; the canvas renders at pixel-exact DPI directly in the browser using Fabric's `toDataURL` multiplier. |
| **Hashed chunk filenames** | Strips readable module paths from the production bundle, preventing source enumeration. |

---

## 📁 Project Structure

```
GxStudioStitch-main/
│
├── public/                        # Static assets served as-is
│
├── src/
│   ├── assets/                    # Hero images, brand assets
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthModal.tsx      # Sign-in / sign-up dialog
│   │   │   └── UserDashboard.tsx  # Points balance, settings, sign-out
│   │   ├── points/
│   │   │   └── PointsPurchase.tsx # Package selection UI
│   │   ├── ui/                    # shadcn/ui generated components
│   │   ├── DesignCanvas.tsx       # ★ Core Fabric.js canvas (1500+ lines)
│   │   ├── CustomizationTools.tsx # Font, colour, stroke controls
│   │   ├── ExportPanel.tsx        # DPI selection, ZIP export
│   │   ├── FontSelector.tsx       # 90+ sports fonts, categorised
│   │   ├── PlayerDataUpload.tsx   # xlsx/csv drag-drop parser
│   │   ├── JerseyUpload.tsx       # Multi-view image uploader
│   │   ├── StepNavigation.tsx     # Progress stepper
│   │   ├── Header.tsx             # Top nav + auth state
│   │   ├── Footer.tsx             # Legal links
│   │   └── ErrorBoundary.tsx      # React error boundary
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx            # Auth context: sign-in, sign-up, points ops
│   │   ├── use-toast.ts           # Toast hook (shadcn)
│   │   └── use-mobile.tsx         # Breakpoint detection
│   │
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client + DB typings
│   │   ├── fonts.ts               # JERSEY_FONTS catalogue (90+ entries)
│   │   ├── sizes.ts               # DPI multiplier + size-to-pixel table
│   │   ├── textFit.ts             # Auto-fit text-to-width algorithm
│   │   ├── statePersistence.ts    # localforage session read/write
│   │   ├── logger.ts              # Dev-only console wrapper
│   │   └── lazy.ts                # lazyWithRetry — chunk-fail auto-reload
│   │
│   ├── pages/
│   │   ├── Index.tsx              # ★ 5-step wizard orchestrator
│   │   ├── OnboardingPage.tsx     # Auth flow + onboarding wizard
│   │   ├── HomePage.tsx           # Landing / marketing page
│   │   ├── Pricing.tsx            # Points packages page
│   │   ├── Contact.tsx            # Contact form
│   │   ├── Privacy.tsx            # Privacy policy
│   │   ├── Terms.tsx              # Terms of service
│   │   ├── Refund.tsx             # Refund policy
│   │   ├── Shipping.tsx           # Shipping policy
│   │   ├── NotFound.tsx           # 404
│   │   └── steps/
│   │       ├── Step1Upload.tsx    # Jersey images + player data upload
│   │       ├── Step2Canvas.tsx    # Read-only canvas preview
│   │       ├── Step3Customize.tsx # Design tools + live canvas
│   │       ├── Step4Preview.tsx   # Bulk preview grid
│   │       └── Step5Export.tsx    # Export + points deduction
│   │
│   ├── types/
│   │   └── points.ts              # Points formatting helpers
│   │
│   ├── utils/
│   │   ├── playerIdentity.ts      # Player label placement utility
│   │   └── debug.ts               # Env var check on mount
│   │
│   ├── App.tsx                    # Root: providers + router
│   ├── main.tsx                   # Vite entry point
│   └── index.css                  # Tailwind directives + global tokens
│
├── supabase/
│   ├── supabase-schema-points.sql       # Points system tables + RLS
│   ├── supabase-schema-otp.sql          # OTP auth setup
│   ├── supabase-schema-points-update.sql # Schema migrations
│   ├── supabase-fix-rls.sql             # RLS policy corrections
│   ├── supabase-fix-signup.sql          # Signup trigger fix
│   └── supabase-fix-lints.sql           # SQL lint fixes
│
├── .env.example                   # Environment variable template
├── .gitignore
├── .vercelignore
├── vercel.json                    # Rewrites, security headers, caching
├── vite.config.ts                 # Build config, vendor chunks, esbuild
├── tailwind.config.ts             # Design tokens, custom animations
├── tsconfig.json
├── components.json                # shadcn/ui config
├── eslint.config.js               # ESLint 9 flat config
├── package.json
└── bun.lockb
```

---

## 🗄 Database

All tables live in Supabase (PostgreSQL). Row-Level Security is enabled on every table.

### Tables

```sql
-- Core user record, linked 1-to-1 with Supabase Auth
user_profiles (
  id                    UUID  PRIMARY KEY,   -- mirrors auth.users.id
  email                 TEXT,
  full_name             TEXT,
  points_balance        INTEGER DEFAULT 0,
  total_points_purchased INTEGER DEFAULT 0,
  total_points_used     INTEGER DEFAULT 0,
  last_points_update    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ
)

-- Immutable audit log of every credit movement
points_transactions (
  id               UUID   PRIMARY KEY,
  user_id          UUID   REFERENCES user_profiles(id),
  transaction_type TEXT   CHECK (IN ('purchase','usage','refund','bonus')),
  points_amount    INTEGER,   -- positive = credit, negative = debit
  description      TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ
)

-- Product catalogue for the points shop
points_packages (
  id            UUID   PRIMARY KEY,
  package_id    TEXT   UNIQUE,  -- 'basic' | 'professional' | 'enterprise'
  name          TEXT,
  price         DECIMAL(10,2),
  points        INTEGER,
  bonus_points  INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE
)
```

### Key Stored Procedures

```sql
-- Atomically deducts points; returns FALSE if balance is insufficient
public.deduct_points_from_user(user_uuid, points_to_deduct, description, metadata)

-- Credits points and logs the transaction
public.add_points_to_user(user_uuid, points_to_add, description, metadata)

-- Auto-creates a user_profiles row on every new Auth signup
public.handle_new_user()  -- TRIGGER on auth.users INSERT
```

### Running Migrations

Apply SQL files in this order using the Supabase SQL editor or CLI:

```bash
1. supabase-schema-points.sql
2. supabase-schema-otp.sql
3. supabase-schema-points-update.sql
4. supabase-fix-rls.sql
5. supabase-fix-signup.sql
6. supabase-fix-lints.sql
```

---

## 🖥 Local Development

### Prerequisites

- Node.js ≥ 20 or Bun ≥ 1.x
- A Supabase project (free tier works)

### 1 — Clone & install

```bash
git clone https://github.com/Naval721/T2.git
cd GxStudioStitch-main
npm install
# or
bun install
```

### 2 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Note:** If these are missing, the app runs in demo mode — auth operations are no-ops and points are not enforced.

### 3 — Apply database migrations

Paste each file from `/supabase/` into your Supabase SQL editor in the order listed above.

### 4 — Start dev server

```bash
npm run dev
# → http://localhost:8080
```

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 8080 |
| `npm run build` | Production bundle (minified, hashed, no source maps) |
| `npm run build:dev` | Development bundle (source maps, readable names) |
| `npm run preview` | Serve the `/dist` folder locally |
| `npm run lint` | ESLint 9 with TypeScript rules |
| `npm run deploy` | `vercel --prod` direct deploy |
| `npm run predeploy` | Runs `check-deployment` + `build` before deploy |
| `npm run check-deployment` | Pre-flight environment check script |

---

## 🚀 Deployment

The project is configured for **zero-configuration Vercel deployment**.

### Vercel (recommended)

```bash
npm run deploy
```

`vercel.json` configures:
- SPA rewrite: all routes → `/index.html`
- Asset caching: `Cache-Control: public, max-age=31536000, immutable`
- Full security header suite (CSP, HSTS, X-Frame-Options, etc.)

### Manual (any static host)

```bash
npm run build
# upload the /dist folder to your host
# configure your host to serve index.html for all 404s
```

---

## 🔒 Security Notes

| Concern | Implementation |
|---|---|
| **No source maps in production** | `sourcemap: false` in `vite.config.ts` |
| **Hashed chunk names** | `chunkFileNames: 'assets/[hash:12].js'` — no readable module paths |
| **CSP header** | Allowlists only self, Google Fonts, Supabase, no `eval` |
| **Rate limiting** | `SECURITY_CONFIG` frozen object — 60 API calls/minute, immutable at runtime |
| **Points deduction** | Server-side PL/pgSQL — client cannot manipulate balance |
| **RLS on all tables** | Every row is scoped to `auth.uid()` |
| **Session timeout** | 24 h hard limit in `SECURITY_CONFIG` |

---

## 🗺 System Flow

```
User uploads roster (.xlsx / .csv)
         │
         ▼
SheetJS parses → PlayerData[] array
         │
         ▼
JerseyImages uploaded (front/back/sleeves/collar)
         │
         ▼
DesignCanvas initialised (Fabric.js, 960×720px)
         │
    ┌────┴────┐
    │ Per-player loop
    │  • Jersey image loaded at size-proportional DPI scale
    │  • Name text placed (auto-fit to width)
    │  • Jersey number placed
    │  • Custom logos applied from global template
    └────┬────┘
         │
         ▼
User customises (drag, resize, recolor, add logos)
  → canvas state debounce-saved to IndexedDB every 300 ms
         │
         ▼
Step 4 Preview: all players rendered in grid
         │
         ▼
Step 5 Export:
  • Auth check → Supabase reads points_balance
  • Points sufficient?
      YES → deduct_points_from_user() (atomic SQL)
           → canvas.toDataURL() at target DPI multiplier
           → JSZip → file-saver → browser download
      NO  → redirect to purchase flow
```

---

## 📄 License

MIT © GxDrip — see [LICENSE](./LICENSE)

---

<div align="center">
  <p>Built with ❤️ for sportswear shops that move fast.</p>
  <p>
    <a href="https://github.com/Naval721/T2/issues">Report a Bug</a> ·
    <a href="https://github.com/Naval721/T2/issues">Request a Feature</a>
  </p>
</div>
