// 開機時用 Phaser Graphics 以 zoom 倍大小畫好所有貼圖。
import buns from '../data/buns.json';
import enemies from '../data/enemies.json';
import ingredients from '../data/ingredients.json';
import { PALETTE as P } from './palette.js';
import { drawBun } from './drawBun.js';
import { drawEnemy } from './drawEnemy.js';
import { drawIngredient } from './drawIngredient.js';
import * as UI from './drawUI.js';
import { GAME_W, GAME_H } from '../config.js';

export const BUN_SIZE = 76;     // 遊戲像素
export const ENEMY_SIZE = 64;
export const ING_SIZE = 64;

function make(scene, key, w, h, zoom, fn) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  fn(g, zoom);
  g.generateTexture(key, Math.ceil(w * zoom), Math.ceil(h * zoom));
  g.destroy();
}

export function generateAll(scene, zoom) {
  for (const b of buns) {
    make(scene, `bun:${b.id}`, BUN_SIZE, BUN_SIZE, zoom, (g, z) => drawBun(g, b.look, BUN_SIZE * z));
    make(scene, `bun:${b.id}:blink`, BUN_SIZE, BUN_SIZE, zoom, (g, z) => drawBun(g, b.look, BUN_SIZE * z, { blink: true }));
  }
  make(scene, 'bun:ugly', BUN_SIZE, BUN_SIZE, zoom, (g, z) => drawBun(g,
    { body: 'round', pleats: 3, top: 'none', color: 'wood', filling: null, topping: 'none', face: 'sleepy' },
    BUN_SIZE * z, { ugly: true }));

  for (const e of enemies) {
    for (const f of [0, 1]) {
      make(scene, `enemy:${e.id}:${f}`, ENEMY_SIZE, ENEMY_SIZE, zoom, (g, z) => drawEnemy(g, e.look, ENEMY_SIZE * z, f));
    }
  }
  for (const i of ingredients) {
    make(scene, `ing:${i.id}`, ING_SIZE, ING_SIZE, zoom, (g, z) => drawIngredient(g, i.look, ING_SIZE * z));
  }

  make(scene, 'ui:bg', GAME_W, GAME_H, zoom, UI.background);
  make(scene, 'ui:btn', 240, 84, zoom, (g, z) => UI.button(g, z, 240, 84));
  make(scene, 'ui:btnAlt', 240, 84, zoom, (g, z) => UI.button(g, z, 240, 84, P.matcha));
  make(scene, 'ui:btnOff', 240, 84, zoom, (g, z) => UI.button(g, z, 240, 84, P.wood));
  make(scene, 'ui:btnSmall', 150, 72, zoom, (g, z) => UI.button(g, z, 150, 72));
  make(scene, 'ui:btnRound', 72, 72, zoom, (g, z) => UI.button(g, z, 72, 72, P.cream));
  make(scene, 'ui:level', 120, 104, zoom, (g, z) => UI.button(g, z, 120, 104, P.cream));
  make(scene, 'ui:levelNext', 120, 104, zoom, (g, z) => UI.button(g, z, 120, 104, P.sakura));
  make(scene, 'ui:panel', 560, 340, zoom, (g, z) => UI.panel(g, z, 560, 340));
  make(scene, 'ui:card', 84, 72, zoom, (g, z) => UI.card(g, z, 84, 72, false));
  make(scene, 'ui:steam', 40, 40, zoom, (g, z) => UI.steamIcon(g, z, 40));
  make(scene, 'ui:lock', 40, 40, zoom, (g, z) => UI.lockIcon(g, z, 40));
  make(scene, 'ui:check', 40, 40, zoom, (g, z) => UI.checkIcon(g, z, 40));
  make(scene, 'ui:steamerMini', 40, 40, zoom, (g, z) => UI.steamerSmall(g, z, 20, 22, 34));
  make(scene, 'ui:gacha', 260, 340, zoom, UI.gachaMachine);
  make(scene, 'ui:handle', 64, 64, zoom, UI.gachaHandle);
  make(scene, 'ui:capTop', 80, 40, zoom, (g, z) => UI.capsuleHalf(g, z, true));
  make(scene, 'ui:capBottom', 80, 40, zoom, (g, z) => UI.capsuleHalf(g, z, false));
  make(scene, 'ui:steamer', 300, 170, zoom, UI.steamerBig);
  make(scene, 'ui:lid', 300, 90, zoom, UI.steamerLid);
  make(scene, 'ui:slot', 100, 100, zoom, (g, z) => UI.slot(g, z, 100));

  make(scene, 'fx:steam', 32, 32, zoom, UI.fxSteam);
  make(scene, 'fx:soup', 16, 16, zoom, (g, z) => UI.fxDot(g, z, P.yolk, 8));
  make(scene, 'fx:star', 28, 28, zoom, UI.fxStar);
  make(scene, 'fx:heart', 28, 28, zoom, UI.fxHeart);
  make(scene, 'fx:confetti', 10, 16, zoom, UI.fxConfetti);
  make(scene, 'fx:bullet', 24, 24, zoom, UI.fxBullet);
  make(scene, 'fx:puddle', 80, 28, zoom, UI.fxPuddle);
  make(scene, 'fx:ring', 100, 100, zoom, UI.fxRing);

  make(scene, 'ui:star', 28, 28, zoom, (g, z) => UI.star(g, z, 28, true));
  make(scene, 'ui:starOff', 28, 28, zoom, (g, z) => UI.star(g, z, 28, false));
  make(scene, 'ui:crown', 32, 24, zoom, UI.crownIcon);
  make(scene, 'ui:ticket', 44, 40, zoom, UI.ticket);
  make(scene, 'ui:heart', 28, 28, zoom, (g, z) => UI.heartIcon(g, z, true));
  make(scene, 'ui:heartOff', 28, 28, zoom, (g, z) => UI.heartIcon(g, z, false));
  for (const r of Object.keys(UI.RARITY_COLOR)) {
    make(scene, `ui:card:${r}`, 84, 72, zoom, (g, z) => UI.rarityCard(g, z, 84, 72, r, false));
    make(scene, `ui:tile:${r}`, 84, 84, zoom, (g, z) => UI.rarityCard(g, z, 84, 84, r, false));
    make(scene, `ui:capTop:${r}`, 80, 40, zoom, (g, z) => UI.capsuleHalfColor(g, z, true, UI.RARITY_COLOR[r]));
  }
  make(scene, 'ui:cardSel', 84, 72, zoom, (g, z) => UI.rarityCard(g, z, 84, 72, 'base', true));
  make(scene, 'ui:tileSel', 84, 84, zoom, (g, z) => UI.rarityCard(g, z, 84, 84, 'base', true));
}

/** 每關的地圖在進入戰鬥時才畫。 */
export function makeMap(scene, level, path) {
  const zoom = scene.registry.get('zoom') || 1;
  make(scene, `map:${level.id}`, GAME_W, GAME_H, zoom, (g, z) => UI.map(g, z, level, path));
  return `map:${level.id}`;
}

/** 建立 sprite 並縮回遊戲像素大小。 */
export function makeSprite(scene, x, y, key) {
  const z = scene.registry.get('zoom') || 1;
  const s = scene.add.image(x, y, key);
  s.setScale(1 / z);
  s.baseScale = 1 / z;
  return s;
}
