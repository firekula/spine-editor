/**
 * AST → Spine JSON 序列化器（版本感知）。
 *
 * 原则：
 * 1. 无损：AST 中出现的所有字段都会写出，一个不丢；未被顺序表覆盖的字段
 *    按原出现顺序追加在已知字段之后。3.8 特有的 curve/c2/c3/c4 分量键、
 *    空对象 key（{}）、默认值折叠（首 key 省略 "time":0 等）全部原样保留。
 * 2. 顺序规范化：仅影响可读性，不影响语义——Spine JSON 中数组有序、
 *    对象字典无序，官方编辑器 Import Data 也不依赖字段顺序。
 * 3. 数值：JSON.stringify 的最短往返表示，与 JSON.parse 往返 bit 级一致。
 *
 * Phase 0 尚未实现“写出侧的默认值折叠”（有什么写什么）。这不影响 Import Data；
 * 字节级对齐官方导出风格是后续可选的回归目标。
 *
 * 以下结构形状均已对官方 3.8.99 / 4.2.22 导出语料实证：
 * - 顶层：skeleton,bones,slots,ik,transform,path,physics,skins,events,animations
 * - skins[].attachments[slot][attachment] = 附件对象
 * - animations.X.slots[slot][tlType]      = timeline 键数组
 * - animations.X.bones[bone][tlType]      = timeline 键数组
 * - animations.X.ik/transform/path[名字]   = timeline 键数组（直挂，键上自带 mix 等字段）
 * - animations.X.physics[名字][属性]       = timeline 键数组（4.2，每属性独立时间轴）
 * - animations.X.attachments[skin][slot][attachment].deform = timeline 键数组（4.x 实证）
 * - animations.X.drawOrder = [{ time, offsets:[{slot,offset}] }]
 * - animations.X.events   = [{ time, name, int, float, string, volume, balance }]
 */
import { detectVersion } from './parse.mjs';

const ORDER = {
  root: ['skeleton', 'bones', 'slots', 'ik', 'transform', 'path', 'physics', 'skins', 'events', 'animations'],
  skeleton: ['hash', 'spine', 'x', 'y', 'width', 'height', 'images', 'audio', 'fps'],
  bone: ['name', 'parent', 'length', 'rotation', 'x', 'y', 'scaleX', 'scaleY', 'shearX', 'shearY',
    'inherit', 'rotationMode', 'transform', 'path', 'skinRequired', 'color', 'icon', 'visible', 'sequential'],
  slot: ['name', 'bone', 'color', 'darkColor', 'attachment', 'blend', 'sequenceSend'],
  ik: ['name', 'order', 'bones', 'target', 'bendDirection', 'mix', 'softness', 'stretch', 'uniform'],
  transform: ['name', 'order', 'bones', 'target', 'rotation', 'x', 'y', 'scaleX', 'scaleY', 'shearY',
    'offset', 'mixRotate', 'mixX', 'mixY', 'mixScaleX', 'mixScaleY', 'mixShearY'],
  path: ['name', 'order', 'bones', 'target', 'position', 'spacing', 'rotate', 'translate',
    'x', 'y', 'mixRotate', 'mixX', 'mixY', 'mixScaleX', 'mixScaleY', 'mixShearY'],
  physics: ['name', 'order', 'bone', 'x', 'y', 'translate', 'rotate', 'scaleX', 'shearX', 'limit',
    'inertia', 'strength', 'damping', 'stiffness', 'spring', 'mass', 'wind', 'gravity', 'followers', 'mix'],
  event: ['name', 'int', 'float', 'string', 'audio', 'volume', 'balance'],
  skin: ['name', 'attachments'],
  attachment: ['type', 'path', 'rotation', 'x', 'y', 'scaleX', 'scaleY', 'width', 'height', 'color',
    'sequence', 'closed', 'constantSpeed', 'vertexCount', 'uvs', 'triangles', 'vertices', 'hull',
    'edges', 'lengths', 'end', 'parent', 'skin', 'slot', 'deform'],
  animation: ['slots', 'bones', 'ik', 'transform', 'path', 'physics', 'attachments', 'drawOrder', 'events'],
  timelineKey: ['time'], // time 在前；curve/c2/c3/c4 与值字段保持原相对顺序（官方亦是如此）
  drawOrderKey: ['time', 'offsets'],
  drawOffset: ['slot', 'offset'],
  eventKey: ['time', 'name', 'int', 'float', 'string', 'volume', 'balance'],
};

const ARRAY_SECTIONS = new Map([
  ['bones', 'bone'], ['slots', 'slot'], ['ik', 'ik'], ['transform', 'transform'],
  ['path', 'path'], ['physics', 'physics'], ['events', 'event'],
]);

/** 已知字段在前（按表序），未知字段按原序追加。返回新对象，值浅拷贝引用。 */
function ordered(obj, table) {
  const known = ORDER[table];
  const out = {};
  for (const k of known) if (k in obj) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
  return out;
}

function mapTimelineArray(arr) {
  return arr.map((key) => (key && typeof key === 'object' ? ordered(key, 'timelineKey') : key));
}

/** slots/bones：名字→{timeline 类型:键数组}。 */
function serSlotBoneDict(section) {
  const out = {};
  for (const [name, types] of Object.entries(section)) {
    if (!types || typeof types !== 'object' || Array.isArray(types)) { out[name] = types; continue; }
    const to = {};
    for (const [tlType, tl] of Object.entries(types)) {
      to[tlType] = Array.isArray(tl) ? mapTimelineArray(tl) : tl;
    }
    out[name] = to;
  }
  return out;
}

/** ik/transform/path：约束名→键数组（每个键自带 mix/softness/bendPositive 等字段）。 */
function serConstraintArrayDict(section) {
  const out = {};
  for (const [name, tl] of Object.entries(section)) {
    out[name] = Array.isArray(tl) ? mapTimelineArray(tl) : tl;
  }
  return out;
}

/** physics（4.2）：约束名→{属性:键数组}，每个属性独立时间轴。 */
function serPhysicsDict(section) {
  const out = {};
  for (const [name, props] of Object.entries(section)) {
    if (!props || typeof props !== 'object' || Array.isArray(props)) { out[name] = props; continue; }
    const po = {};
    for (const [prop, tl] of Object.entries(props)) {
      po[prop] = Array.isArray(tl) ? mapTimelineArray(tl) : tl;
    }
    out[name] = po;
  }
  return out;
}

/** deform：skin→slot→attachment→{deform:[键]}（4.x）；兼容更扁平或更深的未知形状。 */
function serDeformSection(section) {
  const out = {};
  for (const [skinName, slots] of Object.entries(section)) {
    out[skinName] = slots && typeof slots === 'object' ? serDeformLevel(slots) : slots;
  }
  return out;
}
function serDeformLevel(node) {
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (Array.isArray(v)) out[k] = mapTimelineArray(v);
    else if (v && typeof v === 'object') out[k] = serDeformLevel(v);
    else out[k] = v;
  }
  return out;
}

function serAnimation(anim) {
  const out = {};
  for (const [k, v] of Object.entries(ordered(anim, 'animation'))) {
    switch (k) {
      case 'slots': case 'bones':
        out[k] = serSlotBoneDict(v); break;
      case 'ik': case 'transform': case 'path':
        out[k] = serConstraintArrayDict(v); break;
      case 'physics':
        out[k] = serPhysicsDict(v); break;
      case 'attachments':
        out[k] = serDeformSection(v); break;
      case 'drawOrder':
        out[k] = v.map((key) => {
          const o = ordered(key, 'drawOrderKey');
          if (Array.isArray(o.offsets)) o.offsets = o.offsets.map((e) => ordered(e, 'drawOffset'));
          return o;
        }); break;
      case 'events':
        out[k] = v.map((key) => ordered(key, 'eventKey')); break;
      default:
        out[k] = v; // 未知段落原样保留（无损）
    }
  }
  return out;
}

/**
 * 序列化 AST 为 JSON 文本。
 * @param {object} ast 文档树
 * @param {{version?: string, indent?: number}} opts version 缺省时自动探测
 */
export function serialize(ast, opts = {}) {
  const version = opts.version ?? detectVersion(ast);
  const supported = ['3.8', '4.2'];
  if (!supported.includes(version)) {
    throw new Error(`暂不支持的版本 ${version}（当前支持：${supported.join(' / ')}）`);
  }
  const root = {};
  for (const [k, v] of Object.entries(ordered(ast, 'root'))) {
    if (ARRAY_SECTIONS.has(k) && Array.isArray(v)) {
      root[k] = v.map((item) => (item && typeof item === 'object' ? ordered(item, ARRAY_SECTIONS.get(k)) : item));
    } else if (k === 'skeleton') {
      root[k] = ordered(v, 'skeleton');
    } else if (k === 'skins') {
      root[k] = v.map((skin) => {
        const s = ordered(skin, 'skin');
        if (s.attachments && typeof s.attachments === 'object') {
          const slots = {};
          for (const [slotName, atts] of Object.entries(s.attachments)) {
            const ao = {};
            for (const [attName, att] of Object.entries(atts)) {
              ao[attName] = att && typeof att === 'object' ? ordered(att, 'attachment') : att;
            }
            slots[slotName] = ao;
          }
          s.attachments = slots;
        }
        return s;
      });
    } else if (k === 'animations') {
      const anims = {};
      for (const [name, anim] of Object.entries(v)) {
        anims[name] = anim && typeof anim === 'object' ? serAnimation(anim) : anim;
      }
      root[k] = anims;
    } else {
      root[k] = v; // 未知顶层字段原样保留（无损）
    }
  }
  const text = JSON.stringify(root, null, opts.indent ?? 2);
  assertRoundtripSafe(text);
  return text;
}

/** 防御：产物必须能被 JSON.parse（拦截 NaN/Infinity 之类的坏值混入 AST）。 */
function assertRoundtripSafe(text) {
  try {
    JSON.parse(text);
  } catch (e) {
    throw new Error(`序列化产物不是合法 JSON：${e.message}（AST 中可能混入了 NaN/Infinity）`);
  }
}
