import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./e2e',testMatch:'clientes.ui.spec.ts',workers:1,timeout:60_000,
 use:{baseURL:'http://127.0.0.1:4301',channel:'msedge',headless:true,trace:'off'},
 webServer:{command:'npm start -- --host 127.0.0.1 --port 4301',url:'http://127.0.0.1:4301',reuseExistingServer:false,timeout:120_000}});
