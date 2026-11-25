// input.js — mouse and keyboard for the stall. Everything is clickable;
// the keyboard is a shortcut for speed, never a requirement.

import { LAYOUT } from "./render.js";
import { INGREDIENTS } from "./recipes.js";
import {
  addHeldToPlate,
  binPlate,
  binStation,
  pickFromShelf,
  pickIngredient,
  ringBell,
  useStation,
} from "./kitchen.js";

function inside(x, y, zone) {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
}

function basketAt(x, y) {
  const rows = [
    ["noodles", "broth"],
    ["chicken", "beef"],
    ["egg", "greens"],
    ["mushroom", "chilli"],
  ];
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < 2; col++) {
      const bx = 36 + col * 104;
      const by = 224 + row * 104;
      if (x >= bx && x <= bx + 92 && y >= by && y <= by + 92) return rows[row][col];
    }
  }
  return null;
}

function shelfIndexAt(x, y) {
  const zone = LAYOUT.shelf;
  if (!inside(x, y, zone)) return -1;
  for (let i = 0; i < 4; i++) {
    const cx = zone.x + 60 + i * 120;
    if (Math.abs(x - cx) < 46 && Math.abs(y - (zone.y + 58)) < 46) return i;
  }
  return -1;
}

export function attachInput(canvas, state, sound, onStart, onRestart) {
  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  canvas.addEventListener("mousemove", (event) => {
    const pos = toCanvas(event);
    state.mouse = pos;
  });

  canvas.addEventListener("click", (event) => {
    sound.ensure();
    const { x, y } = toCanvas(event);
    state.mouse = { x, y };
    handleClick(state, sound, x, y, onStart, onRestart);
  });

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === "m") {
      sound.ensure();
      sound.toggleMute();
      return;
    }
    if (state.screen === "start" && (key === "enter" || key === " ")) {
      event.preventDefault();
      onStart();
      return;
    }
    if (state.screen === "end" && (key === "enter" || key === "r")) {
      onRestart();
      return;
    }
    if (state.screen !== "playing") return;
    if (key === "p") {
      state.screen = "paused";
      return;
    }
    if (key === " ") {
      event.preventDefault();
      ringBell(state, sound);
      return;
    }
    if (key === "b") {
      binPlate(state);
      return;
    }
    if (key === "q") {
      useStation(state, "board");
      return;
    }
    if (key === "w") {
      useStation(state, "pot");
      return;
    }
    if (key === "e") {
      useStation(state, "wok");
      return;
    }
    const ingredient = INGREDIENTS.find((item) => item.key === key);
    if (ingredient) pickIngredient(state, ingredient.id);
  });

  // P unpauses from the paused overlay.
  window.addEventListener("keydown", (event) => {
    if (state.screen === "paused" && event.key.toLowerCase() === "p") {
      state.screen = "playing";
    }
  });
}

function handleClick(state, sound, x, y, onStart, onRestart) {
  if (state.screen === "start") {
    if (inside(x, y, LAYOUT.startButton)) onStart();
    return;
  }
  if (state.screen === "end") {
    if (inside(x, y, LAYOUT.againButton)) onRestart();
    return;
  }
  if (state.screen === "paused") return;
  if (inside(x, y, LAYOUT.muteButton)) {
    sound.toggleMute();
    return;
  }

  // A burnt station: first click clears it to the bin.
  for (const stationId of ["board", "pot", "wok"]) {
    const job = state.stations[stationId].job;
    if (job && job.burnt && inside(x, y, LAYOUT[stationId])) {
      binStation(state, stationId);
      return;
    }
  }

  const basket = basketAt(x, y);
  if (basket) {
    if (pickIngredient(state, basket)) sound.pickup();
    return;
  }
  if (inside(x, y, LAYOUT.board)) {
    const result = useStation(state, "board");
    if (result === "cooking") sound.chop();
    else if (result === "collected") sound.place();
    return;
  }
  if (inside(x, y, LAYOUT.pot)) {
    const result = useStation(state, "pot");
    if (result === "cooking") sound.bubble();
    else if (result === "collected") sound.place();
    return;
  }
  if (inside(x, y, LAYOUT.wok)) {
    const result = useStation(state, "wok");
    if (result === "collected") sound.place();
    return;
  }
  const shelfIndex = shelfIndexAt(x, y);
  if (shelfIndex >= 0) {
    if (pickFromShelf(state, shelfIndex)) sound.pickup();
    return;
  }
  if (inside(x, y, LAYOUT.plate)) {
    const result = addHeldToPlate(state);
    if (result === "ready") {
      sound.ding();
      state.message = "Ready! Ring the bell!";
      state.messageUntil = state.elapsed + 1.5;
    } else if (result === "plated") {
      sound.place();
    }
    return;
  }
  if (inside(x, y, LAYOUT.bell)) {
    ringBell(state, sound);
    return;
  }
  if (inside(x, y, LAYOUT.bin)) {
    binPlate(state);
  }
}
