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
        kind: "curate_contribution",
        reason: "Pull request was merged.",
        next: "Generate or update the contribution record."
      };
    case "closed":
      return {
        group: "closed",
        kind: "none",
        reason: "Pull request was closed without merge.",
        next: "No action needed unless this should be reopened."
      };
    case "draft":
      return {
        group: "waiting",
        kind: "wait_review",
        reason: "Pull request is still a draft.",
        next: "Mark ready for review when the implementation is complete."
      };
    case "merge_conflict":
      return {
        group: "needs_action",
        kind: "resolve_conflict",
        reason: "Pull request has merge conflicts.",
        next: "Generate a resolve-conflict prompt, then rebase or merge the base branch."
      };
    case "changes_requested":
      return {
        group: "needs_action",
        kind: "address_review",
        reason: "Reviewer requested changes.",
        next: buildReviewNextAction(pr)
      };
    case "ci_failed":
      return {
        group: "needs_action",
        kind: "fix_ci",
        reason: buildCiFailureReason(pr),
        next: "Inspect failing checks and generate a fix-ci prompt."
      };
    case "maintainer_commented":
      return {
        group: "needs_action",
        kind: "reply_maintainer",
        reason: "Maintainer activity was detected.",
        next: buildMaintainerCommentNextAction(pr)
      };
    case "ci_passed":
      return {
        group: "waiting",
        kind: "wait_merge",
        reason: "CI checks passed.",
        next: "Wait for maintainer review or merge."
      };
    case "waiting_for_review":
      return {
        group: "waiting",
        kind: "wait_review",
        reason: "Review is required.",
        next: "No action needed unless the PR has gone stale."
      };
    case "open":
      return {
        group: "waiting",
        kind: "wait_review",
        reason: `${pr.repo}#${pr.number} is open.`,
        next: "Monitor for CI, review, or maintainer activity."
      };
  }
}

function buildCiFailureReason(pr: PullRequestSnapshot): string {
  const failedChecks = pr.checkRuns
    ?.filter((check) => check.conclusion === "FAILURE")
    .map((check) => check.name);
  const uniqueFailedChecks = Array.from(new Set(failedChecks));

  if (uniqueFailedChecks.length) {
    return `CI checks failed: ${uniqueFailedChecks.join(", ")}.`;
  }

  return "CI checks failed.";
}

function buildReviewNextAction(pr: PullRequestSnapshot): string {
  const latestMaintainerComment = getLatestMaintainerComment(pr);

  if (latestMaintainerComment) {
    return `Address reviewer feedback: ${summarizeComment(latestMaintainerComment.body)}`;
  }

  return "Address review feedback and push a focused update.";
}

function buildMaintainerCommentNextAction(pr: PullRequestSnapshot): string {
  const latestMaintainerComment = getLatestMaintainerComment(pr);

  if (latestMaintainerComment) {
    return `Review maintainer comment: ${summarizeComment(latestMaintainerComment.body)}`;
  }

  return "Review the latest maintainer comment and decide whether to reply or update code.";
}

function getLatestMaintainerComment(pr: PullRequestSnapshot) {
  return pr.reviewComments?.filter((comment) => comment.isMaintainer).at(-1);
}

function summarizeComment(body: string): string {
  const singleLine = body.replace(/\s+/g, " ").trim();

  if (singleLine.length <= 160) {
    return singleLine;
  }

  return `${singleLine.slice(0, 157)}...`;
}
