import { defaultClientConditions, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", { compilationMode: "infer" }],
        ],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    conditions: ["@convex-dev/component-source", ...defaultClientConditions],
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    exclude: [
      ...configDefaults.exclude,
      // TODO: Reintroduce Workspace.spec.tsx and re-enable coverage once the local memory issue is resolved.
      "src/components/Workspace.spec.tsx",
    ],
  },
});
