import { Router } from 'express'
import mongoose from 'mongoose'
import { KnowledgeArticle } from '../models/knowledgeArticle.js'
import { ArticleVersion } from '../models/articleVersion.js'
import { ArticleTag } from '../models/articleTag.js'
import { Tag } from '../models/tag.js'
import { User } from '../models/user.js'
import { ok, fail } from '../utils/apiEnvelope.js'
import { authenticate, requirePermission } from '../middleware/authenticate.js'
import { appendAuditLog } from '../services/auditService.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { ARTICLE_STATUS, WORKFLOW_STATE } from '../constants/enums.js'

export const articlesRouter = Router()

function auditMeta(req, res) {
  return {
    requestId: res.locals.requestId,
    actorUserId: req.userId,
    actorUsername: req.username,
    ip: req.ip || req.socket?.remoteAddress || '',
    userAgent: req.headers['user-agent'] ?? '',
  }
}

function buildApprovalArticleFilter(payload) {
  const { q, domain } = payload ?? {}
  const filter = {}
  if (domain && String(domain).trim()) {
    filter.domain = String(domain).trim()
  }
  if (q && String(q).trim()) {
    const safe = escapeRegex(String(q).trim())
    const rx = new RegExp(safe, 'i')
    filter.$or = [{ title: rx }, { articleNo: rx }]
  }
  return filter
}

function isTagVisibleForRoles(tagDoc, roleCodes) {
  const visibleRoleCodes = Array.isArray(tagDoc?.visibleRoleCodes)
    ? tagDoc.visibleRoleCodes
    : []
  if (!visibleRoleCodes.length) return true
  const roleSet = new Set((Array.isArray(roleCodes) ? roleCodes : []).map((r) => String(r)))
  return visibleRoleCodes.some((code) => roleSet.has(String(code)))
}

async function getArticleAndCurrentVersionOrFail(id) {
  const article = await KnowledgeArticle.findById(id)
  if (!article) {
    return { error: { message: '知识不存在', code: 40402, status: 404 } }
  }
  if (!article.currentVersionId) {
    return { error: { message: '当前知识无版本信息', code: 40403, status: 404 } }
  }
  const version = await ArticleVersion.findById(article.currentVersionId)
  if (!version) {
    return { error: { message: '版本不存在', code: 40404, status: 404 } }
  }
  return { article, version }
}

async function upsertArticleTags(articleId, tagNames) {
  const uniqueNames = Array.from(
    new Set(
      (Array.isArray(tagNames) ? tagNames : [])
        .map((t) => String(t || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 20)

  await ArticleTag.deleteMany({ articleId })
  if (!uniqueNames.length) return

  const tagDocs = await Promise.all(
    uniqueNames.map(async (name) => {
      const exist = await Tag.findOne({ name }).lean()
      if (exist) return exist
      return Tag.create({ name, color: '#2458D2' })
    }),
  )

  await ArticleTag.insertMany(
    tagDocs.map((t) => ({ articleId, tagId: t._id })),
    { ordered: false },
  )
}

articlesRouter.post(
  '/query',
  authenticate,
  requirePermission('kb:read'),
  async (req, res) => {
    const page = Math.max(1, Number(req.body?.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.body?.pageSize) || 20))
    const { q, domain, status } = req.body ?? {}

    const filter = {}
    if (domain) filter.domain = String(domain)
    if (status) filter.status = String(status)
    if (q && String(q).trim()) {
      const safe = escapeRegex(String(q).trim())
      const rx = new RegExp(safe, 'i')
      filter.$or = [{ title: rx }, { searchText: rx }, { articleNo: rx }]
    }

    const total = await KnowledgeArticle.countDocuments(filter)
    const items = await KnowledgeArticle.find(filter)
      .populate({ path: 'currentVersionId', select: 'workflowState' })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    const articleIds = items.map((a) => a._id)
    const tagLinks = await ArticleTag.find({
      articleId: { $in: articleIds },
    })
      .populate('tagId')
      .lean()

    const tagsByArticle = {}
    for (const link of tagLinks) {
      const aid = link.articleId.toString()
      if (!tagsByArticle[aid]) tagsByArticle[aid] = []
      if (link.tagId?.name && isTagVisibleForRoles(link.tagId, req.roles)) {
        tagsByArticle[aid].push(link.tagId.name)
      }
    }

    const rows = items.map((a) => ({
      id: a._id.toString(),
      articleNo: a.articleNo,
      title: a.title,
      domain: a.domain,
      classification: a.classification,
      status: a.status,
      workflowState:
        a.currentVersionId && typeof a.currentVersionId === 'object'
          ? a.currentVersionId.workflowState
          : null,
      updatedAt: a.updatedAt,
      tags: tagsByArticle[a._id.toString()] ?? [],
    }))

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'kb.read',
      resourceType: 'article',
      resourceId: 'list',
      statusCode: 200,
      success: true,
      details: { query: { q, domain, status, page, pageSize } },
    })

    return ok(res, {
      page,
      pageSize,
      total,
      items: rows,
    })
  },
)

articlesRouter.post(
  '/approval/pending',
  authenticate,
  requirePermission('approval:approve'),
  async (req, res) => {
    const page = Math.max(1, Number(req.body?.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.body?.pageSize) || 20))
    const articleFilter = buildApprovalArticleFilter(req.body)
    const articleIdFilter = {}
    if (Object.keys(articleFilter).length > 0) {
      const articleIds = await KnowledgeArticle.find(articleFilter).select('_id').lean()
      articleIdFilter.articleId = { $in: articleIds.map((a) => a._id) }
    }

    const versions = await ArticleVersion.find({
      workflowState: WORKFLOW_STATE.SUBMITTED,
      ...articleIdFilter,
    })
      .sort({ submittedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    const total = await ArticleVersion.countDocuments({
      workflowState: WORKFLOW_STATE.SUBMITTED,
      ...articleIdFilter,
    })

    const articleIds = versions.map((v) => v.articleId)
    const articles = await KnowledgeArticle.find({ _id: { $in: articleIds } }).lean()
    const articleById = new Map(articles.map((a) => [String(a._id), a]))

    const items = versions
      .map((v) => {
        const a = articleById.get(String(v.articleId))
        if (!a) return null
        return {
          id: String(a._id),
          articleNo: a.articleNo,
          title: a.title,
          domain: a.domain,
          classification: a.classification,
          status: a.status,
          workflowState: v.workflowState,
          versionNo: v.versionNo,
          submittedAt: v.submittedAt ?? null,
          updatedAt: a.updatedAt,
        }
      })
      .filter(Boolean)

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'approval.pending.read',
      resourceType: 'article',
      resourceId: 'pending',
      statusCode: 200,
      success: true,
      details: { page, pageSize },
    })

    return ok(res, { page, pageSize, total, items })
  },
)

articlesRouter.post(
  '/approval/initiated',
  authenticate,
  requirePermission('kb:submit'),
  async (req, res) => {
    const page = Math.max(1, Number(req.body?.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.body?.pageSize) || 20))
    const articleFilter = buildApprovalArticleFilter(req.body)
    const versionFilter = {
      submittedBy: req.userId,
      submittedAt: { $exists: true, $ne: null },
    }
    if (req.body?.workflowState && String(req.body.workflowState).trim()) {
      versionFilter.workflowState = String(req.body.workflowState).trim()
    }

    if (req.body?.approver && String(req.body.approver).trim()) {
      const rx = new RegExp(escapeRegex(String(req.body.approver).trim()), 'i')
      const approverIds = await User.find({
        $or: [{ username: rx }, { displayName: rx }],
      })
        .select('_id')
        .lean()
      versionFilter.approvedBy = { $in: approverIds.map((u) => u._id) }
    }
    if (Object.keys(articleFilter).length > 0) {
      const articleIds = await KnowledgeArticle.find(articleFilter).select('_id').lean()
      versionFilter.articleId = { $in: articleIds.map((a) => a._id) }
    }

    const versions = await ArticleVersion.find(versionFilter)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    const total = await ArticleVersion.countDocuments(versionFilter)

    const articleIds = versions.map((v) => v.articleId)
    const articles = await KnowledgeArticle.find({ _id: { $in: articleIds } }).lean()
    const articleById = new Map(articles.map((a) => [String(a._id), a]))

    const items = versions
      .map((v) => {
        const a = articleById.get(String(v.articleId))
        if (!a) return null
        return {
          id: String(a._id),
          articleNo: a.articleNo,
          title: a.title,
          domain: a.domain,
          classification: a.classification,
          status: a.status,
          workflowState: v.workflowState,
          versionNo: v.versionNo,
          submittedAt: v.submittedAt ?? null,
          approvedAt: v.approvedAt ?? null,
          publishedAt: v.publishedAt ?? null,
          updatedAt: a.updatedAt,
        }
      })
      .filter(Boolean)

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'approval.initiated.read',
      resourceType: 'article',
      resourceId: 'initiated',
      statusCode: 200,
      success: true,
      details: { page, pageSize },
    })

    return ok(res, { page, pageSize, total, items })
  },
)

articlesRouter.post(
  '/approval/history',
  authenticate,
  requirePermission('approval:approve'),
  async (req, res) => {
    const page = Math.max(1, Number(req.body?.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.body?.pageSize) || 20))
    const articleFilter = buildApprovalArticleFilter(req.body)
    const versionFilter = {
      workflowState: { $in: [WORKFLOW_STATE.APPROVED, WORKFLOW_STATE.REJECTED, WORKFLOW_STATE.PUBLISHED] },
    }

    if (req.body?.workflowState && String(req.body.workflowState).trim()) {
      versionFilter.workflowState = String(req.body.workflowState).trim()
    }

    if (Object.keys(articleFilter).length > 0) {
      const articleIds = await KnowledgeArticle.find(articleFilter).select('_id').lean()
      versionFilter.articleId = { $in: articleIds.map((a) => a._id) }
    }

    const versions = await ArticleVersion.find(versionFilter)
      .sort({ approvedAt: -1, submittedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    const total = await ArticleVersion.countDocuments(versionFilter)

    const articleIds = versions.map((v) => v.articleId)
    const approverIds = versions.map((v) => v.approvedBy).filter(Boolean)
    const [articles, approvers] = await Promise.all([
      KnowledgeArticle.find({ _id: { $in: articleIds } }).lean(),
      User.find({ _id: { $in: approverIds } }).select('username displayName').lean(),
    ])
    const articleById = new Map(articles.map((a) => [String(a._id), a]))
    const approverById = new Map(
      approvers.map((u) => [String(u._id), u.displayName || u.username || '']),
    )

    const items = versions
      .map((v) => {
        const a = articleById.get(String(v.articleId))
        if (!a) return null
        return {
          id: String(a._id),
          articleNo: a.articleNo,
          title: a.title,
          domain: a.domain,
          classification: a.classification,
          status: a.status,
          workflowState: v.workflowState,
          versionNo: v.versionNo,
          submittedAt: v.submittedAt ?? null,
          approvedAt: v.approvedAt ?? null,
          publishedAt: v.publishedAt ?? null,
          approverName: v.approvedBy ? approverById.get(String(v.approvedBy)) ?? '' : '',
          updatedAt: a.updatedAt,
        }
      })
      .filter(Boolean)

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'approval.history.read',
      resourceType: 'article',
      resourceId: 'history',
      statusCode: 200,
      success: true,
      details: { page, pageSize },
    })

    return ok(res, { page, pageSize, total, items })
  },
)

articlesRouter.post(
  '/:id/versions',
  authenticate,
  requirePermission('kb:read'),
  async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的文章 ID', 40002, 400)
    }

    const article = await KnowledgeArticle.findById(id).lean()
    if (!article) return fail(res, '知识不存在', 40402, 404)

    const versions = await ArticleVersion.find({ articleId: id })
      .sort({ versionNo: -1 })
      .lean()

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'kb.version.read',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
    })

    return ok(
      res,
      versions.map((v) => ({
        id: v._id.toString(),
        versionNo: v.versionNo,
        workflowState: v.workflowState,
        changeSummary: v.changeSummary,
        submittedAt: v.submittedAt ?? null,
        approvedAt: v.approvedAt ?? null,
        publishedAt: v.publishedAt ?? null,
      })),
    )
  },
)

articlesRouter.post(
  '/:id/versions/:vid',
  authenticate,
  requirePermission('kb:read'),
  async (req, res) => {
    const { id, vid } = req.params
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(vid)) {
      return fail(res, '无效的 ID', 40002, 400)
    }

    const article = await KnowledgeArticle.findById(id).lean()
    if (!article) return fail(res, '知识不存在', 40402, 404)

    const version = await ArticleVersion.findOne({ _id: vid, articleId: id }).lean()
    if (!version) return fail(res, '版本不存在', 40404, 404)

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'kb.version.read',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
      details: { versionNo: version.versionNo },
    })

    return ok(res, {
      id: version._id.toString(),
      versionNo: version.versionNo,
      contentMd: version.contentMd,
      contentHtml: version.contentHtml,
      changeSummary: version.changeSummary,
      workflowState: version.workflowState,
      submittedAt: version.submittedAt ?? null,
      approvedAt: version.approvedAt ?? null,
      publishedAt: version.publishedAt ?? null,
    })
  },
)

articlesRouter.post(
  '/:id/editable',
  authenticate,
  requirePermission('kb:edit'),
  async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的文章 ID', 40002, 400)
    }

    const result = await getArticleAndCurrentVersionOrFail(id)
    if (result.error) {
      return fail(res, result.error.message, result.error.code, result.error.status)
    }
    const { article, version } = result
    const tagLinks = await ArticleTag.find({ articleId: article._id })
      .populate('tagId')
      .lean()
    const tags = tagLinks
      .filter((l) => isTagVisibleForRoles(l.tagId, req.roles))
      .map((l) => l.tagId?.name)
      .filter(Boolean)

    let mode = 'readonly'
    let reason = ''
    if ([WORKFLOW_STATE.DRAFT, WORKFLOW_STATE.REJECTED].includes(version.workflowState)) {
      mode = 'update_current'
    } else if (version.workflowState === WORKFLOW_STATE.PUBLISHED) {
      mode = 'new_version'
    } else {
      reason = '审批中或已审批版本不可直接编辑'
    }

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'kb.edit.read',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
      details: { mode, versionNo: version.versionNo, workflowState: version.workflowState },
    })

    return ok(res, {
      articleId: article._id.toString(),
      articleNo: article.articleNo,
      title: article.title,
      domain: article.domain,
      classification: article.classification,
      visibilityPolicy: article.visibilityPolicy ?? {},
      tags,
      currentVersion: {
        id: version._id.toString(),
        versionNo: version.versionNo,
        changeSummary: version.changeSummary ?? '',
        contentMd: version.contentMd ?? '',
        workflowState: version.workflowState,
      },
      editPolicy: {
        mode,
        reason,
      },
    })
  },
)

articlesRouter.post(
  '/:id/save',
  authenticate,
  requirePermission('kb:edit'),
  async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的文章 ID', 40002, 400)
    }

    const title = String(req.body?.title ?? '').trim()
    const contentMd = String(req.body?.contentMd ?? '').trim()
    const domain = String(req.body?.domain ?? '').trim()
    const classification = String(req.body?.classification ?? 'internal').trim() || 'internal'
    const changeSummary = String(req.body?.changeSummary ?? '').trim() || '编辑更新'
    const tags = Array.isArray(req.body?.tags) ? req.body.tags : []
    const visibilityPolicy =
      req.body?.visibilityPolicy && typeof req.body.visibilityPolicy === 'object'
        ? req.body.visibilityPolicy
        : {}

    if (!title || !contentMd) {
      return fail(res, 'title 与 contentMd 必填', 40003, 400)
    }

    const result = await getArticleAndCurrentVersionOrFail(id)
    if (result.error) {
      return fail(res, result.error.message, result.error.code, result.error.status)
    }
    const { article, version } = result

    let mode = 'readonly'
    if ([WORKFLOW_STATE.DRAFT, WORKFLOW_STATE.REJECTED].includes(version.workflowState)) {
      mode = 'update_current'
    } else if (version.workflowState === WORKFLOW_STATE.PUBLISHED) {
      mode = 'new_version'
    }

    if (mode === 'readonly') {
      return fail(res, '审批中或已审批版本不可直接编辑', 40017, 400)
    }

    article.title = title
    article.domain = domain
    article.classification = classification
    article.visibilityPolicy = visibilityPolicy
    article.searchText = `${title}\n${contentMd}`.slice(0, 50000)
    article.updatedBy = req.userId

    let savedVersion = version
    if (mode === 'update_current') {
      version.contentMd = contentMd
      version.changeSummary = changeSummary
      version.contentHtml = ''
      await version.save()
      article.status = ARTICLE_STATUS.DRAFT
    } else {
      const latest = await ArticleVersion.find({ articleId: article._id })
        .sort({ versionNo: -1 })
        .limit(1)
        .lean()
      const nextVersionNo = (latest[0]?.versionNo ?? version.versionNo) + 1
      savedVersion = await ArticleVersion.create({
        articleId: article._id,
        versionNo: nextVersionNo,
        contentMd,
        contentHtml: '',
        changeSummary,
        workflowState: WORKFLOW_STATE.DRAFT,
      })
      article.currentVersionId = savedVersion._id
      article.status = ARTICLE_STATUS.DRAFT
    }

    await article.save()
    await upsertArticleTags(article._id, tags)

    await appendAuditLog({
      ...auditMeta(req, res),
      action: mode === 'new_version' ? 'kb.version.create' : 'kb.edit.save',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
      details: { mode, versionNo: savedVersion.versionNo },
    })

    return ok(res, {
      articleId: article._id.toString(),
      articleNo: article.articleNo,
      status: article.status,
      currentVersionId: savedVersion._id.toString(),
      versionNo: savedVersion.versionNo,
      mode,
    })
  },
)

articlesRouter.post(
  '/:id/submit',
  authenticate,
  requirePermission('kb:submit'),
  async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的文章 ID', 40002, 400)
    }

    const result = await getArticleAndCurrentVersionOrFail(id)
    if (result.error) {
      return fail(res, result.error.message, result.error.code, result.error.status)
    }
    const { article, version } = result

    if (version.workflowState === WORKFLOW_STATE.PUBLISHED) {
      return fail(res, '已发布版本不可重复提交', 40011, 400)
    }
    if (version.workflowState === WORKFLOW_STATE.SUBMITTED) {
      return fail(res, '当前版本已在审批中', 40012, 400)
    }

    version.workflowState = WORKFLOW_STATE.SUBMITTED
    version.submittedBy = req.userId
    version.submittedAt = new Date()
    await version.save()

    article.status = ARTICLE_STATUS.IN_REVIEW
    article.updatedBy = req.userId
    await article.save()

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'kb.submit',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
      details: { versionNo: version.versionNo },
    })

    return ok(res, {
      articleId: article._id.toString(),
      status: article.status,
      workflowState: version.workflowState,
    })
  },
)

articlesRouter.post(
  '/:id/approve',
  authenticate,
  requirePermission('approval:approve'),
  async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的文章 ID', 40002, 400)
    }

    const result = await getArticleAndCurrentVersionOrFail(id)
    if (result.error) {
      return fail(res, result.error.message, result.error.code, result.error.status)
    }
    const { article, version } = result

    if (version.workflowState !== WORKFLOW_STATE.SUBMITTED) {
      return fail(res, '仅已提交版本可审批通过', 40013, 400)
    }

    version.workflowState = WORKFLOW_STATE.APPROVED
    version.approvedBy = req.userId
    version.approvedAt = new Date()
    await version.save()

    article.status = ARTICLE_STATUS.IN_REVIEW
    article.updatedBy = req.userId
    await article.save()

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'approval.approve',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
      details: { versionNo: version.versionNo },
    })

    return ok(res, {
      articleId: article._id.toString(),
      status: article.status,
      workflowState: version.workflowState,
    })
  },
)

articlesRouter.post(
  '/:id/reject',
  authenticate,
  requirePermission('approval:approve'),
  async (req, res) => {
    const { id } = req.params
    const reason = String(req.body?.reason ?? '').trim()
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的文章 ID', 40002, 400)
    }
    if (!reason) {
      return fail(res, '驳回原因不能为空', 40014, 400)
    }

    const result = await getArticleAndCurrentVersionOrFail(id)
    if (result.error) {
      return fail(res, result.error.message, result.error.code, result.error.status)
    }
    const { article, version } = result

    if (![WORKFLOW_STATE.SUBMITTED, WORKFLOW_STATE.APPROVED].includes(version.workflowState)) {
      return fail(res, '当前版本状态不允许驳回', 40015, 400)
    }

    version.workflowState = WORKFLOW_STATE.REJECTED
    version.approvedBy = req.userId
    version.approvedAt = new Date()
    version.changeSummary = `${version.changeSummary || ''} | 驳回：${reason}`.slice(0, 500)
    await version.save()

    article.status = ARTICLE_STATUS.DRAFT
    article.updatedBy = req.userId
    await article.save()

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'approval.reject',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
      details: { versionNo: version.versionNo, reason },
    })

    return ok(res, {
      articleId: article._id.toString(),
      status: article.status,
      workflowState: version.workflowState,
    })
  },
)

articlesRouter.post(
  '/:id/publish',
  authenticate,
  requirePermission('kb:publish'),
  async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的文章 ID', 40002, 400)
    }

    const result = await getArticleAndCurrentVersionOrFail(id)
    if (result.error) {
      return fail(res, result.error.message, result.error.code, result.error.status)
    }
    const { article, version } = result

    if (![WORKFLOW_STATE.APPROVED, WORKFLOW_STATE.SUBMITTED].includes(version.workflowState)) {
      return fail(res, '仅审批通过/提交中的版本可发布', 40016, 400)
    }

    version.workflowState = WORKFLOW_STATE.PUBLISHED
    version.publishedBy = req.userId
    version.publishedAt = new Date()
    await version.save()

    article.status = ARTICLE_STATUS.PUBLISHED
    article.updatedBy = req.userId
    article.currentVersionId = version._id
    await article.save()

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'kb.publish',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
      details: { versionNo: version.versionNo },
    })

    return ok(res, {
      articleId: article._id.toString(),
      status: article.status,
      workflowState: version.workflowState,
    })
  },
)

articlesRouter.post(
  '/detail/:id',
  authenticate,
  requirePermission('kb:read'),
  async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的文章 ID', 40002, 400)
    }

    const article = await KnowledgeArticle.findById(id).lean()
    if (!article) return fail(res, '知识不存在', 40402, 404)

    let currentVersion = null
    if (article.currentVersionId) {
      currentVersion = await ArticleVersion.findById(
        article.currentVersionId,
      ).lean()
    }

    const tagLinks = await ArticleTag.find({ articleId: article._id })
      .populate('tagId')
      .lean()
    const tags = tagLinks.map((l) => l.tagId?.name).filter(Boolean)

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'kb.read',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
    })

    return ok(res, {
      id: article._id.toString(),
      articleNo: article.articleNo,
      title: article.title,
      domain: article.domain,
      classification: article.classification,
      status: article.status,
      visibilityPolicy: article.visibilityPolicy,
      tags,
      currentVersion: currentVersion
        ? {
            id: currentVersion._id.toString(),
            versionNo: currentVersion.versionNo,
            contentMd: currentVersion.contentMd,
            contentHtml: currentVersion.contentHtml,
            changeSummary: currentVersion.changeSummary,
            workflowState: currentVersion.workflowState,
            submittedAt: currentVersion.submittedAt,
            approvedAt: currentVersion.approvedAt,
            publishedAt: currentVersion.publishedAt,
          }
        : null,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    })
  },
)

articlesRouter.post(
  '/create',
  authenticate,
  requirePermission('kb:create'),
  async (req, res) => {
    const { title, domain, classification, contentMd, articleNo } =
      req.body ?? {}
    const tags = Array.isArray(req.body?.tags) ? req.body.tags : []
    if (!title || !contentMd) {
      return fail(res, 'title 与 contentMd 必填', 40003, 400)
    }

    const no =
      articleNo ||
      `KB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const article = await KnowledgeArticle.create({
      articleNo: no,
      title,
      domain: domain ?? '',
      classification: classification ?? 'internal',
      status: ARTICLE_STATUS.DRAFT,
      visibilityPolicy: req.body.visibilityPolicy ?? {},
      searchText: `${title}\n${contentMd}`.slice(0, 50000),
      createdBy: req.userId,
      updatedBy: req.userId,
    })

    const ver = await ArticleVersion.create({
      articleId: article._id,
      versionNo: 1,
      contentMd,
      contentHtml: '',
      changeSummary: req.body.changeSummary ?? '初稿',
      workflowState: WORKFLOW_STATE.DRAFT,
    })

    article.currentVersionId = ver._id
    await article.save()
    await upsertArticleTags(article._id, tags)

    await appendAuditLog({
      ...auditMeta(req, res),
      action: 'kb.create',
      resourceType: 'article',
      resourceId: article.articleNo,
      statusCode: 200,
      success: true,
    })

    return ok(res, {
      id: article._id.toString(),
      articleNo: article.articleNo,
      currentVersionId: ver._id.toString(),
    })
  },
)
