import { readdirSync, statSync, readFileSync } from "node:fs";
import {
  resolve,
  relative,
  basename as pathBasename,
  extname,
} from "node:path";

const ROOT = resolve(process.cwd());
const SRC_DIR = resolve(ROOT, "src");
const CLIENT_FEATURES_DIR = resolve(SRC_DIR, "features");
const CONVEX_DIR = resolve(ROOT, "convex");

const INFRA_SERVER_FILES = new Set(["http.ts", "auth.ts", "config.ts"]);
const NAME_PATTERN = /^[A-Za-z0-9_]+$/;

const log = (message) => console.log(`[consistency] ${message}`);
const error = (message) => console.error(`[consistency] ${message}`);

function safeStat(path) {
  try {
    return statSync(path);
  } catch {
    return undefined;
  }
}

function isDirectory(path) {
  const s = safeStat(path);
  return s?.isDirectory() ?? false;
}

function isFile(path) {
  const s = safeStat(path);
  return s?.isFile() ?? false;
}

function loadAllowlist() {
  const configPath = resolve(ROOT, "scripts", "consistency-check.config.json");
  if (!isFile(configPath)) {
    return { clientOnly: new Set(), serverOnly: new Set() };
  }

  try {
    const data = JSON.parse(readFileSync(configPath, "utf8"));
    const clientOnly = Array.isArray(data.clientOnly)
      ? new Set(data.clientOnly)
      : new Set();
    const serverOnly = Array.isArray(data.serverOnly)
      ? new Set(data.serverOnly)
      : new Set();
    return { clientOnly, serverOnly };
  } catch (e) {
    error(
      `Failed to parse scripts/consistency-check.config.json: ${e.message}`,
    );
    return { clientOnly: new Set(), serverOnly: new Set() };
  }
}

function collectClientFeatures() {
  const features = new Map();
  if (!isDirectory(CLIENT_FEATURES_DIR)) {
    return features;
  }

  const entries = readdirSync(CLIENT_FEATURES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (!NAME_PATTERN.test(name)) continue;

    const featureDir = resolve(CLIENT_FEATURES_DIR, name);
    const sentinelPath = resolve(featureDir, ".client-only");
    const clientOnly = isFile(sentinelPath);

    features.set(name, {
      path: featureDir,
      clientOnly,
    });
  }

  return features;
}

function isGeneratedServerPath(absPath) {
  const rel = relative(CONVEX_DIR, absPath);
  return rel.startsWith("_generated");
}

function collectServerFeatures() {
  const features = new Map();
  if (!isDirectory(CONVEX_DIR)) {
    return features;
  }

  const entries = readdirSync(CONVEX_DIR, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    if (name === "_generated") continue;

    if (entry.isDirectory()) {
      if (!NAME_PATTERN.test(name)) continue;
      const folder = resolve(CONVEX_DIR, name);
      const indexFile = resolve(folder, "index.ts");
      const sentinelPath = resolve(folder, ".server-only");
      const serverOnly = isFile(sentinelPath);

      if (isFile(indexFile)) {
        features.set(name, {
          modulePath: relative(CONVEX_DIR, indexFile),
          serverOnly,
        });
      }

      continue;
    }

    if (!entry.isFile()) continue;
    if (INFRA_SERVER_FILES.has(name)) continue;
    if (extname(name) !== ".ts") continue;

    const basename = pathBasename(name, ".ts");
    if (!NAME_PATTERN.test(basename)) continue;

    const absModulePath = resolve(CONVEX_DIR, name);
    if (isGeneratedServerPath(absModulePath)) continue;

    const sentinelPath = resolve(CONVEX_DIR, `${basename}.server-only`);
    const serverOnly = isFile(sentinelPath);

    features.set(basename, {
      modulePath: relative(CONVEX_DIR, name),
      serverOnly,
    });
  }

  return features;
}

function main() {
  const allowlist = loadAllowlist();
  const clientFeatures = collectClientFeatures();
  const serverFeatures = collectServerFeatures();
  const problems = [];

  for (const [name, info] of clientFeatures) {
    const allowedClientOnly = info.clientOnly || allowlist.clientOnly.has(name);
    if (allowedClientOnly) continue;

    if (!serverFeatures.has(name)) {
      problems.push(
        `Missing server module for client feature "${name}". Expected convex/${name}.ts or convex/${name}/index.ts. ` +
          `Mark as client-only with src/features/${name}/.client-only or allowlist.`,
      );
    }
  }

  for (const [name, info] of serverFeatures) {
    const moduleName = info.modulePath;
    if (INFRA_SERVER_FILES.has(moduleName)) continue;

    const allowedServerOnly = info.serverOnly || allowlist.serverOnly.has(name);
    if (allowedServerOnly) continue;

    if (!clientFeatures.has(name)) {
      problems.push(
        `Missing client folder for server feature "${name}". Expected src/features/${name}/. ` +
          `Mark as server-only with convex/${name}/.server-only or convex/${name}.server-only or allowlist.`,
      );
    }
  }

  if (problems.length > 0) {
    error("Feature parity check failed:");
    for (const message of problems) {
      error(` - ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  log("Feature parity OK.");
}

main();
