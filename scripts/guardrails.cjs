#!/usr/bin/env node
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

const root = process.cwd();
const guardrailsPath = resolve(root, "AGENTS.md");

if (!existsSync(guardrailsPath)) {
  console.warn(
    "[guardrails] Warning: AGENTS.md missing. Ensure guardrails documentation is present.",
  );
} else {
  console.log("[guardrails] Guardrails doc present.");
}
