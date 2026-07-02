import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
base: "/",

plugins: [react()],

resolve: {
alias: {
"@": path.resolve(__dirname, "src"),
"@assets": path.resolve(__dirname, "..", "..", "attached_assets"),
},
dedupe: ["react", "react-dom"],
},

build: {
outDir: path.resolve(__dirname, "dist"),
emptyOutDir: true,
},

server: {
port: 5173,
host: "0.0.0.0",
open: true,
},

preview: {
port: 5173,
host: "0.0.0.0",
},
});
