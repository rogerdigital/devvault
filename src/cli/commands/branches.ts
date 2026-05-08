import path from "node:path";

import { planBranches } from "../../core/branchPlanner.js";
import type { BranchVerification } from "../../core/branchPlanner.js";
import { runCommand } from "../../core/runCommand.js";
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
  const verifications = verifyBranchesMergedIntoBase(repoPath, currentBranch, localBranches);
  const plans = planBranches(localBranches, prs, verifications);

  printPlans(plans);

  if (!options.prune) {
    return;
  }

  ensureCleanWorktree(repoPath);

  const branchesToDelete = plans
    .filter((plan) => plan.action === "safe_to_delete")
    .map((plan) => plan.branch);

  for (const branch of branchesToDelete) {
    runCommand("git", ["branch", "-d", branch], {
      cwd: repoPath,
      failureMessage: `Failed to delete local branch ${branch}.`,
      nextStep: "Inspect the branch manually before deleting it."
    });
  }

  console.log(`Deleted ${branchesToDelete.length} merged PR branches.`);
}

function readLocalBranches(repoPath: string): string[] {
  return runCommand("git", ["branch", "--format=%(refname:short)"], {
    cwd: repoPath,
    failureMessage: "Failed to list local branches.",
    nextStep: `Check that ${repoPath} is a Git repository.`
  })
    .split("\n")
    .map((branch) => branch.trim())
    .filter(Boolean);
}

function readCurrentBranch(repoPath: string): string {
  return runCommand("git", ["branch", "--show-current"], {
    cwd: repoPath,
    failureMessage: "Failed to read the current branch.",
    nextStep: `Check that ${repoPath} is a Git repository with an active branch.`
  }).trim();
}

function ensureCleanWorktree(repoPath: string): void {
  const status = runCommand("git", ["status", "--short"], {
    cwd: repoPath,
    failureMessage: "Failed to inspect the target repository status.",
    nextStep: `Run git status in ${repoPath}.`
  }).trim();

  if (status) {
    throw new Error("Refusing to prune branches because the target repository has uncommitted changes.");
  }
}

function verifyBranchesMergedIntoBase(
  repoPath: string,
  baseBranch: string,
  branches: string[]
): BranchVerification[] {
  return branches.map((branch) => ({
    branch,
    mergedIntoBase: isBranchMergedIntoBase(repoPath, baseBranch, branch)
  }));
}

function isBranchMergedIntoBase(repoPath: string, baseBranch: string, branch: string): boolean {
  try {
    const cherry = runCommand("git", ["cherry", "-v", baseBranch, branch], {
      cwd: repoPath,
      failureMessage: `Failed to compare ${branch} with ${baseBranch}.`,
      nextStep: "Run git cherry manually to verify whether this branch can be deleted."
    });

    return cherry
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .every((line) => line.startsWith("-"));
  } catch {
    return false;
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
