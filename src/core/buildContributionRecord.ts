import type { ContributionRecord, ContributionType } from "../types/contribution.js";
import type { DevVaultConfig } from "../types/config.js";
import type { PullRequestSnapshot } from "../types/pr.js";

export function buildContributionRecords(
  prs: PullRequestSnapshot[],
  config?: Pick<DevVaultConfig, "projects">
): ContributionRecord[] {
  return prs.filter(isMergedPullRequest).map((pr) => buildContributionRecord(pr, config));
}

export function buildContributionRecord(
  pr: PullRequestSnapshot,
  config?: Pick<DevVaultConfig, "projects">
): ContributionRecord {
  if (!isMergedPullRequest(pr)) {
    throw new Error(`Cannot build contribution record for unmerged PR ${pr.repo}#${pr.number}.`);
  }

  return {
    id: buildContributionId(pr),
    project: buildProjectName(pr.repo, config),
    repo: pr.repo,
    pr: pr.number,
    status: "merged",
    mergedAt: pr.mergedAt,
    type: inferContributionType(pr),
    area: inferContributionArea(pr),
    impact: inferContributionImpact(pr),
    links: {
      pr: pr.url
    },
    tags: inferContributionTags(pr),
    resumeReady: true,
    homepageReady: true
  };
}

function isMergedPullRequest(pr: PullRequestSnapshot): pr is PullRequestSnapshot & { mergedAt: string } {
  return pr.state === "MERGED" && Boolean(pr.mergedAt);
}

function buildContributionId(pr: PullRequestSnapshot): string {
  const repoSlug = pr.repo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${repoSlug}-${pr.number}`;
}

function buildProjectName(repo: string, config?: Pick<DevVaultConfig, "projects">): string {
  const configuredProject = config?.projects?.find((project) => project.repos.includes(repo));
  if (configuredProject) {
    return configuredProject.name;
  }

  const name = repo.split("/")[1] ?? repo;
  const knownNames: Record<string, string> = {
    devvault: "DevVault",
    openclaw: "OpenClaw"
  };

  if (knownNames[name.toLowerCase()]) {
    return knownNames[name.toLowerCase()];
  }

  return name
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function inferContributionType(pr: PullRequestSnapshot): ContributionType {
  const haystack = `${pr.title} ${pr.labels.join(" ")}`.toLowerCase();

  if (hasAny(haystack, ["test", "spec", "coverage"])) {
    return "test";
  }

  if (hasAny(haystack, ["doc", "readme"])) {
    return "docs";
  }

  if (hasAny(haystack, ["refactor", "cleanup"])) {
    return "refactor";
  }

  if (hasAny(haystack, ["fix", "bug", "regression"])) {
    return "bugfix";
  }

  if (hasAny(haystack, ["ci", "build", "infra", "workflow"])) {
    return "infra";
  }

  return "feature";
}

function inferContributionArea(pr: PullRequestSnapshot): string {
  const firstPath = pr.changedFiles.find(isUsefulSourcePath);
  if (!firstPath) {
    return inferAreaFromTitle(pr.title) ?? "General";
  }

  const [firstSegment, secondSegment, thirdSegment] = firstPath.split("/");

  if (firstSegment === "extensions" && secondSegment) {
    return titleCase(secondSegment);
  }

  if (firstSegment === "packages" && secondSegment) {
    return titleCase(secondSegment);
  }

  if (firstSegment === "src" && secondSegment) {
    return titleCase(thirdSegment && secondSegment === "config" ? "config" : secondSegment);
  }

  return titleCase(firstSegment);
}

function inferContributionImpact(pr: PullRequestSnapshot): string {
  const bodyImpact = inferImpactFromBody(pr.body);
  if (bodyImpact) {
    return bodyImpact;
  }

  const stripped = stripConventionalCommitPrefix(pr.title);
  const withoutAreaPrefix = stripped.replace(/^[A-Z][A-Za-z0-9 -]{1,32}:\s+/, "");
  const normalized = normalizeLeadingVerb(withoutAreaPrefix);

  return ensureSentence(normalized);
}

function inferContributionTags(pr: PullRequestSnapshot): string[] {
  const pathTags = pr.changedFiles.flatMap(inferTagsFromPath);

  return Array.from(
    new Set([
      "open-source",
      ...pathTags,
      ...pr.labels.map((label) => label.toLowerCase().replace(/\s+/g, "-"))
    ])
  ).sort((left, right) => left.localeCompare(right));
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function titleCase(value: string): string {
  const acronyms: Record<string, string> = {
    api: "API",
    ci: "CI",
    dm: "DM",
    sdk: "SDK",
    stt: "STT",
    tui: "TUI",
    ui: "UI",
    whatsapp: "WhatsApp"
  };

  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => acronyms[part.toLowerCase()] ?? `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function inferAreaFromTitle(title: string): string | undefined {
  const match = /^(?:fix|feat|docs|test|refactor|chore|ci)\((?<scope>[^)]+)\):/i.exec(title);
  return match?.groups?.scope ? titleCase(match.groups.scope) : undefined;
}

function inferImpactFromBody(body: string | undefined): string | undefined {
  if (!body) {
    return undefined;
  }

  const section = extractSection(body, ["summary", "what changed", "changes"]);
  const candidate = section
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^[-*]\s+\S/.test(line));

  if (!candidate) {
    return undefined;
  }

  const cleaned = candidate
    .replace(/^[-*]\s+/, "")
    .replace(/`/g, "")
    .trim();

  if (cleaned.length < 12) {
    return undefined;
  }

  return ensureSentence(normalizeLeadingVerb(cleaned));
}

function extractSection(body: string, headings: string[]): string {
  const lines = body.split(/\r?\n/);
  let start = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const normalizedHeading = lines[index]?.replace(/^#+\s*/, "").trim().toLowerCase();
    if (normalizedHeading && headings.includes(normalizedHeading)) {
      start = index + 1;
      break;
    }
  }

  if (start === -1) {
    return body;
  }

  const end = lines.findIndex((line, index) => index > start && /^##+\s+/.test(line));
  return lines.slice(start, end === -1 ? undefined : end).join("\n");
}

function stripConventionalCommitPrefix(title: string): string {
  return title.replace(/^(fix|feat|docs|test|refactor|chore|ci)(\([^)]+\))?:\s*/i, "");
}

function normalizeLeadingVerb(value: string): string {
  const trimmed = value.trim();
  const replacements: Array<[RegExp, string]> = [
    [/^add\b/i, "Added"],
    [/^avoid\b/i, "Avoided"],
    [/^bootstrap\b/i, "Bootstrapped"],
    [/^clarify\b/i, "Clarified"],
    [/^deduplicate\b/i, "Deduplicated"],
    [/^prevent\b/i, "Prevented"],
    [/^refresh\b/i, "Refreshed"],
    [/^resync\b/i, "Resynced"]
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(trimmed)) {
      return trimmed.replace(pattern, replacement);
    }
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function ensureSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Improved project quality.";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function inferTagsFromPath(filePath: string): string[] {
  if (!isUsefulSourcePath(filePath)) {
    return [];
  }

  const [firstSegment, secondSegment] = filePath.split("/");

  if (firstSegment === "extensions" && secondSegment) {
    return [secondSegment.toLowerCase()];
  }

  if (firstSegment === "src" && secondSegment) {
    return [secondSegment.toLowerCase()];
  }

  if (firstSegment === "packages" && secondSegment) {
    return [secondSegment.toLowerCase()];
  }

  return [];
}

function isUsefulSourcePath(filePath: string): boolean {
  const ignoredFiles = new Set(["CHANGELOG.md", "README.md"]);
  const ignoredPrefixes = [".github/", "docs/"];

  if (ignoredFiles.has(filePath)) {
    return false;
  }

  return !ignoredPrefixes.some((prefix) => filePath.startsWith(prefix));
}
