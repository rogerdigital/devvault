import { describe, expect, it } from "vitest";

import { planBranches } from "../../src/core/branchPlanner.js";
import type { PullRequestSnapshot } from "../../src/types/pr.js";

describe("planBranches", () => {
  it("marks merged PR branches as safe to delete", () => {
    const plans = planBranches(["fix-merged", "fix-open", "experiment"], [
      createPullRequest({ headRefName: "fix-merged", state: "MERGED", number: 1 }),
      createPullRequest({ headRefName: "fix-open", state: "OPEN", number: 2 })
    ]);

    expect(plans).toMatchObject([
      { branch: "experiment", action: "needs_review" },
      { branch: "fix-merged", action: "safe_to_delete" },
      { branch: "fix-open", action: "keep" }
    ]);
  });

  it("requires review when a merged PR branch has unmerged local patches", () => {
    const plans = planBranches(
      ["fix-merged"],
      [createPullRequest({ headRefName: "fix-merged", state: "MERGED", number: 1 })],
      [{ branch: "fix-merged", mergedIntoBase: false }]
    );

    expect(plans).toMatchObject([
      {
        branch: "fix-merged",
        action: "needs_review",
        reason: expect.stringContaining("not confirmed")
      }
    ]);
  });

  it("requires review for merged fork PR branches", () => {
    const plans = planBranches(
      ["fix-merged"],
      [
        createPullRequest({
          headRefName: "fix-merged",
          headRepository: "rogerdigital/openclaw",
          state: "MERGED",
          number: 1
        })
      ],
      [{ branch: "fix-merged", mergedIntoBase: true }]
    );

    expect(plans).toMatchObject([
      {
        branch: "fix-merged",
        action: "needs_review",
        reason: expect.stringContaining("verify this local branch manually")
      }
    ]);
  });
});

function createPullRequest(overrides: Partial<PullRequestSnapshot>): PullRequestSnapshot {
  return {
    id: `PR_${overrides.number ?? 1}`,
    repo: "openclaw/openclaw",
    number: 1,
    title: "Test PR",
    url: "https://github.com/openclaw/openclaw/pull/1",
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
