# 需求变更记录：接口统一POST

## 本次目标

按要求将现有接口调用方式统一为 `POST`，并保持“查询/新增/编辑/流程动作”各自职责不混用。

## 后端变更

### 路由方法统一调整为 POST

- `backend/src/routes/health.js`
  - `POST /api/health`
- `backend/src/routes/auth.js`
  - `POST /api/auth/me`
- `backend/src/routes/articles.js`
  - `POST /api/articles`（原列表查询）
  - `POST /api/articles/:id`（原详情查询）
  - `POST /api/articles/:id/versions`
  - `POST /api/articles/:id/versions/:vid`
  - `POST /api/articles/approval/pending`
  - `POST /api/articles/approval/initiated`
- `backend/src/routes/audit.js`
  - `POST /api/audit/logs`
  - `POST /api/audit/logs/:id`

### 参数读取方式调整

查询接口由 `req.query` 统一改为 `req.body`（如分页、筛选条件）。

## 前端变更

### API 调用方式统一改为 POST

- `frontend/src/api/auth.ts`
  - `fetchMe` 改为 `POST /auth/me`
- `frontend/src/api/articles.ts`
  - `fetchArticleList`、`fetchArticleDetail`、`fetchArticleVersions`
  - `fetchApprovalPending`、`fetchApprovalInitiated`
  - 全部改为 `http.post(...)`
- `frontend/src/api/audit.ts`
  - `fetchAuditLogs`、`fetchAuditLogDetail` 改为 `POST`
- `frontend/src/api/system.ts`
  - `getHealth` 改为 `POST /health`

## 文档同步

- `docs/API.md` 中对应接口方法已全部更新为 `POST`。

## 验证结果

- 后端语法检查通过
- 前端 `npm run build` 通过
