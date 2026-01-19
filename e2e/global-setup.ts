import type { FullConfig } from '@playwright/test';

// E2E uses different ports to avoid conflicts with dev servers
const E2E_BACKEND_PORT = 8001;
const E2E_FRONTEND_PORT = 5174;

// Helper to wait for a URL to be ready
async function waitForUrl(url: string, name: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`${name} is ready`);
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

// Verify E2E_TESTING mode is active on the backend
async function verifyE2EMode(): Promise<void> {
  try {
    // Try to register a test user - if E2E_TESTING is set, the DB will be fresh
    // We'll just check that registration endpoint returns expected status
    const response = await fetch(`http://localhost:${E2E_BACKEND_PORT}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'e2e-verify@test.com',
        password: 'TestPass123!',
        name: 'E2E Verify User',
      }),
    });

    // 201 = created (fresh DB), 400 = already exists (not fresh)
    if (response.status === 201) {
      console.log('E2E_TESTING mode verified (fresh database)');
    } else if (response.status === 400) {
      const data = await response.json();
      if (data.detail?.includes('already registered')) {
        console.warn('WARNING: Database not fresh - server may not have E2E_TESTING=true');
        console.warn('If tests fail, ensure no dev servers are running on port', E2E_BACKEND_PORT);
      }
    }
  } catch (error) {
    console.warn('Could not verify E2E mode:', error);
  }
}

async function globalSetup(_config: FullConfig) {
  console.log('Starting E2E test environment setup...');
  console.log(`Backend port: ${E2E_BACKEND_PORT}, Frontend port: ${E2E_FRONTEND_PORT}`);

  // Wait for backend health check using native fetch (no browser needed)
  console.log('Waiting for backend server...');
  const backendReady = await waitForUrl(
    `http://localhost:${E2E_BACKEND_PORT}/api/v1/health`,
    'Backend server'
  );

  if (!backendReady) {
    throw new Error(
      `Backend server failed to start on port ${E2E_BACKEND_PORT}. ` +
        'Ensure no other server is using this port.'
    );
  }

  // Verify E2E mode is active
  await verifyE2EMode();

  // Wait for frontend
  console.log('Waiting for frontend server...');
  const frontendReady = await waitForUrl(
    `http://localhost:${E2E_FRONTEND_PORT}`,
    'Frontend server'
  );

  if (!frontendReady) {
    throw new Error(
      `Frontend server failed to start on port ${E2E_FRONTEND_PORT}. ` +
        'Ensure no other server is using this port.'
    );
  }

  console.log('E2E test environment ready!');
}

export default globalSetup;
