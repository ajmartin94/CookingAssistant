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

**E2E Tests (85+ tests - Playwright):**
```bash
npm run test:e2e         # Run all E2E tests (headless)
npm run test:e2e:ui      # Run with interactive UI (recommended)
npm run test:e2e:headed  # Run with visible browser
npm run test:e2e:debug   # Run in debug mode
```

Test Coverage:
- Authentication Tests: 13 tests (register, login, logout)
- Recipe CRUD Tests: 45 tests (create, list, detail, edit, delete)
- Workflow Tests: 3 tests (complete user journeys)
- Error Handling Tests: 24 tests (network errors, validation)
- Browsers: Chromium, Firefox, WebKit (Safari)

**Test Infrastructure:**
- Backend: pytest with async support, in-memory SQLite, comprehensive fixtures
- Frontend: Vitest + React Testing Library + MSW (Mock Service Worker)
- E2E: Playwright with real backend + frontend servers, cross-browser testing
- CI/CD: Automated testing on push and pull requests

**Total Test Count:** 437+ tests (352 unit/integration + 85 E2E)

For detailed E2E testing documentation, see [docs/E2E_TESTING.md](docs/E2E_TESTING.md)

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

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed phase breakdown.

## 🤝 Contributing
Contributions are welcome!

- Fork the repo
- Make your changes
- Open a PR with a clear description

## 📜 License
This project is licensed under the MIT License.
