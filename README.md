<div align="center">
  <h1>🎨 GxDrip - Professional Jersey Print Studio Engine</h1>
  <p>
    An enterprise-grade web application built to streamline the design, bulk-customization, and ultra-high-resolution export of sports jerseys. Built specifically for modern print & sublimation shops.
  </p>
</div>

---

## 📖 About The Project

**GxDrip** (formerly DotStitch) provides an interactive Fabric.js canvas environment and an automated points-based economy structure. It allows sports customization businesses to rapidly map player names and numbers onto high-quality templates and queue bulk exports reaching up to **600 DPI**—true print-ready files tailored for 36-inch, full-size garments.

## ✨ Core Features & Capabilities

- **⚡ Bulk Roster Processing:** Import entire team rosters (names, numbers, sizes, positions) via Excel (`.xlsx`) or `.csv` files to instantly queue hundreds of jerseys for generation.
- **🎨 Interactive Fabric Engine:** An advanced, high-performance canvas environment that allows drag-and-drop manipulation, constraint management, text rotation adjustments, and vector logo integration.
- **🖨️ Production-Ready Exports:**
  - **Standard (300 DPI):** Quick, clean exports ideal for web proofing and digital sharing.
  - **High (450 DPI):** Standard print-quality exports.
  - **Ultra (600 DPI):** True vector-mapped, oversized renders explicitly tuned for printing physical full-size garments.
- **🔒 Secure Points Economy:** A robust ledger architecture powered by **Supabase**. Exports atomically verify balances and deduct points on the backend *before* granting browser downloads, preventing interception exploits.
- **💾 Auto-Recovery Save State:** Resilient `localStorage` architecture ensures canvas states, design logic, and bulk rosters survive unexpected browser refreshes or crashes.

## 🚀 Tech Stack

- **Framework:** React 18 (TypeScript), Vite 5
- **Styling:** Tailwind CSS, Shadcn UI, Custom Vanilla CSS utilities
- **Canvas Rendering:** Fabric.js 
- **Database, Auth & Backend:** Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **Utilities:** `xlsx` (Roster processing), `jszip` (Bulk export compression), `file-saver`, `sonner` (Toast notifications)
- **Hosting:** Vercel

---

## ⚙️ Installation & Environment Setup

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A [Supabase](https://supabase.com/) project configured for Auth and Database
- Git

### Standard Setup

```bash
# Clone the repository
git clone https://github.com/Naval721/T2.git
cd T2

# Install all workspace dependencies
npm install

# Setup your Environment
cp .env.example .env
```

### Environment Variables

Edit your `.env` file and point it to your live Supabase project. If these keys are missing or invalid, the app will seamlessly fall back to a "Demo Mode" UI without database mutation capabilities.

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Running Locally

```bash
npm run dev
```

Visit `http://localhost:5173` to test the application locally. 

---

## 🗄️ Database Architecture (Supabase)

To link GxDrip to a live production database, the correct schemas must be initialized via the Supabase SQL Editor. 

### Core Tables:
1. `user_profiles`
   - Maps directly to Auth `id`.
   - Tracks dynamic balances: `email`, `full_name`, `points_balance`, `total_points_purchased`, etc.
2. `points_transactions`
   - A highly secure ledger tracking all balance mutations. Includes automated database triggers linking back to `user_profiles` on valid point insertions.

### RLS Policies
Ensure `user_profiles` uses strict `(auth.uid() = id)` filtering logic so that reads and mutations remain strongly locked to authenticated user sessions.

---

## 🛡️ Security Posture Note

All export functions (such as `ExportPanel.tsx`) enforce a **Strict Server Deduct Before Download** policy. 
Unlike standard web apps that deduct virtual currency in asynchronous or optimistic local states, **GxDrip securely pauses export loops to await Supabase transaction verification.** This guarantees that users cannot bypass point systems via memory manipulation or infinite-point UI layer exploits. 

The application logic also actively disposes chunks of Fabric.js RAM dynamically during large unmounts, protecting print-shop machines from tab crashes during extensive runs.

---

## 🗺️ Production Roadmap & Features

A major priority of current development revolves around continuing to expand SaaS features:
- [x] **Canvas State Resiliency:** Resolved bugs involving the canvas clearing during bulk exports and failing to restore initial states, zoom, and active selections.
- [x] **Export Precision Validation:** Fine-tuned correct DPI multiplier calculations to strictly enforce print qualities.
- [ ] **Payment Gateway Integration:** Direct the `Pricing.tsx` layer to handle a live `Stripe` or `Razorpay` SDK checkout payload to sell points.
- [ ] **Mobile Interactions:** Enhance safeguards to limit complex Canvas drag-and-drop workflows on mobile, as precision jersey mapping relies on desktop environments.
- [x] **Background Processing:** Added visual progress overlays, speed metrics, and ETA tracking to the export module.

---

<p align="center">
  <b>Built and Engineered by the GxDrip Development Team</b>
</p>
