// 畫面共用的小工具：文字、按鈕、返回鍵、鏡頭設定。
import strings from '../data/strings.json';
import { FONT_STACK } from '../config.js';
import { css } from '../art/palette.js';
import { makeSprite } from '../art/textures.js';
import { buttonPress } from '../art/anims.js';
import { save as writeSave } from '../save.js';

export function str(key, vars = {}) {
  let s = key.split('.').reduce((o, k) => (o ? o[k] : undefined), strings) ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

export function setupCamera(scene) {
  const z = scene.registry.get('zoom') || 1;
  scene.cameras.main.setZoom(z).centerOn(480, 270);
  scene.cameras.main.setBackgroundColor(css('cream'));
}

export function text(scene, x, y, s, size = 28, opts = {}) {
  const z = scene.registry.get('zoom') || 1;
  const t = scene.add.text(x, y, s, {
    fontFamily: FONT_STACK,
    fontSize: `${size}px`,
    color: opts.color || css('outline'),
    align: opts.align || 'center',
    stroke: opts.stroke || undefined,
    strokeThickness: opts.strokeThickness || 0,
    wordWrap: opts.wrap ? { width: opts.wrap, useAdvancedWrap: true } : undefined,
    resolution: z,
  });
  t.setOrigin(opts.originX ?? 0.5, opts.originY ?? 0.5);
  return t;
}

/** 按鈕：圖片 + 文字。回傳 container，可用 setEnabled(false) 停用。 */
export function button(scene, x, y, label, onClick, opts = {}) {
  const key = opts.key || 'ui:btn';
  const img = makeSprite(scene, 0, 0, key);
  if (opts.width) img.setDisplaySize(opts.width, opts.height || img.displayHeight);
  img.baseScale = img.scaleX;
  const parts = [img];
  const label2 = label ? text(scene, 0, -3, label, opts.fontSize || 30) : null;
  if (label2) parts.push(label2);
  const c = scene.add.container(x, y, parts);
  c.setSize(img.displayWidth, img.displayHeight);
  c.setInteractive({ useHandCursor: true });
  c.enabled = true;
  c.baseScale = 1;
  c.label = label2;
  c.img = img;
  c.on('pointerup', () => {
    if (!c.enabled) return;
    buttonPress(scene, c, () => onClick && onClick());
  });
  c.setEnabled = (on) => {
    c.enabled = on;
    c.setAlpha(on ? 1 : 0.55);
    return c;
  };
  return c;
}

export function backButton(scene, onClick) {
  const b = button(scene, 56, 56, '', onClick, { key: 'ui:btnRound' });
  const arrow = text(scene, 0, -3, '←', 34);
  b.add(arrow);
  return b;
}

/**
 * 包子卡片／圖鑑格子。
 * opts: { lvl, cost: 顯示蒸氣值, name: 顯示名字, owned: false 時畫剪影, h: 高度（72 或 84）}
 */
export function bunTile(scene, x, y, def, opts = {}) {
  const h = opts.h || 84;
  const owned = opts.owned !== false;
  const frameKey = h === 72 ? `ui:card:${def.rarity}` : `ui:tile:${def.rarity}`;
  const frame = makeSprite(scene, 0, 0, frameKey);
  const icon = makeSprite(scene, 0, opts.cost || opts.name ? -8 : 0, `bun:${def.id}`);
  icon.setScale(icon.baseScale * (h === 72 ? 0.62 : 0.72));
  if (!owned) icon.setTintFill(0x6b4a3a).setAlpha(0.35);
  const parts = [frame, icon];
  if (opts.cost) parts.push(text(scene, 0, h / 2 - 14, String(def.cost), 17));
  else if (opts.name) parts.push(text(scene, 0, h / 2 - 13, owned ? def.name : '？？？', def.name.length > 4 ? 12 : 15));
  if (owned && opts.lvl >= 2) {
    const badge = makeSprite(scene, 28, -h / 2 + 12, opts.lvl >= 3 ? 'ui:crown' : 'ui:star');
    badge.setScale(badge.baseScale * 0.7);
    parts.push(badge);
  }
  const c = scene.add.container(x, y, parts);
  c.setSize(84, h);
  c.frame = frame;
  c.icon = icon;
  c.frameKey = frameKey;
  return c;
}

export function getSave(scene) {
  return scene.registry.get('save');
}

export function commitSave(scene, data) {
  scene.registry.set('save', data);
  writeSave(data);
}
