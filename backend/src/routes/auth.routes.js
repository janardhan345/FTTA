import { Router } from 'express';
import passport from '../config/passport.js';
import { handleOAuthCallback, getMe, logout } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

// ── Route 1: Start the OAuth flow ────────────────────────────────────────────
// When the user clicks "Sign in with Google" on the frontend,
// the frontend redirects to this URL.
// Passport redirects the user's browser to Google's consent screen.
// "scope" tells Google what information we want:
//   - "profile" = name, profile picture
//   - "email"   = email address
// session: false — we're using JWT, not server-side sessions
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

// ── Route 2: Google's callback ───────────────────────────────────────────────
// Google redirects to this URL after the user approves (or denies) the request.
// Google appends a ?code=... query parameter which Passport exchanges for a token.
//
// Middleware chain on success: passport.authenticate → handleOAuthCallback
// On failure: redirect to login page with error
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=unauthorized`,
  }),
  handleOAuthCallback
);

// ── Route 3: Get current user ────────────────────────────────────────────────
// Called by the frontend after storing the JWT, to confirm who's logged in.
// verifyJWT must run first — it populates req.user from the token.
router.get('/me', verifyJWT, getMe);

// ── Route 4: Logout ───────────────────────────────────────────────────────────
// Stateless — the real action (clearing the token) happens in the frontend.
// But we keep this endpoint for clean API design and future token blacklisting.
router.post('/logout', verifyJWT, logout);

export default router;
