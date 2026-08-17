import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for HirelyStreet — outputs to dist/, which Capacitor packages into the Android app.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allow access from a phone/emulator on the same network during development
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
});
