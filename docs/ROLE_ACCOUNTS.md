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
