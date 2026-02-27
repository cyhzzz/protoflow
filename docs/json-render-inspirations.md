# ProtoFlow 改进方案 - 基于 json-render 的灵感

## 📊 当前状态

ProtoFlow已经实现了类似json-render的核心架构：
- ✅ JSON Schema定义页面结构
- ✅ 组件渲染引擎（React实现）
- ✅ 页面路由和导航
- ✅ Action执行系统（11种Action类型）
- ✅ 多项目支持

## 🎯 改进方向

### 1. **完善Catalog和Registry架构**

#### 当前实现
```javascript
// app.js - 硬编码的项目配置
loadProjects() {
  return {
    'smart-customer-service': {
      pages: { ... },
      render: () => this.renderSmartCustomerServiceHome()
    }
  }
}
```

#### 改进方案（借鉴json-render）
```typescript
// types/catalog.ts - 定义组件Catalog
export interface ComponentCatalog {
  components: {
    [componentName: string]: ComponentDefinition;
  };
  actions: {
    [actionName: string]: ActionDefinition;
  };
}

export interface ComponentDefinition {
  props: z.ZodSchema; // 使用zod进行类型验证
  description: string;
  category: 'layout' | 'content' | 'form' | 'feedback' | 'navigation';
}

// core/CatalogManager.ts - Catalog管理器
export class CatalogManager {
  private catalog: ComponentCatalog;

  defineComponent(name: string, definition: ComponentDefinition) {
    this.catalog.components[name] = definition;
  }

  defineAction(name: string, definition: ActionDefinition) {
    this.catalog.actions[name] = definition;
  }

  // 生成AI提示词（借鉴json-render）
  generatePrompt(): string {
    let prompt = 'Available components:\n';
    for (const [name, def] of Object.entries(this.catalog.components)) {
      prompt += `- ${name}: ${def.description}\n`;
    }
    return prompt;
  }
}
```

### 2. **实现SpecStream流式渲染**

#### 当前实现
```javascript
// 一次性渲染整个页面
renderPage(pageId) {
  const page = this.config.pages.find(p => p.id === pageId);
  container.innerHTML = this.renderComponentTree(page.componentTree);
}
```

#### 改进方案
```typescript
// core/SpecStreamCompiler.ts
export class SpecStreamCompiler<T = any> {
  private buffer: string = '';
  private result: T | null = null;

  push(chunk: string): { result: Partial<T>, newPatches: any[] } {
    this.buffer += chunk;
    const newPatches = this.applyPatch();
    return {
      result: this.getPartialResult(),
      newPatches
    };
  }

  getResult(): T {
    return this.result;
  }
}

// 在组件渲染器中使用
class StreamRenderer {
  private compiler = new SpecStreamCompiler();

  async renderFromStream(stream: ReadableStream) {
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const { result, newPatches } = this.compiler.push(value);
      this.updateUI(result, newPatches); // 增量更新UI
    }

    return this.compiler.getResult();
  }
}
```

### 3. **实现动态属性系统**

#### 当前实现
```json
{
  "type": "text",
  "props": {
    "content": "固定文本"
  }
}
```

#### 改进方案（支持表达式）
```json
{
  "type": "text",
  "props": {
    // $state - 读取状态值
    "content": { "$state": "/user/name" },

    // $cond - 条件表达式
    "color": {
      "$cond": {
        "$state": "/user/premium",
        "eq": true
      },
      "$then": "#FFD700",
      "$else": "#FFFFFF"
    },

    // $template - 模板字符串
    "content": {
      "$template": "你好，${/user/name}！今天是${/date}"
    },

    // $computed - 调用计算函数
    "content": {
      "$computed": "formatDate",
      "args": { "$state": "/transaction/date" }
    }
  }
}
```

```typescript
// core/ExpressionEvaluator.ts
export class ExpressionEvaluator {
  evaluate(expr: any, state: AppState): any {
    if (expr.$state) {
      return state.get(expr.$state);
    }
    if (expr.$cond) {
      const condition = this.evaluate(expr.$cond, state);
      return condition
        ? this.evaluate(expr.$then, state)
        : this.evaluate(expr.$else, state);
    }
    if (expr.$template) {
      return this.interpolateTemplate(expr.$template, state);
    }
    if (expr.$computed) {
      const fn = this.computedFunctions[expr.$computed];
      const args = this.resolveArgs(expr.$args, state);
      return fn(...args);
    }
    return expr; // 静态值直接返回
  }

  private interpolateTemplate(template: string, state: AppState): string {
    return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
      return state.get(path) || '';
    });
  }
}
```

### 4. **实现条件可见性系统**

#### 改进方案
```json
{
  "type": "alert",
  "props": {
    "message": "需要登录"
  },
  // visible条件 - 多个条件AND关系
  "visible": [
    { "$state": "/user/loggedIn", "not": true },
    { "$state": "/app/showLoginPrompt", "eq": true }
  ]
}
```

```typescript
// core/VisibilityChecker.ts
export class VisibilityChecker {
  isVisible(element: any, state: AppState): boolean {
    if (!element.visible) return true;

    // 多个条件必须全部满足（AND关系）
    return element.visible.every(condition => {
      return this.checkCondition(condition, state);
    });
  }

  private checkCondition(condition: any, state: AppState): boolean {
    const value = this.evaluate(condition.$state, state);
    const equals = condition.eq;
    const not = condition.not;

    if (not !== undefined) {
      return value !== not;
    }
    if (equals !== undefined) {
      return value === equals;
    }

    return true;
  }
}
```

### 5. **实现State Watchers（状态监听）**

#### 改进方案
```json
{
  "type": "select",
  "props": {
    "value": { "$bindState": "/form/country" },
    "options": ["US", "Canada", "UK"]
  },
  // watch配置 - 监听state变化并触发action
  "watch": {
    "/form/country": {
      "action": "loadCities",
      "params": {
        "country": { "$state": "/form/country" }
      }
    }
  }
}
```

```typescript
// core/StateWatcher.ts
export class StateWatcher {
  private watchers: Map<string, WatcherConfig[]> = new Map();

  addWatcher(path: string, config: WatcherConfig) {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, []);
    }
    this.watchers.get(path)!.push(config);
  }

  notify(path: string, newValue: any) {
    const watchers = this.watchers.get(path);
    if (!watchers) return;

    watchers.forEach(watcher => {
      if (this.shouldTrigger(watcher, newValue)) {
        this.actionExecutor.execute(watcher.action);
      }
    });
  }
}
```

### 6. **完善Action系统**

#### 当前实现（已有11种Action）
- navigateTo, switchTab, back, showModal, showToast
- showActionSheet, request, updateState, navigateHome, reload

#### 改进方案（增加更多Action类型）
```typescript
// core/ActionTypes.ts
export enum ActionType {
  // 导航类
  NAVIGATE_TO = 'navigateTo',
  SWITCH_TAB = 'switchTab',
  BACK = 'back',
  REPLACE = 'replace',
  NAVIGATE_HOME = 'navigateHome',

  // UI反馈类
  SHOW_TOAST = 'showToast',
  SHOW_MODAL = 'showModal',
  SHOW_ACTION_SHEET = 'showActionSheet',
  HIDE_TOAST = 'hideToast',
  HIDE_MODAL = 'hideModal',

  // 状态管理类
  SET_STATE = 'setState',
  UPDATE_STATE = 'updateState',
  DELETE_STATE = 'deleteState',
  RESET_STATE = 'resetState',

  // 网络请求类
  REQUEST = 'request',
  UPLOAD = 'upload',

  // 工具类
  COPY_TO_CLIPBOARD = 'copyToClipboard',
  OPEN_URL = 'openUrl',
  SHARE = 'share',
  SCROLL_TO = 'scrollTo',

  // 数据流类
  STREAM_START = 'streamStart',
  STREAM_END = 'streamEnd',
}

// Action链式执行（successAction, errorAction）
interface Action {
  type: ActionType;
  params?: Record<string, any>;
  successAction?: Action;
  errorAction?: Action;
  finallyAction?: Action;
}
```

### 7. **实现组件库分离**

#### 改进方案（参考json-render/shadcn）
```typescript
// catalog/StandardComponents.ts - 标准组件目录
export const standardComponentDefinitions = {
  // 布局组件
  SafeArea: {
    props: z.object({}),
    description: '安全区域容器，处理刘海屏'
  },
  StatusBar: {
    props: z.object({
      showTime: z.boolean(),
      showBattery: z.boolean(),
      showSignal: z.boolean(),
    }),
    description: '状态栏'
  },

  // 内容组件
  Grid: {
    props: z.object({
      colCount: z.number(),
      rowCount: z.number(),
      items: z.array(z.any()),
    }),
    description: '宫格布局'
  },
  List: {
    props: z.object({
      items: z.array(z.any()),
      divider: z.boolean().optional(),
    }),
    description: '列表'
  },

  // 表单组件
  Input: {
    props: z.object({
      inputType: z.enum(['text', 'number', 'password', 'email', 'tel']),
      placeholder: z.string(),
      maxLength: z.number().optional(),
    }),
    description: '输入框'
  },
  Button: {
    props: z.object({
      text: z.string(),
      buttonType: z.enum(['primary', 'secondary', 'danger', 'ghost']),
      size: z.enum(['small', 'medium', 'large']),
      disabled: z.boolean().optional(),
    }),
    description: '按钮'
  },

  // 反馈组件
  Toast: {
    props: z.object({
      message: z.string(),
      duration: z.number(),
      position: z.enum(['top', 'center', 'bottom']),
    }),
    description: '轻提示'
  },
  Modal: {
    props: z.object({
      title: z.string(),
      content: z.string(),
      buttons: z.array(z.object({
        text: z.string(),
        type: z.enum(['primary', 'secondary', 'danger']),
      })),
    }),
    description: '模态框'
  },
};

// catalog/StandardActions.ts - 标准Action目录
export const standardActionDefinitions = {
  navigateTo: {
    description: '导航到指定页面',
    params: {
      pageId: z.string(),
      params: z.record(z.any()).optional(),
    }
  },
  back: {
    description: '返回上一页',
    params: {
      depth: z.number().optional(),
    }
  },
  showToast: {
    description: '显示轻提示',
    params: {
      message: z.string(),
      duration: z.number().optional(),
      icon: z.enum(['success', 'error', 'info', 'warning']).optional(),
    }
  },
  setState: {
    description: '更新状态',
    params: {
      statePath: z.string(),
      value: z.any(),
    }
  },
};
```

### 8. **实现AI集成**

#### 改进方案（支持AI生成UI）
```typescript
// ai/ProtoFlowAI.ts
export class ProtoFlowAI {
  private catalogManager: CatalogManager;

  constructor(catalogManager: CatalogManager) {
    this.catalogManager = catalogManager;
  }

  async generateSpec(prompt: string): Promise<AppSpec> {
    const systemPrompt = this.catalogManager.generatePrompt();

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: systemPrompt,
        prompt: prompt,
      })
    });

    const spec = await response.json();
    return this.validateSpec(spec);
  }

  async generateSpecStream(prompt: string): Promise<ReadableStream> {
    const systemPrompt = this.catalogManager.generatePrompt();

    const response = await fetch('/api/ai/generate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: systemPrompt,
        prompt: prompt,
        stream: true,
      })
    });

    return response.body!;
  }

  private validateSpec(spec: AppSpec): AppSpec {
    // 使用zod验证spec
    return appSchema.parse(spec);
  }
}
```

## 📋 实施路线图

### Phase 1: 核心架构改进
- [x] JSON Schema定义（已有）
- [ ] CatalogManager实现
- [ ] ExpressionEvaluator实现
- [ ] VisibilityChecker实现

### Phase 2: 动态属性和条件
- [ ] 实现动态属性系统（$state, $cond, $template, $computed）
- [ ] 实现条件可见性（visible）
- [ ] 实现StateWatcher（watch）

### Phase 3: 流式渲染
- [ ] 实现SpecStreamCompiler
- [ ] 实现StreamRenderer
- [ ] 优化性能和用户体验

### Phase 4: 组件库完善
- [ ] 提取标准组件定义
- [ ] 提取标准Action定义
- [ ] 实现组件注册机制

### Phase 5: AI集成
- [ ] 实现ProtoFlowAI
- [ ] 集成LLM API
- [ ] 实现AI生成UI playground

## 🎨 设计对比

### json-render架构
```
User Prompt → AI + Catalog → JSON Spec → Renderer → UI
```

### ProtoFlow当前架构
```
JSON Config → Page Manager → Component Renderer → UI
```

### ProtoFlow改进后架构
```
User Prompt → AI + Catalog → JSON Spec → SpecStream → Renderer → UI
                              ↑
                         JSON Config (backward compatible)
```

## 💰 关键优势

1. **保持向后兼容** - 现有的JSON配置仍然有效
2. **渐进式增强** - 可以逐步采用新特性
3. **类型安全** - 使用TypeScript和zod保证类型安全
4. **可扩展** - 容易添加新组件和Action
5. **AI友好** - 为未来AI集成做准备

## 📚 参考资料

- json-render: https://github.com/vercel-labs/json-render
- zod: https://zod.dev/
- React: https://react.dev/
