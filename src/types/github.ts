export type GitHubPullRequestState = "OPEN" | "CLOSED" | "MERGED";

export type GitHubMergeableState = "MERGEABLE" | "CONFLICTING" | "UNKNOWN";

export type GitHubReviewDecision = "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED";

export type GitHubCheckConclusion = "SUCCESS" | "FAILURE" | "PENDING" | "UNKNOWN";

export type GitHubReviewComment = {
  id: string;
  author: string;
  body: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  isMaintainer: boolean;
};

export type GitHubCheckRun = {
  name: string;
  status: "COMPLETED" | "IN_PROGRESS" | "QUEUED" | "UNKNOWN";
  conclusion: GitHubCheckConclusion;
  detailsUrl?: string;
  completedAt?: string;
};
