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
