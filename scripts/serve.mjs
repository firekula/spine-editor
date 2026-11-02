#!/usr/bin/env node
/**
 * 零依赖静态服务器（开发期用）：serve 仓库根目录。
 * 用法：node scripts/serve.mjs [端口=8090] [--preload]
 * 打开 http://localhost:8090/harness/ 即视口页面。
 *
 * --preload：启动时把 ROOT 下全部文件一次性同步读进内存，请求只查内存。
 * 平台存储层对"进程存活数秒后"的按文件读取存在 ENOENT 抖动，
 * 启动即读 + 内存服务可完全绕开（读取发生在进程生命最早期，实测可靠）。
 * SPINE_SERVE_ROOT 可覆盖根目录（视觉验证脚本的暂存 webroot 用）。
 */
import { createServer } from 'node:http';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.SPINE_SERVE_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] ?? 8090);
const PRELOAD = process.argv.includes('--preload');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.atlas': 'text/plain; charset=utf-8',
  '.skel': 'application/octet-stream',
  '.svg': 'image/svg+xml',
};

/** 递归收集 ROOT 下全部文件 → Map<urlPath, Buffer>。 */
function collectFiles(dir, base = '', acc = new Map()) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) collectFiles(p, `${base}/${name}`, acc);
    else acc.set(`${base}/${name}`, readFileSync(p));
  }
  return acc;
}

const MEM = PRELOAD ? collectFiles(ROOT) : null;
if (PRELOAD) console.log(`preload 完成：${MEM.size} 个文件已入内存`);

createServer((req, res) => {
  try {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url.endsWith('/')) url += 'index.html';
    const type = MIME[extname(url)] ?? 'application/octet-stream';
    const headers = { 'content-type': type, 'cache-control': 'no-store' };

    if (MEM) {
      const data = MEM.get(url);
      if (!data) throw new Error(`ENOENT(内存未命中) ${url}`);
      res.writeHead(200, headers);
      res.end(data);
      return;
    }

    // 防目录穿越
    const file = join(ROOT, url);
    if (!file.startsWith(ROOT)) throw new Error('forbidden');
    const data = readFileSync(file);
    res.writeHead(200, headers);
    res.end(data);
  } catch (e) {
    console.error(`[404] ${req.url} root=${ROOT} → ${e.code ?? e.message}`);
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`spine-editor dev server → http://127.0.0.1:${PORT}/harness/`);
});
