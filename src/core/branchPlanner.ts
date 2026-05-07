import type { PullRequestSnapshot } from "../types/pr.js";

export type BranchPlan = {
  branch: string;
  action: "safe_to_delete" | "keep" | "needs_review";
  reason: string;
  pr?: PullRequestSnapshot;
};

export function planBranches(localBranches: string[], prs: PullRequestSnapshot[]): BranchPlan[] {
  const prsByHead = new Map(
    prs
      .filter((pr) => pr.headRefName)
      .map((pr) => [pr.headRefName as string, pr])
  );

  return localBranches.sort((left, right) => left.localeCompare(right)).map((branch) => {
    const pr = prsByHead.get(branch);

    if (!pr) {
      return {
        branch,
        action: "needs_review",
        reason: "No linked PR found in DevVault data."
      };
    }

    if (pr.state === "MERGED") {
      return {
        branch,
        action: "safe_to_delete",
        reason: `Linked PR ${pr.repo}#${pr.number} is merged.`,
        pr
      };
    }

    return {
      branch,
      action: "keep",
      reason: `Linked PR ${pr.repo}#${pr.number} is ${pr.state.toLowerCase()}.`,
      pr
    };
  });
}
