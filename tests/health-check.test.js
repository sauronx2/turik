import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Health Check - Smoke Tests', () => {
  it('server should start without errors', async () => {
    const serverPath = path.join(__dirname, '..', 'server', 'index.js');
    const TEST_PORT = 3333;
    
    return new Promise((resolve, reject) => {
      const serverProcess = spawn('node', [serverPath], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test', PORT: TEST_PORT }
      });

      let hasStarted = false;
      let hasCriticalError = false;

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('[Server]', output.trim());
        if (output.includes('Server running')) {
          hasStarted = true;
        }
      });

      serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log('[Server stderr]', output.trim());
        // Only fail on real errors, not warnings
        if (output.includes('Error:') && !output.includes('ExperimentalWarning')) {
          hasCriticalError = true;
        }
      });

      setTimeout(() => {
        serverProcess.kill();
        
        if (hasCriticalError) {
          reject(new Error('Server started with critical errors'));
        } else if (!hasStarted) {
          reject(new Error('Server did not start'));
        } else {
          resolve();
        }
      }, 3000);
    });
  }, 10000);

  it('client build should exist', () => {
    const fs = require('fs');
    const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
    const indexHtml = path.join(clientDistPath, 'index.html');
    
    expect(fs.existsSync(clientDistPath)).toBe(true);
    expect(fs.existsSync(indexHtml)).toBe(true);
  });

  it('server files should exist', () => {
    const fs = require('fs');
    const serverPath = path.join(__dirname, '..', 'server', 'index.js');
    
    expect(fs.existsSync(serverPath)).toBe(true);
  });
});

