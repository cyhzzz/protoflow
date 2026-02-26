import React from 'react'
import type { App } from '../types'
import ComponentRenderer from './ComponentRenderer'

interface ProtoFlowAppProps {
  app: App
  currentPageId: string
}

const ProtoFlowApp: React.FC<ProtoFlowAppProps> = ({ app, currentPageId }) => {
  const currentPage = app.pages.find(p => p.id === currentPageId)

  return (
    <div className="protoflow-app">
      {/* 左侧样机区域 */}
      <div className="phone-mockup">
        <PhoneFrame>
          {currentPage && <ComponentRenderer tree={currentPage.componentTree} />}
          {app.tabBar && <TabBar tabBar={app.tabBar} />}
        </PhoneFrame>
      </div>

      {/* 右侧说明面板 */}
      <div className="info-panel">
        <InfoPanel page={currentPage} app={app} />
      </div>
    </div>
  )
}

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

const TabBar: React.FC<{ tabBar: any }> = ({ tabBar }) => {
  return (
    <div className="tab-bar">
      {tabBar.items.map((item: any, index: number) => (
        <div key={index} className={`tab-item ${index === tabBar.selectedIndex ? 'active' : ''}`}>
          <div className="tab-icon">{index === tabBar.selectedIndex ? item.selectedIcon : item.icon}</div>
          <div className="tab-text">{item.title}</div>
        </div>
      ))}
    </div>
  )
}

const InfoPanel: React.FC<{ page: any; app: App }> = ({ page, app }) => {
  if (!page) return null

  return (
    <div className="info-panel">
      <h1 className="info-title">{app.name}</h1>
      <p className="info-subtitle">🦞 高保真移动端原型生成系统</p>

      <h2 className="info-section-title">当前页面</h2>
      <p className="info-text">{page.name}</p>
      {page.description && <p className="info-desc">{page.description}</p>}

      <h2 className="info-section-title">应用信息</h2>
      <ul className="info-list">
        <li>版本: {app.version}</li>
        <li>页面数: {app.pages.length}</li>
        <li>路由模式: {app.router.mode}</li>
        {app.tabBar && <li>Tab数量: {app.tabBar.items.length}</li>}
      </ul>
    </div>
  )
}

export default ProtoFlowApp
