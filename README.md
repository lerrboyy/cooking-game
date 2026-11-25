# Ember & Noodle — a night-market cooking game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/lerrboyy/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/lerrboyy/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Make.fun entry — "Make the best cooking game"** ($250, 10 places paid).
Play it: open `game/index.html` in a desktop browser. No network, no build step.

## The game

You are the lone cook at **Ember & Noodle**, a night-market noodle stall.
Customers pin paper order tickets to the order board; you cook each dish to
order, plate it, ring the bell, and serve before patience runs out. One shift
lasts three minutes, and the last minute is the Ember Rush — double stars.

- **8 ingredients** on the counter (noodles, broth, chicken, beef, egg, greens,
  mushroom, chilli) and **5 recipes** that combine them in different ways,
  from Plain Noodle Soup to the six-ingredient Stall Special.
- **3 stations** that cook in real time — chopping board, broth pot, charcoal
  wok — so a good cook starts the noodles, chops while they boil, and sears
  the meat last.
- **Order board** with patience bars, a **shift timer**, hearts for lost
  customers, combos, coins and stars. Burnt food must be binned; a wrong
  plate must be cleared and rebuilt.
- **Mouse + keyboard**: click everything, or press 1-8 to grab, Q/W/E for the
  stations, Space to ring the bell, B to bin, P to pause, M to mute.
- **All art drawn in code** on canvas and **all sound synthesised** with the
  Web Audio API — no image or audio files, no network requests.

## Layout

- `main.ts` — copies `game/` and `screenshots/` to the output directory and
  writes `dossier.json` with the kit's `buildDossier`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `game/index.html` — page shell, canvas, HUD, start/end overlays.
- `game/src/recipes.js` — ingredients, recipes, waves, scoring.
- `game/src/kitchen.js` — game state: orders, stations, plate, serving.
- `game/src/render.js` — all canvas drawing: kitchen, board, food, effects.
- `game/src/input.js` — mouse + keyboard, hit-testing the zones.
- `game/src/audio.js` — synthesised sounds and the rush melody.
- `game/src/main.js` — game loop and the frozen demo states for screenshots.
- `screenshots/` — four real renders of the game's own code: cover (full
  kitchen, order board, dish mid-assembly, timer, ready plate), Ember Rush,
  serving moment, end screen.

## Play-test

Served a full Ember Chicken Noodle in a real Playwright run (0 console
errors): noodles boiled, broth ladled, chicken seared, plated, bell rung,
+14 coins. `main.ts` runs twice with byte-identical output.

## License

MIT — Copyright (c) 2026 lerrboyy.
