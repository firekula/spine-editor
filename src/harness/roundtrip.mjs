#!/usr/bin/env node
/**
 * 金标准回环 harness（Phase 0 核心验收工具）。
 *
 * 对 corpus/<vX.Y>/ 下每个官方导出 JSON 执行：
 *   Stage A（结构）：gold → parse → AST → serialize → 产物，
 *            归一化深度比较（数组有序、字典无序、数值严格相等），要求零差异。
 *   Stage B（语义）：gold 与产物分别用对应大版本的官方 spine-core 完整加载
 *            （TextureAtlas + AtlasAttachmentLoader + SkeletonJson），
 *            要求两者均加载成功且语义指纹一致。
 *
 * 用法：
 *   node src/harness/roundtrip.mjs [--corpus <dir>] [--stage a|b|ab] [-v]
 *   npm test                # 默认 ab
 *   npm run test:a / test:b
 *
 * 退出码：全部通过 0，否则 1。机器可读报告写入 build/roundtrip-report.json。
 */
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSpineJson, detectVersion } from '../ast/parse.mjs';
import { serialize } from '../ast/serialize.mjs';
import { deepDiff } from '../diff/deep-diff.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(HERE, '../..');

// ---------- CLI ----------
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const CORPUS = flag('corpus') ?? join(PROJECT_ROOT, 'corpus');
const STAGE = flag('stage') ?? 'ab';
const VERBOSE = args.includes('-v') || args.includes('--verbose');
if (!['a', 'b', 'ab'].includes(STAGE)) {
  console.error(`无效 --stage ${STAGE}（可选 a / b / ab）`);
  process.exit(2);
}

// ---------- 语料发现：corpus/<vX.Y>/<name>.json（同名 .atlas 可选） ----------
function discover() {
  const items = [];
  if (!existsSync(CORPUS)) return items;
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
        jsonPath: `${base}.json`,
        atlasPath: existsSync(`${base}.atlas`) ? `${base}.atlas` : null,
      });
    }
  }
  return items.sort((x, y) => x.version.localeCompare(y.version) || x.name.localeCompare(y.name));
}

// ---------- 主流程 ----------
const { loadSkeletonData, fingerprint } = await import('../load/runtime.mjs');
const results = [];
let failed = 0;

for (const item of discover()) {
  const result = { ...item, stageA: null, stageB: null, error: null };
  try {
    const goldText = readFileSync(item.jsonPath, 'utf8');
    const ast = parseSpineJson(goldText);
    const version = detectVersion(ast);
    if (version !== item.version) {
      throw new Error(`语料目录标注 ${item.version}，数据实际为 ${version}`);
    }
    const productText = serialize(ast, { version });

    // Stage A：结构回环
    if (STAGE.includes('a')) {
      const { equal, diffs, truncated } = deepDiff(JSON.parse(goldText), JSON.parse(productText));
      result.stageA = { equal, diffCount: diffs.length, diffs: diffs.slice(0, VERBOSE ? 50 : 5), truncated };
      if (!equal) result.error = result.error ?? 'Stage A 结构差异';
    }

    // Stage B：双加载语义比对
    if (STAGE.includes('b')) {
      if (!item.atlasPath) {
        result.stageB = { skipped: '缺少同名 .atlas，跳过' };
      } else {
        const atlasText = readFileSync(item.atlasPath, 'utf8');
        const goldSd = await loadSkeletonData(version, goldText, atlasText);
        const prodSd = await loadSkeletonData(version, productText, atlasText);
        const fgGold = fingerprint(goldSd);
        const fgProd = fingerprint(prodSd);
        const same = JSON.stringify(fgGold) === JSON.stringify(fgProd);
        result.stageB = {
          equal: same,
          summary: `${fgGold.bones.length} 骨骼 / ${fgGold.slots.length} 槽位 / ${fgGold.skins.length} 皮肤 / ${fgGold.animations.length} 动画 / 约束 ${JSON.stringify(fgGold.constraints)}`,
        };
        if (!same) {
          result.error = result.error ?? 'Stage B 语义指纹不一致';
          result.stageB.fingerprintDiff = firstDifference(fgGold, fgProd);
        }
      }
    }
  } catch (e) {
    result.error = result.error ?? e.message;
  }
  if (result.error) failed++;
  results.push(result);
  printRow(result);
}

// ---------- 报告 ----------
console.log('\n' + '─'.repeat(72));
if (results.length === 0) {
  console.log(`未发现语料。把官方导出的 <名字>.json（与同名 <名字>.atlas）放入 ${CORPUS}/v3.8/ 或 v4.2/`);
}
const passA = results.filter((r) => r.stageA?.equal).length;
const passB = results.filter((r) => r.stageB?.equal).length;
console.log(`共 ${results.length} 个语料 | Stage A 通过 ${passA}/${results.filter((r) => r.stageA).length} | Stage B 通过 ${passB}/${results.filter((r) => r.stageB && !r.stageB.skipped).length}`);
console.log(failed === 0 ? '✅ 全部通过' : `❌ ${failed} 个失败`);
process.exitCode = failed === 0 ? 0 : 1;

try {
  mkdirSync(join(PROJECT_ROOT, 'build'), { recursive: true });
  writeFileSync(join(PROJECT_ROOT, 'build/roundtrip-report.json'), JSON.stringify(results, null, 2));
} catch { /* 报告写失败不影响退出码 */ }

// ---------- 输出 ----------
function printRow(r) {
  const mark = (ok, skipped) => (skipped ? '─' : ok ? '✔' : '✘');
  const a = r.stageA ? mark(r.stageA.equal, false) : ' ';
  const b = r.stageB ? mark(r.stageB.equal, !!r.stageB.skipped) : ' ';
  console.log(`  ${r.version.padEnd(4)} ${r.name.padEnd(30)} A:${a}  B:${b}${r.error ? `  ← ${r.error}` : ''}`);
  if (r.stageA && !r.stageA.equal) {
    for (const d of r.stageA.diffs) console.log(`      A差异 ${d.path}: [${d.kind}] 金标准=${JSON.stringify(d.a)} 产物=${JSON.stringify(d.b)}`);
    if (r.stageA.truncated) console.log('      （差异过多，仅显示前几条，详见 build/roundtrip-report.json）');
  }
  if (r.stageB && r.stageB.fingerprintDiff) console.log(`      B差异 ${r.stageB.fingerprintDiff}`);
}

function firstDifference(x, y) {
  for (const k of Object.keys(x)) {
    const sx = JSON.stringify(x[k]);
    const sy = JSON.stringify(y[k]);
    if (sx !== sy) return `字段 ${k}：金标准=${sx.slice(0, 120)} 产物=${sy.slice(0, 120)}`;
  }
  return '未知差异';
}
