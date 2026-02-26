# ProtoFlow移动端组件规范与JSON Schema v2.0

## 文档说明

本文档定义了ProtoFlow系统的完整移动端UI组件规范，包括所有原子组件的API、属性枚举、样式规范和交互行为。所有组件均通过JSON配置驱动，支持高度可定制化。

**版本**: v2.0
**发布日期**: 2026-02-26
**适用范围**: 国内移动应用生态（iOS/Android）

---

## 目录

1. [容器与框架组件](#1-容器与框架组件)
2. [内容与列表组件](#2-内容与列表组件)
3. [表单与反馈组件](#3-表单与反馈组件)
4. [组件通用属性](#4-组件通用属性)
5. [JSON Schema完整定义](#5-json-schema完整定义)

---

## 1. 容器与框架组件

### 1.1 StatusBar (状态栏)

状态栏组件，显示系统级信息（时间、电量、信号强度等）。

#### 基础结构
```typescript
interface StatusBar {
  type: "statusBar";
  style: "light" | "dark";
  showTime: boolean;
  showBattery: boolean;
  showSignal: boolean;
  networkType: "none" | "wifi" | "4g" | "5g";
  customContent?: {
    left?: string;  // 左侧自定义内容（如运营商名称）
    right?: string; // 右侧自定义内容
  };
  height: number;  // 默认44（iOS）/ 24（Android）
  backgroundColor?: string;
  textColor?: string;
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "statusBar" | 组件类型标识 |
| style | enum | ❌ | "dark" | 状态栏风格：浅色/深色 |
| showTime | boolean | ❌ | true | 是否显示时间 |
| showBattery | boolean | ❌ | true | 是否显示电量图标 |
| showSignal | boolean | ❌ | true | 是否显示信号强度 |
| networkType | enum | ❌ | "none" | 网络类型：无/WiFi/4G/5G |
| customContent | object | ❌ | - | 自定义内容 |
| customContent.left | string | ❌ | - | 左侧显示文本（如"中国移动"） |
| customContent.right | string | ❌ | - | 右侧显示文本 |
| height | number | ❌ | 44 | 状态栏高度（像素） |
| backgroundColor | string | ❌ | "#000000" | 背景色（16进制） |
| textColor | string | ❌ | "#FFFFFF" | 文字颜色（16进制） |

#### 使用示例
```json
{
  "type": "statusBar",
  "style": "dark",
  "showTime": true,
  "showBattery": true,
  "showSignal": true,
  "networkType": "wifi",
  "customContent": {
    "left": "中国移动",
    "right": "5G"
  },
  "height": 44,
  "backgroundColor": "#000000",
  "textColor": "#FFFFFF"
}
```

---

### 1.2 NavBar (导航栏)

导航栏组件，位于页面顶部，显示标题和操作按钮。

#### 基础结构
```typescript
interface NavBar {
  type: "navBar";
  title: string;
  titleStyle: {
    fontSize: number;
    fontWeight: "normal" | "bold" | "semibold";
    color: string;
  };
  leftItems?: NavBarItem[];
  rightItems?: NavBarItem[];
  backgroundColor?: string;
  borderless?: boolean;
  elevation?: number;
  height: number;
  actions?: {
    leftItemOnClick?: Action;
    rightItemOnClick?: Action;
  };
}

interface NavBarItem {
  type: "text" | "icon" | "back";
  text?: string;
  icon?: string;
  tintColor?: string;
  disabled?: boolean;
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "navBar" | 组件类型标识 |
| title | string | ✅ | - | 导航栏标题 |
| titleStyle.fontSize | number | ❌ | 18 | 标题字体大小 |
| titleStyle.fontWeight | enum | ❌ | "semibold" | 标题字重 |
| titleStyle.color | string | ❌ | "#000000" | 标题颜色 |
| leftItems | array | ❌ | [] | 左侧按钮组 |
| rightItems | array | ❌ | [] | 右侧按钮组 |
| leftItems[].type | enum | ❌ | - | 按钮类型：文本/图标/返回 |
| leftItems[].text | string | ❌ | - | 按钮文本（type="text"时） |
| leftItems[].icon | string | ❌ | - | 按钮图标路径（type="icon"时） |
| leftItems[].tintColor | string | ❌ | "#000000" | 图标/文本颜色 |
| leftItems[].disabled | boolean | ❌ | false | 是否禁用 |
| rightItems | 同leftItems | ❌ | - | 右侧按钮组 |
| backgroundColor | string | ❌ | "#FFFFFF" | 导航栏背景色 |
| borderless | boolean | ❌ | false | 是否隐藏底部边框 |
| elevation | number | ❌ | 0 | 阴影层级（0-24） |
| height | number | ❌ | 44 | 导航栏高度 |
| actions | object | ❌ | - | 交互动作 |

#### 使用示例
```json
{
  "type": "navBar",
  "title": "首页",
  "titleStyle": {
    "fontSize": 18,
    "fontWeight": "semibold",
    "color": "#000000"
  },
  "leftItems": [
    {
      "type": "back",
      "tintColor": "#000000"
    }
  ],
  "rightItems": [
    {
      "type": "icon",
      "icon": "/icons/more.png",
      "tintColor": "#000000"
    }
  ],
  "backgroundColor": "#FFFFFF",
  "borderless": false,
  "height": 44
}
```

---

### 1.3 SafeArea (安全区域)

安全区域组件，处理不同设备的安全边距（刘海屏、圆角等）。

#### 基础结构
```typescript
interface SafeArea {
  type: "safeArea";
  edges: "top" | "bottom" | "left" | "right" | "all" | "topAndBottom";
  backgroundColor?: string;
  padding: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  children: Component[];
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "safeArea" | 组件类型标识 |
| edges | enum | ❌ | "topAndBottom" | 应用安全区域的方向 |
| edges值说明 | - | - | - | top:仅顶部; bottom:仅底部; all:全方向 |
| backgroundColor | string | ❌ | "#FFFFFF" | 背景色 |
| padding.top | number | ❌ | 0 | 顶部内边距 |
| padding.bottom | number | ❌ | 0 | 底部内边距 |
| padding.left | number | ❌ | 0 | 左侧内边距 |
| padding.right | number | ❌ | 0 | 右侧内边距 |
| children | array | ✅ | - | 子组件数组 |

#### 使用示例
```json
{
  "type": "safeArea",
  "edges": "topAndBottom",
  "backgroundColor": "#FFFFFF",
  "padding": {
    "top": 0,
    "bottom": 0,
    "left": 16,
    "right": 16
  },
  "children": [
    {
      "type": "text",
      "content": "内容区域"
    }
  ]
}
```

---

### 1.4 TabBar (底部标签栏)

底部标签栏组件，支持图标、文字、红点提示。

#### 基础结构
```typescript
interface TabBar {
  type: "tabBar";
  items: TabBarItem[];
  selectedIndex: number;
  backgroundColor?: string;
  height?: number;
  showDivider?: boolean;
  actions?: {
    onTabSwitch?: Action;
  };
}

interface TabBarItem {
  title: string;
  icon?: string;
  selectedIcon?: string;
  badge?: string | number;
  disabled?: boolean;
  pageId?: string;  // 点击后跳转的页面ID
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "tabBar" | 组件类型标识 |
| items | array | ✅ | - | 标签项数组（至少2个） |
| items[].title | string | ✅ | - | 标签标题 |
| items[].icon | string | ❌ | - | 未选中图标路径 |
| items[].selectedIcon | string | ❌ | - | 选中图标路径 |
| items[].badge | string\|number | ❌ | - | 红点提示内容 |
| items[].disabled | boolean | ❌ | false | 是否禁用 |
| items[].pageId | string | ❌ | - | 点击后跳转的页面ID |
| selectedIndex | number | ❌ | 0 | 当前选中的标签索引 |
| backgroundColor | string | ❌ | "#FFFFFF" | 背景色 |
| height | number | ❌ | 56 | 标签栏高度 |
| showDivider | boolean | ❌ | true | 是否显示顶部边框 |
| actions | object | ❌ | - | 交互动作 |

#### 使用示例
```json
{
  "type": "tabBar",
  "selectedIndex": 0,
  "backgroundColor": "#FFFFFF",
  "height": 56,
  "showDivider": true,
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
      "pageId": "profile",
      "badge": 5
    }
  ]
}
```

---

## 2. 内容与列表组件

### 2.1 Grid (宫格)

宫格组件，支持动态行列配置，用于展示图标+文字的网格布局。

#### 基础结构
```typescript
interface Grid {
  type: "grid";
  rowCount: number;
  colCount: number;
  spacing: number;
  padding: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  items: GridItem[];
  scrollDirection?: "vertical" | "horizontal";
  scrollable?: boolean;
  actions?: {
    onItemClick?: Action;
  };
}

interface GridItem {
  icon?: string;
  text: string;
  badge?: string | number;
  disabled?: boolean;
  backgroundColor?: string;
  borderRadius?: number;
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "grid" | 组件类型标识 |
| rowCount | number | ❌ | 2 | 行数 |
| colCount | number | ❌ | 4 | 列数 |
| spacing | number | ❌ | 16 | 网格间距（像素） |
| spacing说明 | - | - | - | 每个网格之间的间距 |
| padding | object | ❌ | {top:0, bottom:0, left:0, right:0} | 内边距 |
| items | array | ✅ | - | 网格项数组 |
| items[].icon | string | ❌ | - | 图标路径 |
| items[].text | string | ✅ | - | 文本内容 |
| items[].badge | string\|number | ❌ | - | 红点提示 |
| items[].disabled | boolean | ❌ | false | 是否禁用 |
| items[].backgroundColor | string | ❌ | "#FFFFFF" | 单元格背景色 |
| items[].borderRadius | number | ❌ | 8 | 单元格圆角半径 |
| scrollDirection | enum | ❌ | "vertical" | 滚动方向 |
| scrollable | boolean | ❌ | true | 是否可滚动 |
| actions | object | ❌ | - | 交互动作 |

#### 使用示例
```json
{
  "type": "grid",
  "rowCount": 2,
  "colCount": 4,
  "spacing": 16,
  "padding": {
    "top": 16,
    "bottom": 16,
    "left": 16,
    "right": 16
  },
  "scrollDirection": "vertical",
  "scrollable": true,
  "items": [
    {
      "icon": "/icons/payment.png",
      "text": "转账汇款",
      "badge": "NEW"
    },
    {
      "icon": "/icons/bill.png",
      "text": "账单查询"
    },
    {
      "icon": "/icons/invest.png",
      "text": "理财投资"
    },
    {
      "icon": "/icons/loan.png",
      "text": "贷款服务"
    },
    {
      "icon": "/icons/vip.png",
      "text": "会员中心"
    },
    {
      "icon": "/icons/activity.png",
      "text": "活动专区",
      "disabled": true
    },
    {
      "icon": "/icons/help.png",
      "text": "帮助中心"
    },
    {
      "icon": "/icons/settings.png",
      "text": "设置"
    }
  ]
}
```

---

### 2.2 List (列表)

列表组件，支持多种单元格样式。

#### 基础结构
```typescript
interface List {
  type: "list";
  items: ListItem[];
  divider?: {
    show: boolean;
    color: string;
    height: number;
    leftInset: number;
  };
  padding: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  scrollable?: boolean;
  actions?: {
    onItemClick?: Action;
  };
}

interface ListItem {
  type: "text" | "iconText" | "avatarText" | "custom";
  title?: string;
  subtitle?: string;
  accessory?: "none" | "arrow" | "switch" | "check";
  icon?: string;
  avatar?: string;
  disabled?: boolean;
  switchValue?: boolean;
  onClickAction?: Action;
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "list" | 组件类型标识 |
| items | array | ✅ | - | 列表项数组 |
| items[].type | enum | ✅ | - | 列表项类型 |
| items[].type值说明 | - | - | - | text:纯文本; iconText:图标+文本; avatarText:头像+文本 |
| items[].title | string | ❌ | - | 主标题 |
| items[].subtitle | string | ❌ | - | 副标题 |
| items[].accessory | enum | ❌ | "none" | 右侧元素：无/箭头/开关/勾选 |
| items[].icon | string | ❌ | - | 图标路径（type="iconText"时） |
| items[].avatar | string | ❌ | - | 头像路径（type="avatarText"时） |
| items[].disabled | boolean | ❌ | false | 是否禁用 |
| items[].switchValue | boolean | ❌ | false | 开关状态（accessory="switch"时） |
| items[].onClickAction | Action | ❌ | - | 点击动作 |
| divider.show | boolean | ❌ | true | 是否显示分隔线 |
| divider.color | string | ❌ | "#E5E5E5" | 分隔线颜色 |
| divider.height | number | ❌ | 1 | 分隔线高度（像素） |
| divider.leftInset | number | ❌ | 56 | 左侧内缩（像素） |
| padding | object | ❌ | {top:0, bottom:0, left:0, right:0} | 内边距 |
| scrollable | boolean | ❌ | true | 是否可滚动 |

#### 使用示例
```json
{
  "type": "list",
  "divider": {
    "show": true,
    "color": "#E5E5E5",
    "height": 1,
    "leftInset": 56
  },
  "padding": {
    "top": 0,
    "bottom": 0,
    "left": 0,
    "right": 0
  },
  "scrollable": true,
  "items": [
    {
      "type": "iconText",
      "title": "账户设置",
      "icon": "/icons/account.png",
      "accessory": "arrow",
      "onClickAction": {
        "type": "navigateTo",
        "pageId": "account-settings"
      }
    },
    {
      "type": "iconText",
      "title": "隐私设置",
      "icon": "/icons/privacy.png",
      "accessory": "arrow"
    },
    {
      "type": "iconText",
      "title": "通知设置",
      "subtitle": "推送消息和系统通知",
      "icon": "/icons/notification.png",
      "accessory": "switch",
      "switchValue": true
    },
    {
      "type": "avatarText",
      "title": "张三",
      "subtitle": "在线",
      "avatar": "/avatars/user1.png",
      "accessory": "arrow"
    }
  ]
}
```

---

### 2.3 Card (卡片)

卡片组件，用于组织内容。

#### 基础结构
```typescript
interface Card {
  type: "card";
  title?: string;
  subtitle?: string;
  elevation?: number;
  borderRadius?: number;
  backgroundColor?: string;
  padding: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  children: Component[];
  onClickAction?: Action;
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "card" | 组件类型标识 |
| title | string | ❌ | - | 卡片标题 |
| subtitle | string | ❌ | - | 卡片副标题 |
| elevation | number | ❌ | 2 | 阴影层级（0-24） |
| borderRadius | number | ❌ | 8 | 圆角半径（像素） |
| backgroundColor | string | ❌ | "#FFFFFF" | 背景色 |
| padding | object | ❌ | {top:16, bottom:16, left:16, right:16} | 内边距 |
| children | array | ✅ | - | 子组件数组 |
| onClickAction | Action | ❌ | - | 点击动作 |

#### 使用示例
```json
{
  "type": "card",
  "title": "今日收益",
  "subtitle": "2026-02-26",
  "elevation": 2,
  "borderRadius": 12,
  "backgroundColor": "#FFFFFF",
  "padding": {
    "top": 16,
    "bottom": 16,
    "left": 16,
    "right": 16
  },
  "children": [
    {
      "type": "text",
      "content": "+1,234.56 元",
      "style": {
        "fontSize": 32,
        "fontWeight": "bold",
        "color": "#FF5722"
      }
    }
  ],
  "onClickAction": {
    "type": "navigateTo",
    "pageId": "profit-detail"
  }
}
```

---

### 2.4 Carousel (轮播图)

轮播图组件，支持自动播放和手动切换。

#### 基础结构
```typescript
interface Carousel {
  type: "carousel";
  items: CarouselItem[];
  autoPlay?: boolean;
  interval?: number;  // 自动播放间隔（毫秒）
  showIndicator?: boolean;
  indicatorStyle?: "dots" | "numbers" | "fraction";
  loop?: boolean;
  aspectRatio?: number;  // 宽高比
  actions?: {
    onItemChange?: Action;
    onItemClick?: Action;
  };
}

interface CarouselItem {
  type: "image" | "text" | "custom";
  src?: string;
  text?: string;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "carousel" | 组件类型标识 |
| items | array | ✅ | - | 轮播项数组（至少1个） |
| items[].type | enum | ✅ | - | 轮播项类型：图片/文本/自定义 |
| items[].src | string | ❌ | - | 图片路径（type="image"时） |
| items[].text | string | ❌ | - | 文本内容（type="text"时） |
| items[].title | string | ❌ | - | 标题 |
| items[].subtitle | string | ❌ | - | 副标题 |
| items[].backgroundColor | string | ❌ | - | 背景色 |
| autoPlay | boolean | ❌ | true | 是否自动播放 |
| interval | number | ❌ | 3000 | 自动播放间隔（毫秒） |
| showIndicator | boolean | ❌ | true | 是否显示指示器 |
| indicatorStyle | enum | ❌ | "dots" | 指示器样式：圆点/数字/分数 |
| loop | boolean | ❌ | true | 是否循环播放 |
| aspectRatio | number | ❌ | 16/9 | 宽高比 |
| actions | object | ❌ | - | 交互动作 |

#### 使用示例
```json
{
  "type": "carousel",
  "autoPlay": true,
  "interval": 3000,
  "showIndicator": true,
  "indicatorStyle": "dots",
  "loop": true,
  "aspectRatio": 16/9,
  "items": [
    {
      "type": "image",
      "src": "/images/banner1.jpg",
      "title": "新用户专享",
      "subtitle": "限时优惠"
    },
    {
      "type": "image",
      "src": "/images/banner2.jpg",
      "title": "理财产品推荐"
    },
    {
      "type": "image",
      "src": "/images/banner3.jpg",
      "title": "会员福利"
    }
  ]
}
```

---

## 3. 表单与反馈组件

### 3.1 Input (输入框)

输入框组件，支持多种格式和验证。

#### 基础结构
```typescript
interface Input {
  type: "input";
  inputType: "text" | "number" | "password" | "email" | "phone" | "idCard";
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readonly?: boolean;
  showClear?: boolean;
  maxLength?: number;
  errorMessage?: string;
  style: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    padding: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
  };
  actions?: {
    onChange?: Action;
    onFocus?: Action;
    onBlur?: Action;
    onClear?: Action;
  };
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "input" | 组件类型标识 |
| inputType | enum | ✅ | "text" | 输入类型 |
| inputType值说明 | - | - | - | text:文本; number:数字; password:密码; email:邮箱; phone:手机号; idCard:身份证 |
| placeholder | string | ❌ | - | 占位符文本 |
| value | string | ❌ | - | 输入值（受控组件） |
| defaultValue | string | ❌ | - | 默认值（非受控组件） |
| disabled | boolean | ❌ | false | 是否禁用 |
| readonly | boolean | ❌ | false | 是否只读 |
| showClear | boolean | ❌ | true | 是否显示清除按钮 |
| maxLength | number | ❌ | - | 最大输入长度 |
| errorMessage | string | ❌ | - | 错误提示信息 |
| style.fontSize | number | ❌ | 16 | 字体大小 |
| style.color | string | ❌ | "#000000" | 文字颜色 |
| style.backgroundColor | string | ❌ | "#FFFFFF" | 背景色 |
| style.borderRadius | number | ❌ | 8 | 圆角半径（像素） |
| style.borderWidth | number | ❌ | 1 | 边框宽度（像素） |
| style.borderColor | string | ❌ | "#E5E5E5" | 边框颜色 |
| style.padding | object | ❌ | {top:12, bottom:12, left:16, right:16} | 内边距 |
| actions | object | ❌ | - | 交互动作 |

#### 使用示例
```json
{
  "type": "input",
  "inputType": "phone",
  "placeholder": "请输入手机号",
  "defaultValue": "",
  "disabled": false,
  "readonly": false,
  "showClear": true,
  "maxLength": 11,
  "errorMessage": "",
  "style": {
    "fontSize": 16,
    "color": "#000000",
    "backgroundColor": "#FFFFFF",
    "borderRadius": 8,
    "borderWidth": 1,
    "borderColor": "#E5E5E5",
    "padding": {
      "top": 12,
      "bottom": 12,
      "left": 16,
      "right": 16
    }
  }
}
```

---

### 3.2 Picker (选择器)

选择器组件，支持单选、多选、日期选择等。

#### 基础结构
```typescript
interface Picker {
  type: "picker";
  pickerType: "single" | "multiple" | "date" | "time" | "datetime";
  placeholder?: string;
  value?: any;
  defaultValue?: any;
  disabled?: boolean;
  options?: PickerOption[];
  minDate?: string;  // YYYY-MM-DD
  maxDate?: string;  // YYYY-MM-DD
  format?: string;  // 日期格式化模板
  actions?: {
    onChange?: Action;
    onConfirm?: Action;
    onCancel?: Action;
  };
}

interface PickerOption {
  label: string;
  value: any;
  disabled?: boolean;
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "picker" | 组件类型标识 |
| pickerType | enum | ✅ | "single" | 选择器类型 |
| pickerType值说明 | - | - | - | single:单选; multiple:多选; date:日期; time:时间; datetime:日期时间 |
| placeholder | string | ❌ | "请选择" | 占位符文本 |
| value | any | ❌ | - | 选中值（受控组件） |
| defaultValue | any | ❌ | - | 默认值（非受控组件） |
| disabled | boolean | ❌ | false | 是否禁用 |
| options | array | ❌ | - | 选项数组（pickerType="single"\|"multiple"时） |
| options[].label | string | ✅ | - | 选项标签 |
| options[].value | any | ✅ | - | 选项值 |
| options[].disabled | boolean | ❌ | false | 是否禁用 |
| minDate | string | ❌ | - | 最小日期（YYYY-MM-DD） |
| maxDate | string | ❌ | - | 最大日期（YYYY-MM-DD） |
| format | string | ❌ | "YYYY-MM-DD" | 日期格式化模板 |
| actions | object | ❌ | - | 交互动作 |

#### 使用示例
```json
{
  "type": "picker",
  "pickerType": "single",
  "placeholder": "请选择城市",
  "defaultValue": "beijing",
  "disabled": false,
  "options": [
    {
      "label": "北京",
      "value": "beijing"
    },
    {
      "label": "上海",
      "value": "shanghai"
    },
    {
      "label": "广州",
      "value": "guangzhou"
    },
    {
      "label": "深圳",
      "value": "shenzhen"
    }
  ]
}
```

---

### 3.3 Modal (模态弹窗)

模态弹窗组件，用于显示重要信息或进行交互。

#### 基础结构
```typescript
interface Modal {
  type: "modal";
  title?: string;
  content: string | Component[];
  buttons: ModalButton[];
  closable?: boolean;
  maskClosable?: boolean;
  width?: number;
  backgroundColor?: string;
  actions?: {
    onShow?: Action;
    onClose?: Action;
    onButtonClick?: Action;
  };
}

interface ModalButton {
  text: string;
  type?: "primary" | "secondary" | "danger" | "default";
  disabled?: boolean;
  onClickAction?: Action;
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "modal" | 组件类型标识 |
| title | string | ❌ | - | 弹窗标题 |
| content | string\|array | ✅ | - | 弹窗内容（文本或组件） |
| buttons | array | ✅ | - | 按钮数组（至少1个） |
| buttons[].text | string | ✅ | - | 按钮文本 |
| buttons[].type | enum | ❌ | "default" | 按钮类型：主要/次要/危险/默认 |
| buttons[].disabled | boolean | ❌ | false | 是否禁用 |
| buttons[].onClickAction | Action | ❌ | - | 点击动作 |
| closable | boolean | ❌ | true | 是否可关闭（右上角X） |
| maskClosable | boolean | ❌ | true | 点击遮罩是否关闭 |
| width | number | ❌ | 320 | 弹窗宽度（像素） |
| backgroundColor | string | ❌ | "#FFFFFF" | 背景色 |
| actions | object | ❌ | - | 交互动作 |

#### 使用示例
```json
{
  "type": "modal",
  "title": "确认删除",
  "content": "确定要删除这条记录吗？此操作不可恢复。",
  "closable": true,
  "maskClosable": true,
  "width": 320,
  "backgroundColor": "#FFFFFF",
  "buttons": [
    {
      "text": "取消",
      "type": "secondary"
    },
    {
      "text": "确认删除",
      "type": "danger",
      "onClickAction": {
        "type": "request",
        "url": "/api/delete-record",
        "method": "POST"
      }
    }
  ]
}
```

---

### 3.4 Toast (轻提示)

轻提示组件，用于显示操作反馈。

#### 基础结构
```typescript
interface Toast {
  type: "toast";
  message: string;
  duration?: number;  // 显示时长（毫秒）
  position?: "top" | "center" | "bottom";
  icon?: "success" | "error" | "info" | "warning" | "none";
  mask?: boolean;  // 是否显示遮罩
  actions?: {
    onShow?: Action;
    onHide?: Action;
  };
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "toast" | 组件类型标识 |
| message | string | ✅ | - | 提示内容 |
| duration | number | ❌ | 2000 | 显示时长（毫秒） |
| position | enum | ❌ | "center" | 显示位置 |
| icon | enum | ❌ | "none" | 图标类型 |
| icon值说明 | - | - | - | success:成功; error:错误; info:信息; warning:警告; none:无图标 |
| mask | boolean | ❌ | false | 是否显示遮罩 |
| actions | object | ❌ | - | 交互动作 |

#### 使用示例
```json
{
  "type": "toast",
  "message": "操作成功",
  "duration": 2000,
  "position": "center",
  "icon": "success",
  "mask": false
}
```

---

### 3.5 ActionSheet (动作面板)

动作面板组件，从底部弹出的操作菜单。

#### 基础结构
```typescript
interface ActionSheet {
  type: "actionSheet";
  title?: string;
  items: ActionSheetItem[];
  cancelButton?: {
    text: string;
    onClickAction?: Action;
  };
  maskClosable?: boolean;
  backgroundColor?: string;
  actions?: {
    onShow?: Action;
    onHide?: Action;
    onItemClick?: Action;
  };
}

interface ActionSheetItem {
  text: string;
  type?: "normal" | "danger" | "disabled";
  disabled?: boolean;
  onClickAction?: Action;
}
```

#### 属性说明

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | ✅ | "actionSheet" | 组件类型标识 |
| title | string | ❌ | - | 面板标题 |
| items | array | ✅ | - | 操作项数组（至少1个） |
| items[].text | string | ✅ | - | 操作项文本 |
| items[].type | enum | ❌ | "normal" | 操作项类型：正常/危险/禁用 |
| items[].disabled | boolean | ❌ | false | 是否禁用 |
| items[].onClickAction | Action | ❌ | - | 点击动作 |
| cancelButton | object | ❌ | - | 取消按钮 |
| cancelButton.text | string | ✅ | - | 取消按钮文本 |
| cancelButton.onClickAction | Action | ❌ | - | 点击动作 |
| maskClosable | boolean | ❌ | true | 点击遮罩是否关闭 |
| backgroundColor | string | ❌ | "#FFFFFF" | 背景色 |
| actions | object | ❌ | - | 交互动作 |

#### 使用示例
```json
{
  "type": "actionSheet",
  "title": "选择操作",
  "items": [
    {
      "text": "保存到相册",
      "type": "normal",
      "onClickAction": {
        "type": "request",
        "url": "/api/save-to-album"
      }
    },
    {
      "text": "分享给好友",
      "type": "normal",
      "onClickAction": {
        "type": "showModal",
        "modalId": "share-modal"
      }
    },
    {
      "text": "删除",
      "type": "danger",
      "onClickAction": {
        "type": "request",
        "url": "/api/delete",
        "method": "DELETE"
      }
    }
  ],
  "cancelButton": {
    "text": "取消"
  },
  "maskClosable": true
}
```

---

## 4. 组件通用属性

### 4.1 基础属性

所有组件都支持的通用属性：

```typescript
interface BaseComponent {
  id?: string;  // 组件唯一标识
  type: string;  // 组件类型（必填）
  hidden?: boolean;  // 是否隐藏
  disabled?: boolean;  // 是否禁用
  style?: {
    margin?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
    opacity?: number;  // 透明度（0-1）
    transform?: {
      scale?: number;
      rotate?: number;
      translateX?: number;
      translateY?: number;
    };
  };
  actions?: {
    onClick?: Action;
    onLongPress?: Action;
    onLoad?: Action;
  };
}
```

### 4.2 通用样式属性

```typescript
interface CommonStyle {
  backgroundColor?: string;  // 背景色
  backgroundImage?: string;  // 背景图片
  backgroundSize?: "cover" | "contain" | "auto";
  borderRadius?: number;  // 圆角半径（像素）
  borderWidth?: number;  // 边框宽度
  borderColor?: string;  // 边框颜色
  boxShadow?: string;  // 阴影样式（CSS box-shadow）
  opacity?: number;  // 透明度（0-1）
  overflow?: "visible" | "hidden" | "scroll" | "auto";
}
```

### 4.3 文本组件

```typescript
interface Text {
  type: "text";
  content: string;
  style: {
    fontSize: number;
    fontWeight: "normal" | "bold" | "semibold";
    color: string;
    textAlign?: "left" | "center" | "right";
    lineHeight?: number;  // 行高
    letterSpacing?: number;  // 字间距
    textDecoration?: "none" | "underline" | "line-through";
  };
}
```

### 4.4 图片组件

```typescript
interface Image {
  type: "image";
  src: string;
  alt?: string;
  mode?: "aspectFit" | "aspectFill" | "scaleToFill" | "widthFix" | "heightFix";
  width?: number;
  height?: number;
  borderRadius?: number;
  onClickAction?: Action;
}
```

### 4.5 按钮组件

```typescript
interface Button {
  type: "button";
  text: string;
  buttonType?: "primary" | "secondary" | "danger" | "default";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style: {
    backgroundColor?: string;
    color?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
  };
  onClickAction?: Action;
}
```

---

## 5. JSON Schema完整定义

### 5.1 顶层App结构

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProtoFlow App Schema v2.0",
  "description": "ProtoFlow移动端APP原型JSON Schema定义",
  "type": "object",
  "required": ["version", "app"],
  "properties": {
    "version": {
      "type": "string",
      "description": "Schema版本号",
      "default": "2.0.0"
    },
    "app": {
      "type": "object",
      "description": "APP配置",
      "required": ["id", "name", "pages", "tabBar"],
      "properties": {
        "id": {
          "type": "string",
          "description": "APP唯一标识"
        },
        "name": {
          "type": "string",
          "description": "APP名称"
        },
        "description": {
          "type": "string",
          "description": "APP描述"
        },
        "pages": {
          "type": "array",
          "description": "页面数组",
          "minItems": 1,
          "items": {
            "$ref": "#/definitions/Page"
          }
        },
        "tabBar": {
          "$ref": "#/definitions/TabBar"
        },
        "router": {
          "$ref": "#/definitions/Router"
        },
        "theme": {
          "type": "object",
          "description": "主题配置",
          "properties": {
            "primaryColor": {
              "type": "string",
              "default": "#1890FF"
            },
            "secondaryColor": {
              "type": "string",
              "default": "#52C41A"
            },
            "errorColor": {
              "type": "string",
              "default": "#FF4D4F"
            },
            "warningColor": {
              "type": "string",
              "default": "#FAAD14"
            },
            "textColor": {
              "type": "string",
              "default": "#000000"
            },
            "backgroundColor": {
              "type": "string",
              "default": "#FFFFFF"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "Page": {
      "type": "object",
      "required": ["id", "name", "componentTree"],
      "properties": {
        "id": {
          "type": "string",
          "description": "页面唯一标识"
        },
        "name": {
          "type": "string",
          "description": "页面名称"
        },
        "description": {
          "type": "string",
          "description": "页面描述"
        },
        "componentTree": {
          "type": "object",
          "description": "组件树",
          "$ref": "#/definitions/Component"
        }
      }
    },
    "Component": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "statusBar",
            "navBar",
            "safeArea",
            "tabBar",
            "grid",
            "list",
            "card",
            "carousel",
            "input",
            "picker",
            "modal",
            "toast",
            "actionSheet",
            "text",
            "image",
            "button"
          ]
        },
        "id": {
          "type": "string"
        },
        "hidden": {
          "type": "boolean"
        },
        "disabled": {
          "type": "boolean"
        },
        "style": {
          "$ref": "#/definitions/CommonStyle"
        },
        "actions": {
          "$ref": "#/definitions/Actions"
        }
      }
    },
    "Actions": {
      "type": "object",
      "properties": {
        "onClick": {
          "$ref": "#/definitions/Action"
        },
        "onLongPress": {
          "$ref": "#/definitions/Action"
        },
        "onLoad": {
          "$ref": "#/definitions/Action"
        }
      }
    },
    "Action": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "navigateTo",
            "switchTab",
            "back",
            "showModal",
            "hideModal",
            "showToast",
            "showActionSheet",
            "request",
            "updateState",
            "none"
          ]
        },
        "pageId": {
          "type": "string",
          "description": "目标页面ID（type=navigateTo时必填）"
        },
        "tabIndex": {
          "type": "number",
          "description": "目标Tab索引（type=switchTab时必填）"
        },
        "modalId": {
          "type": "string",
          "description": "模态弹窗ID（type=showModal时必填）"
        },
        "toast": {
          "$ref": "#/definitions/Toast"
        },
        "actionSheet": {
          "$ref": "#/definitions/ActionSheet"
        },
        "request": {
          "$ref": "#/definitions/Request"
        },
        "updateState": {
          "$ref": "#/definitions/UpdateState"
        }
      }
    },
    "Router": {
      "type": "object",
      "description": "路由配置",
      "properties": {
        "mode": {
          "type": "string",
          "enum": ["stack", "tab"],
          "default": "tab"
        },
        "initialPageId": {
          "type": "string",
          "description": "初始页面ID"
        },
        "historyLimit": {
          "type": "number",
          "description": "历史栈最大深度",
          "default": 10
        }
      }
    },
    "Request": {
      "type": "object",
      "description": "网络请求配置",
      "required": ["url", "method"],
      "properties": {
        "url": {
          "type": "string",
          "description": "请求URL"
        },
        "method": {
          "type": "string",
          "enum": ["GET", "POST", "PUT", "DELETE"]
        },
        "headers": {
          "type": "object",
          "description": "请求头"
        },
        "data": {
          "type": "object",
          "description": "请求数据"
        },
        "successAction": {
          "$ref": "#/definitions/Action",
          "description": "成功后的动作"
        },
        "errorAction": {
          "$ref": "#/definitions/Action",
          "description": "失败后的动作"
        }
      }
    },
    "UpdateState": {
      "type": "object",
      "description": "更新状态配置",
      "required": ["componentId", "updates"],
      "properties": {
        "componentId": {
          "type": "string",
          "description": "目标组件ID"
        },
        "updates": {
          "type": "object",
          "description": "要更新的属性"
        }
      }
    }
  }
}
```

---

## 附录

### A. 颜色规范

| 颜色名称 | Hex值 | RGB值 | 用途 |
|---------|--------|-------|------|
| 主色 | #1890FF | 24, 144, 255 | 主要操作、强调元素 |
| 成功色 | #52C41A | 82, 196, 26 | 成功状态、正向提示 |
| 警告色 | #FAAD14 | 250, 173, 20 | 警告状态、注意提示 |
| 错误色 | #FF4D4F | 255, 77, 79 | 错误状态、危险操作 |
| 信息色 | #1890FF | 24, 144, 255 | 信息提示 |
| 文本色 | #000000 | 0, 0, 0 | 主要文本 |
| 次要文本 | #595959 | 89, 89, 89 | 次要文本 |
| 禁用文本 | #BFBFBF | 191, 191, 191 | 禁用状态文本 |
| 边框色 | #E5E5E5 | 229, 229, 229 | 边框、分隔线 |
| 背景色 | #FFFFFF | 255, 255, 255 | 页面背景 |
| 遮罩色 | rgba(0,0,0,0.45) | 0, 0, 0, 0.45 | 遮罩层 |

### B. 字号规范

| 字号类型 | 像素值 | 行高 | 用途 |
|---------|--------|------|------|
| 标题1 | 24px | 32px | 页面主标题 |
| 标题2 | 20px | 28px | 次级标题 |
| 标题3 | 18px | 26px | 三级标题 |
| 正文 | 16px | 24px | 正文内容 |
| 辅助文本 | 14px | 22px | 辅助说明 |
| 小字 | 12px | 18px | 提示、标签 |

### C. 间距规范

| 间距类型 | 像素值 | 用途 |
|---------|--------|------|
| 极小间距 | 4px | 元素间微小间隙 |
| 小间距 | 8px | 紧凑布局 |
| 基础间距 | 12px | 常规布局 |
| 中等间距 | 16px | 标准布局 |
| 大间距 | 24px | 宽松布局 |
| 极大间距 | 32px | 模块分隔 |

### D. 组件尺寸

| 组件类型 | 默认高度 | 用途 |
|---------|---------|------|
| StatusBar | 44px (iOS) / 24px (Android) | 状态栏 |
| NavBar | 44px | 导航栏 |
| TabBar | 56px | 底部标签栏 |
| Button (small) | 32px | 小型按钮 |
| Button (medium) | 40px | 中型按钮 |
| Button (large) | 48px | 大型按钮 |
| Input | 44px | 输入框 |
| Card | 根据内容 | 卡片容器 |

---

**文档结束**
