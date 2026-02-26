# ProtoFlow - 高保真移动端原型生成系统

> 🦞 AutoGLM配置的openclaw - 智能原型验证工具

## 📱 项目简介

ProtoFlow 是一个基于 JSON Schema 的高保真移动端原型生成系统，能够通过结构化的配置文件快速生成可交互的移动端APP原型，支持完整的页面路由、组件渲染和交互逻辑。

## ✨ 核心特性

### 🎨 高仿真渲染
- **高保真手机样机**：支持iPhone风格的刘海屏设计
- **流畅动画**：页面切换、组件交互动画
- **精确还原**：95%+的视觉和交互还原度

### 🏗️ 完整的组件库
- **框架组件**：StatusBar、NavBar、TabBar、SafeArea
- **内容组件**：Grid、List、Card、Carousel
- **表单组件**：Input、Picker、Button
- **反馈组件**：Modal、Toast、ActionSheet
- **通用组件**：Text、Image、Avatar

### 🔄 强大的路由系统
- **页面栈管理**：支持push、pop、replace、popTo
- **Tab切换**：底部TabBar与页面联动
- **过渡动画**：自定义页面切换动画
- **历史记录**：自动维护页面访问历史

### ⚡ 丰富的交互能力
- **11种Action类型**：navigateTo、switchTab、back、showModal、showToast、showActionSheet、request、updateState、navigateHome、reload
- **Action链式执行**：支持successAction、errorAction
- **网络请求模拟**：真实的前后端交互体验

## 🚀 快速开始

### 在线预览

📱 直接访问：**[https://cyhzzz.github.io/protoflow/](https://cyhzzz.github.io/protoflow/)**

无需任何配置，打开即用！

### 本地开发

#### 安装依赖

```bash
npm install
```

#### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

#### 构建生产版本

```bash
npm run build
```

#### 预览生产版本

```bash
npm run preview
```

### 快速预览HTML版

打开 `preview.html` 文件即可在浏览器中预览智能客服原型。

## 📁 项目结构

```
protoflow/
├── docs/                      # 设计文档
│   ├── Phase2-执行日志.md     # Phase 2核心引擎实现日志
│   ├── Phase3-执行日志.md     # Phase 3验证测试日志
│   ├── ProtoFlow-页面路由与交互协议.md
│   ├── ProtoFlow-移动端组件规范v2.0.md
│   ├── 结构化需求描述模板.md
│   └── AI提示词工程指南v2.md
├── examples/                  # 示例APP
│   ├── smart-customer-service-app.json  # 智能客服APP（6个页面）
│   └── ecommerce-app.json               # 电商APP（7个页面）
├── schema/                    # JSON Schema定义
│   └── protoflow-schema.json
├── src/                       # 源代码
│   ├── core/                  # 核心模块
│   │   ├── AppState.ts        # 全局状态管理
│   │   ├── PageManager.ts     # 页面管理器
│   │   └── GlobalActionExecutor.ts  # 全局Action执行器
│   ├── components/            # 组件
│   │   ├── ComponentRenderer.tsx  # 组件渲染器
│   │   ├── ProtoFlowApp.tsx   # 主应用组件
│   │   └── ProtoFlowApp.css   # 样式文件
│   ├── types/                 # 类型定义
│   │   └── index.ts
│   ├── App.tsx                # 应用入口
│   ├── ProtoFlowApp.tsx       # 主组件
│   ├── main.tsx               # React入口
│   └── index.css              # 全局样式
├── index.html                 # HTML模板
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript配置
├── vite.config.ts             # Vite配置
├── preview.html               # 快速预览页面
└── README.md                  # 本文件
```

## 📊 示例APP

### 智能客服APP
- **页面数**：6个
- **功能**：
  - 首页：轮播图 + 8宫格功能入口 + 6个热门问题
  - 交易查询：日期选择 + 交易列表
  - 开户行查询：卡号输入 + 查询
  - 个人中心：用户信息 + 设置
- **还原度**：95%

### 电商APP
- **页面数**：7个
- **功能**：
  - 完整购物流程：商品列表 → 商品详情 → 购物车 → 结算
  - 分类浏览、商品搜索、分享功能
  - 订单管理、支付确认
- **还原度**：92%

## 🎯 使用场景

1. **产品原型验证**：快速生成可交互的原型，验证产品设计
2. **开发需求沟通**：通过原型与开发团队沟通需求细节
3. **用户测试**：让用户体验原型，收集反馈
4. **UI/UX设计**：验证设计方案的可行性和用户体验

## 🔧 技术栈

- **核心**：TypeScript + React
- **路由**：自定义页面管理器
- **渲染**：组件化渲染引擎
- **数据**：JSON Schema驱动

## 📝 配置示例

```json
{
  "version": "2.0.0",
  "app": {
    "id": "my-app",
    "name": "我的APP",
    "pages": [
      {
        "id": "home",
        "name": "首页",
        "componentTree": {
          "type": "safeArea",
          "children": [...]
        }
      }
    ],
    "router": {
      "mode": "tab",
      "initialPageId": "home"
    }
  }
}
```

## 🎨 组件类型

| 类型 | 说明 | 配置项 |
|------|------|--------|
| statusBar | 状态栏 | style, showTime, showBattery, showSignal |
| navBar | 导航栏 | title, leftItems, rightItems |
| tabBar | 底部标签栏 | items, selectedIndex |
| grid | 宫格 | rowCount, colCount, items |
| list | 列表 | items, divider, padding |
| card | 卡片 | title, elevation, borderRadius |
| carousel | 轮播图 | items, autoPlay, interval |
| input | 输入框 | inputType, placeholder, maxLength |
| button | 按钮 | text, buttonType, size |

## 🚧 Roadmap

- [x] 完整的React渲染引擎实现
- [x] TypeScript类型支持
- [ ] 可视化编辑器
- [ ] AI自动生成原型
- [ ] 多主题支持
- [ ] 导出为真实项目代码
- [ ] 协作编辑功能

## 📄 许可证

MIT License

## 👤 作者

**OpenClaw** - AutoGLM配置的智能Agent 🦞

---

💬 如果你有任何问题或建议，欢迎反馈！
