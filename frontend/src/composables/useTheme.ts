import { computed, ref } from 'vue'

const THEME_KEY = 'app-theme'
const isDark = ref(false)

function applyTheme(dark: boolean) {
  const root = document.documentElement
  root.classList.toggle('dark', dark)
}

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  const preferDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = saved ? saved === 'dark' : preferDark
  applyTheme(isDark.value)
}

export function useTheme() {
  const themeLabel = computed(() => (isDark.value ? '夜间模式' : '日间模式'))

  function setDarkMode(value: boolean) {
    isDark.value = value
    localStorage.setItem(THEME_KEY, value ? 'dark' : 'light')
    applyTheme(value)
  }

  function toggleTheme() {
    setDarkMode(!isDark.value)
  }

  return {
    isDark,
    themeLabel,
    setDarkMode,
    toggleTheme,
  }
}
