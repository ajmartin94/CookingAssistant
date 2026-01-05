import fs from 'fs';
import path from 'path';

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...');

  const testDbPath = path.join(__dirname, '..', 'backend', 'cooking_assistant_test_e2e.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('✅ E2E test environment cleaned up');
}

export default globalTeardown;
