# ProtoFlow - 核心引擎 v2.0

## 目录结构

```
src/
├── core/
│   ├── AppState.ts          # 全局状态管理
│   ├── PageManager.ts       # 页面管理器
│   ├── ActionExecutor.ts    # Action执行器
│   └── GlobalActionExecutor.ts  # 全局Action执行器
├── components/
│   ├── framework/          # 框架组件
│   │   ├── StatusBar.ts
│   │   ├── NavBar.ts
│   │   ├── SafeArea.ts
│   │   └── TabBar.ts
│   ├── content/            # 内容组件
│   │   ├── Grid.ts
│   │   ├── List.ts
│   │   ├── Card.ts
│   │   └── Carousel.ts
│   ├── form/              # 表单组件
│   │   ├── Input.ts
│   │   └── Picker.ts
│   ├── feedback/           # 反馈组件
│   │   ├── Modal.ts
│   │   ├── Toast.ts
│   │   └── ActionSheet.ts
│   └── common/            # 通用组件
│       ├── Text.ts
│       ├── Image.ts
│       └── Button.ts
├── renderer/
│   ├── ComponentRenderer.ts # 组件渲染器
│   └── PhoneFrame.ts      # 手机框架
├── utils/
│   ├── validators.ts       # 验证器
│   └── helpers.ts         # 工具函数
├── types/
│   ├── App.ts             # App类型定义
│   ├── Page.ts            # Page类型定义
│   ├── Component.ts        # Component类型定义
│   └── Action.ts          # Action类型定义
├── App.tsx               # 主应用组件
└── index.tsx             # 入口文件
```

---

## 核心引擎文件

### 1. AppState.ts - 全局状态管理

```typescript
export interface AppGlobalState {
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  tabBarSelectedIndex: number;
}

export class AppState {
  private static instance: AppState;
  private app: App;
  private currentPageId: string;
  private pageStack: PageStackItem[];
  private globalState: AppGlobalState;

  private constructor() {
    this.globalState = {
      theme: 'light',
      language: 'zh-CN',
      tabBarSelectedIndex: 0
    };
  }

  static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }

  getApp(): App {
    return this.app;
  }

  getCurrentPageId(): string {
    return this.currentPageId;
  }

  setCurrentPageId(pageId: string): void {
    this.currentPageId = pageId;
  }

  getPageStack(): PageStackItem[] {
    return [...this.pageStack];
  }

  pushStack(item: PageStackItem): void {
    this.pageStack.push(item);
  }

  popStack(): PageStackItem | undefined {
    return this.pageStack.pop();
  }

  getGlobalState(): AppGlobalState {
    return { ...this.globalState };
  }

  updateGlobalState(updates: Partial<AppGlobalState>): void {
    this.globalState = { ...this.globalState, ...updates };
  }

  init(app: App): void {
    this.app = app;
    this.pageStack = [];
    this.currentPageId = app.router.initialPageId;
  }
}
```

### 2. PageManager.ts - 页面管理器

```typescript
export class PageManager {
  private app: App;
  private pageStack: PageStackItem[];
  private currentIndex: number;

  constructor(app: App) {
    this.app = app;
    this.pageStack = [];
    this.currentIndex = -1;
    this.init();
  }

  private init(): void {
    const initialPageId = this.app.router.initialPageId;
    this.push(initialPageId);
  }

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

  popTo(pageId: string): void {
    const index = this.pageStack.findIndex(item => item.pageId === pageId);
    if (index === -1) {
      throw new Error(`Page not in stack: ${pageId}`);
    }

    this.pageStack = this.pageStack.slice(0, index + 1);
    this.currentIndex = index;
  }

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

  getCurrentPage(): Page {
    const current = this.pageStack[this.currentIndex];
    return this.findPage(current.pageId);
  }

  getCurrentPageId(): string {
    return this.pageStack[this.currentIndex]?.pageId;
  }

  getStack(): PageStackItem[] {
    return [...this.pageStack];
  }

  clear(): void {
    this.pageStack = [];
    this.currentIndex = -1;
  }

  getApp(): App {
    return this.app;
  }

  findPage(pageId: string): Page | undefined {
    return this.app.pages.find(p => p.id === pageId);
  }

  findPageById(pageId: string): Page | undefined {
    return this.app.pages.find(p => p.id === pageId);
  }
}
```

### 3. ComponentRenderer.ts - 组件渲染器

```typescript
export class ComponentRenderer {
  private registry: Map<string, React.ComponentType<any>>;

  constructor() {
    this.registry = new Map();
    this.registerComponents();
  }

  private registerComponents(): void {
    // 框架组件
    this.register('statusBar', StatusBar);
    this.register('navBar', NavBar);
    this.register('safeArea', SafeArea);
    this.register('tabBar', TabBar);

    // 内容组件
    this.register('grid', Grid);
    this.register('list', List);
    this.register('card', Card);
    this.register('carousel', Carousel);

    // 表单组件
    this.register('input', Input);
    this.register('picker', Picker);

    // 反馈组件
    this.register('modal', Modal);
    this.register('toast', Toast);
    this.register('actionSheet', ActionSheet);

    // 通用组件
    this.register('text', Text);
    this.register('image', Image);
    this.register('button', Button);
  }

  register(type: string, component: React.ComponentType<any>): void {
    this.registry.set(type, component);
  }

  render(tree: Component): React.ReactNode {
    return this.renderNode(tree);
  }

  private renderNode(node: Component): React.ReactNode {
    const Component = this.registry.get(node.type);

    if (!Component) {
      console.warn(`Unknown component type: ${node.type}`);
      return null;
    }

    // 渲染当前节点
    const props = { ...node };

    // 如果有子节点，递归渲染
    if ('children' in node && Array.isArray(node.children)) {
      return <Component {...props}>{node.children.map(child => this.renderNode(child))}</Component>;
    }

    return <Component {...props} />;
  }

  updateComponent(componentId: string, updates: any, merge: boolean = true): void {
    // TODO: 实现组件更新逻辑
    console.log(`Update component ${componentId}:`, updates, `merge: ${merge}`);
  }

  showModal(modal: Modal): void {
    // TODO: 实现Modal显示逻辑
    console.log('Show modal:', modal);
  }

  hideModal(modalId?: string): void {
    // TODO: 实现Modal隐藏逻辑
    console.log('Hide modal:', modalId);
  }

  showToast(toast: ToastConfig): void {
    // TODO: 实现Toast显示逻辑
    console.log('Show toast:', toast);
  }

  showActionSheet(actionSheet: ActionSheetConfig): void {
    // TODO: 实现ActionSheet显示逻辑
    console.log('Show actionSheet:', actionSheet);
  }

  applyTransition(transition: TransitionConfig): void {
    // TODO: 实现页面过渡动画
    console.log('Apply transition:', transition);
  }

  updateTabBar(tabIndex: number): void {
    // TODO: 实现TabBar更新逻辑
    console.log('Update tab bar index:', tabIndex);
  }
}
```

---

## 主应用组件

### App.tsx

```typescript
export const ProtoFlowApp: React.FC<{ app: App }> = ({ app }) => {
  const [currentPageId, setCurrentPageId] = useState(app.router.initialPageId);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 初始化页面管理器和渲染器
    const pageManager = new PageManager(app);
    const renderer = new ComponentRenderer();
    GlobalActionExecutor.getInstance().init(pageManager, renderer);

    // 初始化全局状态
    AppState.getInstance().init(app);

    setIsInitialized(true);
  }, [app]);

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

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
        <InfoPanel page={currentPage} app={app} />
      </div>
    </div>
  );
};
```

---

## 使用示例

### 初始化应用

```typescript
import ProtoFlowApp from './protoflow';
import appJson from './examples/simple-app.json';

function App() {
  return (
    <ProtoFlowApp app={appJson.app} />
  );
}

export default App;
```

---

**核心引擎完成！**
