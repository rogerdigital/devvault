import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function createTempDirectory(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "devvault-test-"));
}

export async function removeTempDirectory(directory: string): Promise<void> {
  await rm(directory, { recursive: true, force: true });
}
