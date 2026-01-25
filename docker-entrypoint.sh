#!/bin/bash
set -e

echo "=== CookingAssistant Container Starting ==="

# Ensure data directory exists for SQLite persistence (Fly.io volume mount)
if [ ! -d "/data" ]; then
    echo "Creating /data directory..."
    mkdir -p /data
fi

# Change to backend directory for Alembic
cd /app/backend

# Check if this is a fresh database (first deploy with volume)
# Handle both relative (///) and absolute (////) SQLite URL formats
DB_PATH="${DATABASE_URL#sqlite+aiosqlite:///}"
# Remove leading slash if present (for absolute paths with 4 slashes)
DB_PATH="${DB_PATH#/}"
# Re-add single leading slash for absolute path
if [[ "$DATABASE_URL" == *"////"* ]]; then
    DB_PATH="/$DB_PATH"
fi
if [ ! -f "$DB_PATH" ] && [ -n "$DB_PATH" ] && [ "$DB_PATH" != "${DATABASE_URL}" ]; then
    echo "First deploy: Initializing database at $DB_PATH..."
    # Create empty database file
    touch "$DB_PATH"
    # Initialize tables and stamp at head
    python -c "import asyncio; from app.database import init_db; asyncio.run(init_db())"
    alembic stamp head
    echo "Database initialized and stamped at migration head."
else
    # Run database migrations for existing database
    echo "Running database migrations..."
    alembic upgrade head
    echo "Migrations complete."
fi

# Start the application with Gunicorn
echo "Starting Gunicorn server..."
exec gunicorn app.main:app \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --access-logfile - \
    --error-logfile - \
    --capture-output
