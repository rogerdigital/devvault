export type ContributionType = "bugfix" | "feature" | "test" | "docs" | "refactor" | "infra";

export type ContributionRecord = {
  id: string;
  project: string;
  repo: string;
  pr: number;
  status: "merged";
  mergedAt: string;
  type: ContributionType;
  area: string;
  impact: string;
  links: {
    pr: string;
    releaseNote?: string;
  };
  tags: string[];
  resumeReady: boolean;
  homepageReady: boolean;
  manualNotes?: string;
};
