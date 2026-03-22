<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createArticle } from '@/api/articles'

const router = useRouter()

const submitting = ref(false)
const form = ref({
  title: '',
  domain: '',
  classification: 'internal',
  changeSummary: '初稿',
  contentMd: '',
})

const classOptions = [
  { label: '内部', value: 'internal' },
  { label: '秘密', value: 'confidential' },
  { label: '机密', value: 'secret' },
]

async function submit() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  if (!form.value.contentMd.trim()) {
    ElMessage.warning('请填写正文（Markdown）')
    return
  }
  submitting.value = true
  try {
    const data = await createArticle({
      title: form.value.title.trim(),
      domain: form.value.domain.trim(),
      classification: form.value.classification,
      changeSummary: form.value.changeSummary.trim() || '初稿',
      contentMd: form.value.contentMd,
    })
    ElMessage.success('已保存草稿')
    await router.replace({
      name: 'knowledge-detail',
      params: { id: data.id },
    })
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-card shadow="never" class="editor">
    <template #header>
      <span class="editor__title">新建知识</span>
    </template>

    <el-alert
      title="草稿保存后可在列表中查看；提交审批与发布流程将在后续版本接入。"
      type="info"
      show-icon
      :closable="false"
      class="editor__alert"
    />

    <el-form label-width="100px" class="editor__form">
      <el-form-item label="标题" required>
        <el-input v-model="form.title" maxlength="200" show-word-limit placeholder="知识标题" />
      </el-form-item>
      <el-form-item label="条线/领域">
        <el-input v-model="form.domain" placeholder="如 柜面/对公" />
      </el-form-item>
      <el-form-item label="密级">
        <el-select v-model="form.classification" style="width: 200px">
          <el-option
            v-for="o in classOptions"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="变更说明">
        <el-input v-model="form.changeSummary" placeholder="版本说明" />
      </el-form-item>
      <el-form-item label="正文" required>
        <el-input
          v-model="form.contentMd"
          type="textarea"
          :rows="18"
          placeholder="支持 Markdown 语法"
          class="editor__textarea"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="submit">
          保存草稿
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.editor__title {
  font-weight: 600;
  font-size: 16px;
}

.editor__alert {
  margin-bottom: 16px;
}

.editor__form {
  max-width: 900px;
}

.editor__textarea {
  font-family: ui-monospace, monospace;
  font-size: 13px;
}
</style>
