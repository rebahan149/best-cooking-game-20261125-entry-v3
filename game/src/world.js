// Trattoria Sole — the world: state and rules of one night's service.
// No DOM in here: main.js feeds it input, render.js draws what it holds, and
// the node test drives whole services through it.
//
// A chef carries one thing at a time: a raw ingredient, a prepped component
// ({ing, method, perfect}) or a finished dish ({dish}). Stations hold work in
// progress: boards chop, pans and the forno cook through a PERFECT window,
// plating counters collect components until a plate matches a recipe.

import { CHEFS, DISHES, DISH_IDS, GUEST_LOOKS, INGREDIENTS, RULES, STATIONS } from './config.js';
import { makeRng, pick } from './random.js';

const REACH = 86; // px from a station's centre a chef can work it
const CHEF_SPEED = 218; // px per second

export function componentKey(ing, method) {
  return `${ing}:${method}`;
}

// The dish whose recipe a plate's components cover exactly, or null.
export function matchDish(components) {
  for (const id of DISH_IDS) {
    const recipe = DISHES[id].recipe;
    if (recipe.length !== components.length) continue;
    const want = recipe.map(([i, m]) => componentKey(i, m)).sort();
    const have = components.map((c) => componentKey(c.ing, c.method)).sort();
    if (want.every((k, i) => k === have[i])) return id;
  }
  return null;
}

// Which prep method a recipe asks of an ingredient (for hinting), or null.
export function methodFor(dishId, ing) {
  const hit = DISHES[dishId].recipe.find(([i]) => i === ing);
  return hit ? hit[1] : null;
}

export function createWorld(seed = 1) {
  const rng = makeRng(seed);
  const stations = STATIONS.map((s) => ({
    ...s,
    item: null, // {ing, method, progress, temp} while a board/pan/oven works
    plate: [], // plating counters: components collected so far
  }));
  const world = {
    rng,
    t: 0,
    phase: 'title', // title | service | done
    timeLeft: RULES.shiftSeconds,
    coins: 0,
    served: 0,
    walkouts: 0,
    combo: 0,
    bestCombo: 0,
    perfects: 0,
    bellReadyAt: 0,
    spawnAt: RULES.spawnFirst,
    narration: 'Service is about to begin.',
    floaters: [], // {x, y, text, color, born, life}
    shake: 0,
    chefs: CHEFS.map((c, i) => ({
      ...c,
      x: 320 + i * 220,
      y: 430,
      vx: 0,
      vy: 0,
      facing: i === 0 ? 1 : -1, // -1 left, 1 right
      vertical: 'front', // front | back (for the sprite)
      moving: false,
      walkPhase: 0,
      carry: null, // {kind:'raw',ing} | {kind:'comp',ing,method,perfect} | {kind:'dish',dish,perfectCount,paired}
      route: null, // {x, y, stationId} click-to-path target
      active: i === 0,
    })),
    stations,
    tickets: [], // {id, dish, table, patience, patienceMax, guest, paired, born}
    tables: Array.from({ length: RULES.tables }, (_, i) => ({
      n: i + 1, servedDish: null, servedUntil: 0, sommelierUntil: 0,
    })),
    nextTicket: 1,
    events: [], // drained by main.js for the status line / tests
  };
  return world;
}

function emit(world, type, data = {}) {
  world.events.push({ type, ...data });
}

export function stationById(world, id) {
  return world.stations.find((s) => s.id === id);
}

function nearestStation(world, chef, kinds = null) {
  let best = null;
  let bestD = REACH;
  for (const s of world.stations) {
    if (kinds && !kinds.includes(s.kind)) continue;
    const d = Math.hypot(s.x - chef.x, s.y - chef.y);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

// ---- tickets -------------------------------------------------------------

function spawnTicket(world) {
  if (world.tickets.length >= RULES.maxTickets) return;
  const elapsed = 1 - world.timeLeft / RULES.shiftSeconds;
  const dish = pick(world.rng, DISH_IDS);
  const patienceMax = RULES.patienceStart + (RULES.patienceEnd - RULES.patienceStart) * elapsed;
  const table = 1 + Math.floor(world.rng() * RULES.tables);
  const ticket = {
    id: world.nextTicket++,
    dish,
    table,
    patience: patienceMax,
    patienceMax,
    guest: GUEST_LOOKS[Math.floor(world.rng() * GUEST_LOOKS.length)],
    paired: world.rng() < RULES.pairChance,
    born: world.t,
  };
  world.tickets.push(ticket);
  emit(world, 'ticket', { ticket });
  world.narration = `Table ${table} orders ${DISHES[dish].name}.`;
}

// ---- carrying ------------------------------------------------------------

function describeCarry(carry) {
  if (!carry) return 'nothing';
  if (carry.kind === 'raw') return INGREDIENTS[carry.ing].name;
  if (carry.kind === 'comp') return `${INGREDIENTS[carry.ing].name} (${carry.method})`;
  return DISHES[carry.dish].name;
}

// ---- interaction ---------------------------------------------------------

export function interact(world, chef) {
  if (world.phase !== 'service') return;
  const s = nearestStation(world, chef);
  if (!s) { world.narration = `${chef.name} is not near a counter.`; return; }

  if (s.kind === 'bin') {
    if (chef.carry) { world.narration = `${chef.name}'s hands are full of ${describeCarry(chef.carry)}.`; return; }
    chef.carry = { kind: 'raw', ing: s.ing };
    world.narration = `${chef.name} takes ${INGREDIENTS[s.ing].name}.`;
    emit(world, 'pickup', { chef, ing: s.ing });
    return;
  }

  if (s.kind === 'compost') {
    if (!chef.carry) { world.narration = 'Nothing to compost.'; return; }
    emit(world, 'compost', { chef, what: describeCarry(chef.carry) });
    world.narration = `${chef.name} composts the ${describeCarry(chef.carry)}.`;
    chef.carry = null;
    return;
  }

  if (s.kind === 'chop' || s.kind === 'pan' || s.kind === 'oven') {
    interactCookStation(world, chef, s);
    return;
  }

  if (s.kind === 'plate') {
    interactPlate(world, chef, s);
    return;
  }

  if (s.kind === 'pass') {
    serveAtPass(world, chef);
  }
}

function interactCookStation(world, chef, s) {
  const method = s.kind; // 'chop' | 'pan' | 'oven' — matches the method names
  if (s.item) {
    const done = s.kind === 'chop'
      ? s.item.progress >= 100
      : s.item.progress >= RULES.perfectLo;
    if (!done) {
      world.narration = s.kind === 'chop'
        ? `The ${INGREDIENTS[s.item.ing].name} is still being chopped.`
        : `The ${INGREDIENTS[s.item.ing].name} is not ready yet.`;
      return;
    }
    if (chef.carry) { world.narration = `${chef.name}'s hands are full.`; return; }
    const burnt = s.kind !== 'chop' && s.item.progress > RULES.burntAt;
    const perfect = s.kind !== 'chop' && s.item.progress <= RULES.perfectHi;
    const item = s.item;
    s.item = null;
    if (burnt) {
      chef.carry = { kind: 'comp', ing: item.ing, method, perfect: false, burnt: true };
      world.narration = `The ${INGREDIENTS[item.ing].name} is burnt — compost it.`;
      emit(world, 'burnt', { chef, ing: item.ing });
    } else {
      chef.carry = { kind: 'comp', ing: item.ing, method, perfect };
      world.narration = perfect
        ? `${chef.name} lifts the ${INGREDIENTS[item.ing].name} — PERFECT!`
        : `${chef.name} takes the ${INGREDIENTS[item.ing].name}.`;
      emit(world, 'take', { chef, ing: item.ing, perfect });
    }
    return;
  }
  // Empty station: load it with a raw ingredient that wants this method.
  if (!chef.carry || chef.carry.kind !== 'raw') {
    world.narration = `${chef.name} needs a raw ingredient for the ${s.label}.`;
    return;
  }
  const ing = chef.carry.ing;
  const wanted = DISHES && neededMethod(world, ing);
  if (wanted !== method && !anyRecipeWants(ing, method)) {
    world.narration = `${INGREDIENTS[ing].name} does not go on the ${s.label}.`;
    return;
  }
  s.item = { ing, method, progress: 0, temp: s.kind === 'oven' ? 448 : 176 + Math.floor(world.rng() * 34) };
  chef.carry = null;
  world.narration = `${chef.name} sets the ${INGREDIENTS[ing].name} on the ${s.label}.`;
  emit(world, 'load', { chef, ing, station: s.id });
}

// Does any dish on the menu use this ingredient with this method?
function anyRecipeWants(ing, method) {
  return DISH_IDS.some((id) => DISHES[id].recipe.some(([i, m]) => i === ing && m === method));
}

// The method an open ticket most wants for this ingredient (hint only).
function neededMethod(world, ing) {
  for (const t of world.tickets) {
    const m = methodFor(t.dish, ing);
    if (m) return m;
  }
  return null;
}

function interactPlate(world, chef, s) {
  if (chef.carry && chef.carry.kind === 'comp') {
    if (chef.carry.burnt) { world.narration = 'That is burnt — compost it, do not plate it.'; return; }
    s.plate.push({ ing: chef.carry.ing, method: chef.carry.method, perfect: chef.carry.perfect });
    world.narration = `${chef.name} plates the ${INGREDIENTS[chef.carry.ing].name}.`;
    emit(world, 'plate', { chef, station: s.id, count: s.plate.length });
    chef.carry = null;
    return;
  }
  if (chef.carry && chef.carry.kind === 'raw') {
    // A raw-method component: basil and cheese go on as they are when a
    // recipe asks for them 'raw'.
    s.plate.push({ ing: chef.carry.ing, method: 'raw', perfect: false });
    world.narration = `${chef.name} plates the ${INGREDIENTS[chef.carry.ing].name}.`;
    emit(world, 'plate', { chef, station: s.id, count: s.plate.length });
    chef.carry = null;
    return;
  }
  if (!chef.carry) {
    const dish = matchDish(s.plate);
    if (dish) {
      const perfectCount = s.plate.filter((c) => c.perfect).length;
      chef.carry = { kind: 'dish', dish, perfectCount, paired: false };
      s.plate = [];
      world.narration = `${chef.name} lifts the ${DISHES[dish].name} — to the pass!`;
      emit(world, 'dishUp', { chef, dish });
    } else if (s.plate.length) {
      world.narration = 'That plate matches no dish yet — it needs the right components.';
    } else {
      world.narration = 'An empty plate. Bring components here.';
    }
  }
}

function serveAtPass(world, chef) {
  if (!chef.carry || chef.carry.kind !== 'dish') {
    ringBell(world);
    return;
  }
  const dish = chef.carry.dish;
  // Earliest-born matching ticket wins.
  const ticket = world.tickets.filter((t) => t.dish === dish).sort((a, b) => a.born - b.born)[0];
  if (!ticket) {
    world.shake = 0.35;
    world.narration = `No open ticket wants ${DISHES[dish].name}.`;
    emit(world, 'noTicket', { chef, dish });
    return;
  }
  const price = DISHES[dish].price;
  const tip = Math.round(price * 0.5 * (ticket.patience / ticket.patienceMax));
  const mult = 1 + Math.min(world.combo, 8) * 0.25;
  let pay = Math.round((price + tip) * mult);
  let bonusText = '';
  if (chef.carry.perfectCount > 0) {
    const b = RULES.perfectBonus * chef.carry.perfectCount;
    pay += b; bonusText += ` +$${b} PERFECT`;
    world.perfects += chef.carry.perfectCount;
  }
  if (ticket.paired) {
    pay += RULES.pairBonus; bonusText += ` +$${RULES.pairBonus} SOMMELIER`;
  }
  world.coins += pay;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const table = world.tables[ticket.table - 1];
  table.servedDish = dish;
  table.servedUntil = world.t + 6;
  if (ticket.paired) table.sommelierUntil = world.t + 6;
  world.tickets = world.tickets.filter((t) => t !== ticket);
  addFloater(world, 892, 400, `+$${pay}${bonusText}${world.combo > 1 ? ` ×${mult.toFixed(2).replace(/\.?0+$/, '')}` : ''}`, '#7ac74f');
  world.narration = `${chef.name} serves ${DISHES[dish].name} to table ${ticket.table} — $${pay}.`;
  emit(world, 'served', { chef, dish, pay, table: ticket.table });
  chef.carry = null;
}

export function ringBell(world) {
  if (world.t < world.bellReadyAt) {
    world.narration = 'The bell is still warm — give it a moment.';
    return;
  }
  world.bellReadyAt = world.t + RULES.bellCooldown;
  for (const t of world.tickets) t.patience = Math.min(t.patienceMax, t.patience + RULES.bellBonus);
  world.narration = 'Ding! Every table breathes a little easier.';
  emit(world, 'bell', {});
}

// ---- movement ------------------------------------------------------------

export function setRoute(world, chef, station) {
  chef.route = { x: station.x, y: station.y + (station.kind === 'bin' ? 52 : station.kind === 'plate' || station.kind === 'pan' ? -46 : 0), stationId: station.id };
}

export function clearRoute(chef) {
  chef.route = null;
}

// Move a chef by a velocity intent for dt seconds, with simple station
// collision: chefs slide along counters rather than through them.
const BLOCKERS = STATIONS.map((s) => {
  if (s.kind === 'bin') return { x: s.x - 44, y: s.y - 30, w: 88, h: 56 };
  if (s.kind === 'plate' || s.kind === 'pan') return { x: s.x - 46, y: s.y - 26, w: 92, h: 52 };
  if (s.kind === 'oven' || s.kind === 'pass') return { x: s.x - 46, y: s.y - 52, w: 92, h: 104 };
  return { x: s.x - 40, y: s.y - 46, w: 80, h: 92 };
});

function collide(x, y) {
  for (const b of BLOCKERS) {
    if (x > b.x - 12 && x < b.x + b.w + 12 && y > b.y - 8 && y < b.y + b.h + 8) return true;
  }
  return false;
}

export function moveChef(world, chef, dx, dy, dt) {
  const len = Math.hypot(dx, dy);
  if (len < 0.01) { chef.moving = false; return; }
  dx /= len; dy /= len;
  const step = CHEF_SPEED * dt;
  const nx = chef.x + dx * step;
  const ny = chef.y + dy * step;
  if (!collide(nx, chef.y)) chef.x = nx;
  if (!collide(chef.x, ny)) chef.y = ny;
  chef.x = Math.max(30, Math.min(930, chef.x));
  chef.y = Math.max(215, Math.min(640, chef.y));
  chef.facing = dx < -0.2 ? -1 : dx > 0.2 ? 1 : chef.facing;
  chef.vertical = dy < -0.2 ? 'back' : dy > 0.2 ? 'front' : chef.vertical;
  chef.moving = true;
  chef.walkPhase += dt * 11;
}

// ---- the tick --------------------------------------------------------------

function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, born: world.t, life: 1.6 });
}

export function startService(world) {
  world.phase = 'service';
  world.narration = 'Service! First tickets are coming in.';
}

export function update(world, dt) {
  world.t += dt;
  world.floaters = world.floaters.filter((f) => world.t - f.born < f.life);
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt);
  if (world.phase !== 'service') return;

  world.timeLeft = Math.max(0, world.timeLeft - dt);

  // Spawning, with the gap closing as the night heats up.
  const elapsed = 1 - world.timeLeft / RULES.shiftSeconds;
  if (world.t >= world.spawnAt) {
    spawnTicket(world);
    const gap = RULES.spawnGapStart + (RULES.spawnGapEnd - RULES.spawnGapStart) * elapsed;
    world.spawnAt = world.t + gap;
  }

  // Stations work on their own once loaded.
  for (const s of world.stations) {
    if (!s.item) continue;
    if (s.kind === 'chop') {
      s.item.progress = Math.min(100, s.item.progress + (100 / RULES.chopSeconds) * dt);
    } else {
      s.item.progress = Math.min(130, s.item.progress + (130 / RULES.cookSeconds) * dt);
      s.item.temp = s.kind === 'oven'
        ? 445 + Math.round(8 * Math.sin(world.t * 7 + s.x))
        : 178 + Math.round(26 * (s.item.progress / 130)) + Math.round(3 * Math.sin(world.t * 9 + s.x));
    }
  }

  // Patience drains; a table that empties walks out.
  for (const ticket of [...world.tickets]) {
    ticket.patience -= dt;
    if (ticket.patience <= 0) {
      world.tickets = world.tickets.filter((t) => t !== ticket);
      world.walkouts += 1;
      world.combo = 0;
      addFloater(world, 892, 400, 'Walked out!', '#e05545');
      world.narration = `Table ${ticket.table} walked out. That one hurts.`;
      emit(world, 'walkout', { ticket });
    }
  }

  // Click-to-path routes walk themselves out, then interact on arrival.
  for (const chef of world.chefs) {
    if (!chef.route) continue;
    const dx = chef.route.x - chef.x;
    const dy = chef.route.y - chef.y;
    if (Math.hypot(dx, dy) < 10) {
      const station = stationById(world, chef.route.stationId);
      chef.route = null;
      if (station) {
        chef.facing = station.x < chef.x ? -1 : 1;
        if (chef.active) interact(world, chef);
      }
    } else {
      moveChef(world, chef, dx, dy, dt);
    }
  }

  if (world.timeLeft <= 0 || world.walkouts >= RULES.maxWalkouts) {
    world.phase = 'done';
    world.narration = world.walkouts >= RULES.maxWalkouts
      ? 'Three walk-outs — the night is over.'
      : 'Last orders! The shift is done.';
    emit(world, 'done', {});
  }
}

export function result(world) {
  return {
    coins: world.coins,
    target: RULES.targetCoins,
    smashed: world.coins >= RULES.targetCoins,
    served: world.served,
    walkouts: world.walkouts,
    bestCombo: world.bestCombo,
    perfects: world.perfects,
    stars: Math.max(0, 3 - world.walkouts),
  };
}

export { describeCarry, nearestStation };
