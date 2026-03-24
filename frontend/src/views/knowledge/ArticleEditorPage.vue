<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createArticle, fetchArticleEditable, saveArticleEdit } from '@/api/articles'
import { fetchVisibleTagOptions } from '@/api/tags'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const editMode = computed(() => Boolean(route.params.id))
const articleId = computed(() => String(route.params.id || ''))
const editPolicyMode = ref<'update_current' | 'new_version' | 'readonly'>('update_current')
const editPolicyReason = ref('')

const form = ref({
  title: '',
  domain: '',
  classification: 'internal',
  tags: [] as string[],
  changeSummary: '初稿',
  contentMd: '',
})
const tagOptions = ref<Array<{ name: string; color: string; meaning: string }>>([])

const classOptions = [
  { label: '内部', value: 'internal' },
  { label: '秘密', value: 'confidential' },
  { label: '机密', value: 'secret' },
]

const pageTitle = computed(() => (editMode.value ? '编辑知识' : '新建知识'))
const tipText = computed(() => {
  if (!editMode.value) return '草稿保存后可在详情页继续流程操作。'
  if (editPolicyMode.value === 'new_version') return '当前为已发布版本，保存时将创建新版本草稿。'
  if (editPolicyMode.value === 'readonly') return editPolicyReason.value || '当前版本不可编辑。'
  return '当前草稿/驳回版本可直接保存。'
})

async function loadEditable() {
  if (!editMode.value || !articleId.value) return
  loading.value = true
  try {
    const data = await fetchArticleEditable(articleId.value)
    form.value = {
      title: data.title || '',
      domain: data.domain || '',
      classification: data.classification || 'internal',
      tags: Array.isArray(data.tags) ? data.tags : [],
      changeSummary: data.currentVersion?.changeSummary || '编辑更新',
      contentMd: data.currentVersion?.contentMd || '',
    }
    editPolicyMode.value = data.editPolicy.mode
    editPolicyReason.value = data.editPolicy.reason || ''
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载编辑数据失败')
  } finally {
    loading.value = false
  }
}

async function loadTagOptions() {
  try {
    tagOptions.value = await fetchVisibleTagOptions()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载标签选项失败')
  }
}

onMounted(async () => {
  await Promise.all([loadTagOptions(), loadEditable()])
})

async function submit() {
  if (editMode.value && editPolicyMode.value === 'readonly') {
    ElMessage.warning(editPolicyReason.value || '当前版本不可编辑')
    return
  }
  if (!form.value.title.trim()) return ElMessage.warning('请填写标题')
  if (!form.value.contentMd.trim()) return ElMessage.warning('请填写正文（Markdown）')

  submitting.value = true
  try {
    if (editMode.value && articleId.value) {
      const data = await saveArticleEdit(articleId.value, {
        title: form.value.title.trim(),
        domain: form.value.domain.trim(),
        classification: form.value.classification,
        tags: form.value.tags,
        changeSummary: form.value.changeSummary.trim() || '编辑更新',
        contentMd: form.value.contentMd,
      })
      ElMessage.success(data.mode === 'new_version' ? '已创建新版本草稿' : '草稿保存成功')
      await router.replace({ name: 'knowledge-detail', params: { id: data.articleId } })
      return
    }

    const data = await createArticle({
      title: form.value.title.trim(),
      domain: form.value.domain.trim(),
      classification: form.value.classification,
      tags: form.value.tags,
      changeSummary: form.value.changeSummary.trim() || '初稿',
      contentMd: form.value.contentMd,
    })
    ElMessage.success('已保存草稿')
    await router.replace({ name: 'knowledge-detail', params: { id: data.id } })
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-card v-loading="loading" shadow="never" class="editor">
    <template #header>
      <span class="editor__title">{{ pageTitle }}</span>
    </template>
    <el-alert :title="tipText" type="info" show-icon :closable="false" class="editor__alert" />
    <el-form label-width="100px" class="editor__form">
      <el-form-item label="标题" required>
        <el-input v-model="form.title" maxlength="200" show-word-limit placeholder="知识标题" :disabled="editMode && editPolicyMode === 'readonly'" />
      </el-form-item>
      <el-form-item label="条线/领域">
        <el-input v-model="form.domain" placeholder="如 柜面/对公" :disabled="editMode && editPolicyMode === 'readonly'" />
      </el-form-item>
      <el-form-item label="密级">
        <el-select v-model="form.classification" style="width: 200px" :disabled="editMode && editPolicyMode === 'readonly'">
          <el-option v-for="o in classOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          style="width: 100%"
          placeholder="请选择标签"
          :disabled="editMode && editPolicyMode === 'readonly'"
        >
          <el-option
            v-for="t in tagOptions"
            :key="t.name"
            :label="t.name"
            :value="t.name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="变更说明">
        <el-input v-model="form.changeSummary" placeholder="版本说明" :disabled="editMode && editPolicyMode === 'readonly'" />
      </el-form-item>
      <el-form-item label="正文" required>
        <el-input v-model="form.contentMd" type="textarea" :rows="18" placeholder="支持 Markdown 语法" class="editor__textarea" :disabled="editMode && editPolicyMode === 'readonly'" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" :disabled="editMode && editPolicyMode === 'readonly'" @click="submit">保存草稿</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.editor__title { font-weight: 600; font-size: 16px; }
.editor__alert { margin-bottom: 16px; }
.editor__form { max-width: 900px; }
.editor__textarea { font-family: var(--kb-mono-font-family); font-size: 13px; }
</style>
