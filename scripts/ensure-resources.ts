import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { resourcesRoot } from "../lib/resourcesRoot";

loadEnvConfig(process.cwd());

const DEFAULT_RESOURCES_DIR = path.join(process.cwd(), "resources");

function enDir(): string {
  return path.join(resourcesRoot(), "en");
}

function enHasCatalogMarkdown(): boolean {
  const dir = enDir();
  if (!fs.existsSync(dir)) return false;
  return fs
    .readdirSync(dir)
    .some((name) => name.endsWith(".md") && name !== "0_me.md");
}

function authenticatedCloneUrl(url: string, token: string | undefined): string {
  if (!token) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return url;
    parsed.username = "x-access-token";
    parsed.password = token;
    return parsed.toString();
  } catch {
    return url;
  }
}

function resolveCloneLayout(cloneRoot: string): string {
  const nested = path.join(cloneRoot, "resources", "en");
  if (fs.existsSync(nested)) return path.join(cloneRoot, "resources");
  const atRoot = path.join(cloneRoot, "en");
  if (fs.existsSync(atRoot)) return cloneRoot;
  throw new Error(
    `Cloned repository has no resources layout (expected resources/en/ or en/ at repo root).`,
  );
}

function fetchFromGit(): void {
  const url = process.env.RESOURCES_GIT_URL?.trim();
  if (!url) {
    throw new Error(
      "Missing study notes: notes en/ is empty and RESOURCES_GIT_URL is not set.\n" +
        "For local dev, set MYCONSPECT_NOTES_ROOT=../mc-content in mc-app/.env.local " +
        "or keep resources/ on disk.\n" +
        "For Vercel/CI, set RESOURCES_GIT_URL (+ RESOURCES_GIT_TOKEN for a private repo). See README § CI/CD.",
    );
  }

  const ref = process.env.RESOURCES_GIT_REF?.trim() || "main";
  const token = process.env.RESOURCES_GIT_TOKEN?.trim();
  const cloneUrl = authenticatedCloneUrl(url, token);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "myconspect-resources-"));

  try {
    execFileSync(
      "git",
      ["clone", "--depth", "1", "--branch", ref, cloneUrl, tmp],
      { stdio: "inherit" },
    );
    const commit = execFileSync("git", ["-C", tmp, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
    const sourceRoot = resolveCloneLayout(tmp);
    fs.rmSync(DEFAULT_RESOURCES_DIR, { recursive: true, force: true });
    fs.cpSync(sourceRoot, DEFAULT_RESOURCES_DIR, { recursive: true });
    console.log(
      `ensure-resources: fetched ref "${ref}" (${commit}) from ${url}`,
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (!enHasCatalogMarkdown()) {
    throw new Error(
      `Fetched repository did not produce catalog markdown under en/.`,
    );
  }
}

function shouldFetchInCi(): boolean {
  return (
    process.env.CI === "true" &&
    Boolean(process.env.RESOURCES_GIT_URL?.trim()) &&
    !process.env.MYCONSPECT_NOTES_ROOT?.trim()
  );
}

function main(): void {
  if (shouldFetchInCi()) {
    fetchFromGit();
    return;
  }

  if (enHasCatalogMarkdown()) {
    const root = resourcesRoot();
    const viaEnv = Boolean(process.env.MYCONSPECT_NOTES_ROOT?.trim());
    console.log(
      viaEnv
        ? `ensure-resources: using MYCONSPECT_NOTES_ROOT (${root})`
        : `ensure-resources: using local resources/ (${root})`,
    );
    return;
  }

  if (process.env.MYCONSPECT_NOTES_ROOT?.trim()) {
    throw new Error(
      `MYCONSPECT_NOTES_ROOT points to ${resourcesRoot()} but en/ has no catalog markdown.`,
    );
  }

  fetchFromGit();
}

main();
