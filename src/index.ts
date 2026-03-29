// src/index.ts

import { startServer } from "./app/app";

startServer().catch((err) => {
  console.error("[startup] fatal error:", err);
  process.exit(1);
});