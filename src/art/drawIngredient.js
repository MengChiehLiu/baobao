// 畫食材圖示。座標以 100×100 為基準。
import { PALETTE as P } from './palette.js';

function tinyFace(g, u, x, y) {
  g.fillStyle(P.outline, 1);
  g.fillCircle((x - 7) * u, y * u, 2.6 * u);
  g.fillCircle((x + 7) * u, y * u, 2.6 * u);
  g.fillStyle(P.blush, 0.8);
  g.fillEllipse((x - 12) * u, (y + 5) * u, 7 * u, 4 * u);
  g.fillEllipse((x + 12) * u, (y + 5) * u, 7 * u, 4 * u);
  g.lineStyle(1.8 * u, P.outline, 1);
  g.beginPath();
  g.arc(x * u, (y + 3) * u, 3 * u, 0.15 * Math.PI, 0.85 * Math.PI);
  g.strokePath();
}

const KINDS = {
  cheese(g, u) {
    g.fillStyle(P.yolk, 1);
    g.fillTriangle(14 * u, 74 * u, 86 * u, 74 * u, 72 * u, 26 * u);
    g.lineStyle(3 * u, P.outline, 1);
    g.strokeTriangle(14 * u, 74 * u, 86 * u, 74 * u, 72 * u, 26 * u);
    g.fillStyle(P.caramel, 0.6);
    g.fillCircle(66 * u, 44 * u, 5 * u);
    g.fillCircle(30 * u, 66 * u, 4 * u);
    tinyFace(g, u, 56, 60);
  },
  saltedegg(g, u) {
    g.fillStyle(P.dough, 1);
    g.fillCircle(50 * u, 52 * u, 34 * u);
    g.lineStyle(3 * u, P.outline, 1);
    g.strokeCircle(50 * u, 52 * u, 34 * u);
    g.fillStyle(P.yolk, 1);
    g.fillCircle(50 * u, 52 * u, 24 * u);
    g.fillStyle(P.caramel, 0.5);
    g.fillCircle(50 * u, 52 * u, 18 * u);
    g.fillStyle(P.yolk, 1);
    g.fillCircle(50 * u, 52 * u, 15 * u);
    tinyFace(g, u, 50, 52);
  },
  chili(g, u) {
    g.fillStyle(P.chili, 1);
    g.fillEllipse(50 * u, 56 * u, 30 * u, 62 * u);
    g.lineStyle(3 * u, P.outline, 1);
    g.strokeEllipse(50 * u, 56 * u, 30 * u, 62 * u);
    g.fillStyle(P.matcha, 1);
    g.fillRoundedRect(42 * u, 18 * u, 16 * u, 12 * u, 4 * u);
    g.fillStyle(P.cream, 0.6);
    g.fillEllipse(44 * u, 46 * u, 6 * u, 16 * u);
    tinyFace(g, u, 50, 60);
  },
  braisedpork(g, u) {
    g.fillStyle(P.caramel, 1);
    g.fillRoundedRect(18 * u, 28 * u, 64 * u, 50 * u, 12 * u);
    g.lineStyle(3 * u, P.outline, 1);
    g.strokeRoundedRect(18 * u, 28 * u, 64 * u, 50 * u, 12 * u);
    g.fillStyle(P.dough, 1);
    g.fillRect(20 * u, 40 * u, 60 * u, 8 * u);
    tinyFace(g, u, 50, 62);
  },
};

export function drawIngredient(g, look, size) {
  const u = size / 100;
  g.fillStyle(P.outline, 0.15);
  g.fillEllipse(50 * u, 90 * u, 56 * u, 10 * u);
  KINDS[look.kind](g, u);
}
