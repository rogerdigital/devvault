import type { DevVaultConfig } from "../types/config.js";
import type { ContributionRecord } from "../types/contribution.js";

export type WebsiteMarkdownOutputs = {
  index: string;
  contributions: string;
  blogDrafts: Array<{
    fileName: string;
    content: string;
  }>;
};

export function generateWebsiteMarkdown(
  contributions: ContributionRecord[],
  config: DevVaultConfig
): WebsiteMarkdownOutputs {
  const sorted = sortContributions(contributions).filter((record) => record.homepageReady);

  return {
    index: generateWebsiteIndex(sorted, config),
    contributions: generateWebsiteContributions(sorted),
    blogDrafts: sorted.slice(0, 5).map(generateBlogDraft)
  };
}

function generateWebsiteIndex(
  contributions: ContributionRecord[],
  config: DevVaultConfig
): string {
  const ownerName = config.site?.ownerName ?? config.github.username;
  const tagline = config.site?.tagline ?? "Open-source Contributor";
  const lines = [`# ${ownerName}`, "", tagline, "", "## Recent Contributions", ""];

  if (contributions.length === 0) {
    lines.push("No merged contributions recorded yet.", "");
    return lines.join("\n");
  }

  for (const record of contributions.slice(0, 5)) {
    lines.push(`- ${record.project} #${record.pr} - ${record.area}: ${record.impact}`);
  }

  lines.push("");
  return lines.join("\n");
}

function generateWebsiteContributions(contributions: ContributionRecord[]): string {
  const lines = ["# Contributions", ""];

  if (contributions.length === 0) {
    lines.push("No merged contributions recorded yet.", "");
    return lines.join("\n");
  }

  for (const record of contributions) {
    lines.push(`## ${record.project} #${record.pr}`);
    lines.push("");
    lines.push(record.impact);
    lines.push("");
    lines.push(`- Date: ${record.mergedAt.slice(0, 10)}`);
    lines.push(`- Area: ${record.area}`);
    lines.push(`- Type: ${record.type}`);
    lines.push(`- PR: ${record.links.pr}`);
    lines.push("");
  }

  return lines.join("\n");
}

function generateBlogDraft(record: ContributionRecord): WebsiteMarkdownOutputs["blogDrafts"][number] {
  const slug = `${record.project}-${record.pr}-${record.area}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const title = `${record.project} #${record.pr}: ${record.area}`;
  const lines = [
    `# ${title}`,
    "",
    `Date: ${record.mergedAt.slice(0, 10)}`,
    "",
    `This draft expands on a merged contribution to ${record.project}.`,
    "",
    "## Problem",
    "",
    "Describe the user-facing or maintainer-facing problem that made this contribution necessary.",
    "",
    "## Change",
    "",
    record.impact,
    "",
    "## Impact",
    "",
    `Improved ${record.area} in ${record.project}.`,
    ""
  ];

  return {
    fileName: `${slug}.md`,
    content: lines.join("\n")
  };
}

function sortContributions(contributions: ContributionRecord[]): ContributionRecord[] {
  return [...contributions].sort((left, right) => {
    const dateCompare = right.mergedAt.localeCompare(left.mergedAt);
    return dateCompare === 0 ? left.id.localeCompare(right.id) : dateCompare;
  });
}
