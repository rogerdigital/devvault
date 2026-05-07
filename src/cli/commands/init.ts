import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type InitCommandOptions = {
  username?: string;
  repo?: string[];
  tokenEnv?: string;
};

export async function runInitCommand(options: InitCommandOptions): Promise<void> {
  const cwd = process.cwd();
  const configPath = path.join(cwd, "config.yaml");
  const config = buildStarterConfig(options);

  await writeFile(configPath, config, { encoding: "utf8", flag: "wx" });
  await mkdir(path.join(cwd, "data"), { recursive: true });
  await mkdir(path.join(cwd, "output", "website", "blog-drafts"), { recursive: true });

  console.log("Created config.yaml, data/, and output/.");
}

function buildStarterConfig(options: InitCommandOptions): string {
  const username = options.username ?? "your-github-username";
  const repos = options.repo?.length ? options.repo : ["owner/repo"];
  const tokenEnv = options.tokenEnv ?? "GITHUB_TOKEN";

  return [
    "github:",
    `  username: ${username}`,
    `  token_env: ${tokenEnv}`,
    "",
    "repos:",
    ...repos.map((repo) => `  - ${repo}`),
    "",
    "output:",
    "  directory: output",
    "",
    "site:",
    `  owner_name: ${username}`,
    "  tagline: Open-source Contributor",
    "  # Uncomment these paths to let devvault run sync Markdown into your personal site repo.",
    "  # sync_directory: ../rogerdigital.github.io",
    "  # index_path: src/content/devvault/index.md",
    "  # contributions_path: src/content/devvault/contributions.md",
    "  # devlog_path: src/content/devvault/devlog.md",
    "  # blog_drafts_directory: src/content/devvault/blog-drafts",
    "",
    "automation:",
    "  site:",
    "    commit: false",
    "    push: false",
    "    commit_message: update DevVault contribution assets",
    ""
  ].join("\n");
}
