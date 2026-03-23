import { Router } from 'express'
import mongoose from 'mongoose'
import { KnowledgeArticle } from '../models/knowledgeArticle.js'
import { ArticleVersion } from '../models/articleVersion.js'
import { ArticleTag } from '../models/articleTag.js'
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

articlesRouter.get(
  '/',
  authenticate,
  requirePermission('kb:read'),
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))
    const { q, domain, status } = req.query

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
      if (link.tagId?.name) tagsByArticle[aid].push(link.tagId.name)
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

articlesRouter.get(
  '/approval/pending',
  authenticate,
  requirePermission('approval:approve'),
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))

    const versions = await ArticleVersion.find({
      workflowState: WORKFLOW_STATE.SUBMITTED,
    })
      .sort({ submittedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    const total = await ArticleVersion.countDocuments({
      workflowState: WORKFLOW_STATE.SUBMITTED,
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

articlesRouter.get(
  '/approval/initiated',
  authenticate,
  requirePermission('kb:submit'),
  async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))

    const versions = await ArticleVersion.find({
      submittedBy: req.userId,
      submittedAt: { $exists: true, $ne: null },
    })
      .sort({ submittedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    const total = await ArticleVersion.countDocuments({
      submittedBy: req.userId,
      submittedAt: { $exists: true, $ne: null },
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

articlesRouter.get(
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

articlesRouter.get(
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

articlesRouter.get(
  '/:id',
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
  '/',
  authenticate,
  requirePermission('kb:create'),
  async (req, res) => {
    const { title, domain, classification, contentMd, articleNo } =
      req.body ?? {}
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
