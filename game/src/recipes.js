// recipes.js — the ingredients, the dishes and the shape of a shift.
// Every dish is a different combination of the same eight ingredients, so the
// player learns one set of stations and then plans a route through them.

export const SHIFT_SECONDS = 180;

export const INGREDIENTS = [
  { id: "noodles", name: "Noodles", key: "1", station: "pot", seconds: 3.0, color: "#f2c94c", dark: "#b98a1d" },
  { id: "broth", name: "Broth", key: "2", station: "pot", seconds: 0.6, color: "#e07840", dark: "#9c4a1e" },
  { id: "chicken", name: "Chicken", key: "3", station: "wok", seconds: 4.0, color: "#e8a34c", dark: "#a86a1f" },
  { id: "beef", name: "Beef", key: "4", station: "wok", seconds: 4.5, color: "#a34d3a", dark: "#6e2f22" },
  { id: "egg", name: "Egg", key: "5", station: "wok", seconds: 2.5, color: "#fdf3d0", dark: "#d9b64a" },
  { id: "greens", name: "Greens", key: "6", station: "board", seconds: 2.0, color: "#5da24a", dark: "#38682c" },
  { id: "mushroom", name: "Mushroom", key: "7", station: "board", seconds: 2.0, color: "#d8c9a8", dark: "#8a7a56" },
  { id: "chilli", name: "Chilli", key: "8", station: "board", seconds: 1.5, color: "#d93a2b", dark: "#8f1d12" },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((item) => [item.id, item]),
);

export const RECIPES = [
  {
    id: "noodle-soup",
    name: "Plain Noodle Soup",
    needs: ["noodles", "broth"],
    price: 8,
    blurb: "The stall classic. Fast, warm, honest.",
  },
  {
    id: "chicken-noodle",
    name: "Ember Chicken Noodle",
    needs: ["noodles", "broth", "chicken"],
    price: 14,
    blurb: "Char-seared chicken over steaming noodles.",
  },
  {
    id: "veggie-noodle",
    name: "Garden Veggie Noodle",
    needs: ["noodles", "broth", "greens", "mushroom"],
    price: 16,
    blurb: "Crisp greens and earthy mushroom, no meat.",
  },
  {
    id: "beef-fire",
    name: "Fire Beef Noodle",
    needs: ["noodles", "broth", "beef", "chilli"],
    price: 18,
    blurb: "Slow beef, hot chilli. Not for the shy.",
  },
  {
    id: "stall-special",
    name: "Stall Special",
    needs: ["noodles", "broth", "chicken", "egg", "chilli", "greens"],
    price: 26,
    blurb: "Everything the stall does, in one bowl.",
  },
];

export const RECIPE_BY_ID = Object.fromEntries(
  RECIPES.map((recipe) => [recipe.id, recipe]),
);

// Waves shape the shift: calm opening, busy middle, Ember Rush at the end.
export const WAVES = [
  { until: 120, maxTickets: 2, spawnEvery: 14, patience: 50, pool: 2, label: "Opening" },
  { until: 60, maxTickets: 3, spawnEvery: 11, patience: 45, pool: 4, label: "Lunch crowd" },
  { until: 0, maxTickets: 4, spawnEvery: 8, patience: 38, pool: 5, label: "EMBER RUSH" },
];

export function waveFor(timeLeft) {
  for (const wave of WAVES) {
    if (timeLeft > wave.until) return wave;
  }
  return WAVES[WAVES.length - 1];
}

export function isRush(timeLeft) {
  return timeLeft <= 60;
}

// Stars for a serve: the more patience left on the ticket, the more stars.
export function starsForTicket(ticket) {
  const left = ticket.patience / ticket.patienceMax;
  if (left > 0.6) return 3;
  if (left > 0.3) return 2;
  return 1;
}

export function recipeMatches(plateIds, recipe) {
  if (plateIds.length !== recipe.needs.length) return false;
  const sortedPlate = [...plateIds].sort();
  const sortedNeeds = [...recipe.needs].sort();
  return sortedPlate.every((id, i) => id === sortedNeeds[i]);
}
