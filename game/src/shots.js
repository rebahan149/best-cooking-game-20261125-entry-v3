// Trattoria Sole — staged scenes for the screenshots (?shot=start|play|end).
// Each scene is a real world state built through the same structures live
// play uses, frozen mid-moment: the renderer draws it exactly as it would a
// game in progress. Nothing here is painted over or composited.

import { GUEST_LOOKS } from './config.js';
import { stationById } from './world.js';

function ticket(id, dish, table, patience, patienceMax, guestIdx, paired, born) {
  return { id, dish, table, patience, patienceMax, guest: GUEST_LOOKS[guestIdx], paired, born };
}

export function stageShot(world, name) {
  const [bruno, rosa] = world.chefs;
  if (name === 'start') {
    world.phase = 'title';
    bruno.x = 400; bruno.y = 440; bruno.facing = 1;
    rosa.x = 560; rosa.y = 440; rosa.facing = -1;
    // a dressed kitchen behind the title card
    stationById(world, 'pan-1').item = { ing: 'salmon', method: 'pan', progress: 34, temp: 183 };
    stationById(world, 'chop-1').item = { ing: 'tomato', method: 'chop', progress: 100, temp: 0 };
    stationById(world, 'plate-1').plate = [
      { ing: 'dough', method: 'oven', perfect: true },
      { ing: 'tomato', method: 'chop', perfect: false },
    ];
    world.narration = 'Bruno & Rosa are ready. The room is set, the forno is lit.';
    return world;
  }

  if (name === 'play') {
    world.phase = 'service';
    world.timeLeft = 74;
    world.coins = 286;
    world.served = 6;
    world.combo = 8;
    world.bestCombo = 8;
    world.spawnAt = 9999;
    world.nextTicket = 5;
    world.tickets = [
      ticket(1, 'margherita', 1, 41, 55, 0, false, -30),
      ticket(2, 'salmon', 2, 29, 52, 2, false, -24),
      ticket(3, 'bistecca', 3, 47, 58, 4, true, -12),
      ticket(4, 'pomodoro', 1, 18, 48, 1, false, -6),
    ];
    // the line, mid-rush: salmon at 67%, a steak in the PERFECT window, dough
    // in the forno, boards working, a Margherita two-thirds plated
    stationById(world, 'pan-1').item = { ing: 'salmon', method: 'pan', progress: 67, temp: 188 };
    stationById(world, 'pan-2').item = { ing: 'steak', method: 'pan', progress: 81, temp: 197 };
    stationById(world, 'oven').item = { ing: 'dough', method: 'oven', progress: 45, temp: 450 };
    stationById(world, 'chop-1').item = { ing: 'tomato', method: 'chop', progress: 63, temp: 0 };
    stationById(world, 'chop-2').item = { ing: 'porcini', method: 'chop', progress: 100, temp: 0 };
    stationById(world, 'plate-1').plate = [
      { ing: 'dough', method: 'oven', perfect: true },
      { ing: 'tomato', method: 'chop', perfect: false },
    ];
    // Bruno runs a finished Bistecca to the pass along the chalk route;
    // Rosa holds the boards
    bruno.x = 636; bruno.y = 452; bruno.facing = 1; bruno.active = true;
    bruno.carry = { kind: 'dish', dish: 'bistecca', perfectCount: 2, paired: false };
    bruno.route = { x: 892, y: 470, stationId: 'pass' };
    rosa.x = 118; rosa.y = 428; rosa.facing = -1; rosa.active = false;
    // two tables already served, one with the sommelier's blessing
    world.tables[0].servedDish = 'pomodoro';
    world.tables[0].servedUntil = 9999;
    world.tables[0].sommelierUntil = 9999;
    world.tables[1].servedDish = 'bruschetta';
    world.tables[1].servedUntil = 9999;
    world.floaters.push({ x: 892, y: 396, text: '+$48 · PERFECT! ×3', color: '#7ac74f', born: -0.5, life: 3 });
    world.narration = 'Bruno follows the chalk route to finish the Bistecca while Rosa works the boards.';
    return world;
  }

  if (name === 'end') {
    world.phase = 'done';
    world.coins = 512;
    world.served = 14;
    world.walkouts = 0;
    world.combo = 0;
    world.bestCombo = 5;
    world.perfects = 9;
    world.timeLeft = 0;
    bruno.x = 430; bruno.y = 440; bruno.facing = 1;
    rosa.x = 540; rosa.y = 440; rosa.facing = -1;
    world.tables[0].servedDish = 'margherita';
    world.tables[0].servedUntil = 9999;
    world.tables[2].servedDish = 'scampi';
    world.tables[2].servedUntil = 9999;
    world.tables[2].sommelierUntil = 9999;
    world.narration = 'What a night. The room applauds the kitchen.';
    return world;
  }

  return world;
}
