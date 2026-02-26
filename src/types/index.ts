// 应用类型定义
export interface App {
  id: string
  name: string
  version: string
  description?: string
  pages: Page[]
  router: Router
  tabBar?: TabBar
  theme?: Theme
  modals?: Record<string, Modal>
}

// 页面类型定义
export interface Page {
  id: string
  name: string
  description?: string
  componentTree: Component
}

// 组件类型定义
export interface Component {
  type: string
  style?: any
  children?: Component[]
  items?: any[]
  [key: string]: any
}

// 路由器类型定义
export interface Router {
  mode: 'tab' | 'stack' | 'modal'
  initialPageId: string
  historyLimit?: number
  transition?: TransitionConfig
}

// TabBar类型定义
export interface TabBar {
  type: 'tabBar'
  selectedIndex: number
  backgroundColor?: string
  height?: number
  showDivider?: boolean
  items: TabBarItem[]
}

export interface TabBarItem {
  title: string
  icon: string
  selectedIcon: string
  pageId: string
  disabled?: boolean
  badge?: number | string
}

// 主题类型定义
export interface Theme {
  primaryColor?: string
  secondaryColor?: string
  errorColor?: string
  warningColor?: string
  textColor?: string
  backgroundColor?: string
}

// Modal类型定义
export interface Modal {
  type: 'modal'
  title: string
  content: string
  closable?: boolean
  maskClosable?: boolean
  width?: number
  backgroundColor?: string
  buttons: ModalButton[]
}

export interface ModalButton {
  text: string
  type?: 'primary' | 'secondary' | 'danger'
  onClickAction?: Action
}

// 页面栈项类型定义
export interface PageStackItem {
  pageId: string
  timestamp: number
  params?: any
}

// 过渡动画配置
export interface TransitionConfig {
  type: 'push' | 'fade' | 'slide'
  duration?: number
}
