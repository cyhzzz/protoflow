import type { Page, PageStackItem, App } from '../types'

// 页面变化事件类型
export type PageChangeEvent = {
  type: 'push' | 'pop' | 'replace' | 'clear'
  pageId: string
  params?: Record<string, unknown>
  stackSize: number
}

// 页面变化监听器
export type PageChangeListener = (event: PageChangeEvent) => void

export class PageManager {
  private app: App
  private pageStack: PageStackItem[]
  private currentIndex: number
  private listeners: Set<PageChangeListener>
  private maxStackSize: number

  constructor(app: App, maxStackSize: number = 50) {
    this.app = app
    this.pageStack = []
    this.currentIndex = -1
    this.listeners = new Set()
    this.maxStackSize = maxStackSize
    this.init()
  }

  private init(): void {
    const initialPageId = this.app.router.initialPageId
    this.push(initialPageId)
  }

  // 添加页面变化监听器
  addListener(listener: PageChangeListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // 通知所有监听器
  private notifyListeners(event: PageChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('[PageManager] Listener error:', error)
      }
    })
  }

  push(pageId: string, params?: Record<string, unknown>): void {
    const page = this.findPage(pageId)
    if (!page) {
      console.error(`[PageManager] Page not found: ${pageId}`)
      return
    }

    // 检查栈大小限制
    if (this.pageStack.length >= this.maxStackSize) {
      // 移除最早的页面
      this.pageStack.shift()
      this.currentIndex = Math.max(0, this.currentIndex - 1)
    }

    this.pageStack.push({
      pageId,
      timestamp: Date.now(),
      params
    })
    this.currentIndex = this.pageStack.length - 1

    this.notifyListeners({
      type: 'push',
      pageId,
      params,
      stackSize: this.pageStack.length
    })
  }

  pop(depth: number = 1): void {
    if (depth <= 0) return

    if (this.pageStack.length <= 1) {
      console.warn('[PageManager] Cannot pop: stack has only one page')
      return
    }

    const actualDepth = Math.min(depth, this.pageStack.length - 1)

    for (let i = 0; i < actualDepth; i++) {
      this.pageStack.pop()
    }
    this.currentIndex = this.pageStack.length - 1

    const currentPageId = this.getCurrentPageId()
    this.notifyListeners({
      type: 'pop',
      pageId: currentPageId,
      stackSize: this.pageStack.length
    })
  }

  popTo(pageId: string): void {
    const index = this.pageStack.findIndex(item => item.pageId === pageId)
    if (index === -1) {
      console.error(`[PageManager] Page not in stack: ${pageId}`)
      return
    }

    this.pageStack = this.pageStack.slice(0, index + 1)
    this.currentIndex = index

    this.notifyListeners({
      type: 'pop',
      pageId,
      stackSize: this.pageStack.length
    })
  }

  replace(pageId: string, params?: Record<string, unknown>): void {
    if (this.pageStack.length === 0) {
      console.error('[PageManager] Stack is empty')
      return
    }

    const page = this.findPage(pageId)
    if (!page) {
      console.error(`[PageManager] Page not found: ${pageId}`)
      return
    }

    this.pageStack[this.currentIndex] = {
      pageId,
      timestamp: Date.now(),
      params
    }

    this.notifyListeners({
      type: 'replace',
      pageId,
      params,
      stackSize: this.pageStack.length
    })
  }

  getCurrentPage(): Page | undefined {
    const current = this.pageStack[this.currentIndex]
    return current ? this.findPage(current.pageId) : undefined
  }

  getCurrentPageId(): string {
    return this.pageStack[this.currentIndex]?.pageId || ''
  }

  getCurrentParams(): Record<string, unknown> | undefined {
    return this.pageStack[this.currentIndex]?.params
  }

  getStack(): PageStackItem[] {
    return [...this.pageStack]
  }

  getStackSize(): number {
    return this.pageStack.length
  }

  canGoBack(): boolean {
    return this.pageStack.length > 1
  }

  clear(): void {
    this.pageStack = []
    this.currentIndex = -1

    this.notifyListeners({
      type: 'clear',
      pageId: '',
      stackSize: 0
    })
  }

  getApp(): App {
    return this.app
  }

  findPage(pageId: string): Page | undefined {
    return this.app.pages.find(p => p.id === pageId)
  }

  // 销毁
  destroy(): void {
    this.listeners.clear()
    this.pageStack = []
    this.currentIndex = -1
  }
}