# -------- Build Stage --------
FROM node:20 AS builder

WORKDIR /app

# Install build tools for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Clean any existing dist and build fresh
RUN rm -rf dist && npm run build


# -------- Production Stage --------
FROM node:20

WORKDIR /app

# Install runtime dependencies required by node-pty
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files for production install
COPY package*.json ./

# Install all dependencies (dotenv is in dependencies, not devDependencies)
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p /workspace

ENV NODE_ENV=production
ENV PORT=8080
ENV WORKSPACE_DIR=/workspace

EXPOSE 8080

CMD ["node", "dist/server.js"]