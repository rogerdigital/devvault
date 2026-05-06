import path from "node:path";

export type StorePaths = {
  dataDirectory: string;
  prsPath: string;
  contributionsPath: string;
};

export function resolveStorePaths(cwd = process.cwd()): StorePaths {
  const dataDirectory = path.join(cwd, "data");

  return {
    dataDirectory,
    prsPath: path.join(dataDirectory, "prs.json"),
    contributionsPath: path.join(dataDirectory, "contributions.json")
  };
}
