import type { PrLifecycleStatus, PullRequestSnapshot } from "../types/pr.js";

export function classifyPrStatus(pr: PullRequestSnapshot): PrLifecycleStatus {
  if (pr.state === "MERGED") {
    return "merged";
  }

  if (pr.state === "CLOSED") {
    return "closed";
  }

  if (pr.isDraft) {
    return "draft";
  }

  if (pr.mergeable === "CONFLICTING") {
    return "merge_conflict";
  }

  if (pr.reviewDecision === "CHANGES_REQUESTED") {
    return "changes_requested";
  }

  if (pr.checkConclusion === "FAILURE") {
    return "ci_failed";
  }

  if (pr.lastMaintainerActivityAt) {
    return "maintainer_commented";
  }

  if (pr.checkConclusion === "SUCCESS") {
    return "ci_passed";
  }

  if (pr.reviewDecision === "REVIEW_REQUIRED") {
    return "waiting_for_review";
  }

  return "open";
}
