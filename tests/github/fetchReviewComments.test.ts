import { describe, expect, it } from "vitest";

import { fetchReviewComments } from "../../src/github/fetchReviewComments.js";

describe("fetchReviewComments", () => {
  it("marks review comments as truncated when comment or review pages continue", async () => {
    const result = await fetchReviewComments({
      client: {
        query: async () => ({
          repository: {
            pullRequest: {
              comments: {
                pageInfo: {
                  hasNextPage: true
                },
                nodes: [
                  {
                    id: "comment-1",
                    bodyText: "Please adjust this.",
                    url: "https://github.com/openclaw/openclaw/pull/1#issuecomment-1",
                    createdAt: "2026-01-01T00:00:00Z",
                    updatedAt: "2026-01-01T00:00:00Z",
                    authorAssociation: "MEMBER",
                    author: {
                      login: "maintainer"
                    }
                  }
                ]
              },
              reviews: {
                pageInfo: {
                  hasNextPage: false
                },
                nodes: []
              }
            }
          }
        })
      } as never,
      repo: "openclaw/openclaw",
      number: 1
    });

    expect(result.truncated).toBe(true);
    expect(result.comments).toMatchObject([
      {
        body: "Please adjust this.",
        isMaintainer: true
      }
    ]);
  });
});
