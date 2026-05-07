import type { DevVaultConfig } from "../types/config.js";

type RawDevVaultConfig = {
  github?: {
    username?: unknown;
    token_env?: unknown;
    tokenEnv?: unknown;
  };
  repos?: unknown;
  projects?: unknown;
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
  automation?: {
    site?: {
      commit?: unknown;
      push?: unknown;
      commit_message?: unknown;
      commitMessage?: unknown;
    };
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
  const projects = parseProjects(config.projects);
  const repos = mergeRepos(parseRepos(config.repos, "repos", { allowEmpty: true }), projects);
  const outputDirectory = optionalString(config.output?.directory) ?? "output";
  const site = parseSite(config.site);
  const automation = parseAutomation(config.automation);

  if (repos.length === 0) {
    throw new ConfigValidationError("Config must include at least one repo or project repo.");
  }

  return {
    github: {
      username,
      tokenEnv
    },
    repos,
    ...(projects.length ? { projects } : {}),
    output: {
      directory: outputDirectory
    },
    ...(site ? { site } : {}),
    ...(automation ? { automation } : {})
  };
}

function parseRepos(
  value: unknown,
  field: string,
  options: { allowEmpty?: boolean } = {}
): string[] {
  if (value === undefined && options.allowEmpty) {
    return [];
  }

  if (!Array.isArray(value) || (!options.allowEmpty && value.length === 0)) {
    throw new ConfigValidationError(`${field} must include at least one repo.`);
  }

  return value.map((repo, index) => {
    const parsed = requiredString(repo, `${field}[${index}]`);

    if (!/^[^/\s]+\/[^/\s]+$/.test(parsed)) {
      throw new ConfigValidationError(`Invalid repo "${parsed}". Expected owner/name.`);
    }

    return parsed;
  });
}

function parseProjects(value: unknown): NonNullable<DevVaultConfig["projects"]> {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ConfigValidationError("projects must be an array when provided.");
  }

  return value.map((project, index) => {
    if (!isRecord(project)) {
      throw new ConfigValidationError(`projects[${index}] must be an object.`);
    }

    const name = requiredString(project.name, `projects[${index}].name`);
    const repos = parseRepos(project.repos, `projects[${index}].repos`);
    const siteSection = optionalString(project.site_section ?? project.siteSection);

    return {
      name,
      repos,
      ...(siteSection ? { siteSection } : {})
    };
  });
}

function mergeRepos(
  repos: string[],
  projects: NonNullable<DevVaultConfig["projects"]>
): string[] {
  return Array.from(new Set([...repos, ...projects.flatMap((project) => project.repos)]));
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

function parseAutomation(
  automation: RawDevVaultConfig["automation"]
): DevVaultConfig["automation"] | undefined {
  if (automation === undefined) {
    return undefined;
  }

  if (!isRecord(automation)) {
    throw new ConfigValidationError("automation must be an object when provided.");
  }

  const site = automation.site;
  if (site === undefined) {
    return undefined;
  }

  if (!isRecord(site)) {
    throw new ConfigValidationError("automation.site must be an object when provided.");
  }

  const commit = optionalBoolean(site.commit) ?? false;
  const push = optionalBoolean(site.push) ?? false;
  const commitMessage =
    optionalString(site.commit_message ?? site.commitMessage) ?? "update DevVault contribution assets";

  return {
    site: {
      commit,
      push,
      commitMessage
    }
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

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
