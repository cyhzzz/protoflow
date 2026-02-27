import React, { memo, useCallback, useMemo } from 'react'
import type { Component, Action, GridItem, ListItem, CarouselItem } from '../types'
import { GlobalActionExecutor } from '../core/GlobalActionExecutor'

interface ComponentRendererProps {
  tree: Component
  onAction?: (action: Action) => void
}

// 安全渲染文本，防止 XSS
const SafeText: React.FC<{ content?: unknown; className?: string }> = memo(({ content, className }) => {
  if (content == null) return null
  const text = String(content)
  return <span className={className}>{text}</span>
})
SafeText.displayName = 'SafeText'

// 安全渲染 HTML 属性
const sanitizeAttr = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  return value.replace(/[<>"'&]/g, char => {
    const escapeMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    }
    return escapeMap[char] || char
  })
}

// 辅助函数：安全获取字符串属性
const str = (val: unknown): string => val == null ? '' : String(val)

// 辅助函数：安全获取数字属性
const num = (val: unknown): number | undefined => typeof val === 'number' ? val : undefined

// 辅助函数：安全获取布尔属性
const bool = (val: unknown): boolean => !!val

// 辅助组件：条件渲染
const If: React.FC<{ condition: unknown; children: React.ReactNode }> = ({ condition, children }) => {
  return condition ? <>{children}</> : null
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({ tree, onAction }) => {
  const executor = useMemo(() => GlobalActionExecutor.getInstance(), [])

  // 处理 Action
  const handleAction = useCallback((action: Action | undefined) => {
    if (!action) return
    if (onAction) {
      onAction(action)
    } else {
      executor.execute(action)
    }
  }, [executor, onAction])

  const renderComponent = useCallback((node: Component): React.ReactNode => {
    const { type, children, items, actions, id, hidden, disabled, style, className: nodeClassName, ...props } = node

    // 隐藏组件
    if (hidden) return null

    // 样式处理
    const nodeStyle: React.CSSProperties = typeof style === 'object' && style !== null ? style as React.CSSProperties : {}

    // 通用属性
    const commonProps = {
      'data-id': id,
      'data-disabled': disabled,
      style: nodeStyle
    }

    switch (type) {
      case 'safeArea':
        return (
          <div className={`safe-area ${nodeClassName || ''}`} {...commonProps}>
            {children?.map((child, index) => (
              <React.Fragment key={child.id || index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        )

      case 'statusBar':
        return (
          <div className={`status-bar ${nodeClassName || ''}`} {...commonProps}>
            <span className="status-bar-time">
              <If condition={props.showTime !== false}>
                <CurrentTime />
              </If>
            </span>
            <span className="status-bar-network">{sanitizeAttr(props.networkType)}</span>
            <If condition={props.showBattery}>
              <span className="status-bar-battery">🔋</span>
            </If>
            <If condition={props.showSignal}>
              <span className="status-bar-signal">📶</span>
            </If>
          </div>
        )

      case 'navBar':
        const leftItems = Array.isArray(props.leftItems) ? props.leftItems : []
        const rightItems = Array.isArray(props.rightItems) ? props.rightItems : []
        return (
          <div className={`nav-bar ${nodeClassName || ''}`} {...commonProps}>
            <div className="nav-bar-left">
              {leftItems.map((item: Record<string, unknown>, index: number) => (
                <button
                  key={str(item.id) || index}
                  className={`nav-bar-btn ${item.disabled ? 'disabled' : ''}`}
                  onClick={() => handleAction((item.action || item.onClickAction) as Action)}
                  disabled={!!item.disabled}
                >
                  <If condition={item.icon}>
                    <span className="nav-bar-icon">{str(item.icon)}</span>
                  </If>
                  {str(item.text) || (index === 0 ? '←' : '')}
                </button>
              ))}
            </div>
            <div className="nav-bar-title">
              <SafeText content={props.title} />
            </div>
            <div className="nav-bar-right">
              {rightItems.map((item: Record<string, unknown>, index: number) => (
                <button
                  key={str(item.id) || index}
                  className={`nav-bar-btn ${item.disabled ? 'disabled' : ''}`}
                  onClick={() => handleAction((item.action || item.onClickAction) as Action)}
                  disabled={!!item.disabled}
                >
                  <If condition={item.icon}>
                    <span className="nav-bar-icon">{str(item.icon)}</span>
                  </If>
                  {str(item.text)}
                </button>
              ))}
            </div>
          </div>
        )

      case 'tabBar':
        return null

      case 'grid':
        const gridItems = Array.isArray(items) ? items as GridItem[] : []
        return (
          <div
            className={`grid ${nodeClassName || ''}`}
            style={{
              gridTemplateColumns: `repeat(${props.colCount || 4}, 1fr)`,
              ...nodeStyle
            }}
          >
            {gridItems.map((item, index) => (
              <div
                key={item.id || index}
                className="grid-item"
                onClick={() => handleAction(item.action || item.onClickAction)}
              >
                <If condition={item.icon}>
                  <div className="grid-icon">{item.icon as string}</div>
                </If>
                <SafeText content={item.text} className="grid-text" />
                <If condition={item.badge !== undefined}>
                  <span className="grid-badge">{item.badge as string | number}</span>
                </If>
              </div>
            ))}
          </div>
        )

      case 'card':
        return (
          <div className={`card ${nodeClassName || ''}`} {...commonProps}>
            <If condition={props.title}>
              <div className="card-title"><SafeText content={props.title} /></div>
            </If>
            <If condition={props.subtitle}>
              <div className="card-subtitle"><SafeText content={props.subtitle} /></div>
            </If>
            <If condition={props.image}>
              <div className="card-image" style={{ backgroundImage: `url(${sanitizeAttr(props.image)})` }} />
            </If>
            <div className="card-content">
              {children?.map((child, index) => (
                <React.Fragment key={child.id || index}>{renderComponent(child)}</React.Fragment>
              ))}
            </div>
            <If condition={props.footer}>
              <div className="card-footer"><SafeText content={props.footer} /></div>
            </If>
          </div>
        )

      case 'carousel':
        const carouselItems = Array.isArray(items) ? items as CarouselItem[] : []
        return (
          <div className={`carousel ${nodeClassName || ''}`} {...commonProps}>
            <CarouselContainer
              items={carouselItems}
              autoPlay={bool(props.autoPlay)}
              interval={num(props.interval)}
              onAction={handleAction}
            />
          </div>
        )

      case 'list':
        const listItems = Array.isArray(items) ? items as ListItem[] : []
        return (
          <div className={`list ${nodeClassName || ''}`} {...commonProps}>
            {listItems.map((item, index) => (
              <div
                key={item.id || index}
                className={`list-item ${item.action || item.onClickAction ? 'clickable' : ''}`}
                onClick={() => handleAction(item.action || item.onClickAction)}
              >
                <If condition={item.icon}>
                  <div className="list-icon">{item.icon as string}</div>
                </If>
                <If condition={item.image}>
                  <div className="list-image" style={{ backgroundImage: `url(${sanitizeAttr(item.image)})` }} />
                </If>
                <div className="list-content">
                  <div className="list-title"><SafeText content={item.title} /></div>
                  <If condition={item.subtitle}>
                    <div className="list-subtitle"><SafeText content={item.subtitle} /></div>
                  </If>
                  <If condition={item.desc}>
                    <div className="list-desc"><SafeText content={item.desc} /></div>
                  </If>
                </div>
                <If condition={item.badge !== undefined}>
                  <span className="list-badge">{item.badge as string | number}</span>
                </If>
                <If condition={item.accessory === 'arrow'}>
                  <div className="list-arrow">›</div>
                </If>
                <If condition={item.accessory === 'check'}>
                  <div className="list-check">✓</div>
                </If>
              </div>
            ))}
          </div>
        )

      case 'text':
        return (
          <div className={`text ${props.textType || ''} ${nodeClassName || ''}`} {...commonProps}>
            <SafeText content={props.content} />
          </div>
        )

      case 'image':
        return (
          <div className={`image-container ${nodeClassName || ''}`} {...commonProps}>
            <If condition={props.src}>
              <img
                src={sanitizeAttr(props.src)}
                alt={sanitizeAttr(props.alt) || ''}
                className="image"
                onClick={() => handleAction(actions?.onClick)}
              />
            </If>
            <If condition={!props.src}>
              <div className="image-placeholder">{str(props.placeholder) || '🖼️'}</div>
            </If>
          </div>
        )

      case 'avatar':
        const nameStr = str(props.name)
        return (
          <div
            className={`avatar ${props.size ? `avatar-${props.size}` : ''} ${nodeClassName || ''}`}
            {...commonProps}
            onClick={() => handleAction(actions?.onClick)}
          >
            <If condition={props.src}>
              <img src={sanitizeAttr(props.src)} alt="" className="avatar-image" />
            </If>
            <If condition={!props.src}>
              <div className="avatar-placeholder">{nameStr ? nameStr.charAt(0) : '?'}</div>
            </If>
            <If condition={props.badge !== undefined}>
              <span className="avatar-badge">{props.badge as React.ReactNode}</span>
            </If>
          </div>
        )

      case 'input':
        return (
          <div className={`input-container ${nodeClassName || ''}`} {...commonProps}>
            <If condition={props.label}>
              <label className="input-label"><SafeText content={props.label} /></label>
            </If>
            <input
              type={str(props.inputType) || 'text'}
              placeholder={str(props.placeholder)}
              maxLength={num(props.maxLength)}
              minLength={num(props.minLength)}
              pattern={str(props.pattern)}
              required={bool(props.required)}
              disabled={disabled}
              readOnly={bool(props.readonly)}
              value={str(props.value)}
              className="input"
              onChange={(e) => handleAction(actions?.onChange ? { ...actions.onChange, params: { value: e.target.value } } : undefined)}
              onFocus={() => handleAction(actions?.onFocus)}
              onBlur={() => handleAction(actions?.onBlur)}
            />
          </div>
        )

      case 'button':
        return (
          <button
            className={`button button-${props.buttonType || 'primary'} button-${props.size || 'medium'} ${props.block ? 'button-block' : ''} ${nodeClassName || ''}`}
            disabled={disabled || bool(props.loading)}
            onClick={() => handleAction(actions?.onClick)}
          >
            <If condition={props.loading}>
              <span className="button-loading">⏳</span>
            </If>
            <SafeText content={props.text} />
          </button>
        )

      case 'picker':
        const pickerRange = Array.isArray(props.range) ? props.range as string[] : []
        return (
          <div className={`picker-container ${nodeClassName || ''}`} {...commonProps}>
            <If condition={props.label}>
              <label className="picker-label"><SafeText content={props.label} /></label>
            </If>
            <select
              className="picker"
              value={str(props.value)}
              disabled={disabled}
              onChange={(e) => handleAction(actions?.onChange ? { ...actions.onChange, params: { value: e.target.value } } : undefined)}
            >
              <If condition={props.placeholder}>
                <option value="">{str(props.placeholder)}</option>
              </If>
              {pickerRange.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )

      case 'scrollView':
        return (
          <div
            className={`scroll-view ${nodeClassName || ''}`}
            style={{
              overflowY: props.scrollY !== false ? 'auto' : 'hidden',
              overflowX: props.scrollX === true ? 'auto' : 'hidden',
              ...nodeStyle
            }}
          >
            {children?.map((child, index) => (
              <React.Fragment key={child.id || index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        )

      case 'container':
      case 'view':
        return (
          <div
            className={`container ${nodeClassName || ''}`}
            {...commonProps}
            onClick={() => handleAction(actions?.onClick)}
          >
            {children?.map((child, index) => (
              <React.Fragment key={child.id || index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        )

      case 'divider':
        return <div className={`divider ${nodeClassName || ''}`} {...commonProps} />

      case 'spacer':
        return <div className={`spacer ${nodeClassName || ''}`} style={{ height: num(props.height) || 10, ...nodeStyle }} />

      default:
        console.warn(`[ComponentRenderer] Unknown component type: ${type}`)
        return (
          <div className={`unknown-component ${nodeClassName || ''}`} {...commonProps}>
            {children?.map((child, index) => (
              <React.Fragment key={child.id || index}>{renderComponent(child)}</React.Fragment>
            ))}
          </div>
        )
    }
  }, [handleAction])

  return <>{renderComponent(tree)}</>
}

// 当前时间组件
const CurrentTime: React.FC = memo(() => {
  const [time, setTime] = React.useState(getCurrentTime)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(getCurrentTime())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  return <>{time}</>
})
CurrentTime.displayName = 'CurrentTime'

// 轮播图容器组件
interface CarouselContainerProps {
  items: CarouselItem[]
  autoPlay?: boolean
  interval?: number
  onAction: (action: Action | undefined) => void
}

const CarouselContainer: React.FC<CarouselContainerProps> = memo(({ items, autoPlay, interval = 3000, onAction }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0)

  React.useEffect(() => {
    if (!autoPlay || items.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length)
    }, interval)
    return () => clearInterval(timer)
  }, [autoPlay, items.length, interval])

  if (!items.length) return null

  return (
    <div className="carousel-wrapper">
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="carousel-item"
            onClick={() => onAction(item.action || item.onClickAction)}
          >
            <If condition={item.image}>
              <div className="carousel-image" style={{ backgroundImage: `url(${sanitizeAttr(item.image)})` }} />
            </If>
            <If condition={item.title}>
              <div className="carousel-title"><SafeText content={item.title} /></div>
            </If>
            <If condition={item.subtitle}>
              <div className="carousel-subtitle"><SafeText content={item.subtitle} /></div>
            </If>
          </div>
        ))}
      </div>
      <If condition={items.length > 1}>
        <div className="carousel-dots">
          {items.map((item, index) => (
            <span
              key={item.id || index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </If>
    </div>
  )
})
CarouselContainer.displayName = 'CarouselContainer'

function getCurrentTime(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

export default memo(ComponentRenderer)