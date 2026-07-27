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
  <a href="#-scripts">Scripts</a> ·
  <a href="#-license">License</a>
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
5. **Export** — Download individual PNGs or a bulk ZIP at 300 / 450 / 600 DPI — gated behind a credits system.

No Photoshop. No round-trips to a server. Everything renders client-side on the Fabric.js canvas and exports at print resolution instantly.

---

## ✨ Features

### 🗂 Roster Automation
- Parse `.xlsx` and `.csv` files via **SheetJS** — supports player name, number, size, position, team name, and custom tags
- Bulk-generate individual canvas designs for an entire squad in one step
- Per-player size scaling — jersey silhouette auto-scales from XS to 5XL using a DPI-aware multiplier

### 🎨 Canvas Design Engine
- Multi-view canvas: **Front · Back · Left Sleeve · Right Sleeve · Collar**
- Single persistent canvas instance — teleported between wizard steps via React portals, eliminating costly teardown/reinit cycles
- Global template system — text and logo positions propagate to **all players** automatically
- Per-player overrides saved independently in browser storage
- Cutting outline mode — toggleable stroke around the jersey silhouette for sublimation cutting guides

### 🖼 Typography & Fonts
- **90+ Google Fonts** purpose-built for sportswear, organised into categories:
  - `Pro Jersey` · `Ultra Condensed` · `Outlined / Hollow` · `Classic` · `Bold & Impact`
  - `Collegiate` · `Modern / Futuristic` · `Display` · `International` · `Hand-Drawn`
- Auto-fit text — long names shrink automatically to fill the name bar without overflow
- Full control: font size, family, fill colour, stroke colour, stroke width, alignment, rotation, and scale

### 📦 Export Engine
| Mode | DPI | Credits |
|---|---|---|
| Front only | 450 DPI | 1 pt |
| Back only | 450 DPI | 1 pt |
| Per sleeve | 450 DPI | 1 pt each |
| Collar | 450 DPI | 1 pt |
| Full Jersey (F + B + 2 Sleeves) | 450 DPI | 4 pts |
| Full Jersey + Collar | 450 DPI | 5 pts |

- All exports are rendered entirely in the browser — zero server load
- Bulk export — all players packaged into a single ZIP via **JSZip** + **file-saver**

### 🔐 Auth & Credits System
- **Supabase Auth** — email/password and OTP sign-in with JWT session management
- **Points ledger** — credits are managed server-side; every export deducts from the user's balance atomically
- 5-point free trial granted on signup — no credit card required to get started
- Credits never expire

### 💾 Session Persistence
- Full session auto-saved to **IndexedDB** — jersey images, player roster, current step, zoom level, and canvas state
- Warm-return detection — navigating back to the app silently restores the previous session
- Cold-start dialog lets users choose to continue or start fresh

---

## 🧰 Tech Stack

### Frontend Runtime
| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | **React** | 19.x | Component model, concurrent rendering |
| Language | **TypeScript** | 5.9 | End-to-end type safety |
| Build Tool | **Vite** | 7.x | Dev server, HMR, ESM bundling |
| Routing | **React Router DOM** | 7.x | Client-side SPA routing |

### UI & Styling
| Layer | Technology | Purpose |
|---|---|---|
| CSS Framework | **Tailwind CSS** | Utility-first styling |
| Component Library | **shadcn/ui** | Radix UI primitives + CVA variants |
| Primitive Layer | **Radix UI** | 25+ accessible, headless components |
| Icons | **Lucide React** | 575+ SVG icons, tree-shakeable |
| Animations | **tailwindcss-animate** | Keyframe animation utilities |
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
| Client SDK | **@supabase/supabase-js** | Typed DB queries, realtime, auth |
| Auth UI | **@supabase/auth-ui-react** | Pre-built sign-in/sign-up components |
| Database | **PostgreSQL** (via Supabase) | User profiles, points ledger, transaction log |
| Security | **Row-Level Security** | Every table scoped per authenticated user |

### Deployment & DevOps
| Technology | Purpose |
|---|---|
| **Vercel** | CDN hosting, edge network, security headers |
| **Bun** | Primary package manager |
| **npm** | Fallback package manager |
| **ESLint 9** | Flat config linting with `typescript-eslint` |
| **PostCSS + Autoprefixer** | CSS vendor-prefixing pipeline |

---

## 🏗 Architecture

```
Browser Session
│
├── React 19 + TanStack Query  ←── global state: auth, credits
│   │
│   ├── BrowserRouter (React Router 7)
│   │   ├── /           OnboardingPage → HomePage → AuthModal
│   │   ├── /design     Index (5-step wizard)
│   │   │   ├── Step 1  JerseyUpload + PlayerDataUpload
│   │   │   ├── Step 2  Canvas preview
│   │   │   ├── Step 3  CustomizationTools + DesignCanvas
│   │   │   ├── Step 4  Bulk preview grid
│   │   │   └── Step 5  ExportPanel → credits check → ZIP download
│   │   ├── /pricing    Pricing
│   │   └── /contact    Contact
│   │
│   └── DesignCanvas (Fabric.js)  ←── single instance, portal-mounted
│
├── localforage (IndexedDB)       ←── session + canvas state
│
└── Supabase (remote)             ←── auth + credits ledger
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Single canvas instance + portal** | Avoids costly Fabric.js canvas teardown on every step navigation |
| **Global template, per-player overrides** | One layout covers the full squad; individuals can deviate without breaking it |
| **IndexedDB over localStorage** | Handles large image data URLs without quota errors |
| **Server-side credit deduction** | Prevents any client-side balance manipulation |
| **Client-side export** | Zero server load; full DPI rendering happens entirely in the browser |

---

## 📁 Project Structure

```
GxStudioStitch-main/
│
├── public/                        # Static assets
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthModal.tsx      # Sign-in / sign-up dialog
│   │   │   └── UserDashboard.tsx  # Points balance, settings, sign-out
│   │   ├── points/
│   │   │   └── PointsPurchase.tsx # Package selection UI
│   │   ├── ui/                    # shadcn/ui generated components
│   │   ├── DesignCanvas.tsx       # ★ Core Fabric.js canvas
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
│   │   ├── useAuth.tsx            # Auth context
│   │   ├── use-toast.ts           # Toast hook
│   │   └── use-mobile.tsx         # Breakpoint detection
│   │
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client + DB typings
│   │   ├── fonts.ts               # JERSEY_FONTS catalogue
│   │
│   ├── pages/
│   │   ├── Index.tsx              # ★ 5-step wizard orchestrator
│   │   ├── OnboardingPage.tsx     # Auth flow
│   │   ├── HomePage.tsx           # Landing page
│   │   ├── Pricing.tsx            # Credits packages page
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
│   │       └── Step5Export.tsx    # Export + credits deduction
│   │
│   ├── types/
│   │   └── points.ts              # Credits formatting helpers
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
