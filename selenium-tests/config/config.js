import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env from root
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:5173',
  timeout: parseInt(process.env.TEST_TIMEOUT || '10000', 10),
  headless: process.env.TEST_HEADLESS === 'true',
  chromeDriverPath: process.env.CHROME_DRIVER_PATH || null,
  
  // Folders relative to root workspace
  paths: {
    screenshots: path.join(rootDir, 'selenium-tests', 'screenshots'),
    reports: path.join(rootDir, 'selenium-tests', 'reports'),
    excel: path.join(rootDir, 'selenium-tests', 'reports', 'excel'),
    logs: path.join(rootDir, 'selenium-tests', 'logs'),
  },
  
  // Default test credentials
  credentials: {
    defaultPassword: 'admin123',
    patientEmail: 'admin@gmail.com',
    caregiverEmail: 'admin@gmail.com',
  }
};
