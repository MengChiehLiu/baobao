// 可愛的動作。數值為起始值，可以在遊戲裡調整。

export const ANIM = {
  popIn: { squashX: 1.3, squashY: 0.7, stretchX: 0.9, stretchY: 1.15, t1: 80, t2: 100, t3: 170 },
  breath: { amount: 0.03, period: 1800 },
  blink: { min: 3000, max: 6000, hold: 120 },
  windUp: { back: 0.88, t1: 100, t2: 140 },
  hurt: { flash: 80, shake: 2 },
  poof: { duration: 260 },
  press: { scale: 0.92, duration: 70 },
};

const base = (s) => s.baseScale ?? 1;

export function popIn(scene, s) {
  const b = base(s);
  const a = ANIM.popIn;
  s.setScale(b * a.squashX, b * a.squashY);
  scene.tweens.chain({
    targets: s,
    tweens: [
      { scaleX: b * a.stretchX, scaleY: b * a.stretchY, duration: a.t1, ease: 'Quad.easeOut' },
      { scaleX: b * 1.05, scaleY: b * 0.97, duration: a.t2, ease: 'Sine.easeInOut' },
      { scaleX: b, scaleY: b, duration: a.t3, ease: 'Back.easeOut' },
    ],
  });
}

export function idleBreath(scene, s) {
  const b = base(s);
  return scene.tweens.add({
    targets: s,
    scaleY: b * (1 + ANIM.breath.amount),
    scaleX: b * (1 - ANIM.breath.amount / 2),
    duration: ANIM.breath.period / 2,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    delay: Math.random() * ANIM.breath.period,
  });
}

export function startBlink(scene, s, key) {
  const loop = () => {
    if (!s.active) return;
    s.setTexture(`${key}:blink`);
    scene.time.delayedCall(ANIM.blink.hold, () => {
      if (s.active) s.setTexture(key);
    });
    scene.time.delayedCall(ANIM.blink.min + Math.random() * (ANIM.blink.max - ANIM.blink.min), loop);
  };
  scene.time.delayedCall(Math.random() * ANIM.blink.max, loop);
}

export function windUp(scene, s) {
  const b = base(s);
  if (s.windingUp) return;
  s.windingUp = true;
  scene.tweens.chain({
    targets: s,
    tweens: [
      { scaleX: b * ANIM.windUp.back, scaleY: b * 1.08, duration: ANIM.windUp.t1, ease: 'Quad.easeOut' },
      { scaleX: b * 1.08, scaleY: b * 0.94, duration: ANIM.windUp.t2 / 2, ease: 'Quad.easeOut' },
      { scaleX: b, scaleY: b, duration: ANIM.windUp.t2 / 2, ease: 'Back.easeOut' },
    ],
    onComplete: () => { s.windingUp = false; },
  });
}

export function hurt(scene, s) {
  if (!s.active) return;
  s.setTintFill(0xffffff);
  scene.time.delayedCall(ANIM.hurt.flash, () => { if (s.active) s.clearTint(); });
  const x0 = s.x;
  scene.tweens.add({
    targets: s,
    x: { from: x0 - ANIM.hurt.shake, to: x0 + ANIM.hurt.shake },
    duration: 40,
    yoyo: true,
    repeat: 1,
    onComplete: () => { if (s.active) s.x = x0; },
  });
}

export function poof(scene, s, fx) {
  const b = base(s);
  if (fx) fx.burst('star', s.x, s.y, 5);
  scene.tweens.add({
    targets: s,
    scaleX: b * 0.2,
    scaleY: b * 0.2,
    alpha: 0,
    duration: ANIM.poof.duration,
    ease: 'Back.easeIn',
    onComplete: () => s.destroy(),
  });
}

export function buttonPress(scene, s, done) {
  const b = base(s);
  scene.tweens.add({
    targets: s,
    scaleX: b * ANIM.press.scale,
    scaleY: b * ANIM.press.scale,
    duration: ANIM.press.duration,
    yoyo: true,
  });
  // 用計時器而不是等動畫結束：暫停畫面時動畫會被停住，但計時器不會
  if (done) scene.time.delayedCall(ANIM.press.duration * 2, done);
}
