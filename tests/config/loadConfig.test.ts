import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/loadConfig.js";
import { ConfigValidationError, parseDevVaultConfig } from "../../src/config/schema.js";
import { createTempDirectory, removeTempDirectory } from "../helpers/tempDir.js";

let tempDirectory: string | undefined;

afterEach(async () => {
  if (tempDirectory) {
    await removeTempDirectory(tempDirectory);
    tempDirectory = undefined;
  }
});

describe("parseDevVaultConfig", () => {
  it("normalizes YAML-style config keys", () => {
    const config = parseDevVaultConfig({
      github: {
        username: "rogerdigital",
        token_env: "GITHUB_TOKEN"
      },
      repos: ["openclaw/openclaw"],
      output: {
        directory: "generated"
      },
      site: {
        owner_name: "Roger Deng",
        tagline: "Builder",
        sync_directory: "../site",
        contributions_path: "content/contributions.md",
        devlog_path: "content/devlog.md"
      },
      automation: {
        site: {
          commit: true,
          push: false,
          commit_message: "update site"
        }
      }
    });

    expect(config).toEqual({
      github: {
        username: "rogerdigital",
        tokenEnv: "GITHUB_TOKEN"
      },
      repos: ["openclaw/openclaw"],
      output: {
        directory: "generated"
      },
      site: {
        ownerName: "Roger Deng",
        tagline: "Builder",
        syncDirectory: "../site",
        contributionsPath: "content/contributions.md",
        devlogPath: "content/devlog.md"
      },
      automation: {
        site: {
          commit: true,
          push: false,
          commitMessage: "update site"
        }
      }
    });
  });

  it("rejects invalid repo names", () => {
    expect(() =>
      parseDevVaultConfig({
        github: {
          username: "rogerdigital",
          token_env: "GITHUB_TOKEN"
        },
        repos: ["openclaw"]
      })
    ).toThrow(ConfigValidationError);
  });
});

describe("loadConfig", () => {
  it("loads config.yaml from the provided working directory", async () => {
    tempDirectory = await createTempDirectory();
    await mkdir(tempDirectory, { recursive: true });
    await writeFile(
      path.join(tempDirectory, "config.yaml"),
      [
        "github:",
        "  username: rogerdigital",
        "  token_env: GITHUB_TOKEN",
        "repos:",
        "  - openclaw/openclaw"
      ].join("\n"),
      "utf8"
    );

    await expect(loadConfig({ cwd: tempDirectory })).resolves.toMatchObject({
      github: {
        username: "rogerdigital",
        tokenEnv: "GITHUB_TOKEN"
      },
      repos: ["openclaw/openclaw"],
      output: {
        directory: "output"
      }
    });
  });
});
