// Prepends a Node shebang to the built bundle and marks it executable.
import { chmodSync, readFileSync, writeFileSync } from "node:fs";

const out = new URL("../dist/cupo.js", import.meta.url);
const src = readFileSync(out, "utf8").replace(/^#!.*\n/, "");
writeFileSync(out, `#!/usr/bin/env node\n${src}`);
chmodSync(out, 0o755);
