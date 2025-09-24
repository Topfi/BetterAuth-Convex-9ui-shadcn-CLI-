import { spawnSync, spawn } from "node:child_process";
import { access, chmod, mkdir, rm } from "node:fs/promises";
import {
  constants as fsConstants,
  createWriteStream,
  mkdtempSync,
} from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { tmpdir } from "node:os";

const VERSION = "8.28.0";
const CACHE_ROOT = path.join(process.cwd(), "node_modules/.cache/gitleaks");

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveExistingBinary() {
  const envBin = process.env.GITLEAKS_BIN;
  if (envBin) {
    const check = spawnSync(envBin, ["version"], { stdio: "ignore" });
    if (check.status === 0) {
      return envBin;
    }
    console.warn(
      `[gitleaks] Ignoring GITLEAKS_BIN override; failed to execute ${envBin}.`,
    );
  }

  const check = spawnSync("gitleaks", ["version"], { stdio: "ignore" });
  if (check.status === 0) {
    return "gitleaks";
  }

  return null;
}

function getTargetInfo() {
  const platformMap = { darwin: "darwin", linux: "linux" };
  const archMap = { arm64: "arm64", x64: "x64" };

  const platform = platformMap[process.platform];
  const arch = archMap[process.arch];

  if (!platform || !arch) {
    throw new Error(
      `Unsupported platform or architecture: ${process.platform}-${process.arch}`,
    );
  }

  return { platform, arch };
}

async function downloadBinary() {
  const { platform, arch } = getTargetInfo();
  const cacheDir = path.join(CACHE_ROOT, VERSION, `${platform}-${arch}`);
  const binaryPath = path.join(cacheDir, "gitleaks");

  if (await fileExists(binaryPath)) {
    return binaryPath;
  }

  await mkdir(cacheDir, { recursive: true });

  const assetName = `gitleaks_${VERSION}_${platform}_${arch}.tar.gz`;
  const downloadUrl = `https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}/${assetName}`;

  console.log(`[gitleaks] Downloading ${downloadUrl}`);

  const response = await fetch(downloadUrl);
  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to download gitleaks: ${response.status} ${response.statusText}`,
    );
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), "gitleaks-"));
  const archivePath = path.join(tempDir, assetName);

  await pipeline(
    Readable.fromWeb(response.body),
    createWriteStream(archivePath),
  );

  const extract = spawnSync("tar", ["-xzf", archivePath, "-C", cacheDir]);
  if (extract.status !== 0) {
    const stderr = extract.stderr?.toString() || "unknown error";
    throw new Error(`Failed to extract gitleaks archive: ${stderr}`);
  }

  await chmod(binaryPath, 0o755);
  await rm(tempDir, { recursive: true, force: true });

  return binaryPath;
}

async function ensureBinary() {
  const existing = resolveExistingBinary();
  if (existing) {
    return existing;
  }

  return downloadBinary();
}

async function main() {
  const args = process.argv.slice(2);
  const binary = await ensureBinary();

  const child = spawn(binary, args, { stdio: "inherit" });
  child.on("error", (error) => {
    console.error("[gitleaks] Failed to run gitleaks:", error);
    process.exit(1);
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error("[gitleaks] Unexpected error:", error);
  process.exit(1);
});
