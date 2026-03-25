import { Router } from 'express';
import passport from '../config/passport.js';
import { handleOAuthCallback, getMe, logout } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback', passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=unauthorized`,
  }),
  handleOAuthCallback
);

router.get('/me', verifyJWT, getMe);

router.post('/logout', verifyJWT, logout);

export default router;
