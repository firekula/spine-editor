#!/usr/bin/env node
/**
 * skel2json 命令行：把 Spine .skel 二进制（3.8.x / 4.2.x）转为 runtime JSON。
 *
 * 用法：
 *   node src/cli/skel2json.mjs <input.skel> [output.json] [--pretty] [--meta]
 *
 * 输出 JSON 与官方编辑器导出同构（默认值折叠、官方字段名/枚举字符串），
 * 可直接进入编辑器 AST 链路，也可交给官方编辑器 Import Data。
 * --meta 时在 stderr 输出版本/warning 等元信息。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { skelToJson, postProcessLinkedMeshSkins } from '../skel/skel2json.mjs';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const files = args.filter((a) => !a.startsWith('--'));
if (flags.has('--help') || flags.has('-h') || files.length === 0) {
  console.error('用法: node src/cli/skel2json.mjs <input.skel> [output.json] [--pretty] [--meta]');
  process.exit(files.length === 0 ? 2 : 0);
}

const input = resolve(files[0]);
const output = files[1]
  ? resolve(files[1])
  : input.replace(/\.skel$/i, '.json');

let result;
try {
  result = skelToJson(new Uint8Array(readFileSync(input)));
} catch (e) {
  console.error(`转换失败: ${e.message}`);
  process.exit(1);
}
const { json, meta } = result;
postProcessLinkedMeshSkins(json);

const text = flags.has('--pretty')
  ? JSON.stringify(json, null, 1)
  : JSON.stringify(json);
writeFileSync(output, text);

if (flags.has('--meta')) {
  console.error(JSON.stringify(meta, null, 2));
}
console.log(`${basename(input)} [${meta.spine}] → ${basename(output)} (${text.length} bytes)${meta.warnings.length ? `，${meta.warnings.length} 条 warning（--meta 查看）` : ''}`);
