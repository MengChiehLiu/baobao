import Phaser from 'phaser';
import { setupCamera, text, button, str } from './common.js';
import { makeSprite } from '../art/textures.js';
import { popIn } from '../art/anims.js';
import { createFx } from '../art/particles.js';
import { requestPersist } from '../save.js';
import { css } from '../art/palette.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    setupCamera(this);
    makeSprite(this, 480, 270, 'ui:bg').setAlpha(0.5);
    const fx = createFx(this);

    const title = text(this, 480, 150, str('title'), 64, { stroke: css('cream'), strokeThickness: 10 });
    this.tweens.add({ targets: title, y: 158, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    text(this, 480, 220, str('subtitle'), 28);

    ['charsiu', 'xiaolong', 'mantou'].forEach((id, i) => {
      const s = makeSprite(this, 340 + i * 140, 330, `bun:${id}`);
      const b = s.baseScale;
      s.setScale(b * 1.3);
      s.baseScale = b * 1.3;
      this.time.delayedCall(200 + i * 180, () => popIn(this, s));
      this.tweens.add({
        targets: s, y: 300, duration: 420, yoyo: true, repeat: -1, ease: 'Quad.easeOut',
        delay: 600 + i * 220, repeatDelay: 500,
      });
      this.time.addEvent({ delay: 900, loop: true, callback: () => fx.puff(s.x + (Math.random() * 20 - 10), s.y - 40) });
    });

    button(this, 480, 450, str('start'), () => {
      requestPersist();
      this.scene.start('MenuScene');
    });
  }
}
