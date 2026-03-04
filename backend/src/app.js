import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';

const app = express();

// helmet() sets security-related HTTP response headers automatically.
// For example, it disables the "X-Powered-By: Express" header (which tells
// attackers what framework you're using) and sets Content-Security-Policy.
// Always include this in production apps.
app.use(helmet());

// cors() controls which origins (domains) are allowed to send requests to this API.
// Without this, your browser would block requests from localhost:5173 to localhost:3000
// because they're on different ports (different "origins" in browser security terms).
// credentials: true is required because we authorize via HTTP headers (Bearer token).
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// express.json() parses incoming requests with JSON bodies.
// Without this, req.body is always undefined when your frontend sends JSON.
app.use(express.json());

// Health check route — the first thing you should hit to confirm the server is running.
// Returns a timestamp so you can also tell if the server is stale/hung.
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes will be mounted here in later phases ────────────────────────────
// app.use('/api/v1/auth',     authRouter);
// app.use('/api/v1/faculty',  facultyRouter);
// app.use('/api/v1/students', studentRouter);
// app.use('/api/v1/qr',       qrRouter);
// app.use('/api/v1/sessions', sessionRouter);
// app.use('/api/v1/admin',    adminRouter);
// ────────────────────────────────────────────────────────────────────────────

// Global error handler — MUST be last and MUST have 4 parameters (err, req, res, next).
// Express identifies error-handling middleware by the 4-argument signature.
// Any time a controller calls next(err), or throws inside an async handler,
// execution jumps here.
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Only log full stack traces for unexpected 500 errors.
  // For expected errors (400, 403, 404) we just log the message.
  if (status === 500) {
    console.error('Unexpected error:', err);
  }

  res.status(status).json({ error: message });
});

export default app;
