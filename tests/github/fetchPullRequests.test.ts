import { describe, expect, it } from "vitest";

import { normalizePullRequestNode } from "../../src/github/fetchPullRequests.js";

describe("normalizePullRequestNode", () => {
  it("normalizes open pull request metadata", () => {
    const pr = normalizePullRequestNode("openclaw/openclaw", {
      id: "PR_open",
      number: 10,
      title: "Fix reconnect watchdog",
      bodyText: "Body",
      url: "https://github.com/openclaw/openclaw/pull/10",
      state: "OPEN",
      isDraft: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
      mergeable: "MERGEABLE",
      reviewDecision: "REVIEW_REQUIRED",
      author: {
        login: "rogerdigital"
      },
      labels: {
        nodes: [{ name: "bug" }, { name: "tui" }]
      },
      files: {
        nodes: [{ path: "packages/tui/watchdog.ts" }]
      },
      commits: {
        nodes: [
          {
            commit: {
              statusCheckRollup: {
                state: "SUCCESS"
              }
            }
          }
        ]
      }
    });

    expect(pr).toMatchObject({
      repo: "openclaw/openclaw",
      number: 10,
      state: "OPEN",
      isDraft: false,
      reviewDecision: "REVIEW_REQUIRED",
      checkConclusion: "SUCCESS",
      labels: ["bug", "tui"],
      changedFiles: ["packages/tui/watchdog.ts"]
    });
  });

  it("normalizes draft pull requests", () => {
    const pr = normalizePullRequestNode("openclaw/openclaw", {
      id: "PR_draft",
      number: 11,
      title: "Draft",
      url: "https://github.com/openclaw/openclaw/pull/11",
      state: "OPEN",
      isDraft: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z"
    });

    expect(pr).toMatchObject({
      state: "OPEN",
      isDraft: true,
      checkConclusion: "UNKNOWN"
    });
  });

  it("normalizes merged pull requests", () => {
    const pr = normalizePullRequestNode("openclaw/openclaw", {
      id: "PR_merged",
      number: 12,
      title: "Merged",
      url: "https://github.com/openclaw/openclaw/pull/12",
      state: "MERGED",
      isDraft: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-03T00:00:00Z",
      mergedAt: "2026-01-03T00:00:00Z",
      commits: {
        nodes: [
          {
            commit: {
              statusCheckRollup: {
                state: "FAILURE"
              }
            }
          }
        ]
      }
    });

    expect(pr).toMatchObject({
      state: "MERGED",
      mergedAt: "2026-01-03T00:00:00Z",
      checkConclusion: "FAILURE"
    });
  });

  it("normalizes closed pull requests with pending checks", () => {
    const pr = normalizePullRequestNode("openclaw/openclaw", {
      id: "PR_closed",
      number: 13,
      title: "Closed",
      url: "https://github.com/openclaw/openclaw/pull/13",
      state: "CLOSED",
      isDraft: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-03T00:00:00Z",
      commits: {
        nodes: [
          {
            commit: {
              statusCheckRollup: {
                state: "PENDING"
              }
            }
          }
        ]
      }
    });

    expect(pr).toMatchObject({
      state: "CLOSED",
      checkConclusion: "PENDING"
    });
  });
});
