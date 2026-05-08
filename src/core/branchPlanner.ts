import type { PullRequestSnapshot } from "../types/pr.js";

export type BranchPlan = {
  branch: string;
  action: "safe_to_delete" | "keep" | "needs_review";
  reason: string;
  pr?: PullRequestSnapshot;
};

export type BranchVerification = {
  branch: string;
  mergedIntoBase: boolean;
};

export function planBranches(
  localBranches: string[],
  prs: PullRequestSnapshot[],
  verifications?: BranchVerification[]
): BranchPlan[] {
  const prsByHead = new Map(
    prs
      .filter((pr) => pr.headRefName)
      .map((pr) => [pr.headRefName as string, pr])
  );
  const verificationByBranch = new Map(
    verifications?.map((verification) => [verification.branch, verification])
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
      const verification = verificationByBranch.get(branch);

      if (pr.headRepository && pr.headRepository !== pr.repo) {
        return {
          branch,
          action: "needs_review",
          reason: `Linked PR ${pr.repo}#${pr.number} was opened from ${pr.headRepository}; verify this local branch manually.`,
          pr
        };
      }

      if (verification && !verification.mergedIntoBase) {
        return {
          branch,
          action: "needs_review",
          reason: `Linked PR ${pr.repo}#${pr.number} is merged, but local commits were not confirmed in the current base branch.`,
          pr
        };
      }

      return {
        branch,
        action: "safe_to_delete",
        reason: verification
          ? `Linked PR ${pr.repo}#${pr.number} is merged and local commits are already in the current base branch.`
          : `Linked PR ${pr.repo}#${pr.number} is merged.`,
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
