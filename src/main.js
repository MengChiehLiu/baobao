import Phaser from 'phaser';
import './style.css';
import { GAME_W, GAME_H, STEP } from './config.js';
import { step, place } from './logic/battle.js';
import { css } from './art/palette.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import MenuScene from './scenes/MenuScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import BattleScene from './scenes/BattleScene.js';
import ResultScene from './scenes/ResultScene.js';
import GachaScene from './scenes/GachaScene.js';
import SteamerScene from './scenes/SteamerScene.js';
import LoadoutScene from './scenes/LoadoutScene.js';
import CollectionScene from './scenes/CollectionScene.js';

const ZOOM = Math.min(window.devicePixelRatio || 1, 2);

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: GAME_W * ZOOM,
  height: GAME_H * ZOOM,
  backgroundColor: css('cream'),
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 },
  scene: [BootScene, TitleScene, MenuScene, LevelSelectScene, LoadoutScene, BattleScene, ResultScene, GachaScene, SteamerScene, CollectionScene],
});

game.registry.set('zoom', ZOOM);

// 開發模式的網址參數：?unlockAll、?level=N
if (import.meta.env.DEV) {
  const params = new URLSearchParams(window.location.search);
  game.registry.set('dev', {
    unlockAll: params.has('unlockAll'),
    level: params.has('level') ? Number(params.get('level')) : null,
    fps: params.has('fps'),
  });
} else {
  game.registry.set('dev', { unlockAll: false, level: null, fps: false });
}

// 手機轉成直向時，暫停戰鬥
const portrait = window.matchMedia('(orientation: portrait)');
const onOrientation = () => {
  if (!portrait.matches) return;
  const battle = game.scene.getScene('BattleScene');
  if (battle && game.scene.isActive('BattleScene') && battle.pauseGame) battle.pauseGame();
};
if (portrait.addEventListener) portrait.addEventListener('change', onOrientation);
else portrait.addListener(onOrientation);

if (import.meta.env.DEV) {
  window.__baobao = game;
  window.__step = (state) => step(state, STEP);
  window.__place = (id, col, row) => {
    const sc = game.scene.getScene('BattleScene');
    const res = place(sc.state, id, col, row);
    if (res.ok) sc.addBunView(res.bun, true);
    return res.ok || res.reason;
  };
}
