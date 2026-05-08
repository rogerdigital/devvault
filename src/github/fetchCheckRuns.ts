import type { GitHubCheckConclusion, GitHubCheckRun } from "../types/github.js";
import type { GitHubClient } from "./client.js";
import { parseRepoRef } from "./repo.js";

type FetchCheckRunsOptions = {
  client: GitHubClient;
  repo: string;
  number: number;
};

export type FetchCheckRunsResult = {
  checkRuns: GitHubCheckRun[];
  truncated: boolean;
};

type CheckRunNode = {
  __typename: string;
  name?: string | null;
  status?: string | null;
  conclusion?: string | null;
  detailsUrl?: string | null;
  targetUrl?: string | null;
  completedAt?: string | null;
};

type CheckRunsResponse = {
  repository?: {
    pullRequest?: {
      commits?: {
        nodes?: Array<{
          commit?: {
            statusCheckRollup?: {
              contexts?: {
                nodes?: Array<CheckRunNode | null> | null;
                pageInfo?: {
                  hasNextPage: boolean;
                } | null;
              } | null;
            } | null;
          } | null;
        } | null> | null;
      } | null;
    } | null;
  } | null;
};

export async function fetchCheckRuns(options: FetchCheckRunsOptions): Promise<FetchCheckRunsResult> {
  const repo = parseRepoRef(options.repo);
  const response = await options.client.query<CheckRunsResponse>(CHECK_RUNS_QUERY, {
    owner: repo.owner,
    name: repo.name,
    number: options.number
  });
  const contextConnection =
    response.repository?.pullRequest?.commits?.nodes?.[0]?.commit?.statusCheckRollup?.contexts;
  const contexts = contextConnection?.nodes ?? [];

  return {
    checkRuns: contexts
      .filter((node): node is CheckRunNode => Boolean(node))
      .map(normalizeCheckRun)
      .sort((left, right) => left.name.localeCompare(right.name)),
    truncated: Boolean(contextConnection?.pageInfo?.hasNextPage)
  };
}

function normalizeCheckRun(node: CheckRunNode): GitHubCheckRun {
  return {
    name: node.name ?? "unknown",
    status: normalizeStatus(node.status),
    conclusion: normalizeConclusion(node.conclusion),
    ...(node.detailsUrl || node.targetUrl ? { detailsUrl: node.detailsUrl ?? node.targetUrl ?? undefined } : {}),
    ...(node.completedAt ? { completedAt: node.completedAt } : {})
  };
}

function normalizeStatus(status: string | null | undefined): GitHubCheckRun["status"] {
  if (status === "COMPLETED" || status === "IN_PROGRESS" || status === "QUEUED") {
    return status;
  }

  return "UNKNOWN";
}

function normalizeConclusion(conclusion: string | null | undefined): GitHubCheckConclusion {
  if (conclusion === "SUCCESS") {
    return "SUCCESS";
  }

  if (conclusion === "FAILURE" || conclusion === "ERROR" || conclusion === "TIMED_OUT") {
    return "FAILURE";
  }

  if (!conclusion || conclusion === "PENDING" || conclusion === "SKIPPED" || conclusion === "CANCELLED") {
    return "PENDING";
  }

  return "UNKNOWN";
}

const CHECK_RUNS_QUERY = `
  query DevVaultCheckRuns($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                contexts(first: 50) {
                  pageInfo {
                    hasNextPage
                  }
                  nodes {
                    __typename
                    ... on CheckRun {
                      name
                      status
                      conclusion
                      detailsUrl
                      completedAt
                    }
                    ... on StatusContext {
                      name: context
                      status: state
                      targetUrl
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
