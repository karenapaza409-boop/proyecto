import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", testMatch: "proveedores.ui.spec.ts", workers: 1, timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:4300", channel: "msedge", headless: true, trace: "off" },
  webServer: { command: "npm start -- --host 127.0.0.1 --port 4300", url: "http://127.0.0.1:4300", reuseExistingServer: false, timeout: 120_000 },
});
