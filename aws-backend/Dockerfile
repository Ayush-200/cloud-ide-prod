# -------- Build Stage --------
FROM node:20 AS builder

# Install build tools for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build


# -------- Production Stage --------
FROM node:20

WORKDIR /app

# Copy compiled dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy built app
COPY --from=builder /app/dist ./dist

RUN mkdir -p /workspace

EXPOSE 3001

CMD ["node", "dist/server.js"]