import Phaser from 'phaser';
import { setupCamera, text, button, str, getSave } from './common.js';
import { makeSprite } from '../art/textures.js';
import { idleBreath, startBlink } from '../art/anims.js';
import { css } from '../art/palette.js';
import buns from '../data/buns.json';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    setupCamera(this);
    makeSprite(this, 480, 270, 'ui:bg').setAlpha(0.5);
    const save = getSave(this);

    text(this, 480, 86, str('title'), 48, { stroke: css('cream'), strokeThickness: 8 });

    button(this, 480, 200, str('go'), () => this.scene.start('LevelSelectScene'), { width: 300, height: 92, fontSize: 38 });

    const gacha = button(this, 400, 310, str('gacha'), () => this.scene.start('GachaScene'),
      { key: 'ui:btnAlt', width: 140, height: 84, fontSize: 30 });
    if (save.tickets > 0) {
      const badge = this.add.container(58, -32, [
        makeSprite(this, 0, 0, 'ui:ticket'),
        text(this, 0, 2, String(save.tickets), 18),
      ]);
      gacha.add(badge);
      this.tweens.add({ targets: badge, angle: { from: -10, to: 10 }, duration: 300, yoyo: true, repeat: -1 });
    }
    button(this, 560, 310, str('collection'), () => this.scene.start('CollectionScene'),
      { key: 'ui:btnAlt', width: 140, height: 84, fontSize: 30 });

    const unlocked = save.cleared.includes(4);
    const steamer = button(this, 480, 410, str('steamer'), () => this.scene.start('SteamerScene'),
      { key: unlocked ? 'ui:btnAlt' : 'ui:btnOff', width: 300, height: 84, fontSize: 32 });
    if (!unlocked) {
      steamer.setEnabled(false);
      text(this, 480, 466, str('steamerLocked'), 18);
    }

    // 兩邊各放一顆包子：最稀有的放右邊
    const order = { super: 4, fusion: 3, rare: 2, common: 1, base: 0 };
    const ownedDefs = buns.filter((b) => save.owned[b.id]).sort((a, b) => order[b.rarity] - order[a.rarity]);
    for (const [x, id] of [[170, 'charsiu'], [790, ownedDefs[0]?.id || 'charsiu']]) {
      const s = makeSprite(this, x, 330, `bun:${id}`);
      s.setScale(s.baseScale * 1.8);
      s.baseScale *= 1.8;
      idleBreath(this, s);
      startBlink(this, s, `bun:${id}`);
    }
  }
}
