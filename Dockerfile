# Multi-stage Dockerfile for CookingAssistant
# Stage 1: Build frontend
# Stage 2: Production image with backend + frontend static files

# =============================================================================
# Stage 1: Build Frontend
# =============================================================================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build production bundle
RUN npm run build

# =============================================================================
# Stage 2: Production Image
# =============================================================================
FROM python:3.11-slim AS production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt && \
    pip install --no-cache-dir gunicorn

# Copy backend source code
COPY backend/ ./backend/

# Copy frontend build output
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user for security
# Create /data directory for SQLite persistence (Fly.io volume mount point)
RUN useradd --create-home --shell /bin/bash appuser && \
    mkdir -p /data && \
    chown -R appuser:appuser /app /data
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Run entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
