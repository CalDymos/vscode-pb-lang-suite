#!/usr/bin/env node
/**
 * Back-merge helper: merge main into devel.
 *
 * Usage:
 *  - CLI-Optionen:
 *      --pr      → Backmerge over PR
 *      --direct  → Direct merge in devel
 *      --help    → Help anzeigen
 *
 *  - If no option is specified → interactive query
 */

import { execSync } from "node:child_process";
import readline from "node:readline";

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

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve =>
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

// get CLI arguments and determine mode
const args = process.argv.slice(2);
let mode = null;

if (args.includes("--help")) {
  console.log(`
Backmerge Script Options:

  --pr        Backmerge over Pull Request
  --direct    Direct merge in the devel branch
  --help      Show this help message

If no option is specified → interactive query.
`);
  process.exit(0);
}

if (args.includes("--pr")) mode = "pr";
if (args.includes("--direct")) mode = "direct";

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

  // If no mode is specified → interactive query
  if (!mode) {
    const answer = await ask("\nBackmerge over PR ? (y/n): ");
    mode = answer.toLowerCase() === "y" ? "pr" : "direct";
  }

  if (mode === "pr") {
    // Push branch
    run(`git push -u origin ${BACKMERGE}`);

    console.log("\nPR instructions:");
    console.log(`- base:    ${DEVEL}`);
    console.log(`- compare: ${BACKMERGE}`);
    console.log("\nAfter merge, delete the backmerge branch in GitHub UI (optional).");
  }

  if (mode === "direct") {
    // direct merge
    console.log("\nDirect merge will be executed ...");

    // Back to DEVEL
    run(`git checkout ${DEVEL}`);

    // Merge BACKMERGE → DEVEL with message
    try {
      run(`git merge ${BACKMERGE} -m "Backmerge main to devel"`);
    } catch (err) {
      console.error("\nMerge conflicts occurred.");
      console.error("Please resolve conflicts and then:");
      console.error("  git add -A");
      console.error('  git commit -m "Backmerge main to devel"');
      console.error("  git push");
      process.exit(1);
    }

    // Push
    run("git push");

    console.log("\nDirect merge completed successfully.");
  }

  // Return to original branch (best effort)
  if (startBranch && startBranch !== BACKMERGE) {
    run(`git checkout ${startBranch}`);
  }
} catch (err) {
  console.error("\nBack-merge helper failed.");
  process.exit(1);
}
