# Multi-stage build para Railway
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package.json
COPY package.json ./

# Copy backend files
COPY backend ./backend

# Install dependencies and build backend
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile
RUN pnpm install -g tsx

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["pnpm", "start"]
