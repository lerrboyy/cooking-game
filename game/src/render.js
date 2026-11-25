// render.js — every pixel of the stall, drawn in code on one canvas:
// the lantern-lit kitchen, the order board, the tickets, the stations,
// the food, the steam and the floating coins. No image files anywhere.

import { INGREDIENT_BY_ID, RECIPE_BY_ID, isRush } from "./recipes.js";

export const VIEW_W = 1280;
export const VIEW_H = 720;

// Every clickable zone, in canvas coordinates. input.js hit-tests these.
export const LAYOUT = {
  startButton: { x: 490, y: 520, w: 300, h: 64 },
  againButton: { x: 490, y: 560, w: 300, h: 64 },
  helpButton: { x: 1120, y: 668, w: 136, h: 36 },
  muteButton: { x: 24, y: 12, w: 40, h: 34 },
  board: { x: 280, y: 192, w: 190, h: 138 },
  pot: { x: 492, y: 192, w: 190, h: 138 },
  wok: { x: 704, y: 192, w: 190, h: 138 },
  plate: { x: 480, y: 470, w: 320, h: 170 },
  bell: { x: 950, y: 192, w: 150, h: 138 },
  bin: { x: 1120, y: 192, w: 136, h: 138 },
  shelf: { x: 280, y: 352, w: 614, h: 96 },
  ingredients: { x: 24, y: 192, w: 228, h: 448 },
};

const BASKETS = [
  { id: "noodles", x: 36, y: 224 },
  { id: "broth", x: 140, y: 224 },
  { id: "chicken", x: 36, y: 328 },
  { id: "beef", x: 140, y: 328 },
  { id: "egg", x: 36, y: 432 },
  { id: "greens", x: 140, y: 432 },
  { id: "mushroom", x: 36, y: 536 },
  { id: "chilli", x: 140, y: 536 },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmtTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function steam(ctx, x, y, t, scale = 1) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 3; i++) {
    const rise = ((t * 18 + i * 22) % 66) * scale;
    const sway = Math.sin((t + i * 1.7) * 2) * 6 * scale;
    ctx.beginPath();
    ctx.arc(x + sway, y - rise, (5 + i * 2) * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// One small vector drawing per ingredient, so the food looks cooked, not typed.
export function drawIngredientIcon(ctx, id, cx, cy, size) {
  const r = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(2, size * 0.06);
  if (id === "noodles") {
    ctx.strokeStyle = "#f2c94c";
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      for (let x = -r; x <= r; x += 4) {
        const y = Math.sin(x * 0.55 + i * 1.4) * r * 0.28 + i * r * 0.32;
        if (x === -r) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (id === "broth") {
    ctx.fillStyle = "#e07840";
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r * 0.85, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#7a3b18";
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r * 0.85, 0, Math.PI);
    ctx.stroke();
    ctx.strokeStyle = "#f6b183";
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.55, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (id === "chicken") {
    ctx.fillStyle = "#e8a34c";
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.15, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fdf3d0";
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.beginPath();
    ctx.moveTo(r * 0.35, r * 0.3);
    ctx.lineTo(r * 0.85, r * 0.8);
    ctx.stroke();
    ctx.fillStyle = "#fdf3d0";
    ctx.beginPath();
    ctx.arc(r * 0.9, r * 0.85, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.62, r * 0.98, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "beef") {
    ctx.fillStyle = "#a34d3a";
    roundRect(ctx, -r * 0.85, -r * 0.7, r * 1.7, r * 1.4, r * 0.4);
    ctx.fill();
    ctx.strokeStyle = "#e8b4a4";
    ctx.lineWidth = Math.max(2, size * 0.05);
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.2);
    ctx.quadraticCurveTo(0, r * 0.2, r * 0.5, -r * 0.25);
    ctx.moveTo(-r * 0.4, r * 0.35);
    ctx.quadraticCurveTo(r * 0.1, r * 0.55, r * 0.45, r * 0.3);
    ctx.stroke();
  } else if (id === "egg") {
    ctx.fillStyle = "#fdf3d0";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.9, r * 0.75, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2a93b";
    ctx.beginPath();
    ctx.arc(r * 0.1, r * 0.05, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "greens") {
    ctx.fillStyle = "#5da24a";
    for (const [dx, dy, rot] of [[-0.35, 0.1, -0.6], [0.3, -0.2, 0.5], [0, 0.35, 0.1]]) {
      ctx.save();
      ctx.translate(dx * r, dy * r);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.55, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (id === "mushroom") {
    ctx.fillStyle = "#d8c9a8";
    roundRect(ctx, -r * 0.28, -r * 0.1, r * 0.56, r * 0.9, r * 0.2);
    ctx.fill();
    ctx.fillStyle = "#b98a5e";
    ctx.beginPath();
    ctx.arc(0, -r * 0.15, r * 0.85, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fdf3d0";
    for (const dx of [-0.45, 0, 0.45]) {
      ctx.beginPath();
      ctx.arc(dx * r, -r * 0.45, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === "chilli") {
    ctx.strokeStyle = "#d93a2b";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(4, size * 0.16);
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.7, Math.PI * 0.15, Math.PI * 1.05);
    ctx.stroke();
    ctx.strokeStyle = "#5da24a";
    ctx.lineWidth = Math.max(3, size * 0.1);
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.75);
    ctx.quadraticCurveTo(-r * 0.75, -r * 1.05, -r * 0.45, -r * 1.05);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTicket(ctx, ticket, x, y, w, h, t) {
  const recipe = RECIPE_BY_ID[ticket.recipeId];
  const frac = Math.max(0, ticket.patience / ticket.patienceMax);
  const urgent = frac < 0.35;
  ctx.save();
  if (urgent && Math.sin(t * 8) > 0) {
    ctx.shadowColor = "#ff5040";
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = "#fdf6e3";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#3a2a1a";
  ctx.font = "bold 15px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText(`#${ticket.id}  ${recipe.name}`, x + 10, y + 22);
  ctx.font = "12px Georgia, serif";
  ctx.fillStyle = "#6b543a";
  ctx.fillText(`$${recipe.price}`, x + 10, y + 40);
  recipe.needs.forEach((need, i) => {
    drawIngredientIcon(ctx, need, x + 24 + i * 34, y + 62, 26);
  });
  // Patience bar.
  ctx.fillStyle = "#e0d3b8";
  roundRect(ctx, x + 10, y + h - 18, w - 20, 10, 5);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? "#5da24a" : frac > 0.25 ? "#e8a34c" : "#d93a2b";
  if (frac > 0) {
    roundRect(ctx, x + 10, y + h - 18, (w - 20) * frac, 10, 5);
    ctx.fill();
  }
  ctx.restore();
}

function drawStation(ctx, state, stationId, zone, label, t) {
  const station = state.stations[stationId];
  const job = station.job;
  ctx.save();
  ctx.fillStyle = "#7a5230";
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.fill();
  ctx.fillStyle = "#8f6238";
  roundRect(ctx, zone.x + 6, zone.y + 6, zone.w - 12, zone.h - 6, 9);
  ctx.fill();
  ctx.fillStyle = "#fdf6e3";
  ctx.font = "bold 13px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(label, zone.x + zone.w / 2, zone.y + 20);

  if (stationId === "board") {
    ctx.fillStyle = "#c89b62";
    roundRect(ctx, zone.x + 25, zone.y + 34, zone.w - 50, 62, 8);
    ctx.fill();
    ctx.strokeStyle = "#8a6a42";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (stationId === "pot") {
    ctx.fillStyle = "#3c3c46";
    ctx.beginPath();
    ctx.arc(zone.x + zone.w / 2, zone.y + 66, 52, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#e07840";
    ctx.beginPath();
    ctx.ellipse(zone.x + zone.w / 2, zone.y + 66, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!job) steam(ctx, zone.x + zone.w / 2, zone.y + 56, t, 0.7);
  } else {
    ctx.fillStyle = "#2e2a26";
    ctx.beginPath();
    ctx.arc(zone.x + zone.w / 2, zone.y + 70, 54, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#ffb347";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(zone.x + zone.w / 2, zone.y + 74, 58, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  if (job) {
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + 66;
    if (job.burnt) {
      ctx.fillStyle = "#1c1c1c";
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff5040";
      ctx.font = "bold 13px Georgia, serif";
      ctx.fillText("BURNT!", cx, zone.y + zone.h - 12);
      steam(ctx, cx, cy - 10, t, 0.8);
    } else {
      drawIngredientIcon(ctx, job.ingredientId, cx, cy, 52);
      const frac = 1 - job.left / job.total;
      ctx.strokeStyle = "#fdf6e3";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      if (job.done) {
        ctx.fillStyle = "#ffd94d";
        ctx.font = "bold 15px Georgia, serif";
        ctx.fillText("READY ✓", cx, zone.y + zone.h - 12);
      }
    }
  } else {
    ctx.fillStyle = "#e8d9b8";
    ctx.font = "12px Georgia, serif";
    ctx.fillText("click an ingredient, then here", zone.x + zone.w / 2, zone.y + zone.h - 12);
  }
  ctx.restore();
}

function drawShelf(ctx, state) {
  const zone = LAYOUT.shelf;
  ctx.save();
  ctx.fillStyle = "#5d4023";
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 10);
  ctx.fill();
  ctx.fillStyle = "#fdf6e3";
  ctx.font = "bold 13px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("READY SHELF — click a dish part, then the plate", zone.x + 12, zone.y + 20);
  state.shelf.forEach((id, i) => {
    const cx = zone.x + 60 + i * 120;
    const cy = zone.y + 58;
    ctx.fillStyle = "#fdf6e3";
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    drawIngredientIcon(ctx, id, cx, cy, 46);
  });
  if (state.shelf.length === 0) {
    ctx.fillStyle = "#cbb287";
    ctx.font = "13px Georgia, serif";
    ctx.fillText("finished cooking lands here", zone.x + 200, zone.y + 62);
  }
  ctx.restore();
}

function drawPlate(ctx, state, t) {
  const zone = LAYOUT.plate;
  const ready = state.plate.length > 0 && state.tickets.some((ticket) =>
    RECIPE_BY_ID[ticket.recipeId].needs.length === state.plate.length &&
    [...state.plate].sort().join() === [...RECIPE_BY_ID[ticket.recipeId].needs].sort().join());
  ctx.save();
  if (ready) {
    ctx.shadowColor = "#ffd94d";
    ctx.shadowBlur = 24 + Math.sin(t * 5) * 8;
  }
  ctx.fillStyle = "#fdf6e3";
  ctx.beginPath();
  ctx.ellipse(zone.x + zone.w / 2, zone.y + zone.h / 2 + 8, 130, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#c9a86a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(zone.x + zone.w / 2, zone.y + zone.h / 2 + 8, 108, 48, 0, 0, Math.PI * 2);
  ctx.stroke();
  state.plate.forEach((id, i) => {
    const angle = (i / Math.max(1, state.plate.length)) * Math.PI * 2 - Math.PI / 2;
    const cx = zone.x + zone.w / 2 + Math.cos(angle) * 52;
    const cy = zone.y + zone.h / 2 + 8 + Math.sin(angle) * 24;
    drawIngredientIcon(ctx, id, cx, cy, 40);
  });
  if (state.plate.length === 0) {
    ctx.fillStyle = "#a88f66";
    ctx.font = "13px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("assembly plate — build the dish here", zone.x + zone.w / 2, zone.y + zone.h / 2 + 12);
  }
  ctx.fillStyle = ready ? "#2f7a1e" : "#cbb287";
  ctx.font = "bold 15px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(
    ready ? "★ READY TO SERVE — ring the bell! ★" : "ASSEMBLY PLATE",
    zone.x + zone.w / 2,
    zone.y + zone.h - 6,
  );
  ctx.restore();
}

function drawHud(ctx, state, muted) {
  ctx.save();
  ctx.fillStyle = "#241a12";
  ctx.fillRect(0, 0, VIEW_W, 58);
  ctx.fillStyle = "#ffd94d";
  ctx.font = "bold 22px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("🔥 Ember & Noodle", 76, 38);
  ctx.fillStyle = "#fdf6e3";
  ctx.font = "bold 16px Georgia, serif";
  ctx.fillText(`Coins  ${state.coins}`, 300, 37);
  ctx.fillText(`★ ${state.stars}`, 420, 37);
  ctx.fillText(`Served  ${state.served}`, 510, 37);
  ctx.fillStyle = "#ff8a7a";
  ctx.fillText("♥".repeat(Math.max(0, state.hearts)) + "♡".repeat(Math.max(0, 3 - state.hearts)), 630, 37);
  const rush = isRush(state.timeLeft);
  ctx.font = "bold 30px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillStyle = state.timeLeft <= 10 ? "#ff5040" : rush ? "#ffb347" : "#fdf6e3";
  ctx.fillText(fmtTime(state.timeLeft), 880, 40);
  ctx.font = "13px Georgia, serif";
  ctx.fillStyle = "#cbb287";
  ctx.fillText(rush ? "EMBER RUSH ×2 ★" : "shift timer", 880, 54);
  ctx.textAlign = "right";
  ctx.font = "bold 16px Georgia, serif";
  ctx.fillStyle = state.combo >= 2 ? "#ffd94d" : "#fdf6e3";
  ctx.fillText(state.combo >= 2 ? `COMBO ×${state.combo}` : "No combo yet", 1240, 37);
  ctx.fillStyle = muted ? "#ff8a7a" : "#cbb287";
  ctx.font = "13px Georgia, serif";
  ctx.fillText(muted ? "MUTED (M)" : "sound on (M)", 1240, 54);
  ctx.restore();
}

function drawBoard(ctx, state, t) {
  ctx.save();
  ctx.fillStyle = "#4a3220";
  roundRect(ctx, 24, 64, VIEW_W - 48, 108, 12);
  ctx.fill();
  ctx.fillStyle = "#fdf6e3";
  ctx.font = "bold 15px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("ORDER BOARD", 40, 88);
  ctx.font = "12px Georgia, serif";
  ctx.fillStyle = "#cbb287";
  ctx.fillText("match the plate, ring the bell", 40, 158);
  state.tickets.forEach((ticket, i) => {
    drawTicket(ctx, ticket, 240 + i * 252, 74, 238, 88, t);
  });
  if (state.tickets.length === 0) {
    ctx.fillStyle = "#cbb287";
    ctx.font = "14px Georgia, serif";
    ctx.fillText("No orders yet — the first customer is on their way…", 260, 122);
  }
  ctx.restore();
}

function drawIngredients(ctx, state) {
  const zone = LAYOUT.ingredients;
  ctx.save();
  ctx.fillStyle = "#4a3220";
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.fill();
  ctx.fillStyle = "#fdf6e3";
  ctx.font = "bold 14px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("INGREDIENTS", zone.x + 12, zone.y + 20);
  for (const basket of BASKETS) {
    const item = INGREDIENT_BY_ID[basket.id];
    const held = state.held === basket.id && !state.heldFromShelf;
    ctx.fillStyle = held ? "#ffd94d" : "#6b4a2a";
    roundRect(ctx, basket.x, basket.y, 92, 92, 10);
    ctx.fill();
    drawIngredientIcon(ctx, basket.id, basket.x + 46, basket.y + 38, 52);
    ctx.fillStyle = "#fdf6e3";
    ctx.font = "bold 12px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(item.name, basket.x + 46, basket.y + 72);
    ctx.fillStyle = "#cbb287";
    ctx.font = "11px Georgia, serif";
    ctx.fillText(`[${item.key}]`, basket.x + 46, basket.y + 88);
  }
  ctx.restore();
}

function drawBellAndBin(ctx, state, t) {
  const bell = LAYOUT.bell;
  const ready = state.plate.length > 0 && state.tickets.some((ticket) =>
    [...state.plate].sort().join() === [...RECIPE_BY_ID[ticket.recipeId].needs].sort().join());
  ctx.save();
  ctx.fillStyle = ready ? "#8a6d1f" : "#5d4023";
  roundRect(ctx, bell.x, bell.y, bell.w, bell.h, 12);
  ctx.fill();
  if (ready && Math.sin(t * 6) > 0) {
    ctx.shadowColor = "#ffd94d";
    ctx.shadowBlur = 20;
  }
  ctx.fillStyle = "#ffd94d";
  ctx.beginPath();
  ctx.arc(bell.x + bell.w / 2, bell.y + 62, 34, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(bell.x + bell.w / 2 - 40, bell.y + 62, 80, 8);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#3a2a1a";
  ctx.beginPath();
  ctx.arc(bell.x + bell.w / 2 + 30, bell.y + 82, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fdf6e3";
  ctx.font = "bold 14px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("SERVICE BELL", bell.x + bell.w / 2, bell.y + 116);
  ctx.font = "12px Georgia, serif";
  ctx.fillText("[Space]", bell.x + bell.w / 2, bell.y + 132 - 4);

  const bin = LAYOUT.bin;
  ctx.fillStyle = "#3c3c46";
  roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 12);
  ctx.fill();
  ctx.fillStyle = "#5a5a66";
  roundRect(ctx, bin.x + 28, bin.y + 34, 80, 66, 8);
  ctx.fill();
  ctx.fillStyle = "#fdf6e3";
  ctx.font = "bold 14px Georgia, serif";
  ctx.fillText("BIN", bin.x + bin.w / 2, bin.y + 116);
  ctx.font = "12px Georgia, serif";
  ctx.fillText("clear the plate [B]", bin.x + bin.w / 2, bin.y + 132 - 4);
  ctx.restore();
}

function drawEffects(ctx, state) {
  ctx.save();
  ctx.textAlign = "center";
  for (const effect of state.effects) {
    const alpha = Math.min(1, effect.life);
    ctx.globalAlpha = alpha;
    ctx.font = "bold 26px Georgia, serif";
    ctx.fillStyle = effect.kind === "lost" ? "#ff5040" : effect.kind === "burnt" ? "#ff8a3d" : "#ffd94d";
    ctx.fillText(effect.text, effect.x, effect.y - (1.4 - effect.life) * 40);
  }
  ctx.restore();
}

function drawStart(ctx, state) {
  ctx.save();
  ctx.fillStyle = "rgba(20, 12, 6, 0.82)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd94d";
  ctx.font = "bold 56px Georgia, serif";
  ctx.fillText("🔥 Ember & Noodle 🔥", VIEW_W / 2, 150);
  ctx.fillStyle = "#fdf6e3";
  ctx.font = "22px Georgia, serif";
  ctx.fillText("A night-market noodle stall. One cook. One rush. Three minutes.", VIEW_W / 2, 196);
  ctx.font = "16px Georgia, serif";
  ctx.fillStyle = "#e8d9b8";
  const lines = [
    "1 · Click an ingredient (or press 1-8), then click its station to cook it.",
    "2 · Click a finished part on the Ready Shelf, then click the plate to build the dish.",
    "3 · When the plate matches a ticket, ring the bell (click it, or press Space).",
    "Burnt food? Click the station, then the bin. Lost customers cost a heart — three ends the shift.",
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 250 + i * 30));
  ctx.fillStyle = "#ffd94d";
  roundRect(ctx, LAYOUT.startButton.x, LAYOUT.startButton.y, LAYOUT.startButton.w, LAYOUT.startButton.h, 12);
  ctx.fill();
  ctx.fillStyle = "#3a2a1a";
  ctx.font = "bold 24px Georgia, serif";
  ctx.fillText("START SHIFT  ▶", VIEW_W / 2, LAYOUT.startButton.y + 41);
  ctx.fillStyle = "#cbb287";
  ctx.font = "13px Georgia, serif";
  ctx.fillText("Mouse + keyboard · sound starts on your first click · M mutes", VIEW_W / 2, 620);
  ctx.restore();
}

function drawEnd(ctx, state) {
  ctx.save();
  ctx.fillStyle = "rgba(20, 12, 6, 0.85)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd94d";
  ctx.font = "bold 44px Georgia, serif";
  ctx.fillText(state.hearts <= 0 ? "The stall went quiet…" : "Shift complete!", VIEW_W / 2, 140);
  ctx.fillStyle = "#fdf6e3";
  ctx.font = "20px Georgia, serif";
  ctx.fillText(state.endReason || "", VIEW_W / 2, 180);
  const stars = state.served >= 12 ? 3 : state.served >= 8 ? 2 : state.served >= 4 ? 1 : 0;
  ctx.font = "44px Georgia, serif";
  ctx.fillStyle = "#ffd94d";
  ctx.fillText("★".repeat(stars) + "☆".repeat(3 - stars), VIEW_W / 2, 250);
  ctx.font = "20px Georgia, serif";
  ctx.fillStyle = "#fdf6e3";
  ctx.fillText(`Coins earned: ${state.coins}      Dishes served: ${state.served}`, VIEW_W / 2, 310);
  ctx.fillText(`Stars: ${state.stars}      Best combo: ×${state.bestCombo}      Customers lost: ${state.lost}`, VIEW_W / 2, 348);
  ctx.fillStyle = "#ffd94d";
  roundRect(ctx, LAYOUT.againButton.x, LAYOUT.againButton.y, LAYOUT.againButton.w, LAYOUT.againButton.h, 12);
  ctx.fill();
  ctx.fillStyle = "#3a2a1a";
  ctx.font = "bold 24px Georgia, serif";
  ctx.fillText("PLAY AGAIN  ↻", VIEW_W / 2, LAYOUT.againButton.y + 41);
  ctx.restore();
}

export function renderGame(ctx, state, t, muted) {
  // Warm night-market backdrop.
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, "#2b1d12");
  grad.addColorStop(1, "#1a120a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffd94d";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(120 + i * 260, 30, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  drawHud(ctx, state, muted);
  drawBoard(ctx, state, t);
  drawIngredients(ctx, state);
  drawStation(ctx, state, "board", LAYOUT.board, "CHOPPING BOARD", t);
  drawStation(ctx, state, "pot", LAYOUT.pot, "BROTH POT", t);
  drawStation(ctx, state, "wok", LAYOUT.wok, "CHARCOAL WOK", t);
  drawShelf(ctx, state);
  drawPlate(ctx, state, t);
  drawBellAndBin(ctx, state, t);

  // Hint strip.
  ctx.save();
  ctx.fillStyle = "#cbb287";
  ctx.font = "13px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("1-8 grab · Q board · W pot · E wok · Space bell · B bin · P pause · H help", 24, 700);
  ctx.textAlign = "right";
  ctx.fillText("Ember & Noodle — a make.fun cooking game", VIEW_W - 24, 700);
  ctx.restore();

  if (state.message && state.elapsed < state.messageUntil) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 30px Georgia, serif";
    ctx.fillStyle = "#ffb347";
    ctx.fillText(state.message, VIEW_W / 2, 458);
    ctx.restore();
  }

  drawEffects(ctx, state);

  // The cook's hand: the held ingredient follows the mouse.
  if (state.held && state.mouse) {
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#fdf6e3";
    ctx.beginPath();
    ctx.arc(state.mouse.x, state.mouse.y, 26, 0, Math.PI * 2);
    ctx.fill();
    drawIngredientIcon(ctx, state.held, state.mouse.x, state.mouse.y, 36);
    ctx.restore();
  }

  if (state.screen === "start") drawStart(ctx, state);
  if (state.screen === "paused") {
    ctx.save();
    ctx.fillStyle = "rgba(20, 12, 6, 0.7)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#fdf6e3";
    ctx.font = "bold 40px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Paused — press P to keep cooking", VIEW_W / 2, VIEW_H / 2);
    ctx.restore();
  }
  if (state.screen === "end") drawEnd(ctx, state);
}
