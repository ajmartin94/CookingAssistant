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

### Local development

1. **Clone repo & install dependencies**
  ```bash
  git clone https://github.com/your-username/cooking-assistant.git
  cd cooking-assistant
  ```
   
2. **Backend (FastAPI + SQLite)**
  ```bash
  cd backend
  pip install -r requirements.txt
  uvicorn main:app --reload
  ```
  API runs at: http://localhost:8000

3. **Frontend (React + Vite)**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  App runs at: http://localhost:3000

## 📌 Roadmap

- Phase 1: Core recipe library (save, edit, share)
- Phase 2: AI recipe builder & semantic recipe search
- Phase 3: Meal planning + grocery list generator
- Phase 4: Grocery store optimization & shopping assistant
- Phase 5: Interactive step-by-step cooking mode
- Phase 6: Calendar & smart home integrations
- Phase 7: Mobile app (PWA → Capacitor → React Native)

## 🤝 Contributing
Contributions are welcome!

- Fork the repo
- Make your changes
- Open a PR with a clear description

## 📜 License
This project is licensed under the MIT License.
