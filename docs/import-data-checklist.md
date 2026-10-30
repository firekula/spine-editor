# 官方编辑器 Import Data 装机验证清单

> 目的：在写第一个编辑功能之前，用你们真实的工程数据实测官方编辑器三种导入路径的行为，
> 确定浏览器工具导出的 JSON 最终如何回到主画师的官方工程里。
> 执行人：任何持有正版许可、装有对应版本编辑器的同事。
> 环境：请把编辑器升级到对应版本线的最新 patch（4.2 早期曾有 linked mesh 导入 bug，
> 已在后续版本修复；3.8 请统一使用 3.8.99）。

## 准备材料

- [ ] 从官方编辑器正常导出一份 3.8 JSON + atlas（项目里最常见的骨架）
- [ ] 从官方编辑器正常导出一份 4.2 JSON + atlas（含 physics/linked mesh/sequence 的骨架最好）
- [ ] 用本工具对这两份各做一次回环：`npm test` 前先把它们放进 `corpus/`（见 README）
- [ ] 取回环产物（`serialize` 的输出，可临时用下面一行生成）：

```bash
node -e '
  const fs = require("fs");
  (async () => {
    const { parseSpineJson, detectVersion } = await import("./src/ast/parse.mjs");
    const { serialize } = await import("./src/ast/serialize.mjs");
    const text = fs.readFileSync(process.argv[1] ?? "corpus/v4.2/spineboy-pro.json", "utf8");
    fs.writeFileSync("roundtrip-output.json", serialize(parseSpineJson(text), { version: detectVersion(parseSpineJson(text)) }));
    console.log("已写出 roundtrip-output.json");
  })();' <你的json路径>
```

## 验证项（每项都做，结果回填）

### A. 导入为新项目（预期这是"全量修改回环"的主路径）

操作：主菜单 `Import Data` → 选择回环产物 JSON → 勾选 `New project`。

- [ ] 3.8 产物：导入成功/失败？动画、骨骼、网格、皮肤是否齐全？
- [ ] 4.2 产物：同上；physics 约束、sequence、linked mesh 是否正常？
- [ ] 与直接导原版 JSON 再导入的结果对比，有无差异？

### B. 导入到现有骨架（预期用于"改蒙皮/网格/附件后回写"）

操作：`Import Data` → 不勾 `New project` → `Import into an existing skeleton` →
`Existing attachments` 分别试 `Ignore` 与 `Replace`。

- [ ] 3.8：是否可用？
- [ ] 4.2：是否可用？linked mesh 是否报错（正常应已修复）？
- [ ] 动画是否如文档所述**不**随该路径导入？

### C. 动画并入现有工程（两跳路径）

操作：回环产物先按 A 导入为新项目，再 `Import Project` → 选择动画 → 导入到主工程骨架。

- [ ] 3.8：动画是否完整并入？同名骨骼/槽位/约束是否对上？
- [ ] 4.2：同上；deform 键所在 mesh 顶点数是否报不匹配？
- [ ] 冲突处理：主工程里已存在同名动画时的覆盖/重命名行为？

### D. hash / spineVersion 字段是否被校验

- [ ] 把产物 JSON 的 `skeleton.hash` 改成乱码再导入 A，是否仍成功？（决定我们能否
      在该字段写入工具自己的标识，便于区分来源）
- [ ] `skeleton.spine` 写 `3.8.99` / `4.2.22`（与目标版本线一致）是否被接受？

## 结论回填（决定产品形态）

| 问题 | 结论 |
|---|---|
| 全量修改回环走哪条路径？ | A / A+C |
| 网格/蒙皮/附件修改回写走哪条？ | B（Ignore / Replace 哪种） |
| 动画并入主工程的可行流程？ | C 的实测步骤记录 |
| hash 字段可否自定义？ | 可 / 不可 |

## 注意事项（来自官方文档与社区 issue，已在正文讨论过）

- `Import into an existing skeleton` 只进 bones/slots/skins/attachments，**不进动画**；
- 动画导入要求两边被 key 的对象同名；deform 键要求 mesh 顶点数一致
  （编辑器不增删顶点即天然满足）；
- linked mesh 导入 bug：spine-editor issue #777，4.2 线已修复——所以编辑器要打最新 patch；
- 二进制 `.skel` 对版本极度敏感（差 patch 都可能读不出），本工具统一走 JSON，
  导入侧由编辑器自己完成格式归一。

## E. 真实语料实测新增项（boss1.skel 3.8.99 / Box.skel 4.2.43 已自动转出 JSON）

- [ ] 用 `corpus/real/` 下转出的 `boss1.json`（3.8）走 A 路径整包导入，动画/蒙皮/IK 是否完整；
- [ ] 用转出的 `Box.json`（4.2，含 46 骨骼/66 槽位/324 附件/4 动画/1 事件）走 A 路径导入，
      重点看：linked mesh 继承、clipping、sequence 附件、颜色动画曲线；
- [ ] **已知格式限制确认**：Box 的颜色动画（如 `yan` 槽 rgba）在官方编辑器里打开曲线
      编辑器，确认曲线显示为"整帧单曲线"——这是 .skel→JSON 的固有压平
      （4.2 JSON 每帧只有一个 curve 键，无法表达分量级独立 bezier；
      官方编辑器自己导出 JSON 也一样）。监修时如需分量级曲线，请直接在官方编辑器里调；
- [ ] Box 的骨头有 `icon`/`visible` 字段（二进制 nonessential 数据）：官方编辑器导入后
      骨头可见性与图标是否保留（官方 runtime 的 JSON 读取器不读这两个字段，
      但编辑器自己的解析器应当读取——此项实测确认）；
- [ ] Box 存在数字名骨头/槽位（如 `"3"`）：导入后树形面板顺序与导出前是否一致
      （JSON 对象数字键会被重排，编辑器如按骨骼数组顺序展示则无影响）。
