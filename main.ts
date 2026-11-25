// main.ts — hands the Ember & Noodle cooking game in.
//
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with the kit's buildDossier,
// using the gate's own caps so the dossier the grader rebuilds matches
// byte for byte. Only the contents of the output directory are cleared,
// never the directory itself: on the grader it is a mount point.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function clearDirectoryContents(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

clearDirectoryContents(outputDir);

for (const name of ["game", "screenshots"]) {
  const source = join(repoRoot, name);
  if (!existsSync(source)) {
    throw new Error(`main.ts: missing ${name}/ in the repository`);
  }
  cpSync(source, join(outputDir, name), { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, "dossier.json"), dossier);

console.log(`Ember & Noodle: wrote game/, screenshots/ and dossier.json to ${outputDir}`);
