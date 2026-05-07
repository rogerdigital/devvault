import { groupPullRequests } from "../core/classifyPullRequests.js";
import type { ContributionRecord } from "../types/contribution.js";
import type { PullRequestSnapshot } from "../types/pr.js";

export function generateDevelopmentLogMarkdown(
  pullRequests: PullRequestSnapshot[],
  contributions: ContributionRecord[],
  generatedAt = new Date()
): string {
  return ["# Development Log", "", generateDevelopmentLogEntry(pullRequests, contributions, generatedAt)].join(
    "\n"
  );
}

export function updateDevelopmentLogMarkdown(
  existingMarkdown: string | undefined,
  pullRequests: PullRequestSnapshot[],
  contributions: ContributionRecord[],
  generatedAt = new Date()
): string {
  const entry = generateDevelopmentLogEntry(pullRequests, contributions, generatedAt);
  const dateKey = formatDateKey(generatedAt);
  const existing = existingMarkdown?.trim();

  if (!existing) {
    return generateDevelopmentLogMarkdown(pullRequests, contributions, generatedAt);
  }

  const withoutExistingEntry = removeDateEntry(existing, dateKey);
  const body = withoutExistingEntry.replace(/^# Development Log\s*/, "").trim();

  if (!body) {
    return ["# Development Log", "", entry, ""].join("\n");
  }

  return ["# Development Log", "", entry, "", body, ""].join("\n");
}

export function generateDevelopmentLogEntry(
  pullRequests: PullRequestSnapshot[],
  contributions: ContributionRecord[],
  generatedAt = new Date()
): string {
  const grouped = groupPullRequests(pullRequests);
  const lines = [
    `## ${formatDateKey(generatedAt)}`,
    "",
    `Generated at: ${generatedAt.toISOString()}`,
    "",
    "### Needs Action",
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

  lines.push("", "### Waiting", "");
  if (grouped.waiting.length === 0) {
    lines.push("- None");
  } else {
    for (const item of grouped.waiting) {
      lines.push(`- ${item.pr.repo} #${item.pr.number}: ${item.pr.title} | ${item.action.reason}`);
    }
  }

  lines.push("", "### Recent Merged Contributions", "");
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

function removeDateEntry(markdown: string, dateKey: string): string {
  const pattern = new RegExp(`(^|\\n)## ${escapeRegExp(dateKey)}\\n[\\s\\S]*?(?=\\n## \\d{4}-\\d{2}-\\d{2}\\n|$)`);
  return markdown.replace(pattern, "$1").trim();
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
