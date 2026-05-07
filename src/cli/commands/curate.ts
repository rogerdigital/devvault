import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { createStore } from "../../storage/store.js";
import type { ContributionRecord } from "../../types/contribution.js";

export async function runCurateCommand(): Promise<void> {
  const store = createStore();
  const contributions = await store.readContributions();

  if (contributions.length === 0) {
    console.log("No contribution records found. Run devvault run first.");
    return;
  }

  const rl = createInterface({ input, output });
  const curated: ContributionRecord[] = [];

  try {
    for (const record of contributions) {
      curated.push(await curateRecord(rl, record));
    }
  } finally {
    rl.close();
  }

  await store.writeContributions(curated);
  console.log(`Updated ${curated.length} contribution records.`);
}

async function curateRecord(
  rl: ReturnType<typeof createInterface>,
  record: ContributionRecord
): Promise<ContributionRecord> {
  console.log("");
  console.log(`${record.project} #${record.pr}`);
  console.log(`Area: ${record.area}`);
  console.log(`Impact: ${record.impact}`);
  console.log(`Tags: ${record.tags.join(", ") || "none"}`);
  console.log(`Curated: ${record.curated ? "yes" : "no"}`);

  const action = (await rl.question("Accept, edit, or skip? [a/e/s] ")).trim().toLowerCase();

  if (action === "s" || action === "skip") {
    return record;
  }

  if (action === "e" || action === "edit") {
    const area = await askWithDefault(rl, "Area", record.area);
    const impact = await askWithDefault(rl, "Impact", record.impact);
    const tagsInput = await askWithDefault(rl, "Tags comma-separated", record.tags.join(", "));

    return {
      ...record,
      area,
      impact,
      tags: parseTags(tagsInput),
      curated: true
    };
  }

  return {
    ...record,
    curated: true
  };
}

async function askWithDefault(
  rl: ReturnType<typeof createInterface>,
  label: string,
  currentValue: string
): Promise<string> {
  const answer = (await rl.question(`${label} [${currentValue}]: `)).trim();
  return answer || currentValue;
}

function parseTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));
}
