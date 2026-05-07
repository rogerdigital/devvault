import type { PullRequestSnapshot } from "../types/pr.js";
import type { GitHubClient } from "./client.js";
import { parseRepoRef } from "./repo.js";

const PAGE_SIZE = 50;

type FetchPullRequestsOptions = {
  client: GitHubClient;
  username: string;
  repos: string[];
};

type PullRequestNode = {
  id: string;
  number: number;
  title: string;
  bodyText?: string | null;
  url: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string | null;
  mergeable?: "MERGEABLE" | "CONFLICTING" | "UNKNOWN" | null;
  reviewDecision?: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;
  author?: {
    login: string;
  } | null;
  headRefName?: string | null;
  headRepository?: {
    nameWithOwner: string;
  } | null;
  labels?: {
    nodes?: Array<{ name: string } | null> | null;
  } | null;
  files?: {
    nodes?: Array<{ path: string } | null> | null;
  } | null;
  commits?: {
    nodes?: Array<{
      commit?: {
        statusCheckRollup?: {
          state?: "SUCCESS" | "FAILURE" | "PENDING" | "ERROR" | "EXPECTED" | null;
        } | null;
      } | null;
    } | null> | null;
  } | null;
};

type PullRequestsResponse = {
  search: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string | null;
    };
    nodes?: Array<PullRequestNode | null> | null;
  };
};

export async function fetchPullRequests(options: FetchPullRequestsOptions): Promise<PullRequestSnapshot[]> {
  const snapshots: PullRequestSnapshot[] = [];

  for (const repo of options.repos) {
    snapshots.push(...(await fetchPullRequestsForRepo({ ...options, repo })));
  }

  return snapshots;
}

async function fetchPullRequestsForRepo(
  options: FetchPullRequestsOptions & { repo: string }
): Promise<PullRequestSnapshot[]> {
  const repo = parseRepoRef(options.repo);
  const snapshots: PullRequestSnapshot[] = [];
  let cursor: string | undefined;

  do {
    const response = await options.client.query<PullRequestsResponse>(PULL_REQUESTS_QUERY, {
      query: `repo:${repo.fullName} author:${options.username} is:pr`,
      pageSize: PAGE_SIZE,
      cursor
    });

    const connection = response.search;

    for (const node of connection.nodes ?? []) {
      if (node) {
        snapshots.push(normalizePullRequestNode(repo.fullName, node));
      }
    }

    cursor = connection.pageInfo.endCursor ?? undefined;
    if (!connection.pageInfo.hasNextPage) {
      cursor = undefined;
    }
  } while (cursor);

  return snapshots;
}

export function normalizePullRequestNode(repo: string, node: PullRequestNode): PullRequestSnapshot {
  return {
    id: node.id,
    repo,
    number: node.number,
    title: node.title,
    ...(node.bodyText ? { body: node.bodyText } : {}),
    url: node.url,
    author: node.author?.login ?? "unknown",
    ...(node.headRefName ? { headRefName: node.headRefName } : {}),
    ...(node.headRepository?.nameWithOwner ? { headRepository: node.headRepository.nameWithOwner } : {}),
    state: node.state,
    isDraft: node.isDraft,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    ...(node.mergedAt ? { mergedAt: node.mergedAt } : {}),
    ...(node.mergeable ? { mergeable: node.mergeable } : {}),
    labels: normalizeLabels(node),
    ...(node.reviewDecision ? { reviewDecision: node.reviewDecision } : {}),
    checkConclusion: normalizeCheckConclusion(node),
    changedFiles: normalizeChangedFiles(node)
  };
}

function normalizeLabels(node: PullRequestNode): string[] {
  return (node.labels?.nodes ?? [])
    .map((label) => label?.name)
    .filter((label): label is string => Boolean(label))
    .sort((left, right) => left.localeCompare(right));
}

function normalizeChangedFiles(node: PullRequestNode): string[] {
  return (node.files?.nodes ?? [])
    .map((file) => file?.path)
    .filter((file): file is string => Boolean(file))
    .sort((left, right) => left.localeCompare(right));
}

function normalizeCheckConclusion(node: PullRequestNode): PullRequestSnapshot["checkConclusion"] {
  const state = node.commits?.nodes?.[0]?.commit?.statusCheckRollup?.state;

  if (!state) {
    return "UNKNOWN";
  }

  if (state === "SUCCESS") {
    return "SUCCESS";
  }

  if (state === "FAILURE" || state === "ERROR") {
    return "FAILURE";
  }

  return "PENDING";
}

const PULL_REQUESTS_QUERY = `
  query DevVaultPullRequests(
    $query: String!
    $pageSize: Int!
    $cursor: String
  ) {
    search(query: $query, type: ISSUE, first: $pageSize, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          id
          number
          title
          bodyText
          url
          state
          isDraft
          createdAt
          updatedAt
          mergedAt
          mergeable
          reviewDecision
          author {
            login
          }
          headRefName
          headRepository {
            nameWithOwner
          }
          labels(first: 20) {
            nodes {
              name
            }
          }
          files(first: 50) {
            nodes {
              path
            }
          }
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  state
                }
              }
            }
          }
        }
      }
    }
  }
`;
