const fs = require("node:fs");
const path = require("node:path");

const outDir = path.join(process.cwd(), "out-test");
fs.rmSync(outDir, { recursive: true, force: true });
