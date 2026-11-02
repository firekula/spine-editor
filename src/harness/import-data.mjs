#!/usr/bin/env node
/**
 * Import Data 自动化预检 harness（官方编辑器导入前的机器验证）。
 *
 * 背景：官方编辑器 Import Data 解析的就是 skeleton JSON 本身（与 runtime
 * SkeletonJson 同一格式家族）。本 harness 在不启动官方 GUI 的前提下，
 * 把"导入能否成功、导入后能编辑到什么程度"尽可能机器化：
 *
 *   语法/结构门（error 级）：JSON 合法、版本/骨架元信息、骨骼父子序、槽位/皮肤/
 *     附件/约束/动画的引用完整性、附件类型合法、网格数组自洽、atlas 区名可达、
 *     官方 spine-core 全量数据加载成功 —— 任何一条不过，Import Data 大概率报错。
 *   编辑能力门（warn/info 级）：nonessential 数据盘点（mesh hull/edges、骨头 icon、
 *     骨架 bounds、region 宽高）—— 决定导入后网格能否继续编辑、骨头图标是否保留。
 *
 * 每个语料跑两遍：金标准（原导出）与回环产物（本工具 serialize 输出，
 * 即产品真实回写路径），并要求两者运行时语义指纹一致。
 *
 * 用法：
 *   node src/harness/import-data.mjs [--corpus <dir>] [--only real|official] [-v]
 *   npm run test:importdata
 * 报告：build/import-data-report.json；产物 JSON 写入 build/import-data/。
 * 退出码：无 error 级失败为 0。
 */
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSpineJson, detectVersion } from '../ast/parse.mjs';
import { serialize } from '../ast/serialize.mjs';
import { loadSkeletonData, parseAtlas, fingerprint } from '../load/runtime.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(HERE, '../..');

// ---------- CLI ----------
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const CORPUS = flag('corpus') ?? join(PROJECT_ROOT, 'corpus');
const ONLY = flag('only') ?? 'all';
const VERBOSE = args.includes('-v') || args.includes('--verbose');

// ---------- 语料发现（同 roundtrip.mjs，另标注 真实素材/官方示例） ----------
function discover() {
  const items = [];
  if (!existsSync(CORPUS)) return items;
  const realNames = new Set();
  const realDir = join(CORPUS, 'real');
  if (existsSync(realDir)) {
    for (const d of readdirSync(realDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      for (const f of readdirSync(join(realDir, d.name))) {
        if (f.endsWith('.json')) realNames.add(f);
      }
    }
  }
  for (const dir of readdirSync(CORPUS, { withFileTypes: true })) {
    if (!dir.isDirectory() || !/^v\d+\.\d+$/.test(dir.name)) continue;
    const version = dir.name.slice(1);
    const dirPath = join(CORPUS, dir.name);
    for (const f of readdirSync(dirPath)) {
      if (!f.endsWith('.json')) continue;
      const base = join(dirPath, f.slice(0, -5));
      items.push({
        version,
        name: basename(f),
        source: realNames.has(f) ? '真实素材' : '官方示例',
        jsonPath: `${base}.json`,
        atlasPath: existsSync(`${base}.atlas`) ? `${base}.atlas` : null,
      });
    }
  }
  return items
    .filter((it) => (ONLY === 'all' ? true : ONLY === 'real' ? it.source === '真实素材' : it.source === '官方示例'))
    .sort((x, y) => x.version.localeCompare(y.version) || x.name.localeCompare(y.name));
}

// ---------- 小工具 ----------
const AT = { // 附件类型白名单（3.8.99 / 4.2 JSON 相同集合；region 为缺省）
  region: 1, mesh: 1, linkedmesh: 1, boundingbox: 1, path: 1, point: 1, clipping: 1,
};
const BLENDS = { additive: 1, multiply: 1, screen: 1, normal: 1 };

function gate(id, title) {
  return { id, title, level: 'error', errors: [], warns: [], infos: [] };
}
function done(g) {
  return g.errors.length === 0;
}

/** 4.2 Sequence 帧路径（复刻官方 Sequence.getPath：basePath + 零填充序号）。 */
function seqPath(basePath, seq, i) {
  const start = seq.start ?? 1;
  const digits = seq.digits ?? 1;
  let result = basePath;
  const frame = String(start + i);
  for (let k = digits - frame.length; k > 0; k--) result += '0';
  return result + frame;
}

/** 遍历全部附件（兼容 3.8.99+/4.x 的 skins 列表格式与更老的字典格式）。
 *  yield 的 name 为占位键（动画引用的就是它）；resolveName 为附件真实名
 *  （map.name ?? 占位键）；path = map.path ?? resolveName（与官方 readAttachment 一致）。 */
function* iterAttachments(ast) {
  const skins = ast.skins;
  if (Array.isArray(skins)) {
    for (const skin of skins) {
      for (const [slot, atts] of Object.entries(skin.attachments ?? {})) {
        for (const [name, att] of Object.entries(atts ?? {})) {
          const resolveName = att?.name ?? name;
          yield { skin: skin.name ?? 'default', slot, slotIsIndex: false, name, resolveName, path: att?.path ?? resolveName, att };
        }
      }
    }
  } else if (skins && typeof skins === 'object') {
    for (const [skinName, slots] of Object.entries(skins)) {
      for (const [slot, atts] of Object.entries(slots ?? {})) {
        for (const [name, att] of Object.entries(atts ?? {})) {
          const resolveName = att?.name ?? name;
          yield { skin: skinName, slot, slotIsIndex: skinName === 'default', name, resolveName, path: att?.path ?? resolveName, att };
        }
      }
    }
  }
}

/** 曲线键合法性。官方 readCurve 语义：
 *  "stepped" 或数值扁平数组；数组按分量索引（value<<2），多分量时间轴
 *  可为 4×分量数 元（rgba=16/rgb=12/translate=8/单分量=4）。3.8 固定 4 元。 */
function checkCurve(g, key, where, version) {
  const c = key.curve;
  if (c !== undefined && c !== 'stepped') {
    const ok = Array.isArray(c) && c.length >= 4 && c.length % 4 === 0 &&
      c.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
      (version === '4.2' || c.length === 4);
    if (!ok) {
      g.errors.push(`${where}: curve 值非法（${JSON.stringify(c).slice(0, 80)}${JSON.stringify(c).length > 80 ? '…' : ''}，须为 "stepped" 或 4 的倍数元数值数组）`);
    }
  }
  for (const ck of ['c2', 'c3', 'c4']) {
    const v = key[ck];
    if (v === undefined) continue;
    if (typeof v === 'number' || v === 'stepped') continue;
    g.errors.push(`${where}: 分量曲线 ${ck} 值非法（${JSON.stringify(v)}）`);
  }
}

// ---------- 预检主体：对一份 JSON 文本跑全部门 ----------
async function preflight(text, ctx) {
  const { version, atlasText, atlasDir } = ctx;
  const gates = [];
  let ast;
  try {
    ast = JSON.parse(text);
  } catch (e) {
    const g = gate('json', 'JSON 语法');
    g.errors.push(e.message);
    gates.push(g);
    return { gates };
  }

  // ---- G1 元信息 ----
  const g1 = gate('meta', '骨架元信息');
  const sk = ast.skeleton ?? {};
  const spineVer = sk.spine ?? sk.version;
  if (!spineVer) g1.errors.push('skeleton.spine/version 缺失（编辑器无法识别数据版本）');
  else if (!spineVer.startsWith(version + '.')) g1.errors.push(`版本线不符：数据 ${spineVer}，目标编辑器 ${version}.x`);
  if (typeof sk.hash !== 'string' || sk.hash.length === 0) g1.warns.push('skeleton.hash 缺失（不影响导入，但无法溯源）');
  for (const f of ['x', 'y', 'width', 'height']) {
    if (typeof sk[f] !== 'number') g1.warns.push(`skeleton.${f} 缺失（nonessential：影响编辑器画布初始包围盒）`);
  }
  if (typeof sk.fps !== 'number') g1.infos.push('skeleton.fps 缺失（编辑器按默认 30fps 展示）');
  gates.push(g1);

  // ---- G2 骨骼 ----
  const g2 = gate('bones', '骨骼结构');
  const boneNames = new Set();
  const boneOrder = [];
  for (const b of ast.bones ?? []) {
    if (!b?.name) { g2.errors.push('骨骼缺 name'); continue; }
    if (boneNames.has(b.name)) g2.errors.push(`骨骼重名：${b.name}`);
    boneNames.add(b.name);
    boneOrder.push(b.name);
    if (b.parent !== undefined) {
      if (!boneNames.has(b.parent)) g2.errors.push(`骨骼 ${b.name} 的 parent "${b.parent}" 未先定义（JSON 必须父先于子）`);
    }
  }
  gates.push(g2);

  // ---- G3 槽位 ----
  const g3 = gate('slots', '槽位结构');
  const slotNames = new Set();
  const slotIndex = new Map();
  (ast.slots ?? []).forEach((s, i) => {
    if (!s?.name) { g3.errors.push('槽位缺 name'); return; }
    if (slotNames.has(s.name)) g3.errors.push(`槽位重名：${s.name}`);
    slotNames.add(s.name);
    slotIndex.set(s.name, i);
    if (s.bone === undefined || !boneNames.has(s.bone)) g3.errors.push(`槽位 ${s.name} 引用不存在的骨骼 ${JSON.stringify(s.bone)}`);
    if (s.blend !== undefined && !BLENDS[s.blend]) g3.errors.push(`槽位 ${s.name} blend 非法：${s.blend}`);
  });
  gates.push(g3);

  // ---- atlas（供附件门使用） ----
  let atlasInfo = null;
  if (atlasText) {
    atlasInfo = await parseAtlas(version, atlasText);
    const gA = gate('atlas', 'atlas 完整性');
    for (const page of atlasInfo.pages) {
      // 页面 png 缺失不阻断 Import Data（数据照常导入，只是编辑器里暂时无图）
      if (!existsSync(join(atlasDir, page))) gA.warns.push(`atlas 页面文件不在旁边：${page}（导入不报错，但编辑器里无贴图显示）`);
    }
    if (atlasInfo.regions.length === 0) gA.errors.push('atlas 未解析出任何 region');
    gA.infos.push(`${atlasInfo.pages.length} 页 / ${atlasInfo.regions.length} 区`);
    gates.push(gA);
  } else {
    const gA = gate('atlas', 'atlas 完整性');
    gA.warns.push('未提供同名 .atlas（region 校验与运行时门按缺省跳过）');
    gates.push(gA);
  }
  const regionSet = new Set(atlasInfo?.regions ?? []);

  // ---- G4 附件 ----
  const g4 = gate('attachments', '附件与贴图引用');
  const defaultSkin = (ast.skins ?? []).find?.((s) => s.name === 'default');
  const meshStats = { total: 0, hull: 0, edges: 0 };
  const regionWH = { total: 0, withWH: 0 };
  let iconBones = 0;
  const attIndex = new Map(); // "skin|slot|name" -> att（linkedmesh 父查找）
  for (const it of iterAttachments(ast)) {
    const where = `皮肤「${it.skin}」槽位「${it.slot}」附件「${it.name}」`;
    if (it.slotIsIndex ? !(Number(it.slot) < (ast.slots ?? []).length) : !slotNames.has(it.slot)) {
      g4.errors.push(`${where}: 槽位不存在`);
      continue;
    }
    attIndex.set(`${it.skin}|${it.slot}|${it.name}`, it.att);
    const type = it.att.type ?? 'region';
    if (!AT[type]) g4.errors.push(`${where}: 未知附件类型 "${type}"`);
    const path = it.path; // 已按官方规则解析：map.path ?? map.name ?? 占位键
    // region/mesh 的贴图可达性（含 4.2 sequence 帧路径）
    if (type === 'region' || type === 'mesh') {
      if (it.att.sequence && version === '4.2') {
        const count = it.att.sequence.count ?? 0;
        for (let i = 0; i < count; i++) {
          const fp = seqPath(path, it.att.sequence, i);
          if (regionSet.size && !regionSet.has(fp)) g4.errors.push(`${where}: sequence 帧区域不在 atlas：${fp}`);
        }
      } else if (regionSet.size && !regionSet.has(path)) {
        g4.errors.push(`${where}: 区域不在 atlas：${path}`);
      }
    }
    if (type === 'linkedmesh') {
      // 官方规则：父附件在 map.skin 指定的皮肤里，缺省为 default 皮肤，同槽位，按占位键查找
      const parentSkin = it.att.skin ?? 'default';
      const parent = attIndex.get(`${parentSkin}|${it.slot}|${it.att.parent}`);
      if (!parent) g4.errors.push(`${where}: linkedmesh 父附件在皮肤「${parentSkin}」同槽位下不存在：${it.att.parent}`);
    }
    if (type === 'clipping') {
      if (!slotNames.has(it.att.end)) g4.errors.push(`${where}: clipping end 槽位不存在：${it.att.end}`);
      else if (slotIndex.get(it.att.end) <= slotIndex.get(it.slot)) g4.errors.push(`${where}: clipping end 槽位必须在其后`);
    }
    if (type === 'mesh' || type === 'linkedmesh') {
      meshStats.total++;
      if ('hull' in it.att) meshStats.hull++;
      if ('edges' in it.att) meshStats.edges++;
    }
    if (type === 'mesh') {
      // 官方以 uvs 长度为顶点数权威来源（加权网格 vertices 更长，不能比对长度）
      const uvs = it.att.uvs ?? [];
      const vertexCount = uvs.length / 2;
      if (uvs.length % 2 !== 0 || vertexCount < 3) g4.errors.push(`${where}: uvs 数量非法`);
      if (it.att.vertexCount !== undefined && it.att.vertexCount * 2 !== uvs.length) {
        g4.errors.push(`${where}: vertexCount(${it.att.vertexCount}) 与 uvs 推得(${vertexCount}) 不一致`);
      }
      if (it.att.triangles) {
        const bad = it.att.triangles.some((t) => t < 0 || t >= vertexCount);
        if (bad) g4.errors.push(`${where}: triangles 索引越界`);
      }
      if (typeof it.att.hull === 'number' && (it.att.hull < 3 || it.att.hull > vertexCount)) {
        g4.errors.push(`${where}: hull 越界`);
      }
    }
    if (type === 'region') {
      regionWH.total++;
      if (typeof it.att.width === 'number' && typeof it.att.height === 'number') regionWH.withWH++;
    }
  }
  gates.push(g4);

  // ---- G5 约束 ----
  const g5 = gate('constraints', '约束引用');
  const hasBone = (n) => boneNames.has(n);
  for (const c of ast.ik ?? []) {
    (c.bones ?? []).forEach((b) => { if (!hasBone(b)) g5.errors.push(`IK ${c.name}: 骨骼不存在 ${b}`); });
    if (!hasBone(c.target)) g5.errors.push(`IK ${c.name}: target 不存在 ${c.target}`);
  }
  for (const c of ast.transform ?? []) {
    (c.bones ?? []).forEach((b) => { if (!hasBone(b)) g5.errors.push(`transform ${c.name}: 骨骼不存在 ${b}`); });
    if (!hasBone(c.target)) g5.errors.push(`transform ${c.name}: target 不存在 ${c.target}`);
  }
  for (const c of ast.path ?? []) {
    (c.bones ?? []).forEach((b) => { if (!hasBone(b)) g5.errors.push(`path ${c.name}: 骨骼不存在 ${b}`); });
    if (!slotNames.has(c.target)) g5.errors.push(`path ${c.name}: target 槽位不存在 ${c.target}`);
  }
  for (const c of ast.physics ?? []) {
    if (!hasBone(c.bone)) g5.errors.push(`physics ${c.name}: 骨骼不存在 ${c.bone}`);
  }
  gates.push(g5);

  // ---- G6 动画 ----
  const g6 = gate('animations', '动画引用');
  const ikNames = new Set((ast.ik ?? []).map((c) => c.name));
  const tfNames = new Set((ast.transform ?? []).map((c) => c.name));
  const pathNames = new Set((ast.path ?? []).map((c) => c.name));
  const physNames = new Set((ast.physics ?? []).map((c) => c.name));
  const eventNames = new Set(Object.keys(ast.events ?? {}));
  const skinNames = new Set(
    Array.isArray(ast.skins) ? ast.skins.map((s) => s.name) : Object.keys(ast.skins ?? {}),
  );
  const frames = (arr) => (Array.isArray(arr) ? arr : []);
  for (const [anim, body] of Object.entries(ast.animations ?? {})) {
    const w = `动画「${anim}」`;
    for (const [bone, tls] of Object.entries(body.bones ?? {})) {
      if (!boneNames.has(bone)) g6.errors.push(`${w}: 时间轴骨骼不存在 ${bone}`);
      frames(tls).forEach((k) => checkCurve(g6, k, `${w} bones.${bone}`, version));
    }
    for (const [slot, tls] of Object.entries(body.slots ?? {})) {
      if (!slotNames.has(slot)) g6.errors.push(`${w}: 时间轴槽位不存在 ${slot}`);
      for (const [tlType, keys] of Object.entries(tls)) {
        frames(keys).forEach((k) => checkCurve(g6, k, `${w} slots.${slot}.${tlType}`, version));
        if (tlType === 'attachment') {
          frames(keys).forEach((k) => {
            if (k.name == null) return;
            let found = false;
            for (const it of iterAttachments(ast)) {
              if (it.slot === slot && it.name === k.name) { found = true; break; }
            }
            if (!found) g6.warns.push(`${w}: attachment 时间轴引用的附件不在任何皮肤中：${slot}/${k.name}（运行时不校验，编辑器导入可能提示缺失）`);
          });
        }
      }
    }
    for (const n of Object.keys(body.ik ?? {})) if (!ikNames.has(n)) g6.errors.push(`${w}: IK 约束不存在 ${n}`);
    for (const n of Object.keys(body.transform ?? {})) if (!tfNames.has(n)) g6.errors.push(`${w}: transform 约束不存在 ${n}`);
    for (const n of Object.keys(body.path ?? {})) if (!pathNames.has(n)) g6.errors.push(`${w}: path 约束不存在 ${n}`);
    // 官方源码：空名键合法（constraintIndex=-1，作用于全部约束的 reset 等）
    for (const n of Object.keys(body.physics ?? {})) {
      if (n !== '' && !physNames.has(n)) g6.errors.push(`${w}: physics 约束不存在 ${n}`);
    }
    // deform（4.x: animations.X.attachments；3.8.99+: animations.X.deform）
    const deformRoot = body.attachments ?? body.deform;
    for (const [skin, slots] of Object.entries(deformRoot ?? {})) {
      if (!skinNames.has(skin)) g6.errors.push(`${w}: deform 引用皮肤不存在 ${skin}`);
      for (const [slot, atts] of Object.entries(slots ?? {})) {
        if (!slotNames.has(slot)) g6.errors.push(`${w}: deform 引用槽位不存在 ${slot}`);
        for (const [aname, tl] of Object.entries(atts ?? {})) {
          const att = attIndex.get(`${skin}|${slot}|${aname}`) ?? attIndex.get(`default|${slot}|${aname}`);
          if (!att) g6.errors.push(`${w}: deform 引用附件不存在 ${skin}/${slot}/${aname}`);
          else if ((att.type ?? 'region') !== 'mesh' && att.type !== 'linkedmesh') g6.errors.push(`${w}: deform 目标不是网格 ${aname}`);
          frames(tl.deform ?? tl).forEach((k) => checkCurve(g6, k, `${w} deform ${slot}/${aname}`, version));
        }
      }
    }
    for (const f of frames(body.drawOrder)) {
      for (const o of f.offsets ?? []) {
        if (o.slot < 0 || o.slot >= (ast.slots ?? []).length) g6.errors.push(`${w}: drawOrder 槽位索引越界 ${o.slot}`);
        if (!Number.isInteger(o.offset)) g6.errors.push(`${w}: drawOrder offset 非整数 ${JSON.stringify(o.offset)}`);
      }
    }
    for (const f of frames(body.events)) {
      if (!eventNames.has(f.name)) g6.errors.push(`${w}: 事件未声明 ${f.name}`);
    }
  }
  gates.push(g6);

  // ---- G7 nonessential 盘点（info 级：决定导入后的可编辑性） ----
  const g7 = gate('nonessential', 'nonessential 编辑数据盘点');
  g7.level = 'info';
  if (meshStats.total > 0) {
    g7.infos.push(`网格 ${meshStats.total} 个：带 hull ${meshStats.hull}、带 edges ${meshStats.edges}`);
    if (meshStats.hull === 0) g7.warns.push('所有网格都缺 hull/edges（导出时未勾选 nonessential）：编辑器导入后网格不可再编辑顶点，仅可整体替换');
  }
  iconBones = (ast.bones ?? []).filter((b) => 'icon' in b).length;
  if (iconBones > 0) g7.infos.push(`骨头带 icon 标记 ${iconBones} 个（编辑器树形面板图标）`);
  if (regionWH.total > 0) g7.infos.push(`region 附件 ${regionWH.total} 个：带宽高 ${regionWH.withWH}（nonessential）`);
  gates.push(g7);

  // ---- G8 官方 runtime 全量加载 ----
  const g8 = gate('runtime', '官方 runtime 全量加载');
  let fp = null;
  if (!atlasText) {
    g8.warns.push('缺 atlas，跳过');
  } else {
    try {
      const sd = await loadSkeletonData(version, text, atlasText);
      fp = fingerprint(sd);
      g8.infos.push(`${fp.bones.length} 骨骼 / ${fp.slots.length} 槽位 / ${fp.skins.length} 皮肤 / ${fp.animations.length} 动画 / 约束 ${JSON.stringify(fp.constraints)}`);
    } catch (e) {
      g8.errors.push(`runtime 加载失败：${e.message}`);
    }
  }
  gates.push(g8);

  return { gates, fingerprint: fp };
}

// ---------- 主流程 ----------
const results = [];
let failed = 0;
mkdirSync(join(PROJECT_ROOT, 'build/import-data'), { recursive: true });

for (const item of discover()) {
  const entry = { ...item, gold: null, product: null, error: null };
  try {
    const goldText = readFileSync(item.jsonPath, 'utf8');
    const ast = parseSpineJson(goldText);
    const version = detectVersion(ast);
    if (version !== item.version) throw new Error(`语料标注 ${item.version}，实际 ${version}`);
    const productText = serialize(ast, { version });
    writeFileSync(join(PROJECT_ROOT, 'build/import-data', item.name), productText);

    const ctx = { version, atlasText: item.atlasPath ? readFileSync(item.atlasPath, 'utf8') : null, atlasDir: item.atlasPath ? dirname(item.atlasPath) : null };
    entry.gold = await preflight(goldText, ctx);
    entry.product = await preflight(productText, ctx);
    if (entry.gold.fingerprint && entry.product.fingerprint) {
      const same = JSON.stringify(entry.gold.fingerprint) === JSON.stringify(entry.product.fingerprint);
      entry.fingerprintMatch = same;
      if (!same) entry.error = '金标准与产物运行时指纹不一致';
    }
  } catch (e) {
    entry.error = e.message;
  }
  const bad = (entry.error ? 1 : 0) +
    (entry.gold?.gates.some((g) => g.errors.length) ? 1 : 0) +
    (entry.product?.gates.some((g) => g.errors.length) ? 1 : 0);
  if (bad) failed++;
  results.push(entry);
  printRow(entry);
}

// ---------- 汇总 ----------
console.log('\n' + '─'.repeat(78));
const errCount = results.reduce((n, r) => n + countLevel(r, 'errors'), 0);
const warnCount = results.reduce((n, r) => n + countLevel(r, 'warns'), 0);
console.log(`共 ${results.length} 个语料 | error 级问题 ${errCount} | warn 级 ${warnCount}`);
console.log(failed === 0 ? '✅ Import Data 预检全部通过（机器可验证部分）' : `❌ ${failed} 个语料存在 error 级问题`);
process.exitCode = failed === 0 ? 0 : 1;

try {
  writeFileSync(join(PROJECT_ROOT, 'build/import-data-report.json'), JSON.stringify(results, null, 2));
} catch { /* 不影响退出码 */ }

// ---------- 输出 ----------
function countLevel(r, key) {
  let n = 0;
  for (const side of [r.gold, r.product]) {
    for (const g of side?.gates ?? []) n += g[key].length;
  }
  return n;
}
function mark(side) {
  if (!side) return '✘';
  const errs = side.gates.reduce((n, g) => n + g.errors.length, 0);
  return errs ? '✘' : '✔';
}
function printRow(r) {
  const tag = r.source === '真实素材' ? '★' : ' ';
  console.log(`${tag} ${r.version.padEnd(4)} ${r.name.padEnd(26)} 金:${mark(r.gold)} 产物:${mark(r.product)}  指纹:${r.fingerprintMatch === false ? '✘' : '✔'}${r.error ? `  ← ${r.error}` : ''}`);
  for (const [label, side] of [['金标准', r.gold], ['回环产物', r.product]]) {
    for (const g of side?.gates ?? []) {
      for (const e of g.errors.slice(0, VERBOSE ? 20 : 3)) console.log(`      E·${label}·${g.id}：${e}`);
      for (const wn of g.warns.slice(0, VERBOSE ? 20 : 2)) console.log(`      W·${label}·${g.id}：${wn}`);
      if (!VERBOSE) {
        if (g.errors.length > 3) console.log(`      （${g.id} 另有 ${g.errors.length - 3} 条 error，详见报告）`);
        if (g.warns.length > 2) console.log(`      （${g.id} 另有 ${g.warns.length - 2} 条 warn，详见报告）`);
      }
    }
  }
}
