# AN Salon

Full-stack website for AN Salon, a luxury unisex beauty parlour in Kharadi, Pune.

**Stack:** Next.js 15 (App Router) · TypeScript · better-sqlite3 · bcryptjs · jose · Vanilla CSS

---

## Quick Start

### 1. Prerequisites

- **Node.js ≥ 18** — download from https://nodejs.org/en/download (LTS recommended)
- No database server required — SQLite is embedded and file-based.

### 2. Install dependencies

```powershell
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```
DATABASE_PATH=./data/ansalon.db
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
SESSION_COOKIE_NAME=ansalon_session
NODE_ENV=development
```

> **Generate a JWT secret:**
> ```powershell
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```
> Copy the output into `JWT_SECRET`.

### 4. Create the first manager account

```powershell
$env:MANAGER_NAME="Salon Manager"
$env:MANAGER_EMAIL="manager@ansalon.in"
$env:MANAGER_PASSWORD="YourSecurePassword"
node scripts/create-manager.js
```

The database and tables are created automatically when the app first starts (or when this script runs). No separate migration step needed.

### 5. Run the development server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Manager Dashboard

| URL | Description |
|-----|-------------|
| `/manager/login` | Manager sign-in page |
| `/dashboard` | Protected dashboard (redirect to login if not signed in) |

From the dashboard, managers can:
- View, search, filter, confirm, reschedule, or cancel appointments
- View registered customers and their contact details
- Add, edit, hide, or update services (and remove placeholder labels)
- Update business hours, walk-in status message, and booking notice
- **Change manager password** under the **Settings** tab

### Changing or Resetting the Manager Password

There are two ways to change the admin/manager password:

#### Option 1: Via the Manager Dashboard (while logged in)
1. Sign in at `http://localhost:3000/manager/login`.
2. Go to the **Settings** tab.
3. Scroll to **Manager Account Security**.
4. Enter the **Current Password**, **New Password** (min 8 characters), confirm it, and click **Change Password**.

#### Option 2: Via Terminal / Command Line (if locked out or forgot password)
Run the reset script with the manager's email and new password:

```powershell
node scripts/reset-manager-password.js manager@ansalon.in NewSecurePassword123
```

Or using environment variables:
```powershell
$env:MANAGER_EMAIL="manager@ansalon.in"
$env:MANAGER_PASSWORD="NewSecurePassword123"
node scripts/reset-manager-password.js
```

**Accessing from another device (phone, tablet, remote computer):**

If running locally, find your machine's IP on the local network:
```powershell
ipconfig
```
Then open `http://<your-ip>:3000/manager/login` on the other device (must be on the same Wi-Fi network).

For remote access from anywhere, deploy the app (see Deployment section below).

---

## Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_PATH` | Path to the SQLite file, relative to project root | Yes |
| `JWT_SECRET` | Long random string for signing session tokens (min 64 chars) | Yes |
| `SESSION_COOKIE_NAME` | Cookie name for sessions (default: `ansalon_session`) | No |
| `NODE_ENV` | `development` or `production` | Recommended |

---

## Deployment

### Vercel (recommended – free tier available)

> **Note:** better-sqlite3 uses native binaries. Vercel supports this for serverless functions. Use the `@vercel/nft` bundler option.

1. Push your code to GitHub.
2. Import the repo on [vercel.com](https://vercel.com).
3. Set environment variables in the Vercel dashboard (Settings → Environment Variables).
4. For persistent SQLite, mount a volume or use a hosted database (e.g. Turso/LibSQL, PlanetScale).

### Railway / Render / Fly.io

These platforms support persistent volumes. Mount the `data/` directory to preserve the SQLite file across deploys.

### Self-hosted / VPS

```bash
npm run build
npm start
```

Use `pm2` or a systemd service to keep it running.

---

## Project Structure

```
src/
  app/
    page.tsx                  — Homepage (all public sections)
    layout.tsx                — Root layout + metadata
    globals.css               — Design system + all styles
    signin/page.tsx           — Customer sign-in/register page
    my-appointments/page.tsx  — Customer appointment history
    manager/login/page.tsx    — Manager sign-in
    dashboard/page.tsx        — Manager dashboard
    api/
      auth/
        customer/login/       — Customer login
        customer/register/    — Customer registration
        manager/login/        — Manager login
        logout/               — Sign out (clears cookie)
        me/                   — Current session info
      services/               — Service CRUD
      appointments/           — Appointment CRUD
      availability/           — Booked slots for a date
      customers/              — Customer list (manager only)
      settings/               — Business settings CRUD
  lib/
    db.ts                     — SQLite connection + schema + seed
    auth.ts                   — JWT token creation/verification
    validate.ts               — Server-side input validation
  middleware.ts               — Edge auth guards for /dashboard and /my-appointments
scripts/
  create-manager.js           — Secure manager account creation
data/
  ansalon.db                  — SQLite database (auto-created, git-ignored)
```

---

## Security Notes

- Passwords are hashed with **bcrypt** (12 rounds) — never stored in plain text.
- Sessions use **signed JWT** (HS256, 7-day expiry) stored in an `httpOnly`, `sameSite=lax` cookie.
- All protected API routes verify the session **server-side** on every request.
- The middleware additionally blocks unauthenticated access to `/dashboard` at the edge layer.
- Customers can only view their own appointments — the API enforces this in the backend.
- Input is validated and sanitised server-side before any database query; all queries use parameterised statements to prevent SQL injection.
- Secrets are stored in `.env.local` and never committed to version control.

---

## Database

SQLite via **better-sqlite3** — single file at `data/ansalon.db`. The schema is created automatically on first run. Tables:

| Table | Purpose |
|-------|---------|
| `managers` | Staff accounts |
| `customers` | Registered customers |
| `services` | Service catalog |
| `appointments` | Booking records |
| `business_settings` | Manager-editable settings (hours, walk-in status, etc.) |

The `appointments` table has a `UNIQUE(appt_date, appt_time)` constraint — duplicate slot bookings are rejected at the database level as well as in the API.

---

## Services Catalog

The app ships with **11 placeholder services** (marked "Sample entry") covering the categories shown on the existing AN Salon website: Hair Care, Men's Grooming, Makeup, Skin Care, Nail Care, Essentials, and Wellness. The manager can:
- Edit names, descriptions, durations, and prices.
- Remove the "Sample" label once real details are confirmed.
- Add, hide, or delete services freely from the dashboard.
