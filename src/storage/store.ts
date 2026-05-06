import type { ContributionRecord } from "../types/contribution.js";
import type { PullRequestSnapshot } from "../types/pr.js";
import { resolveStorePaths } from "./paths.js";
import { readJsonFile } from "./readJson.js";
import { writeJsonFile } from "./writeJson.js";

export type DevVaultStore = {
  readPullRequests(): Promise<PullRequestSnapshot[]>;
  writePullRequests(prs: PullRequestSnapshot[]): Promise<void>;
  readContributions(): Promise<ContributionRecord[]>;
  writeContributions(contributions: ContributionRecord[]): Promise<void>;
};

export function createStore(cwd = process.cwd()): DevVaultStore {
  const paths = resolveStorePaths(cwd);

  return {
    readPullRequests: () => readJsonFile(paths.prsPath, []),
    writePullRequests: (prs) => writeJsonFile(paths.prsPath, sortPullRequests(prs)),
    readContributions: () => readJsonFile(paths.contributionsPath, []),
    writeContributions: (contributions) =>
      writeJsonFile(paths.contributionsPath, sortContributions(contributions))
  };
}

function sortPullRequests(prs: PullRequestSnapshot[]): PullRequestSnapshot[] {
  return [...prs].sort((left, right) => {
    const repoCompare = left.repo.localeCompare(right.repo);
    return repoCompare === 0 ? left.number - right.number : repoCompare;
  });
}

function sortContributions(contributions: ContributionRecord[]): ContributionRecord[] {
  return [...contributions].sort((left, right) => {
    const dateCompare = right.mergedAt.localeCompare(left.mergedAt);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return left.id.localeCompare(right.id);
  });
}
