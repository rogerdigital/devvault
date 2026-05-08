import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

import type { DevVaultConfig } from "../types/config.js";
import { parseDevVaultConfig } from "./schema.js";

export type LoadConfigOptions = {
  cwd?: string;
  configPath?: string;
};

export async function loadConfig(options: LoadConfigOptions = {}): Promise<DevVaultConfig> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = options.configPath
    ? path.resolve(cwd, options.configPath)
    : path.join(cwd, "config.yaml");
  const rawConfig = await readConfigFile(configPath);

  return parseDevVaultConfig(parse(rawConfig));
}

async function readConfigFile(configPath: string): Promise<string> {
  try {
    return await readFile(configPath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new Error(
        `DevVault config was not found at ${configPath}.\nNext: run devvault init --username <github-user> --repo owner/name.`
      );
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
