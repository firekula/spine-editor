# vendor 源码来源与刷新方法

## 来源

- 仓库：https://github.com/EsotericSoftware/spine-runtimes（官方）
- `spine-core-3.8/` ← `3.8` 分支的 `spine-ts/core`（3.8.99）
- `spine-core-4.2/` ← `4.2` 分支的 `spine-ts/spine-core`（4.2.22 时期）
- 2026-10 核实：官方仓库 `3.8` / `4.2` 分支均在维护（另有 4.3 / 5.0 线，
  不在本项目范围内）
- 许可：Spine Runtime License（LICENSE 文件随源码保留）；团队持正版许可证，
  内部使用，不分发到团队之外。

## 刷新方法（换 vendor 源码后必做）

```bash
# 1) 取新源码（以 4.2 为例；3.8 同理换 --branch 3.8 与 spine-ts/core 路径）
git clone --depth 1 --branch 4.2 https://github.com/EsotericSoftware/spine-runtimes.git /tmp/rr
cp -r /tmp/rr/spine-ts/spine-core/src vendor/spine-core-4.2/src
# 2) 重打包 runtime
npm install && npm run build:runtimes
# 3) 全量回归必须保持全绿
npm test
```

## 为什么 vendor 而不是 npm install

- 字段级差异以 `SkeletonJson.ts` 解析器源码为最终事实，需要随时可读可 grep；
- `Triangulator`（耳切三角化）等实现后续可直接移植进网格编辑器；
- 版本精确 pin 到分支，不受 npm 发布节奏影响。
