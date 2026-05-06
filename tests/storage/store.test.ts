import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createStore } from "../../src/storage/store.js";
import type { ContributionRecord } from "../../src/types/contribution.js";
import type { PullRequestSnapshot } from "../../src/types/pr.js";
import { createTempDirectory, removeTempDirectory } from "../helpers/tempDir.js";

let tempDirectory: string | undefined;

afterEach(async () => {
  if (tempDirectory) {
    await removeTempDirectory(tempDirectory);
    tempDirectory = undefined;
  }
});

describe("createStore", () => {
  it("returns empty arrays when store files are missing", async () => {
    tempDirectory = await createTempDirectory();
    const store = createStore(tempDirectory);

    await expect(store.readPullRequests()).resolves.toEqual([]);
    await expect(store.readContributions()).resolves.toEqual([]);
  });

  it("writes pull requests with deterministic ordering", async () => {
    tempDirectory = await createTempDirectory();
    const store = createStore(tempDirectory);

    await store.writePullRequests([
      createPullRequest({ repo: "zeta/project", number: 2 }),
      createPullRequest({ repo: "alpha/project", number: 4 }),
      createPullRequest({ repo: "alpha/project", number: 1 })
    ]);

    await expect(store.readPullRequests()).resolves.toMatchObject([
      { repo: "alpha/project", number: 1 },
      { repo: "alpha/project", number: 4 },
      { repo: "zeta/project", number: 2 }
    ]);
  });

  it("writes contributions with deterministic ordering", async () => {
    tempDirectory = await createTempDirectory();
    const store = createStore(tempDirectory);

    await store.writeContributions([
      createContribution({ id: "older", mergedAt: "2026-01-01" }),
      createContribution({ id: "newer", mergedAt: "2026-02-01" })
    ]);

    const contents = await readFile(path.join(tempDirectory, "data", "contributions.json"), "utf8");

    expect(contents.endsWith("\n")).toBe(true);
    await expect(store.readContributions()).resolves.toMatchObject([
      { id: "newer" },
      { id: "older" }
    ]);
  });
});

function createPullRequest(overrides: Partial<PullRequestSnapshot> = {}): PullRequestSnapshot {
  return {
    id: `${overrides.repo ?? "owner/repo"}#${overrides.number ?? 1}`,
    repo: "owner/repo",
    number: 1,
    title: "Test PR",
    url: "https://github.com/owner/repo/pull/1",
    author: "rogerdigital",
    state: "OPEN",
    isDraft: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    labels: [],
    changedFiles: [],
    ...overrides
  };
}

function createContribution(overrides: Partial<ContributionRecord> = {}): ContributionRecord {
  return {
    id: "owner-repo-1",
    project: "Repo",
    repo: "owner/repo",
    pr: 1,
    status: "merged",
    mergedAt: "2026-01-01",
    type: "bugfix",
    area: "Core",
    impact: "Fixed a bug.",
    links: {
      pr: "https://github.com/owner/repo/pull/1"
    },
    tags: [],
    resumeReady: true,
    homepageReady: true,
    ...overrides
  };
}
