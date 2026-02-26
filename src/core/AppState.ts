import type { AppGlobalState } from './AppState'

export class AppState {
  private static instance: AppState
  private app: any
  private currentPageId: string
  private pageStack: any[]
  private globalState: AppGlobalState

  private constructor() {
    this.globalState = {
      theme: 'light',
      language: 'zh-CN',
      tabBarSelectedIndex: 0
    }
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

  updateGlobalState(updates: Partial<AppGlobalState>): void {
    this.globalState = { ...this.globalState, ...updates }
  }

  init(app: any): void {
    this.app = app
    this.pageStack = []
    this.currentPageId = app.router.initialPageId
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
}
