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
3. Admin opens kiosk screen showing two QR codes one for Attendance , another for Session.
4. Faculty scans QR from their mobile page.
5. Scan toggles session state:
   - Attendance -> Available
   - Same QR -> Not Available
   - No active session -> START
   - Active session exists -> END
6. Admin dashboard reflects availability in near real time.



