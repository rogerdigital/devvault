import type { ContributionRecord } from "../types/contribution.js";

export function generateChangelogMarkdown(contributions: ContributionRecord[]): string {
  const lines = ["# Changelog", ""];
  const grouped = groupByDate(contributions);

  if (grouped.size === 0) {
    lines.push("No merged contributions recorded yet.", "");
    return lines.join("\n");
  }

  for (const [date, records] of grouped) {
    lines.push(`## ${date}`, "");

    for (const record of records) {
      lines.push(
        `- Merged ${record.project} PR #${record.pr}: ${record.impact} (${record.links.pr})`
      );
    }

    lines.push("");
  }

  return lines.join("\n");
}

function groupByDate(contributions: ContributionRecord[]): Map<string, ContributionRecord[]> {
  const grouped = new Map<string, ContributionRecord[]>();
  const sorted = [...contributions].sort((left, right) => {
    const dateCompare = right.mergedAt.localeCompare(left.mergedAt);
    return dateCompare === 0 ? left.id.localeCompare(right.id) : dateCompare;
  });

  for (const record of sorted) {
    const date = record.mergedAt.slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), record]);
  }

  return grouped;
}
