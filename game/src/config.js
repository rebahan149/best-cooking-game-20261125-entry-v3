// Trattoria Sole — static configuration: the room, the pantry, the menu.
// Nothing in here moves; world.js owns everything that changes.

// Canvas and room geometry (pixels). The kitchen is the left ~950px, the
// dining room a panel on the right, tickets ride above the kitchen.
export const VIEW = { w: 1280, h: 720 };
export const KITCHEN = { x: 8, y: 148, w: 944, h: 504 };
export const DINING = { x: 964, y: 148, w: 308, h: 504 };
export const TILE = 54;

// Warm trattoria palette: dark wood, brick, cream tile, brass.
export const PALETTE = {
  ink: '#2a1a10',
  woodDark: '#4a2c17',
  wood: '#6e4525',
  woodLight: '#8a5a30',
  counter: '#7c4f2a',
  counterTop: '#a06a38',
  brick: '#9c4a32',
  brickDark: '#7c3826',
  cream: '#f3e5c8',
  paper: '#fbf3dd',
  tileA: '#e8d9b8',
  tileB: '#dfcba2',
  brass: '#c9962e',
  brassLight: '#eec25e',
  red: '#b83a2a',
  green: '#4d7c3a',
  gold: '#e8a91c',
};

// How an ingredient can be prepped. 'serve' means it goes on the plate as-is.
export const METHODS = {
  raw: { verb: 'as-is', station: null },
  chop: { verb: 'chopped', station: 'chop' },
  pan: { verb: 'pan-tossed', station: 'pan' },
  oven: { verb: 'oven-fired', station: 'oven' },
};

// The pantry: ten bins along the top counter. `art` names the still-life the
// renderer draws for the ingredient; `prep` is the method its recipes use.
export const INGREDIENTS = {
  tomato: { name: 'Tomato', art: 'tomato', color: '#d8402a' },
  porcini: { name: 'Porcini', art: 'porcini', color: '#8a6134' },
  salmon: { name: 'Salmon', art: 'salmon', color: '#f08a6b' },
  dough: { name: 'Dough', art: 'dough', color: '#eed9a8' },
  pasta: { name: 'Pasta', art: 'pastaDry', color: '#eec95e' },
  arborio: { name: 'Arborio', art: 'arborio', color: '#f0e6cc' },
  cheese: { name: 'Cheese', art: 'cheese', color: '#f2b63c' },
  prawns: { name: 'Prawns', art: 'prawns', color: '#f09a7a' },
  steak: { name: 'Steak', art: 'steak', color: '#a03c2c' },
  basil: { name: 'Basil', art: 'basil', color: '#4d8c3a' },
};

// The menu: eight dishes. Each component is [ingredient, method]; a plate is
// a finished dish when its components cover the recipe exactly.
export const DISHES = {
  bruschetta: {
    name: 'Bruschetta Sole', price: 16, art: 'bruschetta',
    recipe: [['dough', 'oven'], ['tomato', 'chop'], ['basil', 'raw']],
  },
  margherita: {
    name: 'Margherita', price: 24, art: 'margherita',
    recipe: [['dough', 'oven'], ['tomato', 'chop'], ['cheese', 'raw'], ['basil', 'raw']],
  },
  pomodoro: {
    name: 'Pasta Pomodoro', price: 26, art: 'pomodoro',
    recipe: [['pasta', 'pan'], ['tomato', 'chop'], ['basil', 'raw']],
  },
  risotto: {
    name: 'Risotto Porcini', price: 32, art: 'risotto',
    recipe: [['arborio', 'pan'], ['porcini', 'chop'], ['cheese', 'raw']],
  },
  salmon: {
    name: 'Salmon Erbe', price: 34, art: 'salmonDish',
    recipe: [['salmon', 'pan'], ['porcini', 'pan'], ['basil', 'raw']],
  },
  scampiPasta: {
    name: 'Pasta Scampi', price: 38, art: 'scampiPasta',
    recipe: [['pasta', 'pan'], ['prawns', 'pan'], ['tomato', 'chop']],
  },
  scampi: {
    name: 'Scampi Aglio', price: 36, art: 'scampi',
    recipe: [['prawns', 'pan'], ['dough', 'oven'], ['basil', 'raw']],
  },
  bistecca: {
    name: 'Bistecca', price: 40, art: 'bistecca',
    recipe: [['steak', 'pan'], ['porcini', 'pan'], ['tomato', 'raw']],
  },
};
export const DISH_IDS = Object.keys(DISHES);

// Stations. Bins sit on the top counter; boards down the left wall; the forno
// (brick oven) and the pass on the right; pans and plating on the front
// counter. Chefs interact with the nearest station in reach.
export const STATIONS = [
  ...['tomato', 'porcini', 'salmon', 'dough', 'pasta', 'arborio', 'cheese', 'prawns', 'steak', 'basil']
    .map((ing, i) => ({ id: `bin-${ing}`, kind: 'bin', ing, x: 62 + i * 92, y: 180, label: INGREDIENTS[ing].name })),
  { id: 'chop-1', kind: 'chop', x: 56, y: 292, label: 'Chop' },
  { id: 'chop-2', kind: 'chop', x: 56, y: 428, label: 'Chop' },
  { id: 'compost', kind: 'compost', x: 56, y: 566, label: 'Compost' },
  { id: 'oven', kind: 'oven', x: 892, y: 292, label: 'Forno' },
  { id: 'pass', kind: 'pass', x: 892, y: 470, label: 'Pass · Bell' },
  { id: 'pan-1', kind: 'pan', x: 196, y: 620, label: 'Toss' },
  { id: 'pan-2', kind: 'pan', x: 330, y: 620, label: 'Toss' },
  { id: 'pan-3', kind: 'pan', x: 464, y: 620, label: 'Toss' },
  { id: 'plate-1', kind: 'plate', x: 622, y: 620, label: 'Plating' },
  { id: 'plate-2', kind: 'plate', x: 762, y: 620, label: 'Plating' },
];

// The two chefs: distinct people, distinct colours, one shared job.
export const CHEFS = [
  { name: 'Bruno', skin: '#e8a87c', hair: '#3a2415', band: '#b83a2a', scarf: '#b83a2a', moustache: true, earring: false },
  { name: 'Rosa', skin: '#c97e52', hair: '#1f1409', band: '#2e6e4e', scarf: '#2e6e4e', moustache: false, earring: true },
];

// Guest looks, cycled by the seeded rng so a night is reproducible.
export const GUEST_LOOKS = [
  { skin: '#f0bd8e', hair: '#5a3a1a', hairStyle: 'bun', shirt: '#7a9e43' },
  { skin: '#a8663c', hair: '#14100a', hairStyle: 'crop', shirt: '#b8542e' },
  { skin: '#e8a87c', hair: '#c9c9c9', hairStyle: 'wave', shirt: '#3f6186' },
  { skin: '#8a5630', hair: '#241608', hairStyle: 'bun', shirt: '#c9962e' },
  { skin: '#f5cfa0', hair: '#a8542a', hairStyle: 'wave', shirt: '#7c4a86' },
  { skin: '#c97e52', hair: '#0f0b06', hairStyle: 'crop', shirt: '#4a7c6e' },
];

// Shift rules.
export const RULES = {
  shiftSeconds: 150,
  targetCoins: 420,
  maxTickets: 4,
  tables: 3,
  spawnFirst: 1.2,
  spawnGapStart: 8.5,
  spawnGapEnd: 4.6,
  patienceStart: 58,
  patienceEnd: 40,
  chopSeconds: 2.4,
  cookSeconds: 6.5, // progress 0→130 over this; PERFECT at 70–100, burnt >118
  perfectLo: 70,
  perfectHi: 100,
  burntAt: 118,
  bellBonus: 4,
  bellCooldown: 16,
  perfectBonus: 6,
  pairBonus: 6,
  pairChance: 0.3,
  maxWalkouts: 3,
};
