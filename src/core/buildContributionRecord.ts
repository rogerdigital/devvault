import type { ContributionRecord, ContributionType } from "../types/contribution.js";
import type { PullRequestSnapshot } from "../types/pr.js";

export function buildContributionRecords(prs: PullRequestSnapshot[]): ContributionRecord[] {
  return prs.filter(isMergedPullRequest).map(buildContributionRecord);
}

export function buildContributionRecord(pr: PullRequestSnapshot): ContributionRecord {
  if (!isMergedPullRequest(pr)) {
    throw new Error(`Cannot build contribution record for unmerged PR ${pr.repo}#${pr.number}.`);
  }

  return {
    id: buildContributionId(pr),
    project: buildProjectName(pr.repo),
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

function buildProjectName(repo: string): string {
  const name = repo.split("/")[1] ?? repo;

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

  if (hasAny(haystack, ["ci", "build", "infra", "workflow"])) {
    return "infra";
  }

  if (hasAny(haystack, ["fix", "bug", "regression"])) {
    return "bugfix";
  }

  return "feature";
}

function inferContributionArea(pr: PullRequestSnapshot): string {
  const firstPath = pr.changedFiles[0];
  if (!firstPath) {
    return "General";
  }

  const [firstSegment, secondSegment] = firstPath.split("/");

  if (firstSegment === "packages" && secondSegment) {
    return titleCase(secondSegment);
  }

  return titleCase(firstSegment);
}

function inferContributionImpact(pr: PullRequestSnapshot): string {
  return pr.title.replace(/\.$/, ".");
}

function inferContributionTags(pr: PullRequestSnapshot): string[] {
  return Array.from(
    new Set(["open-source", ...pr.labels.map((label) => label.toLowerCase().replace(/\s+/g, "-"))])
  ).sort((left, right) => left.localeCompare(right));
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function titleCase(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
