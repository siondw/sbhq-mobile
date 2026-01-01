/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.(ts|tsx|js)'],
  testPathIgnorePatterns: ['\\.stub\\.test\\.'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^expo-router$': '<rootDir>/tests/mocks/expo-router.ts',
    '^expo-notifications$': '<rootDir>/tests/mocks/expo-notifications.ts',
  },
};
