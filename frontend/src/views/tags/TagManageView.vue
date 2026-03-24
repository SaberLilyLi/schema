<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createTag, fetchTagList, fetchTagRoles, updateTag } from '@/api/tags'
import type { LabelItem as TagItem, LabelRoleItem as TagRoleItem } from '@/types/interfaces/label/rsp'

const loading = ref(false)
const list = ref<TagItem[]>([])
const roles = ref<TagRoleItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const q = ref('')

const dialogVisible = ref(false)
const saving = ref(false)
const editId = ref('')
const form = ref({
  name: '',
  color: '#2458D2',
  meaning: '',
  visibleRoleCodes: [] as string[],
})

async function load() {
  loading.value = true
  try {
    const data = await fetchTagList({
      page: page.value,
      pageSize: pageSize.value,
      q: q.value.trim() || undefined,
    })
    list.value = data.items
    total.value = data.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载标签失败')
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    roles.value = await fetchTagRoles()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载角色失败')
  }
}

function openCreate() {
  editId.value = ''
  form.value = { name: '', color: '#2458D2', meaning: '', visibleRoleCodes: [] }
  dialogVisible.value = true
}

function openEdit(row: TagItem) {
  editId.value = row.id
  form.value = {
    name: row.name,
    color: row.color || '#2458D2',
    meaning: row.meaning || '',
    visibleRoleCodes: Array.isArray(row.visibleRoleCodes) ? row.visibleRoleCodes : [],
  }
  dialogVisible.value = true
}

async function submit() {
  const name = form.value.name.trim()
  if (!name) {
    ElMessage.warning('标签名称不能为空')
    return
  }
  saving.value = true
  try {
    const payload = {
      name,
      color: form.value.color || '#2458D2',
      meaning: form.value.meaning.trim(),
      visibleRoleCodes: form.value.visibleRoleCodes,
    }
    if (editId.value) {
      await updateTag(editId.value, payload)
      ElMessage.success('标签更新成功')
    } else {
      await createTag(payload)
      ElMessage.success('标签创建成功')
    }
    dialogVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存标签失败')
  } finally {
    saving.value = false
  }
}

function onSearch() {
  page.value = 1
  load()
}

function onPageChange(p: number) {
  page.value = p
  load()
}

function onPageSizeChange(s: number) {
  pageSize.value = s
  onSearch()
}

function roleName(code: string) {
  const role = roles.value.find((x) => x.code === code)
  return role ? `${role.name}(${role.code})` : code
}

onMounted(async () => {
  await Promise.all([loadRoles(), load()])
})
</script>

<template>
  <section>
    <el-card shadow="never">
    <template #header>
      <div class="tag-page__header">
        <span class="tag-page__title">标签管理</span>
        <div class="tag-page__actions">
          <el-input v-model="q" placeholder="搜索标签名称/含义" clearable style="width: 260px" />
          <el-button @click="onSearch">查询</el-button>
          <el-button type="primary" @click="openCreate">新增标签</el-button>
        </div>
      </div>
    </template>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column prop="name" label="标签名" min-width="160" />
      <el-table-column label="颜色" width="130">
        <template #default="{ row }">
          <el-tag :color="row.color" effect="dark">{{ row.color }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="meaning" label="标签含义" min-width="240" show-overflow-tooltip />
      <el-table-column label="可见角色" min-width="280">
        <template #default="{ row }">
          <el-tag
            v-for="code in row.visibleRoleCodes"
            :key="code"
            size="small"
            effect="plain"
            class="tag-page__role"
          >
            {{ roleName(code) }}
          </el-tag>
          <span v-if="!row.visibleRoleCodes?.length" class="tag-page__muted">全部角色可见</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">
          {{ row.updatedAt?.replace('T', ' ').slice(0, 19) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

      <div class="tag-page__pager">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next"
        :total="total"
        :page-sizes="[10, 20, 50]"
        @current-change="onPageChange"
        @size-change="onPageSizeChange"
      />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editId ? '编辑标签' : '新增标签'"
      width="620px"
      destroy-on-close
    >
    <el-form label-width="100px">
      <el-form-item label="标签名称" required>
        <el-input v-model="form.name" maxlength="50" placeholder="例如：反洗钱" />
      </el-form-item>
      <el-form-item label="标签颜色">
        <el-color-picker v-model="form.color" />
      </el-form-item>
      <el-form-item label="标签含义">
        <el-input
          v-model="form.meaning"
          type="textarea"
          :rows="3"
          maxlength="300"
          show-word-limit
          placeholder="描述该标签适用场景"
        />
      </el-form-item>
      <el-form-item label="可见角色">
        <el-select
          v-model="form.visibleRoleCodes"
          multiple
          clearable
          filterable
          style="width: 100%"
          placeholder="不选=全部角色可见"
        >
          <el-option v-for="r in roles" :key="r.code" :label="`${r.name}(${r.code})`" :value="r.code" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
    </el-dialog>
  </section>
</template>

<style scoped lang="scss">
.tag-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tag-page__title {
  font-size: 16px;
  font-weight: 600;
}

.tag-page__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tag-page__pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.tag-page__role {
  margin-right: 6px;
  margin-bottom: 4px;
}

.tag-page__muted {
  color: var(--el-text-color-secondary);
}
</style>
