import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// This telling Playwright where your English steps and features live
const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
});

export default defineConfig({
  testDir,
  reporter: [['html', { open: 'never' }]],
  fullyParallel: false, // Keeping your instructor's sequential execution rule
  workers: 1,           // Running tests in 1 single browser tab instance
  use: {
    headless: false,    // Keep this false so you can watch the browser execute live!
    screenshot: 'on',
    /* Maximum time each action such as click can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    trace: 'on-first-retry',

    // 👇 ADD THIS BLOCK TO SLOW DOWN THE UI ACTIONS
    /*launchOptions: {
      slowMo: 15000, // Delays every action by 1000ms (1 second)
    },*/
  },
});