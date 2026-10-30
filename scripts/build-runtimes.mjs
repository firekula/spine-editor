/**
 * 构建双版本 spine-core（Node 可用的 ESM bundle）。
 *
 * - 4.2：标准 ESM TypeScript，直接以 src/index.ts 为入口打包。
 * - 3.8：老的 `module spine` 命名空间风格、无 ES 导出——
 *   处理方式是把全部源文件按序“文本拼接”成一个文件再追加导出，
 *   这在语义上与官方 build.sh 的产物完全一致（同一命名空间多文件合并）。
 *
 * 产物：build/spine-3.8.mjs、build/spine-4.2.mjs
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

function build38() {
  const srcDir = join(ROOT, 'vendor/spine-core-3.8/src');
  // polyfills 必须最先执行；其余文件共享同一命名空间，运行期按属性访问解引用，顺序不敏感
  const files = listTsFiles(srcDir).sort((a, b) => {
    const pa = a.endsWith('polyfills.ts') ? 0 : 1;
    const pb = b.endsWith('polyfills.ts') ? 0 : 1;
    return pa - pb;
  });
  const concatenated = files
    .map((f) => `// ==== ${relative(ROOT, f)} ====\n` + readFileSync(f, 'utf8'))
    .join('\n');
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

mkdirSync(BUILD_DIR, { recursive: true });
await Promise.all([build38(), build42()]);
console.log('完成：build/spine-3.8.mjs + build/spine-4.2.mjs');
