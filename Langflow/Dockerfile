# Multi-stage build: Node.js builder stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app
COPY package*.json tsconfig*.json ./
RUN npm ci
COPY src ./src
COPY .env.example .env
RUN npm run build && npm ci --omit=dev


# Final stage: Python base with Node.js
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    openssl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast Python package management
RUN pip install --no-cache-dir uv

# Install Langflow using uv
RUN uv pip install --system langflow

WORKDIR /opt/app


# Copy built Node.js application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env ./.env

# Copy Langflow submodule
COPY langflow ./langflow

RUN mkdir -p /sp/inputs /sp/output /sp/run /sp/secrets

ENTRYPOINT ["node", "dist/index.js"]

