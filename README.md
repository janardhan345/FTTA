# FTTA

Faculty Time Tracking and Availability (FTTA) is a full-stack web app for managing faculty counselling sessions with live availability tracking using rotating QR codes.

## Note: This application is only built for a private institution, can't sign in or use the application if the domain doesn't match.

## What It Solves

- Tracks when a faculty member starts and ends a counselling session.
- Shows real-time faculty availability to admins.
- Supports secure sign-in using Google OAuth.
- Uses role-based access control for admin and faculty users.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, html5-qrcode
- Backend: Node.js, Express, Passport (Google OAuth), JWT
- Database: PostgreSQL with Prisma ORM
- Deployment: Railway (backend), Vercel (frontend)

## Core Flow

1. User signs in with Google.
2. Backend validates user role (admin or faculty) and issues a JWT.
3. Admin opens kiosk screen showing a rotating QR code.
4. Faculty scans QR from their mobile page.
5. Scan toggles session state:
   - No active session -> START
   - Active session exists -> END
6. QR rotates after each successful scan.
7. Admin dashboard reflects availability in near real time.

## Monorepo Structure

```text
FTTA/
  backend/    # Express API + Prisma + OAuth + JWT
  frontend/   # React app (admin + faculty UI)
  plan.md     # project planning notes
```

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL
- Google OAuth credentials

### 1) Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `backend/.env` values (database URL, Google OAuth keys, JWT secret, frontend URL, etc.).

Run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

Start backend:

```bash
npm run dev
```

Backend runs at `http://localhost:3000` by default.
Health check: `GET /health`

### 2) Frontend Setup

```bash
cd frontend
npm install
```

Optional `.env` for frontend:

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Start frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Environment Variables

Backend requires these variables:

- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional, defaults to `7d`)
- `FACULTY_DOMAIN`
- `ADMIN_EMAIL`
- `FRONTEND_URL`
- `PORT` (optional, defaults to `3000`)
- `QR_EXPIRY_MINUTES` (optional, defaults to `5`)

See `backend/.env.example` for a complete template.

## Auth and Authorization

- Authentication: Google OAuth 2.0 (Passport)
- Session model: Stateless JWT
- Roles:
  - `admin`: faculty/student management, dashboards, kiosk, analytics
  - `faculty`: student access (scoped), QR scan, own session history

## API Overview

Base URL: `/api/v1`

### Auth

- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/me`
- `POST /auth/logout`

### Faculty (Admin)

- `GET /faculty`
- `POST /faculty`
- `GET /faculty/:id`
- `PATCH /faculty/:id`
- `DELETE /faculty/:id`

### Students

- `GET /students`
- `POST /students`
- `GET /students/:id`
- `PATCH /students/:id`
- `DELETE /students/:id`

### QR

- `GET /qr/current`
- `POST /qr/scan` (faculty only)

### Sessions

- `GET /sessions/my` (faculty)
- `GET /sessions/active` (admin)
- `GET /sessions` (admin)

### Admin

- `GET /admin/availability`
- `PATCH /admin/assign`
- `GET /admin/stats`

## Backend Scripts

Inside `backend/`:

- `npm run dev` - Start with nodemon
- `npm start` - Start with node
- `npm run db:migrate` - Prisma migrate dev
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database and rerun migrations

## Frontend Scripts

Inside `frontend/`:

- `npm run dev` - Start Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment Notes

### Backend (Railway)

- Config is present in `backend/railway.json`.
- Runtime migration strategy is documented in `backend/entrypoint.sh`.
- For production, use `prisma migrate deploy` (not `migrate dev`).

### Frontend (Vercel)

- SPA rewrite config is present in `frontend/vercel.json`.
- Ensure `VITE_API_BASE_URL` points to your deployed backend.

## Security Notes

- Restrict OAuth callback/domain properly in Google Cloud Console.
- Keep `JWT_SECRET` strong and private.
- Set strict CORS `FRONTEND_URL` in backend env.
- Never commit real `.env` files.

## Status

Core backend and frontend flows are implemented, including OAuth login, role-based access, QR-driven session toggling, and admin availability views.
