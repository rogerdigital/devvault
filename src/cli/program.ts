import { Command } from "commander";

import { runCurateCommand } from "./commands/curate.js";
import { runDoctorCommand } from "./commands/doctor.js";
import { runGenerateCommand } from "./commands/generate.js";
import { runInitCommand } from "./commands/init.js";
import { runPromptCommand } from "./commands/prompt.js";
import { runAutomationCommand } from "./commands/run.js";
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

  program.command("doctor").description("Check DevVault config, GitHub auth, and local paths.").action(runDoctorCommand);

  program
    .command("curate")
    .description("Review contribution records and mark accepted edits as curated.")
    .action(runCurateCommand);

  program
    .command("run")
    .description("Sync PRs, update contribution assets, and sync configured personal site content.")
    .action(runAutomationCommand);

  program
    .command("init")
    .description("Create a starter DevVault config and local output directories.")
    .option("--username <username>", "GitHub username for created PRs.")
    .option("--repo <repo>", "Repository to track. Can be provided more than once.", collectValues, [])
    .option("--token-env <name>", "Environment variable containing the GitHub token.")
    .action(runInitCommand);

  program
    .command("prompt")
    .description("Generate an agent handoff prompt for a pull request.")
    .option("--pr <ref>", "Pull request reference, for example owner/repo#123.")
    .option("--type <type>", "Prompt type to generate.")
    .action(runPromptCommand);

  return program;
}

function collectValues(value: string, previous: string[]): string[] {
  return [...previous, value];
}
