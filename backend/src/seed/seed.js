/**
 * 造数脚本：按 docs 表结构写入演示数据（会清空相关集合）
 * 运行：在 backend 目录执行 npm run seed
 */
import argon2 from 'argon2'
import { env } from '../config/env.js'
import { connectMongo, disconnectMongo } from '../db/mongoose.js'
import { Permission } from '../models/permission.js'
import { Role } from '../models/role.js'
import { RolePermission } from '../models/rolePermission.js'
import { User } from '../models/user.js'
import { UserRole } from '../models/userRole.js'
import { Tag } from '../models/tag.js'
import { KnowledgeArticle } from '../models/knowledgeArticle.js'
import { ArticleVersion } from '../models/articleVersion.js'
import { ArticleTag } from '../models/articleTag.js'
import { Attachment } from '../models/attachment.js'
import { AuditLog } from '../models/auditLog.js'
import { Counter } from '../models/counter.js'
import { ARTICLE_STATUS, WORKFLOW_STATE, CLASSIFICATION } from '../constants/enums.js'

const DEMO_PASSWORD = 'Bank@2026'

async function clearAll() {
  await Promise.all([
    AuditLog.deleteMany({}),
    Attachment.deleteMany({}),
    ArticleTag.deleteMany({}),
    ArticleVersion.deleteMany({}),
    KnowledgeArticle.deleteMany({}),
    Tag.deleteMany({}),
    UserRole.deleteMany({}),
    RolePermission.deleteMany({}),
    User.deleteMany({}),
    Role.deleteMany({}),
    Permission.deleteMany({}),
    Counter.deleteMany({}),
  ])
}

async function seed() {
  if (!env.mongodbUri) {
    console.error('请配置 MONGODB_URI')
    process.exit(1)
  }
  await connectMongo(env.mongodbUri)
  console.log('[seed] 清空集合…')
  await clearAll()

  const permDefs = [
    { code: 'kb:read', name: '查看知识', module: 'knowledge' },
    { code: 'kb:create', name: '新建知识', module: 'knowledge' },
    { code: 'kb:edit', name: '编辑知识', module: 'knowledge' },
    { code: 'kb:publish', name: '发布知识', module: 'knowledge' },
    { code: 'kb:submit', name: '提交审批', module: 'knowledge' },
    { code: 'approval:approve', name: '审批', module: 'approval' },
    { code: 'audit:read', name: '查看审计', module: 'audit' },
  ]
  const permissions = await Permission.insertMany(permDefs)
  const pc = Object.fromEntries(permissions.map((p) => [p.code, p]))

  const roleDefs = [
    {
      code: 'kb_admin',
      name: '知识管理员',
      description: '知识全权限',
      permCodes: [
        'kb:read',
        'kb:create',
        'kb:edit',
        'kb:publish',
        'kb:submit',
        'approval:approve',
        'audit:read',
      ],
    },
    {
      code: 'reviewer',
      name: '审核员',
      description: '审批与编辑',
      permCodes: [
        'kb:read',
        'kb:create',
        'kb:edit',
        'kb:submit',
        'approval:approve',
      ],
    },
    {
      code: 'employee',
      name: '普通员工',
      description: '查阅与起草',
      permCodes: ['kb:read', 'kb:create', 'kb:submit'],
    },
    {
      code: 'auditor',
      name: '审计员',
      description: '只读与审计',
      permCodes: ['kb:read', 'audit:read'],
    },
  ]

  const roles = await Role.insertMany(
    roleDefs.map(({ code, name, description }) => ({ code, name, description })),
  )
  const roleByCode = Object.fromEntries(roles.map((r) => [r.code, r]))

  const rpRows = []
  for (const def of roleDefs) {
    const role = roleByCode[def.code]
    for (const code of def.permCodes) {
      rpRows.push({ roleId: role._id, permissionId: pc[code]._id })
    }
  }
  await RolePermission.insertMany(rpRows)

  const hash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id })

  const userRows = [
    {
      username: 'zhangsan',
      displayName: '张三',
      email: 'zs@bank.local',
      phone: '138****1001',
      department: 'IT/安全',
      orgPath: '总行/IT/安全',
      roleCode: 'kb_admin',
    },
    {
      username: 'lisi',
      displayName: '李四',
      email: 'ls@bank.local',
      phone: '138****1002',
      department: '柜面/对公',
      orgPath: '总行/柜面/对公',
      roleCode: 'reviewer',
    },
    {
      username: 'wangwu',
      displayName: '王五',
      email: 'ww@bank.local',
      phone: '138****1003',
      department: '合规',
      orgPath: '总行/合规',
      roleCode: 'employee',
    },
    {
      username: 'auditor1',
      displayName: '赵六',
      email: 'aud@bank.local',
      phone: '138****1004',
      department: '审计',
      orgPath: '总行/审计',
      roleCode: 'auditor',
    },
  ]

  const users = await User.insertMany(
    userRows.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      phone: u.phone,
      passwordHash: hash,
      status: 'active',
      department: u.department,
      orgPath: u.orgPath,
    })),
  )
  const userByName = Object.fromEntries(users.map((u) => [u.username, u]))

  await UserRole.insertMany(
    userRows.map((u) => ({
      userId: userByName[u.username]._id,
      roleId: roleByCode[u.roleCode]._id,
    })),
  )

  const tags = await Tag.insertMany([
    {
      name: '反洗钱',
      color: '#2458D2',
      meaning: '涉及客户身份识别、可疑交易监测与报送',
      visibleRoleCodes: ['kb_admin', 'reviewer', 'auditor'],
    },
    {
      name: '对公',
      color: '#1890ff',
      meaning: '公司/机构客户相关制度与流程',
      visibleRoleCodes: [],
    },
    {
      name: '柜面',
      color: '#52c41a',
      meaning: '网点柜面业务办理规范',
      visibleRoleCodes: [],
    },
    {
      name: '合规',
      color: '#faad14',
      meaning: '监管制度、内控与合规要求',
      visibleRoleCodes: ['kb_admin', 'reviewer', 'auditor'],
    },
  ])
  const tagByName = Object.fromEntries(tags.map((t) => [t.name, t]))

  const author = userByName.zhangsan
  const reviewer = userByName.lisi

  const md1 = `## 对公开户资料清单（2026版）

1. 营业执照副本
2. 法定代表人身份证件
3. 开户申请书（加盖公章）

> 本清单适用于对公新客户柜面开户场景。`

  const art1 = await KnowledgeArticle.create({
    articleNo: 'KB-2026-000381',
    title: '对公开户资料清单（2026版）',
    domain: '柜面/对公',
    classification: CLASSIFICATION.INTERNAL,
    status: ARTICLE_STATUS.PUBLISHED,
    visibilityPolicy: { orgPaths: ['总行/柜面', '总行/对公'] },
    searchText: `对公开户资料清单（2026版）\n${md1}`,
    createdBy: author._id,
    updatedBy: author._id,
  })

  const v1 = await ArticleVersion.create({
    articleId: art1._id,
    versionNo: 1,
    contentMd: md1,
    contentHtml: '',
    changeSummary: '2026 年度修订发布',
    workflowState: WORKFLOW_STATE.PUBLISHED,
    submittedBy: author._id,
    submittedAt: new Date('2026-03-18T09:00:00Z'),
    approvedBy: reviewer._id,
    approvedAt: new Date('2026-03-18T10:30:00Z'),
    publishedBy: author._id,
    publishedAt: new Date('2026-03-19T08:00:00Z'),
  })
  art1.currentVersionId = v1._id
  await art1.save()

  const md2 = `## 反洗钱客户身份识别操作指引

待审核草稿内容……`

  const art2 = await KnowledgeArticle.create({
    articleNo: 'KB-2026-000382',
    title: '反洗钱客户身份识别操作指引',
    domain: '合规',
    classification: CLASSIFICATION.CONFIDENTIAL,
    status: ARTICLE_STATUS.IN_REVIEW,
    visibilityPolicy: { orgPaths: ['总行/合规'] },
    searchText: `反洗钱客户身份识别操作指引\n${md2}`,
    createdBy: userByName.wangwu._id,
    updatedBy: userByName.wangwu._id,
  })

  const v2 = await ArticleVersion.create({
    articleId: art2._id,
    versionNo: 1,
    contentMd: md2,
    contentHtml: '',
    changeSummary: '提交审批',
    workflowState: WORKFLOW_STATE.SUBMITTED,
    submittedBy: userByName.wangwu._id,
    submittedAt: new Date('2026-03-21T14:00:00Z'),
  })
  art2.currentVersionId = v2._id
  await art2.save()

  const md3 = `## 应急预案：网点系统中断

（草稿）联络人与上报路径……`

  const art3 = await KnowledgeArticle.create({
    articleNo: 'KB-2026-000383',
    title: '应急预案：网点系统中断',
    domain: 'IT/运维',
    classification: CLASSIFICATION.INTERNAL,
    status: ARTICLE_STATUS.DRAFT,
    visibilityPolicy: {},
    searchText: `应急预案：网点系统中断\n${md3}`,
    createdBy: author._id,
    updatedBy: author._id,
  })

  const v3 = await ArticleVersion.create({
    articleId: art3._id,
    versionNo: 1,
    contentMd: md3,
    contentHtml: '',
    changeSummary: '初稿',
    workflowState: WORKFLOW_STATE.DRAFT,
  })
  art3.currentVersionId = v3._id
  await art3.save()

  await ArticleTag.insertMany([
    { articleId: art1._id, tagId: tagByName['对公']._id },
    { articleId: art1._id, tagId: tagByName['柜面']._id },
    { articleId: art2._id, tagId: tagByName['反洗钱']._id },
    { articleId: art2._id, tagId: tagByName['合规']._id },
    { articleId: art3._id, tagId: tagByName['合规']._id },
  ])

  await Attachment.create({
    articleId: art1._id,
    versionId: v1._id,
    filename: '开户资料模板.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeBytes: 120000,
    storageProvider: 'object_storage',
    storageKey: 'kb/2026/03/KB-2026-000381/template.xlsx',
    sha256: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12',
    downloadPolicy: { requireApproval: false },
    createdBy: author._id,
  })

  await Attachment.create({
    articleId: art2._id,
    versionId: v2._id,
    filename: '尽调问卷.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 890000,
    storageProvider: 'object_storage',
    storageKey: 'kb/2026/03/KB-2026-000382/dd.pdf',
    sha256: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdead',
    downloadPolicy: { requireApproval: true },
    createdBy: userByName.wangwu._id,
  })

  console.log('[seed] 完成。演示账号（密码均为 ' + DEMO_PASSWORD + '）：')
  console.log('  zhangsan (知识管理员) | lisi (审核员) | wangwu (员工) | auditor1 (审计)')
  console.log('[seed] 示例知识编号:', art1.articleNo, art2.articleNo, art3.articleNo)
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await disconnectMongo()
  })
