import type { ClassifiedPullRequest, PrStatusGroup, PullRequestSnapshot } from "../types/pr.js";
import { buildNextActionForStatus } from "./buildNextAction.js";
import { classifyPrStatus } from "./classifyPrStatus.js";

export type GroupedPullRequests = Record<PrStatusGroup, ClassifiedPullRequest[]>;

export function classifyPullRequests(prs: PullRequestSnapshot[]): ClassifiedPullRequest[] {
  return prs.map((pr) => {
    const status = classifyPrStatus(pr);

    return {
      pr,
      status,
      action: buildNextActionForStatus(pr, status)
    };
  });
}

export function groupPullRequests(prs: PullRequestSnapshot[]): GroupedPullRequests {
  const grouped: GroupedPullRequests = {
    needs_action: [],
    waiting: [],
    merged: [],
    closed: []
  };

  for (const classified of classifyPullRequests(prs)) {
    grouped[classified.action.group].push(classified);
  }

  for (const group of Object.values(grouped)) {
    group.sort(compareClassifiedPullRequests);
  }

  return grouped;
}

function compareClassifiedPullRequests(
  left: ClassifiedPullRequest,
  right: ClassifiedPullRequest
): number {
  const dateCompare = right.pr.updatedAt.localeCompare(left.pr.updatedAt);
  if (dateCompare !== 0) {
    return dateCompare;
  }

  const repoCompare = left.pr.repo.localeCompare(right.pr.repo);
  return repoCompare === 0 ? left.pr.number - right.pr.number : repoCompare;
}
