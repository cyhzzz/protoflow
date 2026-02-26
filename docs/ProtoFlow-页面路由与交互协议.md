# ProtoFlow页面路由与交互协议

## 文档说明

本文档定义了ProtoFlow系统的页面模型、路由系统和交互Action协议，用于管理多页面原型间的导航、跳转和交互逻辑。

**版本**: v2.0
**发布日期**: 2026-02-26
**适用范围**: ProtoFlow移动端APP原型系统

---

## 目录

1. [页面（Page）模型](#1-页面page模型)
2. [应用（App）模型](#2-应用app模型)
3. [路由系统](#3-路由系统)
4. [交互Action协议](#4-交互action协议)
5. [数据流与状态管理](#5-数据流与状态管理)
6. [完整JSON示例](#6-完整json示例)

---

## 1. 页面（Page）模型

### 1.1 页面基础结构

```typescript
interface Page {
  id: string;              // 页面唯一标识（全局唯一）
  name: string;            // 页面名称
  description?: string;    // 页面描述
  componentTree: Component; // 页面组件树（根节点）
  meta?: {
    title?: string;        // 页面元标题（SEO/分享）
    keywords?: string[];   // 关键词
    icon?: string;         // 页面图标
    hidden?: boolean;      // 是否隐藏（不在TabBar显示）
  };
}
```

### 1.2 页面ID命名规范

**规则：**
- 使用小写字母、数字、连字符（-）
- 首字符必须是字母
- 长度：3-50字符
- 唯一性：在整个app中必须唯一

**示例：**
```
✅ home
✅ user-profile
✅ product-detail-123
❌ Home（不能大写）
❌ home_page（不能使用下划线）
❌ 1home（不能以数字开头）
```

### 1.3 页面组件树

每个页面都有一个根组件树，描述页面的完整UI结构：

```json
{
  "id": "home",
  "name": "首页",
  "componentTree": {
    "type": "safeArea",
    "children": [
      {
        "type": "statusBar",
        "style": "dark"
      },
      {
        "type": "navBar",
        "title": "首页"
      },
      {
        "type": "grid",
        "items": [...]
      }
    ]
  }
}
```

### 1.4 页面类型

#### 1.4.1 主页面（Main Page）
- 作为App的初始页面
- 通常在TabBar中显示
- 用户主要交互区域

#### 1.4.2 子页面（Sub Page）
- 通过导航从主页面跳转而来
- 通常有返回按钮
- 不在TabBar中显示

#### 1.4.3 模态页面（Modal Page）
- 以弹窗形式展示
- 遮盖整个屏幕
- 必须手动关闭

---

## 2. 应用（App）模型

### 2.1 App基础结构

```typescript
interface App {
  id: string;           // App唯一标识
  name: string;         // App名称
  version: string;      // App版本
  description?: string;  // App描述

  // 页面配置
  pages: Page[];        // 页面数组（至少1个）

  // 导航配置
  tabBar?: TabBar;      // 底部标签栏（可选）
  router: Router;        // 路由配置（必填）

  // 主题配置
  theme?: Theme;        // 主题配置（可选）

  // 元数据
  meta?: {
    author?: string;     // 作者
    createdAt?: string;  // 创建时间
    updatedAt?: string;  // 更新时间
    tags?: string[];    // 标签
  };
}
```

### 2.2 App ID命名规范

**规则：**
- 使用反向域名格式或简化格式
- 全局唯一
- 建议格式：`[项目名]-[应用名]` 或 `com.company.app`

**示例：**
```
✅ protoflow-demo
✅ com.example.myapp
❌ protoflow demo（不能有空格）
```

---

## 3. 路由系统

### 3.1 路由模式

ProtoFlow支持两种路由模式：

#### 3.1.1 Stack模式（栈式路由）

页面以栈结构管理，新页面压栈，返回时出栈。

```
PageA -> PageB -> PageC (当前页)
  ↑
history: [PageA, PageB, PageC]
```

**特点：**
- 适合层级导航
- 支持多级页面栈
- 返回时回到上一页

**配置：**
```json
{
  "router": {
    "mode": "stack",
    "initialPageId": "home",
    "historyLimit": 10
  }
}
```

#### 3.1.2 Tab模式（标签页路由）

页面通过TabBar切换，当前Tab显示对应页面。

```
TabBar: [首页 | 发现 | 我的]
          ↓
       CurrentPage
```

**特点：**
- 适合平行页面切换
- TabBar固定显示
- 页面状态保留

**配置：**
```json
{
  "router": {
    "mode": "tab",
    "initialPageId": "home"
  },
  "tabBar": {
    "type": "tabBar",
    "items": [...]
  }
}
```

### 3.2 路由配置详解

```typescript
interface Router {
  mode: "stack" | "tab";        // 路由模式
  initialPageId: string;         // 初始页面ID
  historyLimit?: number;         // 历史栈最大深度（stack模式）
  transition?: {
    type?: "push" | "fade" | "slide";  // 过渡动画类型
    duration?: number;           // 动画时长（毫秒）
  };
}
```

### 3.3 页面历史栈

**历史栈结构：**

```typescript
interface HistoryStack {
  pages: PageStackItem[];
  currentIndex: number;        // 当前页面索引
  maxDepth: number;            // 最大深度
}

interface PageStackItem {
  pageId: string;              // 页面ID
  timestamp: number;           // 进入时间戳
  params?: any;                // 页面参数
}
```

**历史栈操作：**
- `push(pageId, params)` - 压栈
- `pop()` - 出栈（返回）
- `popTo(pageId)` - 返回到指定页面
- `replace(pageId, params)` - 替换当前页面
- `clear()` - 清空栈

---

## 4. 交互Action协议

### 4.1 Action基础结构

```typescript
interface Action {
  type: ActionType;            // 动作类型（必填）
  pageId?: string;            // 目标页面ID
  tabIndex?: number;          // 目标Tab索引
  modalId?: string;           // 模态弹窗ID
  componentId?: string;       // 目标组件ID
  params?: any;               // 附加参数
  delay?: number;             // 延迟执行（毫秒）
}
```

### 4.2 Action类型

| 类型 | 说明 | 必填参数 |
|------|------|---------|
| navigateTo | 跳转到指定页面 | pageId |
| switchTab | 切换底部Tab | tabIndex |
| back | 返回上一页 | 无 |
 showModal | 显示模态弹窗 | modalId |
| hideModal | 隐藏模态弹窗 | modalId（可选，不填则关闭当前） |
| showToast | 显示轻提示 | toast配置 |
| showActionSheet | 显示动作面板 | actionSheet配置 |
| request | 发起网络请求 | request配置 |
| updateState | 更新组件状态 | componentId, updates |
| navigateHome | 返回首页 | 无 |
| reload | 重新加载当前页 | 无 |
| none | 无操作（占位） | 无 |

### 4.3 详细Action定义

#### 4.3.1 navigateTo（页面跳转）

```typescript
interface NavigateToAction {
  type: "navigateTo";
  pageId: string;                    // 目标页面ID
  params?: {                        // 页面参数
    [key: string]: any;
  };
  transition?: {                    // 过渡动画（可选）
    type?: "push" | "fade" | "slide";
    duration?: number;               // 毫秒
  };
}
```

**示例：**
```json
{
  "type": "navigateTo",
  "pageId": "product-detail",
  "params": {
    "productId": "12345"
  },
  "transition": {
    "type": "push",
    "duration": 300
  }
}
```

#### 4.3.2 switchTab（Tab切换）

```typescript
interface SwitchTabAction {
  type: "switchTab";
  tabIndex: number;                 // Tab索引（从0开始）
}
```

**示例：**
```json
{
  "type": "switchTab",
  "tabIndex": 1
}
```

#### 4.3.3 back（返回）

```typescript
interface BackAction {
  type: "back";
  depth?: number;                   // 返回层级（默认1）
}
```

**示例：**
```json
{
  "type": "back",
  "depth": 1
}
```

#### 4.3.4 showModal（显示弹窗）

```typescript
interface ShowModalAction {
  type: "showModal";
  modalId: string;                 // 弹窗ID（在全局定义）
  params?: {                       // 弹窗参数
    title?: string;
    content?: string | Component[];
    buttons?: ModalButton[];
  };
}
```

**示例：**
```json
{
  "type": "showModal",
  "modalId": "confirm-modal",
  "params": {
    "title": "确认删除",
    "content": "确定要删除这条记录吗？",
    "buttons": [
      {
        "text": "取消",
        "type": "secondary"
      },
      {
        "text": "确认",
        "type": "primary",
        "onClickAction": {
          "type": "request",
          "url": "/api/delete"
        }
      }
    ]
  }
}
```

#### 4.3.5 hideModal（隐藏弹窗）

```typescript
interface HideModalAction {
  type: "hideModal";
  modalId?: string;                // 弹窗ID（可选，不填则关闭当前弹窗）
}
```

**示例：**
```json
{
  "type": "hideModal",
  "modalId": "confirm-modal"
}
```

#### 4.3.6 showToast（显示提示）

```typescript
interface ShowToastAction {
  type: "showToast";
  toast: {
    message: string;               // 提示内容
    duration?: number;             // 显示时长（毫秒，默认2000）
    position?: "top" | "center" | "bottom"; // 位置（默认center）
    icon?: "success" | "error" | "info" | "warning" | "none"; // 图标
    mask?: boolean;               // 是否显示遮罩
  };
}
```

**示例：**
```json
{
  "type": "showToast",
  "toast": {
    "message": "操作成功",
    "duration": 2000,
    "position": "center",
    "icon": "success",
    "mask": false
  }
}
```

#### 4.3.7 showActionSheet（显示动作面板）

```typescript
interface ShowActionSheetAction {
  type: "showActionSheet";
  actionSheet: {
    title?: string;
    items: ActionSheetItem[];
    cancelButton?: {
      text: string;
      onClickAction?: Action;
    };
  };
}
```

**示例：**
```json
{
  "type": "showActionSheet",
  "actionSheet": {
    "title": "选择操作",
    "items": [
      {
        "text": "保存",
        "onClickAction": {
          "type": "request",
          "url": "/api/save"
        }
      },
      {
        "text": "删除",
        "type": "danger",
        "onClickAction": {
          "type": "request",
          "url": "/api/delete"
        }
      }
    ],
    "cancelButton": {
      "text": "取消"
    }
  }
}
```

#### 4.3.8 request（网络请求）

```typescript
interface RequestAction {
  type: "request";
  request: {
    url: string;                  // 请求URL
    method: "GET" | "POST" | "PUT" | "DELETE"; // 请求方法
    headers?: {                  // 请求头
      [key: string]: string;
    };
    data?: {                     // 请求数据
      [key: string]: any;
    };
    successAction?: Action;       // 成功后执行的Action
    errorAction?: Action;         // 失败后执行的Action
  };
}
```

**示例：**
```json
{
  "type": "request",
  "request": {
    "url": "/api/user/login",
    "method": "POST",
    "data": {
      "username": "user123",
      "password": "******"
    },
    "successAction": {
      "type": "showToast",
      "toast": {
        "message": "登录成功",
        "icon": "success"
      }
    },
    "errorAction": {
      "type": "showToast",
      "toast": {
        "message": "登录失败",
        "icon": "error"
      }
    }
  }
}
```

#### 4.3.9 updateState（更新状态）

```typescript
interface UpdateStateAction {
  type: "updateState";
  updateState: {
    componentId: string;          // 目标组件ID
    updates: {                   // 要更新的属性
      [key: string]: any;
    };
    merge?: boolean;             // 是否合并（true）或替换（false），默认true
  };
}
```

**示例：**
```json
{
  "type": "updateState",
  "updateState": {
    "componentId": "user-avatar",
    "updates": {
      "src": "/avatars/user123.png",
      "borderRadius": 50
    },
    "merge": true
  }
}
```

#### 4.3.10 navigateHome（返回首页）

```typescript
interface NavigateHomeAction {
  type: "navigateHome";
  transition?: {                 // 过渡动画（可选）
    type?: "push" | "fade" | "slide";
    duration?: number;
  };
}
```

**示例：**
```json
{
  "type": "navigateHome",
  "transition": {
    "type": "fade",
    "duration": 300
  }
}
```

#### 4.3.11 reload（重新加载）

```typescript
interface ReloadAction {
  type: "reload";
  pageId?: string;               // 页面ID（可选，默认当前页）
}
```

**示例：**
```json
{
  "type": "reload",
  "pageId": "home"
}
```

---

## 5. 数据流与状态管理

### 5.1 页面参数传递

#### 5.1.1 路由参数

通过 `navigateTo` 的 `params` 字段传递：

```json
{
  "type": "navigateTo",
  "pageId": "product-detail",
  "params": {
    "productId": "12345",
    "source": "home"
  }
}
```

在目标页面中接收：
```typescript
interface PageParams {
  productId: string;
  source: string;
}
```

#### 5.1.2 组件参数

组件定义时可接收父组件传递的参数：

```json
{
  "type": "grid",
  "items": [
    {
      "text": "转账",
      "onClickAction": {
        "type": "navigateTo",
        "pageId": "transfer",
        "params": {
          "amount": 100
        }
      }
    }
  ]
}
```

### 5.2 组件状态

#### 5.2.1 组件内部状态

组件可维护内部状态（如输入框值、开关状态等）：

```typescript
interface ComponentState {
  value: any;
  disabled: boolean;
  hidden: boolean;
  // ... 其他组件特定状态
}
```

#### 5.2.2 状态更新

通过 `updateState` Action更新组件状态：

```json
{
  "type": "updateState",
  "updateState": {
    "componentId": "input-phone",
    "updates": {
      "value": "13800138000",
      "disabled": true
    }
  }
}
```

### 5.3 全局状态

#### 5.3.1 App全局状态

```typescript
interface AppGlobalState {
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  theme: "light" | "dark";
  language: "zh-CN" | "en-US";
  tabBarSelectedIndex: number;
}
```

#### 5.3.2 状态访问与更新

任何组件都可以通过Action访问和更新全局状态：

```json
{
  "type": "updateState",
  "updateState": {
    "componentId": "global",
    "updates": {
      "theme": "dark"
    }
  }
}
```

---

## 6. 完整JSON示例

### 6.1 简单App示例

```json
{
  "version": "2.0.0",
  "app": {
    "id": "protoflow-demo",
    "name": "ProtoFlow Demo",
    "description": "ProtoFlow演示应用",
    "pages": [
      {
        "id": "home",
        "name": "首页",
        "componentTree": {
          "type": "safeArea",
          "children": [
            {
              "type": "statusBar",
              "style": "dark",
              "showTime": true,
              "showBattery": true
            },
            {
              "type": "navBar",
              "title": "首页",
              "titleStyle": {
                "fontSize": 18,
                "fontWeight": "semibold",
                "color": "#000000"
              }
            },
            {
              "type": "grid",
              "rowCount": 2,
              "colCount": 4,
              "spacing": 16,
              "padding": {
                "top": 16,
                "left": 16,
                "right": 16
              },
              "items": [
                {
                  "icon": "/icons/payment.png",
                  "text": "转账",
                  "onClickAction": {
                    "type": "navigateTo",
                    "pageId": "transfer"
                  }
                },
                {
                  "icon": "/icons/bill.png",
                  "text": "账单"
                },
                {
                  "icon": "/icons/invest.png",
                  "text": "理财"
                },
                {
                  "icon": "/icons/vip.png",
                  "text": "会员"
                }
              ]
            }
          ]
        }
      },
      {
        "id": "transfer",
        "name": "转账",
        "componentTree": {
          "type": "safeArea",
          "children": [
            {
              "type": "navBar",
              "title": "转账",
              "leftItems": [
                {
                  "type": "back",
                  "onClickAction": {
                    "type": "back"
                  }
                }
              ]
            },
            {
              "type": "input",
              "inputType": "phone",
              "placeholder": "请输入收款人手机号"
            },
            {
              "type": "button",
              "text": "确认转账",
              "buttonType": "primary",
              "onClickAction": {
                "type": "request",
                "request": {
                  "url": "/api/transfer",
                  "method": "POST",
                  "successAction": {
                    "type": "showToast",
                    "toast": {
                      "message": "转账成功",
                      "icon": "success"
                    }
                  },
                  "errorAction": {
                    "type": "showToast",
                    "toast": {
                      "message": "转账失败",
                      "icon": "error"
                    }
                  }
                }
              }
            }
          ]
        }
      }
    ],
    "tabBar": {
      "type": "tabBar",
      "selectedIndex": 0,
      "items": [
        {
          "title": "首页",
          "icon": "/icons/home.png",
          "selectedIcon": "/icons/home-active.png",
          "pageId": "home"
        },
        {
          "title": "发现",
          "icon": "/icons/discover.png",
          "selectedIcon": "/icons/discover-active.png",
          "pageId": "discover"
        },
        {
          "title": "我的",
          "icon": "/icons/profile.png",
          "selectedIcon": "/icons/profile-active.png",
          "pageId": "profile"
        }
      ]
    },
    "router": {
      "mode": "tab",
      "initialPageId": "home"
    },
    "theme": {
      "primaryColor": "#1890FF",
      "textColor": "#000000",
      "backgroundColor": "#FFFFFF"
    }
  }
}
```

### 6.2 多页面App示例（电商）

```json
{
  "version": "2.0.0",
  "app": {
    "id": "ecommerce-demo",
    "name": "电商Demo",
    "pages": [
      {
        "id": "home",
        "name": "首页",
        "componentTree": {
          "type": "safeArea",
          "children": [
            {
              "type": "carousel",
              "autoPlay": true,
              "interval": 3000,
              "items": [
                {
                  "type": "image",
                  "src": "/images/banner1.jpg"
                },
                {
                  "type": "image",
                  "src": "/images/banner2.jpg"
                }
              ]
            },
            {
              "type": "grid",
              "rowCount": 2,
              "colCount": 4,
              "items": [
                {
                  "text": "手机",
                  "icon": "/icons/phone.png",
                  "onClickAction": {
                    "type": "navigateTo",
                    "pageId": "category",
                    "params": {
                      "category": "phone"
                    }
                  }
                }
              ]
            }
          ]
        }
      },
      {
        "id": "category",
        "name": "分类页",
        "componentTree": {
          "type": "safeArea",
          "children": [
            {
              "type": "navBar",
              "title": "分类",
              "leftItems": [
                {
                  "type": "back",
                  "onClickAction": {
                    "type": "back"
                  }
                }
              ]
            },
            {
              "type": "list",
              "items": [
                {
                  "type": "iconText",
                  "title": "智能手机",
                  "icon": "/icons/phone.png",
                  "onClickAction": {
                    "type": "navigateTo",
                    "pageId": "product-list"
                  }
                },
                {
                  "type": "iconText",
                  "title": "平板电脑",
                  "icon": "/icons/tablet.png",
                  "onClickAction": {
                    "type": "navigateTo",
                    "pageId": "product-list"
                  }
                }
              ]
            }
          ]
        }
      },
      {
        "id": "product-detail",
        "name": "商品详情",
        "componentTree": {
          "type": "safeArea",
          "children": [
            {
              "type": "navBar",
              "title": "商品详情",
              "leftItems": [
                {
                  "type": "back",
                  "onClickAction": {
                    "type": "back"
                  }
                }
              ],
              "rightItems": [
                {
                  "type": "icon",
                  "icon": "/icons/cart.png",
                  "onClickAction": {
                    "type": "navigateTo",
                    "pageId": "cart"
                  }
                }
              ]
            },
            {
              "type": "image",
              "src": "/images/product.jpg",
              "mode": "aspectFill"
            },
            {
              "type": "text",
              "content": "商品标题",
              "style": {
                "fontSize": 20,
                "fontWeight": "bold"
              }
            },
            {
              "type": "button",
              "text": "加入购物车",
              "buttonType": "primary",
              "onClickAction": {
                "type": "request",
                "request": {
                  "url": "/api/cart/add",
                  "method": "POST",
                  "successAction": {
                    "type": "showToast",
                    "toast": {
                      "message": "已加入购物车",
                      "icon": "success"
                    }
                  }
                }
              }
            }
          ]
        }
      },
      {
        "id": "cart",
        "name": "购物车",
        "componentTree": {
          "type": "safeArea",
          "children": [
            {
              "type": "navBar",
              "title": "购物车"
            },
            {
              "type": "list",
              "items": [
                {
                  "type": "avatarText",
                  "title": "商品1",
                  "avatar": "/images/product1.jpg",
                  "onClickAction": {
                    "type": "navigateTo",
                    "pageId": "product-detail"
                  }
                },
                {
                  "type": "avatarText",
                  "title": "商品2",
                  "avatar": "/images/product2.jpg",
                  "onClickAction": {
                    "type": "navigateTo",
                    "pageId": "product-detail"
                  }
                }
              ]
            },
            {
              "type": "button",
              "text": "去结算",
              "buttonType": "primary",
              "onClickAction": {
                "type": "navigateTo",
                "pageId": "checkout"
              }
            }
          ]
        }
      }
    ],
    "tabBar": {
      "type": "tabBar",
      "selectedIndex": 0,
      "items": [
        {
          "title": "首页",
          "icon": "/icons/home.png",
          "pageId": "home"
        },
        {
          "title": "分类",
          "icon": "/icons/category.png",
          "pageId": "category"
        },
        {
          "title": "购物车",
          "icon": "/icons/cart.png",
          "badge": 2,
          "pageId": "cart"
        },
        {
          "title": "我的",
          "icon": "/icons/profile.png",
          "pageId": "profile"
        }
      ]
    },
    "router": {
      "mode": "tab",
      "initialPageId": "home"
    }
  }
}
```

---

## 附录

### A. 路由最佳实践

#### A.1 路由设计原则

1. **扁平化优先**：尽量避免超过3级的页面嵌套
2. **清晰命名**：页面ID应清晰表达其用途
3. **参数传递**：使用明确的字段名，避免模糊参数
4. **状态管理**：合理使用全局状态，减少页面间耦合

#### A.2 性能优化建议

1. **页面缓存**：Tab页面应缓存，切换时不重新渲染
2. **懒加载**：非首屏内容延迟加载
3. **预加载**：预测用户操作，预加载可能访问的页面

### B. Action使用建议

#### B.1 常见Action组合

**场景1：表单提交**
```json
{
  "onClickAction": {
    "type": "request",
    "request": {
      "url": "/api/submit",
      "method": "POST",
      "successAction": {
        "type": "showToast",
        "toast": {
          "message": "提交成功",
          "icon": "success"
        }
      },
      "errorAction": {
        "type": "showToast",
        "toast": {
          "message": "提交失败",
          "icon": "error"
        }
      }
    }
  }
}
```

**场景2：确认操作**
```json
{
  "onClickAction": {
    "type": "showModal",
    "modalId": "confirm-modal",
    "params": {
      "title": "确认删除",
      "content": "确定要删除吗？",
      "buttons": [
        {
          "text": "取消",
          "type": "secondary"
        },
        {
          "text": "确认",
          "type": "danger",
          "onClickAction": {
            "type": "request",
            "request": {
              "url": "/api/delete",
              "method": "DELETE",
              "successAction": {
                "type": "back"
              }
            }
          }
        }
      ]
    }
  }
}
```

---

**文档结束**
