interface ThemeConfig{
  [key : `--${string}`]: string
}

export interface Theme{
  name : string,
  config : ThemeConfig | null
}

class ThemeManager{
  theme_list : Theme[] = [{
    name:'light',
    config:{
      '--color-background-soft': 'var(--vt-c-white-soft)',
      '--color-text': 'var(--vt-c-text-light-1)',
      '--chart-background' : 'var(--chart-background-light'
  }},{
    name : 'dark',
    config:{
      '--color-background-soft': 'var(--vt-c-black-soft)',
      '--color-text': 'var(--vt-c-text-dark-1)',
      '--chart-background' : 'var(--chart-background-dark'
    }
  },{
    name : 'system',
    config: null
  }]

  currentTheme = localStorage.getItem('theme') || 'system'

  constructor(){
    this.currentTheme = localStorage.getItem('theme') || 'system'
  }
  
  /**
   * 应用指定的主题样式，如果主题名未给出，则切换至跟随系统
   * @param themeName 
   * @returns 
   */
  applyTheme = (themeName: string="") => {
    let themeConfig = this.theme_list.find((item : Theme)=>{
      if (item.name==themeName) return true
      else return false
    })?.config
    if (!themeConfig){  // 默认主题为跟随系统喜好
      const themeSystem = window.matchMedia("(prefers-color-scheme: light)"); 
      if (themeSystem.matches)
        themeConfig = this.theme_list[0].config // light theme
      else
        themeConfig = this.theme_list[1].config // dark theme
    }

    const root = document.documentElement
    Object.entries(themeConfig as ThemeConfig).forEach(([key, value]) => {  // set the theme item iterably
      root.style.setProperty(key, value)
    })
    localStorage.setItem('theme',this.currentTheme)
    return this
  }

  /**
   * 更新主题库中指定主题的指定css变量，如果对应主题名不存在，默认新建
   * @param theme 
   */
  updateTheme = (theme : Theme)=>{
    let changed = false
    this.theme_list.forEach((item:Theme)=>{
      if (item.name==theme.name) {
        Object.entries(theme.config as ThemeConfig).forEach(([key,value])=>{
          (item.config as ThemeConfig)[key as `--${string}`] = value
        })
      }
      changed = true
    })
    if (changed) return this
    this.theme_list.push(theme)
    return this
  }

  /**
   * 覆盖主题库中指定主题的配置，如果对应主题名不存在，默认新建
   * @param theme 
   * @returns 
   */
  overrideTheme = (theme: Theme)=>{
    let changed = false
    this.theme_list.forEach((item:Theme)=>{
      if (item.name==theme.name) {
        item.config = theme.config
        changed = true
      }
    })
    if (changed) return
    this.theme_list.push(theme)
  }

  /**
   * 获取对应主题的配置，
   * 如果主题名未给出，则获取所有主题名字列表；
   * 若指定的主题名不存在，则返回空配置
   * @param themeName 
   * @returns 
   */
  getTheme = (themeName : string = "")=>{
    if (!themeName){
      let list : string[] = []
      this.theme_list.forEach((item:Theme)=>{
        list.push(item.name)
      })
      return list
    }
    const config = this.theme_list.find(item=>{
      if(item.name==themeName) return true
      else return false 
    })?.config
    return config
  }

  /**
   * 切换到指定主题，如果主题名未给出，则切换至跟随系统
   * @param themeName 
   */
  toggleTheme = (themeName : string)=>{
    if (!themeName) themeName='system'
    this.currentTheme = themeName
    this.applyTheme(themeName)
  }
}

export const instance : ThemeManager = new ThemeManager()