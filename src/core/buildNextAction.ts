import type { NextAction, PrLifecycleStatus, PullRequestSnapshot } from "../types/pr.js";
import { classifyPrStatus } from "./classifyPrStatus.js";

export function buildNextAction(pr: PullRequestSnapshot): NextAction {
  return buildNextActionForStatus(pr, classifyPrStatus(pr));
}

export function buildNextActionForStatus(
  pr: PullRequestSnapshot,
  status: PrLifecycleStatus
): NextAction {
  switch (status) {
    case "merged":
      return {
        group: "merged",
        reason: "Pull request was merged.",
        next: "Generate or update the contribution record."
      };
    case "closed":
      return {
        group: "closed",
        reason: "Pull request was closed without merge.",
        next: "No action needed unless this should be reopened."
      };
    case "draft":
      return {
        group: "waiting",
        reason: "Pull request is still a draft.",
        next: "Mark ready for review when the implementation is complete."
      };
    case "merge_conflict":
      return {
        group: "needs_action",
        reason: "Pull request has merge conflicts.",
        next: "Rebase or merge the base branch and resolve conflicts."
      };
    case "changes_requested":
      return {
        group: "needs_action",
        reason: "Reviewer requested changes.",
        next: "Address review feedback and push a focused update."
      };
    case "ci_failed":
      return {
        group: "needs_action",
        reason: "CI checks failed.",
        next: "Inspect failing checks and generate a fix-ci prompt."
      };
    case "maintainer_commented":
      return {
        group: "needs_action",
        reason: "Maintainer activity was detected.",
        next: "Review the latest maintainer comment and decide whether to reply or update code."
      };
    case "ci_passed":
      return {
        group: "waiting",
        reason: "CI checks passed.",
        next: "Wait for maintainer review or merge."
      };
    case "waiting_for_review":
      return {
        group: "waiting",
        reason: "Review is required.",
        next: "No action needed unless the PR has gone stale."
      };
    case "open":
      return {
        group: "waiting",
        reason: `${pr.repo}#${pr.number} is open.`,
        next: "Monitor for CI, review, or maintainer activity."
      };
  }
}
