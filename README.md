# GxDrip

**GxDrip** is a web-based application for designing custom sports jerseys, managing team rosters, and generating print-ready high-resolution exports. Built with React, TypeScript, and Fabric.js, it supports bulk roster import via Excel/CSV, interactive canvas editing, and secure credit-based export handling via Supabase.

---

## Features

- **Roster Management** – Upload `.xlsx` or `.csv` files to generate multiple jersey designs in one go.
- **Interactive Canvas** – Drag, resize, rotate, and customize player names, numbers, logos, and other elements using Fabric.js.
- **High‑Resolution Exports** – Export designs at 300, 450, or 600 DPI for professional printing.
- **Credit System** – Points are deducted from a user’s balance via Supabase transactions before high-res downloads are processed.
- **Session Persistence** – Automatic state saving to recover designs after page refreshes.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript  
- **Styling**: Tailwind CSS, shadcn/ui  
- **Canvas**: Fabric.js  
- **Backend**: Supabase (PostgreSQL with Row‑Level Security)  
- **Utilities**: `xlsx` for roster parsing, `jszip` for bulk ZIP packaging

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Supabase project (optional – app can run in demo mode without it)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Naval721/T2.git
   cd T2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**  
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   If these variables are not set, the application runs in **Demo Mode** – all data is stored locally and credit checks are bypassed.

4. **Start the development server**
   ```bash
   npm run dev
   ```

---

## Database Schema (Supabase)

For full functionality, set up the following tables in your Supabase project:

- **`user_profiles`** – stores user email, full name, and `points_balance` (linked to Auth ID).
- **`points_transactions`** – audit log for all point deductions and additions.

SQL migration scripts are available in the `/supabase` directory.

---

## Usage

- **Upload a roster** – Use the import tool to upload a file with player names and numbers. Each player becomes a separate jersey design.
- **Customize on canvas** – Click any element to edit text, adjust position, scale, or rotation.
- **Export** – Choose a DPI preset and download single or bulk designs as high-res images (PNG/PDF).
- **Credits** – Each high-res export consumes points from the user’s balance. The ledger ensures atomic deductions.

---

## Development

### Project Structure

```
/
├── src/
│   ├── components/     # React UI components
│   ├── canvas/         # Fabric.js canvas logic
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities (Supabase client, export helpers)
│   └── types/          # TypeScript type definitions
├── supabase/           # Database migrations and seeds
└── public/             # Static assets
```

### Key Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run lint` – run ESLint
- `npm run preview` – preview the production build locally

---

## Deployment

The app is static and can be deployed to any hosting service (Vercel, Netlify, etc.). Environment variables must be set on the host for Supabase integration. For Docker or self‑hosted setups, ensure the `.env` file is present during build.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
