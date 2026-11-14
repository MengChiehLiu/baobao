import Phaser from 'phaser';
import { generateAll } from '../art/textures.js';
import { load, save } from '../save.js';
import { FONT_FAMILY } from '../config.js';
import buns from '../data/buns.json';
import ingredients from '../data/ingredients.json';
import levels from '../data/levels.json';
import { enterLevel } from '../logic/progress.js';

function waitForFont(ms) {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.race([
    document.fonts.load(`32px ${FONT_FAMILY}`).catch(() => {}),
    new Promise((r) => setTimeout(r, ms)),
  ]);
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    waitForFont(3000).then(() => this.boot());
  }

  boot() {
    const zoom = this.registry.get('zoom');
    generateAll(this, zoom);

    let data = load();
    const dev = this.registry.get('dev') || {};
    if (dev.unlockAll) {
      data = {
        ...data,
        owned: Object.fromEntries(buns.map((b) => [b.id, 1])),
        tickets: 20,
        ingredients: Object.fromEntries(ingredients.map((i) => [i.id, 2])),
        cleared: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      };
      save(data);
    }
    this.registry.set('save', data);

    if (dev.level) {
      const level = levels.find((l) => l.id === dev.level);
      if (level) {
        data = enterLevel(data, level);
        this.registry.set('save', data);
        save(data);
      }
      this.scene.start('BattleScene', { levelId: dev.level });
    } else {
      this.scene.start('TitleScene');
    }
  }
}
