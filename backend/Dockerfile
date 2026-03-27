# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema BEFORE npm install (needed for postinstall script)
COPY prisma ./prisma

# Install dependencies (will run postinstall: prisma generate)
RUN npm install

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema (needed for migrations)
COPY prisma ./prisma

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Install production dependencies only (skip scripts since we already have .prisma)
RUN npm ci --omit=dev --ignore-scripts

# Copy application code
COPY src ./src
COPY server.js .

# Expose port
EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
