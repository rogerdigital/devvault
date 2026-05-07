import { groupPullRequests } from "./classifyPullRequests.js";
import type { ContributionRecord } from "../types/contribution.js";
import type { ClassifiedPullRequest, PullRequestSnapshot } from "../types/pr.js";

export type ActivityReport = {
  since: Date;
  currentNeedsAction: ClassifiedPullRequest[];
  recentPullRequests: PullRequestSnapshot[];
  recentContributions: ContributionRecord[];
  homepageReadyContributions: ContributionRecord[];
};

export function buildActivityReport(options: {
  pullRequests: PullRequestSnapshot[];
  contributions: ContributionRecord[];
  since: Date;
}): ActivityReport {
  const currentNeedsAction = groupPullRequests(options.pullRequests).needs_action;
  const recentPullRequests = options.pullRequests.filter((pr) => isAtOrAfter(pr.updatedAt, options.since));
  const recentContributions = options.contributions.filter((contribution) =>
    isAtOrAfter(contribution.mergedAt, options.since)
  );

  return {
    since: options.since,
    currentNeedsAction,
    recentPullRequests,
    recentContributions,
    homepageReadyContributions: recentContributions.filter((contribution) => contribution.homepageReady)
  };
}

export function parseSinceOption(value: string | undefined, now = new Date()): Date {
  if (!value) {
    return subtractDays(now, 7);
  }

  const durationMatch = /^(?<amount>\d+)(?<unit>[dhw])$/.exec(value.trim());
  if (durationMatch?.groups) {
    const amount = Number(durationMatch.groups.amount);
    const unit = durationMatch.groups.unit;

    if (unit === "d") {
      return subtractDays(now, amount);
    }

    if (unit === "h") {
      return new Date(now.getTime() - amount * 60 * 60 * 1000);
    }

    return subtractDays(now, amount * 7);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid --since value "${value}". Use 7d, 24h, 2w, or an ISO date.`);
  }

  return parsed;
}

function isAtOrAfter(value: string, since: Date): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= since;
}

function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}
