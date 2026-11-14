import Phaser from 'phaser';
import { setupCamera, text, button, backButton, str, getSave, commitSave } from './common.js';
import { makeSprite } from '../art/textures.js';
import { popIn, idleBreath, startBlink } from '../art/anims.js';
import { createFx } from '../art/particles.js';
import { pull } from '../logic/gacha.js';
import { createRng } from '../logic/rng.js';
import { PALETTE as P, css } from '../art/palette.js';
import buns from '../data/buns.json';

const rng = createRng(Date.now() >>> 0);

export default class GachaScene extends Phaser.Scene {
  constructor() {
    super('GachaScene');
  }

  create() {
    setupCamera(this);
    makeSprite(this, 480, 270, 'ui:bg').setAlpha(0.35);
    this.fx = createFx(this);
    this.busy = false;
    this.result = [];
    backButton(this, () => { if (!this.busy) this.scene.start('MenuScene'); });
    text(this, 480, 40, str('gachaTitle'), 40, { stroke: css('cream'), strokeThickness: 8 });

    makeSprite(this, 760, 40, 'ui:ticket');
    this.ticketText = text(this, 790, 40, '', 24, { originX: 0 });
    text(this, 480, 84, str('ticketHint'), 16);

    this.machine = makeSprite(this, 280, 310, 'ui:gacha');
    this.handle = makeSprite(this, 280, 390, 'ui:handle');
    this.tweens.add({ targets: this.machine, angle: { from: -1.5, to: 1.5 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.spinBtn = button(this, 680, 300, str('spin'), () => this.spin(), { width: 220, height: 96, fontSize: 40 });
    this.refresh();
  }

  refresh() {
    const t = getSave(this).tickets || 0;
    this.ticketText.setText(`×${t}`);
    this.spinBtn.setEnabled(t > 0 && !this.busy);
    if (this.spinBtn.label) this.spinBtn.label.setText(t > 0 ? str('spin') : str('reason.noTicket'));
  }

  clearResult() {
    for (const o of this.result) o.destroy();
    this.result = [];
  }

  spin() {
    if (this.busy) return;
    const res = pull(getSave(this), buns, rng);
    if (!res.ok) { this.refresh(); return; }
    commitSave(this, res.save); // 先存檔，關掉也不會少
    this.busy = true;
    this.clearResult();
    this.spinBtn.setVisible(false);
    this.refresh();
    this.tweens.add({
      targets: this.handle, angle: '+=360', duration: 700, ease: 'Cubic.easeInOut',
      onComplete: () => this.dropCapsule(res),
    });
    this.tweens.add({ targets: this.machine, x: '+=4', duration: 60, yoyo: true, repeat: 5 });
  }

  dropCapsule(res) {
    const top = makeSprite(this, 0, -10, `ui:capTop:${res.rarity}`);
    const bottom = makeSprite(this, 0, 10, 'ui:capBottom');
    const cap = this.add.container(280, 420, [top, bottom]);
    cap.setAlpha(0);
    const shakes = res.rarity === 'super' ? 5 : res.rarity === 'rare' ? 3 : 2;
    this.tweens.chain({
      targets: cap,
      tweens: [
        { alpha: 1, duration: 100 },
        { y: 495, duration: 450, ease: 'Bounce.easeOut' },
        { x: 660, y: 290, scale: 1.6, duration: 450, ease: 'Quad.easeOut' },
        { angle: { from: -16, to: 16 }, duration: 110, yoyo: true, repeat: shakes, ease: 'Sine.easeInOut' },
        { angle: 0, duration: 80 },
      ],
      onComplete: () => this.open(res, cap, top, bottom),
    });
    if (res.rarity !== 'common') {
      // 稀有以上：扭蛋發光
      const glow = this.add.circle(660, 290, 10, res.rarity === 'super' ? P.yolk : P.taro, 0.5).setDepth(-1);
      this.result.push(glow);
      this.tweens.add({ targets: glow, radius: 140, alpha: 0.25, delay: 900, duration: 600, yoyo: true, repeat: 1 });
    }
  }

  open(res, cap, top, bottom) {
    const { x, y } = cap;
    this.tweens.add({ targets: top, y: top.y - 60, angle: -40, alpha: 0, duration: 400, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: bottom, y: bottom.y + 20, alpha: 0, duration: 400, onComplete: () => cap.destroy() });
    const big = res.rarity === 'super';
    this.fx.burst('confetti', x, y - 20, big ? 30 : 18);
    this.fx.burst('star', x, y - 20, big ? 12 : 6);
    if (big) {
      this.cameras.main.flash(300, 255, 246, 200);
      this.cameras.main.shake(250, 0.006);
    }

    const def = buns.find((b) => b.id === res.bunId);
    const s = makeSprite(this, 660, 250, `bun:${def.id}`);
    s.setScale(s.baseScale * 2.2);
    s.baseScale *= 2.2;
    popIn(this, s);
    this.time.delayedCall(500, () => { if (s.active) idleBreath(this, s); });
    startBlink(this, s, `bun:${def.id}`);
    this.result.push(s);

    const rarityText = text(this, 660, 130, str(`rarity.${def.rarity}`), 26, {
      stroke: css('cream'), strokeThickness: 6, color: css(def.rarity === 'super' ? 'chili' : def.rarity === 'rare' ? 'taro' : 'outline'),
    });
    const tag = res.result === 'new' ? str('gotNew') : res.result === 'levelUp' ? str('gotLevelUp', { n: res.level }) : str('gotMaxed');
    const name = text(this, 660, 360, `${def.name}　${tag}`, 28, { stroke: css('cream'), strokeThickness: 6 });
    const desc = text(this, 660, 400, def.desc, 18, { wrap: 480 });
    for (const o of [rarityText, name, desc]) { o.setAlpha(0); this.result.push(o); }
    this.tweens.add({ targets: [rarityText, name, desc], alpha: 1, duration: 300, delay: 250 });
    if (res.result === 'levelUp') {
      const badge = makeSprite(this, 720, 200, res.level >= 3 ? 'ui:crown' : 'ui:star');
      badge.setScale(badge.baseScale * 1.6);
      this.result.push(badge);
      popIn(this, badge);
    }

    this.time.delayedCall(800, () => {
      this.busy = false;
      const tickets = getSave(this).tickets || 0;
      if (tickets > 0) {
        const again = button(this, 560, 480, str('spinAgain'), () => { again.destroy(); back.destroy(); this.spin(); }, { width: 200, height: 76, fontSize: 28 });
        const back = button(this, 780, 480, str('back'), () => this.scene.start('MenuScene'), { key: 'ui:btnAlt', width: 200, height: 76, fontSize: 28 });
        this.result.push(again, back);
      } else {
        this.result.push(button(this, 660, 480, str('back'), () => this.scene.start('MenuScene'), { key: 'ui:btnAlt' }));
      }
      this.refresh();
    });
  }
}
