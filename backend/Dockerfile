# Backend Dockerfile for Cooking Assistant
# FastAPI + SQLite with LiteLLM for AI integration

FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt


FROM python:3.12-slim AS runtime

WORKDIR /app

# Install runtime dependencies (SQLite is included in Python slim)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

# Environment defaults (can be overridden in docker-compose)
ENV DATABASE_URL=sqlite+aiosqlite:///./data/cooking_assistant.db
ENV DEBUG=False
ENV CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
