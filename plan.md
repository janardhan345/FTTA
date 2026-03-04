# FTTA - Faculty Time Tracking & Availability App

## Stack
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: React (Vite)
- **Auth**: Passport.js + Google OAuth 2.0 + JWT (stateless, no sessions)
- **QR Generation**: `qrcode` npm package (server-side, base64 PNG)
- **QR Scanning**: `html5-qrcode` npm package (browser camera)

---

## Architecture Key Decisions

1. **Layered backend**: Route → Controller → Service → Prisma (each layer has one job)
2. **Single ActiveQR row** (id=1, always upserted). One global QR on the kiosk at all times.
3. **JWT encodes role at login**. No DB check on every request. Re-login required if role changes.
4. **`endTime IS NULL` = active session**. No status column needed.
5. **Faculty ID = Google OAuth `sub` claim**, set automatically on first login via `upsert`.

---

## Updated Prisma Schema

**File**: `backend/prisma/schema.prisma`

Changes from user's original schema:
- Add `Admin` model (id = Google sub)
- Add `ActiveQR` model (single-record table, id=1)
- `Session.endTime` → nullable (`DateTime?`)
- `Student.id` → `@default(uuid())` (auto-generated)
- Add `@@map()` to all models for clean table names

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Admin {
  id        String   @id @unique
  email     String   @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  @@map("admins")
}

model Faculty {
  id        String    @id @unique
  email     String    @unique
  name      String
  dept      String
  createdAt DateTime  @default(now()) @map("created_at")
  students  Student[]
  sessions  Session[]
  @@map("faculty")
}

model Student {
  id        String   @id @default(uuid())
  name      String
  gender    String
  facultyId String   @map("faculty_id")
  dept      String
  cutOff    Float    @map("cut_off")
  community String
  quota     String
  status    String
  createdAt DateTime @default(now()) @map("created_at")
  faculty   Faculty  @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  @@map("students")
}

model Session {
  id          Int       @id @default(autoincrement())
  facultyId   String    @map("faculty_id")
  startTime   DateTime  @map("start_time")
  endTime     DateTime? @map("end_time")        // null = currently active
  qrToken     String    @unique @map("qr_token")
  qrExpiresAt DateTime  @map("qr_expires_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  faculty     Faculty   @relation(fields: [facultyId], references: [id], onDelete: Cascade)
  @@map("sessions")
}

model ActiveQR {
  id        Int      @id @default(autoincrement())   // always 1
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("active_qr")
}

model Department {
  code String @id @unique
  name String
  @@map("departments")
}
```

---

## Project Folder Structure

```
FTTA/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js          # Validates + exports all env vars
│   │   │   ├── passport.js     # Google OAuth strategy + domain check
│   │   │   └── jwt.js          # signToken() + verifyToken()
│   │   ├── lib/
│   │   │   └── prisma.js       # Singleton PrismaClient
│   │   ├── middleware/
│   │   │   ├── auth.js         # verifyJWT, requireAdmin, requireFaculty
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── faculty.routes.js
│   │   │   ├── student.routes.js
│   │   │   ├── qr.routes.js
│   │   │   ├── session.routes.js
│   │   │   └── admin.routes.js
│   │   ├── controllers/        # reads req, calls service, writes res
│   │   │   ├── auth.controller.js
│   │   │   ├── faculty.controller.js
│   │   │   ├── student.controller.js
│   │   │   ├── qr.controller.js
│   │   │   ├── session.controller.js
│   │   │   └── admin.controller.js
│   │   ├── services/           # all business logic lives here
│   │   │   ├── qr.service.js
│   │   │   └── session.service.js
│   │   └── app.js
│   ├── server.js               # entry point
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js        # Axios instance + JWT interceptor + 401 handler
    │   ├── context/
    │   │   └── AuthContext.jsx # Auth state, login(), logout()
    │   ├── hooks/
    │   │   ├── useQR.js        # Polls /qr/current every 2s
    │   │   └── useAuth.js
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── ProtectedRoute.jsx
    │   │   ├── QRDisplay.jsx
    │   │   ├── QRScanner.jsx   # html5-qrcode camera component
    │   │   └── StudentCard.jsx
    │   ├── pages/
    │   │   ├── Login.jsx           # Google Sign In button
    │   │   ├── AuthCallback.jsx    # Reads ?token= from URL, stores JWT
    │   │   ├── FacultyDashboard.jsx
    │   │   ├── ScanQR.jsx          # Faculty: camera scan
    │   │   ├── AdminDashboard.jsx
    │   │   ├── AdminFaculty.jsx
    │   │   ├── AdminStudents.jsx
    │   │   └── KioskQR.jsx         # Full-screen QR for dedicated screen
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env                    # VITE_API_BASE_URL=http://localhost:3000/api/v1
    ├── vite.config.js
    └── package.json
```

---

## API Endpoints

### Auth (`/api/v1/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/google` | None | Start Google OAuth flow |
| GET | `/auth/google/callback` | None | OAuth callback → issue JWT → redirect to `/auth/callback?token=` |
| GET | `/auth/me` | verifyJWT | Return decoded user info |
| POST | `/auth/logout` | verifyJWT | Client clears token (stateless) |

### Faculty (`/api/v1/faculty`) — Admin only
| Method | Path | Description |
|--------|------|-------------|
| GET | `/faculty` | All faculty with session status + student count |
| POST | `/faculty` | Pre-register a faculty |
| GET | `/faculty/:id` | One faculty + students |
| PATCH | `/faculty/:id` | Update name/dept |
| DELETE | `/faculty/:id` | Cascade-deletes students + sessions |

### Students (`/api/v1/students`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/students` | verifyJWT | Faculty: own students. Admin: all students |
| POST | `/students` | requireAdmin | Create + assign to faculty |
| GET | `/students/:id` | verifyJWT | Faculty: own only |
| PATCH | `/students/:id` | verifyJWT | Faculty: status only. Admin: all fields including facultyId |
| DELETE | `/students/:id` | requireAdmin | Delete student |

### QR (`/api/v1/qr`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/qr/current` | verifyJWT | Returns `{ imageBase64, expiresAt, updatedAt }` |
| POST | `/qr/scan` | requireFaculty | Body: `{ token }` → start/end session → rotate QR → return `{ action, session }` |

### Sessions (`/api/v1/sessions`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sessions/my` | requireFaculty | Own sessions (paginated) |
| GET | `/sessions` | requireAdmin | All sessions, supports `?facultyId=` `?active=true` |
| GET | `/sessions/active` | requireAdmin | Sessions where endTime IS NULL |

### Admin (`/api/v1/admin`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/availability` | All faculty with `status: "available"|"busy"` |
| PATCH | `/admin/assign` | Body: `{ studentId, newFacultyId }` |
| GET | `/admin/stats` | Counts + avg session duration |

---

## QR Scan Logic (core flow)

```
POST /qr/scan { token: "abc..." }
  │
  ├─ validateQRToken(token)
  │    └─ Check ActiveQR.token matches + not expired. Throw 400 if invalid.
  │
  ├─ Find session WHERE facultyId = req.user.id AND endTime IS NULL
  │    ├─ NOT FOUND → CREATE session { startTime: now, qrToken, qrExpiresAt }  → action = "START"
  │    └─ FOUND     → UPDATE session { endTime: now }                          → action = "END"
  │
  └─ generateAndSaveQR()
       └─ prisma.activeQR.upsert({ where: { id: 1 }, ... new token ... })
```

---

## Environment Variables (`backend/.env`)

```
DATABASE_URL="postgresql://user:pass@localhost:5432/ftta_db"
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"
JWT_SECRET="<64-char random hex>"
JWT_EXPIRES_IN="7d"
FACULTY_DOMAIN="college.edu"
ADMIN_EMAIL="admin@yourdomain.com"
FRONTEND_URL="http://localhost:5173"
PORT=3000
QR_EXPIRY_MINUTES=5
```

---

## Build Phases (in order)

### Phase 1 — Backend Foundation
**Files to create**: `backend/package.json`, `backend/server.js`, `backend/src/app.js`, `backend/src/config/env.js`, `backend/src/lib/prisma.js`, `backend/prisma/schema.prisma`, `backend/prisma/seed.js`

**Commands**:
```bash
cd backend && npm init -y
npm install express prisma @prisma/client dotenv cors helmet
npm install -D nodemon
npx prisma init --datasource-provider postgresql
npx prisma migrate dev --name init
node prisma/seed.js
```
**Verify**: `GET /health` returns `{ status: "ok" }`

### Phase 2 — Authentication
**Files to create**: `src/config/passport.js`, `src/config/jwt.js`, `src/middleware/auth.js`, `src/controllers/auth.controller.js`, `src/routes/auth.routes.js`

**Install**: `npm install passport passport-google-oauth20 jsonwebtoken`

**Key logic in passport.js**:
- If email === `ADMIN_EMAIL` → upsert Admin, role = 'admin'
- Else if domain === `FACULTY_DOMAIN` → upsert Faculty, role = 'faculty'
- Else → reject (unauthorized domain)

**Verify**: Navigate to `/api/v1/auth/google` → completes OAuth → lands on frontend `/auth/callback?token=...`

### Phase 3 — Faculty + Student CRUD
**Files to create**: `controllers/faculty.controller.js`, `controllers/student.controller.js`, `routes/faculty.routes.js`, `routes/student.routes.js`

**Key pattern**: Faculty queries always filter `WHERE faculty_id = req.user.id` unless role is admin.

**Verify**: Postman — `GET /api/v1/students` with faculty JWT returns only their students.

### Phase 4 — QR System
**Files to create**: `services/qr.service.js`, `services/session.service.js`, `controllers/qr.controller.js`, `controllers/session.controller.js`, `routes/qr.routes.js`, `routes/session.routes.js`

**Install**: `npm install qrcode`

**Key rule**: Always call `generateAndSaveQR()` AFTER saving the session (not before), so a failed QR rotation doesn't corrupt session data.

**Verify**: `GET /qr/current` returns base64 image. `POST /qr/scan` creates a Session row with `endTime = null`. Second scan sets `endTime`.

### Phase 5 — Admin APIs
**Files to create**: `controllers/admin.controller.js`, `routes/admin.routes.js`

**Verify**: `GET /admin/availability` shows all faculty with `status: "available"|"busy"`.

### Phase 6 — React Frontend
**Files to create**: All frontend files listed in folder structure above.

**Init**:
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom html5-qrcode
```

**Key files**:
- `api/axios.js` — attach JWT from localStorage on every request, redirect to /login on 401
- `context/AuthContext.jsx` — auth state, login() stores token + calls /auth/me
- `pages/AuthCallback.jsx` — reads `?token=` from URL after OAuth, calls login(), redirects by role
- `pages/KioskQR.jsx` — full-screen QR, polls every 2s, uses Wake Lock API

### Phase 7 — Integration Testing
End-to-end test checklist:
1. OAuth flow: login as faculty → lands on `/dashboard`; login as admin → lands on `/admin`
2. Non-college email → rejected at callback
3. Kiosk QR displays and refreshes after scan
4. Faculty scans → session created (endTime null in DB)
5. Faculty scans again → session closed (endTime set in DB)
6. Two faculty scanning simultaneously → both show as "busy" in admin dashboard
7. Expired QR (set `QR_EXPIRY_MINUTES=0.1`) → scan returns 400 "QR token expired"
8. Faculty JWT on admin route → returns 403

---

## Critical Files (most likely to need debugging)
- `backend/prisma/schema.prisma` — all logic depends on correct shape
- `backend/src/services/qr.service.js` — QR generation, validation, rotation
- `backend/src/services/session.service.js` — start/end session core logic
- `backend/src/config/passport.js` — role assignment happens here
- `frontend/src/context/AuthContext.jsx` — all frontend auth flows through here
- `frontend/src/pages/AuthCallback.jsx` — token must be stored correctly here

## Common Mistakes to Avoid
- Never call `new PrismaClient()` outside `src/lib/prisma.js` (connection pool exhaustion)
- Always `await` Prisma calls (forgetting returns a Promise, not data)
- Handle Prisma error codes: `P2002` = unique violation, `P2025` = record not found
- Never commit `.env` — add it to `.gitignore` immediately
