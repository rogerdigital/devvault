import { execFileSync } from "node:child_process";

import { runCommand } from "../core/runCommand.js";
import { GitHubRequestError } from "./client.js";

export type ResolveGitHubTokenOptions = {
  tokenEnv: string;
  env?: NodeJS.ProcessEnv;
  execFile?: typeof execFileSync;
};

export function resolveGitHubToken(options: ResolveGitHubTokenOptions): string {
  const env = options.env ?? process.env;
  const envToken = env[options.tokenEnv];

  if (envToken?.trim()) {
    return envToken.trim();
  }

  const execFile = options.execFile;

  try {
    const token = (
      execFile
        ? execFile("gh", ["auth", "token"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"]
          })
        : runCommand("gh", ["auth", "token"], {
            failureMessage: "Failed to read GitHub token from GitHub CLI.",
            nextStep: "Run gh auth login or set the configured GitHub token environment variable."
          })
    ).trim();

    if (token) {
      return token;
    }
  } catch {
    // Fall through to a focused error below.
  }

  throw new GitHubRequestError(
    `No GitHub token found. Set ${options.tokenEnv} or run gh auth login.`
  );
}
