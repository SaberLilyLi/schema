# 银行知识库 · 后端 HTTP 接口说明

本文档描述当前 `backend` 已实现接口，与代码一致。默认服务地址：`http://localhost:5000`（以环境变量 `PORT` 为准）。

---

## 1. 通用约定

### 1.1 路径前缀

所有业务接口挂载在 **`/api`** 下（健康检查除外说明见下节）。

### 1.2 响应信封（Envelope）

除 **`GET /api/health`** 外，成功与失败均采用统一 JSON 结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | number | 业务码，`0` 表示成功；非 `0` 表示失败（与 HTTP 状态码区分） |
| `message` | string | 说明信息 |
| `requestId` | string | 请求追踪 ID（中间件生成，也可由请求头 `X-Request-Id` 传入） |
| `data` | object \| null | 成功时为载荷；失败时为 `null` |

**成功示例：**

```json
{
  "code": 0,
  "message": "OK",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "data": { }
}
```

**失败示例：**

```json
{
  "code": 40101,
  "message": "用户名或密码错误",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "data": null
}
```

### 1.3 健康检查（兼容格式）

`GET /api/health` **不**使用上述信封，直接返回：

```json
{
  "ok": true,
  "message": "ok",
  "db": "connected"
}
```

`db` 取值：`connected` | `disconnected`（表示 Mongoose 连接状态）。

### 1.4 认证

需要登录的接口在请求头携带：

```http
Authorization: Bearer <accessToken>
```

`accessToken` 由 `POST /api/auth/login` 返回。

### 1.5 权限点（RBAC）

部分接口除登录外还要求权限点（permission code），未满足时返回 HTTP **403**，业务码 **`40301`**，`message` 为「权限不足」。

当前可能用到的权限点：

| 权限点 | 说明 |
|--------|------|
| `kb:read` | 查看知识列表、详情 |
| `kb:create` | 新建知识草稿 |

（种子数据中还包含 `kb:edit`、`kb:publish`、`kb:submit`、`approval:approve`、`audit:read` 等，供后续接口扩展。）

### 1.6 跨域与时间

- 已启用 **CORS**（`cors` 中间件）。
- 日期时间字段一般为 **ISO 8601** 字符串（MongoDB `Date` 序列化）。

---

## 2. 接口列表

### 2.1 健康检查

| 项目 | 说明 |
|------|------|
| **URL** | `GET /api/health` |
| **认证** | 不需要 |

**响应：** 见 §1.3。

---

### 2.2 登录

| 项目 | 说明 |
|------|------|
| **URL** | `POST /api/auth/login` |
| **认证** | 不需要 |
| **Content-Type** | `application/json` |

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 登录名（大小写不敏感，服务端会 trim、转小写匹配） |
| `password` | string | 是 | 明文口令（与存储的 Argon2id 哈希校验） |

**成功 `data`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `accessToken` | string | JWT |
| `expiresIn` | string | 过期时间描述，与服务器 `.env` 中 `JWT_EXPIRES_IN` 一致（如 `7d`） |
| `user` | object | 用户信息 |
| `user.id` | string | 用户 ID |
| `user.displayName` | string | 展示名 |
| `user.username` | string | 登录名 |
| `user.roles` | string[] | 角色编码列表 |
| `user.permissions` | string[] | 权限点列表 |

**常见错误：**

| HTTP | code | message |
|------|------|---------|
| 400 | 40001 | 请输入用户名和密码 |
| 401 | 40101 | 用户名或密码错误 |
| 500 | 50001 | 服务器未配置 JWT_SECRET |

**请求示例：**

```http
POST /api/auth/login
Content-Type: application/json

{"username":"zhangsan","password":"Bank@2026"}
```

---

### 2.3 当前用户

| 项目 | 说明 |
|------|------|
| **URL** | `GET /api/auth/me` |
| **认证** | 需要 `Authorization: Bearer` |

**成功 `data`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 用户 ID |
| `displayName` | string | 展示名 |
| `username` | string | 登录名 |
| `email` | string | 邮箱 |
| `department` | string | 部门 |
| `orgPath` | string | 组织路径（ABAC 用） |
| `roles` | string[] | 角色编码 |
| `permissions` | string[] | 权限点 |

**常见错误：**

| HTTP | code | message |
|------|------|---------|
| 401 | 40101～40103 | 未登录 / 无效凭证等 |
| 404 | 40401 | 用户不存在 |
| 500 | 50001 | 服务器未配置 JWT_SECRET |

---

### 2.4 知识列表（分页 + 筛选）

| 项目 | 说明 |
|------|------|
| **URL** | `GET /api/articles` |
| **认证** | 需要 Bearer |
| **权限** | `kb:read` |

**Query 参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 `1`，最小 `1` |
| `pageSize` | number | 否 | 每页条数，默认 `20`，范围 `1`～`100` |
| `q` | string | 否 | 关键词，对 `title`、`searchText`、`articleNo` 做**不区分大小写**正则包含匹配（已转义特殊字符） |
| `domain` | string | 否 | 等于匹配 `domain` 字段 |
| `status` | string | 否 | 等于匹配 `status` 字段（如 `draft`、`in_review`、`published`、`archived`） |

**成功 `data`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `page` | number | 当前页 |
| `pageSize` | number | 每页条数 |
| `total` | number | 总条数 |
| `items` | array | 列表项 |
| `items[].id` | string | 知识 ID |
| `items[].articleNo` | string | 业务编号 |
| `items[].title` | string | 标题 |
| `items[].domain` | string | 领域/条线 |
| `items[].classification` | string | 密级 |
| `items[].status` | string | 状态 |
| `items[].updatedAt` | string | 更新时间 |
| `items[].tags` | string[] | 标签名称列表 |

**说明：** 列表请求会写入审计（`action`: `kb.read`，`resourceId`: `list`）。

---

### 2.5 知识详情

| 项目 | 说明 |
|------|------|
| **URL** | `GET /api/articles/:id` |
| **认证** | 需要 Bearer |
| **权限** | `kb:read` |

**路径参数：**

| 参数 | 说明 |
|------|------|
| `id` | MongoDB `ObjectId` 字符串 |

**成功 `data`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 知识 ID |
| `articleNo` | string | 业务编号 |
| `title` | string | 标题 |
| `domain` | string | 领域 |
| `classification` | string | 密级 |
| `status` | string | 状态 |
| `visibilityPolicy` | object | ABAC 可见策略（JSON） |
| `tags` | string[] | 标签名称 |
| `currentVersion` | object \| null | 当前版本；无则为 `null` |
| `currentVersion.id` | string | 版本文档 ID |
| `currentVersion.versionNo` | number | 版本号 |
| `currentVersion.contentMd` | string | Markdown 正文 |
| `currentVersion.contentHtml` | string | HTML 缓存 |
| `currentVersion.changeSummary` | string | 变更摘要 |
| `currentVersion.workflowState` | string | 流程状态 |
| `currentVersion.submittedAt` | string \| null | 提交时间 |
| `currentVersion.approvedAt` | string \| null | 审批时间 |
| `currentVersion.publishedAt` | string \| null | 发布时间 |
| `createdAt` | string | 创建时间 |
| `updatedAt` | string | 更新时间 |

**常见错误：**

| HTTP | code | message |
|------|------|---------|
| 400 | 40002 | 无效的文章 ID |
| 404 | 40402 | 知识不存在 |

---

### 2.6 新建知识（草稿）

| 项目 | 说明 |
|------|------|
| **URL** | `POST /api/articles` |
| **认证** | 需要 Bearer |
| **权限** | `kb:create` |
| **Content-Type** | `application/json` |

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 标题 |
| `contentMd` | string | 是 | Markdown 正文 |
| `domain` | string | 否 | 领域，默认 `""` |
| `classification` | string | 否 | 密级，默认 `internal` |
| `articleNo` | string | 否 | 业务编号；不传则自动生成 `KB-<年>-<时间戳后6位>` |
| `changeSummary` | string | 否 | 版本变更说明，默认 `初稿` |
| `visibilityPolicy` | object | 否 | 可见策略，默认 `{}` |

**成功 `data`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 新建知识 ID |
| `articleNo` | string | 业务编号 |
| `currentVersionId` | string | 首版版本 ID |

新建后知识状态为 **`draft`**，首版 `workflowState` 为 **`draft`**。

---

## 3. 环境与调试

| 变量 | 说明 |
|------|------|
| `PORT` | HTTP 端口，默认 `5000` |
| `MONGODB_URI` | MongoDB 连接串 |
| `JWT_SECRET` | JWT 签名密钥（必填才能登录） |
| `JWT_EXPIRES_IN` | JWT 有效期，如 `7d` |

开发环境下前端 Vite 可将 `/api` 代理到本服务，浏览器请求 `/api/...` 即可。

---

## 4. 演示账号（种子数据）

执行 `npm run seed` 后可用（密码均为 **`Bank@2026`**）：

| 用户名 | 角色说明 |
|--------|----------|
| `zhangsan` | 知识管理员（含 `kb:read`、`kb:create` 等） |
| `lisi` | 审核员 |
| `wangwu` | 普通员工 |
| `auditor1` | 审计员（无 `kb:create` 时无法调新建接口） |

---

## 5. 变更说明

- 新增接口或字段时，请同步更新本文档与前端 `src/api` 封装。
- 若未来将 `/api/health` 也改为统一信封，需同步前端健康检查解析逻辑。
