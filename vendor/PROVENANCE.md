# vendor 源码来源与刷新方法

## 来源

- 仓库：https://github.com/EsotericSoftware/spine-runtimes（官方）
- `spine-core-3.8/` ← `3.8` 分支的 `spine-ts/core`（3.8.99，分支冻结，与早期 vendor 无差异）
- `spine-webgl-3.8/` ← `3.8` 分支的 `spine-ts/webgl`（`module spine.webgl` 命名空间风格）
- `spine-core-4.2/` ← `4.2` 分支 tip 的 `spine-ts/spine-core`（**4.2.120**，2026-11-02 刷新；
  原为 4.2.22 时期源码，刷新后全量回归通过：roundtrip 7/7、skel 2/2、importdata 0 error）
- `spine-webgl-4.2/` ← `4.2` 分支 tip 的 `spine-ts/spine-webgl`（ESM，依赖
  `@esotericsoftware/spine-core`，构建时 alias 到本地 vendor 的 core 源码，保证同源）
- 2026-11 核实：官方仓库 `3.8` / `4.2` 分支均在维护（另有 4.3 / 5.0 线，不在本项目范围）
- 许可：Spine Runtime License（LICENSE 文件随源码保留）；团队持正版许可证，
  内部使用，不分发到团队之外。
- **core 与 webgl 必须同分支同时刷新**（webgl 依赖 core 的 API 面，
  跨版本混搭有漂移风险）；4.2.22→4.2.120 实测兼容，更早版本混搭未验证。

## 刷新方法（换 vendor 源码后必做）

```bash
# 1) 取新源码（以 4.2 为例；3.8 同理换 --branch 3.8 与 spine-ts/core、spine-ts/webgl 路径）
git clone --depth 1 --branch 4.2 https://github.com/EsotericSoftware/spine-runtimes.git /tmp/rr
rm -rf vendor/spine-core-4.2/src vendor/spine-webgl-4.2/src
cp -r /tmp/rr/spine-ts/spine-core/src vendor/spine-core-4.2/src
cp -r /tmp/rr/spine-ts/spine-webgl/src vendor/spine-webgl-4.2/src
# 2) 重打包 runtime（4 个 bundle：node/webgl × 3.8/4.2）
npm install && npm run build:runtimes
# 3) 全量回归必须保持全绿
npm test && npm run test:importdata
# 4) 视觉回归（Phase 1 视口）
bash scripts/visual-check.sh
```

## 为什么 vendor 而不是 npm install

- 字段级差异以 `SkeletonJson.ts` 解析器源码为最终事实，需要随时可读可 grep；
- `Triangulator`（耳切三角化）等实现后续可直接移植进网格编辑器；
- 版本精确 pin 到分支，不受 npm 发布节奏影响；
- webgl 源码与 core 同仓同分支，保证渲染层与数据层同源。
