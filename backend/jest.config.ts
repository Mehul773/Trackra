import type { Config } from 'jest';

/**
 * Jest Configuration for a strict TypeScript environment.
 *
 * We use `ts-jest` preset to allow Jest to run our TypeScript test files
 * directly without needing a manual compilation step.
 */
const config: Config = {
  // Use ts-jest preset to compile TS on-the-fly
  preset: 'ts-jest',

  // The test environment that will be used for testing (node.js for APIs)
  testEnvironment: 'node',

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Run tests in sequential order (in-band) to prevent DB/mock pollution
  maxWorkers: 1,

  // The root directory that Jest should scan for tests
  roots: ['<rootDir>/src'],

  // File path to a module that runs code to configure or set up the testing framework
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],

  // Pattern to find test files
  testMatch: ['**/tests/**/*.test.ts'],

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};

export default config;
