# Multi-stage build for Discord bot
# Stage 1: Build dependencies and compile TypeScript
FROM node:20-alpine AS builder

# Install bun for building
RUN npm install -g bun

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build the project using SWC
RUN bun run build

# Verify build output
RUN ls -la /app/dist/

# Stage 2: Production runtime
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

# Create app directory
WORKDIR /app

# Copy package files and install fresh production dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/prisma ./prisma

# Install production dependencies fresh
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config.yml ./config.yml

# Create non-root user for security
RUN addgroup -S -g 1001 discord && \
    adduser -S -u 1001 -G discord -s /bin/false -H discord

# Change ownership of app directory
RUN chown -R discord:discord /app

# Switch to non-root user
USER discord

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port (if needed for health checks)
EXPOSE 3000

# Start the application
CMD ["node", "dist/src/app.js"]