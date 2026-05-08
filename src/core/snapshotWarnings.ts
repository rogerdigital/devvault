import type { PullRequestSnapshot } from "../types/pr.js";

export function formatSnapshotWarnings(pr: PullRequestSnapshot): string[] {
  const warnings: string[] = [];

  if (pr.changedFilesTruncated) {
    warnings.push("changed files truncated");
  }

  if (pr.reviewCommentsTruncated) {
    warnings.push("review comments truncated");
  }

  if (pr.checkRunsTruncated) {
    warnings.push("check runs truncated");
  }

  return warnings;
}

export function formatSnapshotWarningSuffix(pr: PullRequestSnapshot): string {
  const warnings = formatSnapshotWarnings(pr);
  return warnings.length > 0 ? ` | Warning: ${warnings.join(", ")}` : "";
}
