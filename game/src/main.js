// Trattoria Sole — boot and input: wires the keyboard and mouse to the
// world, runs the service loop, and stages the screenshot scenes when the
// page is opened with ?shot=start|play|end&seed=1.

import { STATIONS, VIEW } from './config.js';
import { createWorld, interact, moveChef, result, ringBell, setRoute, startService, update } from './world.js';
import { drawScene } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
canvas.width = VIEW.w;
canvas.height = VIEW.h;

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? 1) || 1;
const shot = params.get('shot');

let world = createWorld(seed);
world.paused = false;

const keys = new Set();

function activeChef() {
  return world.chefs.find((c) => c.active);
}

function swapChef() {
  for (const c of world.chefs) c.active = !c.active;
  world.narration = `${activeChef().name} takes the line.`;
}

function pressEnter() {
  if (world.phase === 'title') startService(world);
  else if (world.phase === 'done') {
    world = createWorld(seed);
    world.paused = false;
    startService(world);
  }
}

addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k === ' ' ? ' ' : e.key.toLowerCase()) || e.key === 'Tab') {
    e.preventDefault();
  }
  if (e.key === 'Tab' || k === 'q') { if (!e.repeat && world.phase === 'service') swapChef(); return; }
  if (e.key === 'Enter') { pressEnter(); return; }
  if (k === ' ') {
    if (!e.repeat) {
      if (world.phase !== 'service') pressEnter();
      else interact(world, activeChef());
    }
    return;
  }
  if (k === 'f') { if (!e.repeat && world.phase === 'service') ringBell(world); return; }
  if (k === 'p' || e.key === 'Escape') { if (world.phase === 'service') world.paused = !world.paused; return; }
  keys.add(k);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * VIEW.w;
  const y = ((e.clientY - rect.top) / rect.height) * VIEW.h;
  if (world.phase !== 'service') { pressEnter(); return; }
  // click a counter: the active chef walks the chalk route and works it
  let best = null;
  let bestD = 84;
  for (const s of STATIONS) {
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < bestD) { bestD = d; best = s; }
  }
  const chef = activeChef();
  if (best) {
    setRoute(world, chef, best);
    world.narration = `${chef.name} heads for the ${best.label}.`;
  } else {
    chef.route = { x, y, stationId: null };
  }
});

function fitCanvas() {
  const scale = Math.min(innerWidth / VIEW.w, innerHeight / VIEW.h);
  canvas.style.width = `${Math.floor(VIEW.w * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.h * scale)}px`;
}
addEventListener('resize', fitCanvas);
fitCanvas();

// Screenshot mode: stage one frozen, fully-dressed moment and hold it.
if (shot) {
  stageShot(world, shot);
  drawScene(ctx, world, 1.35, world.phase === 'done' ? result(world) : null);
  window.__shotReady = true;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (!world.paused) {
      if (world.phase === 'service') {
        const chef = activeChef();
        let dx = 0;
        let dy = 0;
        if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
        if (keys.has('d') || keys.has('arrowright')) dx += 1;
        if (keys.has('w') || keys.has('arrowup')) dy -= 1;
        if (keys.has('s') || keys.has('arrowdown')) dy += 1;
        if (dx || dy) {
          chef.route = null;
          moveChef(world, chef, dx, dy, dt);
        } else {
          chef.moving = false;
        }
      }
      update(world, dt);
    }
    drawScene(ctx, world, now / 1000, world.phase === 'done' ? result(world) : null);
    if (status && status.textContent !== world.narration) status.textContent = world.narration;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
