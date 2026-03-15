#!/bin/sh
# entrypoint.sh — runs before the server starts on every container boot
#
# Why run migrations here instead of in the Dockerfile?
# The Dockerfile RUN commands execute during BUILD time — at that point
# there is no database to connect to. DATABASE_URL is only available at
# RUNTIME when Railway injects environment variables into the container.
# So this script is the right place to do anything that needs the database.

set -e  # exit immediately if any command fails

echo "→ Running database migrations..."
npx prisma migrate deploy

echo "→ Starting server..."
# exec replaces this shell process with node, so signals (SIGTERM etc.)
# go directly to node instead of being swallowed by the shell
exec node server.js
