import { PrismaClient } from '@prisma/client';

// Why a singleton? Each new PrismaClient() opens a dedicated connection pool
// to PostgreSQL. If you create one per file, you exhaust the database's
// connection limit. One shared instance serves the entire application.
const prisma = new PrismaClient({
  // In development, log every SQL query Prisma sends to the database.
  // This is invaluable for debugging: you can see exactly what query ran
  // and why a result looks wrong.
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

export default prisma;
