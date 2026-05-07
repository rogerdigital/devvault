import { describe, expect, it } from "vitest";

import { generateDevelopmentLogMarkdown } from "../../src/generators/developmentLog.js";
import type { ContributionRecord } from "../../src/types/contribution.js";
import type { PullRequestSnapshot } from "../../src/types/pr.js";

describe("generateDevelopmentLogMarkdown", () => {
  it("summarizes action items and merged contributions", () => {
    const markdown = generateDevelopmentLogMarkdown(
      [createPullRequest({ checkConclusion: "FAILURE" })],
      [createContribution()],
      new Date("2026-05-07T00:00:00Z")
    );

    expect(markdown).toContain("Generated at: 2026-05-07T00:00:00.000Z");
    expect(markdown).toContain("## Needs Action");
    expect(markdown).toContain("CI checks failed.");
    expect(markdown).toContain("## Recent Merged Contributions");
    expect(markdown).toContain("OpenClaw #74224: TUI | Resynced watchdog.");
  });
});

function createPullRequest(overrides: Partial<PullRequestSnapshot> = {}): PullRequestSnapshot {
  return {
    id: "PR_1",
    repo: "openclaw/openclaw",
    number: 78420,
    title: "fix(telegram): deduplicate MEDIA attachments",
    url: "https://github.com/openclaw/openclaw/pull/78420",
    author: "rogerdigital",
    state: "OPEN",
    isDraft: false,
    createdAt: "2026-05-07T00:00:00Z",
    updatedAt: "2026-05-07T00:00:00Z",
    labels: [],
    changedFiles: [],
    ...overrides
  };
}

function createContribution(overrides: Partial<ContributionRecord> = {}): ContributionRecord {
  return {
    id: "openclaw-openclaw-74224",
    project: "OpenClaw",
    repo: "openclaw/openclaw",
    pr: 74224,
    status: "merged",
    mergedAt: "2026-04-29T00:00:00Z",
    type: "bugfix",
    area: "TUI",
    impact: "Resynced watchdog.",
    links: {
      pr: "https://github.com/openclaw/openclaw/pull/74224"
    },
    tags: ["open-source", "tui"],
    resumeReady: true,
    homepageReady: true,
    ...overrides
  };
}
