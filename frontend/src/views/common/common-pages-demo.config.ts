import type { SearchItemConfig } from '@/components/common/commonSearch/types'
import type { CommonTableColumn } from '@/components/common/commonTable/types'

export interface CommonPagesDemoRow {
  id: string
  name: string
  category: string
  status: string
  amount: number
  createdAt: string
}

export const commonPagesSearchItems: SearchItemConfig[] = [
  {
    key: 'keyword',
    label: '关键词',
    component: 'input',
    placeholder: '请输入名称关键词',
    width: '220px',
  },
  {
    key: 'category',
    label: '分类',
    component: 'select',
    width: '160px',
    options: [
      { label: '全部', value: '' },
      { label: '柜面/对公', value: '柜面/对公' },
      { label: '合规', value: '合规' },
      { label: 'IT/运维', value: 'IT/运维' },
    ],
  },
  {
    key: 'status',
    label: '状态',
    component: 'radioGroup',
    options: [
      { label: '全部', value: '' },
      { label: '草稿', value: 'draft' },
      { label: '审批中', value: 'in_review' },
      { label: '已发布', value: 'published' },
    ],
  },
  {
    key: 'includeDraft',
    label: '含草稿',
    component: 'switch',
  },
]

export const commonPagesTableColumns: CommonTableColumn[] = [
  { key: 'name', prop: 'name', label: '名称', minWidth: 180 },
  { key: 'category', prop: 'category', label: '分类', minWidth: 120 },
  { key: 'status', prop: 'status', label: '状态', width: 100, slotName: 'status' },
  { key: 'amount', prop: 'amount', label: '数值', width: 100 },
  { key: 'createdAt', prop: 'createdAt', label: '创建时间', minWidth: 160 },
]

export const commonPagesDemoRows: CommonPagesDemoRow[] = [
  {
    id: '1',
    name: '对公开户资料',
    category: '柜面/对公',
    status: 'published',
    amount: 35,
    createdAt: '2026-03-22 10:20:00',
  },
  {
    id: '2',
    name: '反洗钱操作指引',
    category: '合规',
    status: 'in_review',
    amount: 18,
    createdAt: '2026-03-21 16:10:00',
  },
  {
    id: '3',
    name: '应急预案',
    category: 'IT/运维',
    status: 'draft',
    amount: 12,
    createdAt: '2026-03-20 09:01:00',
  },
]

export const commonPagesDefaultSearchModest: Record<string, unknown> = {
  keyword: '',
  category: '',
  status: '',
  includeDraft: true,
}
