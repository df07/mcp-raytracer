/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm', // Keep preset
  // extensionsToTreatAsEsm: ['.ts'], // Handled by preset
  moduleFileExtensions: ['ts', 'js', 'json', 'node'], // Added moduleFileExtensions
  testEnvironment: 'node',
  moduleNameMapper: {
    // Handle module paths ending with '.js' to map to TS files if needed (common in ESM)
    // This is important for resolving imports like '../src/index.js' in tests
    '^(\\.\\.?\\/.+)\\\.js$': '$1',
  },
  transform: { // Add back explicit transform
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true, 
        tsconfig: 'tsconfig.json' 
      },
    ],
  },
  // Specify test files pattern
  // testMatch: [
  //   '**/tests/**/*.test.ts'
  // ],
  roots: [
    // "<rootDir>/src", // Remove src from roots
    "<rootDir>/tests"
  ],
  // Optional: If you want coverage reports
  // collectCoverage: true,
  // coverageDirectory: "coverage",
  // coverageProvider: "v8", 
}; 