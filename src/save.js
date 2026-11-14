import { SAVE_KEY } from './config.js';

export function defaultSave() {
  return {
    cleared: [],
    stars: {},
    owned: { charsiu: 1 },
    tickets: 0,
    pulls: 0,
    ingredients: {},
    loadout: [],
  };
}

function getStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** 舊版存檔（unlockedBuns 陣列）轉成新版（owned 物件）。 */
function migrate(data) {
  if (Array.isArray(data.unlockedBuns) && !data.owned) {
    data.owned = Object.fromEntries(data.unlockedBuns.map((id) => [id, 1]));
  }
  delete data.unlockedBuns;
  return data;
}

export function load(storage) {
  try {
    const s = getStorage(storage);
    if (!s) return defaultSave();
    const raw = s.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaultSave();
    return { ...defaultSave(), ...migrate(parsed) };
  } catch {
    return defaultSave();
  }
}

export function save(data, storage) {
  try {
    const s = getStorage(storage);
    if (!s) return false;
    s.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

let persistRequested = false;
export function requestPersist() {
  if (persistRequested) return;
  persistRequested = true;
  try {
    if (globalThis.navigator?.storage?.persist) {
      globalThis.navigator.storage.persist().catch(() => {});
    }
  } catch {
    // 不支援時忽略
  }
}
