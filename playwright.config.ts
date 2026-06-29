import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// This tells Playwright where your English steps and features live
const bddTestDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
});

export default defineConfig({
  // 👇 Global configurations applied across all suites
  reporter: [
    ['html'], 
    ['./DashboardReporter.ts'] // Keeps your custom executive dashboard functional
  ],
  
  fullyParallel: false, // Keeping your instructor's sequential execution rule
  workers: 1,           // Forces tests to run one at a time in a single tab instance
  
  use: {
    headless: false,    // Keep this false so you can watch the browser execute live!
    screenshot: 'only-on-failure',
    actionTimeout: 0,
    trace: 'on-first-retry',
  },

  // 🎯 THE FIX: Splitting your automation framework into dedicated execution tracks
  projects: [
    {
      name: 'BDD_UI_Testing',
      testDir: bddTestDir, // Targets only the auto-generated Cucumber spec files
    },
    {
      name: 'Backend_API_Testing',
      testDir: './API testing', // Directs Playwright straight to your API folder
      testMatch: '**/*.spec.ts',
    },
  ],
});