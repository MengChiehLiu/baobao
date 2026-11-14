import Phaser from 'phaser';
import { setupCamera, text, button, str, getSave, commitSave } from './common.js';
import { makeSprite } from '../art/textures.js';
import { popIn, idleBreath } from '../art/anims.js';
import { createFx } from '../art/particles.js';
import { applyWin } from '../logic/progress.js';
import { css } from '../art/palette.js';
import levels from '../data/levels.json';
import ingredients from '../data/ingredients.json';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.levelId = data.levelId;
    this.won = data.won;
    this.stars = data.stars || 0;
    this.loadout = data.loadout;
  }

  create() {
    setupCamera(this);
    makeSprite(this, 480, 270, 'ui:bg').setAlpha(0.35);
    makeSprite(this, 480, 236, 'ui:panel');
    const fx = createFx(this);
    const level = levels.find((l) => l.id === this.levelId);

    if (this.won) {
      const res = applyWin(getSave(this), level, this.stars);
      commitSave(this, res.save);
      text(this, 480, 110, str('win'), 48, { stroke: css('cream'), strokeThickness: 8 });
      for (let i = 0; i < 3; i++) {
        const on = i < this.stars;
        const s = makeSprite(this, 420 + i * 60, 180, on ? 'ui:star' : 'ui:starOff');
        const b = s.baseScale * 1.8;
        s.setScale(0);
        this.tweens.add({ targets: s, scale: b, delay: 300 + i * 280, duration: 300, ease: 'Back.easeOut',
          onStart: () => { if (on) fx.burst('star', s.x, s.y, 5); } });
      }
      this.time.addEvent({ delay: 500, repeat: 5, callback: () => fx.burst('heart', 480 + Phaser.Math.Between(-180, 180), 250, 2) });

      let y = 250;
      if (res.ticketsGained) {
        makeSprite(this, 420, y, 'ui:ticket');
        text(this, 448, y, str('gotTickets', { n: res.ticketsGained }), 24, { originX: 0 });
        y += 50;
      }
      const got = Object.entries(res.ingredients);
      if (got.length) {
        text(this, 340, y, str('gotIngredients'), 20);
        got.forEach(([id, n], i) => {
          const icon = makeSprite(this, 450 + i * 110, y, `ing:${id}`);
          icon.setScale(icon.baseScale * 0.6);
          const name = ingredients.find((x) => x.id === id).name;
          text(this, 490 + i * 110, y, `×${n}`, 18, { originX: 0 });
          text(this, 450 + i * 110, y + 26, name, 14);
        });
      }
    } else {
      text(this, 480, 110, str('lose'), 48, { stroke: css('cream'), strokeThickness: 8 });
      const thief = makeSprite(this, 420, 230, 'enemy:mouse:0');
      thief.setScale(thief.baseScale * 1.5);
      const loot = makeSprite(this, 470, 222, 'bun:charsiu');
      loot.setScale(loot.baseScale * 0.6);
      this.tweens.add({ targets: [thief, loot], x: '-=30', duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const sad = makeSprite(this, 600, 236, 'bun:mantou:blink');
      idleBreath(this, sad);
      text(this, 480, 330, '換個位置、換幾個包子再試試看！', 20);
    }

    const save = getSave(this);
    const y = 466;
    const retry = () => this.scene.start('BattleScene', { levelId: this.levelId, loadout: this.loadout });
    if (save.tickets > 0) {
      button(this, 260, y, str('retry'), retry, { key: 'ui:btnAlt', width: 200 });
      const g = button(this, 480, y, `${str('toGacha')}×${save.tickets}`, () => this.scene.start('GachaScene'), { width: 200, fontSize: 26 });
      popIn(this, g);
      button(this, 700, y, str('toSelect'), () => this.scene.start('LevelSelectScene'), { key: 'ui:btnAlt', width: 200 });
    } else {
      button(this, 360, y, str('retry'), retry, { key: this.won ? 'ui:btnAlt' : 'ui:btn' });
      button(this, 620, y, str('toSelect'), () => this.scene.start('LevelSelectScene'), { key: this.won ? 'ui:btn' : 'ui:btnAlt' });
    }
  }
}
