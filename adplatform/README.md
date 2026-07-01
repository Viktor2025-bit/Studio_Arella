# AdPlatform — Ad Management System

A full-stack ad management platform built with **Next.js / TypeScript** (frontend) and **Node.js / Express / PostgreSQL** (backend). Inspired by the SignGaze template.

---

## 📁 Project Structure

```
adplatform/
├── frontend/          # Next.js 14 + TypeScript + Tailwind CSS
│   ├── app/           # App Router pages
│   │   ├── dashboard/ # Main dashboard
│   │   ├── campaigns/ # Campaign management
│   │   ├── bookings/  # Booking management
│   │   ├── ads/       # Ad creative management
│   │   ├── listings/  # Screen listings
│   │   ├── finances/  # Credits & transactions
│   │   ├── settings/  # User profile & settings
│   │   ├── support/   # FAQ & ticket submission
│   │   └── auth/      # Login & Register
│   ├── components/    # Reusable UI components
│   ├── lib/           # API client (axios)
│   ├── store/         # Zustand auth store
│   └── types/         # Shared TypeScript types
│
└── backend/           # Node.js + Express + PostgreSQL
    ├── src/
    │   ├── controllers/  # Route handlers
    │   ├── middleware/    # Auth (JWT)
    │   ├── routes/        # API routes
    │   └── db/            # PostgreSQL pool
    └── schema.sql         # Database schema
```

---

## 🚀 Quick Start

### 1. Database Setup

Make sure you have **PostgreSQL** running, then:

```bash
createdb adplatform
psql adplatform < backend/schema.sql
```

### 2. Backend

```bash
cd backend

# Copy and edit environment variables
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET

# Install dependencies
npm install

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend

# Copy and edit environment variables
cp .env.local.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_URL

# Install dependencies
npm install

# Start development server
npm run dev
# App runs on http://localhost:3000
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable         | Description                        | Example                                     |
|------------------|------------------------------------|---------------------------------------------|
| `PORT`           | Server port                        | `5000`                                      |
| `DATABASE_URL`   | PostgreSQL connection string       | `postgresql://user:pass@localhost:5432/adplatform` |
| `JWT_SECRET`     | JWT signing secret (long random string) | `super_secret_key_here`                |
| `JWT_EXPIRES_IN` | Token expiry                       | `7d`                                        |
| `NODE_ENV`       | Environment                        | `development`                               |
| `FRONTEND_URL`   | Allowed CORS origin                | `http://localhost:3000`                     |

### Frontend (`frontend/.env.local`)

| Variable              | Description        | Example                        |
|-----------------------|--------------------|--------------------------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL    | `http://localhost:5000/api`    |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| POST   | `/api/auth/register` | Register user      |
| POST   | `/api/auth/login`    | Login              |
| GET    | `/api/auth/me`       | Get current user   |
| PUT    | `/api/auth/profile`  | Update profile     |

### Campaigns
| Method | Endpoint                | Description         |
|--------|-------------------------|---------------------|
| GET    | `/api/campaigns`        | List campaigns      |
| POST   | `/api/campaigns`        | Create campaign     |
| GET    | `/api/campaigns/:id`    | Get campaign        |
| PUT    | `/api/campaigns/:id`    | Update campaign     |
| DELETE | `/api/campaigns/:id`    | Delete campaign     |

### Bookings
| Method | Endpoint                      | Description       |
|--------|-------------------------------|-------------------|
| GET    | `/api/bookings`               | List bookings     |
| POST   | `/api/bookings`               | Create booking    |
| PUT    | `/api/bookings/:id/status`    | Update status     |

### Ads
| Method | Endpoint        | Description  |
|--------|-----------------|--------------|
| GET    | `/api/ads`      | List ads     |
| POST   | `/api/ads`      | Create ad    |
| PUT    | `/api/ads/:id`  | Update ad    |
| DELETE | `/api/ads/:id`  | Delete ad    |

### Screens / Listings
| Method | Endpoint            | Description    |
|--------|---------------------|----------------|
| GET    | `/api/screens`      | List screens   |
| POST   | `/api/screens`      | Create screen  |
| PUT    | `/api/screens/:id`  | Update screen  |
| DELETE | `/api/screens/:id`  | Delete screen  |

### Finances
| Method | Endpoint                     | Description            |
|--------|------------------------------|------------------------|
| GET    | `/api/finances/balance`      | Get credit balance     |
| GET    | `/api/finances/transactions` | List transactions      |
| POST   | `/api/finances/add-credits`  | Top up credits         |
| GET    | `/api/finances/revenue`      | Get total revenue      |

### Analytics
| Method | Endpoint                   | Description             |
|--------|----------------------------|-------------------------|
| GET    | `/api/dashboard/stats`     | Dashboard summary stats |
| GET    | `/api/analytics/hourly`    | Hourly chart data       |

---

## 🧩 Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts (analytics charts)
- Zustand (global state / auth)
- Axios (API client)
- Lucide React (icons)

**Backend**
- Node.js + Express
- TypeScript
- PostgreSQL (via `pg` driver)
- JWT (authentication)
- bcryptjs (password hashing)

---

## 🎨 Customisation Tips

1. **Branding** — Search for `AdPlatform` in the frontend and replace with your company name. Update the logo in `components/layout/Sidebar.tsx` and `Navbar.tsx`.

2. **Currency** — The codebase uses `₦` (Naira). Replace with `$`, `€`, etc. as needed.

3. **Payments** — The `Add Credit` modal in `finances/page.tsx` is a placeholder. Wire in **Paystack** (or Stripe) to process real payments before calling `/api/finances/add-credits`.

4. **Colors** — Primary palette is in `app/globals.css` CSS variables and Tailwind classes. The shell background is `#dde3ef`.

5. **Deploy**
   - Frontend → Vercel (`vercel deploy`)
   - Backend → Render / Railway (set env vars in dashboard)
   - Database → Supabase / Neon (use their pooler URL for `DATABASE_URL`)

---

## 🔐 Security Notes

- All private routes require a valid JWT bearer token.
- Passwords are hashed with bcrypt (10 rounds).
- CORS is restricted to `FRONTEND_URL`.
- In production, set `NODE_ENV=production` to enable SSL on the DB connection.
- Never commit `.env` files — only commit `.env.example`.

---

## 📋 Pages Overview

| Route        | Description                                      |
|--------------|--------------------------------------------------|
| `/`          | Redirects to `/dashboard`                        |
| `/dashboard` | Main stats, chart, recent activity table         |
| `/campaigns` | Create and manage ad campaigns                   |
| `/bookings`  | View and manage screen bookings                  |
| `/ads`       | Upload and manage ad creatives                   |
| `/listings`  | List your ad screens (Screen Owner mode)         |
| `/finances`  | Credits balance, transactions, add credits       |
| `/settings`  | Edit profile, language                           |
| `/support`   | FAQ accordion, contact options, ticket form      |
| `/auth/login`    | Login page                                   |
| `/auth/register` | Registration (Advertiser or Screen Owner)    |
