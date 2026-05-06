import type { ContributionRecord } from "../types/contribution.js";

export function generateContributionMarkdown(contributions: ContributionRecord[]): string {
  const lines = ["# Open Source Contributions", ""];
  const grouped = groupByProject(contributions);

  if (grouped.size === 0) {
    lines.push("No merged contributions recorded yet.", "");
    return lines.join("\n");
  }

  for (const [project, records] of grouped) {
    lines.push(`## ${project}`, "");

    for (const record of records) {
      lines.push(`### PR #${record.pr} - ${record.area}`);
      lines.push("");
      lines.push(`- Status: Merged`);
      lines.push(`- Date: ${formatDate(record.mergedAt)}`);
      lines.push(`- Repo: ${record.repo}`);
      lines.push(`- Type: ${record.type}`);
      lines.push(`- Impact: ${record.impact}`);
      lines.push(`- Link: ${record.links.pr}`);

      if (record.links.releaseNote) {
        lines.push(`- Release note: ${record.links.releaseNote}`);
      }

      if (record.tags.length > 0) {
        lines.push(`- Tags: ${record.tags.join(", ")}`);
      }

      if (record.manualNotes) {
        lines.push(`- Notes: ${record.manualNotes}`);
      }

      lines.push("");
    }
  }

  return lines.join("\n");
}

function groupByProject(contributions: ContributionRecord[]): Map<string, ContributionRecord[]> {
  const grouped = new Map<string, ContributionRecord[]>();

  for (const record of sortContributions(contributions)) {
    grouped.set(record.project, [...(grouped.get(record.project) ?? []), record]);
  }

  return new Map([...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function sortContributions(contributions: ContributionRecord[]): ContributionRecord[] {
  return [...contributions].sort((left, right) => {
    const dateCompare = right.mergedAt.localeCompare(left.mergedAt);
    return dateCompare === 0 ? left.id.localeCompare(right.id) : dateCompare;
  });
}

function formatDate(value: string): string {
  return value.slice(0, 10);
}
