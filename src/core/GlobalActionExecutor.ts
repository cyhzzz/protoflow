import type { PageManager } from './PageManager'
import type { Action, ToastConfig, ActionSheetConfig, ModalConfig } from '../types'
import { AppState } from './AppState'

// 回调类型定义
export interface ActionExecutorCallbacks {
  onNavigate: (pageId: string, params?: Record<string, unknown>) => void
  onNavigateBack: (depth?: number) => void
  onSwitchTab: (tabIndex: number) => void
  onShowToast: (config: ToastConfig) => void
  onHideToast: () => void
  onShowModal: (config: ModalConfig) => void
  onHideModal: () => void
  onShowActionSheet: (config: ActionSheetConfig) => void
  onHideActionSheet: () => void
  onStateUpdate: (path: string, value: unknown) => void
  onRefresh: () => void
}

export class GlobalActionExecutor {
  private static instance: GlobalActionExecutor
  private pageManager: PageManager | null = null
  private callbacks: Partial<ActionExecutorCallbacks> = {}
  private toastTimer: ReturnType<typeof setTimeout> | null = null

  private constructor() {}

  static getInstance(): GlobalActionExecutor {
    if (!GlobalActionExecutor.instance) {
      GlobalActionExecutor.instance = new GlobalActionExecutor()
    }
    return GlobalActionExecutor.instance
  }

  init(pageManager: PageManager, callbacks?: Partial<ActionExecutorCallbacks>): void {
    this.pageManager = pageManager
    if (callbacks) {
      this.callbacks = callbacks
    }
  }

  setCallbacks(callbacks: Partial<ActionExecutorCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  async execute(action: Action): Promise<void> {
    if (!action || !action.type) {
      console.warn('Invalid action: missing type')
      return
    }

    console.log(`[ActionExecutor] Executing: ${action.type}`, action)

    try {
      switch (action.type) {
        case 'navigateTo':
          await this.handleNavigateTo(action)
          break
        case 'navigateBack':
          await this.handleNavigateBack(action)
          break
        case 'switchTab':
          await this.handleSwitchTab(action)
          break
        case 'redirectTo':
          await this.handleRedirectTo(action)
          break
        case 'reLaunch':
          await this.handleReLaunch(action)
          break
        case 'showModal':
          await this.handleShowModal(action)
          break
        case 'hideModal':
          this.handleHideModal()
          break
        case 'showToast':
          await this.handleShowToast(action)
          break
        case 'hideToast':
          this.handleHideToast()
          break
        case 'showActionSheet':
          await this.handleShowActionSheet(action)
          break
        case 'request':
          await this.handleRequest(action)
          break
        case 'updateState':
          this.handleUpdateState(action)
          break
        case 'delay':
          await this.handleDelay(action)
          break
        default:
          console.warn(`Unknown action type: ${action.type}`)
      }
    } catch (error) {
      console.error(`[ActionExecutor] Error executing ${action.type}:`, error)
      if (action.errorAction) {
        await this.execute(action.errorAction)
      }
    }
  }

  // navigateTo: 跳转到新页面
  private async handleNavigateTo(action: Action): Promise<void> {
    const { pageId, params } = action
    if (!pageId) {
      console.warn('navigateTo: missing pageId')
      return
    }

    if (this.pageManager) {
      const page = this.pageManager.findPage(pageId)
      if (!page) {
        console.warn(`navigateTo: page not found: ${pageId}`)
        return
      }
      this.pageManager.push(pageId, params)
    }

    if (this.callbacks.onNavigate) {
      this.callbacks.onNavigate(pageId, params)
    }
  }

  // navigateBack: 返回上一页
  private async handleNavigateBack(action: Action): Promise<void> {
    const depth = typeof action.params?.depth === 'number' ? action.params.depth : 1

    if (this.pageManager) {
      this.pageManager.pop(depth)
    }

    if (this.callbacks.onNavigateBack) {
      this.callbacks.onNavigateBack(depth)
    }
  }

  // switchTab: 切换Tab
  private async handleSwitchTab(action: Action): Promise<void> {
    const { tabIndex, pageId } = action

    let targetIndex = tabIndex
    let targetPageId = pageId

    // 如果只提供了 pageId，从 TabBar 配置中查找索引
    if (pageId !== undefined && tabIndex === undefined && this.pageManager) {
      const app = this.pageManager.getApp()
      if (app.tabBar) {
        const index = app.tabBar.items.findIndex(item => item.pageId === pageId)
        if (index !== -1) {
          targetIndex = index
        }
      }
    }

    // 如果只提供了 tabIndex，获取对应的 pageId
    if (tabIndex !== undefined && pageId === undefined && this.pageManager) {
      const app = this.pageManager.getApp()
      if (app.tabBar && app.tabBar.items[tabIndex]) {
        targetPageId = app.tabBar.items[tabIndex].pageId
      }
    }

    if (targetIndex !== undefined) {
      // 更新 AppState 中的 TabBar 选中状态
      AppState.getInstance().updateGlobalState({
        tabBarSelectedIndex: targetIndex
      })

      // 切换到对应的页面
      if (targetPageId && this.pageManager) {
        this.pageManager.clear()
        this.pageManager.push(targetPageId)
      }

      if (this.callbacks.onSwitchTab) {
        this.callbacks.onSwitchTab(targetIndex)
      }
    }
  }

  // redirectTo: 替换当前页面
  private async handleRedirectTo(action: Action): Promise<void> {
    const { pageId, params } = action
    if (!pageId) {
      console.warn('redirectTo: missing pageId')
      return
    }

    if (this.pageManager) {
      this.pageManager.replace(pageId, params)
    }

    if (this.callbacks.onNavigate) {
      this.callbacks.onNavigate(pageId, params)
    }
  }

  // reLaunch: 重启应用到指定页面
  private async handleReLaunch(action: Action): Promise<void> {
    const { pageId, params } = action
    const targetPageId = pageId || (this.pageManager?.getApp().router.initialPageId)

    if (!targetPageId) {
      console.warn('reLaunch: no target pageId')
      return
    }

    if (this.pageManager) {
      this.pageManager.clear()
      this.pageManager.push(targetPageId, params)
    }

    // 重置 TabBar 选中状态
    AppState.getInstance().updateGlobalState({
      tabBarSelectedIndex: 0
    })

    if (this.callbacks.onNavigate) {
      this.callbacks.onNavigate(targetPageId, params)
    }
  }

  // showModal: 显示模态框
  private async handleShowModal(action: Action): Promise<void> {
    let modalConfig: ModalConfig | null = null

    // 如果提供了 modalId，从 app.modals 中查找
    if (action.modalId && this.pageManager) {
      const app = this.pageManager.getApp()
      if (app.modals && app.modals[action.modalId]) {
        const modal = app.modals[action.modalId]
        modalConfig = {
          title: modal.title,
          content: modal.content,
          closable: modal.closable,
          maskClosable: modal.maskClosable,
          buttons: modal.buttons
        }
      }
    }

    // 如果直接提供了 modal 配置，使用该配置
    if (action.modal) {
      modalConfig = action.modal
    }

    if (!modalConfig) {
      console.warn('showModal: missing modal configuration')
      return
    }

    if (this.callbacks.onShowModal) {
      this.callbacks.onShowModal(modalConfig)
    }
  }

  // hideModal: 隐藏模态框
  private handleHideModal(): void {
    if (this.callbacks.onHideModal) {
      this.callbacks.onHideModal()
    }
  }

  // showToast: 显示提示
  private async handleShowToast(action: Action): Promise<void> {
    if (!action.toast) {
      console.warn('showToast: missing toast configuration')
      return
    }

    // 清除之前的定时器
    if (this.toastTimer) {
      clearTimeout(this.toastTimer)
      this.toastTimer = null
    }

    const config: ToastConfig = {
      message: action.toast.message,
      duration: action.toast.duration || 2000,
      type: action.toast.type || 'info',
      position: action.toast.position || 'center'
    }

    if (this.callbacks.onShowToast) {
      this.callbacks.onShowToast(config)
    }

    // 自动隐藏
    this.toastTimer = setTimeout(() => {
      this.handleHideToast()
    }, config.duration)
  }

  // hideToast: 隐藏提示
  private handleHideToast(): void {
    if (this.callbacks.onHideToast) {
      this.callbacks.onHideToast()
    }
  }

  // showActionSheet: 显示操作菜单
  private async handleShowActionSheet(action: Action): Promise<void> {
    if (!action.actionSheet) {
      console.warn('showActionSheet: missing actionSheet configuration')
      return
    }

    if (this.callbacks.onShowActionSheet) {
      this.callbacks.onShowActionSheet(action.actionSheet)
    }
  }

  // request: 网络请求
  private async handleRequest(action: Action): Promise<void> {
    const { url, method = 'GET', data, headers, successAction, errorAction } = action

    if (!url) {
      console.warn('request: missing url')
      return
    }

    try {
      // 模拟网络请求（实际项目中应使用真实请求）
      const mockResponse = await this.mockRequest(url, method, data, headers)

      // 存储响应到 AppState
      AppState.getInstance().setRequestResult(url, mockResponse)

      // 执行成功回调
      if (successAction) {
        // 将响应数据注入到 successAction 中
        const enrichedAction = {
          ...successAction,
          params: {
            ...successAction.params,
            response: mockResponse
          }
        }
        await this.execute(enrichedAction)
      }
    } catch (error) {
      console.error('[ActionExecutor] Request failed:', error)

      if (errorAction) {
        const enrichedAction = {
          ...errorAction,
          params: {
            ...errorAction.params,
            error: error instanceof Error ? error.message : 'Request failed'
          }
        }
        await this.execute(enrichedAction)
      }
    }
  }

  // 模拟网络请求
  private async mockRequest(
    url: string,
    _method: string,
    data?: Record<string, unknown>,
    _headers?: Record<string, string>
  ): Promise<unknown> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟响应数据
    const mockResponses: Record<string, unknown> = {
      '/api/user/info': {
        code: 0,
        data: {
          id: '1001',
          name: '测试用户',
          avatar: 'https://example.com/avatar.png'
        }
      },
      '/api/list': {
        code: 0,
        data: {
          items: [
            { id: 1, title: '示例数据1' },
            { id: 2, title: '示例数据2' }
          ],
          total: 2
        }
      }
    }

    // 返回匹配的模拟数据或默认响应
    return mockResponses[url] || {
      code: 0,
      message: 'success',
      data: data || null
    }
  }

  // updateState: 更新状态
  private handleUpdateState(action: Action): void {
    const { statePath, stateValue } = action

    if (!statePath) {
      console.warn('updateState: missing statePath')
      return
    }

    // 更新 AppState
    const appState = AppState.getInstance()
    const currentState = appState.getGlobalState()

    // 支持路径更新，如 'user.name'
    const pathParts = statePath.split('.')
    const updatedState = { ...currentState } as Record<string, unknown>

    let current: Record<string, unknown> = updatedState
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      if (!current[part]) {
        current[part] = {}
      }
      current = current[part] as Record<string, unknown>
    }

    current[pathParts[pathParts.length - 1]] = stateValue

    appState.updateGlobalState(updatedState)

    if (this.callbacks.onStateUpdate) {
      this.callbacks.onStateUpdate(statePath, stateValue)
    }
  }

  // delay: 延迟执行
  private async handleDelay(action: Action): Promise<void> {
    const duration = action.duration || 1000

    await new Promise(resolve => setTimeout(resolve, duration))

    if (action.nextAction) {
      await this.execute(action.nextAction)
    }
  }

  // 清理资源
  destroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer)
      this.toastTimer = null
    }
    this.pageManager = null
    this.callbacks = {}
  }
}