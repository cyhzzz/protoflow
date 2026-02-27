# ProtoFlow + json-render 灵感应用示例

## 示例1：动态属性系统

### 传统方式（当前）
```json
{
  "type": "text",
  "props": {
    "content": "你好，张三！"
  }
}
```

### 使用动态属性（借鉴json-render）
```json
{
  "type": "text",
  "props": {
    "$state": "/user/greeting"
  }
}
```

当`/user/greeting`更新为"你好，李四！"时，UI自动更新。

---

## 示例2：条件渲染

### 传统方式
需要在JavaScript中手动控制显示/隐藏逻辑

### 使用条件可见性
```json
{
  "type": "button",
  "props": {
    "text": "立即购买"
  },
  "visible": [
    { "$state": "/user/loggedIn", "eq": true },
    { "$state": "/product/inStock", "eq": true }
  ]
}
```

按钮只有在用户已登录且商品有库存时才显示。

---

## 示例3：条件样式

### 传统方式
```javascript
// 需要在渲染时手动判断
const color = user.premium ? '#FFD700' : '#FFFFFF';
```

### 使用动态属性
```json
{
  "type": "text",
  "props": {
    "content": "VIP用户",
    "color": {
      "$cond": {
        "$state": "/user/premium",
        "eq": true
      },
      "$then": "#FFD700",
      "$else": "#8E8E93"
    }
  }
}
```

---

## 示例4：模板字符串

### 传统方式
```javascript
// 手动拼接字符串
const message = `你好，${user.name}！今天${new Date().toLocaleDateString()}`;
```

### 使用模板表达式
```json
{
  "type": "text",
  "props": {
    "content": {
      "$template": "你好，${/user/name}！今天是${/date}"
    }
  }
}
```

---

## 示例5：状态绑定

### 传统方式
```javascript
// 手动实现双向绑定
<input
  value={formData.country}
  onChange={(e) => setFormData({...formData, country: e.target.value})}
/>
```

### 使用状态绑定
```json
{
  "type": "select",
  "props": {
    "value": { "$bindState": "/form/country" },
    "options": ["中国", "美国", "日本"]
  },
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

选择国家后，自动触发`loadCities` action加载对应城市列表。

---

## 示例6：Action链式执行

### 当前ProtoFlow支持
```json
{
  "type": "button",
  "onClickAction": {
    "type": "navigateTo",
    "pageId": "detail"
  }
}
```

### 扩展：支持成功/失败回调
```json
{
  "type": "button",
  "text": "提交订单",
  "onClickAction": {
    "type": "request",
    "url": "/api/orders",
    "method": "POST",
    "successAction": {
      "type": "navigateTo",
      "pageId": "order-success"
    },
    "errorAction": {
      "type": "showToast",
      "toast": {
        "message": "提交失败，请重试",
        "icon": "error"
      }
    },
    "finallyAction": {
      "type": "setState",
      "statePath": "/form/submitting",
      "value": false
    }
  }
}
```

---

## 示例7：Catalog定义

### 定义组件Catalog（借鉴json-render）
```typescript
import { z } from 'zod';

const catalog = {
  components: {
    Button: {
      props: z.object({
        text: z.string(),
        type: z.enum(['primary', 'secondary', 'danger']),
        size: z.enum(['small', 'medium', 'large']),
        disabled: z.boolean().optional(),
        loading: z.boolean().optional(),
      }),
      description: '按钮组件，支持多种样式和状态'
    },

    Input: {
      props: z.object({
        placeholder: z.string(),
        value: z.any().optional(),
        maxLength: z.number().optional(),
        error: z.string().optional(),
      }),
      description: '输入框组件，支持验证'
    },

    Grid: {
      props: z.object({
        colCount: z.number().min(1).max(6),
        rowCount: z.number().optional(),
        spacing: z.number().optional(),
        items: z.array(z.any()),
      }),
      description: '网格布局组件'
    }
  },

  actions: {
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
        depth: z.number().optional().default(1),
      }
    },

    showToast: {
      description: '显示轻提示',
      params: {
        message: z.string(),
        duration: z.number().optional().default(3000),
        icon: z.enum(['success', 'error', 'info', 'warning']).optional(),
      }
    }
  }
};
```

### 生成AI Prompt
```typescript
function generatePrompt(catalog): string {
  let prompt = 'You are a UI generator. You can only use these components:\n\n';

  // 组件描述
  prompt += 'Components:\n';
  for (const [name, def] of Object.entries(catalog.components)) {
    prompt += `- ${name}: ${def.description}\n`;
  }

  // Action描述
  prompt += '\nActions:\n';
  for (const [name, def] of Object.entries(catalog.actions)) {
    prompt += `- ${name}: ${def.description}\n`;
  }

  prompt += '\nGenerate UI in JSON format.\n';
  return prompt;
}

// 生成的prompt示例：
/*
You are a UI generator. You can only use these components:

Components:
- Button: 按钮组件，支持多种样式和状态
- Input: 输入框组件，支持验证
- Grid: 网格布局组件

Actions:
- navigateTo: 导航到指定页面
- back: 返回上一页
- showToast: 显示轻提示

Generate UI in JSON format.
*/
```

---

## 示例8：流式渲染

### 传统方式（一次性渲染）
```typescript
// 等待完整响应后渲染
const spec = await fetchSpec();
render(spec);
```

### 使用流式渲染
```typescript
import { SpecStreamCompiler } from '@protoflow/core';

const compiler = new SpecStreamCompiler();

// 流式接收JSON
const stream = await fetchSpecStream();

const reader = stream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  // 增量更新UI
  const { result, newPatches } = compiler.push(value);
  updateUI(result, newPatches);
}

const finalSpec = compiler.getResult();
```

优势：
- 用户更快看到UI内容
- 提升感知性能
- 支持大页面增量加载

---

## 完整示例：登录页面

### 使用完整的新特性
```json
{
  "type": "safeArea",
  "children": [
    {
      "type": "navBar",
      "title": "登录"
    },
    {
      "type": "card",
      "children": [
        {
          "type": "text",
          "props": {
            "content": {
              "$template": "欢迎回来，${/user/lastLogin ? '' : '首次访问'}"
            }
          }
        },
        {
          "type": "input",
          "props": {
            "placeholder": "手机号",
            "value": { "$bindState": "/form/phone" },
            "error": { "$state": "/form/phoneError" }
          }
        },
        {
          "type": "input",
          "props": {
            "placeholder": "密码",
            "inputType": "password",
            "value": { "$bindState": "/form/password" }
          }
        },
        {
          "type": "button",
          "props": {
            "text": "登录",
            "type": "primary",
            "disabled": { "$state": "/form/submitting" }
          },
          "onClickAction": {
            "type": "request",
            "url": "/api/login",
            "method": "POST",
            "beforeAction": {
              "type": "setState",
              "statePath": "/form/submitting",
              "value": true
            },
            "successAction": {
              "type": "updateState",
              "statePath": "/user",
              "value": { "$response": "data" }
            },
            "errorAction": {
              "type": "setState",
              "statePath": "/form/password",
              "value": ""
            }
          }
        }
      ]
    },
    {
      "type": "button",
      "props": {
        "text": "忘记密码？",
        "type": "ghost"
      },
      "onClickAction": {
        "type": "navigateTo",
        "pageId": "forgot-password"
      }
    }
  ]
}
```

---

## 关键改进点总结

| 特性 | json-render | ProtoFlow（改进后） |
|------|-------------|---------------------|
| Catalog定义 | ✅ zod schema | ✅ zod schema |
| 动态属性 | ✅ $state, $cond, etc | ✅ 计划实现 |
| 条件可见 | ✅ visible条件 | ✅ 计划实现 |
| State绑定 | ✅ $bindState | ✅ 计划实现 |
| State监听 | ✅ watch | ✅ 计划实现 |
| 流式渲染 | ✅ SpecStream | ✅ 计划实现 |
| AI集成 | ✅ 自动生成prompt | ✅ 计划实现 |
| 跨平台 | ✅ React/Vue/RN | ⏳ 计划支持Vue/RN |

---

## 下一步行动

1. **实现ExpressionEvaluator** - 支持动态属性表达式
2. **实现VisibilityChecker** - 支持条件可见性
3. **实现StateWatcher** - 支持状态监听
4. **实现SpecStreamCompiler** - 支持流式渲染
5. **重构ComponentCatalog** - 提取为独立模块
6. **添加AI集成** - 支持AI生成UI

---

## 参考资源

- json-render文档: https://github.com/vercel-labs/json-render
- zod文档: https://zod.dev/
- ProtoFlow项目: https://github.com/cyhzzz/protoflow
