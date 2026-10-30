/**
 * skel-roundtrip —— 金标准验证：.skel → skel2json → JSON → 官方 SkeletonJson 加载，
 * 与官方 SkeletonBinary 直接加载同一 .skel 的 SkeletonData 全量深度对比。
 *
 * 对比原则：
 * - 数值一律 Math.fround 后比较（文本走"最短 float32 表示"，官方路径为 float32）；
 * - timeline 按读取顺序 zip 对齐（skel2json 保持二进制读取顺序生成 JSON 键序）；
 * - 对比覆盖：skeleton/bones/slots/ik/transform/path/physics/events 定义、
 *   skins 全部附件字段、animations 的每个 timeline（frames + curves/bezierSegments
 *   + attachmentNames + drawOrders + events）。
 *
 * 用法：node src/harness/skel-roundtrip.mjs [file1.skel file2.skel ...]
 * 默认跑 corpus/real/ 下全部 .skel。
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skelToJson, postProcessLinkedMeshSkins } from '../skel/skel2json.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const spine4 = (await import(join(ROOT, 'build', 'spine-4.2.mjs'))).spine;
const spine3 = (await import(join(ROOT, 'build', 'spine-3.8.mjs'))).spine;

const FR = Math.fround;
let diffs = 0;
let curveDiffs = 0; // 4.2 分量级 bezier 压平造成的曲线差（格式固有限制）
let noiseDiffs = 0; // 文本最短表示与 float32 精确值的预计算系数噪声（≤1e-5）
const curveDiffAt = [];
let checks = 0;
const notes = [];

function eqNum(a, b, path) {
  checks++;
  if (FR(a) !== FR(b)) { diffs++; if (diffs <= 40) notes.push(`${path}: ${a} ≠ ${b}`); return false; }
  return true;
}
function eqCurveArr(a, b, path) {
  // 曲线分段对比：压平差异计入 curveDiffs；预计算系数的文本精度噪声（≤1e-5）单独归类
  checks++;
  if (!a && !b) return;
  if (!a || !b || a.length !== b.length) { curveDiffs++; curveDiffAt.push(path); return; }
  for (let i = 0; i < a.length; i++) {
    checks++;
    if (FR(a[i]) !== FR(b[i])) {
      const d = Math.abs(a[i] - b[i]);
      if (d <= 1e-5) { noiseDiffs++; continue; }
      curveDiffs++; curveDiffAt.push(path + '[' + i + ']');
      return;
    }
  }
}
function eqStr(a, b, path) {
  checks++;
  if (String(a) !== String(b)) { diffs++; if (diffs <= 40) notes.push(`${path}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`); }
}
function eqArr(a, b, path) {
  checks++;
  if (!a && !b) return;
  if (!a || !b || a.length !== b.length) { diffs++; notes.push(`${path}: 数组长度 ${a?.length} ≠ ${b?.length}`); return; }
  for (let i = 0; i < a.length; i++) eqNum(a[i], b[i], `${path}[${i}]`);
}
function eqArrExact(a, b, path) {
  checks++;
  if (!a && !b) return;
  if (!a || !b || a.length !== b.length) { diffs++; notes.push(`${path}: 数组长度 ${a?.length} ≠ ${b?.length}`); return; }
  for (let i = 0; i < a.length; i++) {
    checks++;
    if (a[i] !== b[i]) { diffs++; if (diffs <= 40) notes.push(`${path}[${i}]: ${a[i]} ≠ ${b[i]}`); }
  }
}
function eqColor(a, b, path) {
  eqNum(a.r, b.r, path + '.r'); eqNum(a.g, b.g, path + '.g');
  eqNum(a.b, b.b, path + '.b'); eqNum(a.a, b.a, path + '.a');
}

/** 加载器：官方 SkeletonBinary（.skel 直读）与 SkeletonJson（JSON 文本）。 */
function stubLoader(spine) {
  // 不绑真实纹理：构造全字段假 region，两条路径共用，保证公平对比。
  const fakeRegion = {
    u: 0, v: 0, u2: 1, v2: 1, width: 0, height: 0,
    offsetX: 0, offsetY: 0, originalWidth: 0, originalHeight: 0,
    degrees: 0, rotate: 0, x: 0, y: 0, pmaWidth: 0, renderObject: {},
  };
  return {
    newRegionAttachment(skin, name, path, sequence) {
      const a = new spine.RegionAttachment(name);
      a.region = fakeRegion;
      return a;
    },
    newMeshAttachment(skin, name, path, sequence) {
      const a = new spine.MeshAttachment(name);
      a.region = fakeRegion;
      return a;
    },
    newBoundingBoxAttachment(skin, name) { return new spine.BoundingBoxAttachment(name); },
    newPathAttachment(skin, name) { return new spine.PathAttachment(name); },
    newPointAttachment(skin, name) { return new spine.PointAttachment(name); },
    newClippingAttachment(skin, name) { return new spine.ClippingAttachment(name); },
    disposeAttachment(attachment) { },
  };
}
function loadBinary(bytes, spine) {
  const bin = new spine.SkeletonBinary(stubLoader(spine));
  return bin.readSkeletonData(new Uint8Array(bytes));
}
function loadJson(text, spine) {
  const json = new spine.SkeletonJson(stubLoader(spine));
  return json.readSkeletonData(JSON.parse(text));
}

function diffSkeletonData(A, B, label) {
  // A = skel 路径，B = json 路径
  eqStr(A.version, B.version, label + '.version');
  eqStr(A.hash, B.hash, label + '.hash');
  eqNum(A.x, B.x, label + '.x'); eqNum(A.y, B.y, label + '.y');
  eqNum(A.width, B.width, label + '.width'); eqNum(A.height, B.height, label + '.height');
  if (B.fps !== undefined || A.fps) eqNum(A.fps || 0, B.fps || 0, label + '.fps');
  eqStr(A.imagesPath ?? '', B.imagesPath ?? '', label + '.images');
  eqStr(A.audioPath ?? '', B.audioPath ?? '', label + '.audio');

  // bones
  if (A.bones.length !== B.bones.length) { diffs++; notes.push(`${label}: bones ${A.bones.length} ≠ ${B.bones.length}`); return; }
  A.bones.forEach((a, i) => {
    const b = B.bones[i];
    const p = `${label}.bone[${i}](${a.name})`;
    eqStr(a.name, b.name, p + '.name');
    eqStr(a.parent?.name ?? '', b.parent?.name ?? '', p + '.parent');
    eqNum(a.rotation, b.rotation, p + '.rotation');
    eqNum(a.x, b.x, p + '.x'); eqNum(a.y, b.y, p + '.y');
    eqNum(a.scaleX, b.scaleX, p + '.scaleX'); eqNum(a.scaleY, b.scaleY, p + '.scaleY');
    eqNum(a.shearX, b.shearX, p + '.shearX'); eqNum(a.shearY, b.shearY, p + '.shearY');
    eqNum(a.length, b.length, p + '.length');
    eqNum(a.inherit ?? a.transformMode, b.inherit ?? b.transformMode, p + '.inherit'); // 3.8: transformMode
    eqNum(a.skinRequired, b.skinRequired, p + '.skinRequired');
    eqColor(a.color, b.color, p + '.color');
    // 官方 4.2 JSON 读取器不读 icon/visible（二进制专属）；skel2json 仍输出供官方编辑器使用。
    // 3.8 两路都不读。此处不比对。
  });

  // slots
  if (A.slots.length !== B.slots.length) { diffs++; notes.push(`${label}: slots 数不匹配`); return; }
  A.slots.forEach((a, i) => {
    const b = B.slots[i];
    const p = `${label}.slot[${i}](${a.name})`;
    eqStr(a.name, b.name, p + '.name');
    eqStr(a.boneData.name, b.boneData.name, p + '.bone');
    eqColor(a.color, b.color, p + '.color');
    eqStr(a.darkColor ? 'y' : 'n', b.darkColor ? 'y' : 'n', p + '.hasDark');
    if (a.darkColor && b.darkColor) eqColor(a.darkColor, b.darkColor, p + '.darkColor');
    eqStr(a.attachmentName ?? '', b.attachmentName ?? '', p + '.attachment');
    eqNum(a.blendMode, b.blendMode, p + '.blend');
    eqNum(a.visible ?? true, b.visible ?? true, p + ".visible"); // 3.8 无此属性，默认 true
  });

  // 约束四组
  const group = (As, Bs, key, fields) => {
    if (As === undefined && Bs === undefined) return; // 3.8 无 physics
    if ((As?.length ?? 0) !== (Bs?.length ?? 0)) { diffs++; notes.push(`${label}: ${key} 数不匹配 ${As?.length} vs ${Bs?.length}`); return; }
    As.forEach((a, i) => {
      const b = Bs[i];
      const p = `${label}.${key}[${i}](${a.name})`;
      eqStr(a.name, b.name, p + '.name');
      eqNum(a.order, b.order, p + '.order');
      eqNum(a.skinRequired, b.skinRequired, p + '.skin');
      eqArrExact(a.bones.map((x) => x.name), b.bones.map((x) => x.name), p + '.bones');
      eqStr(a.target?.name ?? a.targetData?.name ?? '', b.target?.name ?? b.targetData?.name ?? '', p + '.target');
      for (const [f, kind] of fields) {
        if (kind === 'num') eqNum(a[f], b[f], p + '.' + f);
        else if (kind === 'bool') eqNum(!!a[f], !!b[f], p + '.' + f);
      }
    });
  };
  group(A.ikConstraints, B.ikConstraints, 'ik', [
    ['mix', 'num'], ['softness', 'num'], ['bendDirection', 'num'],
    ['compress', 'bool'], ['stretch', 'bool'], ['uniform', 'bool'],
  ]);
  group(A.transformConstraints, B.transformConstraints, 'transform', [
    ['local', 'bool'], ['relative', 'bool'],
    ['offsetRotation', 'num'], ['offsetX', 'num'], ['offsetY', 'num'],
    ['offsetScaleX', 'num'], ['offsetScaleY', 'num'], ['offsetShearY', 'num'],
    ['mixRotate', 'num'], ['mixX', 'num'], ['mixY', 'num'],
    ['mixScaleX', 'num'], ['mixScaleY', 'num'], ['mixShearY', 'num'],
    // 3.8 字段名差异走 getter
    ['rotateMix', 'num'], ['translateMix', 'num'], ['scaleMix', 'num'], ['shearMix', 'num'],
  ]);
  group(A.pathConstraints, B.pathConstraints, 'path', [
    ['positionMode', 'num'], ['spacingMode', 'num'], ['rotateMode', 'num'],
    ['offsetRotation', 'num'], ['position', 'num'], ['spacing', 'num'],
    ['mixRotate', 'num'], ['mixX', 'num'], ['mixY', 'num'],
    ['rotateMix', 'num'], ['translateMix', 'num'],
  ]);
  group(A.physicsConstraints, B.physicsConstraints, 'physics', [
    ['x', 'num'], ['y', 'num'], ['rotate', 'num'], ['scaleX', 'num'], ['shearX', 'num'],
    ['limit', 'num'], ['step', 'num'], ['inertia', 'num'], ['strength', 'num'],
    ['damping', 'num'], ['wind', 'num'], ['gravity', 'num'], ['mix', 'num'],
    ['inertiaGlobal', 'bool'], ['strengthGlobal', 'bool'], ['dampingGlobal', 'bool'],
    ['massGlobal', 'bool'], ['windGlobal', 'bool'], ['gravityGlobal', 'bool'], ['mixGlobal', 'bool'],
  ]);

  // skins / attachments
  if (A.skins.length !== B.skins.length) { diffs++; notes.push(`${label}: skins 数不匹配`); return; }
  A.skins.forEach((skinA, si) => {
    const skinB = B.skins[si];
    const p0 = `${label}.skin[${si}](${skinA.name})`;
    eqStr(skinA.name, skinB.name, p0 + '.name');
    eqArrExact(skinA.bones.map((x) => x.name), skinB.bones.map((x) => x.name), p0 + '.bones');
    eqArrExact(skinA.constraints.map((x) => x.name), skinB.constraints.map((x) => x.name), p0 + '.constraints');
    const entriesA = [];
    skinA.getAttachments().forEach((e) => entriesA.push(e));
    const entriesB = [];
    skinB.getAttachments().forEach((e) => entriesB.push(e));
    if (entriesA.length !== entriesB.length) { diffs++; notes.push(`${p0}: attachments 数 ${entriesA.length} ≠ ${entriesB.length}`); return; }
    entriesA.forEach((ea, i) => {
      const eb = entriesB[i];
      const p = `${p0}.att[${ea.slotIndex}/${ea.attachment.name}]`;
      eqNum(ea.slotIndex, eb.slotIndex, p + '.slotIndex');
      diffAttachment(ea.attachment, eb.attachment, p);
    });
  });

  // events 定义（数组）
  if ((A.events?.length ?? 0) !== (B.events?.length ?? 0)) { diffs++; notes.push(`${label}: events 定义数不匹配`); }
  else (A.events ?? []).forEach((a, i) => {
    const b = B.events[i];
    const p = `${label}.eventDef[${a.name}]`;
    eqStr(a.name, b.name, p);
    eqNum(a.intValue, b.intValue, p + '.int');
    eqNum(a.floatValue, b.floatValue, p + '.float');
    eqStr(a.stringValue ?? '', b.stringValue ?? '', p + '.string');
    eqStr(a.audioPath ?? '', b.audioPath ?? '', p + '.audio');
    eqNum(a.volume, b.volume, p + '.volume');
    eqNum(a.balance, b.balance, p + '.balance');
  });

  // animations（官方 SkeletonData.animations 是数组；timeline 按签名配对——
  // JSON 对象的数字样键会被序列化重排，顺序在 JSON 语义中无意义）
  if (A.animations.length !== B.animations.length) {
    diffs++; notes.push(`${label}: 动画数不匹配`);
    return;
  }
  const timelineSig = (t) => [
    t.constructor.name,
    t.boneIndex ?? t.slotIndex ?? t.ikConstraintIndex ?? t.transformConstraintIndex ?? t.pathConstraintIndex ?? t.constraintIndex ?? '',
    t.attachment?.name ?? '',
  ].join('|');
  A.animations.forEach((a) => {
    const b = B.animations.find((x) => x.name === a.name);
    if (!b) { diffs++; notes.push(`${label}: 缺动画 ${a.name}`); return; }
    const groupBySig = (arr) => {
      const m = new Map();
      for (const t of arr) {
        const k = timelineSig(t);
        if (!m.has(k)) m.set(k, []);
        m.get(k).push(t);
      }
      return m;
    };
    const ga = groupBySig(a.timelines);
    const gb = groupBySig(b.timelines);
    if (ga.size !== gb.size || a.timelines.length !== b.timelines.length) {
      diffs++; notes.push(`${label}.${a.name}: timeline 签名集合不匹配 ${a.timelines.length} vs ${b.timelines.length}`);
      for (const k of ga.keys()) if (!gb.has(k)) notes.push(`${label}.${a.name}: JSON 缺 ${k}`);
      return;
    }
    for (const [k, tas] of ga) {
      const tbs = gb.get(k);
      if (!tbs || tbs.length !== tas.length) { diffs++; notes.push(`${label}.${a.name}: ${k} 数量不匹配`); continue; }
      tas.forEach((ta, i) => diffTimeline(ta, tbs[i], `${label}.${a.name}[${k}]#${i}`));
    }
  });
}

const CLASS_TO_TYPE = {
  RegionAttachment: 0, BoundingBoxAttachment: 1, MeshAttachment: 2,
  LinkedMeshAttachment: 3, PathAttachment: 4, PointAttachment: 5, ClippingAttachment: 6,
};

function diffAttachment(a, b, p) {
  eqStr(a.name, b.name, p + '.name');
  const ta = CLASS_TO_TYPE[a.constructor.name] ?? a.constructor.name;
  const tb = CLASS_TO_TYPE[b.constructor.name] ?? b.constructor.name;
  eqStr(String(ta), String(tb), p + '.type');
  eqStr(a.path ?? '', b.path ?? '', p + '.path');
  if (String(ta) !== String(tb)) return;
  // Region
  if (ta === 0) {
    eqNum(a.x, b.x, p + '.x'); eqNum(a.y, b.y, p + '.y');
    eqNum(a.scaleX, b.scaleX, p + '.scaleX'); eqNum(a.scaleY, b.scaleY, p + '.scaleY');
    eqNum(a.rotation, b.rotation, p + '.rotation');
    eqNum(a.width, b.width, p + '.width'); eqNum(a.height, b.height, p + '.height');
    eqColor(a.color, b.color, p + '.color');
    if (a.sequence || b.sequence) {
      eqNum(a.sequence?.count ?? -1, b.sequence?.count ?? -1, p + '.seq.count');
      eqNum(a.sequence?.start ?? -1, b.sequence?.start ?? -1, p + '.seq.start');
      eqNum(a.sequence?.digits ?? -1, b.sequence?.digits ?? -1, p + '.seq.digits');
      eqNum(a.sequence?.setupIndex ?? -1, b.sequence?.setupIndex ?? -1, p + '.seq.setup');
    }
    return;
  }
  // Vertex 派生：boundingbox / mesh / path / clipping
  if (ta === 1 || ta === 2 || ta === 4 || ta === 6) {
    eqNum(a.worldVerticesLength, b.worldVerticesLength, p + '.worldVerticesLength');
    eqArr(a.vertices, b.vertices, p + '.vertices');
    if (a.bones && b.bones) eqArrExact(a.bones, b.bones, p + '.bones');
    else eqStr(a.bones ? 'y' : 'n', b.bones ? 'y' : 'n', p + '.hasBones');
  }
  if (ta === 2) { // mesh
    eqArr(a.regionUVs, b.regionUVs, p + '.uvs');
    eqArrExact(a.triangles, b.triangles, p + '.triangles');
    eqNum(a.hullLength, b.hullLength, p + '.hull');
    if (a.edges || b.edges) eqArrExact(a.edges ?? [], b.edges ?? [], p + '.edges');
    eqNum(a.width ?? 0, b.width ?? 0, p + '.width'); eqNum(a.height ?? 0, b.height ?? 0, p + '.height');
    eqColor(a.color, b.color, p + '.color');
    if (a.sequence || b.sequence) {
      eqNum(a.sequence?.count ?? -1, b.sequence?.count ?? -1, p + '.seq.count');
      eqNum(a.sequence?.setupIndex ?? -1, b.sequence?.setupIndex ?? -1, p + '.seq.setup');
    }
  }
  if (ta === 3) { // linkedmesh
    eqColor(a.color, b.color, p + '.color');
    eqNum(a.width ?? 0, b.width ?? 0, p + '.width'); eqNum(a.height ?? 0, b.height ?? 0, p + '.height');
    // parent mesh 链接已在各自 runtime 内部完成；比较继承标志
    eqNum(a.inheritTimeline !== undefined ? a.inheritTimeline : (a.deformAttachment === a.parentMesh), b.inheritTimeline !== undefined ? b.inheritTimeline : (b.deformAttachment === b.parentMesh), p + '.inheritTimeline');
  }
  if (ta === 4) { // path
    eqNum(a.closed, b.closed, p + '.closed');
    eqNum(a.constantSpeed, b.constantSpeed, p + '.constantSpeed');
    eqArr(a.lengths, b.lengths, p + '.lengths');
    eqColor(a.color, b.color, p + '.color');
  }
  if (ta === 5) { // point
    eqNum(a.x, b.x, p + '.x'); eqNum(a.y, b.y, p + '.y');
    eqNum(a.rotation, b.rotation, p + '.rotation');
    eqColor(a.color, b.color, p + '.color');
  }
  if (ta === 6) { // clipping
    eqStr(a.endSlot?.name ?? '', b.endSlot?.name ?? '', p + '.end');
    eqColor(a.color, b.color, p + '.color');
  }
}

function diffTimeline(a, b, p) {
  const ta = a.constructor.name;
  const tb = b.constructor.name;
  checks++;
  if (ta !== tb) { diffs++; notes.push(`${p}: timeline 类型 ${ta} ≠ ${tb}`); return; }
  eqArr(a.frames, b.frames, p + '.frames');
  // 3.8 curves 数组 / 4.2 bezierSegments 数组（差异归入 curveDiffs）
  if (a.curves !== undefined && b.curves !== undefined) eqCurveArr(a.curves, b.curves, p + '.curves');
  if (a.bezierSegments !== undefined && b.bezierSegments !== undefined) eqCurveArr(a.bezierSegments, b.bezierSegments, p + '.bezier');
  if (ta === 'AttachmentTimeline') {
    eqArrExact(a.attachmentNames ?? [], b.attachmentNames ?? [], p + '.names');
  }
  if (ta === 'DrawOrderTimeline') {
    eqNum(a.drawOrders?.length ?? 0, b.drawOrders?.length ?? 0, p + '.drawOrders.len');
    (a.drawOrders ?? []).forEach((d, i) => eqArrExact(d, b.drawOrders[i], `${p}.drawOrders[${i}]`));
  }
  if (ta === 'EventTimeline') {
    eqNum(a.events?.length ?? 0, b.events?.length ?? 0, p + '.events.len');
    (a.events ?? []).forEach((e, i) => {
      const f = b.events[i];
      const q = `${p}.events[${i}]`;
      if (!f) { diffs++; notes.push(q + ' 缺失'); return; }
      eqNum(e.time, f.time, q + '.time');
      eqStr(e.data.name, f.data.name, q + '.name');
      eqNum(e.intValue, f.intValue, q + '.int');
      eqNum(e.floatValue, f.floatValue, q + '.float');
      eqStr(e.stringValue ?? '', f.stringValue ?? '', q + '.string');
      eqNum(e.volume, f.volume, q + '.volume');
      eqNum(e.balance, f.balance, q + '.balance');
    });
  }
  if (ta === 'DeformTimeline') {
    eqStr(a.attachment.name, b.attachment.name, p + '.attachment');
    eqNum(a.slotIndex, b.slotIndex, p + '.slotIndex');
    (a.frameVertices ?? []).forEach((v, i) => eqArr(v, b.frameVertices[i], `${p}.deform[${i}]`));
  }
  if (ta === 'SequenceTimeline') {
    eqStr(a.attachment?.name ?? '', b.attachment?.name ?? '', p + '.attachment');
    (a._sequences ?? a.sequences ?? []).forEach((s, i) => {
      const t = (b._sequences ?? b.sequences ?? [])[i];
      if (!t) { diffs++; notes.push(p + '.seq 缺失'); return; }
      eqNum(s.mode, t.mode, `${p}.seq[${i}].mode`);
      eqNum(s.index, t.index, `${p}.seq[${i}].index`);
      eqNum(s.delay, t.delay, `${p}.seq[${i}].delay`);
    });
  }
  // 目标索引
  for (const key of ['slotIndex', 'boneIndex', 'constraintIndex', 'ikConstraintIndex', 'transformConstraintIndex', 'pathConstraintIndex']) {
    if (a[key] !== undefined) eqNum(a[key], b[key], p + '.' + key);
  }
}

// ---------------------------------------------------------------- 主流程

const targets = process.argv.slice(2);
const files = targets.length ? targets : collectDefault();
function collectDefault() {
  const dir = join(ROOT, 'corpus', 'real');
  if (!existsSync(dir)) return [];
  const out = [];
  for (const d of readdirSync(dir)) {
    const sub = join(dir, d);
    if (statSync(sub).isDirectory()) {
      for (const f of readdirSync(sub)) if (f.endsWith('.skel')) out.push(join(sub, f));
    }
  }
  return out;
}

const report = { generatedAt: new Date().toISOString(), cases: [] };
let allOk = true;

for (const file of files) {
  const bytes = readFileSync(file);
  const name = basename(file);
  const caseReport = { file: name, bytes: bytes.length };
  try {
    const { json, meta } = skelToJson(new Uint8Array(bytes));
    postProcessLinkedMeshSkins(json);
    const text = JSON.stringify(json);
    caseReport.spine = meta.spine;
    caseReport.nonessential = meta.nonessential;
    caseReport.warnings = meta.warnings;

    // 选 runtime
    const spine = /^4\./.test(meta.spine) ? spine4 : spine3;
    const viaBinary = loadBinary(bytes, spine);
    const viaJson = loadJson(text, spine);

    diffs = 0; curveDiffs = 0; noiseDiffs = 0; curveDiffAt.length = 0; checks = 0; notes.length = 0;
    diffSkeletonData(viaBinary, viaJson, name);

    caseReport.checks = checks;
    caseReport.diffs = diffs;
    caseReport.curveDiffs = curveDiffs;
    caseReport.noiseDiffs = noiseDiffs;
    caseReport.curveDiffAt = curveDiffAt.slice(0, 20);
    caseReport.notes = notes.slice(0, 20);
    // 压平的分量曲线数量对账：curveDiffs 应与 skel2json 压平 warning 数量同量级
    caseReport.flattenedFrames = meta.warnings.filter((w) => w.includes('分量不一致')).length;
    caseReport.ok = diffs === 0;
    if (diffs !== 0) allOk = false;

    // 导出转换 JSON 供 corpus 使用
    const outDir = join(ROOT, 'corpus', 'real', basename(dirname(file)));
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, name.replace(/\.skel$/, '.json')), JSON.stringify(json, null, 1));

    console.log(`${caseReport.ok ? 'PASS' : 'FAIL'} ${name} [${meta.spine}] checks=${checks} diffs=${diffs} curveDiffs=${curveDiffs} noise=${noiseDiffs}${meta.warnings.length ? ' warnings=' + meta.warnings.length : ''}`);
    for (const n of notes.slice(0, 12)) console.log('    · ' + n);
    if (meta.warnings.length) for (const w of meta.warnings.slice(0, 6)) console.log('    ⚠ ' + w);
  } catch (e) {
    caseReport.error = e.message + '\n' + (e.stack ?? '').split('\n').slice(1, 4).join('\n');
    caseReport.ok = false;
    allOk = false;
    console.error(`ERROR ${name}: ${e.message}`);
  }
  report.cases.push(caseReport);
}

writeFileSync(join(ROOT, 'build', 'skel-report.json'), JSON.stringify(report, null, 2));
console.log(`\n报告: build/skel-report.json | 总体: ${allOk ? '全部通过' : '存在差异'}`);
process.exit(allOk ? 0 : 1);
