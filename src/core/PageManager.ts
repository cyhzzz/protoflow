import type { Page, PageStackItem, App } from '../types'

export class PageManager {
  private app: App
  private pageStack: PageStackItem[]
  private currentIndex: number

  constructor(app: App) {
    this.app = app
    this.pageStack = []
    this.currentIndex = -1
    this.init()
  }

  private init(): void {
    const initialPageId = this.app.router.initialPageId
    this.push(initialPageId)
  }

  push(pageId: string, params?: any): void {
    const page = this.findPage(pageId)
    if (!page) {
      throw new Error(`Page not found: ${pageId}`)
    }

    this.pageStack.push({
      pageId,
      timestamp: Date.now(),
      params
    })
    this.currentIndex = this.pageStack.length - 1
  }

  pop(depth: number = 1): void {
    if (depth <= 0) return
    if (this.pageStack.length <= 1) {
      throw new Error('Cannot pop: stack has only one page')
    }

    for (let i = 0; i < depth; i++) {
      this.pageStack.pop()
    }
    this.currentIndex = this.pageStack.length - 1
  }

  popTo(pageId: string): void {
    const index = this.pageStack.findIndex(item => item.pageId === pageId)
    if (index === -1) {
      throw new Error(`Page not in stack: ${pageId}`)
    }

    this.pageStack = this.pageStack.slice(0, index + 1)
    this.currentIndex = index
  }

  replace(pageId: string, params?: any): void {
    if (this.pageStack.length === 0) {
      throw new Error('Stack is empty')
    }

    this.pageStack[this.currentIndex] = {
      pageId,
      timestamp: Date.now(),
      params
    }
  }

  getCurrentPage(): Page | undefined {
    const current = this.pageStack[this.currentIndex]
    return this.findPage(current.pageId)
  }

  getCurrentPageId(): string {
    return this.pageStack[this.currentIndex]?.pageId || ''
  }

  getStack(): PageStackItem[] {
    return [...this.pageStack]
  }

  clear(): void {
    this.pageStack = []
    this.currentIndex = -1
  }

  getApp(): App {
    return this.app
  }

  findPage(pageId: string): Page | undefined {
    return this.app.pages.find(p => p.id === pageId)
  }
}
