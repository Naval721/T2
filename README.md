# GxDrip

A canvas-based web application for customizing sports jerseys, automating team rosters, and exporting print-ready high-resolution designs.

## Features

- **Roster Imports:** Upload team rosters via Excel (`.xlsx`) or CSV to generate multiple jersey designs at once.
- **Interactive Canvas:** Drag, drop, rotate, and customize player names, numbers, and logos built on top of Fabric.js.
- **Print-Ready Exports:** Export designs in high resolutions (300 DPI, 450 DPI, and 600 DPI) for production-grade printing.
- **Points-based Security:** Ledger-backed credit deductions handled via Supabase transactions before processing high-res downloads.
- **State Recovery:** Automatic session saving keeps design states safe across page refreshes.

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, Shadcn UI
- **Canvas:** Fabric.js
- **Backend/Database:** Supabase (PostgreSQL, Row-Level Security)
- **Utilities:** `xlsx` (roster processing), `jszip` (bulk zip packaging)

## Getting Started

### Prerequisites

- Node.js (v18+)
- A Supabase project instance

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Naval721/T2.git
   cd T2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *Note: If no Supabase environment variables are provided, the application will run in Demo Mode (local state only).*

4. **Run local development server:**
   ```bash
   npm run dev
   ```

## Database Schema (Supabase)

To enable database synchronization and credit tracking, initialize the following structures:

- **`user_profiles`**: Linked to Auth ID. Tracks user email, full name, and `points_balance`.
- **`points_transactions`**: Audit ledger tracking balance deductions and purchases.

SQL migration scripts are located in `/supabase`.

## License

MIT
