/** @type {import('ts-jest').JestConfigWithTsJest} */
const path = require("path");

module.exports = {
  rootDir: path.resolve(__dirname, "../../"),
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 30000,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  testMatch: [
    "<rootDir>/tests/telegram-e2e-tests/**/*.spec.ts",
    "<rootDir>/tests/telegram-e2e-tests/**/*.spec.tsx",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: path.resolve(__dirname, "coverage"),
  coverageProvider: "v8",
  collectCoverageFrom: [
    "<rootDir>/**/*.{ts,tsx,js,jsx}",
    "!<rootDir>/**/node_modules/**",
    "!<rootDir>/**/rxbot/**",
    "!<rootDir>/tests/**",
    "!<rootDir>/apps/**",
    "!<rootDir>/**/*.spec.{ts,tsx,js,jsx}",
    "!<rootDir>/**/*.d.*",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  // Added these three configurations to fix the module resolution
  moduleDirectories: ["node_modules", "<rootDir>/packages"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  modulePathIgnorePatterns: [
    "<rootDir>/packages/.*/dist",
    "<rootDir>/packages/.*/build",
  ],
};
