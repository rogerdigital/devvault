import { describe, expect, it } from "vitest";

import { parsePullRequestRef } from "../../src/cli/commands/prompt.js";
import { generateAgentPrompt, isAgentPromptType } from "../../src/generators/agentPrompt.js";
import type { PullRequestSnapshot } from "../../src/types/pr.js";

describe("parsePullRequestRef", () => {
  it("parses owner/repo#number references", () => {
    expect(parsePullRequestRef("openclaw/openclaw#74224")).toEqual({
      repo: "openclaw/openclaw",
      number: 74224
    });
  });

  it("rejects invalid references", () => {
    expect(() => parsePullRequestRef("openclaw#74224")).toThrow("Invalid PR reference");
  });
});

describe("isAgentPromptType", () => {
  it("accepts known prompt types", () => {
    expect(isAgentPromptType("fix-ci")).toBe(true);
    expect(isAgentPromptType("resolve-conflict")).toBe(true);
    expect(isAgentPromptType("resume")).toBe(true);
  });

  it("rejects unknown prompt types", () => {
    expect(isAgentPromptType("unknown")).toBe(false);
  });
});

describe("generateAgentPrompt", () => {
  it("generates a fix-ci prompt with PR context", () => {
    const prompt = generateAgentPrompt(createPullRequest({ checkConclusion: "FAILURE" }), "fix-ci");

    expect(prompt).toContain("Repo: openclaw/openclaw");
    expect(prompt).toContain("PR: #74224");
    expect(prompt).toContain("Current status: CI checks failed.");
    expect(prompt).toContain("Inspect the failing CI context");
  });

  it("generates a resume prompt", () => {
    const prompt = generateAgentPrompt(createPullRequest({ state: "MERGED" }), "resume");

    expect(prompt).toContain("Write a resume-ready bullet");
  });

  it("generates a conflict resolution prompt", () => {
    const prompt = generateAgentPrompt(
      createPullRequest({ mergeable: "CONFLICTING" }),
      "resolve-conflict"
    );

    expect(prompt).toContain("Pull request has merge conflicts.");
    expect(prompt).toContain("Preserve the original intent");
  });
});

function createPullRequest(overrides: Partial<PullRequestSnapshot> = {}): PullRequestSnapshot {
  return {
    id: "PR_74224",
    repo: "openclaw/openclaw",
    number: 74224,
    title: "Fix reconnect watchdog",
    url: "https://github.com/openclaw/openclaw/pull/74224",
    author: "rogerdigital",
    state: "OPEN",
    isDraft: false,
    createdAt: "2026-04-28T00:00:00Z",
    updatedAt: "2026-04-29T00:00:00Z",
    labels: [],
    changedFiles: ["packages/tui/streamingWatchdog.ts"],
    ...overrides
  };
}
