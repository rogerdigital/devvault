import type { ContributionRecord } from "../types/contribution.js";

export function generateResumeSnippetsMarkdown(contributions: ContributionRecord[]): string {
  const lines = ["# Resume Snippets", "", "## Open Source Contributions", ""];
  const readyContributions = contributions.filter((record) => record.resumeReady);
  const grouped = groupByProject(readyContributions);

  if (grouped.size === 0) {
    lines.push("No resume-ready contributions recorded yet.", "");
    return lines.join("\n");
  }

  for (const [project, records] of grouped) {
    lines.push(`### ${project}`, "");

    for (const record of records) {
      lines.push(`- ${buildResumeBullet(record)}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function buildResumeBullet(record: ContributionRecord): string {
  return `Contributed ${record.area} work to ${record.project} (#${record.pr}) by ${toSentenceCase(
    record.impact
  )}`;
}

function groupByProject(contributions: ContributionRecord[]): Map<string, ContributionRecord[]> {
  const grouped = new Map<string, ContributionRecord[]>();
  const sorted = [...contributions].sort((left, right) => {
    const projectCompare = left.project.localeCompare(right.project);
    if (projectCompare !== 0) {
      return projectCompare;
    }

    return right.mergedAt.localeCompare(left.mergedAt);
  });

  for (const record of sorted) {
    grouped.set(record.project, [...(grouped.get(record.project) ?? []), record]);
  }

  return grouped;
}

function toSentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "improving project quality.";
  }

  return `${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1).replace(/\.$/, "")}.`;
}
