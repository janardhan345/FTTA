import 'dotenv/config';

// List every variable your app CANNOT run without.
// If any are missing at startup, the process will crash immediately
// with a clear message instead of failing mysteriously later.
const required = [
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'JWT_SECRET',
  'FACULTY_DOMAIN',
  'ADMIN_EMAIL',
  'FRONTEND_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    // Crashing here on purpose: a missing secret is not recoverable
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Export a clean object instead of reading process.env everywhere.
// This way, if you rename a variable in .env you only update one file.
export const env = {
  DATABASE_URL:        process.env.DATABASE_URL,
  GOOGLE_CLIENT_ID:    process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  JWT_SECRET:          process.env.JWT_SECRET,
  JWT_EXPIRES_IN:      process.env.JWT_EXPIRES_IN || '7d',
  FACULTY_DOMAIN:      process.env.FACULTY_DOMAIN,
  ADMIN_EMAIL:         process.env.ADMIN_EMAIL,
  FRONTEND_URL:        process.env.FRONTEND_URL,
  PORT:                parseInt(process.env.PORT || '3000', 10),
  // How many minutes a QR code stays valid before it expires on its own
  QR_EXPIRY_MINUTES:   parseInt(process.env.QR_EXPIRY_MINUTES || '5', 10),
};
