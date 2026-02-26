import type { PageManager } from './PageManager'
import type { ComponentRenderer } from '../components/ComponentRenderer'
import type { Action } from '../types'

export class GlobalActionExecutor {
  private static instance: GlobalActionExecutor
  private pageManager: PageManager | null = null
  private renderer: ComponentRenderer | null = null

  private constructor() {}

  static getInstance(): GlobalActionExecutor {
    if (!GlobalActionExecutor.instance) {
      GlobalActionExecutor.instance = new GlobalActionExecutor()
    }
    return GlobalActionExecutor.instance
  }

  init(pageManager: PageManager, renderer: ComponentRenderer): void {
    this.pageManager = pageManager
    this.renderer = renderer
  }

  execute(action: Action): void {
    if (!this.pageManager || !this.renderer) {
      console.warn('ActionExecutor not initialized')
      return
    }

    console.log('Execute action:', action.type)
    // TODO: 实现各种Action的执行逻辑
  }
}

export interface Action {
  type: string
  [key: string]: any
}
