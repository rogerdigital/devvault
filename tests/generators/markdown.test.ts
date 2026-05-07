import { describe, expect, it } from "vitest";

import { generateChangelogMarkdown } from "../../src/generators/changelog.js";
import { generateContributionMarkdown } from "../../src/generators/contributionMarkdown.js";
import { generateResumeSnippetsMarkdown } from "../../src/generators/resumeBullet.js";
import { generateWebsiteMarkdown } from "../../src/generators/websiteContent.js";
import type { DevVaultConfig } from "../../src/types/config.js";
import type { ContributionRecord } from "../../src/types/contribution.js";

describe("markdown generators", () => {
  it("generates contribution markdown grouped by project", () => {
    expect(generateContributionMarkdown([createContribution()])).toContain("## OpenClaw");
    expect(generateContributionMarkdown([createContribution()])).toContain("- Impact: Fixed reconnect.");
  });

  it("generates changelog markdown grouped by date", () => {
    expect(generateChangelogMarkdown([createContribution()])).toContain("## 2026-04-29");
    expect(generateChangelogMarkdown([createContribution()])).toContain(
      "- Merged OpenClaw PR #74224: Fixed reconnect."
    );
  });

  it("generates resume snippets for resume-ready records only", () => {
    const markdown = generateResumeSnippetsMarkdown([
      createContribution(),
      createContribution({ id: "hidden", pr: 1, resumeReady: false })
    ]);

    expect(markdown).toContain("Improved TUI reliability in OpenClaw (#74224): Fixed reconnect.");
    expect(markdown).not.toContain("#1");
  });

  it("generates website markdown and blog drafts", () => {
    const website = generateWebsiteMarkdown([createContribution()], createConfig());

    expect(website.index).toContain("# Roger Deng");
    expect(website.contributions).toContain("## OpenClaw #74224");
    expect(website.blogDrafts).toHaveLength(1);
    expect(website.blogDrafts[0]?.fileName).toBe("openclaw-74224-tui-reliability.md");
  });
});

function createContribution(overrides: Partial<ContributionRecord> = {}): ContributionRecord {
  return {
    id: "openclaw-openclaw-74224",
    project: "OpenClaw",
    repo: "openclaw/openclaw",
    pr: 74224,
    status: "merged",
    mergedAt: "2026-04-29T00:00:00Z",
    type: "bugfix",
    area: "TUI reliability",
    impact: "Fixed reconnect.",
    links: {
      pr: "https://github.com/openclaw/openclaw/pull/74224"
    },
    tags: ["open-source", "tui"],
    resumeReady: true,
    homepageReady: true,
    ...overrides
  };
}

function createConfig(): DevVaultConfig {
  return {
    github: {
      username: "rogerdigital",
      tokenEnv: "GITHUB_TOKEN"
    },
    repos: ["openclaw/openclaw"],
    output: {
      directory: "output"
    },
    site: {
      ownerName: "Roger Deng",
      tagline: "iOS Engineer"
    }
  };
}
