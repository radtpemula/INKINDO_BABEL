// scripts/test-db-helper.ts
// Test database isolation helper for INKINDO BABEL
// Ensures tests run against isolated inkindo_test_db, NEVER inkindo_babel_db

import { execSync } from "child_process";

export function getTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }

  let pwd = process.env.MYSQL_PASSWORD;
  if (!pwd) {
    try {
      pwd = execSync("sg docker -c 'docker exec inkindo-babel-mysql printenv MYSQL_PASSWORD'", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
    } catch {
      // Fall through
    }
  }

  if (!pwd) {
    throw new Error("Unable to obtain MYSQL_PASSWORD for isolated test database.");
  }

  return `mysql://inkindo_user:${encodeURIComponent(pwd)}@127.0.0.1:3306/inkindo_test_db`;
}

export function setupTestEnvironment(): string {
  const testUrl = getTestDatabaseUrl();
  process.env.DATABASE_URL = testUrl;
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    process.env.SESSION_SECRET = "inkindo-test-secret-0123456789abcdef0123456789abcdef";
  }
  return testUrl;
}
