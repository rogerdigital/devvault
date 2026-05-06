import { loadConfig } from "../../config/loadConfig.js";
import { GitHubClient, readGitHubToken } from "../../github/client.js";
import { fetchPullRequests } from "../../github/fetchPullRequests.js";
import { createStore } from "../../storage/store.js";

export async function runSyncCommand(): Promise<void> {
  const config = await loadConfig();
  const token = readGitHubToken(config.github.tokenEnv);
  const client = new GitHubClient({ token });
  const pullRequests = await fetchPullRequests({
    client,
    username: config.github.username,
    repos: config.repos
  });

  await createStore().writePullRequests(pullRequests);

  const mergedCount = pullRequests.filter((pr) => pr.state === "MERGED").length;
  const openCount = pullRequests.filter((pr) => pr.state === "OPEN").length;
  const closedCount = pullRequests.filter((pr) => pr.state === "CLOSED").length;

  console.log(`Synced ${pullRequests.length} pull requests.`);
  console.log(`Open: ${openCount}`);
  console.log(`Merged: ${mergedCount}`);
  console.log(`Closed: ${closedCount}`);
}
