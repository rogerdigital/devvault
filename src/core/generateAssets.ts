import path from "node:path";

import { loadConfig } from "../config/loadConfig.js";
import { generateChangelogMarkdown } from "../generators/changelog.js";
import { generateContributionMarkdown } from "../generators/contributionMarkdown.js";
import { generateDevelopmentLogMarkdown } from "../generators/developmentLog.js";
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
    writtenFiles.push(
      ...(await writeSiteOutputs({
        config,
        siteDirectory: syncedSiteDirectory,
        pullRequests,
        contributions
      }))
    );
  }

  return {
    contributions,
    outputDirectory,
    ...(syncedSiteDirectory ? { syncedSiteDirectory } : {}),
    writtenFiles
  };
}

async function writeStandardOutputs(options: {
  config: DevVaultConfig;
  cwd: string;
  outputDirectory: string;
  pullRequests: PullRequestSnapshot[];
  contributions: ContributionRecord[];
}): Promise<string[]> {
  const website = generateWebsiteMarkdown(options.contributions, options.config);
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
      path: path.join(options.outputDirectory, "devlog.md"),
      content: generateDevelopmentLogMarkdown(options.pullRequests, options.contributions)
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
      path: path.join(options.siteDirectory, site?.devlogPath ?? "src/content/devvault/devlog.md"),
      content: generateDevelopmentLogMarkdown(options.pullRequests, options.contributions)
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
