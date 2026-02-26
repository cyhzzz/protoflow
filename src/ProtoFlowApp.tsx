import React, { useState, useEffect } from 'react'
import ProtoFlowApp from './components/ProtoFlowApp'
import { PageManager } from './core/PageManager'
import { GlobalActionExecutor } from './core/GlobalActionExecutor'
import { AppState } from './core/AppState'

interface ProtoFlowProps {
  app: any
}

function ProtoFlow({ app }: ProtoFlowProps) {
  const [currentPageId, setCurrentPageId] = useState(app.router.initialPageId)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 初始化页面管理器
    const pageManager = new PageManager(app)

    // 初始化全局Action执行器
    GlobalActionExecutor.getInstance().init(pageManager)

    // 初始化全局状态
    AppState.getInstance().init(app)

    setIsInitialized(true)
  }, [app])

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#595959'
      }}>
        加载中...
      </div>
    )
  }

  return <ProtoFlowApp app={app} currentPageId={currentPageId} />
}

export default ProtoFlow
