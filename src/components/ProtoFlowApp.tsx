import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { App, Action, ToastConfig, ModalConfig, ActionSheetConfig } from '../types'
import ComponentRenderer from './ComponentRenderer'
import { PageManager, PageChangeEvent } from '../core/PageManager'
import { GlobalActionExecutor } from '../core/GlobalActionExecutor'
import { AppState } from '../core/AppState'

interface ProtoFlowAppProps {
  app: App
}

const ProtoFlowApp: React.FC<ProtoFlowAppProps> = ({ app }) => {
  // 状态
  const [currentPageId, setCurrentPageId] = useState(app.router.initialPageId)
  const [pageParams, setPageParams] = useState<Record<string, unknown>>({})
  const [tabBarIndex, setTabBarIndex] = useState(0)
  const [pageStack, setPageStack] = useState<string[]>([app.router.initialPageId])

  // UI 状态
  const [toast, setToast] = useState<ToastConfig | null>(null)
  const [modal, setModal] = useState<ModalConfig | null>(null)
  const [actionSheet, setActionSheet] = useState<ActionSheetConfig | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // 核心管理器
  const pageManager = useMemo(() => new PageManager(app), [app])
  const actionExecutor = useMemo(() => GlobalActionExecutor.getInstance(), [])

  // 初始化
  useEffect(() => {
    // 初始化全局状态
    AppState.getInstance().init(app)

    // 设置 Action 执行器回调
    actionExecutor.init(pageManager, {
      onNavigate: (pageId, params) => {
        setCurrentPageId(pageId)
        setPageParams(params || {})
        setPageStack(pageManager.getStack().map(item => item.pageId))
        setIsTransitioning(true)
        setTimeout(() => setIsTransitioning(false), 300)
      },
      onNavigateBack: () => {
        const currentPageId = pageManager.getCurrentPageId()
        setCurrentPageId(currentPageId)
        setPageParams(pageManager.getCurrentParams() || {})
        setPageStack(pageManager.getStack().map(item => item.pageId))
        setIsTransitioning(true)
        setTimeout(() => setIsTransitioning(false), 300)
      },
      onSwitchTab: (index) => {
        setTabBarIndex(index)
        const currentPageId = pageManager.getCurrentPageId()
        setCurrentPageId(currentPageId)
        setPageStack(pageManager.getStack().map(item => item.pageId))
      },
      onShowToast: (config) => {
        setToast(config)
      },
      onHideToast: () => {
        setToast(null)
      },
      onShowModal: (config) => {
        setModal(config)
      },
      onHideModal: () => {
        setModal(null)
      },
      onShowActionSheet: (config) => {
        setActionSheet(config)
      },
      onHideActionSheet: () => {
        setActionSheet(null)
      },
      onStateUpdate: () => {
        // 触发重新渲染
        forceUpdate()
      }
    })

    // 监听页面变化
    const unsubscribe = pageManager.addListener((event: PageChangeEvent) => {
      setCurrentPageId(event.pageId)
      setPageStack(pageManager.getStack().map(item => item.pageId))
    })

    // 设置初始 TabBar 索引
    if (app.tabBar) {
      setTabBarIndex(app.tabBar.selectedIndex)
    }

    return () => {
      unsubscribe()
      actionExecutor.destroy()
      pageManager.destroy()
    }
  }, [app, pageManager, actionExecutor])

  // 强制更新
  const [, setTick] = useState(0)
  const forceUpdate = useCallback(() => setTick(tick => tick + 1), [])

  // 当前页面
  const currentPage = useMemo(() => {
    return app.pages.find(p => p.id === currentPageId)
  }, [app.pages, currentPageId])

  // TabBar 切换
  const handleTabSwitch = useCallback((index: number) => {
    if (!app.tabBar || index === tabBarIndex) return

    const item = app.tabBar.items[index]
    if (item.disabled) return

    actionExecutor.execute({
      type: 'switchTab',
      tabIndex: index,
      pageId: item.pageId
    })
  }, [app.tabBar, tabBarIndex, actionExecutor])

  // Action 处理
  const handleAction = useCallback((action: Action) => {
    actionExecutor.execute(action)
  }, [actionExecutor])

  // Modal 按钮
  const handleModalButton = useCallback((button: { text: string; type?: string; onClickAction?: Action }) => {
    if (button.onClickAction) {
      actionExecutor.execute(button.onClickAction)
    }
    setModal(null)
  }, [actionExecutor])

  // ActionSheet 项目
  const handleActionSheetItem = useCallback((item: { text: string; action?: Action; onClickAction?: Action }) => {
    const actionToExecute = item.action || item.onClickAction
    if (actionToExecute) {
      actionExecutor.execute(actionToExecute)
    }
    setActionSheet(null)
  }, [actionExecutor])

  return (
    <div className="protoflow-app">
      {/* 左侧样机区域 */}
      <div className="phone-mockup">
        <PhoneFrame>
          {/* 页面内容 */}
          <div className={`page-container ${isTransitioning ? 'transitioning' : ''}`}>
            {currentPage && (
              <ComponentRenderer
                tree={currentPage.componentTree}
                onAction={handleAction}
              />
            )}
          </div>

          {/* TabBar */}
          {app.tabBar && (
            <TabBar
              items={app.tabBar.items}
              selectedIndex={tabBarIndex}
              onSwitch={handleTabSwitch}
            />
          )}

          {/* Toast */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              position={toast.position}
              onClose={() => setToast(null)}
            />
          )}

          {/* Modal */}
          {modal && (
            <Modal
              config={modal}
              onButton={handleModalButton}
              onClose={() => setModal(null)}
            />
          )}

          {/* ActionSheet */}
          {actionSheet && (
            <ActionSheet
              config={actionSheet}
              onItem={handleActionSheetItem}
              onClose={() => setActionSheet(null)}
            />
          )}
        </PhoneFrame>

        {/* 导航栏 */}
        <NavigationBar
          pageStack={pageStack}
          onBack={() => actionExecutor.execute({ type: 'navigateBack' })}
          canGoBack={pageStack.length > 1}
        />
      </div>

      {/* 右侧说明面板 */}
      <div className="info-panel">
        <InfoPanel
          page={currentPage}
          app={app}
          pageParams={pageParams}
          pageStack={pageStack}
        />
      </div>
    </div>
  )
}

// 手机框架组件
const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="phone-frame">
      {/* 刘海 */}
      <div className="phone-notch" />
      {/* 屏幕区域 */}
      <div className="phone-screen">{children}</div>
    </div>
  )
}

// TabBar 组件
const TabBar: React.FC<{
  items: Array<{ title: string; icon: string; selectedIcon: string; disabled?: boolean; badge?: number | string }>
  selectedIndex: number
  onSwitch: (index: number) => void
}> = ({ items, selectedIndex, onSwitch }) => {
  return (
    <div className="tab-bar">
      {items.map((item, index) => (
        <div
          key={index}
          className={`tab-item ${index === selectedIndex ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
          onClick={() => !item.disabled && onSwitch(index)}
        >
          <div className="tab-icon">
            {index === selectedIndex ? item.selectedIcon : item.icon}
          </div>
          <div className="tab-text">{item.title}</div>
          {item.badge !== undefined && (
            <span className="tab-badge">{item.badge}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// Toast 组件
const Toast: React.FC<{
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  position?: 'top' | 'center' | 'bottom'
  onClose: () => void
}> = ({ message, type = 'info', position = 'center', onClose }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }

  return (
    <div className={`toast toast-${type} toast-${position}`} onClick={onClose}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
    </div>
  )
}

// Modal 组件
const Modal: React.FC<{
  config: ModalConfig
  onButton: (button: { text: string; type?: string; onClickAction?: Action }) => void
  onClose: () => void
}> = ({ config, onButton, onClose }) => {
  return (
    <div className="modal-overlay" onClick={config.maskClosable !== false ? onClose : undefined}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {config.closable !== false && (
          <button className="modal-close" onClick={onClose}>×</button>
        )}
        {config.title && <div className="modal-title">{config.title}</div>}
        {config.content && <div className="modal-content">{config.content}</div>}
        <div className="modal-buttons">
          {config.buttons?.map((button, index) => (
            <button
              key={index}
              className={`modal-btn modal-btn-${button.type || 'default'}`}
              onClick={() => onButton(button)}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ActionSheet 组件
const ActionSheet: React.FC<{
  config: ActionSheetConfig
  onItem: (item: { text: string; action?: Action; onClickAction?: Action }) => void
  onClose: () => void
}> = ({ config, onItem, onClose }) => {
  return (
    <div className="action-sheet-overlay" onClick={onClose}>
      <div className="action-sheet" onClick={e => e.stopPropagation()}>
        {config.title && <div className="action-sheet-title">{config.title}</div>}
        {config.message && <div className="action-sheet-message">{config.message}</div>}
        <div className="action-sheet-items">
          {config.items.map((item, index) => (
            <button
              key={index}
              className={`action-sheet-item action-sheet-item-${item.type || 'default'}`}
              onClick={() => {
                onItem(item)
              }}
            >
              {item.text}
            </button>
          ))}
        </div>
        {config.cancelText && (
          <button className="action-sheet-cancel" onClick={onClose}>
            {config.cancelText}
          </button>
        )}
      </div>
    </div>
  )
}

// 导航栏组件
const NavigationBar: React.FC<{
  pageStack: string[]
  onBack: () => void
  canGoBack: boolean
}> = ({ pageStack, onBack, canGoBack }) => {
  return (
    <div className="navigation-bar">
      <div className="nav-stack">
        {pageStack.map((pageId, index) => {
          const isLast = index === pageStack.length - 1
          return (
            <span
              key={`${pageId}-${index}`}
              className={`nav-stack-item ${isLast ? 'active' : ''}`}
            >
              {pageId}
              {!isLast && <span className="nav-stack-separator">›</span>}
            </span>
          )
        })}
      </div>
      {canGoBack && (
        <button className="nav-back-btn" onClick={onBack}>
          ← 返回
        </button>
      )}
    </div>
  )
}

// 信息面板组件
const InfoPanel: React.FC<{
  page?: { id: string; name: string; description?: string }
  app: App
  pageParams: Record<string, unknown>
  pageStack: string[]
}> = ({ page, app, pageParams, pageStack }) => {
  if (!page) return null

  return (
    <div className="info-panel-content">
      <h1 className="info-title">{app.name}</h1>
      <p className="info-subtitle">🦞 高保真移动端原型生成系统</p>

      <h2 className="info-section-title">当前页面</h2>
      <p className="info-text">{page.name}</p>
      <p className="info-page-id">ID: {page.id}</p>
      {page.description && <p className="info-desc">{page.description}</p>}

      {Object.keys(pageParams).length > 0 && (
        <>
          <h2 className="info-section-title">页面参数</h2>
          <pre className="info-params">{JSON.stringify(pageParams, null, 2)}</pre>
        </>
      )}

      <h2 className="info-section-title">页面栈</h2>
      <div className="info-stack">
        {pageStack.map((pageId, index) => (
          <div key={index} className="info-stack-item">
            {index + 1}. {pageId}
          </div>
        ))}
      </div>

      <h2 className="info-section-title">应用信息</h2>
      <ul className="info-list">
        <li>版本: {app.version}</li>
        <li>页面数: {app.pages.length}</li>
        <li>路由模式: {app.router.mode}</li>
        {app.tabBar && <li>Tab数量: {app.tabBar.items.length}</li>}
      </ul>

      <h2 className="info-section-title">所有页面</h2>
      <div className="info-pages">
        {app.pages.map(p => (
          <div key={p.id} className={`info-page-item ${p.id === page.id ? 'active' : ''}`}>
            <span className="info-page-name">{p.name}</span>
            <span className="info-page-id-badge">{p.id}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProtoFlowApp