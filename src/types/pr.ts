import type {
  GitHubCheckConclusion,
  GitHubCheckRun,
  GitHubMergeableState,
  GitHubPullRequestState,
  GitHubReviewComment,
  GitHubReviewDecision
} from "./github.js";

export type PullRequestSnapshot = {
  id: string;
  repo: string;
  number: number;
  title: string;
  body?: string;
  url: string;
  author: string;
  headRefName?: string;
  headRepository?: string;
  state: GitHubPullRequestState;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  mergeable?: GitHubMergeableState;
  labels: string[];
  reviewDecision?: GitHubReviewDecision;
  checkConclusion?: GitHubCheckConclusion;
  lastMaintainerActivityAt?: string;
  changedFiles: string[];
  reviewComments?: GitHubReviewComment[];
  checkRuns?: GitHubCheckRun[];
};

export type PrLifecycleStatus =
  | "draft"
  | "open"
  | "waiting_for_review"
  | "changes_requested"
  | "ci_failed"
  | "ci_passed"
  | "maintainer_commented"
  | "merge_conflict"
  | "merged"
  | "closed";

export type PrStatusGroup = "needs_action" | "waiting" | "merged" | "closed";

export type NextAction = {
  group: PrStatusGroup;
  reason: string;
  next: string;
};

export type ClassifiedPullRequest = {
  pr: PullRequestSnapshot;
  status: PrLifecycleStatus;
  action: NextAction;
};
