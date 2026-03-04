import app from './src/app.js';
import { env } from './src/config/env.js';
import prisma from './src/lib/prisma.js';

async function start() {
  try {
    // Verify the database connection BEFORE starting the HTTP server.
    // If PostgreSQL is unreachable or the DATABASE_URL is wrong,
    // this throws immediately and we never accept HTTP traffic.
    await prisma.$connect();
    console.log('✓ Database connected');

    app.listen(env.PORT, () => {
      console.log(`✓ Server running on http://localhost:${env.PORT}`);
      console.log(`  Health: http://localhost:${env.PORT}/health`);
    });
  } catch (err) {
    // Something is broken at the infrastructure level (DB down, bad config).
    // Crashing with exit code 1 signals to process managers (like PM2 or Docker)
    // that the startup failed — important for automated restarts.
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
