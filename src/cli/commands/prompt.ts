import { generateAgentPrompt, isAgentPromptType } from "../../generators/agentPrompt.js";
import { createStore } from "../../storage/store.js";

export type PromptCommandOptions = {
  pr?: string;
  type?: string;
};

export async function runPromptCommand(options: PromptCommandOptions): Promise<void> {
  if (!options.pr) {
    throw new Error("Missing --pr. Expected owner/repo#123.");
  }

  if (!options.type || !isAgentPromptType(options.type)) {
    throw new Error("Missing or invalid --type.");
  }

  const target = parsePullRequestRef(options.pr);
  const pullRequests = await createStore().readPullRequests();
  const pr = pullRequests.find(
    (candidate) => candidate.repo === target.repo && candidate.number === target.number
  );

  if (!pr) {
    throw new Error(`Pull request ${options.pr} was not found. Run devvault sync first.`);
  }

  console.log(generateAgentPrompt(pr, options.type));
}

export function parsePullRequestRef(value: string): { repo: string; number: number } {
  const match = /^(?<repo>[^/\s]+\/[^#\s]+)#(?<number>\d+)$/.exec(value);

  if (!match?.groups) {
    throw new Error(`Invalid PR reference "${value}". Expected owner/repo#123.`);
  }

  return {
    repo: match.groups.repo,
    number: Number(match.groups.number)
  };
}
