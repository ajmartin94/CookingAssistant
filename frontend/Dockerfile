# Frontend Dockerfile for Cooking Assistant
# React + Vite + Tailwind with Nginx for production serving

# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (set at build time)
ARG VITE_API_URL=http://localhost:8000
ARG VITE_APP_NAME="Cooking Assistant"
ARG VITE_ENABLE_AI_FEATURES=true

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_ENABLE_AI_FEATURES=$VITE_ENABLE_AI_FEATURES

# Build the application
RUN npm run build


# Production stage
FROM nginx:alpine AS runtime

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
