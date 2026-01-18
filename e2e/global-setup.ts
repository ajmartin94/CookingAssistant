import type { FullConfig } from '@playwright/test';

// Helper to wait for a URL to be ready
async function waitForUrl(url: string, name: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ ${name} is ready`);
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting E2E test environment setup...');

  // Wait for backend health check using native fetch (no browser needed)
  console.log('⏳ Waiting for backend server...');
  const backendReady = await waitForUrl('http://localhost:8000/api/v1/health', 'Backend server');

  if (!backendReady) {
    throw new Error('❌ Backend server failed to start');
  }

  // Wait for frontend
  console.log('⏳ Waiting for frontend server...');
  const frontendReady = await waitForUrl('http://localhost:5173', 'Frontend server');

  if (!frontendReady) {
    throw new Error('❌ Frontend server failed to start');
  }

  console.log('✅ E2E test environment ready!');
}

export default globalSetup;
