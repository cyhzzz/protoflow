import React from 'react'
import type { Component } from '../types'

interface ComponentRendererProps {
  tree: Component
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({ tree }) => {
  const renderComponent = (node: Component): React.ReactNode => {
    const { type, children, items, ...props } = node

    // 根据类型渲染不同的组件
    switch (type) {
      case 'safeArea':
        return (
          <div className="safe-area" {...props}>
            {children?.map((child, index) => (
              <React.Fragment key={index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        )

      case 'statusBar':
        return (
          <div className="status-bar" {...props}>
            <span className="status-bar-time">{props.showTime ? getCurrentTime() : ''}</span>
            <span className="status-bar-network">{props.networkType || ''}</span>
            {props.showBattery && <span className="status-bar-battery">🔋</span>}
          </div>
        )

      case 'navBar':
        return (
          <div className="nav-bar" {...props}>
            {props.leftItems?.map((item: any, index: number) => (
              <button key={index} className="nav-bar-btn">
                {item.text || '←'}
              </button>
            ))}
            <div className="nav-bar-title">{props.title}</div>
            {props.rightItems?.map((item: any, index: number) => (
              <button key={index} className="nav-bar-btn">
                {item.text}
              </button>
            ))}
          </div>
        )

      case 'grid':
        return (
          <div className="grid" style={{ gridTemplateColumns: `repeat(${props.colCount}, 1fr)` }}>
            {items?.map((item: any, index: number) => (
              <div key={index} className="grid-item">
                {item.icon && <div className="grid-icon">{item.icon}</div>}
                <div className="grid-text">{item.text}</div>
              </div>
            ))}
          </div>
        )

      case 'card':
        return (
          <div className="card" {...props}>
            {props.title && <div className="card-title">{props.title}</div>}
            {props.subtitle && <div className="card-subtitle">{props.subtitle}</div>}
            {children?.map((child, index) => (
              <React.Fragment key={index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        )

      case 'carousel':
        return (
          <div className="carousel" {...props}>
            {items?.map((item: any, index: number) => (
              <div key={index} className="carousel-item">
                <div className="carousel-title">{item.title}</div>
                <div className="carousel-subtitle">{item.subtitle}</div>
              </div>
            ))}
          </div>
        )

      case 'list':
        return (
          <div className="list">
            {items?.map((item: any, index: number) => (
              <div key={index} className="list-item">
                {item.icon && <div className="list-icon">{item.icon}</div>}
                <div className="list-content">
                  <div className="list-title">{item.title}</div>
                  {item.subtitle && <div className="list-subtitle">{item.subtitle}</div>}
                </div>
                {item.accessory === 'arrow' && <div className="list-arrow">›</div>}
              </div>
            ))}
          </div>
        )

      case 'text':
        return <div className="text" {...props}>{props.content}</div>

      default:
        return <div {...props}>{children?.map((child, index) => (
          <React.Fragment key={index}>{renderComponent(child)}</React.Fragment>
        ))}</div>
    }
  }

  return <>{renderComponent(tree)}</>
}

function getCurrentTime(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

export default ComponentRenderer
