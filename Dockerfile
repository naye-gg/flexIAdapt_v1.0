# Use Node.js 18 Alpine image
FROM node:18-alpine

# Install system dependencies and global packages
RUN apk add --no-cache curl && \
    npm install -g pnpm tsx

# Create app directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json ./
COPY backend/package.json ./backend/
COPY backend/pnpm-lock.yaml ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile --production=false

# Copy all backend source code
COPY backend/ ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S flexiadapt -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R flexiadapt:nodejs /app

# Switch to non-root user
USER flexiadapt

# Expose the port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start the application using tsx (no need to compile TypeScript)
CMD ["tsx", "server/index.ts"]
