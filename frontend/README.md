# Cooking Assistant - Frontend

React + TypeScript + Vite frontend for the Cooking Assistant application.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration (e.g., API URL)
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:5173

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code with ESLint

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **Zustand** - State management

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── common/      # Shared components
│   │   ├── recipes/     # Recipe components
│   │   ├── planning/    # Planning components
│   │   └── cooking/     # Cooking mode components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client functions
│   ├── utils/           # Helper functions
│   ├── contexts/        # React Context providers
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Application entry point
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link if needed

### Adding New Components

1. Create component in appropriate `src/components/` subdirectory
2. Export from component file
3. Import and use in parent component

### Working with API

1. Define types in `src/types/index.ts`
2. Create API functions in `src/services/`
3. Use in components with proper error handling

## Features

Currently implemented:
- ✅ Basic routing with React Router
- ✅ TailwindCSS styling
- ✅ API client setup with Axios
- ✅ TypeScript type definitions
- ✅ Home, Login, and Recipes pages

Coming in Phase 1:
- Recipe CRUD functionality
- Recipe libraries
- Recipe sharing
- User authentication
