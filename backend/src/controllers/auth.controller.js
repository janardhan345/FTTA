import { signToken } from '../config/jwt.js';
import { env } from '../config/env.js';

export function handleOAuthCallback(req, res) {
  const token = signToken({
    id:    req.user.id,
    email: req.user.email,
    name:  req.user.name,
    role:  req.user.role,
    dept:  req.user.dept || null,
  });

  res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
}

export function getMe(req, res) {
  res.json(req.user);
}

export function logout(req, res) {
  res.json({ message: 'Logged out successfully' });
}
