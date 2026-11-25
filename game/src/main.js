// main.js — the game loop, the start/end wiring, and the demo states the
// screenshots are taken from. A demo state (?shot=cover|rush|serve|end)
// builds one frozen, readable moment of the game so the screenshots show
// the kitchen, the order board, a dish mid-assembly, the timer and a plate
// ready to serve — exactly what the bounty asks the screenshots to show.

import { SoundEngine } from "./audio.js";
import { attachInput } from "./input.js";
import { endShift, newGame, spawnTicket, startShift, updateGame } from "./kitchen.js";
import { RECIPES, RECIPE_BY_ID, INGREDIENT_BY_ID } from "./recipes.js";
import { VIEW_H, VIEW_W, renderGame } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const sound = new SoundEngine();
const state = newGame();
state.mouse = { x: 640, y: 360 };

function beginShift() {
  sound.ensure();
  startShift(state);
  sound.startMelody(false);
}

function restartShift() {
  sound.ensure();
  sound.stopMelody();
  sound.stopSizzle();
  startShift(state);
  sound.startMelody(false);
}

attachInput(canvas, state, sound, beginShift, restartShift);

document.getElementById("start-btn").addEventListener("click", () => {
  sound.ensure();
  beginShift();
});
document.getElementById("again-btn").addEventListener("click", () => {
  sound.ensure();
  restartShift();
});
document.getElementById("mute-btn").addEventListener("click", () => {
  sound.ensure();
  sound.toggleMute();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.frozen) updateGame(state, dt, sound);
  renderGame(ctx, state, now / 1000, sound.muted);
  requestAnimationFrame(frame);
}

// --- Demo states for screenshots -------------------------------------------
// Each one stages a real game state (real tickets, real stations, real
// plate contents) and then freezes the clock so the shot is stable.

function demoCover() {
  startShift(state);
  state.timeLeft = 134;
  state.coins = 46;
  state.stars = 9;
  state.served = 4;
  state.combo = 3;
  state.tickets = [];
  spawnTicket(state, "stall-special");
  spawnTicket(state, "chicken-noodle");
  spawnTicket(state, "beef-fire");
  state.tickets[0].patience = 34;
  state.tickets[1].patience = 42;
  state.tickets[2].patience = 22;
  // Noodles boiling, chicken searing, greens chopped and waiting.
  state.stations.pot.job = { ingredientId: "noodles", total: 3, left: 1.2, done: false, burnt: false, overdone: 0 };
  state.stations.wok.job = { ingredientId: "chicken", total: 4, left: 2.4, done: false, burnt: false, overdone: 0 };
  state.stations.board.job = { ingredientId: "greens", total: 2, left: 0, done: true, burnt: false, overdone: 0 };
  state.shelf = ["egg", "chilli"];
  // The plate holds the Stall Special minus the chicken still on the wok:
  // a dish mid-assembly, one step from ready.
  state.plate = ["noodles", "broth", "egg", "chilli", "greens"];
  state.mouse = { x: 640, y: 560 };
  state.frozen = true;
}

function demoRush() {
  startShift(state);
  state.timeLeft = 28;
  state.coins = 118;
  state.stars = 24;
  state.served = 11;
  state.combo = 5;
  state.bestCombo = 5;
  state.tickets = [];
  spawnTicket(state, "stall-special");
  spawnTicket(state, "beef-fire");
  spawnTicket(state, "veggie-noodle");
  spawnTicket(state, "chicken-noodle");
  state.tickets[0].patience = 9;
  state.tickets[1].patience = 31;
  state.tickets[2].patience = 18;
  state.tickets[3].patience = 40;
  state.stations.pot.job = { ingredientId: "noodles", total: 3, left: 0, done: true, burnt: false, overdone: 0 };
  state.stations.wok.job = { ingredientId: "beef", total: 4.5, left: 1.8, done: false, burnt: false, overdone: 0 };
  state.shelf = ["broth", "chilli"];
  state.plate = ["noodles", "broth", "beef", "chilli"];
  state.message = "EMBER RUSH — double stars!";
  state.messageUntil = 99999;
  state.rushAnnounced = true;
  state.mouse = { x: 1025, y: 260 };
  state.frozen = true;
}

function demoServe() {
  startShift(state);
  state.timeLeft = 96;
  state.coins = 72;
  state.stars = 15;
  state.served = 6;
  state.combo = 2;
  state.tickets = [];
  spawnTicket(state, "chicken-noodle");
  spawnTicket(state, "noodle-soup");
  state.tickets[0].patience = 40;
  state.tickets[1].patience = 44;
  state.plate = ["noodles", "broth", "chicken"];
  state.effects = [{ kind: "serve", text: "+14 coins  ★★★", x: 640, y: 455, life: 1.4 }];
  state.message = "Served! Ember Chicken Noodle";
  state.messageUntil = 99999;
  state.mouse = { x: 1025, y: 260 };
  state.frozen = true;
}

function demoEnd() {
  startShift(state);
  state.screen = "end";
  state.timeLeft = 0;
  state.coins = 164;
  state.stars = 31;
  state.served = 13;
  state.lost = 1;
  state.hearts = 2;
  state.bestCombo = 6;
  state.combo = 0;
  state.endReason = "The shift is over — the lanterns go out.";
  state.frozen = true;
}

const params = new URLSearchParams(window.location.search);
const shot = params.get("shot");
if (shot === "cover") demoCover();
else if (shot === "rush") demoRush();
else if (shot === "serve") demoServe();
else if (shot === "end") demoEnd();

window.__game = { state, INGREDIENT_BY_ID, RECIPE_BY_ID, RECIPES };

requestAnimationFrame(frame);
