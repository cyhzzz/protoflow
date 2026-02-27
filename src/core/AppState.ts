// AppGlobalState 类型定义
export interface AppGlobalState {
  user?: {
    id: string
    name: string
    avatar?: string
  }
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  tabBarSelectedIndex: number
}

export class AppState {
  private static instance: AppState
  private app: unknown = null
  private currentPageId: string = ''
  private pageStack: unknown[] = []
  private globalState: AppGlobalState
  private requestResults: Map<string, unknown>

  private constructor() {
    this.globalState = {
      theme: 'light',
      language: 'zh-CN',
      tabBarSelectedIndex: 0
    }
    this.requestResults = new Map()
  }

  static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState()
    }
    return AppState.instance
  }

  getApp(): any {
    return this.app
  }

  getCurrentPageId(): string {
    return this.currentPageId
  }

  setCurrentPageId(pageId: string): void {
    this.currentPageId = pageId
  }

  getPageStack(): any[] {
    return [...this.pageStack]
  }

  pushStack(item: any): void {
    this.pageStack.push(item)
  }

  popStack(): any | undefined {
    return this.pageStack.pop()
  }

  getGlobalState(): AppGlobalState {
    return { ...this.globalState }
  }

  updateGlobalState(updates: Partial<AppGlobalState> | Record<string, unknown>): void {
    this.globalState = { ...this.globalState, ...updates } as AppGlobalState
  }

  // 设置请求结果
  setRequestResult(url: string, result: unknown): void {
    this.requestResults.set(url, result)
  }

  // 获取请求结果
  getRequestResult(url: string): unknown | undefined {
    return this.requestResults.get(url)
  }

  // 清除请求结果
  clearRequestResults(): void {
    this.requestResults.clear()
  }

  init(app: any): void {
    this.app = app
    this.pageStack = []
    this.currentPageId = app.router.initialPageId
  }

  // 重置状态
  reset(): void {
    this.app = null
    this.pageStack = []
    this.currentPageId = ''
    this.globalState = {
      theme: 'light',
      language: 'zh-CN',
      tabBarSelectedIndex: 0
    }
    this.requestResults.clear()
  }
}

export interface AppGlobalState {
  user?: {
    id: string
    name: string
    avatar?: string
  }
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  tabBarSelectedIndex: number
  [key: string]: unknown
}