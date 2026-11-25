// Trattoria Sole — handover program (Node 22, standard library only).
//
// Our game lives in the game/ folder beside this file: plain static files a
// desktop browser loads offline (game/index.html plus its ES modules — no
// library, no network request). This program hands the entry in. It copies
// game/ and screenshots/ into the output directory and writes dossier.json
// there with the vendored make.fun library, exactly the handover the kit
// prescribes. Around that handover it adds our own housekeeping: a
// GAME_META description of the entry (written to game-meta.json BESIDE the
// dossier, never inside it — dossier.json must stay byte-for-byte what
// buildDossier produces), a pre-flight check of the package against the
// scorer's caps, and a one-line summary of what was handed in.
//
// Serve the game locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// What this entry is, in our own words.
const GAME_META = {
  title: 'Trattoria Sole',
  tagline: 'a two-chef trattoria rush',
  genre: 'cooking / time-management',
  players: '1 player, 2 chefs',
  chefs: ['Bruno', 'Rosa'],
  controls: {
    move: 'WASD or arrow keys',
    interact: 'Space — take from a bin, load a board, pan or the forno, plate, serve',
    swapChef: 'Q or Tab',
    bell: 'F — ring the pass bell, +4s patience for every open ticket',
    path: 'Click a counter and the active chef follows the chalk route there',
    pause: 'P or Esc',
  },
  loop:
    'Read the order board, run the line: chop boards, three toss pans and the ' +
    'brick forno each cook through a PERFECT window (70–100%; past 118% it ' +
    'burns). Plate a dish component by component, carry it to the pass and ' +
    'serve it before the ticket’s patience runs out. PERFECT components and ' +
    'sommelier pairings pay bonuses; three walk-outs end the night.',
  shiftSeconds: 150,
  targetCoins: 420,
  menu: [
    'Bruschetta Sole', 'Margherita', 'Pasta Pomodoro', 'Risotto Porcini',
    'Salmon Erbe', 'Scampi Aglio', 'Pasta Scampi', 'Bistecca',
  ],
  art:
    'Every sprite is drawn in code at load: the chefs (pleated toques, faces, ' +
    'a moustache on Bruno, a bandana knot and earring on Rosa), each ' +
    'ingredient as a still-life, and all eight dishes plated with garnish.',
};

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the dossier bytes; the others refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; more than 993 files in
// game/ or 48 MiB of game files in all, or a path under game/ over 1000
// bytes).
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function treeSize(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      const sub = treeSize(p);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += st.size;
    }
  }
  return { files, bytes };
}

// Our own pre-flight: the same limits the scorer enforces, checked before a
// single byte is copied so a failure message names the real problem.
function preflight(): { gameFiles: number; gameBytes: number; shots: number } {
  const gameDir = join(here, 'game');
  if (!existsSync(join(gameDir, 'index.html'))) {
    throw new Error('preflight: game/index.html is missing — the entry has no door.');
  }
  const tree = treeSize(gameDir);
  if (tree.files > CAPS.game_max_files) {
    throw new Error(`preflight: game/ holds ${tree.files} files, over the ${CAPS.game_max_files} cap.`);
  }
  if (tree.bytes > CAPS.game_max_bytes) {
    throw new Error(`preflight: game/ is ${tree.bytes} bytes, over the ${CAPS.game_max_bytes} cap.`);
  }
  const shotsDir = join(here, 'screenshots');
  const shots = existsSync(shotsDir)
    ? readdirSync(shotsDir).filter((n) => !n.startsWith('.'))
    : [];
  if (shots.length < 3 || shots.length > CAPS.screenshots.max) {
    throw new Error(`preflight: screenshots/ holds ${shots.length} images; the scorer wants 3 or 4.`);
  }
  for (const name of shots) {
    const size = statSync(join(shotsDir, name)).size;
    if (size > CAPS.screenshots.max_bytes) {
      throw new Error(`preflight: screenshots/${name} is ${size} bytes, over the ${CAPS.screenshots.max_bytes} cap.`);
    }
  }
  return { gameFiles: tree.files, gameBytes: tree.bytes, shots: shots.length };
}

const check = preflight();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));
writeFileSync(join(out, 'game-meta.json'), JSON.stringify(GAME_META, null, 2) + '\n');

console.log(
  `Trattoria Sole handed in: ${check.gameFiles} game files (${check.gameBytes} bytes), ` +
  `${check.shots} screenshots, dossier + game-meta written to ${out}.`,
);
