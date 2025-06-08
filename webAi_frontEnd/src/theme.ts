import { ref, watchEffect } from 'vue'

interface TypeTheme = 'yes' | 'no'

const theme = ref({ // cutomized theme
    light: {
      '--primary-color': '#42b983',
      '--background-color': '#ffffff',
      '--text-color': '#333333'
    },
    dark: {
      '--primary-color': '#64d8a9',
      '--background-color': '#1a1a1a',
      '--text-color': '#f0f0f0'
    }
  })

  export function applyTheme(themeName: 'light' | 'dark' | 'system') {
    if (themeName == 'system'){
      const themeSystem = window.matchMedia("(prefers-color-scheme: light)"); 
      if (themeSystem.matches)
        themeName = 'light'
      else
        themeName = 'dark'
    }
    const themeVars = theme.value[themeName]
    const root = document.documentElement
    
    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }

  function customizeTheme(){

  }


  const currentTheme = ref<'light' | 'dark' | 'system'>(
    localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
  )
  
  watchEffect(() => {
    applyTheme(currentTheme.value)
    localStorage.setItem('theme', currentTheme.value)
  })

  export const toggleTheme = (theme_name : 'light' | 'dark' | 'system') => {
    currentTheme.value = theme_name
  }