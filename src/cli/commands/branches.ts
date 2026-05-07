import { execFileSync } from "node:child_process";
import path from "node:path";

import { planBranches } from "../../core/branchPlanner.js";
import { createStore } from "../../storage/store.js";

export type BranchesCommandOptions = {
  repoPath?: string;
  prune?: boolean;
};

export async function runBranchesCommand(options: BranchesCommandOptions): Promise<void> {
  const repoPath = path.resolve(process.cwd(), options.repoPath ?? ".");
  const prs = await createStore().readPullRequests();
  const currentBranch = readCurrentBranch(repoPath);
  const localBranches = readLocalBranches(repoPath).filter((branch) => branch !== currentBranch);
  const plans = planBranches(localBranches, prs);

  printPlans(plans);

  if (!options.prune) {
    return;
  }

  ensureCleanWorktree(repoPath);

  const branchesToDelete = plans
    .filter((plan) => plan.action === "safe_to_delete")
    .map((plan) => plan.branch);

  for (const branch of branchesToDelete) {
    execFileSync("git", ["branch", "-d", branch], {
      cwd: repoPath,
      stdio: "ignore"
    });
  }

  console.log(`Deleted ${branchesToDelete.length} merged PR branches.`);
}

function readLocalBranches(repoPath: string): string[] {
  return execFileSync("git", ["branch", "--format=%(refname:short)"], {
    cwd: repoPath,
    encoding: "utf8"
  })
    .split("\n")
    .map((branch) => branch.trim())
    .filter(Boolean);
}

function readCurrentBranch(repoPath: string): string {
  return execFileSync("git", ["branch", "--show-current"], {
    cwd: repoPath,
    encoding: "utf8"
  }).trim();
}

function ensureCleanWorktree(repoPath: string): void {
  const status = execFileSync("git", ["status", "--short"], {
    cwd: repoPath,
    encoding: "utf8"
  }).trim();

  if (status) {
    throw new Error("Refusing to prune branches because the target repository has uncommitted changes.");
  }
}

function printPlans(plans: ReturnType<typeof planBranches>): void {
  const groups = [
    ["safe_to_delete", "Safe to delete"],
    ["keep", "Keep"],
    ["needs_review", "Needs review"]
  ] as const;

  for (const [action, title] of groups) {
    const items = plans.filter((plan) => plan.action === action);
    console.log(`${title}:`);
    if (items.length === 0) {
      console.log("- None");
    } else {
      for (const item of items) {
        console.log(`- ${item.branch}: ${item.reason}`);
      }
    }
    console.log("");
  }
}
