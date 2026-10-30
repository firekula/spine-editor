/**
 * skel2json —— Spine .skel 二进制 → runtime JSON 转换器（3.8 / 4.2 双版本）。
 *
 * 定位：真实项目交付的是 .skel 二进制；编辑器事实源是 AST(JSON)。
 * 本模块补齐"扔进来"的第一环：按官方 SkeletonBinary 布局逐字段读取，
 * 直接产出与官方编辑器导出同构的 runtime JSON（默认值折叠、字段名/枚举
 * 字符串化与官方一致），随后即可进入 parse/serialize AST 链路。
 *
 * 实现依据（与 vendor runtime 逐行核对）：
 * - spine-core-3.8 SkeletonBinary：hash=readString；bone 尾 transformMode(varint)；
 *   IK/Transform/Path 平铺字段；attachment type=byte 索引；curve 帧级
 *   （linear/stepped/bezier+4float）；deform 差量稀疏编码。
 * - spine-core-4.2 SkeletonBinary：hash=8字节(int32×2 大端)；referenceScale；
 *   bone inherit=byte；约束与附件用位标志打包；timeline bezier 分段式
 *   （每分量独立 setBezier）；physics 约束与 sequence/inherit timeline。
 * - JSON 侧字段名/默认值/枚举字符串以 SkeletonJson 读取器为准：
 *   3.8 curve/c2/c3/c4 四键=一条 bezier 的四个控制点（标量）；
 *   4.2 "curve":[c1,c2,c3,c4] 数组、整帧共享给全部分量。
 *
 * 数值策略：输出"最短 float32 表示"（Java Float.toString 语义），
 * 文本干净（0.1 而非 0.10000000149011612），且 fround 后与二进制
 * float32 bit 级一致；roundtrip 验证一律用 Math.fround 对比。
 */

// ---------------------------------------------------------------- 二进制原语

class Bin {
  constructor(bytes) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.pos = 0;
    this.strings = [];
    this.end = bytes.byteLength;
  }
  readByte() { return this.view.getInt8(this.pos++); }
  readUByte() { return this.view.getUint8(this.pos++); }
  readShort() { const v = this.view.getInt16(this.pos); this.pos += 2; return v; }
  readInt32() { const v = this.view.getInt32(this.pos); this.pos += 4; return v; }
  readFloat() { const v = this.view.getFloat32(this.pos); this.pos += 4; return v; }
  readBoolean() { return this.readByte() !== 0; }
  /** varint；optimizePositive=false 时为 zigzag（用于带符号 int）。 */
  readInt(optimizePositive = true) {
    let b = this.readByte();
    let result = b & 127;
    if ((b & 128) !== 0) {
      b = this.readByte();
      result |= (b & 127) << 7;
      if ((b & 128) !== 0) {
        b = this.readByte();
        result |= (b & 127) << 14;
        if ((b & 128) !== 0) {
          b = this.readByte();
          result |= (b & 127) << 21;
          if ((b & 128) !== 0) {
            b = this.readByte();
            result |= (b & 127) << 28;
          }
        }
      }
    }
    return optimizePositive ? result : (result >>> 1) ^ -(result & 1);
  }
  /** 字符串表引用。0=null。 */
  readStringRef() {
    const i = this.readInt(true);
    return i === 0 ? null : this.strings[i - 1];
  }
  /** 与官方 BinaryInput.readString 一致的 UTF-8 手工解码（2/3 字节序列）。 */
  readString() {
    let byteCount = this.readInt(true);
    if (byteCount === 0) return null;
    if (byteCount === 1) return '';
    byteCount--;
    let chars = '';
    for (let i = 0; i < byteCount;) {
      const b = this.readUByte();
      switch (b >> 4) {
        case 12: case 13:
          chars += String.fromCharCode((b & 31) << 6 | this.readByte() & 63);
          i += 2;
          break;
        case 14:
          chars += String.fromCharCode((b & 15) << 12 | (this.readByte() & 63) << 6 | this.readByte() & 63);
          i += 3;
          break;
        default:
          chars += String.fromCharCode(b);
          i++;
      }
    }
    return chars;
  }
}

// ---------------------------------------------------------------- 工具

/** 最短 float32 十进制表示（Java Float.toString 语义）。 */
function f32(v) {
  if (!Number.isFinite(v)) return 0;
  if (Number.isInteger(v) && Math.abs(v) < 1e16) return v;
  for (let p = 1; p <= 9; p++) {
    const s = v.toPrecision(p);
    if (Math.fround(parseFloat(s)) === v) return parseFloat(s);
  }
  return v;
}

const rgbaToHex = (i) => (i >>> 0).toString(16).padStart(8, '0');
const rgbToHex = (i) => (i >>> 0).toString(16).padStart(6, '0');
const byteHex = (x) => x.toString(16).padStart(2, '0');

const TRANSFORM_MODES_38 = ['normal', 'onlyTranslation', 'noRotationOrReflection', 'noScale', 'noScaleOrReflection'];
const INHERIT_42 = ['normal', 'onlyTranslation', 'noRotationOrReflection', 'noScale', 'noScaleOrReflection'];
const BLEND_MODES = ['normal', 'additive', 'multiply', 'screen'];
const POSITION_MODES = ['fixed', 'percent'];
const SPACING_MODES = ['length', 'fixed', 'percent'];
const ROTATE_MODES = ['tangent', 'chain', 'chainScale'];
const SEQUENCE_MODES = ['hold', 'once', 'loop', 'pingpong', 'onceReverse', 'loopReverse', 'pingpongReverse'];

/** 帧内多分量曲线归并：一致 → 单条；不一致 → 取分量 0（JSON 格式固有约束）。 */
function mergeCurves(curves, meta, where) {
  const first = curves.find((c) => c != null);
  if (first === undefined) return null;
  if (!curves.every((c) => JSON.stringify(c) === JSON.stringify(first))) {
    meta.warnings.push(`帧曲线分量不一致，JSON 仅保留分量0：${where}`);
  }
  return first;
}

/** 在 skins JSON 数组中定位附件（含 linkedmesh → parent mesh 解析）。 */
function findAttachment(skins, skinIndex, slotIndex, name) {
  const skin = skins[skinIndex];
  if (!skin) return null;
  for (const slotName in skin.attachments) {
    const att = skin.attachments[slotName][name];
    if (att) return att;
  }
  return null;
}
/** linkedmesh 的顶点数据源 = 父 mesh（同名空间内）。 */
function resolveVertexSource(skins, skinIndex, att) {
  if (att && att.type === 'linkedmesh') {
    const parentSkinIndex = att.skin
      ? skins.findIndex((s) => s.name === att.skin)
      : skins.findIndex((s) => s.name === 'default');
    const parent = findAttachment(skins, parentSkinIndex < 0 ? skinIndex : parentSkinIndex, -1, att.parent);
    return parent || att;
  }
  return att;
}
function isWeighted(att) {
  const src = att ? att : null;
  if (!src || src.type === 'linkedmesh') return false;
  const vc = src.vertexCount;
  if (vc === undefined) return false;
  return src.vertices.length !== vc * 2;
}

// ---------------------------------------------------------------- 入口

/**
 * 转换 .skel 字节为 runtime JSON。
 * @param {Uint8Array} bytes
 * @returns {{json: object, meta: object}}
 */
export function skelToJson(bytes) {
  const input = new Bin(bytes);
  // 非破坏性版本探测：
  // - 4.2 布局：8 字节原始 hash 之后紧跟 varint 长度 + ASCII 版本串；
  //   探测 offset 8 处的 varint 与后续 ASCII 是否构成合法版本号。
  // - 3.8 布局：hash 字符串 + 版本字符串（varint 长度前缀）。
  //   当 hash 恰为 7 字符时其版本 varint 也落在 offset 8，由版本号大小区分。
  let version, json, meta;
  const probe = new Bin(bytes);
  let probedVersion = null;
  try {
    probe.pos = 8;
    const len = probe.readInt(true);
    if (len >= 2 && len <= 16 && 8 + len <= probe.end) {
      let s = '';
      let ok = true;
      for (let i = 0; i < len - 1; i++) {
        const c = bytes[9 + i];
        if (!((c >= 0x30 && c <= 0x39) || c === 0x2e)) { ok = false; break; }
        s += String.fromCharCode(c);
      }
      if (ok && /^\d+\.\d+/.test(s)) probedVersion = s;
    }
  } catch { /* 探测失败按 3.8 头处理 */ }

  if (probedVersion && parseInt(probedVersion) >= 4) {
    const low = input.readInt32();
    const high = input.readInt32();
    // 与官方 runtime 完全一致的拼法（负数带 - 号）：high.toString(16) + low.toString(16)
    const hash = (high === 0 && low === 0) ? null : high.toString(16) + low.toString(16);
    version = input.readString();
    const major = parseInt(version);
    if (major === 4) {
      if (/^4\.2\./.test(version)) {
        json = readSkeleton42(input, hash, version, meta = { warnings: [] });
      } else {
        throw new Error(`检测到 Spine ${version} 二进制；当前支持 3.8.x / 4.2.x，4.0/4.1 布局暂未实现`);
      }
    } else {
      throw new Error(`版本判断冲突：${version}`);
    }
  } else {
    // 3.8 头：hash 字符串 + 版本字符串
    const hash38 = input.readString();
    version = input.readString();
    if (version === '3.8.75') throw new Error('不支持的 3.8.75 骨架，请用更新版本 Spine 重新导出');
    if (!version || !/^3\.8\./.test(version)) {
      throw new Error(`无法识别的 .skel 版本头（version=${JSON.stringify(version)}）；当前支持 3.8.x / 4.2.x`);
    }
    json = readSkeleton38(input, hash38, version, meta = { warnings: [] });
  }
  meta.spine = version;
  meta.nonessential = json._nonessential ?? false;
  delete json._nonessential;
  meta.stringCount = input.strings.length;
  if (input.pos !== input.end) meta.warnings.push(`尾部剩余 ${input.end - input.pos} 字节未消费`);
  return { json, meta };
}

// ================================================================ 3.8 读取器

function readSkeleton38(input, hash, version, meta) {
  const json = {};
  const skel = { spine: version };
  if (hash) skel.hash = hash;
  skel.x = f32(input.readFloat());
  skel.y = f32(input.readFloat());
  skel.width = f32(input.readFloat());
  skel.height = f32(input.readFloat());
  const nonessential = input.readBoolean();
  if (nonessential) {
    const fps = input.readFloat();
    const images = input.readString();
    const audio = input.readString();
    if (fps !== 0) skel.fps = f32(fps);
    if (images) skel.images = images;
    if (audio) skel.audio = audio;
  }
  json.skeleton = skel;
  json._nonessential = nonessential;

  const stringCount = input.readInt(true);
  for (let i = 0; i < stringCount; i++) input.strings.push(input.readString());

  // bones
  const bones = [];
  const nBones = input.readInt(true);
  for (let i = 0; i < nBones; i++) {
    const name = input.readString();
    const parent = i === 0 ? null : bones[input.readInt(true)];
    const rotation = input.readFloat(), bx = input.readFloat(), by = input.readFloat();
    const scaleX = input.readFloat(), scaleY = input.readFloat();
    const shearX = input.readFloat(), shearY = input.readFloat(), length = input.readFloat();
    const transformMode = TRANSFORM_MODES_38[input.readInt(true)];
    const skinRequired = input.readBoolean();
    const b = { name };
    if (parent) b.parent = parent.name;
    if (rotation !== 0) b.rotation = f32(rotation);
    if (bx !== 0) b.x = f32(bx);
    if (by !== 0) b.y = f32(by);
    if (scaleX !== 1) b.scaleX = f32(scaleX);
    if (scaleY !== 1) b.scaleY = f32(scaleY);
    if (shearX !== 0) b.shearX = f32(shearX);
    if (shearY !== 0) b.shearY = f32(shearY);
    if (length !== 0) b.length = f32(length);
    if (transformMode !== 'normal') b.transform = transformMode;
    if (skinRequired) b.skin = true;
    if (nonessential) {
      const color = input.readInt32();
      if ((color >>> 0) !== 0xFFFFFFFF) b.color = rgbaToHex(color);
    }
    bones.push(b);
  }
  if (nBones) json.bones = bones;

  // slots
  const slots = [];
  const nSlots = input.readInt(true);
  for (let i = 0; i < nSlots; i++) {
    const name = input.readString();
    const bone = bones[input.readInt(true)];
    const color = input.readInt32();
    const dark = input.readInt32();
    const attachment = input.readStringRef();
    const blend = BLEND_MODES[input.readInt(true)];
    const s = { name, bone: bone.name };
    if ((color >>> 0) !== 0xFFFFFFFF) s.color = rgbaToHex(color);
    if (dark !== -1) s.dark = rgbToHex(dark);
    if (attachment) s.attachment = attachment;
    if (blend !== 'normal') s.blend = blend;
    slots.push(s);
  }
  if (nSlots) json.slots = slots;

  // ik
  const iks = [];
  const nIk = input.readInt(true);
  for (let i = 0; i < nIk; i++) {
    const name = input.readString();
    const order = input.readInt(true);
    const skinRequired = input.readBoolean();
    const boneCount = input.readInt(true);
    const cb = [];
    for (let j = 0; j < boneCount; j++) cb.push(bones[input.readInt(true)].name);
    const target = bones[input.readInt(true)];
    const mix = input.readFloat();
    const softness = input.readFloat();
    const bendDirection = input.readByte();
    const compress = input.readBoolean();
    const stretch = input.readBoolean();
    const uniform = input.readBoolean();
    const c = { name, bones: cb, target: target.name };
    if (order !== 0) c.order = order;
    if (skinRequired) c.skin = true;
    if (mix !== 1) c.mix = f32(mix);
    if (softness !== 0) c.softness = f32(softness);
    if (bendDirection !== 1) c.bendPositive = false;
    if (compress) c.compress = true;
    if (stretch) c.stretch = true;
    if (uniform) c.uniform = true;
    iks.push(c);
  }
  if (nIk) json.ik = iks;

  // transform
  const transforms = [];
  const nTf = input.readInt(true);
  for (let i = 0; i < nTf; i++) {
    const name = input.readString();
    const order = input.readInt(true);
    const skinRequired = input.readBoolean();
    const boneCount = input.readInt(true);
    const cb = [];
    for (let j = 0; j < boneCount; j++) cb.push(bones[input.readInt(true)].name);
    const target = bones[input.readInt(true)];
    const local = input.readBoolean();
    const relative = input.readBoolean();
    const rotation = input.readFloat(), ox = input.readFloat(), oy = input.readFloat();
    const osx = input.readFloat(), osy = input.readFloat(), oshy = input.readFloat();
    const rotateMix = input.readFloat(), translateMix = input.readFloat();
    const scaleMix = input.readFloat(), shearMix = input.readFloat();
    const c = { name, bones: cb, target: target.name };
    if (order !== 0) c.order = order;
    if (skinRequired) c.skin = true;
    if (local) c.local = true;
    if (relative) c.relative = true;
    if (rotation !== 0) c.rotation = f32(rotation);
    if (ox !== 0) c.x = f32(ox);
    if (oy !== 0) c.y = f32(oy);
    if (osx !== 0) c.scaleX = f32(osx);
    if (osy !== 0) c.scaleY = f32(osy);
    if (oshy !== 0) c.shearY = f32(oshy);
    if (rotateMix !== 1) c.rotateMix = f32(rotateMix);
    if (translateMix !== 1) c.translateMix = f32(translateMix);
    if (scaleMix !== 1) c.scaleMix = f32(scaleMix);
    if (shearMix !== 1) c.shearMix = f32(shearMix);
    transforms.push(c);
  }
  if (nTf) json.transform = transforms;

  // path
  const paths = [];
  const nPath = input.readInt(true);
  for (let i = 0; i < nPath; i++) {
    const name = input.readString();
    const order = input.readInt(true);
    const skinRequired = input.readBoolean();
    const boneCount = input.readInt(true);
    const cb = [];
    for (let j = 0; j < boneCount; j++) cb.push(bones[input.readInt(true)].name);
    const targetSlot = slots[input.readInt(true)];
    const positionMode = POSITION_MODES[input.readInt(true)];
    const spacingMode = SPACING_MODES[input.readInt(true)];
    const rotateMode = ROTATE_MODES[input.readInt(true)];
    const rotation = input.readFloat();
    const position = input.readFloat();
    const spacing = input.readFloat();
    const rotateMix = input.readFloat();
    const translateMix = input.readFloat();
    const c = { name, bones: cb, target: targetSlot.name };
    if (order !== 0) c.order = order;
    if (skinRequired) c.skin = true;
    if (positionMode !== 'percent') c.positionMode = positionMode;
    if (spacingMode !== 'length') c.spacingMode = spacingMode;
    if (rotateMode !== 'tangent') c.rotateMode = rotateMode;
    if (rotation !== 0) c.rotation = f32(rotation);
    if (position !== 0) c.position = f32(position);
    if (spacing !== 0) c.spacing = f32(spacing);
    if (rotateMix !== 1) c.rotateMix = f32(rotateMix);
    if (translateMix !== 1) c.translateMix = f32(translateMix);
    paths.push(c);
  }
  if (nPath) json.path = paths;

  const ctx = {
    bones, slots, nonessential, meta,
    ikNames: iks.map((c) => c.name),
    tfNames: transforms.map((c) => c.name),
    pathNames: paths.map((c) => c.name),
    eventAudio: {},
  };

  // skins
  const skins = [];
  const defaultAttachments = readSkin38(input, ctx, null);
  if (defaultAttachments) skins.push({ name: 'default', attachments: defaultAttachments });
  const nSkins = input.readInt(true);
  for (let i = 0; i < nSkins; i++) skins.push(readSkin38(input, ctx, { iks, transforms, paths }));
  ctx.skins = skins;
  if (skins.length) json.skins = skins;

  // events（定义）
  const events = {};
  const nEvents = input.readInt(true);
  for (let i = 0; i < nEvents; i++) {
    const name = input.readStringRef();
    const intValue = input.readInt(false);
    const floatValue = input.readFloat();
    const stringValue = input.readString();
    const audioPath = input.readString();
    const e = {};
    if (intValue !== 0) e.int = intValue;
    if (floatValue !== 0) e.float = f32(floatValue);
    if (stringValue) e.string = stringValue;
    if (audioPath) {
      e.audio = audioPath;
      const volume = input.readFloat();
      const balance = input.readFloat();
      if (volume !== 1) e.volume = f32(volume);
      if (balance !== 0) e.balance = f32(balance);
    }
    events[name] = e;
    ctx.eventAudio[name] = !!audioPath;
  }
  ctx.eventNames = Object.keys(events);
  if (nEvents) json.events = events;

  // animations
  const animations = {};
  const nAnims = input.readInt(true);
  for (let i = 0; i < nAnims; i++) {
    const name = input.readString();
    animations[name] = readAnimation38(input, name, ctx);
  }
  if (nAnims) json.animations = animations;
  return json;
}

/** 3.8 皮肤。defaultSkin=true 时返回 attachments 或 null；否则返回完整 skin JSON。 */
function readSkin38(input, ctx, named) {
  const { bones, slots, nonessential } = ctx;
  const attachments = {};
  let slotCount;
  let skinJson = null;
  if (named === null) {
    slotCount = input.readInt(true);
    if (slotCount === 0) return null;
  } else {
    skinJson = { name: input.readStringRef() };
    const boneCount = input.readInt(true);
    if (boneCount) {
      skinJson.bones = [];
      for (let i = 0; i < boneCount; i++) skinJson.bones.push(bones[input.readInt(true)].name);
    }
    const nIk = input.readInt(true);
    if (nIk) { skinJson.ik = []; for (let i = 0; i < nIk; i++) skinJson.ik.push(named.iks[input.readInt(true)].name); }
    const nTf = input.readInt(true);
    if (nTf) { skinJson.transform = []; for (let i = 0; i < nTf; i++) skinJson.transform.push(named.transforms[input.readInt(true)].name); }
    const nPath = input.readInt(true);
    if (nPath) { skinJson.path = []; for (let i = 0; i < nPath; i++) skinJson.path.push(named.paths[input.readInt(true)].name); }
    slotCount = input.readInt(true);
  }
  for (let i = 0; i < slotCount; i++) {
    const slotIndex = input.readInt(true);
    const slotName = slots[slotIndex].name;
    const perSlot = {};
    const attCount = input.readInt(true);
    for (let j = 0; j < attCount; j++) {
      const name = input.readStringRef();
      perSlot[name] = readAttachment38(input, name, ctx);
    }
    attachments[slotName] = perSlot;
  }
  if (named === null) return Object.keys(attachments).length ? attachments : null;
  skinJson.attachments = attachments;
  return skinJson;
}

/** 3.8 附件（type 字节索引 0..6）。 */
function readAttachment38(input, attachmentName, ctx) {
  const { nonessential, slots } = ctx;
  const name = input.readStringRef() ?? attachmentName;
  const typeIndex = input.readByte();
  const named = name !== attachmentName ? { name } : {};
  switch (typeIndex) {
    case 0: { // region
      const path = input.readStringRef();
      const rotation = input.readFloat(), x = input.readFloat(), y = input.readFloat();
      const scaleX = input.readFloat(), scaleY = input.readFloat();
      const width = input.readFloat(), height = input.readFloat();
      const color = input.readInt32();
      const a = { ...named };
      if (path && path !== name) a.path = path;
      if (rotation !== 0) a.rotation = f32(rotation);
      if (x !== 0) a.x = f32(x);
      if (y !== 0) a.y = f32(y);
      if (scaleX !== 1) a.scaleX = f32(scaleX);
      if (scaleY !== 1) a.scaleY = f32(scaleY);
      a.width = f32(width);
      a.height = f32(height);
      if ((color >>> 0) !== 0xFFFFFFFF) a.color = rgbaToHex(color);
      return a;
    }
    case 1: { // boundingbox
      const vertexCount = input.readInt(true);
      const vertices = readVertices38(input, vertexCount);
      const a = { type: 'boundingbox', ...named, vertexCount, vertices };
      if (nonessential) {
        const color = input.readInt32();
        if ((color >>> 0) !== 0x7FFFFFFF) a.color = rgbaToHex(color);
      }
      return a;
    }
    case 2: { // mesh
      const path = input.readStringRef();
      const color = input.readInt32();
      const vertexCount = input.readInt(true);
      const uvs = [];
      for (let i = 0; i < vertexCount * 2; i++) uvs.push(f32(input.readFloat()));
      const nTris = input.readInt(true);
      const triangles = [];
      for (let i = 0; i < nTris; i++) triangles.push(input.readShort());
      const vertices = readVertices38(input, vertexCount);
      const hullLength = input.readInt(true);
      const a = { type: 'mesh', ...named };
      if (path && path !== name) a.path = path;
      if ((color >>> 0) !== 0xFFFFFFFF) a.color = rgbaToHex(color);
      a.uvs = uvs;
      a.triangles = triangles;
      a.vertices = vertices;
      a.hull = hullLength;
      if (nonessential) {
        const nEdges = input.readInt(true);
        const edges = [];
        for (let i = 0; i < nEdges; i++) edges.push(input.readShort());
        if (edges.length) a.edges = edges;
        const width = input.readFloat(), height = input.readFloat();
        if (width !== 0) a.width = f32(width);
        if (height !== 0) a.height = f32(height);
      }
      return a;
    }
    case 3: { // linkedmesh
      const path = input.readStringRef();
      const color = input.readInt32();
      const skinName = input.readStringRef();
      const parent = input.readStringRef();
      const inheritDeform = input.readBoolean();
      const a = { type: 'linkedmesh', ...named };
      if (path && path !== name) a.path = path;
      if ((color >>> 0) !== 0xFFFFFFFF) a.color = rgbaToHex(color);
      if (skinName) a.skin = skinName;
      a.parent = parent;
      if (!inheritDeform) a.deform = false;
      if (nonessential) {
        const width = input.readFloat(), height = input.readFloat();
        if (width !== 0) a.width = f32(width);
        if (height !== 0) a.height = f32(height);
      }
      return a;
    }
    case 4: { // path
      const closed = input.readBoolean();
      const constantSpeed = input.readBoolean();
      const vertexCount = input.readInt(true);
      const vertices = readVertices38(input, vertexCount);
      const lengths = [];
      for (let i = 0; i < vertexCount / 3; i++) lengths.push(f32(input.readFloat()));
      const a = { type: 'path', ...named, vertexCount, vertices, lengths };
      if (closed) a.closed = true;
      if (!constantSpeed) a.constantSpeed = false;
      if (nonessential) {
        const color = input.readInt32();
        if ((color >>> 0) !== 0x7FFFFFFF) a.color = rgbaToHex(color);
      }
      return a;
    }
    case 5: { // point
      const rotation = input.readFloat(), x = input.readFloat(), y = input.readFloat();
      const a = { type: 'point', ...named };
      if (rotation !== 0) a.rotation = f32(rotation);
      if (x !== 0) a.x = f32(x);
      if (y !== 0) a.y = f32(y);
      if (nonessential) {
        const color = input.readInt32();
        if ((color >>> 0) !== 0xFFFFF1FF) a.color = rgbaToHex(color);
      }
      return a;
    }
    case 6: { // clipping
      const endSlotIndex = input.readInt(true);
      const vertexCount = input.readInt(true);
      const vertices = readVertices38(input, vertexCount);
      const a = { type: 'clipping', ...named, end: slots[endSlotIndex].name, vertexCount, vertices };
      if (nonessential) {
        const color = input.readInt32();
        if ((color >>> 0) !== 0x7FFFFFFF) a.color = rgbaToHex(color);
      }
      return a;
    }
    default:
      throw new Error(`未知的 3.8 附件类型索引 ${typeIndex}`);
  }
}

/** 3.8 顶点：weighted → [count,idx,x,y,w,...]；否则纯坐标。 */
function readVertices38(input, vertexCount) {
  const weighted = input.readBoolean();
  const out = [];
  if (!weighted) {
    for (let i = 0; i < vertexCount * 2; i++) out.push(f32(input.readFloat()));
    return out;
  }
  for (let i = 0; i < vertexCount; i++) {
    const boneCount = input.readInt(true);
    out.push(boneCount);
    for (let j = 0; j < boneCount; j++) {
      out.push(input.readInt(true));
      out.push(f32(input.readFloat()), f32(input.readFloat()), f32(input.readFloat()));
    }
  }
  return out;
}

/** 3.8 动画。 */
function readAnimation38(input, name, ctx) {
  const { slots, bones, skins } = ctx;
  const anim = {};

  // slot timelines：attachment / color / twoColor
  const slotTl = {};
  const nSlotGroups = input.readInt(true);
  for (let g = 0; g < nSlotGroups; g++) {
    const slotIndex = input.readInt(true);
    const slotName = slots[slotIndex].name;
    const per = {};
    const n = input.readInt(true);
    for (let t = 0; t < n; t++) {
      const type = input.readByte();
      const frameCount = input.readInt(true);
      if (type === 0) {
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat();
          const att = input.readStringRef();
          const f = { time: f32(time) };
          if (att) f.name = att;
          // name=null 为官方语义（清空槽位附件），JSON 省略 name 键
          frames.push(f);
        }
        per.attachment = frames;
      } else if (type === 1) {
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat();
          const color = input.readInt32();
          const f = { time: f32(time), color: rgbaToHex(color) };
          frames.push(f);
          if (i < frameCount - 1) applyCurve38(input, f);
        }
        per.color = frames;
      } else if (type === 2) {
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat();
          const light = input.readInt32();
          const dark = input.readInt32();
          const f = { time: f32(time), light: rgbaToHex(light), dark: rgbToHex(dark) };
          frames.push(f);
          if (i < frameCount - 1) applyCurve38(input, f);
        }
        per.twoColor = frames;
      } else throw new Error(`未知 3.8 slot timeline 类型 ${type}`);
    }
    slotTl[slotName] = per;
  }
  if (nSlotGroups) anim.slots = slotTl;

  // bone timelines：rotate(angle) / translate / scale / shear
  const boneTl = {};
  const nBoneGroups = input.readInt(true);
  for (let g = 0; g < nBoneGroups; g++) {
    const boneIndex = input.readInt(true);
    const boneName = bones[boneIndex].name;
    const per = {};
    const n = input.readInt(true);
    for (let t = 0; t < n; t++) {
      const type = input.readByte();
      const frameCount = input.readInt(true);
      const frames = [];
      if (type === 0) {
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat(), angle = input.readFloat();
          const f = { time: f32(time), angle: f32(angle) };
          frames.push(f);
          if (i < frameCount - 1) applyCurve38(input, f);
        }
        per.rotate = frames;
      } else {
        const keyName = { 1: 'translate', 2: 'scale', 3: 'shear' }[type];
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat(), x = input.readFloat(), y = input.readFloat();
          const f = { time: f32(time), x: f32(x), y: f32(y) };
          frames.push(f);
          if (i < frameCount - 1) applyCurve38(input, f);
        }
        per[keyName] = frames;
      }
    }
    boneTl[boneName] = per;
  }
  if (nBoneGroups) anim.bones = boneTl;

  // ik
  const ikTl = {};
  const nIk = input.readInt(true);
  for (let g = 0; g < nIk; g++) {
    const index = input.readInt(true);
    const frameCount = input.readInt(true);
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
      const time = input.readFloat(), mix = input.readFloat(), softness = input.readFloat();
      const bendDirection = input.readByte();
      const compress = input.readBoolean();
      const stretch = input.readBoolean();
      const f = { time: f32(time), mix: f32(mix) };
      if (softness !== 0) f.softness = f32(softness);
      if (bendDirection !== 1) f.bendPositive = false;
      if (compress) f.compress = true;
      if (stretch) f.stretch = true;
      frames.push(f);
      if (i < frameCount - 1) applyCurve38(input, f);
    }
    ikTl[ctx.ikNames[index]] = frames;
  }
  if (nIk) anim.ik = ikTl;

  // transform
  const tfTl = {};
  const nTf = input.readInt(true);
  for (let g = 0; g < nTf; g++) {
    const index = input.readInt(true);
    const frameCount = input.readInt(true);
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
      const time = input.readFloat(), rotateMix = input.readFloat(), translateMix = input.readFloat();
      const scaleMix = input.readFloat(), shearMix = input.readFloat();
      const f = { time: f32(time) };
      if (rotateMix !== 1) f.rotateMix = f32(rotateMix);
      if (translateMix !== 1) f.translateMix = f32(translateMix);
      if (scaleMix !== 1) f.scaleMix = f32(scaleMix);
      if (shearMix !== 1) f.shearMix = f32(shearMix);
      frames.push(f);
      if (i < frameCount - 1) applyCurve38(input, f);
    }
    tfTl[ctx.tfNames[index]] = frames;
  }
  if (nTf) anim.transform = tfTl;

  // path
  const pathTl = {};
  const nPath = input.readInt(true);
  for (let g = 0; g < nPath; g++) {
    const index = input.readInt(true);
    const pathName = ctx.pathNames[index];
    const per = {};
    const n = input.readInt(true);
    for (let t = 0; t < n; t++) {
      const type = input.readByte();
      const frameCount = input.readInt(true);
      const frames = [];
      if (type === 0 || type === 1) {
        const keyName = type === 0 ? 'position' : 'spacing';
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat(), value = input.readFloat();
          const f = { time: f32(time) };
          f[keyName] = f32(value);
          frames.push(f);
          if (i < frameCount - 1) applyCurve38(input, f);
        }
        per[keyName] = frames;
      } else if (type === 2) {
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat(), rotateMix = input.readFloat(), translateMix = input.readFloat();
          const f = { time: f32(time) };
          if (rotateMix !== 1) f.rotateMix = f32(rotateMix);
          if (translateMix !== 1) f.translateMix = f32(translateMix);
          frames.push(f);
          if (i < frameCount - 1) applyCurve38(input, f);
        }
        per.mix = frames;
      } else throw new Error(`未知 3.8 path timeline 类型 ${type}`);
    }
    pathTl[pathName] = per;
  }
  if (nPath) anim.path = pathTl;

  // deform：3.8 JSON 结构 skins.{skin}.{slot}.{attachment} = 帧数组
  const deformRoot = {};
  const nSkinGroups = input.readInt(true);
  for (let g = 0; g < nSkinGroups; g++) {
    const skinIndex = input.readInt(true);
    const skinName = skins[skinIndex].name;
    const perSkin = deformRoot[skinName] ?? (deformRoot[skinName] = {});
    const nSlots = input.readInt(true);
    for (let s = 0; s < nSlots; s++) {
      const slotIndex = input.readInt(true);
      const slotName = slots[slotIndex].name;
      const perSlot = perSkin[slotName] ?? (perSkin[slotName] = {});
      const nAtts = input.readInt(true);
      for (let a = 0; a < nAtts; a++) {
        const attachmentName = input.readStringRef();
        const attachment = resolveVertexSource(skins, skinIndex, findAttachment(skins, skinIndex, slotIndex, attachmentName));
        const weighted = isWeighted(attachment);
        const setupVertices = attachment ? attachment.vertices : [];
        const frameCount = input.readInt(true);
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat();
          const end = input.readInt(true);
          const f = { time: f32(time) };
          if (end !== 0) {
            const start = input.readInt(true);
            const values = [];
            for (let v = 0; v < end; v++) values.push(f32(input.readFloat()));
            if (start !== 0) f.offset = start;
            f.vertices = values;
          }
          frames.push(f);
          if (i < frameCount - 1) applyCurve38(input, f);
        }
        perSlot[attachmentName] = frames;
      }
    }
  }
  if (nSkinGroups) anim.deform = deformRoot; // 3.8 官方键名 deform（非 skins）

  // drawOrder（JSON 规范：offsets.slot 为槽位名）
  const drawOrderCount = input.readInt(true);
  if (drawOrderCount > 0) {
    const doFrames = [];
    for (let i = 0; i < drawOrderCount; i++) {
      const time = input.readFloat();
      const offsetCount = input.readInt(true);
      const offsets = [];
      for (let j = 0; j < offsetCount; j++) {
        const slotIndex = input.readInt(true);
        const offset = input.readInt(true);
        offsets.push({ slot: slots[slotIndex].name, offset });
      }
      const f = { time: f32(time) };
      if (offsets.length) f.offsets = offsets;
      doFrames.push(f);
    }
    anim.drawOrder = doFrames;
  }

  // events
  const eventCount = input.readInt(true);
  if (eventCount > 0) {
    const evFrames = [];
    for (let i = 0; i < eventCount; i++) {
      const time = input.readFloat();
      const eventIndex = input.readInt(true);
      const intValue = input.readInt(false);
      const floatValue = input.readFloat();
      const stringValue = input.readString();
      const eventName = ctx.eventNames[eventIndex];
      const f = { time: f32(time), name: eventName };
      if (intValue !== 0) f.int = intValue;
      if (floatValue !== 0) f.float = f32(floatValue);
      if (stringValue != null) f.string = stringValue;
      if (ctx.eventAudio[eventName]) {
        const volume = input.readFloat();
        const balance = input.readFloat();
        if (volume !== 1) f.volume = f32(volume);
        if (balance !== 0) f.balance = f32(balance);
      }
      evFrames.push(f);
    }
    anim.events = evFrames;
  }
  return anim;
}

/** 3.8 帧曲线 → curve/c2/c3/c4 标量键。 */
function applyCurve38(input, frame) {
  const type = input.readByte();
  if (type === 0) return; // linear：省略
  if (type === 1) { frame.curve = 'stepped'; return; }
  const c1 = input.readFloat(), c2 = input.readFloat(), c3 = input.readFloat(), c4 = input.readFloat();
  frame.curve = f32(c1);
  if (c2 !== 0) frame.c2 = f32(c2);
  if (c3 !== 1) frame.c3 = f32(c3);
  if (c4 !== 1) frame.c4 = f32(c4);
}

// ================================================================ 4.2 读取器

function readSkeleton42(input, hash, version, meta) {
  const json = {};
  const skel = { spine: version };
  if (hash) skel.hash = hash;
  skel.x = f32(input.readFloat());
  skel.y = f32(input.readFloat());
  skel.width = f32(input.readFloat());
  skel.height = f32(input.readFloat());
  const referenceScale = input.readFloat();
  if (referenceScale !== 100) skel.referenceScale = f32(referenceScale);
  const nonessential = input.readBoolean();
  if (nonessential) {
    const fps = input.readFloat();
    const images = input.readString();
    const audio = input.readString();
    if (fps !== 0) skel.fps = f32(fps);
    if (images) skel.images = images;
    if (audio) skel.audio = audio;
  }
  json.skeleton = skel;
  json._nonessential = nonessential;

  const stringCount = input.readInt(true);
  for (let i = 0; i < stringCount; i++) input.strings.push(input.readString());

  // bones
  const bones = [];
  const nBones = input.readInt(true);
  for (let i = 0; i < nBones; i++) {
    const name = input.readString();
    const parent = i === 0 ? null : bones[input.readInt(true)];
    const rotation = input.readFloat(), bx = input.readFloat(), by = input.readFloat();
    const scaleX = input.readFloat(), scaleY = input.readFloat();
    const shearX = input.readFloat(), shearY = input.readFloat(), length = input.readFloat();
    const inherit = input.readByte();
    const skinRequired = input.readBoolean();
    const b = { name };
    if (parent) b.parent = parent.name;
    if (rotation !== 0) b.rotation = f32(rotation);
    if (bx !== 0) b.x = f32(bx);
    if (by !== 0) b.y = f32(by);
    if (scaleX !== 1) b.scaleX = f32(scaleX);
    if (scaleY !== 1) b.scaleY = f32(scaleY);
    if (shearX !== 0) b.shearX = f32(shearX);
    if (shearY !== 0) b.shearY = f32(shearY);
    if (length !== 0) b.length = f32(length);
    if (inherit !== 0) b.inherit = INHERIT_42[inherit];
    if (skinRequired) b.skin = true;
    if (nonessential) {
      const color = input.readInt32();
      if ((color >>> 0) !== 0xFFFFFFFF) b.color = rgbaToHex(color);
      const icon = input.readString(); // 官方：直接字符串，非表引用
      if (icon) b.icon = icon;
      const visible = input.readBoolean();
      if (!visible) b.visible = false;
    }
    bones.push(b);
  }
  if (nBones) json.bones = bones;

  // slots
  const slots = [];
  const nSlots = input.readInt(true);
  for (let i = 0; i < nSlots; i++) {
    const name = input.readString();
    const bone = bones[input.readInt(true)];
    const color = input.readInt32();
    const dark = input.readInt32();
    const attachment = input.readStringRef();
    const blend = input.readInt(true);
    const s = { name, bone: bone.name };
    if ((color >>> 0) !== 0xFFFFFFFF) s.color = rgbaToHex(color);
    if (dark !== -1) s.dark = rgbToHex(dark);
    if (attachment) s.attachment = attachment;
    if (blend !== 0) s.blend = BLEND_MODES[blend];
    if (nonessential) {
      const visible = input.readBoolean();
      if (!visible) s.visible = false;
    }
    slots.push(s);
  }
  if (nSlots) json.slots = slots;

  // ik（flags 位标志）
  const iks = [];
  const nIk = input.readInt(true);
  for (let i = 0; i < nIk; i++) {
    const name = input.readString();
    const order = input.readInt(true);
    const boneCount = input.readInt(true);
    const cb = [];
    for (let j = 0; j < boneCount; j++) cb.push(bones[input.readInt(true)].name);
    const target = bones[input.readInt(true)];
    const flags = input.readByte();
    const c = { name, bones: cb, target: target.name };
    if (order !== 0) c.order = order;
    if (flags & 1) c.skin = true;
    if (!((flags & 2) !== 0)) c.bendPositive = false;
    if (flags & 4) c.compress = true;
    if (flags & 8) c.stretch = true;
    if (flags & 16) c.uniform = true;
    if (flags & 32) {
      const mix = (flags & 64) !== 0 ? input.readFloat() : 1;
      if (mix !== 1) c.mix = f32(mix);
    } else c.mix = 0;
    if (flags & 128) {
      const softness = input.readFloat();
      if (softness !== 0) c.softness = f32(softness);
    }
    iks.push(c);
  }
  if (nIk) json.ik = iks;

  // transform（两组 flags）
  const transforms = [];
  const nTf = input.readInt(true);
  for (let i = 0; i < nTf; i++) {
    const name = input.readString();
    const order = input.readInt(true);
    const boneCount = input.readInt(true);
    const cb = [];
    for (let j = 0; j < boneCount; j++) cb.push(bones[input.readInt(true)].name);
    const target = bones[input.readInt(true)];
    let flags = input.readByte();
    const c = { name, bones: cb, target: target.name };
    if (order !== 0) c.order = order;
    if (flags & 1) c.skin = true;
    if (flags & 2) c.local = true;
    if (flags & 4) c.relative = true;
    if (flags & 8) { const v = input.readFloat(); if (v !== 0) c.rotation = f32(v); }
    if (flags & 16) { const v = input.readFloat(); if (v !== 0) c.x = f32(v); }
    if (flags & 32) { const v = input.readFloat(); if (v !== 0) c.y = f32(v); }
    if (flags & 64) { const v = input.readFloat(); if (v !== 0) c.scaleX = f32(v); }
    if (flags & 128) { const v = input.readFloat(); if (v !== 0) c.scaleY = f32(v); }
    flags = input.readByte();
    if (flags & 1) { const v = input.readFloat(); if (v !== 0) c.shearY = f32(v); }
    if (flags & 2) { const v = input.readFloat(); if (v !== 1) c.mixRotate = f32(v); }
    if (flags & 4) { const v = input.readFloat(); if (v !== 1) c.mixX = f32(v); }
    if (flags & 8) { const v = input.readFloat(); if (v !== 1) c.mixY = f32(v); }
    if (flags & 16) { const v = input.readFloat(); if (v !== 1) c.mixScaleX = f32(v); }
    if (flags & 32) { const v = input.readFloat(); if (v !== 1) c.mixScaleY = f32(v); }
    if (flags & 64) { const v = input.readFloat(); if (v !== 1) c.mixShearY = f32(v); }
    transforms.push(c);
  }
  if (nTf) json.transform = transforms;

  // path（单字节打包三模式）
  const paths = [];
  const nPath = input.readInt(true);
  for (let i = 0; i < nPath; i++) {
    const name = input.readString();
    const order = input.readInt(true);
    const skinRequired = input.readBoolean();
    const boneCount = input.readInt(true);
    const cb = [];
    for (let j = 0; j < boneCount; j++) cb.push(bones[input.readInt(true)].name);
    const targetSlot = slots[input.readInt(true)];
    const flags = input.readByte();
    const positionMode = POSITION_MODES[flags & 1];
    const spacingMode = SPACING_MODES[(flags >> 1) & 3];
    const rotateMode = ROTATE_MODES[(flags >> 3) & 3];
    const c = { name, bones: cb, target: targetSlot.name };
    if (order !== 0) c.order = order;
    if (skinRequired) c.skin = true;
    if (positionMode !== 'percent') c.positionMode = positionMode;
    if (spacingMode !== 'length') c.spacingMode = spacingMode;
    if (rotateMode !== 'tangent') c.rotateMode = rotateMode;
    if (flags & 128) { const v = input.readFloat(); if (v !== 0) c.rotation = f32(v); }
    const position = input.readFloat();
    if (position !== 0) c.position = f32(position);
    const spacing = input.readFloat();
    if (spacing !== 0) c.spacing = f32(spacing);
    const mixRotate = input.readFloat();
    if (mixRotate !== 1) c.mixRotate = f32(mixRotate);
    const mixX = input.readFloat();
    if (mixX !== 1) c.mixX = f32(mixX);
    const mixY = input.readFloat();
    if (mixY !== 1) c.mixY = f32(mixY);
    paths.push(c);
  }
  if (nPath) json.path = paths;

  // physics
  const physics = [];
  const nPhysics = input.readInt(true);
  for (let i = 0; i < nPhysics; i++) {
    const name = input.readString();
    const order = input.readInt(true);
    const bone = bones[input.readInt(true)];
    let flags = input.readByte();
    const c = { name, bone: bone.name };
    if (order !== 0) c.order = order;
    if (flags & 1) c.skin = true;
    if (flags & 2) { const v = input.readFloat(); if (v !== 0) c.x = f32(v); }
    if (flags & 4) { const v = input.readFloat(); if (v !== 0) c.y = f32(v); }
    if (flags & 8) { const v = input.readFloat(); if (v !== 0) c.rotate = f32(v); }
    if (flags & 16) { const v = input.readFloat(); if (v !== 0) c.scaleX = f32(v); }
    if (flags & 32) { const v = input.readFloat(); if (v !== 0) c.shearX = f32(v); }
    let limit = 5000;
    if (flags & 64) limit = input.readFloat();
    if (limit !== 5000) c.limit = f32(limit);
    const fps = input.readUByte();
    if (fps !== 60) c.fps = fps;
    const inertia = input.readFloat();
    if (inertia !== 1) c.inertia = f32(inertia);
    const strength = input.readFloat();
    if (strength !== 100) c.strength = f32(strength);
    const damping = input.readFloat();
    if (damping !== 1) c.damping = f32(damping);
    let massInverse = 1;
    if (flags & 128) massInverse = input.readFloat();
    const mass = 1 / massInverse;
    if (mass !== 1) c.mass = f32(mass);
    const wind = input.readFloat();
    if (wind !== 0) c.wind = f32(wind);
    const gravity = input.readFloat();
    if (gravity !== 0) c.gravity = f32(gravity);
    flags = input.readByte();
    if (flags & 1) c.inertiaGlobal = true;
    if (flags & 2) c.strengthGlobal = true;
    if (flags & 4) c.dampingGlobal = true;
    if (flags & 8) c.massGlobal = true;
    if (flags & 16) c.windGlobal = true;
    if (flags & 32) c.gravityGlobal = true;
    if (flags & 64) c.mixGlobal = true;
    if (flags & 128) { const v = input.readFloat(); if (v !== 1) c.mix = f32(v); }
    physics.push(c);
  }
  if (nPhysics) json.physics = physics;

  const ctx = {
    bones, slots, nonessential, meta,
    ikNames: iks.map((c) => c.name),
    tfNames: transforms.map((c) => c.name),
    pathNames: paths.map((c) => c.name),
    physicsNames: physics.map((c) => c.name),
    eventAudio: {},
  };

  // skins
  const skins = [];
  const defaultAttachments = readSkin42(input, ctx, null);
  if (defaultAttachments) skins.push({ name: 'default', attachments: defaultAttachments });
  const nSkins = input.readInt(true);
  for (let i = 0; i < nSkins; i++) skins.push(readSkin42(input, ctx, { iks, transforms, paths, physics }));
  ctx.skins = skins;
  if (skins.length) json.skins = skins;

  // events（定义）
  const events = {};
  const nEvents = input.readInt(true);
  for (let i = 0; i < nEvents; i++) {
    const name = input.readString();
    const intValue = input.readInt(false);
    const floatValue = input.readFloat();
    const stringValue = input.readString();
    const audioPath = input.readString();
    const e = {};
    if (intValue !== 0) e.int = intValue;
    if (floatValue !== 0) e.float = f32(floatValue);
    if (stringValue) e.string = stringValue;
    if (audioPath) {
      e.audio = audioPath;
      const volume = input.readFloat();
      const balance = input.readFloat();
      if (volume !== 1) e.volume = f32(volume);
      if (balance !== 0) e.balance = f32(balance);
    }
    events[name] = e;
    ctx.eventAudio[name] = !!audioPath;
  }
  ctx.eventNames = Object.keys(events);
  if (nEvents) json.events = events;

  // animations
  const animations = {};
  const nAnims = input.readInt(true);
  for (let i = 0; i < nAnims; i++) {
    const name = input.readString();
    animations[name] = readAnimation42(input, name, ctx);
  }
  if (nAnims) json.animations = animations;
  return json;
}

/** 4.2 皮肤。 */
function readSkin42(input, ctx, named) {
  const { bones, slots, nonessential } = ctx;
  const attachments = {};
  let slotCount;
  let skinJson = null;
  if (named === null) {
    slotCount = input.readInt(true);
    if (slotCount === 0) return null;
  } else {
    skinJson = { name: input.readString() };
    if (nonessential) {
      const color = input.readInt32();
      if ((color >>> 0) !== 0xFFFFFFFF) skinJson.color = rgbaToHex(color);
    }
    const boneCount = input.readInt(true);
    if (boneCount) {
      skinJson.bones = [];
      for (let i = 0; i < boneCount; i++) skinJson.bones.push(bones[input.readInt(true)].name);
    }
    const nIk = input.readInt(true);
    if (nIk) { skinJson.ik = []; for (let i = 0; i < nIk; i++) skinJson.ik.push(named.iks[input.readInt(true)].name); }
    const nTf = input.readInt(true);
    if (nTf) { skinJson.transform = []; for (let i = 0; i < nTf; i++) skinJson.transform.push(named.transforms[input.readInt(true)].name); }
    const nPath = input.readInt(true);
    if (nPath) { skinJson.path = []; for (let i = 0; i < nPath; i++) skinJson.path.push(named.paths[input.readInt(true)].name); }
    const nPhysics = input.readInt(true);
    if (nPhysics) { skinJson.physics = []; for (let i = 0; i < nPhysics; i++) skinJson.physics.push(named.physics[input.readInt(true)].name); }
    slotCount = input.readInt(true);
  }
  for (let i = 0; i < slotCount; i++) {
    const slotIndex = input.readInt(true);
    const slotName = slots[slotIndex].name;
    const perSlot = {};
    const attCount = input.readInt(true);
    for (let j = 0; j < attCount; j++) {
      const name = input.readStringRef();
      perSlot[name] = readAttachment42(input, name, ctx);
    }
    attachments[slotName] = perSlot;
  }
  if (named === null) return Object.keys(attachments).length ? attachments : null;
  skinJson.attachments = attachments;
  return skinJson;
}

/** 4.2 附件（flags 低 3 位=类型，高位=可选字段）。 */
function readAttachment42(input, attachmentName, ctx) {
  const { slots, nonessential } = ctx;
  const flags = input.readByte();
  const type = flags & 7;
  const name = (flags & 8) !== 0 ? input.readStringRef() : attachmentName;
  const named = name !== attachmentName ? { name } : {};
  const optPath = () => (flags & 16) !== 0 ? input.readStringRef() : null;
  const optColor = () => (flags & 32) !== 0 ? input.readInt32() : 0xFFFFFFFF;
  switch (type) {
    case 0: { // region
      const path = optPath();
      const color = optColor();
      const sequence = (flags & 64) !== 0 ? readSequence42(input) : null;
      const rotation = (flags & 128) !== 0 ? input.readFloat() : 0;
      const x = input.readFloat(), y = input.readFloat();
      const scaleX = input.readFloat(), scaleY = input.readFloat();
      const width = input.readFloat(), height = input.readFloat();
      const a = { ...named };
      if (path && path !== name) a.path = path;
      if (rotation !== 0) a.rotation = f32(rotation);
      if (x !== 0) a.x = f32(x);
      if (y !== 0) a.y = f32(y);
      if (scaleX !== 1) a.scaleX = f32(scaleX);
      if (scaleY !== 1) a.scaleY = f32(scaleY);
      a.width = f32(width);
      a.height = f32(height);
      if ((color >>> 0) !== 0xFFFFFFFF) a.color = rgbaToHex(color);
      if (sequence) a.sequence = sequence;
      return a;
    }
    case 1: { // boundingbox
      const vertices = readVertices42(input, (flags & 16) !== 0);
      const a = { type: 'boundingbox', ...named, vertexCount: vertices.vertexCount, vertices: vertices.vertices };
      if (nonessential) {
        const color = input.readInt32();
        if ((color >>> 0) !== 0x7FFFFFFF) a.color = rgbaToHex(color);
      }
      return a;
    }
    case 2: { // mesh
      const path = optPath();
      const color = optColor();
      const sequence = (flags & 64) !== 0 ? readSequence42(input) : null;
      const hullLength = input.readInt(true);
      const vertices = readVertices42(input, (flags & 128) !== 0);
      const uvs = [];
      for (let i = 0; i < vertices.length; i++) uvs.push(f32(input.readFloat()));
      const triangleCount = (vertices.length - hullLength - 2) * 3;
      const triangles = [];
      for (let i = 0; i < triangleCount; i++) triangles.push(input.readInt(true));
      const a = { type: 'mesh', ...named };
      if (path && path !== name) a.path = path;
      if ((color >>> 0) !== 0xFFFFFFFF) a.color = rgbaToHex(color);
      if (sequence) a.sequence = sequence;
      a.uvs = uvs;
      a.triangles = triangles;
      a.vertices = vertices.vertices;
      a.hull = hullLength;
      if (nonessential) {
        const nEdges = input.readInt(true);
        const edges = [];
        for (let i = 0; i < nEdges; i++) edges.push(input.readInt(true));
        if (edges.length) a.edges = edges;
        const width = input.readFloat(), height = input.readFloat();
        if (width !== 0) a.width = f32(width);
        if (height !== 0) a.height = f32(height);
      }
      return a;
    }
    case 3: { // linkedmesh
      const path = optPath();
      const color = optColor();
      const sequence = (flags & 64) !== 0 ? readSequence42(input) : null;
      const inheritTimelines = (flags & 128) !== 0;
      const skinIndex = input.readInt(true);
      const parent = input.readStringRef();
      const a = { type: 'linkedmesh', ...named };
      if (path && path !== name) a.path = path;
      if ((color >>> 0) !== 0xFFFFFFFF) a.color = rgbaToHex(color);
      if (sequence) a.sequence = sequence;
      if (!inheritTimelines) a.timelines = false;
      // JSON "skin"：父 mesh 所在 skin 名；default 省略
      a._skinIndex = skinIndex; // 内部标记，序列化前解析为名字
      a.parent = parent;
      if (nonessential) {
        const width = input.readFloat(), height = input.readFloat();
        if (width !== 0) a.width = f32(width);
        if (height !== 0) a.height = f32(height);
      }
      return a;
    }
    case 4: { // path
      const closed = (flags & 16) !== 0;
      const constantSpeed = (flags & 32) !== 0;
      const vertices = readVertices42(input, (flags & 64) !== 0);
      const lengths = [];
      for (let i = 0; i < vertices.length / 6; i++) lengths.push(f32(input.readFloat()));
      const a = { type: 'path', ...named, vertexCount: vertices.vertexCount, vertices: vertices.vertices, lengths };
      if (closed) a.closed = true;
      if (!constantSpeed) a.constantSpeed = false;
      if (nonessential) {
        const color = input.readInt32();
        if ((color >>> 0) !== 0x7FFFFFFF) a.color = rgbaToHex(color);
      }
      return a;
    }
    case 5: { // point
      const rotation = input.readFloat(), x = input.readFloat(), y = input.readFloat();
      const a = { type: 'point', ...named };
      if (rotation !== 0) a.rotation = f32(rotation);
      if (x !== 0) a.x = f32(x);
      if (y !== 0) a.y = f32(y);
      if (nonessential) {
        const color = input.readInt32();
        if ((color >>> 0) !== 0xFFFFF1FF) a.color = rgbaToHex(color);
      }
      return a;
    }
    case 6: { // clipping
      const endSlotIndex = input.readInt(true);
      const vertices = readVertices42(input, (flags & 16) !== 0);
      const a = { type: 'clipping', ...named, end: slots[endSlotIndex].name, vertexCount: vertices.vertexCount, vertices: vertices.vertices };
      if (nonessential) {
        const color = input.readInt32();
        if ((color >>> 0) !== 0x7FFFFFFF) a.color = rgbaToHex(color);
      }
      return a;
    }
    default:
      throw new Error(`未知的 4.2 附件类型 ${type}`);
  }
}

function readSequence42(input) {
  const count = input.readInt(true);
  const start = input.readInt(true);
  const digits = input.readInt(true);
  const setupIndex = input.readInt(true);
  const s = { count };
  if (start !== 1) s.start = start;
  if (digits !== 0) s.digits = digits;
  if (setupIndex !== 0) s.setup = setupIndex;
  return s;
}

/** 4.2 顶点：返回 { vertexCount, length, vertices }。 */
function readVertices42(input, weighted) {
  const vertexCount = input.readInt(true);
  const length = vertexCount << 1;
  if (!weighted) {
    const vertices = [];
    for (let i = 0; i < length; i++) vertices.push(f32(input.readFloat()));
    return { vertexCount, length, vertices };
  }
  const out = [];
  for (let i = 0; i < vertexCount; i++) {
    const boneCount = input.readInt(true);
    out.push(boneCount);
    for (let j = 0; j < boneCount; j++) {
      out.push(input.readInt(true));
      out.push(f32(input.readFloat()), f32(input.readFloat()), f32(input.readFloat()));
    }
  }
  return { vertexCount, length, vertices: out };
}

/** 4.2 动画（bezier 分段式曲线）。 */
function readAnimation42(input, name, ctx) {
  const { slots, bones, skins } = ctx;
  const anim = {};
  input.readInt(true); // timelineCount（信息性，跳过）

  // slot timelines
  const slotTl = {};
  const nSlotGroups = input.readInt(true);
  for (let g = 0; g < nSlotGroups; g++) {
    const slotIndex = input.readInt(true);
    const slotName = slots[slotIndex].name;
    const per = {};
    const n = input.readInt(true);
    for (let t = 0; t < n; t++) {
      const type = input.readByte();
      const frameCount = input.readInt(true);
      const frameLast = frameCount - 1;
      if (type === 0) { // attachment
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat();
          const att = input.readStringRef();
          const f = { time: f32(time) };
          if (att) f.name = att;
          // name=null 为官方语义（清空槽位附件），JSON 省略 name 键
          frames.push(f);
        }
        per.attachment = frames;
      } else if (type === 1 || type === 2 || type === 3 || type === 4 || type === 5) {
        // rgba(1)/rgb(2)/rgba2(3)/rgb2(4)/alpha(5)——官方顺序：time 在前、颜色字节在后
        const bezierCount = input.readInt(true);
        const channels = { 1: 4, 2: 3, 3: 7, 4: 6, 5: 1 }[type];
        const keyName = { 1: 'rgba', 2: 'rgb', 3: 'rgba2', 4: 'rgb2', 5: 'alpha' }[type];
        const frames = [];
        const curves = [];
        const readColor = (n) => {
          const parts = [];
          for (let i = 0; i < n; i++) parts.push(input.readUByte());
          return parts;
        };
        let time = input.readFloat();
        let cur = readColor(channels);
        for (let frame = 0; ; frame++) {
          const f = { time: f32(time) };
          if (type === 1) f.color = byteHex(cur[0]) + byteHex(cur[1]) + byteHex(cur[2]) + byteHex(cur[3]);
          else if (type === 2) f.color = byteHex(cur[0]) + byteHex(cur[1]) + byteHex(cur[2]);
          else if (type === 3) {
            f.light = byteHex(cur[0]) + byteHex(cur[1]) + byteHex(cur[2]) + byteHex(cur[3]);
            f.dark = byteHex(cur[4]) + byteHex(cur[5]) + byteHex(cur[6]);
          } else if (type === 4) {
            f.light = byteHex(cur[0]) + byteHex(cur[1]) + byteHex(cur[2]);
            f.dark = byteHex(cur[3]) + byteHex(cur[4]) + byteHex(cur[5]);
          } else if (type === 5) f.value = f32(cur[0] / 255);
          frames.push(f);
          curves.push(new Array(channels).fill(null));
          if (frame === frameLast) break;
          const time2 = input.readFloat();
          const next = readColor(channels);
          const curveType = input.readByte();
          if (curveType === 1) {
            for (let c = 0; c < channels; c++) curves[frame][c] = 'stepped';
          } else if (curveType === 2) {
            for (let c = 0; c < channels; c++) {
              const cx1 = input.readFloat(), cy1 = input.readFloat();
              const cx2 = input.readFloat(), cy2 = input.readFloat();
              curves[frame][c] = [f32(cx1), f32(cy1), f32(cx2), f32(cy2)];
            }
          }
          cur = next;
          time = time2;
        }
        for (let i = 0; i < frames.length - 1; i++) {
          const c = mergeCurves(curves[i], ctx.meta, `${name}/${slotName}/${keyName}#${i}`);
          if (c === 'stepped') frames[i].curve = 'stepped';
          else if (c) frames[i].curve = c;
        }
        per[keyName] = frames;
      } else throw new Error(`未知 4.2 slot timeline 类型 ${type}`);
    }
    slotTl[slotName] = per;
  }
  if (nSlotGroups) anim.slots = slotTl;

  // bone timelines
  const boneTl = {};
  const nBoneGroups = input.readInt(true);
  for (let g = 0; g < nBoneGroups; g++) {
    const boneIndex = input.readInt(true);
    const boneName = bones[boneIndex].name;
    const per = {};
    const n = input.readInt(true);
    for (let t = 0; t < n; t++) {
      const type = input.readByte();
      const frameCount = input.readInt(true);
      const frameLast = frameCount - 1;
      if (type === 10) { // inherit
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat();
          const inherit = input.readByte();
          const f = { time: f32(time) };
          if (inherit !== 0) f.inherit = INHERIT_42[inherit];
          frames.push(f);
        }
        per.inherit = frames;
        continue;
      }
      const bezierCount = input.readInt(true);
      const isPair = type === 1 || type === 4 || type === 7; // translate / scale / shear
      const keyName = {
        0: 'rotate', 1: 'translate', 2: 'translatex', 3: 'translatey',
        4: 'scale', 5: 'scalex', 6: 'scaley', 7: 'shear', 8: 'shearx', 9: 'sheary',
      }[type];
      const channels = isPair ? 2 : 1;
      const frames = [];
      const curves = [];
      const readValue = () => {
        if (type === 0) return f32(input.readFloat()); // angle
        return f32(input.readFloat());
      };
      let time = input.readFloat();
      let v1 = readValue();
      let v2 = isPair ? readValue() : 0;
      for (let frame = 0; ; frame++) {
        const f = { time: f32(time) };
        // 官方 4.2 JSON：单值 timeline（含 rotate）值键统一为 "value"；成对为 "x"/"y"
        if (isPair) { f.x = v1; f.y = v2; }
        else f.value = v1;
        frames.push(f);
        curves.push(new Array(channels).fill(null));
        if (frame === frameLast) break;
        const time2 = input.readFloat();
        const nv1 = readValue();
        const nv2 = isPair ? readValue() : 0;
        const curveType = input.readByte();
        if (curveType === 1) {
          for (let c = 0; c < channels; c++) curves[frame][c] = 'stepped';
        } else if (curveType === 2) {
          for (let c = 0; c < channels; c++) {
            const cx1 = input.readFloat(), cy1 = input.readFloat();
            const cx2 = input.readFloat(), cy2 = input.readFloat();
            curves[frame][c] = [f32(cx1), f32(cy1), f32(cx2), f32(cy2)];
          }
        }
        time = time2; v1 = nv1; v2 = nv2;
      }
      for (let i = 0; i < frames.length - 1; i++) {
        const c = mergeCurves(curves[i], ctx.meta, `${name}/${boneName}/${keyName}#${i}`);
        if (c === 'stepped') frames[i].curve = 'stepped';
        else if (c) frames[i].curve = c;
      }
      per[keyName] = frames;
    }
    boneTl[boneName] = per;
  }
  if (nBoneGroups) anim.bones = boneTl;

  // ik timelines（flags 每帧）
  const ikTl = {};
  const nIk = input.readInt(true);
  for (let g = 0; g < nIk; g++) {
    const index = input.readInt(true);
    const frameCount = input.readInt(true);
    const frameLast = frameCount - 1;
    const bezierCount = input.readInt(true);
    const frames = [];
    const curves = [];
    let flags = input.readByte();
    let time = input.readFloat();
    let mix = (flags & 1) !== 0 ? ((flags & 2) !== 0 ? input.readFloat() : 1) : 0;
    let softness = (flags & 4) !== 0 ? input.readFloat() : 0;
    for (let frame = 0; ; frame++) {
      const f = { time: f32(time), mix: f32(mix) };
      if (softness !== 0) f.softness = f32(softness);
      if (!((flags & 8) !== 0)) f.bendPositive = false;
      if (flags & 16) f.compress = true;
      if (flags & 32) f.stretch = true;
      frames.push(f);
      curves.push([null, null]);
      if (frame === frameLast) break;
      flags = input.readByte();
      const time2 = input.readFloat();
      const mix2 = (flags & 1) !== 0 ? ((flags & 2) !== 0 ? input.readFloat() : 1) : 0;
      const softness2 = (flags & 4) !== 0 ? input.readFloat() : 0;
      if (flags & 64) {
        curves[frame][0] = 'stepped';
        curves[frame][1] = 'stepped';
      } else if (flags & 128) {
        for (let c = 0; c < 2; c++) {
          const cx1 = input.readFloat(), cy1 = input.readFloat();
          const cx2 = input.readFloat(), cy2 = input.readFloat();
          curves[frame][c] = [f32(cx1), f32(cy1), f32(cx2), f32(cy2)];
        }
      }
      time = time2; mix = mix2; softness = softness2;
    }
    for (let i = 0; i < frames.length - 1; i++) {
      const c = mergeCurves(curves[i], ctx.meta, `${name}/ik/${ctx.ikNames[index]}#${i}`);
      if (c === 'stepped') frames[i].curve = 'stepped';
      else if (c) frames[i].curve = c;
    }
    ikTl[ctx.ikNames[index]] = frames;
  }
  if (nIk) anim.ik = ikTl;

  // transform timelines
  const tfTl = {};
  const nTf = input.readInt(true);
  for (let g = 0; g < nTf; g++) {
    const index = input.readInt(true);
    const frameCount = input.readInt(true);
    const frameLast = frameCount - 1;
    const bezierCount = input.readInt(true);
    const frames = [];
    const curves = [];
    let time = input.readFloat();
    let mixRotate = input.readFloat(), mixX = input.readFloat(), mixY = input.readFloat();
    let mixScaleX = input.readFloat(), mixScaleY = input.readFloat(), mixShearY = input.readFloat();
    for (let frame = 0; ; frame++) {
      const f = { time: f32(time) };
      if (mixRotate !== 1) f.mixRotate = f32(mixRotate);
      if (mixX !== 1) f.mixX = f32(mixX);
      if (mixY !== 1) f.mixY = f32(mixY);
      if (mixScaleX !== 1) f.mixScaleX = f32(mixScaleX);
      if (mixScaleY !== 1) f.mixScaleY = f32(mixScaleY);
      if (mixShearY !== 1) f.mixShearY = f32(mixShearY);
      frames.push(f);
      curves.push(new Array(6).fill(null));
      if (frame === frameLast) break;
      const time2 = input.readFloat();
      const nr = input.readFloat(), nx = input.readFloat(), ny = input.readFloat();
      const nsx = input.readFloat(), nsy = input.readFloat(), nshy = input.readFloat();
      const curveType = input.readByte();
      if (curveType === 1) {
        for (let c = 0; c < 6; c++) curves[frame][c] = 'stepped';
      } else if (curveType === 2) {
        for (let c = 0; c < 6; c++) {
          const cx1 = input.readFloat(), cy1 = input.readFloat();
          const cx2 = input.readFloat(), cy2 = input.readFloat();
          curves[frame][c] = [f32(cx1), f32(cy1), f32(cx2), f32(cy2)];
        }
      }
      time = time2;
      mixRotate = nr; mixX = nx; mixY = ny;
      mixScaleX = nsx; mixScaleY = nsy; mixShearY = nshy;
    }
    for (let i = 0; i < frames.length - 1; i++) {
      const c = mergeCurves(curves[i], ctx.meta, `${name}/transform/${ctx.tfNames[index]}#${i}`);
      if (c === 'stepped') frames[i].curve = 'stepped';
      else if (c) frames[i].curve = c;
    }
    tfTl[ctx.tfNames[index]] = frames;
  }
  if (nTf) anim.transform = tfTl;

  // path timelines
  const pathTl = {};
  const nPath = input.readInt(true);
  for (let g = 0; g < nPath; g++) {
    const index = input.readInt(true);
    const per = {};
    const n = input.readInt(true);
    for (let t = 0; t < n; t++) {
      const type = input.readByte();
      const frameCount = input.readInt(true);
      const frameLast = frameCount - 1;
      const bezierCount = input.readInt(true);
      if (type === 0 || type === 1) { // position / spacing
        const keyName = type === 0 ? 'position' : 'spacing';
        const frames = [];
        const curves = [];
        let time = input.readFloat();
        let value = input.readFloat();
        for (let frame = 0; ; frame++) {
          const f = { time: f32(time), value: f32(value) };
          frames.push(f);
          curves.push([null]);
          if (frame === frameLast) break;
          const time2 = input.readFloat();
          const value2 = input.readFloat();
          const curveType = input.readByte();
          if (curveType === 1) curves[frame][0] = 'stepped';
          else if (curveType === 2) {
            const cx1 = input.readFloat(), cy1 = input.readFloat();
            const cx2 = input.readFloat(), cy2 = input.readFloat();
            curves[frame][0] = [f32(cx1), f32(cy1), f32(cx2), f32(cy2)];
          }
          time = time2; value = value2;
        }
        for (let i = 0; i < frames.length - 1; i++) {
          const c = curves[i][0];
          if (c === 'stepped') frames[i].curve = 'stepped';
          else if (c) frames[i].curve = c;
        }
        per[keyName] = frames;
      } else if (type === 2) { // mix
        const frames = [];
        const curves = [];
        let time = input.readFloat();
        let mixRotate = input.readFloat(), mixX = input.readFloat(), mixY = input.readFloat();
        for (let frame = 0; ; frame++) {
          const f = { time: f32(time) };
          if (mixRotate !== 1) f.mixRotate = f32(mixRotate);
          if (mixX !== 1) f.mixX = f32(mixX);
          if (mixY !== 1) f.mixY = f32(mixY);
          frames.push(f);
          curves.push(new Array(3).fill(null));
          if (frame === frameLast) break;
          const time2 = input.readFloat();
          const nr = input.readFloat(), nx = input.readFloat(), ny = input.readFloat();
          const curveType = input.readByte();
          if (curveType === 1) {
            for (let c = 0; c < 3; c++) curves[frame][c] = 'stepped';
          } else if (curveType === 2) {
            for (let c = 0; c < 3; c++) {
              const cx1 = input.readFloat(), cy1 = input.readFloat();
              const cx2 = input.readFloat(), cy2 = input.readFloat();
              curves[frame][c] = [f32(cx1), f32(cy1), f32(cx2), f32(cy2)];
            }
          }
          time = time2; mixRotate = nr; mixX = nx; mixY = ny;
        }
        for (let i = 0; i < frames.length - 1; i++) {
          const c = mergeCurves(curves[i], ctx.meta, `${name}/path-mix/${ctx.pathNames[index]}#${i}`);
          if (c === 'stepped') frames[i].curve = 'stepped';
          else if (c) frames[i].curve = c;
        }
        per.mix = frames;
      } else throw new Error(`未知 4.2 path timeline 类型 ${type}`);
    }
    pathTl[ctx.pathNames[index]] = per;
  }
  if (nPath) anim.path = pathTl;

  // physics timelines（index-1；reset 无曲线）
  const physicsTl = {};
  const nPhysics = input.readInt(true);
  for (let g = 0; g < nPhysics; g++) {
    const index = input.readInt(true) - 1;
    const per = {};
    const n = input.readInt(true);
    for (let t = 0; t < n; t++) {
      const type = input.readByte();
      const frameCount = input.readInt(true);
      const frameLast = frameCount - 1;
      if (type === 8) { // reset
        const frames = [];
        for (let i = 0; i < frameCount; i++) {
          const time = input.readFloat();
          frames.push({ time: f32(time) });
        }
        per.reset = frames;
        continue;
      }
      const bezierCount = input.readInt(true);
      const keyName = {
        0: 'inertia', 1: 'strength', 2: 'damping', 4: 'mass', 5: 'wind', 6: 'gravity', 7: 'mix',
      }[type];
      const frames = [];
      const curves = [];
      let time = input.readFloat();
      let value = input.readFloat();
      for (let frame = 0; ; frame++) {
        const f = { time: f32(time), value: f32(value) };
        frames.push(f);
        curves.push([null]);
        if (frame === frameLast) break;
        const time2 = input.readFloat();
        const value2 = input.readFloat();
        const curveType = input.readByte();
        if (curveType === 1) curves[frame][0] = 'stepped';
        else if (curveType === 2) {
          const cx1 = input.readFloat(), cy1 = input.readFloat();
          const cx2 = input.readFloat(), cy2 = input.readFloat();
          curves[frame][0] = [f32(cx1), f32(cy1), f32(cx2), f32(cy2)];
        }
        time = time2; value = value2;
      }
      for (let i = 0; i < frames.length - 1; i++) {
        const c = curves[i][0];
        if (c === 'stepped') frames[i].curve = 'stepped';
        else if (c) frames[i].curve = c;
      }
      per[keyName] = frames;
    }
    physicsTl[ctx.physicsNames[index]] = per;
  }
  if (nPhysics) anim.physics = physicsTl;

  // attachment timelines：deform / sequence
  const attTl = {};
  const nSkinGroups = input.readInt(true);
  for (let g = 0; g < nSkinGroups; g++) {
    const skinIndex = input.readInt(true);
    const skinName = skins[skinIndex].name;
    const perSkin = attTl[skinName] ?? (attTl[skinName] = {});
    const nSlots = input.readInt(true);
    for (let s = 0; s < nSlots; s++) {
      const slotIndex = input.readInt(true);
      const slotName = slots[slotIndex].name;
      const perSlot = perSkin[slotName] ?? (perSkin[slotName] = {});
      const nAtts = input.readInt(true);
      for (let a = 0; a < nAtts; a++) {
        const attachmentName = input.readStringRef();
        const perAtt = perSlot[attachmentName] ?? (perSlot[attachmentName] = {});
        const attachment = resolveVertexSource(skins, skinIndex, findAttachment(skins, skinIndex, slotIndex, attachmentName));
        const weighted = isWeighted(attachment);
        const timelineType = input.readByte();
        const frameCount = input.readInt(true);
        const frameLast = frameCount - 1;
        if (timelineType === 0) { // deform
          const bezierCount = input.readInt(true);
          const frames = [];
          const curves = [];
          let time = input.readFloat();
          for (let frame = 0; ; frame++) {
            const f = { time: f32(time) };
            const end = input.readInt(true);
            if (end !== 0) {
              const start = input.readInt(true);
              const values = [];
              for (let v = 0; v < end; v++) values.push(f32(input.readFloat()));
              if (start !== 0) f.offset = start;
              f.vertices = values;
            }
            frames.push(f);
            curves.push([null]);
            if (frame === frameLast) break;
            const time2 = input.readFloat();
            const curveType = input.readByte();
            if (curveType === 1) curves[frame][0] = 'stepped';
            else if (curveType === 2) {
              const cx1 = input.readFloat(), cy1 = input.readFloat();
              const cx2 = input.readFloat(), cy2 = input.readFloat();
              curves[frame][0] = [f32(cx1), f32(cy1), f32(cx2), f32(cy2)];
            }
            time = time2;
          }
          for (let i = 0; i < frames.length - 1; i++) {
            const c = curves[i][0];
            if (c === 'stepped') frames[i].curve = 'stepped';
            else if (c) frames[i].curve = c;
          }
          perAtt.deform = frames;
        } else if (timelineType === 1) { // sequence
          const frames = [];
          for (let frame = 0; frame < frameCount; frame++) {
            const time = input.readFloat();
            const modeAndIndex = input.readInt32();
            const delay = input.readFloat();
            const mode = SEQUENCE_MODES[modeAndIndex & 15];
            const index = modeAndIndex >> 4;
            const f = { time: f32(time) };
            if (mode !== 'hold') f.mode = mode;
            if (index !== 0) f.index = index;
            f.delay = f32(delay);
            frames.push(f);
          }
          perAtt.sequence = frames;
        } else throw new Error(`未知 4.2 attachment timeline 类型 ${timelineType}`);
      }
    }
  }
  if (nSkinGroups) anim.attachments = attTl;

  // drawOrder
  const drawOrderCount = input.readInt(true);
  if (drawOrderCount > 0) {
    const doFrames = [];
    for (let i = 0; i < drawOrderCount; i++) {
      const time = input.readFloat();
      const offsetCount = input.readInt(true);
      const offsets = [];
      for (let j = 0; j < offsetCount; j++) {
        const slotIndex = input.readInt(true);
        const offset = input.readInt(true);
        offsets.push({ slot: slots[slotIndex].name, offset }); // JSON 规范：槽位名
      }
      const f = { time: f32(time) };
      if (offsets.length) f.offsets = offsets;
      doFrames.push(f);
    }
    anim.drawOrder = doFrames;
  }

  // events
  const eventCount = input.readInt(true);
  if (eventCount > 0) {
    const evFrames = [];
    for (let i = 0; i < eventCount; i++) {
      const time = input.readFloat();
      const eventIndex = input.readInt(true);
      const intValue = input.readInt(false);
      const floatValue = input.readFloat();
      const stringValue = input.readString();
      const eventName = ctx.eventNames[eventIndex];
      const f = { time: f32(time), name: eventName };
      if (intValue !== 0) f.int = intValue;
      if (floatValue !== 0) f.float = f32(floatValue);
      if (stringValue != null) f.string = stringValue;
      if (ctx.eventAudio[eventName]) {
        const volume = input.readFloat();
        const balance = input.readFloat();
        if (volume !== 1) f.volume = f32(volume);
        if (balance !== 0) f.balance = f32(balance);
      }
      evFrames.push(f);
    }
    anim.events = evFrames;
  }
  return anim;
}

/** 后处理：linkedmesh 的 _skinIndex → JSON "skin" 名（default 省略）。 */
export function postProcessLinkedMeshSkins(json) {
  const skins = json.skins || [];
  const fix = (attachments, skinIndex) => {
    for (const slot in attachments) {
      for (const name in attachments[slot]) {
        const att = attachments[slot][name];
        if (att && att._skinIndex !== undefined) {
          const parentSkin = skins[att._skinIndex];
          if (parentSkin && parentSkin.name !== 'default') att.skin = parentSkin.name;
          delete att._skinIndex;
        }
      }
    }
  };
  skins.forEach((skin, i) => fix(skin.attachments, i));
  return json;
}

export { Bin, f32 };
