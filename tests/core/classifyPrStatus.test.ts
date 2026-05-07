import { describe, expect, it } from "vitest";

import { buildNextAction } from "../../src/core/buildNextAction.js";
import { groupPullRequests } from "../../src/core/classifyPullRequests.js";
import { classifyPrStatus } from "../../src/core/classifyPrStatus.js";
import type { PrLifecycleStatus, PullRequestSnapshot } from "../../src/types/pr.js";

describe("classifyPrStatus", () => {
  const cases: Array<[string, Partial<PullRequestSnapshot>, PrLifecycleStatus]> = [
    ["merged", { state: "MERGED" }, "merged"],
    ["closed", { state: "CLOSED" }, "closed"],
    ["draft", { isDraft: true }, "draft"],
    ["merge conflict", { mergeable: "CONFLICTING" }, "merge_conflict"],
    ["changes requested", { reviewDecision: "CHANGES_REQUESTED" }, "changes_requested"],
    ["CI failed", { checkConclusion: "FAILURE" }, "ci_failed"],
    ["maintainer commented", { lastMaintainerActivityAt: "2026-01-02T00:00:00Z" }, "maintainer_commented"],
    ["CI passed", { checkConclusion: "SUCCESS" }, "ci_passed"],
    ["waiting for review", { reviewDecision: "REVIEW_REQUIRED" }, "waiting_for_review"],
    ["open fallback", {}, "open"]
  ];

  it.each(cases)("classifies %s", (_name, overrides, expected) => {
    expect(classifyPrStatus(createPullRequest(overrides))).toBe(expected);
  });

  it("prioritizes merge conflicts before review state", () => {
    expect(
      classifyPrStatus(
        createPullRequest({
          mergeable: "CONFLICTING",
          reviewDecision: "CHANGES_REQUESTED",
          checkConclusion: "FAILURE"
        })
      )
    ).toBe("merge_conflict");
  });
});

describe("buildNextAction", () => {
  it("marks failed CI as needs action", () => {
    expect(buildNextAction(createPullRequest({ checkConclusion: "FAILURE" }))).toMatchObject({
      group: "needs_action",
      kind: "fix_ci",
      reason: "CI checks failed."
    });
  });

  it("marks merged PRs as merged", () => {
    expect(buildNextAction(createPullRequest({ state: "MERGED" }))).toMatchObject({
      group: "merged",
      kind: "curate_contribution"
    });
  });
});

describe("groupPullRequests", () => {
  it("groups classified pull requests by user action", () => {
    const grouped = groupPullRequests([
      createPullRequest({ number: 1, checkConclusion: "FAILURE" }),
      createPullRequest({ number: 2, checkConclusion: "SUCCESS" }),
      createPullRequest({ number: 3, state: "MERGED" }),
      createPullRequest({ number: 4, state: "CLOSED" })
    ]);

    expect(grouped.needs_action.map((item) => item.pr.number)).toEqual([1]);
    expect(grouped.waiting.map((item) => item.pr.number)).toEqual([2]);
    expect(grouped.merged.map((item) => item.pr.number)).toEqual([3]);
    expect(grouped.closed.map((item) => item.pr.number)).toEqual([4]);
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
