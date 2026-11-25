// Trattoria Sole — the renderer: composes the whole room from world state.
// Kitchen floor and counters, the ten pantry bins, boards, pans, the brick
// forno, plating and the pass; the order board above; the dining room at the
// right with its three tables; HUD, floaters, narration, title and results.

import { DINING, DISHES, INGREDIENTS, KITCHEN, PALETTE, RULES, VIEW } from './config.js';
import { matchDish } from './world.js';
import {
  circ, drawChef, drawComponent, drawDish, drawGuest, drawIngredient,
  drawPlate, drawSteam, ell, fillStroke, gloss, rr, shadow,
} from './art.js';

const INK = PALETTE.ink;

function text(ctx, str, x, y, { size = 13, weight = 600, color = INK, align = 'left', font = 'system-ui, sans-serif' } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function pill(ctx, x, y, w, h, fill) {
  rr(ctx, x, y, w, h, h / 2);
  fillStroke(ctx, fill, 1.8);
}

// Is a recipe component already secured (plated, carried prepped, or finished
// on a station)? Ticket chips tick from this.
function componentReady(world, ing, method) {
  for (const s of world.stations) {
    if (s.kind === 'plate' && s.plate.some((c) => c.ing === ing && c.method === method)) return true;
    if (s.item && s.item.ing === ing && s.item.method === method) {
      if (s.kind === 'chop' && s.item.progress >= 100) return true;
      if (s.kind !== 'chop' && s.item.progress >= RULES.perfectLo && s.item.progress <= RULES.burntAt) return true;
    }
  }
  for (const chef of world.chefs) {
    if (chef.carry && chef.carry.kind === 'comp' && chef.carry.ing === ing && chef.carry.method === method) return true;
    if (chef.carry && chef.carry.kind === 'dish') return true;
  }
  return false;
}

// ---- the room --------------------------------------------------------------

function drawRoom(ctx, world, t) {
  // wall of brick behind the top counter
  rr(ctx, KITCHEN.x, KITCHEN.y, KITCHEN.w, 26, 4);
  ctx.fillStyle = PALETTE.brickDark;
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 12; i++) ctx.fillRect(KITCHEN.x + 8 + i * 78, KITCHEN.y + 12, 40, 3);
  // hanging pans on the brick band, between the bins
  for (let i = 0; i < 5; i++) {
    const px = KITCHEN.x + 130 + i * 184;
    circ(ctx, px, KITCHEN.y + 13, 8);
    ctx.fillStyle = '#3a3f45';
    ctx.fill();
    ctx.lineWidth = 1.4; ctx.strokeStyle = INK; ctx.stroke();
    gloss(ctx, px - 3, KITCHEN.y + 10, 2.6, 1.6, 0.5);
    ctx.fillRect(px - 1, KITCHEN.y + 2, 2, 4);
  }
  // floor: a subtle cream checker
  ctx.save();
  rr(ctx, KITCHEN.x, KITCHEN.y + 26, KITCHEN.w, KITCHEN.h - 26, 4);
  ctx.clip();
  const ts = 47;
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 22; col++) {
      ctx.fillStyle = (row + col) % 2 ? PALETTE.tileA : PALETTE.tileB;
      ctx.fillRect(KITCHEN.x + col * ts, KITCHEN.y + 26 + row * ts, ts, ts);
    }
  }
  // a tiled medallion and a woven rug warm up the middle of the floor
  ell(ctx, 480, 428, 128, 74);
  ctx.fillStyle = 'rgba(156,74,50,0.20)';
  ctx.fill();
  ell(ctx, 480, 428, 128, 74);
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = 'rgba(124,56,38,0.45)';
  ctx.stroke();
  ell(ctx, 480, 428, 96, 54);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  rr(ctx, 356, 388, 248, 80, 10);
  ctx.fillStyle = 'rgba(122,62,38,0.16)';
  ctx.fill();
  // flour sacks by the front counter, a crate of tomatoes by the cellar wall
  for (const [sx, sy] of [[150, 566], [186, 578]]) {
    rr(ctx, sx - 16, sy - 14, 32, 28, 9);
    fillStroke(ctx, '#e6d3ac', 1.8);
    rr(ctx, sx - 7, sy - 19, 14, 8, 3);
    fillStroke(ctx, '#c9b183', 1.4);
  }
  rr(ctx, 762, 226, 44, 34, 5);
  fillStroke(ctx, PALETTE.wood, 2);
  drawIngredient(ctx, 'tomato', 784, 224, 11, 'raw');
  ctx.restore(); // close the floor clip opened above
  // counters: top band (bins), front band (pans + plating), side blocks
  drawCounter(ctx, KITCHEN.x + 2, 168, KITCHEN.w - 4, 46);
  drawCounter(ctx, 108, 592, 716, 58);
  drawCounter(ctx, 8, 238, 96, 368);
  drawCounter(ctx, 828, 238, 124, 368);
  // herb pots on the top counter ends
  for (const px of [KITCHEN.x + 14, KITCHEN.x + KITCHEN.w - 26]) {
    rr(ctx, px, 176, 18, 14, 3);
    fillStroke(ctx, '#b85c33', 1.6);
    ctx.fillStyle = '#4d8c3a';
    for (let i = 0; i < 4; i++) { circ(ctx, px + 4 + i * 4, 172 - (i % 2) * 3, 4); ctx.fill(); }
  }
  // wine rack on the right wall: bottles catching the light
  for (let i = 0; i < 3; i++) {
    const bx = 838 + i * 34;
    rr(ctx, bx, 556, 10, 30, 4);
    ctx.fillStyle = i === 1 ? '#5a2a3a' : '#2e4a2e';
    ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.stroke();
    gloss(ctx, bx + 3, 562, 1.6, 6, 0.5);
  }
  text(ctx, 'CELLAR', 892, 600, { size: 9, align: 'center', color: '#e8d9b8' });
}

function drawCounter(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 6);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, PALETTE.counterTop);
  g.addColorStop(0.25, PALETTE.counter);
  g.addColorStop(1, PALETTE.woodDark);
  fillStroke(ctx, g, 2.2);
  // wood grain
  ctx.strokeStyle = 'rgba(42,26,16,0.3)';
  ctx.lineWidth = 1.1;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 8, y + (h / 3) * i);
    ctx.bezierCurveTo(x + w * 0.3, y + (h / 3) * i + 3, x + w * 0.6, y + (h / 3) * i - 3, x + w - 8, y + (h / 3) * i);
    ctx.stroke();
  }
  gloss(ctx, x + w / 2, y + 5, w / 2 - 10, 2.5, 0.14);
}

// ---- stations ---------------------------------------------------------------

function drawStations(ctx, world, t) {
  for (const s of world.stations) {
    switch (s.kind) {
      case 'bin': drawBin(ctx, s); break;
      case 'chop': drawChop(ctx, s, t); break;
      case 'pan': drawPan(ctx, s, t); break;
      case 'oven': drawOven(ctx, s, t); break;
      case 'plate': drawPlating(ctx, s, world); break;
      case 'pass': drawPass(ctx, world, t); break;
      case 'compost': drawCompost(ctx, s); break;
    }
    if (s.kind === 'bin') {
      text(ctx, s.label.toUpperCase(), s.x, s.y + 33, { size: 9.5, weight: 700, align: 'center', color: '#3a2410' });
    } else if (s.kind === 'pan' || s.kind === 'plate') {
      // front-counter stations: the label rides the counter's dark face
      text(ctx, s.label.toUpperCase(), s.x, s.y + 24, { size: 9.5, weight: 700, align: 'center', color: '#f3e5c8' });
    } else {
      // side-counter stations sit on dark wood: cream reads better
      text(ctx, s.label.toUpperCase(), s.x, s.y + 58, { size: 9.5, weight: 700, align: 'center', color: 'rgba(243,229,200,0.85)' });
    }
  }
}

function drawBin(ctx, s) {
  // a wooden crate with slats, heaped with the ingredient
  rr(ctx, s.x - 38, s.y - 20, 76, 46, 6);
  const g = ctx.createLinearGradient(0, s.y - 20, 0, s.y + 26);
  g.addColorStop(0, PALETTE.woodLight);
  g.addColorStop(1, PALETTE.wood);
  fillStroke(ctx, g, 2.2);
  ctx.strokeStyle = 'rgba(42,26,16,0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(s.x - 38, s.y - 4); ctx.lineTo(s.x + 38, s.y - 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s.x - 38, s.y + 11); ctx.lineTo(s.x + 38, s.y + 11); ctx.stroke();
  drawIngredient(ctx, ING_ART[s.ing], s.x - 12, s.y - 12, 13, 'raw');
  drawIngredient(ctx, ING_ART[s.ing], s.x + 13, s.y - 9, 11, 'raw');
}

const ING_ART = {
  tomato: 'tomato', porcini: 'porcini', salmon: 'salmon', dough: 'dough',
  pasta: 'pastaDry', arborio: 'arborio', cheese: 'cheese', prawns: 'prawns',
  steak: 'steak', basil: 'basil',
};

function drawChop(ctx, s, t) {
  rr(ctx, s.x - 36, s.y - 26, 72, 52, 6);
  fillStroke(ctx, '#d9b878', 2.2);
  ctx.strokeStyle = 'rgba(120,80,30,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(s.x - 30, s.y); ctx.lineTo(s.x + 30, s.y); ctx.stroke();
  // knife resting at the side
  ctx.save();
  ctx.translate(s.x + 24, s.y + 12);
  ctx.rotate(0.5);
  rr(ctx, -2, -12, 4, 14, 2);
  ctx.fillStyle = '#6e4525'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3, 2); ctx.lineTo(5, 2); ctx.lineTo(2, 14); ctx.lineTo(-3, 10);
  ctx.closePath();
  fillStroke(ctx, '#cfd6dd', 1.2);
  ctx.restore();
  if (s.item) {
    const done = s.item.progress >= 100;
    if (done) {
      drawComponent(ctx, { ing: s.item.ing, method: 'chop' }, s.x - 4, s.y - 2, 15);
      tag(ctx, s.x + 18, s.y - 30, '✓ READY', '#4d7c3a');
    } else {
      const bounce = Math.abs(Math.sin(t * 9)) * 2;
      drawIngredient(ctx, ING_ART[s.item.ing], s.x - 4, s.y - 2 - bounce * 0.2, 14, 'raw');
      progressPill(ctx, s.x, s.y - 34, `CHOP ${Math.floor(s.item.progress)}%`, '#8a5a30');
    }
  }
}

function progressPill(ctx, x, y, str, color) {
  const w = str.length * 6.6 + 12;
  pill(ctx, x - w / 2, y - 9, w, 18, PALETTE.paper);
  text(ctx, str, x, y + 0.5, { size: 10, weight: 800, align: 'center', color });
}

function tag(ctx, x, y, str, color) {
  const w = str.length * 7 + 12;
  pill(ctx, x - w / 2, y - 10, w, 20, color);
  text(ctx, str, x, y + 1, { size: 10.5, weight: 800, align: 'center', color: '#fff8ea' });
}

function cookState(item) {
  if (item.progress > RULES.burntAt) return 'burnt';
  if (item.progress >= RULES.perfectLo) return 'golden';
  return 'raw';
}

function drawPan(ctx, s, t) {
  // stovetop plate
  rr(ctx, s.x - 34, s.y - 30, 68, 56, 8);
  fillStroke(ctx, '#33302c', 2.2);
  circ(ctx, s.x, s.y - 2, 25);
  ctx.fillStyle = '#1f1d1a';
  ctx.fill();
  ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,120,60,0.5)'; ctx.stroke();
  // the pan
  circ(ctx, s.x, s.y - 4, 21);
  const g = ctx.createRadialGradient(s.x - 6, s.y - 10, 4, s.x, s.y - 4, 22);
  g.addColorStop(0, '#4a4f55');
  g.addColorStop(1, '#23262a');
  fillStroke(ctx, g, 2);
  rr(ctx, s.x + 16, s.y - 8, 20, 6, 3);
  fillStroke(ctx, '#23262a', 1.6);
  if (s.item) {
    const state = cookState(s.item);
    drawIngredient(ctx, ING_ART[s.item.ing], s.x, s.y - 5, 13, state);
    progressPill(ctx, s.x, s.y - 48, `${s.item.temp}°C · ${Math.floor(s.item.progress)}%`, state === 'burnt' ? '#5a2a20' : INK);
    if (state === 'golden') tag(ctx, s.x, s.y + 34, '★ PERFECT', '#c9962e');
    if (state === 'burnt') drawSteam(ctx, s.x, s.y - 26, t, true, 0.8);
    else drawSteam(ctx, s.x, s.y - 24, t, false, 0.8);
  }
}

function drawOven(ctx, s, t) {
  // the forno: a brick arch with a fire-lit mouth
  rr(ctx, s.x - 44, s.y - 52, 88, 104, 10);
  const g = ctx.createLinearGradient(0, s.y - 52, 0, s.y + 52);
  g.addColorStop(0, PALETTE.brick);
  g.addColorStop(1, PALETTE.brickDark);
  fillStroke(ctx, g, 2.4);
  ctx.strokeStyle = 'rgba(42,26,16,0.35)';
  ctx.lineWidth = 1.1;
  for (const yy of [-26, 0, 26]) { ctx.beginPath(); ctx.moveTo(s.x - 42, s.y + yy); ctx.lineTo(s.x + 42, s.y + yy); ctx.stroke(); }
  ctx.beginPath();
  ctx.arc(s.x, s.y + 18, 27, Math.PI, 0);
  ctx.lineTo(s.x + 27, s.y + 30);
  ctx.lineTo(s.x - 27, s.y + 30);
  ctx.closePath();
  ctx.fillStyle = '#241207';
  ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  // fire: layered flickering tongues
  const flick = Math.sin(t * 11 + s.x) * 2.4;
  for (const [dx, h, col] of [[-12, 17, '#e86a1e'], [0, 24 + flick, '#f28c28'], [12, 15, '#e86a1e'], [0, 13, '#f7c948']]) {
    ell(ctx, s.x + dx, s.y + 26 - h / 2, 7, h / 2);
    ctx.fillStyle = col;
    ctx.fill();
  }
  if (s.item) {
    const state = cookState(s.item);
    drawIngredient(ctx, ING_ART[s.item.ing], s.x, s.y + 8, 14, state);
    progressPill(ctx, s.x, s.y - 66, `${s.item.temp}°C · ${Math.floor(s.item.progress)}%`, INK);
    if (state === 'golden') tag(ctx, s.x, s.y + 66, '★ PERFECT', '#c9962e');
    if (state === 'burnt') drawSteam(ctx, s.x, s.y - 44, t, true, 0.9);
  }
  text(ctx, 'FORNO', s.x, s.y - 40, { size: 10, weight: 800, align: 'center', color: '#f3e5c8' });
}

function drawPlating(ctx, s, world) {
  rr(ctx, s.x - 40, s.y - 28, 80, 54, 7);
  const g = ctx.createLinearGradient(0, s.y - 28, 0, s.y + 26);
  g.addColorStop(0, '#f4efe4');
  g.addColorStop(1, '#d9d2c0');
  fillStroke(ctx, g, 2.2);
  const dish = matchDish(s.plate);
  if (dish) {
    drawDish(ctx, dish, s.x, s.y - 2, 21);
    tag(ctx, s.x, s.y + 40, DISHES[dish].name.toUpperCase(), '#4d7c3a');
  } else if (s.plate.length) {
    drawPlate(ctx, s.x, s.y - 2, 21);
    s.plate.forEach((c, i) => {
      const off = [[0, -3], [-9, 3], [9, 3], [0, 7]][i % 4];
      drawComponent(ctx, c, s.x + off[0], s.y + off[1], 9.5);
    });
    text(ctx, `${s.plate.length} on plate`, s.x, s.y + 40, { size: 9.5, weight: 700, align: 'center' });
  } else {
    drawPlate(ctx, s.x, s.y - 2, 19);
  }
}

function drawPass(ctx, world, t) {
  rr(ctx, 836, 408, 112, 116, 8);
  const g = ctx.createLinearGradient(0, 408, 0, 524);
  g.addColorStop(0, '#8a6a34');
  g.addColorStop(1, '#5f4620');
  fillStroke(ctx, g, 2.4);
  // heat lamps
  for (const lx of [862, 892, 922]) {
    ctx.beginPath(); ctx.moveTo(lx, 416); ctx.lineTo(lx, 428); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    circ(ctx, lx, 434, 7);
    const glow = 0.55 + Math.sin(t * 3 + lx) * 0.15;
    ctx.fillStyle = `rgba(255,92,52,${glow})`;
    ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke();
    gloss(ctx, lx - 2, 431, 2, 1.4, 0.7);
  }
  // the service bell: a brass dome on a base
  shadow(ctx, 892, 492, 20, 5, 0.25);
  ctx.beginPath();
  ctx.arc(892, 490, 16, Math.PI, 0);
  ctx.closePath();
  const bg = ctx.createLinearGradient(876, 474, 908, 490);
  bg.addColorStop(0, '#a87c26');
  bg.addColorStop(0.5, '#eec25e');
  bg.addColorStop(1, '#a87c26');
  fillStroke(ctx, bg, 2);
  circ(ctx, 892, 472, 3.4);
  fillStroke(ctx, '#eec25e', 1.4);
  rr(ctx, 872, 490, 40, 5, 2);
  fillStroke(ctx, '#6e5320', 1.4);
  const ready = world.t >= world.bellReadyAt;
  text(ctx, ready ? 'BELL · F' : '···', 892, 512, { size: 9.5, weight: 800, align: 'center', color: '#f3e5c8' });
}

function drawCompost(ctx, s) {
  rr(ctx, s.x - 24, s.y - 22, 48, 48, 6);
  fillStroke(ctx, '#3f6e3a', 2.2);
  rr(ctx, s.x - 27, s.y - 30, 54, 10, 4);
  fillStroke(ctx, '#33592f', 2);
  text(ctx, '♻', s.x, s.y + 4, { size: 17, align: 'center', color: '#dcefd2' });
}

// ---- tickets -----------------------------------------------------------------

function drawTickets(ctx, world) {
  const w = 238;
  world.tickets.forEach((ticket, i) => {
    const x = 8 + i * (w + 8);
    const y = 54;
    const dish = DISHES[ticket.dish];
    const frac = Math.max(0, ticket.patience / ticket.patienceMax);
    rr(ctx, x, y, w, 84, 8);
    fillStroke(ctx, PALETTE.paper, 2.2);
    rr(ctx, x, y, w, 20, 8);
    ctx.fillStyle = frac < 0.3 ? '#b83a2a' : '#7c4f2a';
    ctx.fill();
    ctx.fillRect(x, y + 12, w, 8);
    text(ctx, dish.name, x + 8, y + 10.5, { size: 12.5, weight: 800, color: '#fbf3dd' });
    text(ctx, `$${dish.price}`, x + w - 8, y + 10.5, { size: 12.5, weight: 800, color: '#eec25e', align: 'right' });
    // the dish itself, small but recognisable
    drawDish(ctx, ticket.dish, x + 30, y + 52, 21);
    // component chips that tick as parts land
    dish.recipe.forEach(([ing, method], j) => {
      const cx = x + 74 + j * 40;
      const cy = y + 44;
      rr(ctx, cx - 18, cy - 13, 36, 26, 6);
      const ready = componentReady(world, ing, method);
      fillStroke(ctx, ready ? '#dcebd2' : '#efe6cf', 1.5);
      drawIngredient(ctx, ING_ART[ing], cx, cy, 8, 'raw');
      if (ready) {
        text(ctx, '✓', cx + 11, cy - 8, { size: 11, weight: 900, color: '#4d7c3a' });
      }
    });
    text(ctx, `T${ticket.table}`, x + 66, y + 70, { size: 10, weight: 800, color: '#7c4f2a' });
    if (ticket.paired) {
      text(ctx, '★ SOMMELIER +$6', x + 100, y + 70, { size: 9.5, weight: 800, color: '#8a5aa0' });
    }
    // patience bar
    rr(ctx, x + 8, y + 76, w - 46, 6, 3);
    ctx.fillStyle = '#ddd0ae';
    ctx.fill();
    rr(ctx, x + 8, y + 76, Math.max(4, (w - 46) * frac), 6, 3);
    ctx.fillStyle = frac > 0.5 ? '#5d9c46' : frac > 0.28 ? '#e8a91c' : '#d8402a';
    ctx.fill();
    text(ctx, `${Math.ceil(ticket.patience)}s`, x + w - 8, y + 79, { size: 10.5, weight: 800, align: 'right' });
  });
  if (!world.tickets.length) {
    text(ctx, 'The order board is quiet — for a breath.', 16, 96, { size: 13, color: 'rgba(251,243,221,0.6)' });
  }
}

// ---- dining room ---------------------------------------------------------------

function drawDining(ctx, world, t) {
  rr(ctx, DINING.x, DINING.y, DINING.w, DINING.h, 8);
  const g = ctx.createLinearGradient(0, DINING.y, 0, DINING.y + DINING.h);
  g.addColorStop(0, '#5a3a22');
  g.addColorStop(1, '#3c2513');
  fillStroke(ctx, g, 2.4);
  text(ctx, 'S A L A   S O L E', DINING.x + DINING.w / 2, DINING.y + 22, {
    size: 15, weight: 800, align: 'center', color: '#eec25e', font: 'Georgia, serif',
  });
  world.tables.forEach((table, i) => {
    const cx = DINING.x + DINING.w / 2;
    const cy = DINING.y + 118 + i * 158;
    const guests = world.tickets.filter((tk) => tk.table === table.n);
    // guests behind the table
    guests.slice(0, 2).forEach((tk, gi) => {
      const mood = tk.patience / tk.patienceMax > 0.5 ? 'happy' : tk.patience / tk.patienceMax > 0.28 ? 'ok' : 'annoyed';
      drawGuest(ctx, tk.guest, cx + (gi === 0 ? -62 : 62), cy - 16, mood, t);
      // a little waiting bubble with the dish they ordered
      circ(ctx, cx + (gi === 0 ? -62 : 62), cy - 52, 11);
      fillStroke(ctx, '#fbf3dd', 1.6);
      drawDish(ctx, tk.dish, cx + (gi === 0 ? -62 : 62), cy - 52, 8.5);
    });
    // the table: cloth with a checked rim, candle, plates
    shadow(ctx, cx, cy + 26, 86, 14, 0.3);
    ell(ctx, cx, cy + 8, 88, 30);
    fillStroke(ctx, '#f7efdc', 2.2);
    ell(ctx, cx, cy + 8, 88, 30);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(184,58,42,0.5)';
    for (let s = -4; s < 5; s++) ctx.fillRect(cx + s * 22 - 5, cy + 26, 10, 12);
    ctx.restore();
    ell(ctx, cx, cy + 4, 70, 22);
    ctx.fillStyle = '#fdfaf0';
    ctx.fill();
    // candle
    rr(ctx, cx - 3, cy - 12, 6, 12, 2);
    ctx.fillStyle = '#f3e5c8';
    ctx.fill();
    const fl = Math.sin(t * 9 + i * 2) * 1.2;
    ell(ctx, cx, cy - 17 + fl * 0.3, 2.6, 4.6);
    ctx.fillStyle = '#f7a91e';
    ctx.fill();
    // served dish, while it lasts
    if (table.servedDish && world.t < table.servedUntil) {
      drawDish(ctx, table.servedDish, cx + 26, cy + 6, 17);
      if (world.t < table.sommelierUntil) {
        tag(ctx, cx + 26, cy - 26, '★ SOMMELIER!', '#8a5aa0');
      }
    } else {
      drawPlate(ctx, cx - 34, cy + 6, 11);
      drawPlate(ctx, cx + 34, cy + 6, 11);
    }
    text(ctx, `TABLE ${table.n}`, cx, cy + 52, { size: 10.5, weight: 800, align: 'center', color: '#cbb27f' });
  });
}

// ---- HUD, narration, screens ----------------------------------------------------

function drawStar(ctx, x, y, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  fillStroke(ctx, filled ? '#eec25e' : 'rgba(255,255,255,0.15)', 1.6);
}

function drawHud(ctx, world) {
  rr(ctx, 0, 0, VIEW.w, 48, 0);
  ctx.fillStyle = '#241407';
  ctx.fill();
  ctx.fillStyle = PALETTE.brass;
  ctx.fillRect(0, 46, VIEW.w, 2);
  // clock ring
  const cx = 30;
  const cy = 24;
  circ(ctx, cx, cy, 17);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.stroke();
  ctx.beginPath();
  const frac = world.phase === 'service' ? world.timeLeft / RULES.shiftSeconds : 1;
  ctx.arc(cx, cy, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, frac));
  ctx.strokeStyle = frac < 0.2 ? '#d8402a' : '#eec25e';
  ctx.stroke();
  const mm = Math.floor(Math.max(0, world.timeLeft) / 60);
  const ss = Math.floor(Math.max(0, world.timeLeft) % 60);
  text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, cx + 34, cy + 1, { size: 16, weight: 800, color: '#fbf3dd' });
  // coins + target
  circ(ctx, 148, cy, 9);
  fillStroke(ctx, '#eec25e', 1.8);
  text(ctx, '$', 148, cy + 1, { size: 11, weight: 900, align: 'center' });
  text(ctx, `${world.coins}`, 164, cy + 1, { size: 17, weight: 800, color: '#fbf3dd' });
  text(ctx, `/ ${RULES.targetCoins}`, 164 + ctx.measureText(`${world.coins}`).width + 26, cy + 1, { size: 12, color: '#cbb27f' });
  // stars
  for (let i = 0; i < 3; i++) drawStar(ctx, 330 + i * 30, cy, 10, i < 3 - world.walkouts);
  // combo pill
  if (world.combo > 0) {
    pill(ctx, 440, cy - 12, 118, 24, '#7c2d12');
    text(ctx, `COMBO ×${(1 + Math.min(world.combo, 8) * 0.25).toFixed(2).replace(/\.?0+$/, '')}`, 499, cy + 1, { size: 12, weight: 800, align: 'center', color: '#ffd9a0' });
  }
  // active chef pill
  const active = world.chefs.find((c) => c.active);
  pill(ctx, 580, cy - 12, 150, 24, '#3c2513');
  text(ctx, `${active.name.toUpperCase()} · Q SWAP`, 655, cy + 1, { size: 11.5, weight: 800, align: 'center', color: '#f3e5c8' });
  // title + buttons
  text(ctx, 'TRATTORIA SOLE', 1272, cy - 8, { size: 15, weight: 800, align: 'right', color: '#eec25e', font: 'Georgia, serif' });
  text(ctx, 'MENU · PAUSE · SERVICE', 1272, cy + 12, { size: 9.5, weight: 700, align: 'right', color: '#cbb27f' });
}

function drawNarration(ctx, world) {
  rr(ctx, 0, 660, VIEW.w, 60, 0);
  ctx.fillStyle = '#1d0f04';
  ctx.fill();
  ctx.fillStyle = PALETTE.brass;
  ctx.fillRect(0, 660, VIEW.w, 2);
  text(ctx, world.narration, 16, 690, { size: 14.5, color: '#f3e5c8', font: 'Georgia, serif' });
  text(ctx, 'WASD move · Space work · Q swap chef · F bell · Click a counter to walk there', 1264, 690, {
    size: 11, align: 'right', color: 'rgba(243,229,200,0.55)',
  });
}

function drawRoute(ctx, world, t) {
  const chef = world.chefs.find((c) => c.active);
  if (!chef || !chef.route) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,252,240,0.8)';
  ctx.lineWidth = 2.6;
  ctx.setLineDash([7, 7]);
  ctx.lineDashOffset = -t * 26;
  ctx.beginPath();
  ctx.moveTo(chef.x, chef.y - 6);
  ctx.quadraticCurveTo(
    (chef.x + chef.route.x) / 2, Math.min(chef.y, chef.route.y) - 24,
    chef.route.x, chef.route.y - 6,
  );
  ctx.stroke();
  ctx.setLineDash([]);
  circ(ctx, chef.route.x, chef.route.y - 6, 4);
  ctx.fillStyle = '#fffcf0';
  ctx.fill();
  ctx.restore();
}

function drawFloaters(ctx, world) {
  for (const f of world.floaters) {
    const age = world.t - f.born;
    const a = Math.max(0, 1 - age / f.life);
    ctx.save();
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y - age * 26, { size: 15, weight: 800, align: 'center', color: f.color });
    ctx.restore();
  }
}

function drawTitle(ctx, world, t) {
  ctx.fillStyle = 'rgba(20,10,3,0.62)';
  ctx.fillRect(0, 48, VIEW.w, VIEW.h - 48);
  const cx = VIEW.w / 2;
  rr(ctx, cx - 330, 120, 660, 470, 16);
  fillStroke(ctx, PALETTE.paper, 3);
  text(ctx, 'TRATTORIA SOLE', cx, 178, { size: 44, weight: 800, align: 'center', color: '#7c2d12', font: 'Georgia, serif' });
  text(ctx, 'a two-chef trattoria rush', cx, 214, { size: 16, align: 'center', color: '#7c4f2a', font: 'Georgia, serif' });
  text(ctx, 'TONIGHT’S MENU', cx, 252, { size: 12, weight: 800, align: 'center', color: '#c9962e' });
  const ids = Object.keys(DISHES);
  ids.forEach((id, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const mx = cx - 290 + col * 300;
    const my = 282 + row * 44;
    drawDish(ctx, id, mx + 16, my, 15);
    text(ctx, DISHES[id].name, mx + 40, my - 1, { size: 13.5, weight: 700 });
    text(ctx, `$${DISHES[id].price}`, mx + 268, my - 1, { size: 13, weight: 800, align: 'right', color: '#7c2d12' });
  });
  text(ctx, 'Bruno & Rosa work the line together — WASD to move, Space to work a counter,', cx, 486, { size: 13, align: 'center', color: '#5a4632' });
  text(ctx, 'Q to swap chefs, F to ring the bell. Mind the ★ PERFECT window on the heat.', cx, 508, { size: 13, align: 'center', color: '#5a4632' });
  const pulse = 0.75 + Math.sin(t * 4) * 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  pill(ctx, cx - 130, 532, 260, 38, '#b83a2a');
  text(ctx, 'CLICK OR PRESS ENTER — SERVICE!', cx, 552, { size: 14, weight: 800, align: 'center', color: '#fff8ea' });
  ctx.restore();
}

function drawDone(ctx, world, result) {
  ctx.fillStyle = 'rgba(20,10,3,0.66)';
  ctx.fillRect(0, 48, VIEW.w, VIEW.h - 48);
  const cx = VIEW.w / 2;
  rr(ctx, cx - 250, 170, 500, 360, 16);
  fillStroke(ctx, PALETTE.paper, 3);
  text(ctx, result.smashed ? 'TARGET SMASHED!' : 'SERVICE OVER', cx, 224, {
    size: 32, weight: 800, align: 'center', color: result.smashed ? '#4d7c3a' : '#7c2d12', font: 'Georgia, serif',
  });
  for (let i = 0; i < 3; i++) drawStar(ctx, cx - 34 + i * 34, 262, 13, i < result.stars);
  const rows = [
    ['Coins earned', `$${result.coins} / $${result.target}`],
    ['Dishes served', `${result.served}`],
    ['Walk-outs', `${result.walkouts}`],
    ['Best combo streak', `${result.bestCombo}`],
    ['PERFECT components', `${result.perfects}`],
  ];
  rows.forEach(([k, v], i) => {
    text(ctx, k, cx - 190, 306 + i * 34, { size: 15, color: '#5a4632' });
    text(ctx, v, cx + 190, 306 + i * 34, { size: 15, weight: 800, align: 'right' });
  });
  text(ctx, 'Press Enter to work another night', cx, 500, { size: 13, align: 'center', color: '#7c4f2a' });
}

// ---- the scene -------------------------------------------------------------------

export function drawScene(ctx, world, t, resultData = null) {
  ctx.fillStyle = '#17100b';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.save();
  if (world.shake > 0) {
    ctx.translate(Math.sin(t * 70) * world.shake * 8, 0);
  }
  drawRoom(ctx, world, t);
  drawStations(ctx, world, t);
  drawRoute(ctx, world, t);
  // chefs sorted by depth
  const sorted = [...world.chefs].sort((a, b) => a.y - b.y);
  for (const chef of sorted) {
    const carryArt = !chef.carry ? null
      : chef.carry.kind === 'dish' ? { dish: chef.carry.dish }
        : chef.carry.kind === 'comp' ? { comp: { ing: chef.carry.ing, method: chef.carry.method, perfect: chef.carry.perfect } }
          : { ing: chef.carry.ing };
    drawChef(ctx, chef, t, carryArt);
  }
  drawDining(ctx, world, t);
  drawTickets(ctx, world);
  drawHud(ctx, world);
  drawFloaters(ctx, world);
  drawNarration(ctx, world);
  ctx.restore();
  if (world.phase === 'title') drawTitle(ctx, world, t);
  if (world.phase === 'done' && resultData) drawDone(ctx, world, resultData);
  if (world.paused) {
    ctx.fillStyle = 'rgba(20,10,3,0.55)';
    ctx.fillRect(0, 48, VIEW.w, VIEW.h - 48);
    text(ctx, 'PAUSED', VIEW.w / 2, VIEW.h / 2, { size: 40, weight: 800, align: 'center', color: '#fbf3dd', font: 'Georgia, serif' });
  }
}
