import { buildActivityReport, parseSinceOption } from "../../core/activityReport.js";
import { createStore } from "../../storage/store.js";

export type ReportCommandOptions = {
  since?: string;
};

export async function runReportCommand(options: ReportCommandOptions): Promise<void> {
  const store = createStore();
  const [pullRequests, contributions] = await Promise.all([
    store.readPullRequests(),
    store.readContributions()
  ]);
  const report = buildActivityReport({
    pullRequests,
    contributions,
    since: parseSinceOption(options.since)
  });

  console.log(`DevVault report since ${report.since.toISOString()}`);
  console.log(`Current needs action: ${report.currentNeedsAction.length}`);
  console.log(`Recent PR activity: ${report.recentPullRequests.length}`);
  console.log(`Merged contributions: ${report.recentContributions.length}`);
  console.log(`Homepage-ready contributions: ${report.homepageReadyContributions.length}`);

  if (report.currentNeedsAction.length > 0) {
    console.log("");
    console.log("Current Needs Action:");
    for (const item of report.currentNeedsAction) {
      console.log(`- ${item.pr.repo} #${item.pr.number} [${item.action.kind}] ${item.action.reason}`);
      console.log(`  Next: ${item.action.next}`);
    }
  }

  if (report.recentContributions.length > 0) {
    console.log("");
    console.log("Recent Contributions:");
    for (const contribution of report.recentContributions) {
      console.log(
        `- ${contribution.project} #${contribution.pr}: ${contribution.area} | ${contribution.impact}`
      );
    }
  }

  if (report.recentPullRequests.length > 0) {
    console.log("");
    console.log("Recent PR Activity:");
    for (const pr of report.recentPullRequests) {
      console.log(`- ${pr.repo} #${pr.number}: ${pr.title} | Updated: ${pr.updatedAt}`);
    }
  }
}
