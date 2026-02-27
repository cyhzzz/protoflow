import { useState, useEffect, useMemo } from 'react'
import ProtoFlowAppComponent from './components/ProtoFlowApp'
import { PageManager } from './core/PageManager'
import { GlobalActionExecutor } from './core/GlobalActionExecutor'
import { AppState } from './core/AppState'
import type { App } from './types'

interface ProtoFlowProps {
  app: App
}

function ProtoFlow({ app }: ProtoFlowProps) {
  const [isInitialized, setIsInitialized] = useState(false)

  // 初始化核心管理器
  const pageManager = useMemo(() => new PageManager(app), [app])
  const actionExecutor = useMemo(() => GlobalActionExecutor.getInstance(), [])

  useEffect(() => {
    // 初始化全局状态
    AppState.getInstance().init(app)

    // 初始化 Action 执行器
    actionExecutor.init(pageManager)

    setIsInitialized(true)

    // 清理
    return () => {
      actionExecutor.destroy()
      pageManager.destroy()
      AppState.getInstance().reset()
    }
  }, [app, pageManager, actionExecutor])

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#595959',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div className="loading-spinner" />
        <span>加载中...</span>
      </div>
    )
  }

  return <ProtoFlowAppComponent app={app} />
}

export default ProtoFlow