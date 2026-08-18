import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  forceExit: true,
  setupFiles: ['<rootDir>/tests/setup.ts'],
};

export default config;