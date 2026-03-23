export type SearchComponentType =
  | 'input'
  | 'select'
  | 'datePicker'
  | 'dateRange'
  | 'switch'
  | 'radioGroup'
  | 'checkboxGroup'
  | 'inputNumber'
  | 'slot'

export interface SearchOptionItem {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface SearchItemConfig {
  key: string
  label?: string
  component: SearchComponentType
  placeholder?: string
  width?: string | number
  clearable?: boolean
  componentProps?: Record<string, unknown>
  options?: SearchOptionItem[]
  slotName?: string
}
