# 角色、账号、密码与权限清单

> 适用环境：当前本地开发/测试环境。  
> 请勿在生产环境使用以下默认密码。

## 1. 权限点定义

| 权限点 | 说明 |
|---|---|
| `kb:read` | 查看知识 |
| `kb:create` | 新建知识 |
| `kb:edit` | 编辑知识 |
| `kb:submit` | 提交审批 |
| `kb:publish` | 发布知识 |
| `approval:approve` | 审批（通过/驳回） |
| `audit:read` | 查看审计 |

## 2. 角色与权限映射

| 角色编码 | 角色名称 | 权限点 |
|---|---|---|
| `kb_admin` | 知识管理员 | `kb:read`, `kb:create`, `kb:edit`, `kb:submit`, `kb:publish`, `approval:approve`, `audit:read` |
| `reviewer` | 审核员 | `kb:read`, `kb:create`, `kb:edit`, `kb:submit`, `approval:approve` |
| `employee` | 普通员工 | `kb:read`, `kb:create`, `kb:submit` |
| `auditor` | 审计员 | `kb:read`, `audit:read` |

## 3. 默认账号（seed 生成）

`backend/src/seed/seed.js` 中的默认密码为：`Bank@2026`

| 用户名 | 显示名 | 角色 | 默认密码 |
|---|---|---|---|
| `zhangsan` | 张三 | `kb_admin` | `Bank@2026` |
| `lisi` | 李四 | `reviewer` | `Bank@2026` |
| `wangwu` | 王五 | `employee` | `Bank@2026` |
| `auditor1` | 赵六 | `auditor` | `Bank@2026` |

## 4. 额外手工创建账号

| 用户名 | 角色 | 密码 | 说明 |
|---|---|---|---|
| `reviewer2` | `reviewer` | `Bank@2026!` | 手工新增审核员账号（用于审批流测试） |

## 5. 使用建议

- 首次使用前可执行：`cd backend && npm run seed`
- 如需重置角色/账号，重新执行 `seed` 会覆盖默认数据
- 演示结束后建议修改默认密码，避免长期使用弱口令

## 6. 左侧菜单可见性与权限映射

| 菜单项 | 路由 | 可见权限规则 |
|---|---|---|
| 首页 | `/dashboard` | 登录后默认可见 |
| 知识库 | `/knowledge` | 需要 `kb:read` |
| 新建知识 | `/knowledge/create` | 需要 `kb:create` |
| 审批中心 | `/approval-center` | 需要 `kb:submit` 或 `approval:approve` 任一权限 |
| 审计中心 | `/audit-center` | 需要 `audit:read` |
| 组件展示 | `/common-components` | 登录后默认可见（演示页） |

> 前端实现位置：`frontend/src/layouts/MainLayout.vue`，已改为“菜单配置 + 权限规则”统一控制，避免分散在多个 `v-if` 中。

### 审批中心页签权限

- “待我审批”页签：仅 `approval:approve` 可见
- “我发起的”页签：仅 `kb:submit` 可见

## 7. 权限变更维护约定

- 之后凡是涉及权限点新增/删除、角色权限调整、菜单显示逻辑调整，都必须同步更新本文件。
- 同时新增对应需求变更记录文档，命名规则统一为：`任务名_版本.md`。
