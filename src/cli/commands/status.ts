import { groupPullRequests } from "../../core/classifyPullRequests.js";
import { formatSnapshotWarningSuffix } from "../../core/snapshotWarnings.js";
import { createStore } from "../../storage/store.js";
import type { ClassifiedPullRequest } from "../../types/pr.js";

const GROUPS = [
  ["needs_action", "Needs Action"],
  ["waiting", "Waiting"],
  ["merged", "Merged"],
  ["closed", "Closed"]
] as const;

export async function runStatusCommand(): Promise<void> {
  const pullRequests = await createStore().readPullRequests();
  const grouped = groupPullRequests(pullRequests);

  if (pullRequests.length === 0) {
    console.log("No pull requests found. Run devvault sync first.");
    return;
  }

  for (const [groupKey, heading] of GROUPS) {
    const prs = grouped[groupKey];

    console.log(`${heading}:`);
    if (prs.length === 0) {
      console.log("- None");
      console.log("");
      continue;
    }

    for (const pr of prs) {
      console.log(formatStatusLine(pr));
    }

    console.log("");
  }
}

function formatStatusLine(classified: ClassifiedPullRequest): string {
  const { pr, status, action } = classified;
  const prefix = `- ${pr.repo} #${pr.number}`;

  return `${prefix} [${status}/${action.kind}] ${pr.title} | Reason: ${action.reason} | Next: ${action.next}${formatSnapshotWarningSuffix(pr)}`;
}
