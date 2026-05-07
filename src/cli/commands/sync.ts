import { loadConfig } from "../../config/loadConfig.js";
import { GitHubClient, readGitHubToken } from "../../github/client.js";
import { fetchCheckRuns } from "../../github/fetchCheckRuns.js";
import { fetchPullRequests } from "../../github/fetchPullRequests.js";
import { fetchReviewComments } from "../../github/fetchReviewComments.js";
import { createStore } from "../../storage/store.js";
import type { PullRequestSnapshot } from "../../types/pr.js";

export async function runSyncCommand(): Promise<void> {
  const result = await syncPullRequests();

  console.log(`Synced ${result.pullRequests.length} pull requests.`);
  console.log(`Open: ${result.openCount}`);
  console.log(`Merged: ${result.mergedCount}`);
  console.log(`Closed: ${result.closedCount}`);
}

export type SyncPullRequestsResult = {
  pullRequests: PullRequestSnapshot[];
  openCount: number;
  mergedCount: number;
  closedCount: number;
};

export async function syncPullRequests(cwd = process.cwd()): Promise<SyncPullRequestsResult> {
  const config = await loadConfig({ cwd });
  const token = readGitHubToken(config.github.tokenEnv);
  const client = new GitHubClient({ token });
  const pullRequests = await fetchPullRequests({
    client,
    username: config.github.username,
    repos: config.repos
  });
  const enrichedPullRequests = await enrichPullRequests(client, pullRequests);

  await createStore(cwd).writePullRequests(enrichedPullRequests);

  const mergedCount = enrichedPullRequests.filter((pr) => pr.state === "MERGED").length;
  const openCount = enrichedPullRequests.filter((pr) => pr.state === "OPEN").length;
  const closedCount = enrichedPullRequests.filter((pr) => pr.state === "CLOSED").length;

  return {
    pullRequests: enrichedPullRequests,
    openCount,
    mergedCount,
    closedCount
  };
}

async function enrichPullRequests(
  client: GitHubClient,
  pullRequests: PullRequestSnapshot[]
): Promise<PullRequestSnapshot[]> {
  const enriched: PullRequestSnapshot[] = [];

  for (const pr of pullRequests) {
    const [reviewComments, checkRuns] = await Promise.all([
      fetchReviewComments({ client, repo: pr.repo, number: pr.number }),
      fetchCheckRuns({ client, repo: pr.repo, number: pr.number })
    ]);
    const maintainerComments = reviewComments.filter((comment) => comment.isMaintainer);
    const lastMaintainerActivityAt = maintainerComments.at(-1)?.updatedAt;

    enriched.push({
      ...pr,
      reviewComments,
      checkRuns,
      ...(lastMaintainerActivityAt ? { lastMaintainerActivityAt } : {})
    });
  }

  return enriched;
}
