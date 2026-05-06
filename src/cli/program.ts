import { Command } from "commander";

import { runGenerateCommand } from "./commands/generate.js";
import { runPromptCommand } from "./commands/prompt.js";
import { runStatusCommand } from "./commands/status.js";
import { runSyncCommand } from "./commands/sync.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("devvault")
    .description("Local-first personal contribution engine for GitHub PR lifecycle automation.")
    .version("0.1.0");

  program.command("sync").description("Fetch pull request snapshots from GitHub.").action(runSyncCommand);

  program.command("status").description("Show tracked pull request status.").action(runStatusCommand);

  program.command("generate").description("Generate contribution assets.").action(runGenerateCommand);

  program
    .command("prompt")
    .description("Generate an agent handoff prompt for a pull request.")
    .option("--pr <ref>", "Pull request reference, for example owner/repo#123.")
    .option("--type <type>", "Prompt type to generate.")
    .action(runPromptCommand);

  return program;
}
