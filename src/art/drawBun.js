// 畫包子。座標以 100×100 為基準，乘上 u = size / 100。
import { PALETTE as P } from './palette.js';

// 比例常數（起始值，可以在遊戲裡調整）
export const BUN_STYLE = {
  outlineWidth: 3.2,
  shadowAlpha: 0.15,
  faceY: 63,          // 臉的中心高度，約在身體 60% 的位置
  eyeGap: 15,         // 眼睛到中線的距離，約為身體寬度的 40% / 2
  eyeR: 3.4,
  blushGap: 24,
  highlightAlpha: 0.75,
};

function bodyPath(g, look, u) {
  switch (look.body) {
    case 'oval':
      g.fillEllipse(50 * u, 56 * u, 70 * u, 72 * u);
      return () => g.strokeEllipse(50 * u, 56 * u, 70 * u, 72 * u);
    case 'square':
      g.fillRoundedRect(14 * u, 28 * u, 72 * u, 60 * u, 24 * u);
      return () => g.strokeRoundedRect(14 * u, 28 * u, 72 * u, 60 * u, 24 * u);
    case 'folded':
      g.fillEllipse(50 * u, 64 * u, 84 * u, 44 * u);
      return () => g.strokeEllipse(50 * u, 64 * u, 84 * u, 44 * u);
    case 'flat':
      g.fillEllipse(50 * u, 66 * u, 86 * u, 46 * u);
      return () => g.strokeEllipse(50 * u, 66 * u, 86 * u, 46 * u);
    case 'tall':
      g.fillRoundedRect(22 * u, 18 * u, 56 * u, 72 * u, 26 * u);
      return () => g.strokeRoundedRect(22 * u, 18 * u, 56 * u, 72 * u, 26 * u);
    case 'spiky': {
      const c = P[look.color];
      const spikes = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const bx = 50 + Math.cos(a) * 36;
        const by = 58 + Math.sin(a) * 30;
        const tx = 50 + Math.cos(a) * 47;
        const ty = 58 + Math.sin(a) * 40;
        const nx = -Math.sin(a) * 7;
        const ny = Math.cos(a) * 7;
        spikes.push([bx + nx, by + ny, tx, ty, bx - nx, by - ny]);
      }
      g.fillStyle(P.matcha, 1);
      g.lineStyle(2.4 * u, P.outline, 1);
      for (const s of spikes) {
        g.fillTriangle(s[0] * u, s[1] * u, s[2] * u, s[3] * u, s[4] * u, s[5] * u);
        g.strokeTriangle(s[0] * u, s[1] * u, s[2] * u, s[3] * u, s[4] * u, s[5] * u);
      }
      g.fillStyle(c, 1);
      g.fillEllipse(50 * u, 58 * u, 76 * u, 64 * u);
      return () => g.strokeEllipse(50 * u, 58 * u, 76 * u, 64 * u);
    }
    case 'basket':
      g.fillRoundedRect(12 * u, 34 * u, 76 * u, 54 * u, 16 * u);
      return () => {
        g.strokeRoundedRect(12 * u, 34 * u, 76 * u, 54 * u, 16 * u);
        g.lineStyle(2 * u, P.outline, 0.45);
        for (let x = 24; x < 88; x += 12) g.lineBetween(x * u, 38 * u, x * u, 84 * u);
        g.fillStyle(P.caramel, 1);
        g.fillEllipse(50 * u, 34 * u, 84 * u, 22 * u);
        g.lineStyle(3 * u, P.outline, 1);
        g.strokeEllipse(50 * u, 34 * u, 84 * u, 22 * u);
        g.fillRoundedRect(42 * u, 20 * u, 16 * u, 10 * u, 4 * u);
        g.strokeRoundedRect(42 * u, 20 * u, 16 * u, 10 * u, 4 * u);
        g.fillStyle(P.wood, 1);
        g.fillRoundedRect(16 * u, 74 * u, 68 * u, 8 * u, 4 * u);
        // 蒸氣
        g.lineStyle(2.4 * u, P.cream, 0.9);
        for (const x of [36, 64]) {
          g.beginPath();
          g.arc(x * u, 14 * u, 4 * u, Math.PI * 0.5, Math.PI * 1.5);
          g.strokePath();
        }
      };
    case 'pan':
      g.fillEllipse(50 * u, 58 * u, 80 * u, 60 * u);
      g.fillStyle(P.caramel, 1);
      g.fillEllipse(50 * u, 79 * u, 72 * u, 18 * u);
      return () => g.strokeEllipse(50 * u, 58 * u, 80 * u, 60 * u);
    case 'round':
    default:
      g.fillEllipse(50 * u, 58 * u, 78 * u, 64 * u);
      return () => g.strokeEllipse(50 * u, 58 * u, 78 * u, 64 * u);
  }
}

function drawPleats(g, look, u) {
  const n = look.pleats;
  if (!n) return;
  g.lineStyle(2 * u, P.outline, 0.35);
  for (let i = 0; i < n; i++) {
    const a = -1.2 + (2.4 * i) / (n - 1 || 1);
    g.beginPath();
    g.moveTo(50 * u, 32 * u);
    g.lineTo((50 + Math.sin(a) * 30) * u, (32 + Math.cos(a) * 16) * u);
    g.strokePath();
  }
}

function drawTop(g, look, u) {
  const fill = look.filling ? P[look.filling] : P.sakura;
  switch (look.top) {
    case 'twist':
      g.fillStyle(P[look.color], 1);
      g.fillCircle(50 * u, 29 * u, 7 * u);
      g.lineStyle(2.4 * u, P.outline, 1);
      g.strokeCircle(50 * u, 29 * u, 7 * u);
      g.beginPath();
      g.arc(50 * u, 29 * u, 3.5 * u, 0, Math.PI * 1.4);
      g.strokePath();
      break;
    case 'dot':
      g.fillStyle(fill, 1);
      g.fillCircle(50 * u, 34 * u, 4.5 * u);
      break;
    case 'crack':
      g.fillStyle(fill, 1);
      g.fillEllipse(50 * u, 33 * u, 26 * u, 11 * u);
      g.lineStyle(2.2 * u, P.outline, 0.8);
      g.strokeEllipse(50 * u, 33 * u, 26 * u, 11 * u);
      g.fillStyle(P[look.color], 1);
      g.fillTriangle(37 * u, 33 * u, 44 * u, 27 * u, 46 * u, 35 * u);
      g.fillTriangle(63 * u, 33 * u, 56 * u, 27 * u, 54 * u, 35 * u);
      break;
    default:
      break;
  }
}

function drawFolded(g, look, u) {
  // 刈包：下半片、內餡、配料、上半片
  g.fillStyle(look.filling ? P[look.filling] : P.caramel, 1);
  g.fillRoundedRect(12 * u, 46 * u, 76 * u, 14 * u, 7 * u);
  if (look.topping === 'leaf') {
    g.fillStyle(P.matcha, 1);
    for (let i = 0; i < 6; i++) g.fillCircle((18 + i * 13) * u, 46 * u, 6 * u);
  }
  if (look.topping === 'chili') {
    g.fillStyle(P.chili, 1);
    for (let i = 0; i < 5; i++) g.fillCircle((20 + i * 15) * u, 46 * u, 4 * u);
  }
  g.fillStyle(P[look.color], 1);
  g.fillEllipse(50 * u, 40 * u, 82 * u, 34 * u);
  g.lineStyle(BUN_STYLE.outlineWidth * u, P.outline, 1);
  g.strokeEllipse(50 * u, 40 * u, 82 * u, 34 * u);
}

function drawTopping(g, look, u) {
  switch (look.topping) {
    case 'sesame':
      g.fillStyle(P.outline, 0.8);
      [[42, 36], [50, 32], [58, 36], [46, 41], [55, 41]].forEach(([x, y]) => {
        g.fillEllipse(x * u, y * u, 2.6 * u, 1.6 * u);
      });
      break;
    case 'cheese':
      g.fillStyle(P.yolk, 1);
      g.fillEllipse(50 * u, 34 * u, 34 * u, 12 * u);
      g.fillCircle(38 * u, 40 * u, 3.5 * u);
      g.fillCircle(61 * u, 41 * u, 3 * u);
      break;
    case 'chili':
      g.fillStyle(P.chili, 1);
      g.fillEllipse(66 * u, 30 * u, 8 * u, 16 * u);
      g.fillStyle(P.matcha, 1);
      g.fillCircle(66 * u, 22 * u, 3 * u);
      break;
    case 'leaf':
      if (look.body !== 'folded') {
        g.fillStyle(P.matcha, 1);
        g.fillEllipse(40 * u, 30 * u, 16 * u, 9 * u);
        g.fillEllipse(58 * u, 28 * u, 18 * u, 10 * u);
        g.lineStyle(1.6 * u, P.outline, 0.6);
        g.strokeEllipse(40 * u, 30 * u, 16 * u, 9 * u);
        g.strokeEllipse(58 * u, 28 * u, 18 * u, 10 * u);
      }
      break;
    case 'seeds':
      g.fillStyle(P.cream, 0.9);
      for (let i = 0; i < 16; i++) {
        const a = i * 2.39;
        const r = 6 + (i % 5) * 6;
        g.fillEllipse((50 + Math.cos(a) * r * 1.1) * u, (48 + Math.sin(a) * r * 0.55) * u, 3 * u, 1.8 * u);
      }
      break;
    case 'pearls':
      g.fillStyle(P.outline, 1);
      for (const [x, y] of [[34, 80], [44, 82], [54, 82], [64, 80], [39, 73], [50, 75], [61, 73]]) {
        g.fillCircle(x * u, y * u, 4.5 * u);
      }
      g.fillStyle(P.cream, 0.6);
      for (const [x, y] of [[33, 79], [43, 81], [53, 81], [63, 79]]) g.fillCircle(x * u, y * u, 1.3 * u);
      // 吸管
      g.fillStyle(P.sakura, 1);
      g.fillRoundedRect(56 * u, 4 * u, 7 * u, 22 * u, 3 * u);
      g.lineStyle(2 * u, P.outline, 1);
      g.strokeRoundedRect(56 * u, 4 * u, 7 * u, 22 * u, 3 * u);
      break;
    case 'scallion':
      g.fillStyle(P.matcha, 1);
      for (const [x, y] of [[38, 36], [50, 32], [62, 37], [44, 42], [57, 43]]) g.fillCircle(x * u, y * u, 2.6 * u);
      break;
    case 'bow':
      g.fillStyle(P.sakura, 1);
      g.fillTriangle(50 * u, 24 * u, 36 * u, 16 * u, 36 * u, 32 * u);
      g.fillTriangle(50 * u, 24 * u, 64 * u, 16 * u, 64 * u, 32 * u);
      g.lineStyle(2 * u, P.outline, 1);
      g.strokeTriangle(50 * u, 24 * u, 36 * u, 16 * u, 36 * u, 32 * u);
      g.strokeTriangle(50 * u, 24 * u, 64 * u, 16 * u, 64 * u, 32 * u);
      g.fillStyle(P.blush, 1);
      g.fillCircle(50 * u, 24 * u, 4 * u);
      break;
    case 'cream':
      g.fillStyle(0xffffff, 1);
      g.fillEllipse(50 * u, 46 * u, 30 * u, 12 * u);
      g.fillEllipse(50 * u, 40 * u, 20 * u, 10 * u);
      g.fillStyle(P.sakura, 1);
      g.fillCircle(50 * u, 35 * u, 4 * u);
      break;
    default:
      break;
  }
}

function drawFace(g, look, u, blink, faceY) {
  const s = BUN_STYLE;
  const ex1 = (50 - s.eyeGap) * u;
  const ex2 = (50 + s.eyeGap) * u;
  const ey = (faceY - 3) * u;
  g.fillStyle(P.outline, 1);
  g.lineStyle(2.4 * u, P.outline, 1);
  if (look.face === 'cool' && !blink) {
    // 小墨鏡
    g.fillRoundedRect(ex1 - 7 * u, ey - 4.5 * u, 14 * u, 9 * u, 4 * u);
    g.fillRoundedRect(ex2 - 7 * u, ey - 4.5 * u, 14 * u, 9 * u, 4 * u);
    g.lineBetween(ex1 + 6 * u, ey - 2 * u, ex2 - 6 * u, ey - 2 * u);
    g.fillStyle(P.cream, 0.7);
    g.fillCircle(ex1 - 3 * u, ey - 2 * u, 1.4 * u);
    g.fillCircle(ex2 - 3 * u, ey - 2 * u, 1.4 * u);
  } else if (look.face === 'wink' && !blink) {
    g.fillCircle(ex1, ey, s.eyeR * u);
    g.beginPath();
    g.arc(ex2, ey + 1 * u, 3.6 * u, 1.15 * Math.PI, 1.85 * Math.PI);
    g.strokePath();
  } else if (blink || look.face === 'sleepy') {
    for (const ex of [ex1, ex2]) {
      g.beginPath();
      g.arc(ex, ey - 1 * u, 3.6 * u, 0.15 * Math.PI, 0.85 * Math.PI);
      g.strokePath();
    }
  } else {
    g.fillCircle(ex1, ey, s.eyeR * u);
    g.fillCircle(ex2, ey, s.eyeR * u);
    if (look.face === 'open') {
      g.fillStyle(P.cream, 1);
      g.fillCircle(ex1 + 1.2 * u, ey - 1.2 * u, 1.2 * u);
      g.fillCircle(ex2 + 1.2 * u, ey - 1.2 * u, 1.2 * u);
    }
  }
  // 腮紅
  g.fillStyle(P.blush, 0.8);
  g.fillEllipse((50 - s.blushGap) * u, (faceY + 4) * u, 11 * u, 6 * u);
  g.fillEllipse((50 + s.blushGap) * u, (faceY + 4) * u, 11 * u, 6 * u);
  // 嘴巴
  const my = (faceY + 3) * u;
  if (look.face === 'open') {
    g.fillStyle(P.chili, 1);
    g.fillEllipse(50 * u, my + 1.5 * u, 6 * u, 5 * u);
    g.lineStyle(2 * u, P.outline, 1);
    g.strokeEllipse(50 * u, my + 1.5 * u, 6 * u, 5 * u);
  } else if (look.face === 'sleepy') {
    g.lineStyle(2 * u, P.outline, 1);
    g.beginPath();
    g.moveTo(47 * u, my + 1 * u);
    g.lineTo(53 * u, my + 1 * u);
    g.strokePath();
  } else {
    // 「ω」形的小嘴
    g.lineStyle(2 * u, P.outline, 1);
    g.beginPath();
    g.arc(47 * u, my, 3 * u, 0.1 * Math.PI, 0.9 * Math.PI);
    g.strokePath();
    g.beginPath();
    g.arc(53 * u, my, 3 * u, 0.1 * Math.PI, 0.9 * Math.PI);
    g.strokePath();
  }
}

/**
 * @param {Phaser.GameObjects.Graphics} g
 * @param {Object} look   0.8 節的外觀參數
 * @param {number} size   貼圖邊長（已乘上縮放倍率）
 * @param {{blink?: boolean, ugly?: boolean}} opts
 */
export function drawBun(g, look, size, opts = {}) {
  const u = size / 100;
  const s = BUN_STYLE;
  // 1. 陰影
  g.fillStyle(P.outline, s.shadowAlpha);
  g.fillEllipse(50 * u, 90 * u, 66 * u, 12 * u);

  // 2. 身體
  g.fillStyle(P[look.color], 1);
  const strokeBody = bodyPath(g, look, u);
  if (opts.ugly) {
    g.fillCircle(24 * u, 46 * u, 12 * u);
    g.fillCircle(74 * u, 70 * u, 10 * u);
    g.fillCircle(66 * u, 34 * u, 9 * u);
  }
  g.lineStyle(s.outlineWidth * u, P.outline, 1);
  strokeBody();
  if (opts.ugly) {
    g.strokeCircle(24 * u, 46 * u, 12 * u);
    g.strokeCircle(74 * u, 70 * u, 10 * u);
    g.strokeCircle(66 * u, 34 * u, 9 * u);
    g.fillStyle(P[look.color], 1);
    g.fillEllipse(50 * u, 58 * u, 70 * u, 56 * u);
  }

  let faceY = { flat: 68, tall: 54, basket: 62, spiky: 62 }[look.body] ?? s.faceY;
  if (look.body === 'folded') {
    drawFolded(g, look, u);
    faceY = 40;
  } else {
    // 3. 褶子、4. 頂部、5. 內餡（由頂部樣式決定）、6. 配料
    drawPleats(g, look, u);
    drawTop(g, look, u);
    drawTopping(g, look, u);
  }
  // 7. 高光
  if (look.body !== 'basket') {
    g.fillStyle(look.color === 'cream' ? 0xffffff : P.cream, s.highlightAlpha);
    const hy = { folded: 32, flat: 56, tall: 34 }[look.body] ?? 46;
    g.fillEllipse(34 * u, hy * u, 14 * u, 8 * u);
  }
  // 8. 臉
  drawFace(g, look, u, opts.blink, faceY);
}
