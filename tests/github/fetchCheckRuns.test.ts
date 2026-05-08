import { describe, expect, it } from "vitest";

import { fetchCheckRuns } from "../../src/github/fetchCheckRuns.js";

describe("fetchCheckRuns", () => {
  it("marks check runs as truncated when context pages continue", async () => {
    const result = await fetchCheckRuns({
      client: {
        query: async () => ({
          repository: {
            pullRequest: {
              commits: {
                nodes: [
                  {
                    commit: {
                      statusCheckRollup: {
                        contexts: {
                          pageInfo: {
                            hasNextPage: true
                          },
                          nodes: [
                            {
                              __typename: "CheckRun",
                              name: "Test",
                              status: "COMPLETED",
                              conclusion: "SUCCESS",
                              detailsUrl: "https://github.com/openclaw/openclaw/actions/runs/1",
                              completedAt: "2026-01-01T00:00:00Z"
                            }
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        })
      } as never,
      repo: "openclaw/openclaw",
      number: 1
    });

    expect(result.truncated).toBe(true);
    expect(result.checkRuns).toMatchObject([
      {
        name: "Test",
        conclusion: "SUCCESS"
      }
    ]);
  });
});
