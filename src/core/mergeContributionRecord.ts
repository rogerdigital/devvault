import type { ContributionRecord } from "../types/contribution.js";

const CURATED_FIELDS = [
  "type",
  "area",
  "impact",
  "tags",
  "resumeReady",
  "homepageReady",
  "manualNotes"
] as const;

export function mergeContributionRecords(
  existing: ContributionRecord[],
  generated: ContributionRecord[]
): ContributionRecord[] {
  const existingById = new Map(existing.map((record) => [record.id, record]));
  const generatedIds = new Set(generated.map((record) => record.id));
  const merged = generated.map((record) => mergeContributionRecord(existingById.get(record.id), record));
  const retainedManualRecords = existing.filter((record) => !generatedIds.has(record.id));

  return [...merged, ...retainedManualRecords].sort(compareContributionRecords);
}

export function mergeContributionRecord(
  existing: ContributionRecord | undefined,
  generated: ContributionRecord
): ContributionRecord {
  if (!existing) {
    return generated;
  }

  const merged: ContributionRecord = {
    ...generated,
    links: {
      ...generated.links,
      ...(existing.links.releaseNote ? { releaseNote: existing.links.releaseNote } : {})
    }
  };

  for (const field of CURATED_FIELDS) {
    const value = existing[field];
    if (value !== undefined) {
      Object.assign(merged, { [field]: value });
    }
  }

  return merged;
}

function compareContributionRecords(left: ContributionRecord, right: ContributionRecord): number {
  const dateCompare = right.mergedAt.localeCompare(left.mergedAt);
  if (dateCompare !== 0) {
    return dateCompare;
  }

  return left.id.localeCompare(right.id);
}
