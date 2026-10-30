/**
 * AST 解析（Phase 0：保真优先）。
 *
 * 设计约定：
 * - AST 即“与各版本 JSON schema 一一对应的文档树”，是编辑器的唯一事实源；
 *   runtime 对象（SkeletonData 等）只作为预览/求值引擎，不做事实源。
 * - Phase 0 的 AST 采用“无损普通对象树”：JSON.parse 的结果原样保留，
 *   未知字段、默认值折叠（如首个 key 省略 "time": 0）、版本特有字段全部保真。
 *   后续 Phase 会把各类节点升级为带 schema 知识的类型（版本差异、默认值折叠规则），
 *   但 parse()/serialize() 的接口保持不变。
 */

/** 解析 Spine 骨架 JSON 文本为 AST。 */
export function parseSpineJson(text) {
  let ast;
  try {
    ast = JSON.parse(text);
  } catch (e) {
    throw new Error(`JSON 解析失败：${e.message}`);
  }
  if (!ast || typeof ast !== 'object' || typeof ast.skeleton !== 'object' || ast.skeleton === null) {
    throw new Error('不是 Spine 骨架数据（缺少顶层 "skeleton" 段）');
  }
  return ast;
}

/** 从 AST 识别大版本（"3.8" / "4.2"）。3.8+ 字段名为 skeleton.spine，更老格式为 skeleton.version。 */
export function detectVersion(ast) {
  const raw = ast?.skeleton?.spine ?? ast?.skeleton?.version;
  const m = /^(\d+)\.(\d+)/.exec(String(raw ?? ''));
  if (!m) {
    throw new Error(`无法识别 spine 版本号（skeleton.spine = ${JSON.stringify(raw)}）`);
  }
  return `${m[1]}.${m[2]}`;
}
