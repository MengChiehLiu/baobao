// 由格子轉折點建立敵人走的路。敵人位置只記錄「走了多遠」（d）。
import { FIELD, cellCenter } from '../config.js';

/**
 * @param {Array<[number, number]>} waypoints  格子座標 [col, row]，第一點在右邊場外、最後一點在左邊櫃台
 */
export function buildPath(waypoints) {
  const pts = waypoints.map(([c, r]) => cellCenter(c, r));
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len, start: total });
    total += len;
  }

  // 路上的格子，以及每格中心對應的 d
  const cells = new Map();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c0, r0] = waypoints[i];
    const [c1, r1] = waypoints[i + 1];
    const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
    const dc = Math.sign(c1 - c0);
    const dr = Math.sign(r1 - r0);
    for (let k = 0; k <= steps; k++) {
      const c = c0 + dc * k;
      const r = r0 + dr * k;
      if (c < 0 || c >= FIELD.cols || r < 0 || r >= FIELD.rows) continue;
      const key = `${c},${r}`;
      if (!cells.has(key)) cells.set(key, segs[i].start + k * FIELD.cell);
    }
  }

  function posAt(d) {
    if (d <= 0) return { x: pts[0].x, y: pts[0].y };
    for (const s of segs) {
      if (d <= s.start + s.len) {
        const t = (d - s.start) / s.len;
        return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
      }
    }
    const last = pts[pts.length - 1];
    return { x: last.x, y: last.y };
  }

  /** 朝向：-1 往左、1 往右（給敵人圖片翻面用）。 */
  function dirAt(d) {
    for (const s of segs) {
      if (d <= s.start + s.len) return Math.sign(s.b.x - s.a.x) || 0;
    }
    return -1;
  }

  return { waypoints, pts, segs, length: total, cells, posAt, dirAt };
}

export const isPathCell = (path, c, r) => path.cells.has(`${c},${r}`);
