export type GitHubGraphQLError = {
  message: string;
  type?: string;
  path?: Array<string | number>;
};

export type GitHubGraphQLResponse<T> = {
  data?: T;
  errors?: GitHubGraphQLError[];
};

export type GitHubClientOptions = {
  token: string;
  endpoint?: string;
  fetchImpl?: typeof fetch;
};

export class GitHubRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly errors: GitHubGraphQLError[] = []
  ) {
    super(message);
    this.name = "GitHubRequestError";
  }
}

export class GitHubClient {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;
  private readonly token: string;

  constructor(options: GitHubClientOptions) {
    if (!options.token.trim()) {
      throw new GitHubRequestError("GitHub token is required.");
    }

    this.token = options.token;
    this.endpoint = options.endpoint ?? "https://api.github.com/graphql";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
        "user-agent": "devvault"
      },
      body: JSON.stringify({ query, variables })
    });

    const payload = (await response.json()) as GitHubGraphQLResponse<T>;

    if (!response.ok) {
      throw new GitHubRequestError(
        `GitHub GraphQL request failed with status ${response.status}.`,
        response.status,
        payload.errors ?? []
      );
    }

    if (payload.errors?.length) {
      throw new GitHubRequestError(
        payload.errors.map((error) => error.message).join("; "),
        response.status,
        payload.errors
      );
    }

    if (!payload.data) {
      throw new GitHubRequestError("GitHub GraphQL response did not include data.", response.status);
    }

    return payload.data;
  }
}
