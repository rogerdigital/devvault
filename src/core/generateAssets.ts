import path from "node:path";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

import { loadConfig } from "../config/loadConfig.js";
import { generateChangelogMarkdown } from "../generators/changelog.js";
import { generateContributionMarkdown } from "../generators/contributionMarkdown.js";
import { updateDevelopmentLogMarkdown } from "../generators/developmentLog.js";
import { generateResumeSnippetsMarkdown } from "../generators/resumeBullet.js";
import { generateWebsiteMarkdown } from "../generators/websiteContent.js";
import { createStore } from "../storage/store.js";
import { writeTextFile } from "../storage/writeText.js";
import type { DevVaultConfig } from "../types/config.js";
import type { ContributionRecord } from "../types/contribution.js";
import type { PullRequestSnapshot } from "../types/pr.js";
import { buildContributionRecords } from "./buildContributionRecord.js";
import { mergeContributionRecords } from "./mergeContributionRecord.js";

export type GeneratedAssetResult = {
  contributions: ContributionRecord[];
  outputDirectory: string;
  syncedSiteDirectory?: string;
  siteCommit?: string;
  writtenFiles: string[];
};

export async function generateAssets(cwd = process.cwd()): Promise<GeneratedAssetResult> {
  const config = await loadConfig({ cwd });
  const store = createStore(cwd);
  const pullRequests = await store.readPullRequests();
  const existingContributions = await store.readContributions();
  const generatedContributions = buildContributionRecords(pullRequests);
  const contributions = mergeContributionRecords(existingContributions, generatedContributions);
  const outputDirectory = path.resolve(cwd, config.output.directory);
  const writtenFiles: string[] = [];

  await store.writeContributions(contributions);
  writtenFiles.push(
    ...(await writeStandardOutputs({
      config,
      cwd,
      outputDirectory,
      pullRequests,
      contributions
    }))
  );

  const syncedSiteDirectory = config.site?.syncDirectory
    ? path.resolve(cwd, config.site.syncDirectory)
    : undefined;

  if (syncedSiteDirectory) {
    const siteFiles = await writeSiteOutputs({
      config,
      siteDirectory: syncedSiteDirectory,
      pullRequests,
      contributions
    });
    writtenFiles.push(...siteFiles);
    const siteCommit = commitSiteChangesIfConfigured(config, syncedSiteDirectory, siteFiles);

    return {
      contributions,
      outputDirectory,
      syncedSiteDirectory,
      ...(siteCommit ? { siteCommit } : {}),
      writtenFiles
    };
  }

  return {
    contributions,
    outputDirectory,
    ...(syncedSiteDirectory ? { syncedSiteDirectory } : {}),
    writtenFiles
  };
}

function commitSiteChangesIfConfigured(
  config: DevVaultConfig,
  siteDirectory: string,
  relativeFiles: string[]
): string | undefined {
  const automation = config.automation?.site;
  if (!automation?.commit || relativeFiles.length === 0) {
    return undefined;
  }

  execFileSync("git", ["add", ...relativeFiles], {
    cwd: siteDirectory,
    stdio: "ignore"
  });

  const status = execFileSync("git", ["status", "--short"], {
    cwd: siteDirectory,
    encoding: "utf8"
  }).trim();

  if (!status) {
    return undefined;
  }

  execFileSync("git", ["commit", "-m", automation.commitMessage ?? "update DevVault contribution assets"], {
    cwd: siteDirectory,
    stdio: "ignore"
  });

  const commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: siteDirectory,
    encoding: "utf8"
  }).trim();

  if (automation.push) {
    execFileSync("git", ["push"], {
      cwd: siteDirectory,
      stdio: "ignore"
    });
  }

  return commit;
}

async function writeStandardOutputs(options: {
  config: DevVaultConfig;
  cwd: string;
  outputDirectory: string;
  pullRequests: PullRequestSnapshot[];
  contributions: ContributionRecord[];
}): Promise<string[]> {
  const website = generateWebsiteMarkdown(options.contributions, options.config);
  const devlogPath = path.join(options.outputDirectory, "devlog.md");
  const devlogContent = updateDevelopmentLogMarkdown(
    await readExistingTextFile(devlogPath),
    options.pullRequests,
    options.contributions
  );
  const files = [
    {
      path: path.join(options.outputDirectory, "contributions.md"),
      content: generateContributionMarkdown(options.contributions)
    },
    {
      path: path.join(options.outputDirectory, "changelog.md"),
      content: generateChangelogMarkdown(options.contributions)
    },
    {
      path: path.join(options.outputDirectory, "resume-snippets.md"),
      content: generateResumeSnippetsMarkdown(options.contributions)
    },
    {
      path: devlogPath,
      content: devlogContent
    },
    {
      path: path.join(options.outputDirectory, "website", "index.md"),
      content: website.index
    },
    {
      path: path.join(options.outputDirectory, "website", "contributions.md"),
      content: website.contributions
    },
    ...website.blogDrafts.map((draft) => ({
      path: path.join(options.outputDirectory, "website", "blog-drafts", draft.fileName),
      content: draft.content
    }))
  ];

  for (const file of files) {
    await writeTextFile(file.path, file.content);
  }

  return files.map((file) => path.relative(options.cwd, file.path));
}

async function writeSiteOutputs(options: {
  config: DevVaultConfig;
  siteDirectory: string;
  pullRequests: PullRequestSnapshot[];
  contributions: ContributionRecord[];
}): Promise<string[]> {
  const website = generateWebsiteMarkdown(options.contributions, options.config);
  const site = options.config.site;
  const devlogPath = path.join(options.siteDirectory, site?.devlogPath ?? "src/content/devvault/devlog.md");
  const devlogContent = updateDevelopmentLogMarkdown(
    await readExistingTextFile(devlogPath),
    options.pullRequests,
    options.contributions
  );
  const files = [
    {
      path: path.join(options.siteDirectory, site?.indexPath ?? "src/content/devvault/index.md"),
      content: website.index
    },
    {
      path: path.join(
        options.siteDirectory,
        site?.contributionsPath ?? "src/content/devvault/contributions.md"
      ),
      content: website.contributions
    },
    {
      path: devlogPath,
      content: devlogContent
    },
    ...website.blogDrafts.map((draft) => ({
      path: path.join(
        options.siteDirectory,
        site?.blogDraftsDirectory ?? "src/content/devvault/blog-drafts",
        draft.fileName
      ),
      content: draft.content
    }))
  ];

  for (const file of files) {
    await writeTextFile(file.path, file.content);
  }

  return files.map((file) => path.relative(options.siteDirectory, file.path));
}

async function readExistingTextFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
