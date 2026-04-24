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

# -------- Runtime Stage --------
FROM node:20

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# 🔥 Force Express 4 (to fix the * wildcard PathError)
RUN npm ci && \
    npm install express@4

# Copy built application
COPY --from=builder /app/dist ./dist

RUN mkdir -p /workspace

# ✅ Keep as development as you requested
ENV NODE_ENV=development
ENV PORT=8080
ENV WORKSPACE_DIR=/workspace

EXPOSE 8080

CMD ["node", "dist/server.js"]