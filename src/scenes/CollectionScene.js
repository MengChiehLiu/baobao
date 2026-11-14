import Phaser from 'phaser';
import { setupCamera, text, backButton, str, getSave, bunTile } from './common.js';
import { makeSprite } from '../art/textures.js';
import { popIn, idleBreath } from '../art/anims.js';
import { css } from '../art/palette.js';
import buns from '../data/buns.json';

export default class CollectionScene extends Phaser.Scene {
  constructor() {
    super('CollectionScene');
  }

  create() {
    setupCamera(this);
    makeSprite(this, 480, 270, 'ui:bg').setAlpha(0.35);
    const save = getSave(this);
    backButton(this, () => this.scene.start('MenuScene'));
    const ownedCount = buns.filter((b) => save.owned[b.id]).length;
    text(this, 480, 50, `${str('collection')}　${ownedCount} / ${buns.length}`, 34, { stroke: css('cream'), strokeThickness: 6 });

    buns.forEach((def, i) => {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const owned = Boolean(save.owned[def.id]);
      const t = bunTile(this, 75 + col * 90, 140 + row * 100, def, { lvl: save.owned[def.id], name: true, owned });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.show(def, save.owned[def.id]));
    });

    this.detail = [];
    this.show(buns[0], save.owned[buns[0].id]);
  }

  show(def, lvl) {
    for (const o of this.detail) o.destroy();
    const owned = Boolean(lvl);
    const s = makeSprite(this, 180, 420, `bun:${def.id}`);
    s.setScale(s.baseScale * 1.5);
    s.baseScale *= 1.5;
    if (owned) { popIn(this, s); idleBreath(this, s); } else s.setTintFill(0x6b4a3a).setAlpha(0.35);
    const title = text(this, 270, 380, owned ? `${def.name}　Lv${lvl}` : '？？？', 28, { originX: 0 });
    const rarity = text(this, 270, 416, str(`rarity.${def.rarity}`), 18, { originX: 0 });
    let how = def.desc;
    if (!owned) how = def.source === 'fusion' ? `提示：${def.hint}` : def.source === 'gacha' ? '可以從扭蛋拿到' : '過關後解鎖';
    const desc = text(this, 270, 456, how, 20, { originX: 0, wrap: 620, align: 'left' });
    this.detail = [s, title, rarity, desc];
  }
}
