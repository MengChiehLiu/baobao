import Phaser from 'phaser';
import { setupCamera, text, button, backButton, str, getSave, commitSave } from './common.js';
import { makeSprite } from '../art/textures.js';
import { popIn, idleBreath } from '../art/anims.js';
import { createFx } from '../art/particles.js';
import { fuse } from '../logic/fusion.js';
import { PALETTE as P, css } from '../art/palette.js';
import buns from '../data/buns.json';
import ingredients from '../data/ingredients.json';
import recipes from '../data/recipes.json';

const SLOT_X = [430, 530];
const SLOT_Y = 300;

export default class SteamerScene extends Phaser.Scene {
  constructor() {
    super('SteamerScene');
  }

  create() {
    setupCamera(this);
    makeSprite(this, 480, 270, 'ui:bg').setAlpha(0.35);
    this.fx = createFx(this);
    this.slots = [null, null];
    this.busy = false;
    this.dynamic = [];

    backButton(this, () => this.scene.start('MenuScene'));
    text(this, 480, 50, str('steamerTitle'), 40, { stroke: css('cream'), strokeThickness: 8 });

    // 中間：蒸籠
    makeSprite(this, 480, 340, 'ui:steamer');
    this.lid = makeSprite(this, 480, 220, 'ui:lid').setAlpha(0);
    this.slotViews = SLOT_X.map((x, i) => {
      const bg = makeSprite(this, x, SLOT_Y, 'ui:slot');
      bg.setScale(bg.baseScale * 0.8);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.clearSlot(i));
      return { bg, icon: null };
    });
    this.steamBtn = button(this, 480, 470, str('steam'), () => this.cook(), { width: 200, height: 84, fontSize: 36 });

    this.msg = text(this, 480, 140, '', 24, { stroke: css('cream'), strokeThickness: 6 });
    this.refresh();
  }

  refresh() {
    for (const o of this.dynamic) o.destroy();
    this.dynamic = [];
    const save = getSave(this);

    // 左邊：食材清單
    ingredients.forEach((ing, i) => {
      const y = 130 + i * 90;
      const used = this.slots.filter((s) => s === ing.id).length;
      const n = (save.ingredients[ing.id] || 0) - used;
      const icon = makeSprite(this, 196, y, `ing:${ing.id}`);
      icon.setScale(icon.baseScale * 0.9);
      icon.setAlpha(n > 0 ? 1 : 0.35);
      if (n > 0) {
        icon.setInteractive({ useHandCursor: true });
        icon.on('pointerdown', () => this.addToSlot(ing.id));
      }
      const label = text(this, 240, y, `${ing.name}\n×${n}`, 18, { originX: 0, align: 'left' });
      this.dynamic.push(icon, label);
    });

    // 右邊：合成包子的剪影與提示
    buns.filter((b) => b.source === 'fusion').forEach((b, i) => {
      const y = 170 + i * 170;
      const owned = Boolean(save.owned[b.id]);
      const s = makeSprite(this, 800, y, `bun:${b.id}`);
      if (!owned) s.setTintFill(P.outline).setAlpha(0.55);
      const label = text(this, 800, y + 52, owned ? b.name : b.hint, 18, { wrap: 220 });
      this.dynamic.push(s, label);
    });

    const ready = this.slots[0] && this.slots[1];
    this.steamBtn.setEnabled(Boolean(ready) && !this.busy);
  }

  addToSlot(id) {
    if (this.busy) return;
    const i = this.slots.indexOf(null);
    if (i < 0) return;
    this.slots[i] = id;
    const v = this.slotViews[i];
    v.icon = makeSprite(this, SLOT_X[i], SLOT_Y, `ing:${id}`);
    popIn(this, v.icon);
    this.refresh();
  }

  clearSlot(i) {
    if (this.busy || !this.slots[i]) return;
    this.slots[i] = null;
    const v = this.slotViews[i];
    if (v.icon) v.icon.destroy();
    v.icon = null;
    this.refresh();
  }

  cook() {
    if (this.busy || !this.slots[0] || !this.slots[1]) return;
    this.busy = true;
    this.refresh();
    this.msg.setText('');
    // 蓋上蓋子、跳動、冒蒸氣 1.5 秒
    this.lid.setAlpha(1).setY(140);
    this.tweens.add({ targets: this.lid, y: 270, duration: 250, ease: 'Bounce.easeOut' });
    this.tweens.add({ targets: this.lid, y: 262, duration: 90, yoyo: true, repeat: 7, delay: 260 });
    const puffs = this.time.addEvent({
      delay: 80, repeat: 18, callback: () => this.fx.puff(480 + Phaser.Math.Between(-80, 80), 250),
    });
    this.time.delayedCall(1500, () => {
      puffs.remove();
      this.finish();
    });
  }

  finish() {
    const [a, b] = this.slots;
    const res = fuse(getSave(this), a, b, recipes);
    this.tweens.add({ targets: this.lid, y: 140, alpha: 0, duration: 300 });
    for (const v of this.slotViews) { if (v.icon) v.icon.destroy(); v.icon = null; }
    this.slots = [null, null];

    let key = 'bun:ugly';
    if (res.ok) {
      commitSave(this, res.save);
      key = `bun:${res.bunId}`;
      const def = buns.find((x) => x.id === res.bunId);
      this.msg.setText(str('fuseSuccess', { name: def.name }));
      this.fx.burst('confetti', 480, 260, 30);
      this.fx.burst('star', 480, 260, 8);
    } else {
      if (res.reason === 'owned') key = `bun:${recipes.find((r) => [a, b].sort().join() === r.inputs.slice().sort().join()).result}`;
      this.msg.setText(str(`reason.${res.reason}`));
    }
    const s = makeSprite(this, 480, 280, key);
    s.setScale(s.baseScale * 1.6);
    s.baseScale *= 1.6;
    popIn(this, s);
    this.time.delayedCall(450, () => idleBreath(this, s));
    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: s, alpha: 0, y: 240, duration: 300, onComplete: () => s.destroy() });
      this.busy = false;
      this.refresh();
    });
  }
}
