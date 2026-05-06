export type RepoRef = {
  owner: string;
  name: string;
  fullName: string;
};

export function parseRepoRef(repo: string): RepoRef {
  const [owner, name] = repo.split("/");

  if (!owner || !name || repo.split("/").length !== 2) {
    throw new Error(`Invalid repo "${repo}". Expected owner/name.`);
  }

  return {
    owner,
    name,
    fullName: `${owner}/${name}`
  };
}
