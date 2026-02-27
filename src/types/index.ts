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

// 组件类型枚举
export type ComponentType =
  | 'safeArea'
  | 'statusBar'
  | 'navBar'
  | 'tabBar'
  | 'grid'
  | 'list'
  | 'card'
  | 'carousel'
  | 'text'
  | 'image'
  | 'avatar'
  | 'input'
  | 'picker'
  | 'button'
  | 'modal'
  | 'toast'
  | 'actionSheet'
  | 'scrollView'
  | 'container'
  | 'divider'
  | 'spacer'

// 组件样式类型 - 允许任意 CSS 属性
export interface ComponentStyle {
  [key: string]: unknown
}

// 组件基础接口
export interface Component {
  type: ComponentType | string
  id?: string
  style?: ComponentStyle | string
  className?: string
  children?: Component[]
  hidden?: boolean
  disabled?: boolean
  actions?: ComponentActions
  [key: string]: unknown
}

// 组件动作
export interface ComponentActions {
  onClick?: Action
  onChange?: Action
  onFocus?: Action
  onBlur?: Action
}

// Action 类型定义
export type ActionType =
  | 'navigateTo'
  | 'navigateBack'
  | 'switchTab'
  | 'redirectTo'
  | 'reLaunch'
  | 'showModal'
  | 'hideModal'
  | 'showToast'
  | 'hideToast'
  | 'showActionSheet'
  | 'request'
  | 'updateState'
  | 'delay'

export interface Action {
  type: ActionType | string
  // navigateTo/redirectTo/reLaunch
  pageId?: string
  params?: Record<string, unknown>
  // switchTab
  tabIndex?: number
  // showModal
  modalId?: string
  modal?: ModalConfig
  // showToast
  toast?: ToastConfig
  // showActionSheet
  actionSheet?: ActionSheetConfig
  // request
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
  headers?: Record<string, string>
  successAction?: Action
  errorAction?: Action
  // updateState
  statePath?: string
  stateValue?: unknown
  // delay
  duration?: number
  nextAction?: Action
}

// Toast 配置
export interface ToastConfig {
  message: string
  duration?: number
  type?: 'success' | 'error' | 'warning' | 'info'
  position?: 'top' | 'center' | 'bottom'
}

// ActionSheet 配置
export interface ActionSheetConfig {
  title?: string
  message?: string
  items: ActionSheetItem[]
  cancelText?: string
}

export interface ActionSheetItem {
  text: string
  type?: 'default' | 'destructive' | 'cancel'
  action?: Action
  onClickAction?: Action
}

// Modal 配置
export interface ModalConfig {
  title?: string
  content?: string
  closable?: boolean
  maskClosable?: boolean
  buttons?: ModalButton[]
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
  params?: Record<string, unknown>
}

// 过渡动画配置
export interface TransitionConfig {
  type: 'push' | 'fade' | 'slide'
  duration?: number
}

// Grid 组件项
export interface GridItem {
  id?: string
  icon?: string
  text: string
  badge?: string | number
  action?: Action
  onClickAction?: Action
}

// List 组件项
export interface ListItem {
  id?: string
  icon?: string
  image?: string
  title: string
  subtitle?: string
  desc?: string
  badge?: string | number
  accessory?: 'arrow' | 'check' | 'none'
  action?: Action
  onClickAction?: Action
}

// Carousel 组件项
export interface CarouselItem {
  id?: string
  image?: string
  title?: string
  subtitle?: string
  action?: Action
  onClickAction?: Action
}

// Input 组件配置
export interface InputConfig {
  inputType?: 'text' | 'password' | 'number' | 'tel' | 'email'
  placeholder?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  value?: string
}

// Button 组件配置
export interface ButtonConfig {
  text: string
  buttonType?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  block?: boolean
  loading?: boolean
  disabled?: boolean
}

// Picker 组件配置
export interface PickerConfig {
  mode?: 'selector' | 'date' | 'time' | 'region'
  placeholder?: string
  range?: string[]
  value?: number | string
}