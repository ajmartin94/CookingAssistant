import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Cooking Assistant E2E Tests
 *
 * This configuration:
 * - Starts backend (FastAPI) and frontend (Vite) servers before tests
 * - Uses a test-specific SQLite database
 * - Runs tests in parallel across multiple browsers
 * - Generates HTML reports and traces on failure
 */
export default defineConfig({
  testDir: './e2e/tests',
  testMatch: '**/*.spec.ts',
  timeout: 30 * 1000, // 30 seconds per test
  expect: { timeout: 5 * 1000 }, // 5 seconds for assertions
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['html', { outputFolder: 'e2e/reports/html' }],
    ['json', { outputFile: 'e2e/reports/results.json' }],
    ['junit', { outputFile: 'e2e/reports/junit.xml' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    // Smoke tests run FIRST - if they fail, nothing else runs
    {
      name: 'smoke',
      testDir: './e2e/tests/smoke',
      testMatch: '**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    // Browser tests depend on smoke - won't run if smoke fails
    {
      name: 'chromium',
      dependencies: ['smoke'],
      testDir: './e2e/tests',
      testIgnore: '**/smoke/**',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      dependencies: ['smoke'],
      testDir: './e2e/tests',
      testIgnore: '**/smoke/**',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      dependencies: ['smoke'],
      testDir: './e2e/tests',
      testIgnore: '**/smoke/**',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // CRITICAL: Start both servers before tests
  webServer: [
    {
      // In CI, Python packages are installed globally; locally we use venv
      command: process.env.CI
        ? 'cd backend && python -m app.main'
        : process.platform === 'win32'
          ? 'cd backend && venv\\Scripts\\python.exe -m app.main'
          : 'cd backend && . venv/bin/activate && python -m app.main',
      url: 'http://localhost:8000/api/v1/health',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      cwd: process.cwd(),
      env: {
        DATABASE_URL: 'sqlite+aiosqlite:///./cooking_assistant_test_e2e.db',
        SECRET_KEY: 'test-secret-key-for-e2e-testing-only',
        CORS_ORIGINS: '["http://localhost:5173"]',
        E2E_TESTING: 'true',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      cwd: './frontend',
      env: {
        VITE_API_URL: 'http://localhost:8000',
      },
    },
  ],

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
});
