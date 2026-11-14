// 畫敵人。朝左走，所以臉在左邊。座標以 100×100 為基準。
import { PALETTE as P } from './palette.js';

const OUT = 3;

function eyes(g, u, x1, x2, y, face, light) {
  // 大眼睛：深色身體用淺色眼白
  for (const x of [x1, x2]) {
    if (x === null) continue;
    g.fillStyle(light ? P.cream : P.outline, 1);
    g.fillCircle(x * u, y * u, 4.2 * u);
    if (light) {
      g.fillStyle(P.outline, 1);
      g.fillCircle((x - 0.8) * u, (y + 0.5) * u, 2.6 * u);
    }
    if (face !== 'sleepy') {
      g.fillStyle(P.cream, 1);
      g.fillCircle((x - 1.6) * u, (y - 1.6) * u, 1.2 * u);
    }
  }
}

function blush(g, u, x, y) {
  g.fillStyle(P.blush, 0.85);
  g.fillEllipse(x * u, y * u, 9 * u, 5 * u);
}

function smirk(g, u, x, y) {
  // 淘氣的小嘴
  g.lineStyle(2 * u, P.outline, 1);
  g.beginPath();
  g.arc(x * u, y * u, 3.5 * u, 0.15 * Math.PI, 0.75 * Math.PI);
  g.strokePath();
}

function shadow(g, u, y = 90) {
  g.fillStyle(P.outline, 0.15);
  g.fillEllipse(52 * u, y * u, 60 * u, 10 * u);
}

function ant(g, look, u, frame) {
  shadow(g, u);
  const legOff = frame ? 4 : -4;
  g.lineStyle(2.6 * u, P.outline, 1);
  for (const lx of [42, 54, 64]) {
    g.beginPath();
    g.moveTo(lx * u, 64 * u);
    g.lineTo((lx + legOff) * u, 84 * u);
    g.strokePath();
  }
  // 觸角
  g.beginPath();
  g.moveTo(28 * u, 44 * u);
  g.lineTo(20 * u, 28 * u);
  g.moveTo(34 * u, 44 * u);
  g.lineTo(36 * u, 27 * u);
  g.strokePath();
  g.fillStyle(P.chili, 1);
  g.fillCircle(20 * u, 27 * u, 3 * u);
  g.fillCircle(36 * u, 26 * u, 3 * u);
  const c = P[look.color];
  g.fillStyle(c, 1);
  g.fillCircle(74 * u, 60 * u, 16 * u);
  g.fillCircle(53 * u, 62 * u, 10 * u);
  g.fillCircle(32 * u, 56 * u, 15 * u);
  eyes(g, u, 26, 37, 54, look.face, true);
  blush(g, u, 24, 63);
  g.fillStyle(P.cream, 0.4);
  g.fillEllipse(70 * u, 54 * u, 10 * u, 6 * u);
}

function mouse(g, look, u, frame) {
  shadow(g, u);
  // 尾巴
  g.lineStyle(3 * u, P.sakura, 1);
  g.beginPath();
  g.moveTo(82 * u, 70 * u);
  g.lineTo(92 * u, 60 * u);
  g.lineTo(96 * u, 66 * u);
  g.strokePath();
  // 腳
  g.fillStyle(P.sakura, 1);
  g.fillCircle((36 + (frame ? 4 : 0)) * u, 84 * u, 5 * u);
  g.fillCircle((66 - (frame ? 4 : 0)) * u, 84 * u, 5 * u);
  const c = P[look.color];
  // 身體
  g.fillStyle(c, 1);
  g.fillEllipse(55 * u, 64 * u, 60 * u, 40 * u);
  g.lineStyle(OUT * u, P.outline, 1);
  g.strokeEllipse(55 * u, 64 * u, 60 * u, 40 * u);
  // 耳朵
  for (const [x, y] of [[34, 36], [52, 34]]) {
    g.fillStyle(c, 1);
    g.fillCircle(x * u, y * u, 10 * u);
    g.lineStyle(OUT * u, P.outline, 1);
    g.strokeCircle(x * u, y * u, 10 * u);
    g.fillStyle(P.sakura, 1);
    g.fillCircle(x * u, y * u, 5.5 * u);
  }
  // 頭
  g.fillStyle(c, 1);
  g.fillCircle(36 * u, 56 * u, 18 * u);
  g.lineStyle(OUT * u, P.outline, 1);
  g.strokeCircle(36 * u, 56 * u, 18 * u);
  g.fillStyle(P.sakura, 1);
  g.fillCircle(19 * u, 60 * u, 4 * u);
  eyes(g, u, 29, 41, 52, look.face, true);
  blush(g, u, 27, 63);
  smirk(g, u, 26, 64);
}

function roach(g, look, u, frame) {
  shadow(g, u);
  const legOff = frame ? 5 : -5;
  g.lineStyle(2.4 * u, P.outline, 1);
  for (const lx of [40, 54, 68]) {
    g.beginPath();
    g.moveTo(lx * u, 68 * u);
    g.lineTo((lx + legOff) * u, 84 * u);
    g.strokePath();
  }
  // 長觸角
  g.beginPath();
  g.moveTo(26 * u, 54 * u);
  g.lineTo(6 * u, 34 * u);
  g.moveTo(28 * u, 50 * u);
  g.lineTo(16 * u, 24 * u);
  g.strokePath();
  const c = P[look.color];
  g.fillStyle(c, 1);
  g.fillEllipse(58 * u, 64 * u, 58 * u, 34 * u);
  g.lineStyle(OUT * u, P.outline, 1);
  g.strokeEllipse(58 * u, 64 * u, 58 * u, 34 * u);
  // 翅膀
  g.lineStyle(2 * u, P.outline, 0.6);
  g.beginPath();
  g.moveTo(44 * u, 52 * u);
  g.lineTo(84 * u, 66 * u);
  g.strokePath();
  g.fillStyle(P.cream, 0.35);
  g.fillEllipse(64 * u, 56 * u, 22 * u, 8 * u);
  // 頭
  g.fillStyle(P.outline, 1);
  g.fillCircle(31 * u, 62 * u, 12 * u);
  eyes(g, u, 26, 35, 60, look.face, true);
  blush(g, u, 25, 69);
}

function pigeon(g, look, u, frame) {
  g.fillStyle(P.outline, 0.12);
  g.fillEllipse(52 * u, 94 * u, 46 * u, 8 * u);
  const c = P[look.color];
  // 尾巴
  g.fillStyle(P.charcoal, 1);
  g.fillTriangle(76 * u, 52 * u, 96 * u, 44 * u, 94 * u, 60 * u);
  // 身體
  g.fillStyle(c, 1);
  g.fillEllipse(56 * u, 54 * u, 52 * u, 40 * u);
  g.lineStyle(OUT * u, P.outline, 1);
  g.strokeEllipse(56 * u, 54 * u, 52 * u, 40 * u);
  // 頭
  g.fillStyle(c, 1);
  g.fillCircle(34 * u, 40 * u, 15 * u);
  g.lineStyle(OUT * u, P.outline, 1);
  g.strokeCircle(34 * u, 40 * u, 15 * u);
  g.fillStyle(P.matcha, 0.7);
  g.fillEllipse(38 * u, 54 * u, 16 * u, 6 * u);
  // 嘴
  g.fillStyle(P.yolk, 1);
  g.fillTriangle(20 * u, 38 * u, 20 * u, 46 * u, 11 * u, 42 * u);
  // 翅膀（兩格動畫）
  g.fillStyle(P.charcoal, 0.85);
  if (frame) g.fillEllipse(62 * u, 34 * u, 30 * u, 14 * u);
  else g.fillEllipse(62 * u, 60 * u, 30 * u, 14 * u);
  // 腳
  g.lineStyle(2.4 * u, P.chili, 1);
  g.beginPath();
  g.moveTo(50 * u, 72 * u);
  g.lineTo(48 * u, 80 * u);
  g.moveTo(60 * u, 72 * u);
  g.lineTo(60 * u, 80 * u);
  g.strokePath();
  eyes(g, u, 29, null, 37, look.face, false);
  blush(g, u, 34, 47);
}

function ladybug(g, look, u, frame) {
  shadow(g, u);
  const legOff = frame ? 4 : -4;
  g.lineStyle(2.4 * u, P.outline, 1);
  for (const lx of [44, 56, 68]) {
    g.beginPath();
    g.moveTo(lx * u, 72 * u);
    g.lineTo((lx + legOff) * u, 84 * u);
    g.strokePath();
  }
  // 殼
  g.fillStyle(P[look.color], 1);
  g.fillEllipse(58 * u, 58 * u, 58 * u, 48 * u);
  g.lineStyle(OUT * u, P.outline, 1);
  g.strokeEllipse(58 * u, 58 * u, 58 * u, 48 * u);
  g.lineBetween(58 * u, 35 * u, 58 * u, 82 * u);
  g.fillStyle(P.outline, 1);
  for (const [x, y, r] of [[46, 50, 5], [70, 50, 5], [46, 68, 4], [70, 68, 4]]) g.fillCircle(x * u, y * u, r * u);
  g.fillStyle(P.cream, 0.5);
  g.fillEllipse(50 * u, 42 * u, 12 * u, 6 * u);
  // 頭
  g.fillStyle(P.outline, 1);
  g.fillCircle(30 * u, 60 * u, 13 * u);
  eyes(g, u, 25, 34, 58, look.face, true);
  blush(g, u, 23, 67);
}

function snail(g, look, u, frame) {
  shadow(g, u);
  const stretch = frame ? 3 : 0;
  // 身體
  g.fillStyle(P.wood, 1);
  g.fillRoundedRect((14 - stretch) * u, 64 * u, (74 + stretch) * u, 20 * u, 10 * u);
  g.lineStyle(OUT * u, P.outline, 1);
  g.strokeRoundedRect((14 - stretch) * u, 64 * u, (74 + stretch) * u, 20 * u, 10 * u);
  // 觸角
  g.lineStyle(2.6 * u, P.outline, 1);
  g.lineBetween((22 - stretch) * u, 66 * u, (16 - stretch) * u, 46 * u);
  g.lineBetween((30 - stretch) * u, 66 * u, (30 - stretch) * u, 46 * u);
  g.fillStyle(P.outline, 1);
  g.fillCircle((16 - stretch) * u, 45 * u, 3.5 * u);
  g.fillCircle((30 - stretch) * u, 45 * u, 3.5 * u);
  // 殼（漩渦）
  g.fillStyle(P[look.color], 1);
  g.fillCircle(60 * u, 50 * u, 26 * u);
  g.lineStyle(OUT * u, P.outline, 1);
  g.strokeCircle(60 * u, 50 * u, 26 * u);
  g.lineStyle(2.6 * u, P.outline, 0.7);
  g.beginPath();
  g.arc(60 * u, 50 * u, 16 * u, 0, Math.PI * 1.6);
  g.strokePath();
  g.beginPath();
  g.arc(60 * u, 50 * u, 7 * u, Math.PI, Math.PI * 2.6);
  g.strokePath();
  eyes(g, u, (22 - stretch), null, 73, look.face, false);
  blush(g, u, 30 - stretch, 78);
}

function crown(g, u, cx, cy) {
  g.fillStyle(P.yolk, 1);
  g.fillPoints([
    { x: (cx - 14) * u, y: (cy + 6) * u }, { x: (cx - 14) * u, y: (cy - 8) * u },
    { x: (cx - 7) * u, y: (cy - 1) * u }, { x: cx * u, y: (cy - 12) * u },
    { x: (cx + 7) * u, y: (cy - 1) * u }, { x: (cx + 14) * u, y: (cy - 8) * u },
    { x: (cx + 14) * u, y: (cy + 6) * u },
  ], true);
  g.lineStyle(2.4 * u, P.outline, 1);
  g.strokePoints([
    { x: (cx - 14) * u, y: (cy + 6) * u }, { x: (cx - 14) * u, y: (cy - 8) * u },
    { x: (cx - 7) * u, y: (cy - 1) * u }, { x: cx * u, y: (cy - 12) * u },
    { x: (cx + 7) * u, y: (cy - 1) * u }, { x: (cx + 14) * u, y: (cy - 8) * u },
    { x: (cx + 14) * u, y: (cy + 6) * u },
  ], true);
  g.fillStyle(P.chili, 1);
  g.fillCircle(cx * u, (cy - 1) * u, 2.6 * u);
}

const KINDS = { ant, mouse, roach, pigeon, ladybug, snail };

export function drawEnemy(g, look, size, frame = 0) {
  const u = size / 100;
  KINDS[look.kind](g, look, u, frame);
  if (look.crown) crown(g, u, 38, 30);
}
