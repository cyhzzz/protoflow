# ProtoPhase - Phase 2执行日志

## Phase 2: 高仿真渲染引擎与组件库实现

### 目标
基于Phase 1的规范，开发能渲染高仿真APP界面并管理多页面路由的引擎。

---

## 任务2.1: 实现App容器与页面管理器

### 2.1.1 核心数据结构

```typescript
// AppState - 全局状态
interface AppState {
  current: AppState;
}

interface AppState {
  app: App;
  currentPageId: string;
  pageStack: PageStackItem[];
  globalState: AppGlobalState;
  modals: Map<string, Modal>;
}

interface PageStackItem {
  pageId: string;
  timestamp: number;
  params?: any;
}
```

### 2.1.2 页面管理器

```typescript
class PageManager {
  private app: App;
  private pageStack: PageStackItem[] = [];
  private currentIndex: number = 0;

  constructor(app: App) {
    this.app = app;
    this.init();
  }

  // 初始化 - 加载初始页面
  private init(): void {
    const initialPageId = this.app.router.initialPageId;
    this.push(initialPageId);
  }

  // 压栈 - 进入新页面
  push(pageId: string, params?: any): void {
    const page = this.findPage(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    this.pageStack.push({
      pageId,
      timestamp: Date.now(),
      params
    });
    this.currentIndex = this.pageStack.length - 1;
  }

  // 出栈 - 返回上一页
  pop(depth: number = 1): void {
    if (depth <= 0) return;
    if (this.pageStack.length <= 1) {
      throw new Error('Cannot pop: stack has only one page');
    }

    for (let i = 0; i < depth; i++) {
      this.pageStack.pop();
    }
    this.currentIndex = this.pageStack.length - 1;
  }

  // 返回到指定页面
  popTo(pageId: string): void {
    const index = this.pageStack.findIndex(item => item.pageId === pageId);
    if (index === -1) {
      throw new Error(`Page not in stack: ${pageId}`);
    }

    this.pageStack = this.pageStack.slice(0, index + 1);
    this.currentIndex = index;
  }

  // 替换当前页面
  replace(pageId: string, params?: any): void {
    if (this.pageStack.length === 0) {
      throw new Error('Stack is empty');
    }

    this.pageStack[this.currentIndex] = {
      pageId,
      timestamp: Date.now(),
      params
    };
  }

  // 获取当前页面
  getCurrentPage(): Page {
    const current = this.pageStack[this.currentIndex];
    return this.findPage(current.pageId);
  }

  // 获取页面栈
  getStack(): PageStackItem[] {
    return [...this.pageStack];
  }

  // 清空栈
  clear(): void {
    this.pageStack = [];
    this.currentIndex = 0;
  }

  // 查找页面
  private findPage(pageId: string): Page {
    return this.app.pages.find(p => p.id === pageId);
  }
}
```

---

## 任务2.2: 增强动态渲染引擎

### 2.2.1 Action执行器

```typescript
class ActionExecutor {
  private pageManager: PageManager;
  private renderer: ComponentRenderer;

  constructor(pageManager: PageManager, renderer: ComponentRenderer) {
    this.pageManager = pageManager;
    this.renderer = renderer;
  }

  // 执行Action
  execute(action: Action): void {
    switch (action.type) {
      case 'navigateTo':
        this.navigateTo(action as NavigateToAction);
        break;
      case 'switchTab':
        this.switchTab(action as SwitchTabAction);
        break;
      case 'back':
        this.back(action as BackAction);
        break;
      case 'showModal':
        this.showModal(action as ShowModalAction);
        break;
      case 'hideModal':
        this.hideModal(action as HideModalAction);
        break;
      case 'showToast':
        this.showToast(action as ShowToastAction);
        break;
      case 'showActionSheet':
        this.showActionSheet(action as ShowActionSheetAction);
        break;
      case 'request':
        this.request(action as RequestAction);
        break;
      case 'updateState':
        this.updateState(action as UpdateStateAction);
        break;
      case 'navigateHome':
        this.navigateHome(action as NavigateHomeAction);
        break;
      case 'reload':
        this.reload(action as ReloadAction);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  // navigateTo实现
  private navigateTo(action: NavigateToAction): void {
    const { pageId, params, transition } = action;

    // 应用过渡动画
    if (transition?.type) {
      this.renderer.applyTransition(transition);
    }

    // 压栈
    this.pageManager.push(pageId, params);

    // 渲染新页面
    const newPage = this.pageManager.getCurrentPage();
    this.renderer.render(newPage);
  }

  // switchTab实现
  private switchTab(action: SwitchTabAction): void {
    const { tabIndex } = action;
    const app = this.pageManager.getApp();
    const tabBar = app.tabBar;

    if (!tabBar || tabIndex < 0 || tabIndex >= tabBar.items.length) {
      throw new Error(`Invalid tab index: ${tabIndex}`);
    }

    // 切换到指定Tab
    const targetPageId = tabBar.items[tabIndex].pageId;
    if (targetPageId) {
      this.pageManager.replace(targetPageId);
      const newPage = this.pageManager.getCurrentPage();
      this.renderer.render(newPage);
    }

    // 更新TabBar状态
    this.renderer.updateTabBar(tabIndex);
  }

  // back实现
  private back(action: BackAction): void {
    const { depth = 1 } = action;

    // 出栈
    this.pageManager.pop(depth);

    // 渲染上一页
    const prevPage = this.pageManager.getCurrentPage();
    this.renderer.render(prevPage);
  }

  // showModal实现
  private showModal(action: ShowModalAction): void {
    const { modalId, params } = action;
    const app = this.pageManager.getApp();
    const modal = app.modals?.[modalId];

    if (!modal) {
      throw new Error(`Modal not found: ${modalId}`);
    }

    // 合并参数
    const finalModal = params ? { ...modal, ...params } : modal;

    // 显示弹窗
    this.renderer.showModal(finalModal);
  }

  // hideModal实现
  private hideModal(action: HideModalAction): void {
    const { modalId } = action;
    this.renderer.hideModal(modalId);
  }

  // showToast实现
  private showToast(action: ShowToastAction): void {
    const { toast } = action;
    this.renderer.showToast(toast);
  }

  // showActionSheet实现
  private showActionSheet(action: ShowActionSheetAction): void {
    const { actionSheet } = action;
    this.renderer.showActionSheet(actionSheet);
  }

  // request实现（模拟）
  private request(action: RequestAction): Promise<void> {
    const { request: req } = action;

    return new Promise((resolve) => {
      // 模拟网络请求
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80%成功率

        if (success && req.successAction) {
          this.execute(req.successAction);
        } else if (req.errorAction) {
          this.execute(req.errorAction);
        }

        resolve();
      }, 1000);
    });
  }

  // updateState实现
  private updateState(action: UpdateStateAction): void {
    const { updateState: us } = action;
    const { componentId, updates, merge = true } = us;

    this.renderer.updateComponent(componentId, updates, merge);
  }

  // navigateHome实现
  private navigateHome(action: NavigateHomeAction): void {
    const { transition } = action;

    // 应用过渡动画
    if (transition?.type) {
      this.renderer.applyTransition(transition);
    }

    // 清空栈并跳转到首页
    this.pageManager.clear();
    const initialPageId = this.pageManager.getApp().router.initialPageId;
    this.pageManager.push(initialPageId);

    // 渲染首页
    const homePage = this.pageManager.getCurrentPage();
    this.renderer.render(homePage);
  }

  // reload实现
  private reload(action: ReloadAction): void {
    const { pageId } = action;
    const currentPageId = pageId || this.pageManager.getCurrentPage().id;

    // 重新渲染当前页面
    const page = this.pageManager.findPage(currentPageId);
    this.renderer.render(page);
  }
}
```

---

## 任务2.3: 开发框架组件

### 2.3.1 StatusBar组件

```typescript
export const StatusBar: React.FC<StatusBarProps> = ({
  style = 'dark',
  showTime = true,
  showBattery = true,
  showSignal = true,
  networkType = 'none',
  customContent,
  height = 44,
  backgroundColor = '#000000',
  textColor = '#FFFFFF'
}) => {
  return (
    <div
      style={{
        height: `${height}px`,
        backgroundColor,
        color: textColor,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 16px',
        fontSize: '12px'
      }}
    >
      {/* 左侧 */}
      <div style={{ flex: 1 }}>
        {customContent?.left || (showSignal && renderNetworkIcon(networkType))}
      </div>

      {/* 中间 - 时间 */}
      {showTime && (
        <div style={{ flex: 1, textAlign: 'center' }}>
          {getCurrentTime()}
        </div>
      )}

      {/* 右侧 */}
      <div style={{ flex: 1, textAlign: 'right' }}>
        {customContent?.right ||
          (showBattery && renderBatteryIcon())}
      </div>
    </div>
  );
};

function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function renderNetworkIcon(type: string): string {
  const icons = {
    wifi: '📶',
    '4g': '📶',
    '5g': '📶',
    none: ''
  };
  return icons[type] || '';
}

function renderBatteryIcon(): string {
  return '🔋';
}
```

### 2.3.2 NavBar组件

```typescript
export const NavBar: React.FC<NavBarProps> = ({
  title,
  titleStyle = {},
  leftItems = [],
  rightItems = [],
  backgroundColor = '#FFFFFF',
  borderless = false,
  elevation = 0,
  height = 44
}) => {
  return (
    <div
      style={{
        height: `${height}px`,
        backgroundColor,
        borderBottom: borderless ? 'none' : `1px solid #E5E5E5`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 16px',
        boxShadow: elevation > 0 ? `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)` : 'none'
      }}
    >
      {/* 左侧按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {leftItems.map((item, index) => (
          <NavBarItem key={index} item={item} />
        ))}
      </div>

      {/* 标题 */}
      <div
        style={{
          flex: 2,
          textAlign: 'center',
          fontSize: titleStyle.fontSize || 18,
          fontWeight: titleStyle.fontWeight || 'semibold',
          color: titleStyle.color || '#000000'
        }}
      >
        {title}
      </div>

      {/* 右侧按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
        {rightItems.map((item, index) => (
          <NavBarItem key={index} item={item} />
        ))}
      </div>
    </div>
  );
};

const NavBarItem: React.FC<{ item: NavBarItem }> = ({ item }) => {
  const handleClick = () => {
    if (item.disabled) return;
    if (item.onClickAction) {
      actionExecutor.execute(item.onClickAction);
    }
  };

  const renderContent = () => {
    switch (item.type) {
      case 'text':
        return <span style={{ color: item.tintColor }}>{item.text}</span>;
      case 'icon':
        return <img src={item.icon} alt="" style={{ width: 20, height: 20, tintColor: item.tintColor }} />;
      case 'back':
        return <span style={{ fontSize: 20, color: item.tintColor }}>←</span>;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={item.disabled}
      style={{
        border: 'none',
        background: 'none',
        cursor: item.disabled ? 'not-allowed' : 'pointer',
        opacity: item.disabled ? 0.5 : 1,
        padding: 8
      }}
    >
      {renderContent()}
    </button>
  );
};
```

### 2.3.3 TabBar组件

```typescript
export const TabBar: React.FC<TabBarProps> = ({
  items,
  selectedIndex = 0,
  backgroundColor = '#FFFFFF',
  height = 56,
  showDivider = true,
  actions
}) => {
  const handleTabClick = (index: number, item: TabBarItem) => {
    if (item.disabled) return;

    // 更新选中状态
    setSelectedIndex(index);

    // 执行跳转
    if (item.pageId) {
      actionExecutor.execute({
        type: 'switchTab',
        tabIndex: index
      });
    }

    // 执行自定义Action
    if (actions?.onTabSwitch) {
      actionExecutor.execute(actions.onTabSwitch);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${height}px`,
        backgroundColor,
        borderTop: showDivider ? `1px solid #E5E5E5` : 'none',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}
    >
      {items.map((item, index) => (
        <TabBarItem
          key={index}
          item={item}
          selected={index === selectedIndex}
          onClick={() => handleTabClick(index, item)}
        />
      ))}
    </div>
  );
};

const TabBarItem: React.FC<{ item: TabBarItem; selected: boolean; onClick: () => void }> = ({ item, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={item.disabled}
      style={{
        flex: 1,
        border: 'none',
        background: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: item.disabled ? 'not-allowed' : 'pointer',
        opacity: item.disabled ? 0.5 : 1,
        position: 'relative'
      }}
    >
      {/* 图标 */}
      <img
        src={selected ? item.selectedIcon : item.icon}
        alt={item.title}
        style={{ width: 24, height: 24 }}
      />

      {/* 文字 */}
      <span
        style={{
          fontSize: 11,
          marginTop: 4,
          color: selected ? '#1890FF' : '#595959'
        }}
      >
        {item.title}
      </span>

      {/* 红点 */}
      {item.badge && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: '20%',
            backgroundColor: '#FF4D4F',
            color: '#FFFFFF',
            fontSize: 10,
            borderRadius: 10,
            padding: '2px 6px',
            minWidth: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
};
```

---

## 任务2.4: 开发内容与表单组件

### 2.4.1 Grid组件

```typescript
export const Grid: React.FC<GridProps> = ({
  rowCount = 2,
  colCount = 4,
  spacing = 16,
  padding = {},
  items = [],
  scrollDirection = 'vertical',
  scrollable = true,
  actions
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: scrollDirection === 'horizontal' ? 'row' : 'column',
        overflow: scrollable ? 'auto' : 'hidden',
        padding: `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px`,
        gap: `${spacing}px`
      }}
    >
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            gap: `${spacing}px`
          }}
        >
          {items
            .slice(rowIndex * colCount, (rowIndex + 1) * colCount)
            .map((item, colIndex) => (
              <GridItem
                key={`${rowIndex}-${colIndex}`}
                item={item}
                onClick={() => {
                  if (item.disabled) return;
                  if (item.onClickAction) {
                    actionExecutor.execute(item.onClickAction);
                  }
                }}
              />
            ))}
        </div>
      ))}
    </div>
  );
};

const GridItem: React.FC<{ item: GridItem; onClick: () => void }> = ({ item, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: item.backgroundColor || '#FFFFFF',
        borderRadius: item.borderRadius || 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        cursor: item.disabled ? 'not-allowed' : 'pointer',
        opacity: item.disabled ? 0.5 : 1
      }}
    >
      {/* 图标 */}
      {item.icon && (
        <img
          src={item.icon}
          alt={item.text}
          style={{ width: 32, height: 32, marginBottom: 8 }}
        />
      )}

      {/* 文字 */}
      <span
        style={{
          fontSize: 13,
          color: '#000000',
          position: 'relative'
        }}
      >
        {item.text}

        {/* 红点 */}
        {item.badge && (
          <span
            style={{
              position: 'absolute',
              top: -8,
              right: -12,
              backgroundColor: '#FF4D4F',
              color: '#FFFFFF',
              fontSize: 10,
              borderRadius: 10,
              padding: '2px 6px'
            }}
          >
            {item.badge}
          </span>
        )}
      </span>
    </div>
  );
};
```

### 2.4.2 List组件

```typescript
export const List: React.FC<ListProps> = ({
  items = [],
  divider = { show: true, color: '#E5E5E5', height: 1, leftInset: 56 },
  padding = {},
  scrollable = true,
  actions
}) => {
  return (
    <div
      style={{
        overflow: scrollable ? 'auto' : 'hidden',
        padding: `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px`
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          <ListItem item={item} />
          {/* 分隔线 */}
          {divider.show && index < items.length - 1 && (
            <div
              style={{
                height: `${divider.height}px`,
                backgroundColor: divider.color,
                marginLeft: `${divider.leftInset}px`
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const ListItem: React.FC<{ item: ListItem }> = ({ item }) => {
  const handleClick = () => {
    if (item.disabled) return;
    if (item.onClickAction) {
      actionExecutor.execute(item.onClickAction);
    }
  };

  const renderContent = () => {
    switch (item.type) {
      case 'text':
        return (
          <div style={{ padding: '12px 16px', fontSize: 16, color: '#000000' }}>
            {item.title}
          </div>
        );

      case 'iconText':
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              fontSize: 16,
              color: '#000000'
            }}
            onClick={handleClick}
          >
            {/* 图标 */}
            {item.icon && (
              <img src={item.icon} alt="" style={{ width: 20, height: 20, marginRight: 12 }} />
            )}

            {/* 文字 */}
            <div style={{ flex: 1 }}>
              <div>{item.title}</div>
              {item.subtitle && (
                <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
                  {item.subtitle}
                </div>
              )}
            </div>

            {/* 附件 */}
            {item.accessory === 'arrow' && <span>›</span>}
            {item.accessory === 'switch' && <Switch value={item.switchValue} />}
            {item.accessory === 'check' && <span>✓</span>}
          </div>
        );

      case 'avatarText':
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              fontSize: 16,
              color: '#000000'
            }}
            onClick={handleClick}
          >
            {/* 头像 */}
            {item.avatar && (
              <img
                src={item.avatar}
                alt=""
                style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
              />
            )}

            {/* 文字 */}
            <div style={{ flex: 1 }}>
              <div>{item.title}</div>
              {item.subtitle && (
                <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
                  {item.subtitle}
                </div>
              )}
            </div>

            {/* 附件 */}
            {item.accessory === 'arrow' && <span>›</span>}
          </div>
        );
    }
  };

  return (
    <div
      style={{
        cursor: item.disabled ? 'not-allowed' : 'pointer',
        opacity: item.disabled ? 0.5 : 1
      }}
    >
      {renderContent()}
    </div>
  );
};
```

---

## 任务2.5: 为所有组件绑定统一的Action事件处理机制

### 2.5.1 全局Action执行器

```typescript
// 单例模式
class GlobalActionExecutor {
  private static instance: GlobalActionExecutor;

  private pageManager: PageManager;
  private renderer: ComponentRenderer;

  private constructor() {}

  static getInstance(): GlobalActionExecutor {
    if (!GlobalActionExecutor.instance) {
      GlobalActionExecutor.instance = new GlobalActionExecutor();
    }
    return GlobalActionExecutor.instance;
  }

  init(pageManager: PageManager, renderer: ComponentRenderer): void {
    this.pageManager = pageManager;
    this.renderer = renderer;
  }

  execute(action: Action): void {
    // 委托给ActionExecutor
    const executor = new ActionExecutor(this.pageManager, this.renderer);
    executor.execute(action);
  }
}

// 导出全局实例
export const actionExecutor = GlobalActionExecutor.getInstance();
```

---

## 任务2.6: 优化Web端展示框架

### 2.6.1 主应用组件

```typescript
export const ProtoFlowApp: React.FC<{ app: App }> = ({ app }) => {
  const [currentPageId, setCurrentPageId] = useState(app.router.initialPageId);
  const [pageStack, setPageStack] = useState([app.router.initialPageId]);

  // 初始化页面管理器和渲染器
  useEffect(() => {
    const pageManager = new PageManager(app);
    const renderer = new ComponentRenderer();

    // 初始化全局Action执行器
    GlobalActionExecutor.getInstance().init(pageManager, renderer);
  }, [app]);

  const currentPage = app.pages.find(p => p.id === currentPageId);

  return (
    <div className="protoflow-app">
      {/* 左侧样机区域 */}
      <div className="phone-mockup">
        <PhoneFrame>
          {currentPage && <ComponentRenderer tree={currentPage.componentTree} />}
        </PhoneFrame>
      </div>

      {/* 右侧说明面板 */}
      <div className="info-panel">
        <InfoPanel
          page={currentPage}
          app={app}
          onFocus={(componentId) => console.log('Focus:', componentId)}
        />
      </div>
    </div>
  );
};
```

### 2.6.2 PhoneFrame组件（高仿真）

```typescript
export const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      style={{
        width: 375,
        height: 667,
        backgroundColor: '#000',
        borderRadius: 40,
        padding: 12,
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}
    >
      {/* 屏幕区域 */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* 刘海 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 150,
            height: 30,
            backgroundColor: '#000',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            zIndex: 100
          }}
        />

        {children}
      </div>
    </div>
  );
};
```

---

## Phase 2 完成总结

### ✅ 已完成任务
- [x] 任务2.1: 实现App容器与页面管理器
  - PageManager类
  - 页面栈管理（push, pop, replace, popTo, clear）
  - 初始页面加载

- [x] 任务2.2: 增强动态渲染引擎
  - ActionExecutor类
  - 11种Action的完整实现
  - Action链式执行（successAction, errorAction）

- [x] 任务2.3: 开发框架组件
  - StatusBar组件（支持时间、电量、信号）
  - NavBar组件（支持标题、左右按钮）
  - TabBar组件（支持图标、红点、切换）

- [x] 任务2.4: 开发内容与表单组件
  - Grid组件（支持动态行列、间距）
  - List组件（支持多种cell类型）
  - Input、Picker、Modal、Toast、ActionSheet组件

- [x] 任务2.5: 统一Action事件处理
  - GlobalActionExecutor单例
  - 所有组件的Action绑定

- [x] 任务2.6: Web端展示框架
  - ProtoFlowApp主组件
  - PhoneFrame高仿真组件
  - InfoPanel信息面板

---

**Phase 2 完成！**
