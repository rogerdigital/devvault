import { describe, expect, it } from "vitest";

import { buildActivityReport, parseSinceOption } from "../../src/core/activityReport.js";
import type { ContributionRecord } from "../../src/types/contribution.js";
import type { PullRequestSnapshot } from "../../src/types/pr.js";

describe("parseSinceOption", () => {
  const now = new Date("2026-05-07T12:00:00Z");

  it("defaults to seven days", () => {
    expect(parseSinceOption(undefined, now).toISOString()).toBe("2026-04-30T12:00:00.000Z");
  });

  it("parses hour, day, and week durations", () => {
    expect(parseSinceOption("24h", now).toISOString()).toBe("2026-05-06T12:00:00.000Z");
    expect(parseSinceOption("2d", now).toISOString()).toBe("2026-05-05T12:00:00.000Z");
    expect(parseSinceOption("2w", now).toISOString()).toBe("2026-04-23T12:00:00.000Z");
  });

  it("rejects invalid values", () => {
    expect(() => parseSinceOption("soon", now)).toThrow("Invalid --since value");
  });
});

describe("buildActivityReport", () => {
  it("keeps current needs-action PRs while filtering recent activity by time window", () => {
    const report = buildActivityReport({
      pullRequests: [
        createPullRequest({
          number: 1,
          updatedAt: "2026-04-01T00:00:00Z",
          checkConclusion: "FAILURE"
        }),
        createPullRequest({
          number: 2,
          updatedAt: "2026-05-07T00:00:00Z",
          checkConclusion: "SUCCESS"
        })
      ],
      contributions: [
        createContribution({
          pr: 1,
          mergedAt: "2026-04-01T00:00:00Z"
        }),
        createContribution({
          pr: 2,
          mergedAt: "2026-05-07T00:00:00Z"
        })
      ],
      since: new Date("2026-05-01T00:00:00Z")
    });

    expect(report.currentNeedsAction.map((item) => item.pr.number)).toEqual([1]);
    expect(report.recentPullRequests.map((pr) => pr.number)).toEqual([2]);
    expect(report.recentContributions.map((contribution) => contribution.pr)).toEqual([2]);
    expect(report.homepageReadyContributions.map((contribution) => contribution.pr)).toEqual([2]);
  });
});

function createPullRequest(overrides: Partial<PullRequestSnapshot> = {}): PullRequestSnapshot {
  return {
    id: `PR_${overrides.number ?? 1}`,
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
    id: `owner-repo-${overrides.pr ?? 1}`,
    project: "Repo",
    repo: "owner/repo",
    pr: 1,
    status: "merged",
    mergedAt: "2026-05-07T00:00:00Z",
    type: "bugfix",
    area: "Core",
    impact: "Fixed behavior.",
    links: {
      pr: "https://github.com/owner/repo/pull/1"
    },
    tags: ["open-source"],
    resumeReady: true,
    homepageReady: true,
    ...overrides
  };
}
