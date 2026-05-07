import { describe, expect, it } from "vitest";

import { resolveGitHubToken } from "../../src/github/auth.js";

describe("resolveGitHubToken", () => {
  it("uses the configured environment variable first", () => {
    expect(
      resolveGitHubToken({
        tokenEnv: "GITHUB_TOKEN",
        env: { GITHUB_TOKEN: " env-token " },
        execFile: (() => {
          throw new Error("should not be called");
        }) as never
      })
    ).toBe("env-token");
  });

  it("falls back to gh auth token", () => {
    expect(
      resolveGitHubToken({
        tokenEnv: "GITHUB_TOKEN",
        env: {},
        execFile: (() => " gh-token\n") as never
      })
    ).toBe("gh-token");
  });

  it("throws a focused error when no token is available", () => {
    expect(() =>
      resolveGitHubToken({
        tokenEnv: "GITHUB_TOKEN",
        env: {},
        execFile: (() => {
          throw new Error("missing gh auth");
        }) as never
      })
    ).toThrow("Set GITHUB_TOKEN or run gh auth login");
  });
});
