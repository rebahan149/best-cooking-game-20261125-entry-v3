[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/rebahan149/best-cooking-game-20261125-entry-v3/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/rebahan149/best-cooking-game-20261125-entry-v3/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Bounty: https://make.fun/bounty/best-cooking-game-20261125-0137

# Trattoria Sole — a two-chef trattoria rush

One 150-second night service in a little Italian kitchen, played by two
chefs you swap between: **Bruno** (moustache, red band) and **Rosa**
(bandana, gold earring). Read the order board, work the line — ten pantry
bins, two chop boards, three toss pans and a brick **forno** — plate each
dish component by component, and run it to the pass before the ticket's
patience runs out.

Everything on screen is drawn in code: the chefs are little people with
pleated toques, faces that glance where they walk and a walk cycle; every
ingredient is a small still-life (a salmon fillet with marbling, a steak
with sear marks and rosemary, a twirled nest of pasta); all eight dishes
are plated with garnish. Guests in the Sala Sole dining room smile, wait,
and frown as their patience drains.

## The menu (8 dishes)

Bruschetta Sole · Margherita · Pasta Pomodoro · Risotto Porcini ·
Salmon Erbe · Scampi Aglio · Pasta Scampi · Bistecca — each a 3–4 component
recipe mixing chopped, pan-tossed, oven-fired and as-is ingredients.

## How a shift scores

- Pans and the forno cook through a **★ PERFECT window (70–100%)**; past
  118% the food burns and goes to compost. Each PERFECT component pays +$6.
- Serving pays the price plus a patience tip, times the combo multiplier
  (up to ×3). Some tickets carry a **★ SOMMELIER** pairing worth +$6.
- Ring the bell (F) to give every open ticket +4s patience, on a cooldown.
- Target: **$420**. Three walk-outs end the night early.

## Controls

- **WASD / arrows** — move the active chef
- **Space** — work a counter (take, load, chop, plate, serve)
- **Q / Tab** — swap chefs (the other holds their spot, tagged AI)
- **F** — ring the pass bell
- **Mouse** — click a counter and the chef follows the chalk route there
- **P / Esc** — pause

## Layout

- `game/` — the game itself: static files, no build step, no network.
  `src/config.js` (room, pantry, menu), `src/world.js` (rules and state),
  `src/art.js` (every sprite, drawn in code), `src/render.js` (the room,
  board and dining room), `src/shots.js` (the screenshot stagings),
  `src/main.js` (input and the service loop).
- `main.ts` — hands the entry in: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with the vendored library,
  plus our own `game-meta.json` beside it.
- `screenshots/` — three real renders of the game (`?shot=start|play|end`).
