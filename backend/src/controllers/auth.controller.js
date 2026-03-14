import { signToken } from '../config/jwt.js';
import { env } from '../config/env.js';

// handleOAuthCallback — called by Express after Passport successfully
// authenticates the user via Google.
//
// At this point:
//   - Passport has already run its verify callback
//   - req.user contains: { id, email, name, role, dept? }
//   - We just need to mint a JWT and get it to the frontend
//
// Why redirect with ?token= instead of a JSON response?
//   Because this is an OAuth redirect. The browser came here from Google's servers.
//   The frontend can't intercept a redirect to read a JSON body.
//   We redirect to the frontend's /auth/callback page, which reads the token
//   from the URL query string and stores it in localStorage.
export function handleOAuthCallback(req, res) {
  const token = signToken({
    id:    req.user.id,
    email: req.user.email,
    name:  req.user.name,
    role:  req.user.role,
    dept:  req.user.dept || null,
  });

  // Redirect to the React frontend's callback page with the token
  res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
}

// getMe — returns the token's payload as JSON.
//
// The frontend calls this on every page load to hydrate auth state.
// We don't hit the database here — the JWT already contains all we need.
// This is one of the key benefits of JWT: no DB lookup on every request.
export function getMe(req, res) {
  // req.user is populated by verifyJWT middleware before this runs
  res.json(req.user);
}

// logout — stateless logout.
//
// With JWT, the server has no session to destroy. The token is self-contained.
// Real logout happens on the CLIENT by deleting the token from localStorage.
// This endpoint exists so the frontend has a clean API to call, and so we
// can add server-side token blacklisting here in the future if needed.
export function logout(req, res) {
  res.json({ message: 'Logged out successfully' });
}
