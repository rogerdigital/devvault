import path from "node:path";

import { groupPullRequests } from "../../core/classifyPullRequests.js";
import { generateAssets } from "../../core/generateAssets.js";
import { syncPullRequests } from "./sync.js";

export async function runAutomationCommand(): Promise<void> {
  const cwd = process.cwd();
  const sync = await syncPullRequests(cwd);
  const assets = await generateAssets(cwd);
  const grouped = groupPullRequests(sync.pullRequests);

  console.log("DevVault automation complete.");
  console.log(`Synced ${sync.pullRequests.length} pull requests.`);
  console.log(`Needs action: ${grouped.needs_action.length}`);
  console.log(`Waiting: ${grouped.waiting.length}`);
  console.log(`Merged: ${grouped.merged.length}`);
  console.log(`Closed: ${grouped.closed.length}`);
  console.log(`Generated ${assets.contributions.length} contribution records.`);
  console.log(`Output: ${path.relative(cwd, assets.outputDirectory) || "."}`);

  if (assets.syncedSiteDirectory) {
    console.log(`Personal site: ${assets.syncedSiteDirectory}`);
  }
  if (assets.siteCommit) {
    console.log(`Personal site commit: ${assets.siteCommit}`);
  }

  if (grouped.needs_action.length > 0) {
    console.log("");
    console.log("Needs Action:");
    for (const item of grouped.needs_action) {
      console.log(`- ${item.pr.repo} #${item.pr.number}: ${item.action.reason}`);
      console.log(`  Next: ${item.action.next}`);
      console.log(`  Prompt: devvault prompt --pr ${item.pr.repo}#${item.pr.number} --type fix-ci`);
    }
  }
}
