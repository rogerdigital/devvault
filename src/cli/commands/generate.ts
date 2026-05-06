import path from "node:path";

import { loadConfig } from "../../config/loadConfig.js";
import { buildContributionRecords } from "../../core/buildContributionRecord.js";
import { mergeContributionRecords } from "../../core/mergeContributionRecord.js";
import { generateChangelogMarkdown } from "../../generators/changelog.js";
import { generateContributionMarkdown } from "../../generators/contributionMarkdown.js";
import { generateResumeSnippetsMarkdown } from "../../generators/resumeBullet.js";
import { generateWebsiteMarkdown } from "../../generators/websiteContent.js";
import { createStore } from "../../storage/store.js";
import { writeTextFile } from "../../storage/writeText.js";

export async function runGenerateCommand(): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig({ cwd });
  const store = createStore(cwd);
  const pullRequests = await store.readPullRequests();
  const existingContributions = await store.readContributions();
  const generatedContributions = buildContributionRecords(pullRequests);
  const contributions = mergeContributionRecords(existingContributions, generatedContributions);
  const outputDirectory = path.resolve(cwd, config.output.directory);
  const website = generateWebsiteMarkdown(contributions, config);

  await store.writeContributions(contributions);
  await writeTextFile(
    path.join(outputDirectory, "contributions.md"),
    generateContributionMarkdown(contributions)
  );
  await writeTextFile(path.join(outputDirectory, "changelog.md"), generateChangelogMarkdown(contributions));
  await writeTextFile(
    path.join(outputDirectory, "resume-snippets.md"),
    generateResumeSnippetsMarkdown(contributions)
  );
  await writeTextFile(path.join(outputDirectory, "website", "index.md"), website.index);
  await writeTextFile(path.join(outputDirectory, "website", "contributions.md"), website.contributions);

  for (const draft of website.blogDrafts) {
    await writeTextFile(
      path.join(outputDirectory, "website", "blog-drafts", draft.fileName),
      draft.content
    );
  }

  console.log(`Generated ${contributions.length} contribution records.`);
  console.log(`Wrote Markdown output to ${path.relative(cwd, outputDirectory) || "."}.`);
}
