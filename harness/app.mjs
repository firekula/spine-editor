/**
 * Phase 1 视口主逻辑：双版本（3.8/4.2）runtime 动态加载 + WebGL 骨架渲染。
 *
 * 关键设计：
 * - 版本自动检测：读 JSON 的 skeleton.spine 字段 → 动态 import 对应 webgl bundle；
 *   两个 bundle 的顶层 var 都收敛在 ESM 模块作用域内，同页共存不冲突；
 * - 纹理装载：先按 atlas 文本启发式解析页名 → 预载图片 → GLTexture →
 *   3.8 经 TextureAtlas(textureLoader) 构造、4.2 构造后逐页 setTexture；
 * - 渲染循环按版本分叉：4.2 需要 skeleton.update(dt) 与
 *   updateWorldTransform(spine.Physics.update)，3.8 无参；
 * - 调试骨骼线用官方 SceneRenderer.drawSkeletonDebug（两版同名同签名）；
 * - 相机：OrthoCamera（zoom 为可见范围倍率，数值越小越放大），
 *   滚轮围绕指针缩放、左键拖拽平移、R 重置视角。
 */

const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const els = {
  badge: $('versionBadge'), dropHint: $('dropHint'), hud: $('hud'),
  hudName: $('hudName'), hudStats: $('hudStats'), hudTime: $('hudTime'),
  errorBox: $('errorBox'), animSelect: $('animSelect'), skinSelect: $('skinSelect'),
  playBtn: $('playBtn'), loopChk: $('loopChk'), speedSld: $('speedSld'), speedVal: $('speedVal'),
  debugChk: $('debugChk'), pmaChk: $('pmaChk'), resetCamBtn: $('resetCamBtn'),
  info: $('skeletonInfo'), fileInput: $('fileInput'), quickLoad: $('quickLoad'),
};

// ---------- 全局状态 ----------
const GL = canvas.getContext('webgl', { alpha: true });
const state = {
  spine: null,          // 当前版本的 spine 命名空间
  version: null,        // '3.8' | '4.2'
  context: null,        // ManagedWebGLRenderingContext
  renderer: null,       // SceneRenderer
  assets: null,         // { data, skeleton, animState, atlas, textures, name, pma, bounds }
  playing: true,
  lastTime: performance.now(),
  runtimeModules: {},   // 版本 → 模块缓存
};
const drag = { active: false, x: 0, y: 0 };

function showError(msg) {
  els.errorBox.textContent = msg;
  els.errorBox.hidden = false;
  console.error(msg);
}
const clearError = () => { els.errorBox.hidden = true; };

// ---------- 工具 ----------
function detectVersion(jsonText) {
  const ast = JSON.parse(jsonText);
  const raw = ast?.skeleton?.spine ?? ast?.skeleton?.version;
  const m = /^(\d+)\.(\d+)/.exec(String(raw ?? ''));
  if (!m) throw new Error(`无法识别 spine 版本（skeleton.spine=${JSON.stringify(raw)}）`);
  const v = `${m[1]}.${m[2]}`;
  if (v !== '3.8' && v !== '4.2') throw new Error(`暂不支持版本 ${v}（当前支持 3.8 / 4.2）`);
  return { version: v, full: raw, ast };
}

/** atlas 页名启发式：非空行 + 紧随的非空行是 size: 字段 → 页名（新旧格式通吃）。 */
function atlasPageNames(atlasText) {
  const lines = atlasText.split(/\r?\n/);
  const pages = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || /^\s/.test(line)) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    const next = lines[j];
    if (next && /^\s*size\s*:/.test(next)) pages.push(line.trim());
  }
  return pages;
}

const detectPma = (atlasText) => /pma\s*:\s*true/i.test(atlasText);

/** 载入一张图片（url 或 blob URL）。 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败：${url}`));
    img.src = url;
  });
}

// ---------- runtime 装载 ----------
async function getRuntime(version) {
  if (!state.runtimeModules[version]) {
    state.runtimeModules[version] = await import(`../build/spine-webgl-${version}.mjs`);
  }
  return state.runtimeModules[version].spine;
}

/** 版本适配：3.8 的 GL 类在 spine.webgl.* 下，4.2 平铺导出。 */
function wgl(name) {
  return state.version === '3.8' ? state.spine.webgl[name] : state.spine[name];
}

// ---------- 骨架装载 ----------
async function loadSkeleton({ name, jsonText, atlasText, imageUrlMap }) {
  clearError();
  const { version, full, ast } = detectVersion(jsonText);
  const spine = await getRuntime(version);
  state.spine = spine;
  state.version = version;

  if (!state.context) {
    state.context = new (wgl('ManagedWebGLRenderingContext'))(GL);
    state.renderer = new (wgl('SceneRenderer'))(canvas, state.context, true);
  }

  // 预载全部页面纹理
  const pages = atlasPageNames(atlasText);
  if (pages.length === 0) throw new Error('atlas 中未解析出任何页面');
  const textures = [];
  const textureMap = {};
  for (const page of pages) {
    const url = imageUrlMap[page];
    if (!url) throw new Error(`atlas 页面「${page}」没有对应图片（${Object.keys(imageUrlMap).join('、') || '未提供任何图片'}）`);
    const image = await loadImage(url);
    const tex = new (wgl('GLTexture'))(state.context, image);
    textures.push(tex);
    textureMap[page] = tex;
  }

  // atlas + skeleton data
  const atlas = version === '3.8'
    ? new spine.TextureAtlas(atlasText, (path) => textureMap[path])
    : (() => {
      const a = new spine.TextureAtlas(atlasText);
      for (const p of a.pages) p.setTexture(textureMap[p.name]);
      return a;
    })();

  const loader = new spine.AtlasAttachmentLoader(atlas);
  const skeletonJson = new spine.SkeletonJson(loader);
  const data = skeletonJson.readSkeletonData(jsonText);

  const skeleton = new spine.Skeleton(data);
  const animState = new spine.AnimationState(new spine.AnimationStateData(data));

  // 卸载上一份的纹理；隐藏首次加载提示
  if (state.assets) for (const t of state.assets.textures) t.dispose?.();
  els.dropHint.hidden = true;

  const pma = detectPma(atlasText);
  const bounds = { x: ast.skeleton.x ?? 0, y: ast.skeleton.y ?? 0, w: ast.skeleton.width ?? 500, h: ast.skeleton.height ?? 500 };
  state.assets = { data, skeleton, animState, atlas, textures, name, pma, bounds, full };
  state.playing = true;

  // 首个动画默认播放
  if (data.animations.length > 0) animState.setAnimation(0, data.animations[0].name, true);

  fitCamera();
  buildPanels();
  updateBadge(full);
  resizeCanvas();
}

// ---------- 相机 ----------
function fitCamera() {
  const cam = state.renderer.camera;
  const { x, y, w, h } = state.assets.bounds;
  cam.position.set(x + w / 2, y + h / 2, 0);
  // zoom 是可见范围倍率：取“刚好装下”再留 15% 边距
  const zoomFit = Math.max(w / canvas.width, h / canvas.height);
  cam.zoom = zoomFit * 1.15;
  cam.update();
}

function screenToWorld(px, py) {
  const v = new (state.spine.Vector3 || state.spine.webgl.Vector3)(px, py, 0);
  return state.renderer.camera.screenToWorld(v, canvas.width, canvas.height);
}

// ---------- UI ----------
function updateBadge(full) {
  const b = els.badge;
  b.hidden = false;
  b.textContent = `Spine ${full} · runtime ${state.version}`;
  b.className = `version-badge ${state.version === '3.8' ? 'v38' : 'v42'}`;
}

function buildPanels() {
  const { data, skeleton, animState } = state.assets;
  // 动画
  els.animSelect.innerHTML = '';
  for (const a of data.animations) {
    const o = document.createElement('option');
    o.value = o.textContent = a.name;
    els.animSelect.appendChild(o);
  }
  els.animSelect.disabled = data.animations.length === 0;
  els.animSelect.onchange = () => playAnimation(els.animSelect.value);
  // 皮肤（含 default + 具名皮肤）
  const skinNames = data.skins.map((s) => s.name);
  els.skinSelect.innerHTML = '';
  for (const s of skinNames) {
    const o = document.createElement('option');
    o.value = o.textContent = s;
    els.skinSelect.appendChild(o);
  }
  els.skinSelect.disabled = false;
  els.skinSelect.onchange = () => {
    state.assets.skeleton.setSkinByName(els.skinSelect.value);
    state.assets.skeleton.setSlotsToSetupPose();
  };
  els.playBtn.disabled = false;
  els.playBtn.textContent = '暂停';
  // 信息
  const d = state.assets.data;
  els.info.innerHTML = `
    <dt>名称</dt><dd>${state.assets.name}</dd>
    <dt>版本</dt><dd>${state.assets.full}</dd>
    <dt>骨骼</dt><dd>${d.bones.length}</dd>
    <dt>槽位</dt><dd>${d.slots.length}</dd>
    <dt>皮肤</dt><dd>${d.skins.map((s) => s.name).join('、') || '—'}</dd>
    <dt>动画</dt><dd>${d.animations.map((a) => a.name).join('、') || '—'}</dd>
    <dt>约束</dt><dd>IK ${d.ikConstraints.length} · TF ${d.transformConstraints.length} · Path ${d.pathConstraints.length}${d.physicsConstraints ? ` · Phys ${d.physicsConstraints.length}` : ''}</dd>
    <dt>事件</dt><dd>${d.events.length}</dd>
    <dt>PMA</dt><dd>${state.assets.pma ? '是' : '否'}</dd>`;
  // HUD
  els.hud.hidden = false;
  els.hudName.textContent = state.assets.name;
  els.hudStats.textContent = `${d.bones.length} 骨骼 · ${d.slots.length} 槽位 · ${d.animations.length} 动画`;
  els.pmaChk.checked = state.assets.pma;
}

function playAnimation(name) {
  if (!state.assets) return;
  state.assets.animState.setAnimation(0, name, els.loopChk.checked);
}

// ---------- 渲染循环 ----------
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  if (state.renderer) {
    const mode = state.version === '3.8' ? state.spine.webgl.ResizeMode : state.spine.ResizeMode;
    state.renderer.resize(mode.Expand);
    fitCamera();
  }
}
window.addEventListener('resize', resizeCanvas);

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - state.lastTime) / 1000, 0.05);
  state.lastTime = now;
  const a = state.assets;
  if (!a) return;
  resizeCanvas();

  const speed = Number(els.speedSld.value);
  if (state.playing) {
    if (state.version === '4.2') a.skeleton.update(dt * speed);
    a.animState.update(dt * speed);
    a.animState.apply(a.skeleton);
    if (state.version === '4.2') a.skeleton.updateWorldTransform(state.spine.Physics.update);
    else a.skeleton.updateWorldTransform();
  } else {
    if (state.version === '4.2') a.skeleton.updateWorldTransform(state.spine.Physics.update);
    else a.skeleton.updateWorldTransform();
  }

  const pma = els.pmaChk.checked;
  GL.clearColor(0.08, 0.09, 0.1, 1);
  GL.clear(GL.COLOR_BUFFER_BIT);
  state.renderer.begin();
  state.renderer.drawSkeleton(a.skeleton, pma);
  if (els.debugChk.checked) state.renderer.drawSkeletonDebug(a.skeleton, pma);
  state.renderer.end();

  // HUD 时间
  const track = a.animState.getCurrent?.(0) ?? a.animState.tracks[0];
  if (track) {
    els.hudTime.textContent = `${track.trackTime.toFixed(2)}s / ${track.animation.duration.toFixed(2)}s`;
  }
}
requestAnimationFrame((t) => { state.lastTime = t; requestAnimationFrame(frame); });

// ---------- 交互：平移 / 缩放 ----------
const dpr = () => window.devicePixelRatio || 1;
const toCanvasPx = (cx, cy) => {
  const r = canvas.getBoundingClientRect();
  return [((cx - r.left) * dpr()), ((cy - r.top) * dpr())];
};
canvas.addEventListener('pointerdown', (e) => {
  drag.active = true;
  drag.x = e.clientX;
  drag.y = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup', () => { drag.active = false; });
canvas.addEventListener('pointermove', (e) => {
  if (!drag.active || !state.renderer) return;
  const cam = state.renderer.camera;
  const [bx, by] = toCanvasPx(drag.x, drag.y);
  const [ax, ay] = toCanvasPx(e.clientX, e.clientY);
  const before = screenToWorld(bx, by);
  const after = screenToWorld(ax, ay);
  cam.position.x -= after.x - before.x;
  cam.position.y -= after.y - before.y;
  cam.update();
  drag.x = e.clientX;
  drag.y = e.clientY;
});
canvas.addEventListener('wheel', (e) => {
  if (!state.renderer) return;
  e.preventDefault();
  const cam = state.renderer.camera;
  const [px, py] = toCanvasPx(e.clientX, e.clientY);
  const before = screenToWorld(px, py);
  const factor = e.deltaY < 0 ? 0.9 : 1.1;
  cam.zoom = Math.min(Math.max(cam.zoom * factor, 0.01), 100);
  cam.update();
  const after = screenToWorld(px, py);
  cam.position.x += before.x - after.x;
  cam.position.y += before.y - after.y;
  cam.update();
}, { passive: false });

// ---------- 面板事件 ----------
els.playBtn.onclick = () => {
  state.playing = !state.playing;
  els.playBtn.textContent = state.playing ? '暂停' : '播放';
};
els.loopChk.onchange = () => playAnimation(els.animSelect.value);
els.speedSld.oninput = () => { els.speedVal.textContent = `${Number(els.speedSld.value).toFixed(1)}×`; };
els.resetCamBtn.onclick = () => { if (state.assets) fitCamera(); };

// ---------- 资产来源 ----------
async function loadFromServer(assetDir) {
  try {
    // 语料目录是平铺的：corpus/v4.2/Box.json（不是 Box/Box.json）
    const [vdir, name] = assetDir.split('/');
    const base = `../corpus/${vdir}/`;
    const [jsonRes, atlasRes] = await Promise.all([fetch(base + name + '.json'), fetch(base + name + '.atlas')]);
    if (!jsonRes.ok || !atlasRes.ok) throw new Error(`语料不存在：${base}${name}.{json,atlas}`);
    const jsonText = await jsonRes.text();
    const atlasText = await atlasRes.text();
    const pages = atlasPageNames(atlasText);
    const imageUrlMap = {};
    for (const p of pages) imageUrlMap[p] = new URL(base + p, location.href).href;
    await loadSkeleton({ name, jsonText, atlasText, imageUrlMap });
  } catch (e) {
    showError(`加载语料失败：${e.message}`);
  }
}

async function loadFromFiles(files) {
  try {
    const jsonFile = files.find((f) => f.name.endsWith('.json'));
    const atlasFile = files.find((f) => f.name.endsWith('.atlas'));
    const imageFiles = files.filter((f) => /\.(png|jpe?g)$/i.test(f.name));
    if (!jsonFile) throw new Error('缺少 .json 文件');
    if (!atlasFile) throw new Error('缺少 .atlas 文件');
    const jsonText = await jsonFile.text();
    const atlasText = await atlasFile.text();
    const pages = atlasPageNames(atlasText);
    const imageUrlMap = {};
    for (const p of pages) {
      const f = imageFiles.find((img) => img.name === p) ?? imageFiles.find((img) => img.name === jsonFile.name.replace(/\.json$/, '') + '.png');
      if (f) imageUrlMap[p] = URL.createObjectURL(f);
    }
    if (Object.keys(imageUrlMap).length === 0 && imageFiles.length > 0) {
      // 宽松兜底：页名对不上但只有一张图时先用它
      imageUrlMap[pages[0]] = URL.createObjectURL(imageFiles[0]);
    }
    await loadSkeleton({ name: jsonFile.name.replace(/\.json$/, ''), jsonText, atlasText, imageUrlMap });
  } catch (e) {
    showError(`加载本地文件失败：${e.message}`);
  }
}

els.quickLoad.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-asset]');
  if (btn) loadFromServer(btn.dataset.asset);
});
els.fileInput.addEventListener('change', () => loadFromFiles([...els.fileInput.files]));
$('stage').addEventListener('dragover', (e) => { e.preventDefault(); $('stage').classList.add('dragover'); });
$('stage').addEventListener('dragleave', () => $('stage').classList.remove('dragover'));
$('stage').addEventListener('drop', (e) => {
  e.preventDefault();
  $('stage').classList.remove('dragover');
  loadFromFiles([...e.dataTransfer.files]);
});

// URL ?asset=v4.2/Box 直接加载（自动化验证用）
{
  const m = new URLSearchParams(location.search).get('asset');
  if (m) loadFromServer(m);
}
