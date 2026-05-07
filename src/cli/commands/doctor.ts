import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadConfig } from "../../config/loadConfig.js";
import { resolveGitHubToken } from "../../github/auth.js";

type DoctorCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

export async function runDoctorCommand(): Promise<void> {
  const cwd = process.cwd();
  const checks: DoctorCheck[] = [];

  let config;
  try {
    await access(path.join(cwd, "config.yaml"));
    config = await loadConfig({ cwd });
    checks.push({ name: "config", ok: true, detail: "config.yaml loaded" });
  } catch (error) {
    checks.push({ name: "config", ok: false, detail: errorToMessage(error) });
  }

  if (config) {
    try {
      resolveGitHubToken({ tokenEnv: config.github.tokenEnv });
      checks.push({ name: "github token", ok: true, detail: `${config.github.tokenEnv} or gh auth is available` });
    } catch (error) {
      checks.push({ name: "github token", ok: false, detail: errorToMessage(error) });
    }

    checks.push({
      name: "repos",
      ok: config.repos.length > 0,
      detail: config.repos.length > 0 ? config.repos.join(", ") : "no repos configured"
    });

    checks.push(await checkWritableDirectory(cwd, "data"));
    checks.push(await checkWritableDirectory(cwd, config.output.directory));

    if (config.site?.syncDirectory) {
      const siteDirectory = path.resolve(cwd, config.site.syncDirectory);
      try {
        await access(siteDirectory);
        checks.push({ name: "site sync directory", ok: true, detail: siteDirectory });
      } catch {
        checks.push({ name: "site sync directory", ok: false, detail: `${siteDirectory} does not exist` });
      }
    } else {
      checks.push({
        name: "site sync directory",
        ok: true,
        detail: "not configured; DevVault will only write output/"
      });
    }
  }

  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }

  if (checks.some((check) => !check.ok)) {
    process.exitCode = 1;
  }
}

async function checkWritableDirectory(cwd: string, directory: string): Promise<DoctorCheck> {
  const resolved = path.resolve(cwd, directory);
  const probe = path.join(resolved, ".devvault-write-test");

  try {
    await mkdir(resolved, { recursive: true });
    await writeFile(probe, "ok", "utf8");
    return { name: `${directory} writable`, ok: true, detail: resolved };
  } catch (error) {
    return { name: `${directory} writable`, ok: false, detail: errorToMessage(error) };
  }
}

function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
