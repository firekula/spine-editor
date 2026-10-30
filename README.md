# Spine 浏览器编辑器 · Phase 0 验证套件

团队内部工具（局域网部署，已持有官方正版许可）。本包是整个项目的第一块基石：

1. **双版本 runtime 加载骨架**——官方 spine-ts 核心（3.8.99 与 4.2.22）以 Node 可用的
   ESM bundle 形式内置，纯数据加载（无需浏览器/WebGL）；
2. **金标准回环 harness**——`解析 → AST → 序列化 → 与官方导出逐字段比对 → 双加载语义比对`
   的自动化验收闭环。

> Phase 0 回答的问题："自己写的 AST + 序列化器，能不能产出与官方导出
> 语义完全一致、且能被对应版本官方 runtime 与官方编辑器（Import Data）接受的 JSON？"
> 当前答案：**能。5 份官方导出 + 2 份团队真实项目（.skel 二进制直转）全绿。**

## 快速开始

```bash
npm test          # 无需安装任何依赖（build/ 已内置 runtime 产物）
```

预期输出：

```
  3.8  boss1.json                     A:✔  B:✔   ← 团队真实项目（boss1.skel 直转）
  3.8  raptor-pro.json                A:✔  B:✔
  3.8  spineboy-ess.json              A:✔  B:✔
  4.2  Box.json                       A:✔  B:✔   ← 团队真实项目（Box.skel 直转）
  4.2  celestial-circus-pro.json      A:✔  B:✔
  4.2  goblins-pro.json               A:✔  B:✔
  4.2  spineboy-pro.json              A:✔  B:✔
共 7 个语料 | Stage A 通过 7/7 | Stage B 通过 7/7
✅ 全部通过
PASS boss1.skel [3.8.99] checks=30913 diffs=0 curveDiffs=0 noise=152
PASS Box.skel [4.2.43] checks=15027 diffs=0 curveDiffs=29 noise=151 warnings=47
✅ 全部通过
```

其他命令：

```bash
npm run test:a      # 仅 Stage A（结构回环，纯 Node 零依赖）
npm run test:b      # 仅 Stage B（双版本 runtime 语义加载）
npm run test:skel   # .skel 二进制 → JSON 的金标准验证（见下节）
node src/harness/roundtrip.mjs -v          # 显示全部差异明细
node src/harness/roundtrip.mjs --stage a   # 等价 test:a
# 单文件转换（日常把 .skel 扔进工具链的入口）
node src/cli/skel2json.mjs 项目导出.skel 输出.json --pretty --meta
# 重建 runtime（仅在更换 vendor/ 源码后需要；需要 esbuild，先 npm install）
npm install && npm run build:runtimes
```

机器可读报告输出到 `build/roundtrip-report.json`（CI 可直接消费，退出码 0/1）。

## 两阶段判定标准

| 阶段 | 做什么 | 判什么 |
|---|---|---|
| **Stage A 结构** | 金标准 JSON → `parseSpineJson` → AST → `serialize` → 归一化深度比对 | 数组有序、字典无序、数值严格相等；要求**零差异**（无损性） |
| **Stage B 语义** | 金标准与产物分别用**对应大版本的官方 spine-core** 完整加载（TextureAtlas + AtlasAttachmentLoader + SkeletonJson） | 双方均加载成功且语义指纹一致（骨骼/槽位/皮肤/动画/约束结构） |

Stage A 保证"编辑器写回的数据一个字段都不丢"；Stage B 保证"官方 runtime 真的能吃下这份产物"。
后续每加一个编辑功能（换图、网格、权重、关键帧、曲线、IK/FK…），都在这个 harness 上回归——
**任何破坏回环的功能不允许合入**，这就是它的全部意义。

## .skel 二进制进料（真实项目交付格式）

团队真实项目交付的是 `.skel` 二进制（官方编辑器导出，体积小、字符串表化）。
`src/skel/skel2json.mjs` 按官方 SkeletonBinary 布局逐字段读取（3.8 与 4.2 两套布局），
直接产出与官方编辑器导出同构的 runtime JSON，随后进入同一条 AST 链路。

**skel 金标准验证**（`npm run test:skel`）：同一 .skel 用官方 SkeletonBinary 直读，
与 skel2json 产物经官方 SkeletonJson 读取的两棵 SkeletonData 全量深度对比
（数值一律 fround 对比）。当前真实语料结果：

| 语料 | 版本 | 检查项 | 硬差异 | 结论 |
|---|---|---|---|---|
| boss1.skel | 3.8.99 | 30,913 | **0** | 完全一致（含曲线） |
| Box.skel | 4.2.43 | 15,027 | **0** | 完全一致（29 处曲线差异全部由下述格式限制解释） |

### 格式固有限制（重要，写进工作流）

1. **4.2 分量级曲线压平**：.skel 二进制里每个多值 timeline（rgba/translate/scale…）
   的每个分量可有**独立 bezier**；而 4.2 JSON 帧只有一个 `curve` 键共享给全部分量。
   skel2json 遇到分量不一致时保留分量 0 并记 warning（Box 实测 47 帧，多见于颜色动画）。
   **官方编辑器导出 JSON 同样受此限制**——监修颜色动画曲线时留意。3.8 JSON 不受影响
   （`curve/c2/c3/c4` 四键即一条完整 bezier 的四个控制点，无分量维度）。
2. **官方 runtime 的 JSON 读取器不读 bone 的 `icon`/`visible`**（4.2 二进制专属字段）。
   skel2json 照常输出，官方编辑器可读；仅官方 runtime 预览不生效。
3. **数字名实体在 JSON 中会被重排**：JS 对象的数字样键（如骨名/槽名 `"3"`）序列化时
   自动升序前置（Box 实测踩中）。JSON 语义中 timeline 顺序无意义，不影响正确性；
   但**编辑器 AST 层必须用数组保存实体顺序**，不能依赖 JSON 对象键序。
4. **文本精度噪声**：数值采用最短 float32 表示（Java `Float.toString` 语义），
   与二进制的 float32 精确值经 fround 后 bit 级一致；但 runtime 内部预计算的曲线
   系数会有 ~1e-9 级噪声（与官方编辑器导出 JSON 行为相同，验证器已归类不计）。
5. **两代曲线格式澄清**（修正早期认知）：3.8 帧曲线是 `curve`(c1) + `c2`/`c3`/`c4`
   **标量键 = 一条 bezier 的四个控制点**（缺省 0/1/1）；4.2 是 `[c1,c2,c3,c4]` 数组。
   两代在"帧级一条曲线"这一点上语义一致，4.2 只是打包成数组且共享给分量。

## 目录结构

```
spine-phase0/
├── corpus/                  # 金标准语料库（按大版本分目录）
│   ├── v3.8/                #   官方示例 + 团队真实项目（boss1，来自 .skel 直转）
│   ├── v4.2/                #   官方示例 + 团队真实项目（Box，来自 .skel 直转）
│   └── real/                #   原始 .skel + .atlas/.png 进料（转换源）
├── vendor/                  # 官方 spine-ts 核心源码（来自 spine-runtimes 官方仓库）
│   ├── spine-core-3.8/      #   3.8 分支 spine-ts/core（命名空间风格）
│   └── spine-core-4.2/      #   4.2 分支 spine-ts/spine-core（ESM 风格）
├── build/                   # runtime bundle 产物 + 回环报告（已内置，可重建）
├── src/
│   ├── ast/parse.mjs        # JSON → AST（Phase 0：无损普通对象树）
│   ├── ast/serialize.mjs    # AST → JSON（版本感知；字段顺序表 + 无损写回）
│   ├── skel/skel2json.mjs   # .skel 二进制 → JSON（3.8/4.2 双布局，官方字段名）
│   ├── diff/deep-diff.mjs   # 归一化深度比较（数组有序/字典无序/数值严格相等）
│   ├── load/runtime.mjs     # 双版本 runtime 懒加载 + 纯数据加载 + 语义指纹
│   ├── cli/skel2json.mjs    # 单文件转换 CLI（日常进料入口）
│   └── harness/
│       ├── roundtrip.mjs    # JSON 语料回环 harness
│       └── skel-roundtrip.mjs # .skel 金标准验证（双路 SkeletonData 深度对比）
├── scripts/build-runtimes.mjs # esbuild 打包双版本 runtime
└── docs/import-data-checklist.md  # 官方编辑器 Import Data 装机验证清单（交给主画师）
```

## 如何扩充语料（重要）

把你们真实项目的官方导出放进来，覆盖面直接决定后续开发的格式安全网：

- **有 .json 导出**：放入 `corpus/v3.8/` 或 `corpus/v4.2/`（目录名与 `skeleton.spine`
  大版本一致），重跑 `npm test`；
- **只有 .skel 二进制**：直接放 `corpus/real/<项目>/`，跑 `npm run test:skel`
  （会自动转出同名 JSON 并纳入 corpus 回归）；或单文件：
  `node src/cli/skel2json.mjs 项目.skel`。

harness 会自动发现并纳入回归。**建议把项目里最复杂的那几个骨架（带 linked mesh、
physics、sequence、多皮肤、deform 密集的）都收进来。**

## 架构决策备忘（为什么这样搭）

- **AST 是唯一事实源，runtime 只是引擎**。官方在论坛明确表态 runtime 不提供 JSON 导出、
  也无计划提供；且 runtime 解析时会归一化数据（默认值折叠、路径回填等），不适合当文档。
  所以文档模型直接与各版本 JSON schema 一一对应，序列化器自研、以官方源码为规范。
- **编辑工作流**：结构性修改走 `AST 变更 → serialize → SkeletonJson 热重载`；
  高频交互（拖骨骼、刷权重）期间直接改 runtime 对象，pointer-up 时提交回 AST。
- **版本差异以官方源码为准**，不以记忆为准。本项目 vendor 里就是两版完整源码，
  遇到任何字段疑问直接查 `vendor/*/src/SkeletonJson.ts`（解析器本身就是格式规范）。
  已实证的版本差异样例：3.8 曲线用 `curve/c2/c3/c4` 标量键（一条 bezier 四控制点），
  4.x 用四元数组且共享给全部分量；3.8 无 physics，4.2 有；3.8 动画 deform 段键名为
  `deform`（非 skins）、其下直接挂 skin→slot→attachment；4.2 的 IK timeline 键含
  `bendPositive/softness`；3.8 transform 约束用 `rotateMix/translateMix/scaleMix/shearMix`，
  4.2 改为 `mixRotate/mixX/mixY/mixScaleX/mixScaleY/mixShearY`；4.2 的 rotate 帧值键
  统一为 `value`（官方 readTimeline12），与 3.8 的 `angle` 不同。
- **许可证**：内部使用 + 已持正版 + 工具提供显著功能，符合 Editor License 对 runtime
  集成的要求；vendor 内保留官方 LICENSE 文件，工具不分发到团队之外。

## 已实证的 JSON 结构速查（写编辑功能时照抄）

```
顶层                skeleton,bones,slots,ik,transform,path,physics,skins,events,animations
皮肤附件            skins[].attachments[slotName][attachmentName]
region 附件         { x, y, rotation, width, height, color? }        （type 省略=region）
mesh 附件           { type:"mesh", uvs, triangles, vertices, hull, edges?, width, height }
linkedmesh          { type:"linkedmesh", parent, skin?, slot? }
骨骼动画            animations[X].bones[bone][rotate|translate|scale|shear]
槽位动画            animations[X].slots[slot][attachment|rgba|rgba2|color]
IK/变换/路径        animations[X].ik[name] = [ {time, mix, softness, bendPositive…} ]（数组直挂）
物理（4.2）         animations[X].physics[name][wind|gravity|…] = [ {time, value} ]
deform              animations[X].attachments[skin][slot][attachment].deform = [ {time, offset, vertices} ]
drawOrder           [ { time, offsets: [ {slot, offset} ] } ]
事件                [ { time, name, int?, float?, string?, volume?, balance? } ]
曲线（3.8）         { time, angle, curve: c1, c2, c3, c4 }（标量键=四控制点，缺省 0/1/1）或 "stepped"
曲线（4.x）         { time, value, curve: [cx1,cy1,cx2,cy2] } 或 "stepped"（省略=线性）
默认值折叠          首 key 省略 "time":0；setup 值字段整体省略（key 为 {}）
```

## 下一步（Phase 1）

- fork 官方 spine-player / 基于 `SceneRenderer` 搭视口，接 `loadSkeletonData`；
- 视口选骨骼、拖拽摆姿态（`bone.worldToLocal` + FK/IK），`animation.apply()` 逐帧回放；
- 把 pass-through AST 升级为可编辑文档模型（先做骨骼与关键帧），每次变更过 harness 回归。

配套的装机验证清单见 `docs/import-data-checklist.md`——**请在写第一个编辑功能之前
完成该清单**，它决定"动画修改回官方工程"走哪条导入路径。
