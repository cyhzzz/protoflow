# GitHub Pages 部署指南

## 方法1：手动配置（推荐）

### 步骤1：配置GitHub Pages

1. 访问你的仓库：https://github.com/cyhzzz/protoflow
2. 点击 **Settings** 标签
3. 在左侧菜单找到 **Pages**
4. 配置如下：
   - **Source**: 选择 "Deploy from a branch"
   - **Branch**: 选择 "main" 和 "/ (root)"
   - 点击 **Save**

### 步骤2：等待部署

GitHub会自动运行构建，通常需要1-2分钟。部署完成后会显示：
```
Your site is live at https://cyhzzz.github.io/protoflow/
```

## 方法2：GitHub Actions自动部署（需要重新生成token）

### 步骤1：重新生成Personal Access Token

1. 访问：https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. 勾选权限：
   - ✅ `repo` (完整的仓库控制权限)
   - ✅ `workflow` (GitHub Actions工作流权限)
4. 点击 **Generate token**
5. **复制新token**（只显示一次）

### 步骤2：更新本地Git配置

```bash
cd /home/wuying/clawd/protoflow
git remote set-url origin https://新token@github.com/cyhzzz/protoflow.git
```

### 步骤3：推送工作流配置

工作流配置已经准备好，推送后会自动部署。

## 访问地址

部署成功后，访问：
```
https://cyhzzz.github.io/protoflow/
```

## 本地预览

### 开发模式
```bash
npm install
npm run dev
```
访问 http://localhost:3000

### 生产构建预览
```bash
npm run build
npm run preview
```

## 常见问题

### 404错误

**可能原因：**
1. GitHub Pages还在部署中，等待1-2分钟
2. Source设置错误，确认是 "main" 和 "/ (root)"
3. 没有dist目录，运行 `npm run build` 生成

**解决方法：**
```bash
# 本地构建测试
npm run build
ls dist  # 确认有index.html

# 检查GitHub Pages设置
# Settings -> Pages -> Source: Deploy from a branch
```

### 样式或资源404

**原因：** vite.config.ts中的base路径配置

**解决方法：** 确保vite.config.ts中设置了：
```typescript
export default defineConfig({
  base: '/protoflow/',  // 必须是仓库名
  // ...
})
```

### 构建失败

**检查：**
1. package.json中的scripts是否正确
2. TypeScript配置是否正确
3. 是否安装了所有依赖

```bash
npm install
npm run build
```

## 文件结构

```
protoflow/
├── dist/              # 构建产物（GitHub Pages使用）
│   └── index.html
├── src/               # 源代码
├── index.html         # HTML模板
├── vite.config.ts     # Vite配置
└── package.json       # 项目配置
```

## 技术说明

- **构建工具**: Vite 5.0
- **框架**: React 18 + TypeScript
- **部署**: GitHub Pages
- **自动部署**: GitHub Actions (可选)
