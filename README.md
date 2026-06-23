<div align="center">
  <h1>GxDrip</h1>
  <p><strong>Professional Jersey Print Studio Engine & Roster Customization Tool</strong></p>

  <p>
    <a href="#overview">Overview</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#database-schema">Database Schema</a> •
    <a href="#usage">Usage</a> •
    <a href="#development">Development</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#license">License</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/REACT-18.x-00d8ff?style=flat-square&logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TYPESCRIPT-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/CANVAS-FABRIC.JS-ff4081?style=flat-square" alt="Fabric.js" />
    <img src="https://img.shields.io/badge/SUPABASE-AUTH%20%26%20DB-3ecf8e?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/TAILWIND%20CSS-3.x-38bdf8?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </p>
</div>

---

## Overview

**GxDrip** is a high-performance, web-based application designed for sports apparel customizers and print shops. It combines an interactive design canvas with bulk roster processing, allowing studios to map team rosters onto jersey templates and export print-ready, high-resolution vector and image files.

---

## Features

- **Bulk Roster Imports:** Upload team rosters via Excel (`.xlsx`) or CSV to instantly generate individual player jersey designs.
- **Interactive Canvas Engine:** A precise jersey editor powered by Fabric.js supporting dynamic player name/number layouts, drag-and-drop elements, constraint locking, and vector logos.
- **Production-Grade Exports:** Render and download jersey layouts at print-ready resolutions (300 DPI, 450 DPI, and 600 DPI) optimized for large sublimation printers.
- **Transaction-Backed Deductions:** Integration with Supabase checks balance and executes credit deductions before approving downloads to prevent exploits.
- **Session Auto-Recovery:** Restores active canvas elements and design states seamlessly in the event of an unexpected page refresh.

---

## Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Fast, type-safe interactive interface |
| **Canvas API** | Fabric.js | Advanced vector manipulation and rendering |
| **Styling** | Tailwind CSS, Shadcn UI | Premium, responsive component interface |
| **Backend** | Supabase | Secure Auth & PostgreSQL data persistence |
| **Utilities** | JSZip, SheetJS (XLSX) | Bulk compression and Excel parsing |

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Supabase project instance (optional – app can run in demo mode without it)

### Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Naval721/T2.git
   cd T2
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root folder:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *Note: If these keys are not set, GxDrip will operate in a local-only Demo Mode with credit checks bypassed.*

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Database Schema

To link GxDrip with credits and authentication, initialize these tables inside your Supabase project (SQL migration scripts are located in the `/supabase` folder):

- **`user_profiles`**: Extends Supabase auth profiles; tracks player emails, names, and credit balances (`points_balance`).
- **`points_transactions`**: A backend-secured ledger recording credit purchases and print deductions.

---

## Usage

- **Upload a Roster:** Use the import tool to upload a file with player names and numbers. Each player becomes a separate jersey design.
- **Customize on Canvas:** Click any element to edit text, adjust position, scale, or rotation.
- **Export:** Choose a DPI preset and download single or bulk designs as high-res images (PNG/PDF).
- **Credits:** Each high-res export consumes points from the user’s balance. The ledger ensures atomic deductions.

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

- `npm run dev` – Start Vite development server
- `npm run build` – Create production build
- `npm run lint` – Run ESLint code checks
- `npm run preview` – Preview the production build locally

---

## Deployment

The app is static and can be deployed to any hosting service (Vercel, Netlify, etc.). Environment variables must be set on the host for Supabase integration. For Docker or self‑hosted setups, ensure the `.env` file is present during build.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
