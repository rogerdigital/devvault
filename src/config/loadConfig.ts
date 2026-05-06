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
  const rawConfig = await readFile(configPath, "utf8");

  return parseDevVaultConfig(parse(rawConfig));
}
