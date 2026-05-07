import { describe, expect, it } from "vitest";

import { buildNextAction } from "../../src/core/buildNextAction.js";
import { classifyPrStatus } from "../../src/core/classifyPrStatus.js";
import type { PullRequestSnapshot } from "../../src/types/pr.js";

describe("PR intelligence priority", () => {
  it("prioritizes merge conflicts before review and CI failures", () => {
    const pr = createPullRequest({
      mergeable: "CONFLICTING",
      reviewDecision: "CHANGES_REQUESTED",
      checkConclusion: "FAILURE"
    });

    expect(classifyPrStatus(pr)).toBe("merge_conflict");
    expect(buildNextAction(pr)).toMatchObject({
      group: "needs_action",
      kind: "resolve_conflict",
      reason: "Pull request has merge conflicts."
    });
  });

  it("prioritizes changes requested before generic maintainer comments", () => {
    const pr = createPullRequest({
      reviewDecision: "CHANGES_REQUESTED",
      lastMaintainerActivityAt: "2026-01-02T00:00:00Z",
      reviewComments: [
        {
          id: "comment-1",
          author: "maintainer",
          body: "Please add a regression test for reconnect behavior.",
          url: "https://github.com/owner/repo/pull/1#discussion_r1",
          createdAt: "2026-01-02T00:00:00Z",
          updatedAt: "2026-01-02T00:00:00Z",
          isMaintainer: true
        }
      ]
    });

    expect(classifyPrStatus(pr)).toBe("changes_requested");
    expect(buildNextAction(pr).kind).toBe("address_review");
    expect(buildNextAction(pr).next).toContain("Please add a regression test");
  });

  it("includes failed check names in CI failure reason", () => {
    const action = buildNextAction(
      createPullRequest({
        checkConclusion: "FAILURE",
        checkRuns: [
          {
            name: "Test",
            status: "COMPLETED",
            conclusion: "FAILURE"
          },
          {
            name: "Lint",
            status: "COMPLETED",
            conclusion: "SUCCESS"
          }
        ]
      })
    );

    expect(action.reason).toBe("CI checks failed: Test.");
    expect(action.kind).toBe("fix_ci");
  });

  it("deduplicates repeated failed check names", () => {
    const action = buildNextAction(
      createPullRequest({
        checkConclusion: "FAILURE",
        checkRuns: [
          {
            name: "Real behavior proof",
            status: "COMPLETED",
            conclusion: "FAILURE"
          },
          {
            name: "Real behavior proof",
            status: "COMPLETED",
            conclusion: "FAILURE"
          }
        ]
      })
    );

    expect(action.reason).toBe("CI checks failed: Real behavior proof.");
  });
});

function createPullRequest(overrides: Partial<PullRequestSnapshot> = {}): PullRequestSnapshot {
  return {
    id: "PR_1",
    repo: "owner/repo",
    number: 1,
    title: "Fix reconnect",
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
