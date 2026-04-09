#!/usr/bin/env node
/**
 * strip-preview-assets-meta.mjs
 *
 * Strips XMP and other metadata-only PNG chunks from all base64 data URIs
 * embedded in preview-assets.ts, then writes the result back in-place.
 *
 * Removed chunk types:
 *   iTXt – International text (XMP is stored here by Adobe Photoshop)
 *   tEXt – Plain-text metadata (e.g. "Software: Adobe Photoshop")
 *   zTXt – Compressed text metadata
 *   eXIf – EXIF metadata
 *
 * Preserved chunk types (non-exhaustive):
 *   IHDR, IDAT, IEND – mandatory image structure
 *   PLTE, tRNS       – palette and transparency
 *   sRGB, gAMA, cHRM – color rendering
 *   bKGD, pHYs       – background and pixel density
 *
 * Usage:
 *   node strip-preview-assets-meta.mjs [--dry-run] [path/to/preview-assets.ts]
 *
 * Flags:
 *   --dry-run   Print savings per image without writing changes.
 *
 * The file path defaults to:
 *   packages/pb-forms-editor/src/webview/preview-assets.ts
 * relative to the current working directory (i.e. the monorepo root).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Configuration ──────────────────────────────────────────────────────────

const DEFAULT_TARGET = resolve(
  "packages/pb-forms-editor/src/core/preview/assets.ts"
);

/** Chunk types whose sole purpose is metadata — safe to remove. */
const STRIP_CHUNK_TYPES = new Set(["iTXt", "tEXt", "zTXt", "eXIf"]);

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// ── CLI args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const pathArg = args.find((a) => !a.startsWith("--"));
const targetPath = pathArg ? resolve(pathArg) : DEFAULT_TARGET;

// ── PNG chunk stripping ────────────────────────────────────────────────────

/**
 * Parses a PNG buffer and returns a new buffer with metadata chunks removed.
 * Retained chunk bytes (including their original CRC) are copied verbatim —
 * no CRC recalculation is needed because the chunk data is not modified.
 *
 * @param {Buffer} png  Original PNG as a Buffer.
 * @returns {{ stripped: Buffer, removedChunks: string[] }}
 */
function stripPngMetadata(png) {
  if (!png.slice(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("Buffer is not a valid PNG (signature mismatch).");
  }

  const kept = [PNG_SIGNATURE];
  const removedChunks = [];
  let offset = 8;

  while (offset < png.length) {
    if (offset + 8 > png.length) {
      throw new Error(`Truncated PNG: unexpected end at offset ${offset}.`);
    }

    const dataLen = png.readUInt32BE(offset);   // bytes in the chunk's data field
    const chunkEnd = offset + 12 + dataLen;     // past CRC

    if (chunkEnd > png.length) {
      throw new Error(
        `Truncated PNG: chunk at offset ${offset} extends past buffer end.`
      );
    }

    const type = png.slice(offset + 4, offset + 8).toString("ascii");

    if (STRIP_CHUNK_TYPES.has(type)) {
      removedChunks.push(type);
    } else {
      // Copy the complete chunk (length + type + data + CRC) unchanged.
      kept.push(png.slice(offset, chunkEnd));
    }

    offset = chunkEnd;
  }

  return { stripped: Buffer.concat(kept), removedChunks };
}

// ── Data URI processing ────────────────────────────────────────────────────

/**
 * Finds every PNG base64 data URI in the source string and applies
 * stripPngMetadata to its decoded bytes.
 *
 * Returns the rewritten source and per-image statistics.
 *
 * @param {string} source
 * @returns {{ result: string, stats: Array<{ name: string, before: number, after: number, removedChunks: string[] }> }}
 */
function processSource(source) {
  // Capture: export const <NAME> = "data:image/png;base64,<DATA>";
  // The base64 payload ends at the closing double-quote.
  const DATA_URI_RE =
    /(\bexport\s+const\s+(\w+)\s*=\s*")(data:image\/png;base64,)([A-Za-z0-9+/=]+)(")/g;

  const stats = [];
  let result = source;

  // Collect all matches first to avoid offset confusion during replacement.
  const matches = [...source.matchAll(DATA_URI_RE)];

  for (const match of matches) {
    const [, prefix, constName, mimePrefix, b64, suffix] = match;
    const originalBytes = Buffer.from(b64, "base64");

    let stripped, removedChunks;
    try {
      ({ stripped, removedChunks } = stripPngMetadata(originalBytes));
    } catch (err) {
      console.warn(`  ⚠  ${constName}: ${err.message} — skipped.`);
      continue;
    }

    const newB64 = stripped.toString("base64");

    stats.push({
      name: constName,
      before: originalBytes.length,
      after: stripped.length,
      removedChunks,
    });

    // Replace exactly this occurrence (matchAll gives us the index).
    result = result.replace(
      prefix + mimePrefix + b64 + suffix,
      prefix + mimePrefix + newB64 + suffix
    );
  }

  return { result, stats };
}

// ── Reporting ──────────────────────────────────────────────────────────────

function formatBytes(n) {
  return `${n.toLocaleString("en")} B`;
}

function printReport(stats, originalLen, resultLen) {
  const COL = 46;
  console.log();
  console.log(`  ${"Constant".padEnd(COL)} Before    After     Saved`);
  console.log(`  ${"─".repeat(COL)} ─────────────────────────────`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const { name, before, after, removedChunks } of stats) {
    const saved = before - after;
    const pct = ((saved / before) * 100).toFixed(1);
    const chunks = removedChunks.join(", ") || "none";
    console.log(
      `  ${name.padEnd(COL)} ${formatBytes(before).padStart(8)}  ${formatBytes(after).padStart(8)}  ${formatBytes(saved).padStart(7)} (${pct}%)  [${chunks}]`
    );
    totalBefore += before;
    totalAfter += after;
  }

  const totalSaved = totalBefore - totalAfter;
  const totalPct = ((totalSaved / totalBefore) * 100).toFixed(1);
  console.log(`  ${"─".repeat(COL)} ─────────────────────────────`);
  console.log(
    `  ${"TOTAL (decoded PNG bytes)".padEnd(COL)} ${formatBytes(totalBefore).padStart(8)}  ${formatBytes(totalAfter).padStart(8)}  ${formatBytes(totalSaved).padStart(7)} (${totalPct}%)`
  );

  // Base64 encoding adds ~33% overhead on top of raw bytes.
  const fileSaved = originalLen - resultLen;
  const filePct = ((fileSaved / originalLen) * 100).toFixed(1);
  console.log();
  console.log(
    `  Source file size: ${formatBytes(originalLen)} → ${formatBytes(resultLen)} (saved ${formatBytes(fileSaved)}, ${filePct}%)`
  );
  console.log();
}

// ── Main ───────────────────────────────────────────────────────────────────

console.log();
console.log(
  `strip-preview-assets-meta${dryRun ? " [DRY RUN]" : ""}`
);
console.log(`  Target: ${targetPath}`);

let source;
try {
  source = readFileSync(targetPath, "utf8");
} catch (err) {
  console.error(`\nError: cannot read file: ${err.message}`);
  process.exit(1);
}

const { result, stats } = processSource(source);

if (stats.length === 0) {
  console.log("\n  No PNG data URIs found — nothing to do.");
  process.exit(0);
}

printReport(stats, Buffer.byteLength(source, "utf8"), Buffer.byteLength(result, "utf8"));

if (dryRun) {
  console.log("  Dry run — file not modified.");
} else {
  writeFileSync(targetPath, result, "utf8");
  console.log(`  ✓ Written: ${targetPath}`);
}
console.log();
