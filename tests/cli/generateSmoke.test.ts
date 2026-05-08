import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runGenerateCommand } from "../../src/cli/commands/generate.js";
import { runInitCommand } from "../../src/cli/commands/init.js";
import { createTempDirectory, removeTempDirectory } from "../helpers/tempDir.js";

let tempDirectory: string | undefined;
const originalCwd = process.cwd();

afterEach(async () => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();

  if (tempDirectory) {
    await removeTempDirectory(tempDirectory);
    tempDirectory = undefined;
  }
});

describe("CLI smoke", () => {
  it("initializes config and generates Markdown assets from stored PR data", async () => {
    tempDirectory = await createTempDirectory();
    process.chdir(tempDirectory);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    await runInitCommand({
      username: "rogerdigital",
      repo: ["openclaw/openclaw"]
    });
    await mkdir(path.join(tempDirectory, "data"), { recursive: true });
    await writeFile(path.join(tempDirectory, "data", "prs.json"), JSON.stringify([createMergedPr()]), "utf8");

    await runGenerateCommand();

    await expect(readFile(path.join(tempDirectory, "config.yaml"), "utf8")).resolves.toContain(
      "username: rogerdigital"
    );
    await expect(readFile(path.join(tempDirectory, "output", "contributions.md"), "utf8")).resolves.toContain(
      "### PR #1 - TUI"
    );
    await expect(readFile(path.join(tempDirectory, "output", "devlog.md"), "utf8")).resolves.toContain(
      "Recent Merged Contributions"
    );
    await expect(
      readFile(path.join(tempDirectory, "output", "website", "index.md"), "utf8")
    ).resolves.toContain("rogerdigital");
  });
});

function createMergedPr() {
  return {
    id: "PR_1",
    repo: "openclaw/openclaw",
    number: 1,
    title: "fix(tui): resync streaming watchdog",
    body: "Resyncs the watchdog after reconnect.",
    url: "https://github.com/openclaw/openclaw/pull/1",
    author: "rogerdigital",
    headRefName: "fix-watchdog",
    state: "MERGED",
    isDraft: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    mergedAt: "2026-01-02T00:00:00Z",
    labels: ["bug"],
    changedFiles: ["packages/tui/watchdog.ts"]
  };
}
