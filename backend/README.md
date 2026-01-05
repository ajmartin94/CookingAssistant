# Cooking Assistant - Backend

FastAPI backend for the Cooking Assistant application.

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Run Database Migrations

```bash
alembic upgrade head
```

### 5. Start Development Server

```bash
uvicorn app.main:app --reload
```

Or run directly:

```bash
python -m app.main
```

The API will be available at: http://localhost:8000

## API Documentation

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- OpenAPI JSON: http://localhost:8000/api/openapi.json

## Testing

Run tests with pytest:

```bash
pytest
```

With coverage:

```bash
pytest --cov=app --cov-report=html
```

## Code Quality

Format code:

```bash
black .
```

Lint code:

```bash
ruff check .
```

Type check:

```bash
mypy app
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entry point
│   ├── config.py            # Configuration management
│   ├── database.py          # Database setup
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── api/                 # API route handlers
│   ├── services/            # Business logic
│   ├── ai/                  # AI integration
│   └── utils/               # Helper functions
├── migrations/              # Alembic migrations
├── tests/                   # Test suite
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables
```
