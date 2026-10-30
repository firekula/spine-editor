/**
 * 结构化深度比较（归一化 diff）。
 *
 * 语义约定（与 Spine JSON 的语义一致）：
 * - 数组：有序比较（bones/attachments/timeline 键序都是真实语义）；
 * - 对象：无序字典比较（键集合相等即可，字段顺序不参与判定）；
 * - 数值：严格相等（JSON.parse → 双精度 → JSON.stringify 最短往返 → 再 parse，
 *   同一 double 的两种文本表示解析后必然 ===，因此任何不等都是真实差异）。
 *   -0 与 0 视为相等（=== 的语义）。
 */

export function deepDiff(a, b, opts = {}) {
  const max = opts.maxReport ?? 20;
  const diffs = [];
  walk(a, b, '$');
  return { equal: diffs.length === 0, diffs, truncated: diffs.length >= max };

  function walk(x, y, path) {
    if (diffs.length >= max) return;
    if (x === y) return;
    const tx = typeOf(x);
    const ty = typeOf(y);
    if (tx !== ty) {
      diffs.push({ path, kind: '类型不同', a: show(x), b: show(y) });
      return;
    }
    if (tx === 'array') {
      if (x.length !== y.length) {
        diffs.push({ path, kind: '数组长度不同', a: x.length, b: y.length });
      }
      const n = Math.min(x.length, y.length);
      for (let i = 0; i < n && diffs.length < max; i++) walk(x[i], y[i], `${path}[${i}]`);
    } else if (tx === 'object') {
      for (const k of Object.keys(x)) {
        if (!(k in y)) diffs.push({ path: `${path}.${k}`, kind: '仅金标准有', a: show(x[k]) });
      }
      for (const k of Object.keys(y)) {
        if (!(k in x)) diffs.push({ path: `${path}.${k}`, kind: '仅产物有', b: show(y[k]) });
      }
      for (const k of Object.keys(x)) {
        if (k in y && diffs.length < max) walk(x[k], y[k], `${path}.${k}`);
      }
    } else {
      diffs.push({ path, kind: '值不同', a: show(x), b: show(y) });
    }
  }

  function show(v) {
    if (typeof v === 'string') return JSON.stringify(v.length > 60 ? v.slice(0, 57) + '…' : v);
    const s = JSON.stringify(v);
    return s && s.length > 60 ? s.slice(0, 57) + '…' : s;
  }
}

function typeOf(v) {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}
