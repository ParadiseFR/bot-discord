# Multi-stage build for Discord bot
# Stage 1: Build dependencies and compile TypeScript
FROM oven/bun:latest AS builder

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
FROM oven/bun:latest AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/config.yml ./config.yml

# Create non-root user for security
RUN addgroup --system --gid 1001 discord && \
    adduser --system --uid 1001 --gid 1001 --shell /bin/false discord

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
CMD ["bun", "dist/src/app.js"]