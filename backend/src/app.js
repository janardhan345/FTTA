import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import './config/passport.js'; 
import passport from 'passport';
import { verifyJWT, requireAdmin } from './middleware/auth.js';
import authRouter    from './routes/auth.routes.js';
import facultyRouter from './routes/faculty.routes.js';
import studentRouter from './routes/student.routes.js';
import qrRouter      from './routes/qr.routes.js';
import sessionRouter from './routes/session.routes.js';
import adminRouter   from './routes/admin.routes.js';

const app = express();

app.use(helmet());

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

app.use(passport.initialize());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRouter);

app.use('/api/v1/faculty', verifyJWT, requireAdmin, facultyRouter);

app.use('/api/v1/students', verifyJWT, studentRouter);

app.use('/api/v1/qr', verifyJWT, qrRouter);

app.use('/api/v1/sessions', verifyJWT, sessionRouter);

app.use('/api/v1/admin', verifyJWT, requireAdmin, adminRouter);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (status === 500) {
    console.error('Unexpected error:', err);
  }

  res.status(status).json({ error: message });
});

export default app;
