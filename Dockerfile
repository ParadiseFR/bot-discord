FROM node:20-slim AS builder

RUN npm install -g bun

WORKDIR /app

COPY package.json bun.lock* ./
COPY prisma ./prisma/

RUN bun install --frozen-lockfile

COPY . .

RUN bun run db:generate
RUN bun run build

FROM node:20-slim AS production

RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/prisma ./prisma

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config.yml ./config.yml

RUN groupadd --system --gid 1001 discord && \
    useradd --system --uid 1001 --gid discord --shell /bin/bash --create-home discord

RUN mkdir -p /app/logs /home/discord/.mybot && \
    chown -R discord:discord /app /home/discord

USER discord

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/src/app.js"]
