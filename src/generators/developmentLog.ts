import { groupPullRequests } from "../core/classifyPullRequests.js";
import type { ContributionRecord } from "../types/contribution.js";
import type { PullRequestSnapshot } from "../types/pr.js";

export function generateDevelopmentLogMarkdown(
  pullRequests: PullRequestSnapshot[],
  contributions: ContributionRecord[],
  generatedAt = new Date()
): string {
  const grouped = groupPullRequests(pullRequests);
  const lines = [
    "# Development Log",
    "",
    `Generated at: ${generatedAt.toISOString()}`,
    "",
    "## Needs Action",
    ""
  ];

  if (grouped.needs_action.length === 0) {
    lines.push("- None");
  } else {
    for (const item of grouped.needs_action) {
      lines.push(
        `- ${item.pr.repo} #${item.pr.number}: ${item.pr.title} | ${item.action.reason} | Next: ${item.action.next}`
      );
    }
  }

  lines.push("", "## Waiting", "");
  if (grouped.waiting.length === 0) {
    lines.push("- None");
  } else {
    for (const item of grouped.waiting) {
      lines.push(`- ${item.pr.repo} #${item.pr.number}: ${item.pr.title} | ${item.action.reason}`);
    }
  }

  lines.push("", "## Recent Merged Contributions", "");
  if (contributions.length === 0) {
    lines.push("- None");
  } else {
    for (const contribution of contributions.slice(0, 10)) {
      lines.push(
        `- ${contribution.project} #${contribution.pr}: ${contribution.area} | ${contribution.impact}`
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}
