# Cooking Assistant

An AI-powered cooking companion that helps you plan, shop, and cook with ease. Save recipes, generate new ones with AI, and build your personal recipe library.

## Quick Start

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 | API Docs: http://localhost:8000/api/docs

## Features

- **Recipe Library** - Store, organize, and search your recipes
- **AI Recipe Builder** - Generate recipes from ingredients or ideas
- **User Libraries** - Organize recipes into custom collections

## Tech Stack

- **Backend:** FastAPI + SQLite + SQLAlchemy
- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **AI:** OpenAI API (local Ollama support planned)

## Project Status

See [GitHub Milestones](https://github.com/ajmartin94/CookingAssistant/milestones) for current roadmap and progress.

## Documentation

- [Backend Guide](backend/CLAUDE.md)
- [Frontend Guide](frontend/CLAUDE.md)
- [Testing Guide](docs/TESTING.md)
- [Contributing](docs/CONTRIBUTING.md)

## Contributing

Contributions welcome! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

MIT License
