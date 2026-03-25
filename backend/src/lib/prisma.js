import { PrismaClient } from '@prisma/client';

// singleton  | connection pool | one instance for whole DB to avoid hitting limits in Postgres 
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

export default prisma;
