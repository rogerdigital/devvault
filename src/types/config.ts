export type DevVaultProjectConfig = {
  name: string;
  repos: string[];
  siteSection?: string;
};

export type DevVaultConfig = {
  github: {
    username: string;
    tokenEnv: string;
  };
  repos: string[];
  projects?: DevVaultProjectConfig[];
  output: {
    directory: string;
  };
  site?: {
    ownerName?: string;
    tagline?: string;
    syncDirectory?: string;
    indexPath?: string;
    contributionsPath?: string;
    devlogPath?: string;
    blogDraftsDirectory?: string;
  };
  automation?: {
    site?: {
      commit?: boolean;
      push?: boolean;
      commitMessage?: string;
    };
  };
};
