import Phaser from 'phaser';
import { setupCamera, text, button, backButton, str, getSave, commitSave, bunTile } from './common.js';
import { makeSprite } from '../art/textures.js';
import { enterLevel } from '../logic/progress.js';
import { LOADOUT_MAX } from '../config.js';
import { css } from '../art/palette.js';
import buns from '../data/buns.json';
import levels from '../data/levels.json';

export default class LoadoutScene extends Phaser.Scene {
  constructor() {
    super('LoadoutScene');
  }

  init(data) {
    this.levelId = data.levelId;
  }

  create() {
    setupCamera(this);
    makeSprite(this, 480, 270, 'ui:bg').setAlpha(0.35);
    this.level = levels.find((l) => l.id === this.levelId);
    // 進入關卡時解鎖這關的新包子
    let save = enterLevel(getSave(this), this.level);
    commitSave(this, save);
    save = getSave(this);

    backButton(this, () => this.scene.start('LevelSelectScene'));
    text(this, 480, 34, `${str('level', { n: this.level.id })}　${this.level.name}`, 28, { stroke: css('cream'), strokeThickness: 6 });

    // 這關的敵人
    const enemyIds = [...new Set(this.level.waves.flatMap((w) => Object.keys(w)))];
    text(this, 120, 86, str('enemiesHere'), 18, { originX: 0 });
    enemyIds.forEach((id, i) => {
      const s = makeSprite(this, 250 + i * 54, 86, `enemy:${id}:0`);
      s.setScale(s.baseScale * 0.7);
      if (this.level.newEnemies.includes(id)) this.tweens.add({ targets: s, y: 80, duration: 400, yoyo: true, repeat: -1 });
    });

    text(this, 480, 128, str('loadoutTitle', { n: LOADOUT_MAX }), 22);

    const owned = buns.filter((b) => save.owned[b.id]);
    const ownedIds = owned.map((b) => b.id);
    let picked = (save.loadout || []).filter((id) => save.owned[id]);
    for (const id of this.level.newBuns) if (!picked.includes(id) && save.owned[id]) picked.unshift(id);
    for (const id of ownedIds) if (picked.length < LOADOUT_MAX && !picked.includes(id)) picked.push(id);
    this.picked = picked.slice(0, LOADOUT_MAX);

    this.tiles = owned.map((def, i) => {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const t = bunTile(this, 75 + col * 90, 200 + row * 96, def, { lvl: save.owned[def.id], name: true });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.toggle(def.id));
      t.def = def;
      return t;
    });

    this.countText = text(this, 480, 400, '', 22);
    this.descText = text(this, 480, 432, str('loadoutHint'), 18, { wrap: 760 });
    button(this, 480, 492, str('go'), () => this.go(), { width: 240, height: 84, fontSize: 36 });
    this.refresh();
  }

  toggle(id) {
    const def = buns.find((b) => b.id === id);
    const i = this.picked.indexOf(id);
    if (i >= 0) this.picked.splice(i, 1);
    else if (this.picked.length < LOADOUT_MAX) this.picked.push(id);
    const lvl = getSave(this).owned[id];
    this.descText.setText(`${def.name}（${str(`rarity.${def.rarity}`)} Lv${lvl}，${def.cost} 蒸氣值）：${def.desc}`);
    this.refresh();
  }

  refresh() {
    for (const t of this.tiles) {
      const on = this.picked.includes(t.def.id);
      t.frame.setTexture(on ? 'ui:tileSel' : t.frameKey);
      t.setAlpha(on ? 1 : 0.6);
    }
    this.countText.setText(`${this.picked.length} / ${LOADOUT_MAX}`);
  }

  go() {
    if (!this.picked.length) return;
    const save = { ...getSave(this), loadout: this.picked.slice() };
    commitSave(this, save);
    this.scene.start('BattleScene', { levelId: this.levelId, loadout: this.picked.slice() });
  }
}
