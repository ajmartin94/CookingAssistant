# 🍳 Cooking Assistant

An **AI-powered cooking companion** that helps you **plan, shop, and cook with ease**. From saving your favorite recipes to generating grocery lists and guiding you through cooking steps, Cooking Assistant takes the hassle out of making great meals.  

---

## 🚀 Features

### 📖 Recipes
- Intuitive, easy-to-follow recipe cards  
- Store recipes in structured, **LLM-friendly format (JSON/SQLite)**  
- Build custom recipes using AI suggestions  
- Save notes & edits while cooking to refine your collection  
- Organize recipes into sub-libraries (e.g., cuisine type, dietary preferences)  
- Share recipes or full libraries with friends  

### 📅 Planning
- Plan meals for a week (or custom timeframes)  
- Generate **smart ingredient lists**  
- Guided stock review (check what’s in your pantry before shopping)  
- Optimized grocery list with only what’s missing  
- Store recommendations (best prices, shortest trip)  

### 🍴 Cooking
- Interactive **step-by-step cooking mode**  
- Voice-assisted guidance (hands-free cooking)  
- Recipe review & feedback system to improve results  

### 🔗 Integrations (Future)
- Sync with **Google / iOS calendars** for reminders  
- **Home Assistant / Alexa / Siri** integrations for voice guidance  
- Mobile notifications for meal prep or shopping trips  

### 🧠 AI Everywhere
Every feature supports:  
- **Manual mode** → user in full control  
- **AI assist** → LLM suggests improvements  
- **AI automation** → end-to-end agent workflows  

---

## 🛠️ Tech Stack

### Current (local-first)
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python) – simple, fast, API-first  
- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) (web)  
- **Database:** SQLite (easy migration later to Postgres)  
- **AI Integration:** [Ollama](https://ollama.ai/) (local) or OpenAI API  
- **Vector Search (Future):** Chroma / Weaviate (for semantic recipe search)  

### Future (upgrade path)
- **Frontend (Mobile):**  
  - Start as a **web app (React)**  
  - Add **PWA support** for installable mobile experience  
  - Later: wrap with **Capacitor** or migrate UI to **React Native**  
- **Backend (Cloud-ready):** Migrate SQLite → PostgreSQL (Supabase, Railway, Render)  
- **AI Models:** Hybrid (local models for privacy, API for advanced reasoning)  

---

## 🧑‍💻 Development Setup

### ✅ Project Initialization Complete!

The Project Initialization Phase has been implemented. Both backend and frontend are ready to run.

### Backend Setup (FastAPI + SQLite)

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed (optional for development)
   ```

5. **Run the server**
   ```bash
   python -m app.main
   ```

   API available at: **http://localhost:8000**
   - API Docs: http://localhost:8000/api/docs
   - Health Check: http://localhost:8000/api/v1/health

### Frontend Setup (React + Vite)

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed (optional for development)
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   App available at: **http://localhost:5173**

### Running Tests

**Backend (147 tests - 100% passing):**
```bash
cd backend
source venv/bin/activate
pytest                    # Run all tests
pytest --cov=app         # Run with coverage report
pytest -v                # Verbose output
```

Test Coverage:
- Unit Tests: 86 tests (services at 100% coverage)
- Integration Tests: 61 tests (API endpoints)
- Overall Coverage: 78%

**Frontend (205 tests - 98% passing):**
```bash
cd frontend
npm test                 # Run all tests
npm run test:coverage    # Run with coverage report
npm run test:ui          # Run with UI
```

Test Coverage:
- Component Tests: 151 tests (pages, components, hooks)
- API Client Tests: 24 tests
- Context Tests: 30 tests
- Overall: 98% passing (201/205)

**E2E Tests (87 tests - Playwright):**
```bash
npm run test:e2e         # Run all E2E tests (headless)
npm run test:e2e:ui      # Run with interactive UI (recommended)
npm run test:e2e:headed  # Run with visible browser
npm run test:e2e:debug   # Run in debug mode
```

**Current Test Results:** 17/87 passing (19.5%)
- ✅ Authentication Tests: 9/13 passing (69%)
  - Login (5/5) - 100%
  - Registration (3/5) - 60%
  - Logout (0/3) - Pending
- ✅ Validation Tests: 8/18 passing (44%)
- ❌ Recipe CRUD Tests: 0/54 - In progress
- ✅ Error Handling: 1/22 passing (5%)
- ❌ Workflow Tests: 0/3 - In progress

**Test Infrastructure:**
- Backend: FastAPI with async SQLite, E2E test mode with auto table recreation
- Frontend: React with proper component testing selectors
- E2E: Playwright with real backend + frontend servers, cross-browser testing (Chromium, Firefox, WebKit)
- Page Object Model: Type-safe page abstractions for maintainability
- CI/CD: Automated testing on push and pull requests

**Total Test Count:** 437+ tests (352 unit/integration + 87 E2E)

For detailed E2E testing documentation, see [docs/E2E_TESTING.md](docs/E2E_TESTING.md)

---

## 🐳 Docker Deployment

Run the full stack with Docker Compose, including local AI via Ollama.

### Prerequisites

- Docker and Docker Compose
- 8GB+ RAM (16GB recommended for AI features)
- Optional: NVIDIA GPU for faster AI responses

### Quick Start

```bash
# 1. Start Ollama first (downloads ~4GB on first run)
docker compose up -d ollama

# 2. Pull the AI model (one-time, ~4GB download)
docker compose exec ollama ollama pull llama3.1:8b

# 3. Start all services
docker compose up -d

# 4. Open the app
open http://localhost:3000
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React web application |
| Backend | http://localhost:8000 | FastAPI REST API |
| API Docs | http://localhost:8000/api/docs | Interactive API documentation |
| Ollama | http://localhost:11434 | Local LLM server |

### Configuration

Copy `.env.docker.example` to `.env.docker` and customize:

```bash
cp .env.docker.example .env.docker
# Edit .env.docker with your settings
docker compose --env-file .env.docker up -d
```

Key settings:
- `SECRET_KEY` - JWT secret (MUST change for production)
- `LLM_MODEL` - AI model (default: `ollama/llama3.1:8b`)
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` - For cloud AI providers

### Data Persistence

Data is stored in Docker volumes:
- `backend_data` - SQLite database and uploads
- `ollama_data` - Downloaded AI models

To back up data:
```bash
docker compose exec backend cat /app/data/cooking_assistant.db > backup.db
```

### GPU Support (Optional)

For NVIDIA GPU acceleration, uncomment the GPU section in `docker-compose.yml`:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

### Exposing to Testers (Cloudflare Tunnel)

Share your local instance securely:

```bash
# Install cloudflared
brew install cloudflared  # or download from cloudflare.com

# Create temporary public URL
cloudflared tunnel --url http://localhost:3000
```

This provides an HTTPS URL like `https://random-words.trycloudflare.com`.

### Troubleshooting

**Ollama model not responding:**
```bash
# Check if model is downloaded
docker compose exec ollama ollama list

# Re-pull if needed
docker compose exec ollama ollama pull llama3.1:8b
```

**Out of memory:**
- Try a smaller model: `ollama/mistral:7b` or `ollama/phi:3b`
- Increase Docker memory limit in Docker Desktop settings

**Backend can't connect to Ollama:**
```bash
# Check Ollama is running
docker compose logs ollama

# Restart services
docker compose restart backend
```

---

## 📌 Roadmap

- ✅ **Phase 0**: Project Initialization (COMPLETE!)
  - Backend: FastAPI + SQLAlchemy + Alembic
  - Frontend: React + TypeScript + Vite + TailwindCSS
  - CI/CD: GitHub Actions workflows
  - Development environment and documentation

- ✅ **Phase 1**: Core recipe library (COMPLETE!)
  - Backend: Database models, schemas, services, REST API endpoints
  - Frontend: Recipe CRUD UI, search/filter, authentication
  - Features: User auth, recipe management, libraries, sharing
  - JWT authentication with bcrypt password hashing
  - Full CRUD operations with pagination and filtering
  - **Testing: 166 tests implemented (162 passing)**
    - Backend: 147 tests with 78% coverage (all services at 100%)
    - Frontend: 19 authentication tests (15 passing)

- **Phase 2**: AI recipe builder & semantic recipe search - NEXT
- Phase 3: Meal planning + grocery list generator
- Phase 4: Grocery store optimization & shopping assistant
- Phase 5: Interactive step-by-step cooking mode
- Phase 6: Calendar & smart home integrations
- Phase 7: Mobile app (PWA → Capacitor → React Native)

### Issue Tracking

This project uses [beads](https://github.com/anthropics/beads) for roadmap and issue tracking:

```bash
bd ready              # Show issues ready to work on
bd list --status=all  # List all issues (open, closed, etc.)
bd stats              # Project statistics
```

See `docs/archive/master_implementation_plan_v1.md` for historical phase details.

## 🤝 Contributing
Contributions are welcome!

- Fork the repo
- Make your changes
- Open a PR with a clear description

## 📜 License
This project is licensed under the MIT License.
