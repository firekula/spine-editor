/**
 * 双版本 spine-core 运行时加载（Node 环境下的纯数据加载，无需浏览器/WebGL）。
 *
 * 用法：
 *   const { loadSkeletonData, fingerprint } = await import('../load/runtime.mjs');
 *   const sd = await loadSkeletonData('4.2', jsonText, atlasText);
 *
 * 版本差异（已对源码实证）：
 * - 3.8 TextureAtlas 构造器必须传 textureLoader 回调（纯数据加载给占位对象即可，
 *   运行期不会触碰像素）；4.2 构造器只收 atlas 文本，贴图由渲染层事后挂载。
 * - 两版 SkeletonJson.readSkeletonData 都同时接受字符串或已解析对象。
 *
 * 产物 build/spine-{version}.mjs 由 scripts/build-runtimes.mjs 生成；
 * 交付包已内置产物，仅更换 vendor 源码后需重新构建。
 */

const SUPPORTED = ['3.8', '4.2'];
const cache = {};

/** 获取指定大版本的 spine 命名空间（懒加载构建产物）。 */
export async function getRuntime(version) {
  if (!SUPPORTED.includes(version)) {
    throw new Error(`不支持的版本 ${version}（当前支持：${SUPPORTED.join(' / ')}）`);
  }
  if (cache[version]) return cache[version];
  try {
    const mod = await import(`../../build/spine-${version}.mjs`);
    cache[version] = mod.spine;
    return mod.spine;
  } catch (e) {
    throw new Error(
      `无法加载 spine-core ${version}：${e.message}\n` +
      '若 build/spine-*.mjs 不存在，请先运行 npm install && npm run build:runtimes',
    );
  }
}

/** 3.8 占位贴图：纯数据加载不触碰像素，但 3.8.99 解析期会调用以下方法取尺寸/设过滤。 */
function stubTexture() {
  const image = { width: 2048, height: 2048 };
  return {
    width: image.width,
    height: image.height,
    getImage: () => image,
    n: () => image,
    setFilters() {},
    setWraps() {},
    dispose() {},
  };
}

/**
 * 用官方 runtime 解析 atlas 文本（两版格式差异由 runtime 自己吸收）。
 * 返回 { pages: [页名], regions: [区名] } —— 区名即 findRegion 的匹配键。
 */
export async function parseAtlas(version, atlasText) {
  const spine = await getRuntime(version);
  const atlas =
    version === '3.8' ? new spine.TextureAtlas(atlasText, stubTexture) : new spine.TextureAtlas(atlasText);
  return {
    pages: atlas.pages.map((p) => p.name),
    regions: atlas.regions.map((r) => r.name),
  };
}

/**
 * 加载骨架数据（纯数据路径：Atlas 解析 + AtlasAttachmentLoader + SkeletonJson）。
 * @param {'3.8'|'4.2'} version
 * @param {string} jsonText .json 文本
 * @param {string} atlasText .atlas 文本
 * @returns 运行时 SkeletonData
 */
export async function loadSkeletonData(version, jsonText, atlasText) {
  const spine = await getRuntime(version);
  const atlas =
    version === '3.8' ? new spine.TextureAtlas(atlasText, stubTexture) : new spine.TextureAtlas(atlasText);
  const attachmentLoader = new spine.AtlasAttachmentLoader(atlas);
  const skeletonJson = new spine.SkeletonJson(attachmentLoader);
  return skeletonJson.readSkeletonData(jsonText);
}

/**
 * 语义指纹：对同一份 SkeletonData 提取与“数据内容”强相关的结构摘要。
 * 金标准与回环产物分别加载后指纹必须一致——这是 Stage B 的判定依据。
 * 注意：SkeletonData 的 bones/slots 是 BoneData/SlotData 直数组（b.name），
 * 不要与 Skeleton 实例的 bones（b.data.name）混淆。
 */
export function fingerprint(sd) {
  return {
    bones: sd.bones.map((b) => b.name),
    boneParents: sd.bones.map((b) => (b.parent ? b.parent.name : null)),
    slots: sd.slots.map((s) => s.name),
    skins: sd.skins.map((s) => s.name),
    events: sd.events.map((e) => e.name),
    animations: sd.animations.map((a) => `${a.name}|${a.timelines.length}tl|${a.duration}s`),
    constraints: {
      ik: sd.ikConstraints.length,
      transform: sd.transformConstraints.length,
      path: sd.pathConstraints.length,
      physics: sd.physicsConstraints ? sd.physicsConstraints.length : 0,
    },
  };
}
