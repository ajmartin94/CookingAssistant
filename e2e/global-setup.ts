import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test environment setup...');

  // Clean up old test database
  const testDbPath = path.join(__dirname, '..', 'backend', 'cooking_assistant_test_e2e.db');
  if (fs.existsSync(testDbPath)) {
    console.log('🗑️  Removing old test database...');
    fs.unlinkSync(testDbPath);
  }

  // Wait for backend health check
  console.log('⏳ Waiting for backend server...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let backendReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const response = await page.goto('http://localhost:8000/api/v1/health');
      if (response?.ok()) {
        console.log('✅ Backend server is ready');
        backendReady = true;
        break;
      }
    } catch {
      await page.waitForTimeout(1000);
    }
  }

  if (!backendReady) {
    await browser.close();
    throw new Error('❌ Backend server failed to start');
  }

  // Wait for frontend
  console.log('⏳ Waiting for frontend server...');
  let frontendReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const response = await page.goto('http://localhost:5173');
      if (response?.ok()) {
        console.log('✅ Frontend server is ready');
        frontendReady = true;
        break;
      }
    } catch {
      await page.waitForTimeout(1000);
    }
  }

  if (!frontendReady) {
    await browser.close();
    throw new Error('❌ Frontend server failed to start');
  }

  await browser.close();
  console.log('✅ E2E test environment ready!');
}

export default globalSetup;
