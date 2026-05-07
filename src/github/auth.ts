import { execFileSync } from "node:child_process";

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

  const execFile = options.execFile ?? execFileSync;

  try {
    const token = execFile("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

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
