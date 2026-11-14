// 畫背景與介面元件。每個函式的參數是 (g, z)，z 是縮放倍率。
import { PALETTE as P } from './palette.js';
import { FIELD, GAME_W, GAME_H } from '../config.js';

const OUT = 3;

export function background(g, z) {
  // 底色
  g.fillStyle(P.cream, 1);
  g.fillRect(0, 0, GAME_W * z, GAME_H * z);
  // 上方的條紋遮陽棚
  const stripe = 40;
  for (let i = 0; i * stripe < GAME_W; i++) {
    g.fillStyle(i % 2 ? P.cream : P.sakura, 1);
    g.fillRect(i * stripe * z, 0, stripe * z, 46 * z);
    g.fillCircle((i * stripe + stripe / 2) * z, 46 * z, (stripe / 2) * z);
  }
  g.lineStyle(OUT * z, P.outline, 0.25);
  g.lineBetween(0, 1 * z, GAME_W * z, 1 * z);
  // 戰場的格子地板
  for (let r = 0; r < FIELD.lanes; r++) {
    for (let c = 0; c < FIELD.cols; c++) {
      const light = (r + c) % 2 === 0;
      g.fillStyle(light ? P.dough : P.wood, 1);
      g.fillRect((FIELD.left + c * FIELD.cell) * z, (FIELD.top + r * FIELD.cell) * z, FIELD.cell * z, FIELD.cell * z);
    }
  }
  // 右邊的門口
  g.fillStyle(P.wood, 0.6);
  g.fillRect(FIELD.right * z, FIELD.top * z, (GAME_W - FIELD.right) * z, FIELD.lanes * FIELD.cell * z);
  g.fillStyle(P.matcha, 0.35);
  for (let r = 0; r < FIELD.lanes; r++) {
    g.fillCircle(930 * z, (FIELD.top + 40 + r * 80) * z, 10 * z);
  }
  // 左邊的櫃台
  g.fillStyle(P.caramel, 1);
  g.fillRoundedRect(8 * z, (FIELD.top + 4) * z, 104 * z, (FIELD.lanes * FIELD.cell - 8) * z, 14 * z);
  g.fillStyle(P.wood, 1);
  g.fillRoundedRect(8 * z, (FIELD.top + 4) * z, 104 * z, 20 * z, { tl: 14 * z, tr: 14 * z, bl: 0, br: 0 });
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeRoundedRect(8 * z, (FIELD.top + 4) * z, 104 * z, (FIELD.lanes * FIELD.cell - 8) * z, 14 * z);
  // 櫃台上的小蒸籠
  for (let r = 0; r < FIELD.lanes; r++) {
    steamerSmall(g, z, 60, FIELD.top + 44 + r * 80, 26);
  }
  // 下方的卡片列底板
  g.fillStyle(P.wood, 1);
  g.fillRect(0, (FIELD.top + FIELD.lanes * FIELD.cell) * z, GAME_W * z, 80 * z);
  g.lineStyle(OUT * z, P.outline, 0.4);
  g.lineBetween(0, 460 * z, GAME_W * z, 460 * z);
}

/** 小蒸籠，(cx, cy) 是中心，w 是寬度（遊戲像素）。 */
export function steamerSmall(g, z, cx, cy, w) {
  const h = w * 0.62;
  g.fillStyle(P.wood, 1);
  g.fillRoundedRect((cx - w / 2) * z, (cy - h / 2) * z, w * z, h * z, (h / 3) * z);
  g.lineStyle(2.2 * z, P.outline, 1);
  g.strokeRoundedRect((cx - w / 2) * z, (cy - h / 2) * z, w * z, h * z, (h / 3) * z);
  g.lineBetween((cx - w / 2) * z, cy * z, (cx + w / 2) * z, cy * z);
  g.fillStyle(P.caramel, 1);
  g.fillCircle(cx * z, (cy - h / 2) * z, (w / 9) * z);
}

export function button(g, z, w, h, color = P.sakura) {
  g.fillStyle(P.outline, 0.2);
  g.fillRoundedRect(2 * z, 6 * z, (w - 4) * z, (h - 6) * z, (h / 2.4) * z);
  g.fillStyle(color, 1);
  g.fillRoundedRect(2 * z, 2 * z, (w - 4) * z, (h - 8) * z, (h / 2.4) * z);
  g.fillStyle(P.cream, 0.45);
  g.fillRoundedRect(10 * z, 6 * z, (w - 20) * z, ((h - 8) / 3) * z, (h / 6) * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeRoundedRect(2 * z, 2 * z, (w - 4) * z, (h - 8) * z, (h / 2.4) * z);
}

export function panel(g, z, w, h) {
  g.fillStyle(P.outline, 0.15);
  g.fillRoundedRect(4 * z, 8 * z, (w - 8) * z, (h - 10) * z, 28 * z);
  g.fillStyle(P.cream, 1);
  g.fillRoundedRect(4 * z, 4 * z, (w - 8) * z, (h - 10) * z, 28 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeRoundedRect(4 * z, 4 * z, (w - 8) * z, (h - 10) * z, 28 * z);
}

export function card(g, z, w, h, selected) {
  g.fillStyle(selected ? P.sakura : P.cream, 1);
  g.fillRoundedRect(2 * z, 2 * z, (w - 4) * z, (h - 4) * z, 12 * z);
  g.lineStyle((selected ? 4 : OUT) * z, P.outline, 1);
  g.strokeRoundedRect(2 * z, 2 * z, (w - 4) * z, (h - 4) * z, 12 * z);
}

export function steamIcon(g, z, s) {
  const u = (s / 40) * z;
  g.fillStyle(P.cream, 1);
  for (const [x, y, r] of [[14, 24, 9], [24, 18, 11], [30, 26, 8]]) g.fillCircle(x * u, y * u, r * u);
  g.lineStyle(2.4 * u, P.outline, 1);
  for (const [x, y, r] of [[14, 24, 9], [24, 18, 11], [30, 26, 8]]) g.strokeCircle(x * u, y * u, r * u);
  g.fillStyle(P.cream, 1);
  g.fillRect(8 * u, 22 * u, 26 * u, 10 * u);
}

export function lockIcon(g, z, s) {
  const u = (s / 40) * z;
  g.lineStyle(4 * u, P.outline, 1);
  g.beginPath();
  g.arc(20 * u, 18 * u, 8 * u, Math.PI, 0);
  g.strokePath();
  g.fillStyle(P.caramel, 1);
  g.fillRoundedRect(8 * u, 17 * u, 24 * u, 18 * u, 4 * u);
  g.lineStyle(2.4 * u, P.outline, 1);
  g.strokeRoundedRect(8 * u, 17 * u, 24 * u, 18 * u, 4 * u);
}

export function checkIcon(g, z, s) {
  const u = (s / 40) * z;
  g.fillStyle(P.matcha, 1);
  g.fillCircle(20 * u, 20 * u, 17 * u);
  g.lineStyle(2.4 * u, P.outline, 1);
  g.strokeCircle(20 * u, 20 * u, 17 * u);
  g.lineStyle(4 * u, P.cream, 1);
  g.beginPath();
  g.moveTo(12 * u, 20 * u);
  g.lineTo(18 * u, 26 * u);
  g.lineTo(28 * u, 14 * u);
  g.strokePath();
}

export function gachaMachine(g, z) {
  // 260×340
  g.fillStyle(P.outline, 0.15);
  g.fillEllipse(130 * z, 330 * z, 220 * z, 18 * z);
  // 底座
  g.fillStyle(P.sakura, 1);
  g.fillRoundedRect(40 * z, 170 * z, 180 * z, 150 * z, 26 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeRoundedRect(40 * z, 170 * z, 180 * z, 150 * z, 26 * z);
  // 出口
  g.fillStyle(P.outline, 0.8);
  g.fillRoundedRect(96 * z, 262 * z, 68 * z, 40 * z, 14 * z);
  // 玻璃球
  g.fillStyle(P.cream, 1);
  g.fillCircle(130 * z, 110 * z, 92 * z);
  const caps = [[96, 120, P.yolk], [140, 140, P.matcha], [170, 100, P.taro], [110, 80, P.chili],
    [150, 70, P.sakura], [80, 150, P.caramel], [130, 170, P.taro], [180, 145, P.yolk]];
  for (const [x, y, c] of caps) {
    g.fillStyle(c, 1);
    g.fillCircle(x * z, y * z, 18 * z);
    g.lineStyle(2.2 * z, P.outline, 1);
    g.strokeCircle(x * z, y * z, 18 * z);
  }
  g.fillStyle(P.cream, 0.6);
  g.fillEllipse(88 * z, 60 * z, 40 * z, 22 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeCircle(130 * z, 110 * z, 92 * z);
}

export function gachaHandle(g, z) {
  // 64×64
  g.fillStyle(P.cream, 1);
  g.fillCircle(32 * z, 32 * z, 26 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeCircle(32 * z, 32 * z, 26 * z);
  g.fillStyle(P.yolk, 1);
  g.fillRoundedRect(10 * z, 26 * z, 44 * z, 12 * z, 6 * z);
  g.strokeRoundedRect(10 * z, 26 * z, 44 * z, 12 * z, 6 * z);
}

export function capsuleHalf(g, z, top) {
  // 80×40
  const color = top ? P.sakura : P.cream;
  g.fillStyle(color, 1);
  if (top) {
    g.slice(40 * z, 40 * z, 36 * z, Math.PI, 0, false);
  } else {
    g.slice(40 * z, 0, 36 * z, 0, Math.PI, false);
  }
  g.fillPath();
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokePath();
}

export function steamerBig(g, z) {
  // 300×170：蒸籠本體
  g.fillStyle(P.outline, 0.15);
  g.fillEllipse(150 * z, 160 * z, 280 * z, 18 * z);
  g.fillStyle(P.wood, 1);
  g.fillRoundedRect(10 * z, 40 * z, 280 * z, 116 * z, 30 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeRoundedRect(10 * z, 40 * z, 280 * z, 116 * z, 30 * z);
  g.lineStyle(2 * z, P.outline, 0.5);
  for (let x = 40; x < 290; x += 30) g.lineBetween(x * z, 46 * z, x * z, 150 * z);
  g.fillStyle(P.caramel, 1);
  g.fillRect(10 * z, 90 * z, 280 * z, 12 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeRect(10 * z, 90 * z, 280 * z, 12 * z);
}

export function steamerLid(g, z) {
  // 300×90
  g.fillStyle(P.caramel, 1);
  g.fillEllipse(150 * z, 60 * z, 290 * z, 56 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeEllipse(150 * z, 60 * z, 290 * z, 56 * z);
  g.fillStyle(P.wood, 1);
  g.fillEllipse(150 * z, 50 * z, 250 * z, 36 * z);
  g.fillStyle(P.caramel, 1);
  g.fillRoundedRect(130 * z, 20 * z, 40 * z, 22 * z, 10 * z);
  g.strokeRoundedRect(130 * z, 20 * z, 40 * z, 22 * z, 10 * z);
}

export function slot(g, z, s) {
  g.fillStyle(P.cream, 1);
  g.fillCircle((s / 2) * z, (s / 2) * z, (s / 2 - 3) * z);
  g.lineStyle(OUT * z, P.outline, 0.6);
  g.strokeCircle((s / 2) * z, (s / 2) * z, (s / 2 - 3) * z);
}

// ---- 粒子與特效 ----

export function fxSteam(g, z) {
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(16 * z, 16 * z, 14 * z);
}

export function fxDot(g, z, color, r) {
  g.fillStyle(color, 1);
  g.fillCircle(r * z, r * z, r * z);
}

export function fxStar(g, z) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 6 : 13;
    pts.push({ x: (14 + Math.cos(a) * r) * z, y: (14 + Math.sin(a) * r) * z });
  }
  g.fillStyle(P.yolk, 1);
  g.fillPoints(pts, true);
  g.lineStyle(2 * z, P.outline, 1);
  g.strokePoints(pts, true);
}

export function fxHeart(g, z) {
  g.fillStyle(P.sakura, 1);
  g.fillCircle(9 * z, 10 * z, 7 * z);
  g.fillCircle(19 * z, 10 * z, 7 * z);
  g.fillTriangle(2.4 * z, 12.5 * z, 25.6 * z, 12.5 * z, 14 * z, 26 * z);
}

export function fxConfetti(g, z) {
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 10 * z, 16 * z);
}

export function fxBullet(g, z) {
  g.fillStyle(P.caramel, 1);
  g.fillCircle(12 * z, 12 * z, 9 * z);
  g.lineStyle(2.4 * z, P.outline, 1);
  g.strokeCircle(12 * z, 12 * z, 9 * z);
  g.fillStyle(P.cream, 0.7);
  g.fillCircle(9 * z, 9 * z, 3 * z);
}

export function fxPuddle(g, z) {
  g.fillStyle(P.yolk, 0.75);
  g.fillEllipse(40 * z, 14 * z, 80 * z, 26 * z);
  g.fillStyle(P.cream, 0.5);
  g.fillEllipse(28 * z, 10 * z, 18 * z, 6 * z);
}

export function fxRing(g, z) {
  g.lineStyle(6 * z, P.yolk, 1);
  g.strokeCircle(50 * z, 50 * z, 46 * z);
}

// ---- 彎路地圖 ----

function awning(g, z) {
  const stripe = 40;
  for (let i = 0; i * stripe < GAME_W; i++) {
    g.fillStyle(i % 2 ? P.cream : P.sakura, 1);
    g.fillRect(i * stripe * z, 0, stripe * z, 46 * z);
    g.fillCircle((i * stripe + stripe / 2) * z, 46 * z, (stripe / 2) * z);
  }
}

function table(g, z, x, y) {
  g.fillStyle(P.outline, 0.15);
  g.fillEllipse(x * z, (y + 26) * z, 56 * z, 10 * z);
  g.fillStyle(P.caramel, 1);
  g.fillRoundedRect((x - 26) * z, (y - 14) * z, 52 * z, 30 * z, 10 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeRoundedRect((x - 26) * z, (y - 14) * z, 52 * z, 30 * z, 10 * z);
  g.fillStyle(P.cream, 1);
  g.fillRoundedRect((x - 10) * z, (y - 24) * z, 14 * z, 14 * z, 4 * z);
  g.strokeRoundedRect((x - 10) * z, (y - 24) * z, 14 * z, 14 * z, 4 * z);
  g.fillStyle(P.yolk, 1);
  g.fillCircle((x + 12) * z, (y - 18) * z, 6 * z);
  g.strokeCircle((x + 12) * z, (y - 18) * z, 6 * z);
}

function plant(g, z, x, y) {
  g.fillStyle(P.outline, 0.15);
  g.fillEllipse(x * z, (y + 26) * z, 40 * z, 8 * z);
  g.fillStyle(P.matcha, 1);
  for (const [dx, dy, r] of [[-10, -12, 12], [10, -14, 12], [0, -24, 13]]) g.fillCircle((x + dx) * z, (y + dy) * z, r * z);
  g.lineStyle(2.4 * z, P.outline, 1);
  for (const [dx, dy, r] of [[-10, -12, 12], [10, -14, 12], [0, -24, 13]]) g.strokeCircle((x + dx) * z, (y + dy) * z, r * z);
  g.fillStyle(P.chili, 1);
  g.fillRoundedRect((x - 14) * z, (y - 2) * z, 28 * z, 26 * z, 6 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeRoundedRect((x - 14) * z, (y - 2) * z, 28 * z, 26 * z, 6 * z);
}

/**
 * @param {Object} level
 * @param {{pts: {x:number,y:number}[], cells: Map}} path
 */
export function map(g, z, level, path) {
  g.fillStyle(P.cream, 1);
  g.fillRect(0, 0, GAME_W * z, GAME_H * z);
  awning(g, z);
  // 草地
  for (let r = 0; r < FIELD.rows; r++) {
    for (let c = 0; c < FIELD.cols; c++) {
      g.fillStyle(P.matcha, (r + c) % 2 ? 0.28 : 0.4);
      g.fillRect((FIELD.left + c * FIELD.cell) * z, (FIELD.top + r * FIELD.cell) * z, FIELD.cell * z, FIELD.cell * z);
    }
  }
  // 路：外框再填色，轉角畫圓讓它圓滑
  const pts = path.pts.map((p) => ({ x: Math.min(p.x, GAME_W + 40), y: p.y }));
  for (const [w, color] of [[70, P.caramel], [60, P.wood]]) {
    g.fillStyle(color, 1);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const x0 = Math.min(a.x, b.x) - w / 2;
      const y0 = Math.min(a.y, b.y) - w / 2;
      g.fillRect(x0 * z, y0 * z, (Math.abs(b.x - a.x) + w) * z, (Math.abs(b.y - a.y) + w) * z);
    }
  }
  // 路上的小腳印
  g.fillStyle(P.caramel, 0.5);
  for (let d = 30; d < path.length; d += 40) {
    const p = path.posAt(d);
    if (p.x > GAME_W || p.x < FIELD.left) continue;
    g.fillCircle(p.x * z, p.y * z, 3 * z);
  }
  // 裝飾（不能放包子的格子）
  (level.blocked || []).forEach(([c, r], i) => {
    const x = FIELD.left + 40 + c * FIELD.cell;
    const y = FIELD.top + 40 + r * FIELD.cell;
    if (i % 2) plant(g, z, x, y); else table(g, z, x, y);
  });
  // 左邊的櫃台
  g.fillStyle(P.caramel, 1);
  g.fillRoundedRect(4 * z, (FIELD.top + 2) * z, 72 * z, (FIELD.rows * FIELD.cell - 4) * z, 14 * z);
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokeRoundedRect(4 * z, (FIELD.top + 2) * z, 72 * z, (FIELD.rows * FIELD.cell - 4) * z, 14 * z);
  const end = path.pts[path.pts.length - 1];
  for (let r = 0; r < FIELD.rows; r++) {
    const y = FIELD.top + 40 + r * FIELD.cell;
    if (Math.abs(y - end.y) < 1) {
      // 門口
      g.fillStyle(P.cream, 1);
      g.fillRoundedRect(10 * z, (y - 30) * z, 60 * z, 60 * z, 12 * z);
      g.lineStyle(OUT * z, P.outline, 1);
      g.strokeRoundedRect(10 * z, (y - 30) * z, 60 * z, 60 * z, 12 * z);
    } else {
      steamerSmall(g, z, 40, y, 40);
    }
  }
  // 下方卡片列
  g.fillStyle(P.wood, 1);
  g.fillRect(0, (FIELD.top + FIELD.rows * FIELD.cell) * z, GAME_W * z, 80 * z);
  g.lineStyle(OUT * z, P.outline, 0.4);
  g.lineBetween(0, 460 * z, GAME_W * z, 460 * z);
}

export function star(g, z, s, on) {
  const u = (s / 28) * z;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 6 : 13;
    pts.push({ x: (14 + Math.cos(a) * r) * u, y: (14 + Math.sin(a) * r) * u });
  }
  g.fillStyle(on ? P.yolk : P.wood, 1);
  g.fillPoints(pts, true);
  g.lineStyle(2 * u, P.outline, on ? 1 : 0.5);
  g.strokePoints(pts, true);
}

export function crownIcon(g, z) {
  const pts = [[2, 20], [2, 6], [9, 13], [16, 2], [23, 13], [30, 6], [30, 20]].map(([x, y]) => ({ x: x * z, y: (y + 2) * z }));
  g.fillStyle(P.yolk, 1);
  g.fillPoints(pts, true);
  g.lineStyle(2.2 * z, P.outline, 1);
  g.strokePoints(pts, true);
  g.fillStyle(P.chili, 1);
  g.fillCircle(16 * z, 16 * z, 2.6 * z);
}

export function ticket(g, z) {
  g.fillStyle(P.sakura, 1);
  g.fillRoundedRect(2 * z, 8 * z, 40 * z, 26 * z, 6 * z);
  g.lineStyle(2.4 * z, P.outline, 1);
  g.strokeRoundedRect(2 * z, 8 * z, 40 * z, 26 * z, 6 * z);
  g.lineStyle(2 * z, P.outline, 0.5);
  g.lineBetween(14 * z, 11 * z, 14 * z, 31 * z);
  g.fillStyle(P.cream, 1);
  g.fillCircle(28 * z, 21 * z, 6 * z);
}

export function heartIcon(g, z, on) {
  g.fillStyle(on ? P.chili : P.wood, 1);
  g.fillCircle(9 * z, 10 * z, 7 * z);
  g.fillCircle(19 * z, 10 * z, 7 * z);
  g.fillTriangle(2.4 * z, 12.5 * z, 25.6 * z, 12.5 * z, 14 * z, 26 * z);
}

export const RARITY_COLOR = { base: P.cream, common: P.cream, rare: P.taro, super: P.yolk, fusion: P.matcha };

export function rarityCard(g, z, w, h, rarity, selected) {
  const color = RARITY_COLOR[rarity] ?? P.cream;
  g.fillStyle(selected ? P.sakura : color, 1);
  g.fillRoundedRect(2 * z, 2 * z, (w - 4) * z, (h - 4) * z, 12 * z);
  if (!selected && rarity !== 'base' && rarity !== 'common') {
    g.fillStyle(P.cream, 0.55);
    g.fillRoundedRect(7 * z, 7 * z, (w - 14) * z, (h - 14) * z, 9 * z);
  }
  g.lineStyle((selected ? 4 : OUT) * z, P.outline, 1);
  g.strokeRoundedRect(2 * z, 2 * z, (w - 4) * z, (h - 4) * z, 12 * z);
}

export function capsuleHalfColor(g, z, top, color) {
  g.fillStyle(top ? color : P.cream, 1);
  if (top) g.slice(40 * z, 40 * z, 36 * z, Math.PI, 0, false);
  else g.slice(40 * z, 0, 36 * z, 0, Math.PI, false);
  g.fillPath();
  g.lineStyle(OUT * z, P.outline, 1);
  g.strokePath();
}
