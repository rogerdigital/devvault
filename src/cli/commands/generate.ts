import path from "node:path";

import { generateAssets } from "../../core/generateAssets.js";

export async function runGenerateCommand(): Promise<void> {
  const cwd = process.cwd();
  const result = await generateAssets(cwd);

  console.log(`Generated ${result.contributions.length} contribution records.`);
  console.log(`Wrote Markdown output to ${path.relative(cwd, result.outputDirectory) || "."}.`);
  if (result.syncedSiteDirectory) {
    console.log(`Synced personal site content to ${result.syncedSiteDirectory}.`);
  }
}
