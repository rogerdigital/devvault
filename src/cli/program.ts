import { Command } from "commander";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("devvault")
    .description("Local-first personal contribution engine for GitHub PR lifecycle automation.")
    .version("0.1.0");

  program
    .command("status")
    .description("Show tracked pull request status.")
    .action(() => {
      console.log("devvault status is not implemented yet.");
    });

  return program;
}
