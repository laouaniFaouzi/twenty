import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const FRONT_BASE_URL = process.env.FRONT_BASE_URL ?? 'http://localhost:3001';
const TWENTY_API_URL = process.env.TWENTY_API_URL ?? 'http://localhost:2020';
const TWENTY_API_KEY =
  process.env.TWENTY_API_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMDIwMjAyMC0xYzI1LTRkMDItYmYyNS02YWVjY2Y3ZWE0MTkiLCJ0eXBlIjoiQVBJX0tFWSIsIndvcmtzcGFjZUlkIjoiMjAyMDIwMjAtMWMyNS00ZDAyLWJmMjUtNmFlY2NmN2VhNDE5IiwiaWF0IjoxNzM1Njg5NjAwLCJleHAiOjQ4OTE0NDk2MDAsImp0aSI6IjIwMjAyMDIwLWY0MDEtNGQ4YS1hNzMxLTY0ZDAwN2MyN2JhZCJ9.bfQjfyN0NEtTCLE_xPyNcwonDzlSXFoP8kdCQTdnuDc';

// The app install in global setup and the API calls in the spec read these.
process.env.TWENTY_API_URL = TWENTY_API_URL;
process.env.TWENTY_API_KEY = TWENTY_API_KEY;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 180 * 1000,
  reporter: 'list',
  use: {
    baseURL: FRONT_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    testIdAttribute: 'data-testid',
  },
  expect: {
    timeout: 20_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        },
      },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.resolve(__dirname, 'e2e/.auth/user.json'),
        launchOptions: {
          // Lets sandboxed environments point at a preinstalled Chromium.
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        },
      },
      dependencies: ['setup'],
    },
  ],
});
