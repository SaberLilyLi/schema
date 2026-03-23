<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SearchItemConfig } from './types'

const props = withDefaults(
  defineProps<{
    searchItems: SearchItemConfig[]
    searchModest: Record<string, unknown>
    inline?: boolean
    labelWidth?: string | number
    showSearchButton?: boolean
    showResetButton?: boolean
    searchButtonText?: string
    resetButtonText?: string
    columnsPerRow?: number
    collapsedRows?: number
    expandedRows?: number
  }>(),
  {
    inline: false,
    labelWidth: 'auto',
    showSearchButton: true,
    showResetButton: true,
    searchButtonText: '查询',
    resetButtonText: '重置',
    columnsPerRow: 6,
    collapsedRows: 1,
    expandedRows: 3,
  },
)

const emit = defineEmits<{
  (e: 'update:searchModest', value: Record<string, unknown>): void
  (e: 'search'): void
  (e: 'reset'): void
  (
    e: 'change',
    payload: { key: string; value: unknown; model: Record<string, unknown> },
  ): void
}>()

function updateField(key: string, value: unknown) {
  const next = { ...props.searchModest, [key]: value }
  emit('update:searchModest', next)
  emit('change', { key, value, model: next })
}

function handleSearch() {
  emit('search')
}

function handleReset() {
  const next: Record<string, unknown> = {}
  for (const item of props.searchItems) {
    next[item.key] = item.component === 'checkboxGroup' ? [] : ''
  }
  emit('update:searchModest', next)
  emit('reset')
}

function getArrayValue(key: string) {
  const value = props.searchModest[key]
  return Array.isArray(value) ? value : []
}

function getNumberValue(key: string) {
  const value = props.searchModest[key]
  return typeof value === 'number' ? value : undefined
}

function getWidth(item: SearchItemConfig, fallback: string) {
  return item.width ? String(item.width) : fallback
}

function onInputChange(key: string, v: unknown) {
  updateField(key, v)
}

function makeUpdateValue(key: string) {
  return (v: unknown) => onInputChange(key, v)
}

const expanded = ref(false)

const totalRows = computed(() => {
  if (!props.searchItems.length) return 0
  return Math.ceil(props.searchItems.length / props.columnsPerRow)
})

const shouldShowToggle = computed(() => totalRows.value > props.collapsedRows)

const currentRows = computed(() => {
  if (!shouldShowToggle.value) return totalRows.value
  return expanded.value
    ? Math.min(props.expandedRows, totalRows.value)
    : props.collapsedRows
})

const visibleItems = computed(() => {
  const max = currentRows.value * props.columnsPerRow
  return props.searchItems.slice(0, max)
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columnsPerRow}, minmax(0, 1fr))`,
}))

function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<template>
  <el-form
    :inline="false"
    :label-width="labelWidth"
    class="common-search"
    @submit.prevent="handleSearch"
    label-position="top"
  >
    <div class="common-search__grid" :style="gridStyle">
      <el-form-item
        v-for="item in visibleItems"
        :key="item.key"
        :label="item.label"
        class="common-search__cell"
      >
      <template v-if="item.component === 'input'">
        <el-input
          :model-value="searchModest[item.key]"
          :placeholder="item.placeholder"
          :clearable="item.clearable ?? true"
          :style="{ width: getWidth(item, '220px') }"
          v-bind="item.componentProps"
          @update:model-value="onInputChange(item.key, $event)"
          @keyup.enter="handleSearch"
        />
      </template>

      <template v-else-if="item.component === 'select'">
        <el-select
          :model-value="searchModest[item.key]"
          :placeholder="item.placeholder"
          :clearable="item.clearable ?? true"
          :style="{ width: getWidth(item, '180px') }"
          v-bind="item.componentProps"
          @update:model-value="onInputChange(item.key, $event)"
        >
          <el-option
            v-for="opt in item.options || []"
            :key="`${item.key}-${opt.value}`"
            :label="opt.label"
            :value="opt.value"
            :disabled="opt.disabled"
          />
        </el-select>
      </template>

      <template v-else-if="item.component === 'datePicker'">
        <el-date-picker
          :model-value="searchModest[item.key]"
          type="date"
          :placeholder="item.placeholder || '请选择日期'"
          :style="{ width: getWidth(item, '180px') }"
          v-bind="item.componentProps"
          @update:model-value="onInputChange(item.key, $event)"
        />
      </template>

      <template v-else-if="item.component === 'dateRange'">
        <el-date-picker
          :model-value="searchModest[item.key]"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :style="{ width: getWidth(item, '280px') }"
          v-bind="item.componentProps"
          @update:model-value="onInputChange(item.key, $event)"
        />
      </template>

      <template v-else-if="item.component === 'switch'">
        <el-switch
          :model-value="Boolean(searchModest[item.key])"
          v-bind="item.componentProps"
          @update:model-value="onInputChange(item.key, $event)"
        />
      </template>

      <template v-else-if="item.component === 'radioGroup'">
        <el-radio-group
          :model-value="searchModest[item.key]"
          v-bind="item.componentProps"
          @update:model-value="onInputChange(item.key, $event)"
        >
          <el-radio
            v-for="opt in item.options || []"
            :key="`${item.key}-${opt.value}`"
            :label="opt.value"
            :disabled="opt.disabled"
          >
            {{ opt.label }}
          </el-radio>
        </el-radio-group>
      </template>

      <template v-else-if="item.component === 'checkboxGroup'">
        <el-checkbox-group
          :model-value="getArrayValue(item.key)"
          v-bind="item.componentProps"
          @update:model-value="onInputChange(item.key, $event)"
        >
          <el-checkbox
            v-for="opt in item.options || []"
            :key="`${item.key}-${opt.value}`"
            :label="opt.value"
            :disabled="opt.disabled"
          >
            {{ opt.label }}
          </el-checkbox>
        </el-checkbox-group>
      </template>

      <template v-else-if="item.component === 'inputNumber'">
        <el-input-number
          :model-value="getNumberValue(item.key)"
          :style="{ width: getWidth(item, '160px') }"
          v-bind="item.componentProps"
          @update:model-value="onInputChange(item.key, $event)"
        />
      </template>

      <template v-else-if="item.component === 'slot'">
        <slot
          :name="item.slotName || item.key"
          :item="item"
          :value="searchModest[item.key]"
          :update-value="makeUpdateValue(item.key)"
        />
      </template>
      </el-form-item>
    </div>

    <div class="common-search__footer">
      <div class="common-search__toggle-wrap">
        <el-button
          v-if="shouldShowToggle"
          link
          type="primary"
          @click="toggleExpand"
        >
          {{ expanded ? '收起' : '展开' }}
        </el-button>
      </div>
      <div class="common-search__actions">
        <el-button v-if="showSearchButton" type="primary" @click="handleSearch">
          {{ searchButtonText }}
        </el-button>
        <el-button v-if="showResetButton" @click="handleReset">
          {{ resetButtonText }}
        </el-button>
      </div>
    </div>
  </el-form>
</template>

<style scoped lang="scss">
.common-search {
  width: 100%;
}

.common-search__grid {
  display: grid;
  gap: 8px 12px;
}

.common-search__cell {
  margin-bottom: 0;
}

.common-search__cell :deep(.el-form-item__content) {
  width: 100%;
}

.common-search__cell :deep(.el-input),
.common-search__cell :deep(.el-select),
.common-search__cell :deep(.el-date-editor),
.common-search__cell :deep(.el-input-number) {
  width: 100% !important;
}

.common-search__footer {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.common-search__toggle-wrap {
  min-height: 24px;
}

.common-search__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
</style>
