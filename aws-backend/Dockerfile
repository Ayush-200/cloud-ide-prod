# -------- Build Stage --------
FROM node:20 AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN rm -rf dist && npm run build


# -------- Runtime Stage (Execution Environment) --------
FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# ✅ Install ALL deps (IMPORTANT)
RUN npm ci

COPY --from=builder /app/dist ./dist

RUN mkdir -p /workspace

# ✅ Explicit dev environment
ENV NODE_ENV=development
ENV PORT=8080
ENV WORKSPACE_DIR=/workspace

# ✅ Safety: always include dev deps
RUN npm config set include=dev true

EXPOSE 8080

CMD ["node", "dist/server.js"]