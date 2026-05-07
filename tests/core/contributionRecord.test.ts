import { describe, expect, it } from "vitest";

import { buildContributionRecord } from "../../src/core/buildContributionRecord.js";
import { mergeContributionRecords } from "../../src/core/mergeContributionRecord.js";
import type { ContributionRecord } from "../../src/types/contribution.js";
import type { PullRequestSnapshot } from "../../src/types/pr.js";

describe("buildContributionRecord", () => {
  it("builds a stable record from a merged PR", () => {
    const record = buildContributionRecord(
      createPullRequest({
        repo: "openclaw/openclaw",
        number: 74224,
        title: "Fix TUI reconnect watchdog",
        state: "MERGED",
        mergedAt: "2026-04-29T00:00:00Z",
        labels: ["bug", "TUI"],
        changedFiles: ["packages/tui/streamingWatchdog.ts"]
      })
    );

    expect(record).toMatchObject({
      id: "openclaw-openclaw-74224",
      project: "OpenClaw",
      repo: "openclaw/openclaw",
      pr: 74224,
      status: "merged",
      mergedAt: "2026-04-29T00:00:00Z",
      type: "bugfix",
      area: "TUI",
      tags: ["bug", "open-source", "tui"]
    });
  });

  it("infers useful metadata from real extension PR paths", () => {
    const record = buildContributionRecord(
      createPullRequest({
        repo: "openclaw/openclaw",
        number: 78420,
        title: "fix(telegram): deduplicate MEDIA attachments in non-streaming mode",
        state: "MERGED",
        mergedAt: "2026-05-01T00:00:00Z",
        changedFiles: ["extensions/telegram/src/bot-message-dispatch.ts"]
      })
    );

    expect(record).toMatchObject({
      project: "OpenClaw",
      area: "Telegram",
      impact: "Deduplicated MEDIA attachments in non-streaming mode.",
      tags: ["open-source", "telegram"],
      type: "bugfix"
    });
  });

  it("ignores changelog files when inferring contribution area", () => {
    const record = buildContributionRecord(
      createPullRequest({
        repo: "openclaw/openclaw",
        number: 74224,
        title: "fix(tui): resync streaming watchdog after reconnect",
        state: "MERGED",
        mergedAt: "2026-04-29T00:00:00Z",
        changedFiles: ["CHANGELOG.md", "src/tui/tui-event-handlers.ts"]
      })
    );

    expect(record).toMatchObject({
      area: "TUI",
      tags: ["open-source", "tui"]
    });
  });

  it("does not classify browser fixes as infra because of words like forcing", () => {
    const record = buildContributionRecord(
      createPullRequest({
        repo: "openclaw/openclaw",
        number: 52451,
        title: "fix(browser): stop forcing an extra blank tab on browser launch",
        state: "MERGED",
        mergedAt: "2026-03-22T00:00:00Z",
        changedFiles: ["src/browser/browser-launch.ts"]
      })
    );

    expect(record).toMatchObject({
      area: "Browser",
      type: "bugfix",
      impact: "Stop forcing an extra blank tab on browser launch."
    });
  });

  it("keeps WhatsApp casing when inferring area from paths", () => {
    const record = buildContributionRecord(
      createPullRequest({
        repo: "openclaw/openclaw",
        number: 64120,
        title: "WhatsApp: add preflight audio transcription for DM voice notes",
        state: "MERGED",
        mergedAt: "2026-04-25T00:00:00Z",
        changedFiles: ["extensions/whatsapp/src/auto-reply/monitor/on-message.ts"]
      })
    );

    expect(record.area).toBe("WhatsApp");
  });

  it("rejects unmerged PRs", () => {
    expect(() => buildContributionRecord(createPullRequest())).toThrow(
      "Cannot build contribution record"
    );
  });
});

describe("mergeContributionRecords", () => {
  it("preserves curated fields while refreshing generated metadata", () => {
    const generated = createContribution({
      id: "openclaw-openclaw-74224",
      impact: "Generated impact.",
      links: {
        pr: "https://github.com/openclaw/openclaw/pull/74224"
      }
    });
    const existing = createContribution({
      id: "openclaw-openclaw-74224",
      curated: true,
      area: "TUI reliability",
      impact: "Curated impact.",
      tags: ["curated"],
      resumeReady: false,
      homepageReady: false,
      manualNotes: "Keep this context.",
      links: {
        pr: "old",
        releaseNote: "https://example.com/release"
      }
    });

    expect(mergeContributionRecords([existing], [generated])).toEqual([
      {
        ...generated,
        type: existing.type,
        area: "TUI reliability",
        impact: "Curated impact.",
        tags: ["curated"],
        resumeReady: false,
        homepageReady: false,
        curated: true,
        manualNotes: "Keep this context.",
        links: {
          pr: "https://github.com/openclaw/openclaw/pull/74224",
          releaseNote: "https://example.com/release"
        }
      }
    ]);
  });

  it("refreshes generated fields when an existing record was not marked curated", () => {
    const generated = createContribution({
      id: "openclaw-openclaw-74224",
      area: "Telegram",
      impact: "Deduplicated MEDIA attachments.",
      tags: ["telegram"]
    });
    const existing = createContribution({
      id: "openclaw-openclaw-74224",
      area: "CHANGELOG.md",
      impact: "Old generated impact.",
      tags: ["old"],
      resumeReady: false
    });

    expect(mergeContributionRecords([existing], [generated])).toEqual([
      {
        ...generated,
        resumeReady: false
      }
    ]);
  });

  it("retains manual records that are no longer generated", () => {
    const manual = createContribution({ id: "manual-only" });

    expect(mergeContributionRecords([manual], [])).toEqual([manual]);
  });
});

function createPullRequest(overrides: Partial<PullRequestSnapshot> = {}): PullRequestSnapshot {
  return {
    id: `PR_${overrides.number ?? 1}`,
    repo: "owner/repo",
    number: 1,
    title: "Add feature",
    url: "https://github.com/owner/repo/pull/1",
    author: "rogerdigital",
    state: "OPEN",
    isDraft: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    labels: [],
    changedFiles: [],
    ...overrides
  };
}

function createContribution(overrides: Partial<ContributionRecord> = {}): ContributionRecord {
  return {
    id: "owner-repo-1",
    project: "Repo",
    repo: "owner/repo",
    pr: 1,
    status: "merged",
    mergedAt: "2026-01-01T00:00:00Z",
    type: "bugfix",
    area: "Core",
    impact: "Impact.",
    links: {
      pr: "https://github.com/owner/repo/pull/1"
    },
    tags: ["open-source"],
    resumeReady: true,
    homepageReady: true,
    ...overrides
  };
}
