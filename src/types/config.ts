export type DevVaultConfig = {
  github: {
    username: string;
    tokenEnv: string;
  };
  repos: string[];
  output: {
    directory: string;
  };
  site?: {
    ownerName?: string;
    tagline?: string;
  };
};
