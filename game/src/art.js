// Trattoria Sole — the art: every sprite in the game is drawn here, in code,
// with layered shapes, 2–3px ink outlines, gloss highlights and soft shadows.
// Chefs are little people with pleated toques and faces; food is drawn as
// still-lifes on its plate; nothing is a flat coloured blob if we can help it.

import { PALETTE } from './config.js';

const INK = PALETTE.ink;

// ---- primitives ----------------------------------------------------------

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function circ(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

export function ell(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

export function fillStroke(ctx, fill, lw = 2.4) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
}

export function shadow(ctx, x, y, rx, ry, alpha = 0.22) {
  ctx.save();
  ctx.fillStyle = `rgba(20,10,4,${alpha})`;
  ell(ctx, x, y, rx, ry);
  ctx.fill();
  ctx.restore();
}

export function gloss(ctx, x, y, rx, ry, alpha = 0.5) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ell(ctx, x, y, rx, ry);
  ctx.fill();
  ctx.restore();
}

// A white plate with a shaded rim, drawn as an ellipse (slight top-down tilt).
export function drawPlate(ctx, x, y, r) {
  shadow(ctx, x, y + r * 0.22, r * 1.02, r * 0.4, 0.18);
  ell(ctx, x, y, r, r * 0.82);
  fillStroke(ctx, '#fdfaf2', 2.2);
  ell(ctx, x, y, r * 0.74, r * 0.6);
  ctx.fillStyle = '#efe7d4';
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(42,26,16,0.35)';
  ctx.stroke();
}

// Rising steam wisps (or smoke, when dark) above hot food.
export function drawSteam(ctx, x, y, t, dark = false, scale = 1) {
  ctx.save();
  ctx.lineWidth = 2.2 * scale;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const ph = t * 2.2 + i * 1.7;
    const sway = Math.sin(ph) * 3 * scale;
    ctx.strokeStyle = dark ? 'rgba(40,36,32,0.5)' : 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.moveTo(x + i * 8 * scale + sway * 0.3, y);
    ctx.quadraticCurveTo(
      x + i * 8 * scale - sway, y - 8 * scale,
      x + i * 8 * scale + sway, y - 16 * scale,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// ---- ingredients, drawn as little still-lifes ----------------------------
// state: 'raw' | 'golden' | 'burnt' — pans recolour what they hold.

function tintFor(state) {
  if (state === 'burnt') return { mul: 0.32, wash: 'rgba(24,16,10,0.55)' };
  if (state === 'golden') return { mul: 1, wash: 'rgba(255,176,64,0.16)' };
  return { mul: 1, wash: null };
}

function withState(ctx, x, y, r, state, draw) {
  draw();
  const { wash } = tintFor(state);
  if (wash) {
    ctx.save();
    ell(ctx, x, y, r, r * 0.8);
    ctx.fillStyle = wash;
    ctx.fill();
    ctx.restore();
  }
}

export function drawIngredient(ctx, art, x, y, r, state = 'raw') {
  withState(ctx, x, y, r, state, () => {
    switch (art) {
      case 'tomato': return drawTomato(ctx, x, y, r);
      case 'porcini': return drawPorcini(ctx, x, y, r);
      case 'salmon': return drawSalmon(ctx, x, y, r);
      case 'steak': return drawSteakRaw(ctx, x, y, r);
      case 'dough': return drawDough(ctx, x, y, r);
      case 'pastaDry': return drawPastaDry(ctx, x, y, r);
      case 'arborio': return drawArborio(ctx, x, y, r);
      case 'cheese': return drawCheese(ctx, x, y, r);
      case 'prawns': return drawPrawns(ctx, x, y, r);
      case 'basil': return drawBasil(ctx, x, y, r);
      default: circ(ctx, x, y, r); return fillStroke(ctx, '#ccc');
    }
  });
}

function drawTomato(ctx, x, y, r) {
  circ(ctx, x, y, r);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.15, x, y, r);
  g.addColorStop(0, '#f2664d');
  g.addColorStop(1, '#c9331d');
  fillStroke(ctx, g);
  gloss(ctx, x - r * 0.34, y - r * 0.38, r * 0.3, r * 0.18, 0.55);
  // stem star + leaf
  ctx.fillStyle = '#3f7a2e';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - 0.5;
    ell(ctx, x + Math.cos(a) * r * 0.2, y - r * 0.78 + Math.sin(a) * r * 0.08, r * 0.2, r * 0.09);
    ctx.fill();
  }
  ctx.fillStyle = '#4d8c3a';
  ell(ctx, x + r * 0.28, y - r * 0.86, r * 0.3, r * 0.12);
  ctx.fill();
}

function drawPorcini(ctx, x, y, r) {
  // stem
  rr(ctx, x - r * 0.28, y - r * 0.05, r * 0.56, r * 0.85, r * 0.2);
  fillStroke(ctx, '#e6d3ac', 2);
  // cap dome with shading + spots
  ctx.beginPath();
  ctx.arc(x, y - r * 0.05, r * 0.92, Math.PI, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, y - r, x, y);
  g.addColorStop(0, '#a9743f');
  g.addColorStop(1, '#7c4f24');
  fillStroke(ctx, g);
  ctx.fillStyle = 'rgba(255,235,200,0.5)';
  for (const [dx, dy, s] of [[-0.4, -0.55, 0.14], [0.25, -0.7, 0.11], [0.55, -0.4, 0.09]]) {
    circ(ctx, x + dx * r, y + dy * r, s * r);
    ctx.fill();
  }
  // gill lines under the cap
  ctx.strokeStyle = 'rgba(42,26,16,0.5)';
  ctx.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * r * 0.22, y - r * 0.12);
    ctx.lineTo(x + i * r * 0.26, y + r * 0.02);
    ctx.stroke();
  }
}

function drawSalmon(ctx, x, y, r) {
  // fillet: a rounded wedge, pink with white marbling and a skin edge
  ctx.beginPath();
  ctx.moveTo(x - r * 0.95, y + r * 0.45);
  ctx.quadraticCurveTo(x - r * 1.0, y - r * 0.55, x - r * 0.2, y - r * 0.62);
  ctx.quadraticCurveTo(x + r * 0.85, y - r * 0.6, x + r * 0.95, y + r * 0.1);
  ctx.quadraticCurveTo(x + r * 0.6, y + r * 0.55, x, y + r * 0.5);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, y - r * 0.6, x, y + r * 0.6);
  g.addColorStop(0, '#f7a583');
  g.addColorStop(1, '#ee7f5c');
  fillStroke(ctx, g);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.6;
  for (const off of [-0.35, 0, 0.35]) {
    ctx.beginPath();
    ctx.moveTo(x + off * r - r * 0.3, y - r * 0.42);
    ctx.quadraticCurveTo(x + off * r, y, x + off * r - r * 0.24, y + r * 0.4);
    ctx.stroke();
  }
  // skin edge
  ctx.beginPath();
  ctx.moveTo(x - r * 0.95, y + r * 0.45);
  ctx.quadraticCurveTo(x, y + r * 0.72, x + r * 0.95, y + r * 0.1);
  ctx.lineWidth = Math.max(1.4, r * 0.13);
  ctx.strokeStyle = '#7e8b96';
  ctx.stroke();
  gloss(ctx, x - r * 0.3, y - r * 0.3, r * 0.34, r * 0.14, 0.4);
}

function drawSteakRaw(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x - r * 0.9, y - r * 0.2);
  ctx.quadraticCurveTo(x - r * 0.7, y - r * 0.75, x, y - r * 0.7);
  ctx.quadraticCurveTo(x + r * 0.9, y - r * 0.65, x + r * 0.88, y + r * 0.15);
  ctx.quadraticCurveTo(x + r * 0.8, y + r * 0.7, x, y + r * 0.68);
  ctx.quadraticCurveTo(x - r * 0.85, y + r * 0.6, x - r * 0.9, y - r * 0.2);
  ctx.closePath();
  const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.2, x, y, r);
  g.addColorStop(0, '#c05243');
  g.addColorStop(1, '#93321f');
  fillStroke(ctx, g);
  // fat marbling
  ctx.strokeStyle = 'rgba(250,230,210,0.8)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y + r * 0.3);
  ctx.quadraticCurveTo(x - r * 0.1, y - r * 0.25, x + r * 0.4, y + r * 0.05);
  ctx.stroke();
  circ(ctx, x + r * 0.42, y - r * 0.32, r * 0.13);
  ctx.fillStyle = 'rgba(250,230,210,0.85)';
  ctx.fill();
}

function drawDough(ctx, x, y, r) {
  circ(ctx, x, y + r * 0.1, r * 0.85);
  const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.2, r * 0.2, x, y, r);
  g.addColorStop(0, '#f7e8c4');
  g.addColorStop(1, '#e3c88f');
  fillStroke(ctx, g);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const [dx, dy] of [[-0.3, -0.3], [0.25, -0.1], [0, 0.3], [-0.45, 0.15]]) {
    circ(ctx, x + dx * r, y + dy * r, r * 0.07);
    ctx.fill();
  }
  gloss(ctx, x - r * 0.3, y - r * 0.32, r * 0.3, r * 0.15, 0.5);
}

function drawPastaDry(ctx, x, y, r) {
  // a bundle of dry spaghetti: pale sticks fanned in a wrap
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  ctx.strokeStyle = '#e9c45e';
  ctx.lineWidth = r * 0.13;
  ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * r * 0.16, -r * 0.85);
    ctx.lineTo(i * r * 0.2, r * 0.85);
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.restore();
  rr(ctx, x - r * 0.5, y - r * 0.12, r, r * 0.3, 3);
  fillStroke(ctx, '#b83a2a', 1.6);
}

function drawArborio(ctx, x, y, r) {
  // a little heap of rice in a scoop bowl
  ell(ctx, x, y + r * 0.25, r * 0.95, r * 0.5);
  fillStroke(ctx, '#8a5a30', 2);
  ell(ctx, x, y, r * 0.8, r * 0.55);
  ctx.fillStyle = '#f4ecd6';
  ctx.fill();
  ctx.fillStyle = '#e2d3ac';
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    ell(ctx, x + Math.cos(a) * r * 0.45, y - r * 0.1 + Math.sin(a) * r * 0.22, r * 0.13, r * 0.07);
    ctx.fill();
  }
  gloss(ctx, x - r * 0.3, y - r * 0.25, r * 0.25, r * 0.1, 0.35);
}

function drawCheese(ctx, x, y, r) {
  // a wedge with holes and a rind
  ctx.beginPath();
  ctx.moveTo(x - r * 0.9, y + r * 0.55);
  ctx.lineTo(x + r * 0.85, y + r * 0.1);
  ctx.lineTo(x + r * 0.85, y + r * 0.55);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, y - r * 0.3, x, y + r * 0.6);
  g.addColorStop(0, '#f7cd62');
  g.addColorStop(1, '#eda92e');
  fillStroke(ctx, g);
  ctx.fillStyle = 'rgba(190,120,20,0.55)';
  for (const [dx, dy, s] of [[0.2, 0.35, 0.16], [0.55, 0.3, 0.11], [-0.25, 0.42, 0.09]]) {
    circ(ctx, x + dx * r, y + dy * r, s * r);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(x + r * 0.85, y + r * 0.1);
  ctx.lineTo(x + r * 0.85, y + r * 0.55);
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = '#d98a1f';
  ctx.stroke();
}

function drawPrawns(ctx, x, y, r) {
  for (const [dx, dy, rot] of [[-0.35, 0.05, 0.5], [0.3, -0.15, 2.4], [0.05, 0.4, 4.2]]) {
    drawOnePrawn(ctx, x + dx * r, y + dy * r, r * 0.55, rot);
  }
}

function drawOnePrawn(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // curled body: a C of segmented bands
  for (let i = 0; i < 5; i++) {
    const a = -0.6 + i * 0.55;
    const px = Math.cos(a) * r * 0.55;
    const py = Math.sin(a) * r * 0.55;
    circ(ctx, px, py, r * (0.42 - i * 0.03));
    ctx.fillStyle = i % 2 ? '#f6b08c' : '#ef8a63';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  // tail fan
  ctx.beginPath();
  ctx.moveTo(r * 0.5, -r * 0.45);
  ctx.lineTo(r * 0.95, -r * 0.8);
  ctx.lineTo(r * 0.9, -r * 0.15);
  ctx.closePath();
  fillStroke(ctx, '#e8734a', 1.6);
  circ(ctx, -r * 0.52, -r * 0.1, r * 0.09);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.restore();
}

function drawBasil(ctx, x, y, r) {
  for (const [dx, dy, rot] of [[-0.3, 0.1, -0.5], [0.28, 0.05, 0.45], [0, -0.3, 0]]) {
    ctx.save();
    ctx.translate(x + dx * r, y + dy * r);
    ctx.rotate(rot);
    ell(ctx, 0, 0, r * 0.42, r * 0.62);
    const g = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.6);
    g.addColorStop(0, '#63a047');
    g.addColorStop(1, '#3c7031');
    fillStroke(ctx, g, 1.8);
    ctx.strokeStyle = 'rgba(20,40,16,0.55)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.5);
    ctx.lineTo(0, r * 0.5);
    ctx.stroke();
    ctx.restore();
  }
}

// Diced tomato (the chopped form): a pile of glossy red cubes.
export function drawDicedTomato(ctx, x, y, r) {
  const cubes = [[-0.4, 0.15], [0, 0.3], [0.4, 0.12], [-0.2, -0.15], [0.25, -0.2], [0, 0]];
  for (const [dx, dy] of cubes) {
    rr(ctx, x + dx * r - r * 0.24, y + dy * r - r * 0.24, r * 0.48, r * 0.48, r * 0.12);
    fillStroke(ctx, '#d8402a', 1.4);
    gloss(ctx, x + dx * r - r * 0.08, y + dy * r - r * 0.1, r * 0.1, r * 0.06, 0.6);
  }
}

// ---- cooked forms and plated dishes --------------------------------------

function drawSteakCooked(ctx, x, y, r, state) {
  ctx.beginPath();
  ctx.moveTo(x - r * 0.9, y - r * 0.2);
  ctx.quadraticCurveTo(x - r * 0.7, y - r * 0.75, x, y - r * 0.7);
  ctx.quadraticCurveTo(x + r * 0.9, y - r * 0.65, x + r * 0.88, y + r * 0.15);
  ctx.quadraticCurveTo(x + r * 0.8, y + r * 0.7, x, y + r * 0.68);
  ctx.quadraticCurveTo(x - r * 0.85, y + r * 0.6, x - r * 0.9, y - r * 0.2);
  ctx.closePath();
  const base = state === 'burnt' ? '#2e2019' : state === 'golden' ? '#7c3b22' : '#8a4430';
  const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.2, x, y, r);
  g.addColorStop(0, state === 'burnt' ? '#3a2a20' : '#9c5138');
  g.addColorStop(1, base);
  fillStroke(ctx, g);
  if (state !== 'burnt') {
    // sear marks
    ctx.strokeStyle = 'rgba(30,14,6,0.65)';
    ctx.lineWidth = r * 0.09;
    ctx.lineCap = 'round';
    for (const off of [-0.4, 0, 0.4]) {
      ctx.beginPath();
      ctx.moveTo(x + off * r - r * 0.28, y - r * 0.42);
      ctx.lineTo(x + off * r + r * 0.28, y + r * 0.42);
      ctx.stroke();
    }
    // rosemary sprig
    ctx.strokeStyle = '#3c7031';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y + r * 0.45);
    ctx.quadraticCurveTo(x, y + r * 0.2, x + r * 0.5, y + r * 0.42);
    ctx.stroke();
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 6; i++) {
      const px = x - r * 0.4 + i * r * 0.16;
      ctx.beginPath();
      ctx.moveTo(px, y + r * 0.36);
      ctx.lineTo(px - r * 0.06, y + r * 0.18);
      ctx.stroke();
    }
    gloss(ctx, x - r * 0.25, y - r * 0.35, r * 0.3, r * 0.12, 0.28); // juice sheen
  }
}

// A twirled nest of cooked pasta, optionally sauced.
function drawPastaNest(ctx, x, y, r, sauce) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    ell(ctx, x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.2, r * 0.5, r * 0.3);
    ctx.strokeStyle = i % 2 ? '#eec95e' : '#f4d67c';
    ctx.lineWidth = r * 0.16;
    ctx.stroke();
  }
  ell(ctx, x, y, r * 0.42, r * 0.26);
  ctx.strokeStyle = '#f7e08a';
  ctx.lineWidth = r * 0.15;
  ctx.stroke();
  ctx.restore();
  if (sauce) {
    ell(ctx, x, y - r * 0.05, r * 0.5, r * 0.3);
    ctx.fillStyle = sauce;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;
    gloss(ctx, x - r * 0.15, y - r * 0.15, r * 0.2, r * 0.08, 0.35);
  }
}

// One component as it lands on a plate being assembled.
export function drawComponent(ctx, comp, x, y, r) {
  const { ing, method } = comp;
  if (method === 'chop') {
    if (ing === 'tomato') return drawDicedTomato(ctx, x, y, r);
    if (ing === 'porcini') {
      // porcini slices: pale fans with brown rims
      for (const dx of [-0.35, 0, 0.35]) {
        ctx.beginPath();
        ctx.arc(x + dx * r, y + r * 0.2, r * 0.3, Math.PI, 0);
        ctx.closePath();
        fillStroke(ctx, '#e6d3ac', 1.5);
        ctx.beginPath();
        ctx.arc(x + dx * r, y + r * 0.2, r * 0.3, Math.PI, 0);
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#7c4f24';
        ctx.stroke();
      }
      return;
    }
  }
  if (method === 'pan' || method === 'oven') {
    const state = comp.perfect ? 'golden' : 'raw';
    if (ing === 'steak') return drawSteakCooked(ctx, x, y, r, state);
    if (ing === 'pasta') return drawPastaNest(ctx, x, y, r, null);
    if (ing === 'arborio') return drawRisottoBase(ctx, x, y, r);
    if (ing === 'dough') return drawPizzaBase(ctx, x, y, r);
    return drawIngredient(ctx, ING_ART[ing], x, y, r, state);
  }
  return drawIngredient(ctx, ING_ART[ing], x, y, r, 'raw');
}

const ING_ART = {
  tomato: 'tomato', porcini: 'porcini', salmon: 'salmon', dough: 'dough',
  pasta: 'pastaDry', arborio: 'arborio', cheese: 'cheese', prawns: 'prawns',
  steak: 'steak', basil: 'basil',
};

function drawPizzaBase(ctx, x, y, r) {
  circ(ctx, x, y, r);
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, '#f2d491');
  g.addColorStop(0.8, '#eebd6d');
  g.addColorStop(1, '#d99b3f');
  fillStroke(ctx, g);
  ctx.strokeStyle = 'rgba(160,100,30,0.5)';
  ctx.lineWidth = 1.2;
  for (const [dx, dy] of [[-0.4, 0.2], [0.3, -0.35], [0.5, 0.4], [-0.15, -0.5]]) {
    circ(ctx, x + dx * r, y + dy * r, r * 0.07);
    ctx.stroke();
  }
}

function drawRisottoBase(ctx, x, y, r) {
  ell(ctx, x, y, r * 0.95, r * 0.72);
  const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.2, x, y, r);
  g.addColorStop(0, '#f7efdb');
  g.addColorStop(1, '#e6d3a8');
  fillStroke(ctx, g, 2);
  ctx.fillStyle = '#d9c48f';
  for (let i = 0; i < 10; i++) {
    const a = i * 2.7;
    ell(ctx, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.32, r * 0.13, r * 0.07);
    ctx.fill();
  }
  gloss(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.12, 0.4); // creamy sheen
}

// A finished dish on its plate — the renderer's best work, used at the pass,
// on dining tables and (small) on the ticket cards themselves.
export function drawDish(ctx, dishId, x, y, r) {
  drawPlate(ctx, x, y, r);
  const ir = r * 0.72;
  switch (dishId) {
    case 'bruschetta': {
      // two toasts, diced tomato, basil, oil sheen
      for (const dx of [-0.34, 0.34]) {
        ctx.save();
        ctx.translate(x + dx * r, y + r * 0.05);
        ctx.rotate(dx > 0 ? 0.16 : -0.12);
        rr(ctx, -ir * 0.52, -ir * 0.42, ir * 1.04, ir * 0.84, ir * 0.3);
        const g = ctx.createLinearGradient(0, -ir * 0.4, 0, ir * 0.4);
        g.addColorStop(0, '#eebd6d');
        g.addColorStop(1, '#cf9438');
        fillStroke(ctx, g, 2);
        ctx.restore();
        drawDicedTomato(ctx, x + dx * r, y - r * 0.02, ir * 0.5);
      }
      drawBasil(ctx, x, y - r * 0.28, ir * 0.4);
      gloss(ctx, x - r * 0.2, y + r * 0.3, r * 0.3, r * 0.08, 0.3);
      break;
    }
    case 'margherita': {
      circ(ctx, x, y, ir * 1.05);
      const g = ctx.createRadialGradient(x, y, ir * 0.2, x, y, ir);
      g.addColorStop(0, '#f2d491');
      g.addColorStop(0.82, '#eebd6d');
      g.addColorStop(1, '#cf8f33');
      fillStroke(ctx, g, 2);
      circ(ctx, x, y, ir * 0.82);
      ctx.fillStyle = '#f6d67c';
      ctx.fill();
      // melted cheese drips + tomato patches
      ctx.fillStyle = '#f9e29a';
      for (const [dx, dy, s] of [[-0.4, 0.1, 0.2], [0.35, -0.3, 0.24], [0.1, 0.42, 0.18]]) {
        ell(ctx, x + dx * ir, y + dy * ir, s * ir, s * ir * 0.7);
        ctx.fill();
      }
      ctx.fillStyle = '#d8402a';
      for (const [dx, dy] of [[-0.2, -0.35], [0.45, 0.25], [-0.5, 0.4]]) {
        circ(ctx, x + dx * ir, y + dy * ir, ir * 0.13);
        ctx.fill();
      }
      drawBasil(ctx, x + ir * 0.15, y - ir * 0.1, ir * 0.4);
      break;
    }
    case 'pomodoro': {
      drawPastaNest(ctx, x, y, ir, '#d8402a');
      drawDicedTomato(ctx, x - ir * 0.2, y - ir * 0.15, ir * 0.45);
      drawBasil(ctx, x + ir * 0.3, y + ir * 0.1, ir * 0.38);
      snowParmesan(ctx, x, y, ir);
      break;
    }
    case 'risotto': {
      drawRisottoBase(ctx, x, y, ir);
      for (const dx of [-0.3, 0.25]) {
        ctx.beginPath();
        ctx.arc(x + dx * ir, y - ir * 0.15, ir * 0.26, Math.PI, 0);
        ctx.closePath();
        fillStroke(ctx, '#e6d3ac', 1.4);
        ctx.beginPath();
        ctx.arc(x + dx * ir, y - ir * 0.15, ir * 0.26, Math.PI, 0);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#7c4f24';
        ctx.stroke();
      }
      snowParmesan(ctx, x, y, ir);
      break;
    }
    case 'salmonDish': {
      drawSalmon(ctx, x, y - ir * 0.05, ir * 0.95);
      drawPorcini(ctx, x - ir * 0.55, y + ir * 0.45, ir * 0.34);
      drawBasil(ctx, x + ir * 0.5, y + ir * 0.4, ir * 0.36);
      // lemon wedge
      ctx.beginPath();
      ctx.moveTo(x + ir * 0.55, y - ir * 0.55);
      ctx.arc(x + ir * 0.55, y - ir * 0.55, ir * 0.22, 0.3, 2.2);
      ctx.closePath();
      fillStroke(ctx, '#f7e07a', 1.6);
      break;
    }
    case 'scampiPasta': {
      drawPastaNest(ctx, x, y, ir, 'rgba(238,201,94,0.9)');
      drawPrawns(ctx, x, y - ir * 0.1, ir * 0.8);
      drawDicedTomato(ctx, x + ir * 0.35, y + ir * 0.35, ir * 0.4);
      snowParmesan(ctx, x, y, ir);
      break;
    }
    case 'scampi': {
      drawPrawns(ctx, x - ir * 0.1, y - ir * 0.05, ir * 1.0);
      // garlic toast at the side
      ctx.save();
      ctx.translate(x + ir * 0.55, y + ir * 0.45);
      ctx.rotate(0.3);
      rr(ctx, -ir * 0.4, -ir * 0.26, ir * 0.8, ir * 0.52, ir * 0.22);
      fillStroke(ctx, '#eebd6d', 1.8);
      ctx.restore();
      drawBasil(ctx, x - ir * 0.5, y + ir * 0.4, ir * 0.34);
      break;
    }
    case 'bistecca': {
      drawSteakCooked(ctx, x, y - ir * 0.05, ir * 0.95, 'golden');
      drawPorcini(ctx, x - ir * 0.6, y + ir * 0.5, ir * 0.3);
      drawTomato(ctx, x + ir * 0.62, y + ir * 0.42, ir * 0.3);
      break;
    }
    default:
      circ(ctx, x, y, ir);
      fillStroke(ctx, '#ccc');
  }
}

function snowParmesan(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(255,252,240,0.9)';
  for (let i = 0; i < 12; i++) {
    const a = i * 2.39;
    const d = ((i * 37) % 60) / 100;
    circ(ctx, x + Math.cos(a) * r * d, y + Math.sin(a) * r * d * 0.7, r * 0.045);
    ctx.fill();
  }
}

// ---- people ---------------------------------------------------------------

// A chef, ~54px wide and ~74px tall, drawn around (x, feetY). Direction-aware:
// side-on when facing left/right, back view when walking away. The carried
// item rides in front of the apron so the player reads it at a glance.
export function drawChef(ctx, chef, t, carryArt) {
  const { x, y } = chef;
  const bob = chef.moving ? Math.abs(Math.sin(chef.walkPhase)) * 3 : Math.sin(t * 2 + x) * 0.8;
  const step = chef.moving ? Math.sin(chef.walkPhase) * 5 : 0;
  const back = chef.vertical === 'back';
  ctx.save();
  ctx.translate(x, y - bob);
  shadow(ctx, 0, 4 + bob, 24, 7, 0.25);
  const flip = chef.facing < 0 ? -1 : 1;
  ctx.scale(flip, 1);

  // legs + shoes (walk cycle)
  ctx.fillStyle = '#5a4632';
  rr(ctx, -13 + step * 0.6, -16, 10, 15, 4); ctx.fill();
  rr(ctx, 3 - step * 0.6, -16, 10, 15, 4); ctx.fill();
  ctx.fillStyle = '#2a1a10';
  ell(ctx, -8 + step, -1, 8, 3.6); ctx.fill();
  ell(ctx, 8 - step, -1, 8, 3.6); ctx.fill();

  // jacket: double-breasted, two columns of buttons
  rr(ctx, -19, -52, 38, 38, 9);
  const jg = ctx.createLinearGradient(0, -52, 0, -14);
  jg.addColorStop(0, '#ffffff');
  jg.addColorStop(1, '#e9e2d2');
  fillStroke(ctx, jg, 2.4);
  ctx.fillStyle = '#c9962e';
  for (const bx of [-8, 8]) for (const by of [-44, -34, -24]) {
    circ(ctx, bx, by, 1.9);
    ctx.fill();
  }
  // apron with a pocket
  rr(ctx, -14, -30, 28, 26, 5);
  fillStroke(ctx, '#f4efe2', 1.8);
  ctx.strokeStyle = 'rgba(42,26,16,0.4)';
  ctx.lineWidth = 1.2;
  rr(ctx, -8, -18, 16, 9, 3);
  ctx.stroke();
  // neckerchief
  ctx.beginPath();
  ctx.moveTo(-10, -52);
  ctx.lineTo(10, -52);
  ctx.lineTo(0, -40);
  ctx.closePath();
  fillStroke(ctx, chef.scarf, 1.8);
  // arms: one at the side, one forward when carrying
  ctx.fillStyle = '#f7f3e8';
  if (carryArt) {
    rr(ctx, 8, -44, 17, 8, 4); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke();
  } else {
    rr(ctx, 14, -48, 8, 22 + (chef.moving ? step * 0.5 : 0), 4); ctx.fill();
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke();
  }
  rr(ctx, -22, -48, 8, 22 - (chef.moving ? step * 0.5 : 0), 4); ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke();

  // head
  const hy = -66;
  circ(ctx, 0, hy, 15);
  fillStroke(ctx, chef.skin, 2.4);
  if (back) {
    // back of the head: hair below the hat band
    ctx.beginPath();
    ctx.arc(0, hy + 2, 14, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = chef.hair;
    ctx.fill();
  } else {
    const look = flip * 2.2;
    // eyes that glance toward the walk direction
    ctx.fillStyle = INK;
    ell(ctx, -5.5 + look, hy - 1, 1.9, 2.6); ctx.fill();
    ell(ctx, 5.5 + look, hy - 1, 1.9, 2.6); ctx.fill();
    gloss(ctx, -5 + look, hy - 2, 0.8, 0.8, 0.9);
    gloss(ctx, 6 + look, hy - 2, 0.8, 0.8, 0.9);
    // eyebrows
    ctx.strokeStyle = chef.hair;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-8.5 + look, hy - 6.5); ctx.lineTo(-2.5 + look, hy - 7.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2.5 + look, hy - 7.5); ctx.lineTo(8.5 + look, hy - 6.5); ctx.stroke();
    // nose + smile
    ctx.strokeStyle = 'rgba(120,60,30,0.6)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(look, hy + 1); ctx.lineTo(look - 1, hy + 4); ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.arc(look, hy + 3.4, 5, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
    // cheeks
    ctx.fillStyle = 'rgba(232,110,80,0.35)';
    ell(ctx, -10, hy + 3, 3.2, 2); ctx.fill();
    ell(ctx, 10, hy + 3, 3.2, 2); ctx.fill();
    if (chef.moustache) {
      ctx.fillStyle = chef.hair;
      ell(ctx, -4 + look, hy + 6.4, 4.6, 2.2); ctx.fill();
      ell(ctx, 4 + look, hy + 6.4, 4.6, 2.2); ctx.fill();
    }
    if (chef.earring) {
      circ(ctx, -14.5, hy + 3, 1.8);
      ctx.fillStyle = '#eec25e';
      ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = INK; ctx.stroke();
      // hair spilling at the sides under the bandana
      ctx.fillStyle = chef.hair;
      rr(ctx, -16.5, hy - 4, 4.5, 13, 2); ctx.fill();
      rr(ctx, 12, hy - 4, 4.5, 11, 2); ctx.fill();
    }
  }

  // the toque: tall, pleated, shaded, with a coloured band. Rosa wears hers
  // over a bandana — same silhouette, greener band, a knot at the side.
  const hatY = hy - 13;
  rr(ctx, -13, hatY - 4, 26, 8, 3);
  fillStroke(ctx, chef.band, 2);
  ctx.beginPath();
  ctx.moveTo(-13, hatY - 3);
  ctx.quadraticCurveTo(-17, hatY - 24, -8, hatY - 27);
  ctx.quadraticCurveTo(0, hatY - 31, 8, hatY - 27);
  ctx.quadraticCurveTo(17, hatY - 24, 13, hatY - 3);
  ctx.closePath();
  const hg = ctx.createLinearGradient(-14, 0, 14, 0);
  hg.addColorStop(0, '#e9e2d2');
  hg.addColorStop(0.45, '#ffffff');
  hg.addColorStop(1, '#ddd2ba');
  fillStroke(ctx, hg, 2.4);
  ctx.strokeStyle = 'rgba(42,26,16,0.28)';
  ctx.lineWidth = 1.2;
  for (const px of [-7, 0, 7]) {
    ctx.beginPath();
    ctx.moveTo(px, hatY - 5);
    ctx.quadraticCurveTo(px + (px === 0 ? 0 : px * 0.14), hatY - 16, px, hatY - 25);
    ctx.stroke();
  }
  if (chef.earring) {
    circ(ctx, 14, hatY - 2, 3);
    fillStroke(ctx, chef.band, 1.4);
  }
  ctx.restore();

  // carried item, in front of the apron (unflipped space)
  if (carryArt) {
    const cx = x + chef.facing * 20;
    const cy = y - bob - 34;
    if (carryArt.dish) {
      drawDish(ctx, carryArt.dish, cx, cy, 19);
    } else if (carryArt.comp) {
      drawPlate(ctx, cx, cy, 18);
      drawComponent(ctx, carryArt.comp, cx, cy, 12);
    } else if (carryArt.ing) {
      drawPlate(ctx, cx, cy, 16);
      drawIngredient(ctx, ING_ART[carryArt.ing], cx, cy, 11, 'raw');
    }
  }

  // inactive chef: a little brass AI tag floats by the hat
  if (!chef.active) {
    ctx.save();
    rr(ctx, x + 12, y - bob - 104, 24, 14, 6);
    fillStroke(ctx, '#c9962e', 1.6);
    ctx.fillStyle = '#2a1a10';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AI', x + 24, y - bob - 94);
    ctx.restore();
  }
  // active chef: a soft ring at the feet
  if (chef.active) {
    ctx.save();
    ell(ctx, x, y + 3, 26, 8);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = 'rgba(238,194,94,0.85)';
    ctx.stroke();
    ctx.restore();
  }
}

// A seated guest at a dining table: hair, shirt, and a face that follows
// their patience — smile, flat, or annoyed with a sweat drop.
export function drawGuest(ctx, look, x, y, mood, t) {
  shadow(ctx, x, y + 20, 15, 4.5, 0.2);
  // shirt / shoulders
  rr(ctx, x - 13, y + 4, 26, 18, 7);
  fillStroke(ctx, look.shirt, 2);
  // head
  circ(ctx, x, y - 6, 11.5);
  fillStroke(ctx, look.skin, 2.2);
  // hair by style
  ctx.fillStyle = look.hair;
  if (look.hairStyle === 'bun') {
    ctx.beginPath();
    ctx.arc(x, y - 11, 11, Math.PI * 1.05, Math.PI * 1.95);
    ctx.closePath();
    ctx.fill();
    circ(ctx, x, y - 21, 4.6);
    ctx.fill();
  } else if (look.hairStyle === 'crop') {
    ctx.beginPath();
    ctx.arc(x, y - 9, 11.2, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(x, y - 8, 11.6, Math.PI * 0.95, Math.PI * 2.05);
    ctx.quadraticCurveTo(x + 12, y + 4, x + 8, y + 6);
    ctx.lineTo(x - 8, y + 6);
    ctx.quadraticCurveTo(x - 12, y + 4, x - 11, y - 8);
    ctx.closePath();
    ctx.fill();
  }
  // face by mood
  ctx.fillStyle = INK;
  ell(ctx, x - 4, y - 6, 1.4, 1.9); ctx.fill();
  ell(ctx, x + 4, y - 6, 1.4, 1.9); ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'happy') ctx.arc(x, y - 2, 4.4, 0.2 * Math.PI, 0.8 * Math.PI);
  else if (mood === 'annoyed') ctx.arc(x, y + 3.4, 3.8, 1.2 * Math.PI, 1.8 * Math.PI);
  else { ctx.moveTo(x - 3, y + 1); ctx.lineTo(x + 3, y + 1); }
  ctx.stroke();
  if (mood === 'annoyed') {
    // brows slant + a sweat drop
    ctx.beginPath(); ctx.moveTo(x - 7, y - 11); ctx.lineTo(x - 2, y - 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 7, y - 11); ctx.lineTo(x + 2, y - 9); ctx.stroke();
    ctx.fillStyle = '#7ab5d6';
    ell(ctx, x + 12.5, y - 8 + Math.sin(t * 3) * 1, 1.8, 2.6);
    ctx.fill();
  }
}
