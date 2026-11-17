import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "proveedores.ui.spec.ts",
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: process.env["E2E_BASE_URL"] || "http://localhost:4201",
    trace: "retain-on-failure",
  },
});
