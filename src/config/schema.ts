import type { DevVaultConfig } from "../types/config.js";

type RawDevVaultConfig = {
  github?: {
    username?: unknown;
    token_env?: unknown;
    tokenEnv?: unknown;
  };
  repos?: unknown;
  output?: {
    directory?: unknown;
  };
  site?: {
    owner_name?: unknown;
    ownerName?: unknown;
    tagline?: unknown;
    sync_directory?: unknown;
    syncDirectory?: unknown;
    index_path?: unknown;
    indexPath?: unknown;
    contributions_path?: unknown;
    contributionsPath?: unknown;
    devlog_path?: unknown;
    devlogPath?: unknown;
    blog_drafts_directory?: unknown;
    blogDraftsDirectory?: unknown;
  };
};

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigValidationError";
  }
}

export function parseDevVaultConfig(raw: unknown): DevVaultConfig {
  if (!isRecord(raw)) {
    throw new ConfigValidationError("Config must be a YAML object.");
  }

  const config = raw as RawDevVaultConfig;
  const github = config.github;

  if (!isRecord(github)) {
    throw new ConfigValidationError("Config must include github settings.");
  }

  const username = requiredString(github.username, "github.username");
  const tokenEnv = requiredString(github.token_env ?? github.tokenEnv, "github.token_env");
  const repos = parseRepos(config.repos);
  const outputDirectory = optionalString(config.output?.directory) ?? "output";
  const site = parseSite(config.site);

  return {
    github: {
      username,
      tokenEnv
    },
    repos,
    output: {
      directory: outputDirectory
    },
    ...(site ? { site } : {})
  };
}

function parseRepos(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ConfigValidationError("Config must include at least one repo.");
  }

  return value.map((repo, index) => {
    const parsed = requiredString(repo, `repos[${index}]`);

    if (!/^[^/\s]+\/[^/\s]+$/.test(parsed)) {
      throw new ConfigValidationError(`Invalid repo "${parsed}". Expected owner/name.`);
    }

    return parsed;
  });
}

function parseSite(site: RawDevVaultConfig["site"]): DevVaultConfig["site"] | undefined {
  if (site === undefined) {
    return undefined;
  }

  if (!isRecord(site)) {
    throw new ConfigValidationError("site must be an object when provided.");
  }

  const ownerName = optionalString(site.owner_name ?? site.ownerName);
  const tagline = optionalString(site.tagline);
  const syncDirectory = optionalString(site.sync_directory ?? site.syncDirectory);
  const indexPath = optionalString(site.index_path ?? site.indexPath);
  const contributionsPath = optionalString(site.contributions_path ?? site.contributionsPath);
  const devlogPath = optionalString(site.devlog_path ?? site.devlogPath);
  const blogDraftsDirectory = optionalString(site.blog_drafts_directory ?? site.blogDraftsDirectory);

  if (
    !ownerName &&
    !tagline &&
    !syncDirectory &&
    !indexPath &&
    !contributionsPath &&
    !devlogPath &&
    !blogDraftsDirectory
  ) {
    return undefined;
  }

  return {
    ...(ownerName ? { ownerName } : {}),
    ...(tagline ? { tagline } : {}),
    ...(syncDirectory ? { syncDirectory } : {}),
    ...(indexPath ? { indexPath } : {}),
    ...(contributionsPath ? { contributionsPath } : {}),
    ...(devlogPath ? { devlogPath } : {}),
    ...(blogDraftsDirectory ? { blogDraftsDirectory } : {})
  };
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ConfigValidationError(`${field} must be a non-empty string.`);
  }

  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
