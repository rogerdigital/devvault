import { buildNextAction } from "../core/buildNextAction.js";
import type { PullRequestSnapshot } from "../types/pr.js";

export const PROMPT_TYPES = [
  "fix-ci",
  "address-review",
  "add-test",
  "maintainer-reply",
  "resume",
  "summary"
] as const;

export type AgentPromptType = (typeof PROMPT_TYPES)[number];

export function isAgentPromptType(value: string): value is AgentPromptType {
  return PROMPT_TYPES.includes(value as AgentPromptType);
}

export function generateAgentPrompt(pr: PullRequestSnapshot, type: AgentPromptType): string {
  const action = buildNextAction(pr);
  const base = [
    `Repo: ${pr.repo}`,
    `PR: #${pr.number}`,
    `Title: ${pr.title}`,
    `URL: ${pr.url}`,
    `Current status: ${action.reason}`,
    `Suggested next action: ${action.next}`,
    "",
    "Context:",
    `- State: ${pr.state}`,
    `- Draft: ${pr.isDraft ? "yes" : "no"}`,
    `- Review decision: ${pr.reviewDecision ?? "unknown"}`,
    `- Check conclusion: ${pr.checkConclusion ?? "unknown"}`,
    `- Changed files: ${pr.changedFiles.length > 0 ? pr.changedFiles.join(", ") : "unknown"}`,
    ""
  ];

  return [...base, ...buildTaskSection(type)].join("\n");
}

function buildTaskSection(type: AgentPromptType): string[] {
  switch (type) {
    case "fix-ci":
      return [
        "Task:",
        "1. Inspect the failing CI context for this PR.",
        "2. Identify the smallest safe code change.",
        "3. Add or adjust focused regression tests when useful.",
        "4. Keep the fix scoped to the changed subsystem.",
        "5. Do not refactor unrelated code.",
        ""
      ];
    case "address-review":
      return [
        "Task:",
        "1. Inspect maintainer and reviewer comments.",
        "2. Separate required changes from optional suggestions.",
        "3. Implement the smallest focused update.",
        "4. Preserve the original PR intent.",
        "5. Summarize what changed for a maintainer reply.",
        ""
      ];
    case "add-test":
      return [
        "Task:",
        "1. Identify the behavior that needs regression coverage.",
        "2. Add a focused test near existing related tests.",
        "3. Avoid public API changes unless required.",
        "4. Run the relevant test command.",
        ""
      ];
    case "maintainer-reply":
      return [
        "Task:",
        "Draft a concise maintainer reply explaining the current status, what changed, and what was verified.",
        "Tone: professional, short, and technical.",
        ""
      ];
    case "resume":
      return [
        "Task:",
        "Write a resume-ready bullet for this merged contribution.",
        "Focus on the technical area, concrete change, and impact.",
        ""
      ];
    case "summary":
      return [
        "Task:",
        "Summarize this PR for release notes, GitHub profile, personal website, and changelog usage.",
        "Extract the affected subsystem and durable technical impact.",
        ""
      ];
  }
}
