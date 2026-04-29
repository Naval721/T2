# 🎨 GxDrip Stitch - Professional Print Studio Engine

GxDrip Stitch is an enterprise-grade web application built to streamline the design, bulk-customization, and ultra-high-resolution (up to 600 DPI) export of 36-inch sports jerseys. Built specifically for modern print/sublimation shops, it combines an interactive Fabric.js canvas with an automated Point-based economy structure.

## ✨ Core Features & Capabilities

- **⚡ Bulk Roster Processing**: Import entire team rosters (names, numbers, sizes, positions) via Excel/CSV formatting to instantly queue hundreds of jerseys.
- **🎨 Interactive Fabric Engine**: Advanced Canvas environment allowing drag-and-drop manipulation of player text constraints, rotation adjustments, and custom vector logos.
- **🖨️ Production-Ready Exports**: 
  - **Standard (300 DPI):** Clean exports for web / digital proofing.
  - **High (450 DPI):** Production-level output.
  - **Ultra (600 DPI):** True vector-mapped oversized renders explicitly tuned for printing physical 36-inch full-size garments.
- **� Secure Points Economy**: A highly secure credit ledger powered by Supabase. Exports atomically verify balances and deduct points on the backend *before* browser blobs are delivered, making browser interception exploits physically impossible.
- **� Auto-Recovery Save State**: Canvas states, component logic, and loaded rosters are strictly written to `localStorage` buffers to survive browser crashes.

## 🚀 Tech Stack

- **Core**: React 18 (TypeScript), Vite 5
- **Styling**: Tailwind CSS, Vanilla CSS, Shadcn UI
- **Canvas Engineering**: Fabric.js
- **Database & Auth**: Supabase (PostgreSQL with RLS policies enabled)
- **Utility Layers**: `xlsx` (Excel processing), `jszip` (Bulk Packaging), `file-saver`, `sonner` (Toasts)

---

## � Installation & Environment Setup

### Prerequisites
- Node.js 18+ 
- Supabase account and Project (for Auth and Database functions)

### Standard Setup

```bash
# Clone the repository
git clone https://github.com/your-org/GxDripStitch.git
cd GxDripStitch

# Install all workspace dependencies
npm install

# Setup your Environment
cp .env.example .env
```

### Environment Variables
Edit your `.env` file and point it to your live Supabase architecture. The app will seamlessly fall back to "Demo Mode" if these keys are missing.
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Run Locally
```bash
npm run dev
```
Visit `http://localhost:5173` locally.

---

## 🗄️ Database Architecture (Supabase)

To link GxDrip to a live production database, the following tables must be executed via the Supabase SQL Editor to map to the hooks:

1. `user_profiles`
   - Maps to Auth `id` directly.
   - Contains fields: `email`, `full_name`, `points_balance`, `total_points_purchased`, `total_points_used`.
2. `points_transactions`
   - Secure ledger tracking all point mutations.
   - Requires trigger architectures linking to `user_profiles` to update raw point tallies automatically on `INSERT`.

**Note on Row Level Security (RLS):** 
Ensure `user_profiles` uses strict user-bound select filters `(auth.uid() = id)` so endpoints strictly remain locked to active sessions.

---

## � Security Posture Note

All export functions inside `ExportPanel.tsx` enforce a **Strict Server Deduct Before Download** policy. 
Unlike standard applications that deduct currencies upon asynchronous local loops, GxDrip securely awaits Supabase transaction verifications upfront, shutting off memory-leaking bulk arrays and infinite-point UI layer exploits. 

The Canvas module natively disposes RAM chunks intelligently on component unmounting during intense Studio transitions, guarding long-running print-shop tabs from browser crashing.

---

## � Production Roadmap

All UI structures, points economies, and login systems are completely wired and verified. The remaining architecture to establish is the final endpoint tunnel:

- [ ] **Payment Gateway Verification:** Point `Pricing.tsx` to handle a live `Stripe` or `Razorpay` SDK checkout session payload.
- [ ] **Email Receipt Triggers**: Integrate generic SMTP tools if automated receipt dispatching is necessary upon Bulk download completion. 
- [ ] **Mobile Restriction**: Application remains heavily tailored to Desktop workflows; mobile routing remains heavily suppressed to encourage accurate mouse-mapped Canvas interactions. 

---
**Prepared and Engineered by the GxDrip Development Team**
