#!/usr/bin/env node
/**
 * Back-merge helper: merge main into devel via a dedicated backmerge branch.
 *
 * Usage:
 *   node scripts/backmerge-main-into-devel.mjs
 *
 * Notes:
 * - Assumes you are in the repo root.
 * - Creates/updates a local branch: backmerge/main-into-devel
 * - Pushes the branch and prints PR instructions.
 *
 * If merge conflicts occur, resolve them manually, then run:
 *   git add -A
 *   git commit
 *   git push
 */

import { execSync } from "node:child_process";

const MAIN = "main";
const DEVEL = "devel";
const BACKMERGE = "backmerge/main-into-devel";

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function getCurrentBranch() {
  return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
}

function branchExistsLocal(name) {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${name}`);
    return true;
  } catch {
    return false;
  }
}

try {
  const startBranch = getCurrentBranch();

  // Ensure MAIN up-to-date
  run(`git checkout ${MAIN}`);
  run("git pull");

  // Ensure DEVEL up-to-date
  run(`git checkout ${DEVEL}`);
  run("git pull");

  // Create or reset BACKMERGE branch from DEVEL
  if (branchExistsLocal(BACKMERGE)) {
    // Reset branch to current DEVEL to make it repeatable
    run(`git checkout ${BACKMERGE}`);
    run(`git reset --hard ${DEVEL}`);
  } else {
    run(`git checkout -b ${BACKMERGE}`);
  }

  // Merge MAIN into BACKMERGE
  try {
    run(`git merge ${MAIN}`);
  } catch (err) {
    console.error("\nMerge reported conflicts.");
    console.error("Resolve conflicts, then run:");
    console.error("  git add -A");
    console.error("  git commit");
    console.error(`  git push -u origin ${BACKMERGE}`);
    process.exit(1);
  }

  // Push branch
  run(`git push -u origin ${BACKMERGE}`);

  console.log("\nPR instructions:");
  console.log(`- base:    ${DEVEL}`);
  console.log(`- compare: ${BACKMERGE}`);
  console.log("\nAfter merge, delete the backmerge branch in GitHub UI (optional).");

  // Return to original branch (best effort)
  if (startBranch && startBranch !== BACKMERGE) {
    run(`git checkout ${startBranch}`);
  }
} catch (err) {
  console.error("\nBack-merge helper failed.");
  process.exit(1);
}
