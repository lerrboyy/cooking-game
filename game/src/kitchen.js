// kitchen.js — the state of the stall and every rule that moves it:
// orders arriving, stations cooking, the plate filling, the bell serving,
// patience running out and the shift ending.

import {
  INGREDIENT_BY_ID,
  RECIPES,
  RECIPE_BY_ID,
  SHIFT_SECONDS,
  recipeMatches,
  starsForTicket,
  waveFor,
  isRush,
} from "./recipes.js";

let ticketCounter = 0;

export function newGame() {
  return {
    screen: "start", // start | playing | paused | end
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    stars: 0,
    served: 0,
    lost: 0,
    hearts: 3,
    combo: 0,
    bestCombo: 0,
    tickets: [],
    spawnIn: 2,
    stations: {
      board: { job: null },
      pot: { job: null },
      wok: { job: null },
    },
    shelf: [], // finished components waiting to be plated (max 4)
    plate: [], // ingredient ids on the assembly plate
    held: null, // ingredient id in the cook's hand, or a shelf component
    heldFromShelf: false,
    effects: [], // floating +coins / stars / messages
    message: "",
    messageUntil: 0,
    elapsed: 0,
    rushAnnounced: false,
    lastTickSecond: -1,
  };
}

export function startShift(state) {
  const fresh = newGame();
  Object.assign(state, fresh, { screen: "playing" });
  spawnTicket(state);
  spawnTicket(state);
}

export function spawnTicket(state, recipeId = null) {
  const wave = waveFor(state.timeLeft);
  const pool = RECIPES.slice(0, wave.pool);
  const recipe = recipeId
    ? RECIPE_BY_ID[recipeId]
    : pool[Math.floor(Math.random() * pool.length)];
  ticketCounter += 1;
  state.tickets.push({
    id: ticketCounter,
    recipeId: recipe.id,
    patience: wave.patience,
    patienceMax: wave.patience,
    bornAt: state.elapsed,
  });
  return state.tickets[state.tickets.length - 1];
}

export function matchingTicket(state) {
  for (const ticket of state.tickets) {
    const recipe = RECIPE_BY_ID[ticket.recipeId];
    if (recipeMatches(state.plate, recipe)) return ticket;
  }
  return null;
}

export function plateIsFull(state) {
  const match = matchingTicket(state);
  return match !== null;
}

export function pickIngredient(state, ingredientId) {
  if (state.screen !== "playing") return false;
  if (state.held) return false;
  state.held = ingredientId;
  state.heldFromShelf = false;
  return true;
}

export function pickFromShelf(state, index) {
  if (state.screen !== "playing") return false;
  if (state.held || index < 0 || index >= state.shelf.length) return false;
  state.held = state.shelf[index];
  state.heldFromShelf = true;
  state.shelf.splice(index, 1);
  return true;
}

export function putHeldBack(state) {
  if (!state.held) return false;
  if (state.heldFromShelf && state.shelf.length < 4) {
    state.shelf.push(state.held);
  }
  state.held = null;
  state.heldFromShelf = false;
  return true;
}

// The cook's hand meets a station: the ingredient starts cooking there,
// or a finished component is collected from it.
export function useStation(state, stationId) {
  if (state.screen !== "playing") return "idle";
  const station = state.stations[stationId];
  if (!station) return "idle";
  if (station.job) {
    if (station.job.done) {
      if (state.shelf.length >= 4) return "shelf-full";
      state.shelf.push(station.job.ingredientId);
      station.job = null;
      return "collected";
    }
    return "busy";
  }
  if (!state.held) return "empty-hands";
  const ingredient = INGREDIENT_BY_ID[state.held];
  if (!ingredient || ingredient.station !== stationId) return "wrong-station";
  station.job = {
    ingredientId: ingredient.id,
    total: ingredient.seconds,
    left: ingredient.seconds,
    done: false,
    burnt: false,
    overdone: 0,
  };
  state.held = null;
  state.heldFromShelf = false;
  return "cooking";
}

export function addHeldToPlate(state) {
  if (state.screen !== "playing") return "idle";
  if (!state.held) return "empty-hands";
  if (state.plate.length >= 6) return "plate-full";
  state.plate.push(state.held);
  state.held = null;
  state.heldFromShelf = false;
  return matchingTicket(state) ? "ready" : "plated";
}

export function binPlate(state) {
  if (state.screen !== "playing") return false;
  if (state.plate.length === 0 && !state.held) return false;
  state.plate = [];
  if (state.heldFromShelf) {
    // a shelf component in hand goes back, a raw one is binned
    state.held = null;
    state.heldFromShelf = false;
  } else if (state.held) {
    state.held = null;
    state.heldFromShelf = false;
  }
  return true;
}

export function binStation(state, stationId) {
  const station = state.stations[stationId];
  if (!station || !station.job) return false;
  station.job = null;
  return true;
}

export function ringBell(state, sound) {
  if (state.screen !== "playing") return null;
  const ticket = matchingTicket(state);
  if (!ticket) return null;
  const recipe = RECIPE_BY_ID[ticket.recipeId];
  const stars = starsForTicket(ticket);
  const rush = isRush(state.timeLeft);
  const earnedStars = rush ? stars * 2 : stars;
  const comboBonus = state.combo >= 2 ? Math.floor(recipe.price * 0.25 * state.combo) : 0;
  const coins = recipe.price + comboBonus;
  state.coins += coins;
  state.stars += earnedStars;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.tickets = state.tickets.filter((t) => t.id !== ticket.id);
  state.plate = [];
  state.effects.push({
    kind: "serve",
    text: `+${coins} coins  ${"★".repeat(Math.min(3, earnedStars))}`,
    x: 640,
    y: 455,
    life: 1.4,
  });
  if (sound) sound.coin();
  return { ticket, recipe, coins, stars: earnedStars };
}

export function loseTicket(state, ticket) {
  state.tickets = state.tickets.filter((t) => t.id !== ticket.id);
  state.lost += 1;
  state.hearts -= 1;
  state.combo = 0;
  state.effects.push({
    kind: "lost",
    text: "Customer walked out!",
    x: 640,
    y: 455,
    life: 1.4,
  });
  if (state.hearts <= 0) endShift(state, "The stall lost too many customers.");
}

export function endShift(state, reason = "") {
  state.screen = "end";
  state.endReason = reason;
  state.stars = Math.max(state.stars, 0);
}

export function updateGame(state, dt, sound) {
  if (state.screen !== "playing") return;
  state.elapsed += dt;
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endShift(state, "The shift is over — the lanterns go out.");
    if (sound) {
      sound.stopSizzle();
      sound.stopMelody();
      sound.fanfare();
    }
    return;
  }

  const rush = isRush(state.timeLeft);
  if (rush && !state.rushAnnounced) {
    state.rushAnnounced = true;
    state.message = "EMBER RUSH — double stars!";
    state.messageUntil = state.elapsed + 2.5;
    if (sound) sound.setRush(true);
  }

  const wholeSecond = Math.ceil(state.timeLeft);
  if (wholeSecond !== state.lastTickSecond) {
    state.lastTickSecond = wholeSecond;
    if (wholeSecond <= 10 && sound) sound.tick();
  }

  // New orders arrive on the wave's rhythm.
  const wave = waveFor(state.timeLeft);
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    state.spawnIn = wave.spawnEvery;
    if (state.tickets.length < wave.maxTickets) spawnTicket(state);
  }

  // Patience drains; an empty bar loses the customer.
  for (const ticket of [...state.tickets]) {
    ticket.patience -= dt;
    if (ticket.patience <= 0) {
      if (sound) sound.thud();
      loseTicket(state, ticket);
      if (state.screen !== "playing") return;
    }
  }

  // Stations cook; a finished job left too long burns.
  let anyCooking = false;
  for (const stationId of Object.keys(state.stations)) {
    const job = state.stations[stationId].job;
    if (!job) continue;
    if (!job.done) {
      anyCooking = true;
      job.left -= dt;
      if (job.left <= 0) {
        job.done = true;
        job.left = 0;
        if (sound && stationId === "pot") sound.bubble();
      }
    } else if (!job.burnt) {
      job.overdone += dt;
      if (job.overdone > 6) {
        job.burnt = true;
        if (sound) sound.burn();
        state.effects.push({
          kind: "burnt",
          text: "Burnt! Click the station, then the bin.",
          x: 640,
          y: 455,
          life: 1.6,
        });
      }
    }
  }
  if (sound) {
    if (anyCooking || state.stations.wok.job) sound.startSizzle();
    else sound.stopSizzle();
  }

  // Floating effects fade.
  for (const effect of state.effects) effect.life -= dt;
  state.effects = state.effects.filter((effect) => effect.life > 0);
}
