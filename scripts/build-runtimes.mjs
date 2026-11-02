/**
 * 构建双版本 runtime bundle。
 *
 * Node 端（npm test 用）：
 * - build/spine-3.8.mjs / spine-4.2.mjs —— spine-core 纯数据 bundle
 *
 * 浏览器端（Phase 1 视口用）：
 * - build/spine-webgl-3.8.mjs —— core + webgl 全部源码拼接
 *   （3.8 webgl 是 `module spine.webgl` 命名空间，与 core 共享全局 spine，
 *   拼接后 spine.webgl 作为属性挂在导出的 spine 命名空间上）
 * - build/spine-webgl-4.2.mjs —— ESM 打包，`@esotericsoftware/spine-core`
 *   依赖 alias 到 vendor 的 spine-core 源码
 *
 * 依赖：esbuild（devDependency）。运行 npm test 不需要本步骤（交付包已含产物），
 * 只有更换/升级 vendor 里的 runtime 源码后才需要重新执行。
 */
import { build } from 'esbuild';
import { readdirSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BUILD_DIR = join(ROOT, 'build');

function listTsFiles(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) listTsFiles(p, acc);
    else if (name.name.endsWith('.ts')) acc.push(p);
  }
  return acc;
}

/** 3.8 的 `module spine` 命名空间风格：多文件文本拼接（与官方 build.sh 产物语义一致）。 */
function concatNamespaceSrc(srcDirs) {
  const files = srcDirs.flatMap((d) => listTsFiles(d)).sort((a, b) => {
    const pa = a.endsWith('polyfills.ts') ? 0 : 1;
    const pb = b.endsWith('polyfills.ts') ? 0 : 1;
    return pa - pb;
  });
  return files
    .map((f) => `// ==== ${relative(ROOT, f)} ====\n` + readFileSync(f, 'utf8'))
    .join('\n');
}

function build38() {
  const concatenated = concatNamespaceSrc([join(ROOT, 'vendor/spine-core-3.8/src')]);
  // 命名空间 spine 在拼接产物中是顶层 var，直接导出其值
  const entry = `${concatenated}\n\nconst spineNS = spine;\nexport { spineNS as spine };\n`;
  const entryPath = join(BUILD_DIR, '.concat-3.8.ts');
  writeFileSync(entryPath, entry);
  return build({
    entryPoints: [entryPath],
    outfile: join(BUILD_DIR, 'spine-3.8.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    logLevel: 'info',
  }).finally(() => rmSync(entryPath, { force: true }));
}

function buildWebgl38() {
  const concatenated = concatNamespaceSrc([
    join(ROOT, 'vendor/spine-core-3.8/src'),
    join(ROOT, 'vendor/spine-webgl-3.8/src'),
  ]);
  // core 的 module spine 与 webgl 的 module spine.webgl 拼接后：spine.webgl 为属性
  const entry = `${concatenated}\n\nconst spineNS = spine;\nexport { spineNS as spine };\n`;
  const entryPath = join(BUILD_DIR, '.concat-webgl-3.8.ts');
  writeFileSync(entryPath, entry);
  return build({
    entryPoints: [entryPath],
    outfile: join(BUILD_DIR, 'spine-webgl-3.8.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    logLevel: 'info',
  }).finally(() => rmSync(entryPath, { force: true }));
}

function build42() {
  // 用临时入口把 index.ts 的平铺导出收纳到 spine 命名空间下（与 3.8 产物接口一致）
  const entryPath = join(BUILD_DIR, '.entry-4.2.ts');
  writeFileSync(entryPath, `export * as spine from '../vendor/spine-core-4.2/src/index.js';\n`);
  return build({
    entryPoints: [entryPath],
    outfile: join(BUILD_DIR, 'spine-4.2.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    logLevel: 'info',
  }).finally(() => rmSync(entryPath, { force: true }));
}

function buildWebgl42() {
  // spine-webgl 的 index.ts re-export 了 spine-core，bundle 后命名空间完整；
  // npm 包名依赖 alias 到 vendor 源码，保证与 core 同源构建
  const entryPath = join(BUILD_DIR, '.entry-webgl-4.2.ts');
  writeFileSync(entryPath, `export * as spine from '../vendor/spine-webgl-4.2/src/index.js';\n`);
  return build({
    entryPoints: [entryPath],
    outfile: join(BUILD_DIR, 'spine-webgl-4.2.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    alias: { '@esotericsoftware/spine-core': join(ROOT, 'vendor/spine-core-4.2/src/index.ts') },
    logLevel: 'info',
  }).finally(() => rmSync(entryPath, { force: true }));
}

mkdirSync(BUILD_DIR, { recursive: true });
await Promise.all([build38(), build42(), buildWebgl38(), buildWebgl42()]);
console.log('完成：build/spine-{3.8,4.2}.mjs + build/spine-webgl-{3.8,4.2}.mjs');
