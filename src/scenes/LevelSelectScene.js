import Phaser from 'phaser';
import { setupCamera, text, button, backButton, str, getSave } from './common.js';
import { makeSprite } from '../art/textures.js';
import { isPlayable } from '../logic/progress.js';
import levels from '../data/levels.json';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    setupCamera(this);
    makeSprite(this, 480, 270, 'ui:bg').setAlpha(0.4);
    const save = getSave(this);
    backButton(this, () => this.scene.start('MenuScene'));
    text(this, 480, 64, str('selectLevel'), 40);

    levels.forEach((level, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = 200 + col * 140;
      const y = 200 + row * 160;
      const cleared = save.cleared.includes(level.id);
      const playable = isPlayable(save, level.id);
      const next = playable && !cleared;
      const b = button(this, x, y, String(level.id), () => this.scene.start('LoadoutScene', { levelId: level.id }), {
        key: next ? 'ui:levelNext' : 'ui:level', fontSize: 44,
      });
      if (!playable) {
        b.setEnabled(false);
        b.add(makeSprite(this, 34, -30, 'ui:lock'));
      }
      if (next) {
        this.tweens.add({ targets: b, scale: 1.07, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      const stars = save.stars?.[level.id] || 0;
      for (let s = 0; s < 3; s++) {
        const icon = makeSprite(this, x - 28 + s * 28, y + 62, s < stars ? 'ui:star' : 'ui:starOff');
        if (!playable) icon.setAlpha(0.4);
      }
      if (playable) text(this, x, y - 64, level.name, 15);
    });
  }
}
