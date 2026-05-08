import type { GitHubReviewComment } from "../types/github.js";
import type { GitHubClient } from "./client.js";
import { parseRepoRef } from "./repo.js";

type FetchReviewCommentsOptions = {
  client: GitHubClient;
  repo: string;
  number: number;
};

export type FetchReviewCommentsResult = {
  comments: GitHubReviewComment[];
  truncated: boolean;
};

type CommentNode = {
  id: string;
  bodyText?: string | null;
  body?: string | null;
  url: string;
  createdAt: string;
  updatedAt: string;
  authorAssociation?: string | null;
  author?: {
    login: string;
  } | null;
};

type ReviewCommentsResponse = {
  repository?: {
    pullRequest?: {
      comments?: {
        nodes?: Array<CommentNode | null> | null;
        pageInfo?: {
          hasNextPage: boolean;
        } | null;
      } | null;
      reviews?: {
        nodes?: Array<CommentNode | null> | null;
        pageInfo?: {
          hasNextPage: boolean;
        } | null;
      } | null;
    } | null;
  } | null;
};

export async function fetchReviewComments(
  options: FetchReviewCommentsOptions
): Promise<FetchReviewCommentsResult> {
  const repo = parseRepoRef(options.repo);
  const response = await options.client.query<ReviewCommentsResponse>(REVIEW_COMMENTS_QUERY, {
    owner: repo.owner,
    name: repo.name,
    number: options.number
  });
  const pullRequest = response.repository?.pullRequest;
  const comments = [
    ...(pullRequest?.comments?.nodes ?? []),
    ...(pullRequest?.reviews?.nodes ?? [])
  ];

  const normalized = comments
    .filter((comment): comment is CommentNode => Boolean(comment))
    .map(normalizeComment)
    .filter((comment) => comment.body.length > 0)
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));

  return {
    comments: normalized,
    truncated: Boolean(
      pullRequest?.comments?.pageInfo?.hasNextPage || pullRequest?.reviews?.pageInfo?.hasNextPage
    )
  };
}

function normalizeComment(comment: CommentNode): GitHubReviewComment {
  return {
    id: comment.id,
    author: comment.author?.login ?? "unknown",
    body: (comment.bodyText ?? comment.body ?? "").trim(),
    url: comment.url,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    isMaintainer: isMaintainerAssociation(comment.authorAssociation)
  };
}

function isMaintainerAssociation(association: string | null | undefined): boolean {
  return association === "OWNER" || association === "MEMBER" || association === "COLLABORATOR";
}

const REVIEW_COMMENTS_QUERY = `
  query DevVaultReviewComments($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        comments(last: 20) {
          pageInfo {
            hasNextPage
          }
          nodes {
            id
            bodyText
            url
            createdAt
            updatedAt
            authorAssociation
            author {
              login
            }
          }
        }
        reviews(last: 20) {
          pageInfo {
            hasNextPage
          }
          nodes {
            id
            body
            url
            createdAt
            updatedAt
            authorAssociation
            author {
              login
            }
          }
        }
      }
    }
  }
`;
