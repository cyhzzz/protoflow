/**
 * ProtoFlow Enhanced - 集成 ExpressionEvaluator 和 VisibilityChecker
 * 这是一个简化的演示，展示如何在现有架构中集成新功能
 */

// 假设 ExpressionEvaluator 和 VisibilityChecker 已经加载到全局
// 在实际项目中会通过模块化导入

class ProtoFlowAppEnhanced {
    constructor(config) {
        this.config = config.app;
        this.state = config.app.state || {};
        this.currentPageId = this.config.router.initialPageId;
        this.pageHistory = [this.currentPageId];

        // 初始化表达式求值器
        this.evaluator = new ExpressionEvaluator();

        // 初始化可见性检查器
        this.visibilityChecker = new VisibilityChecker(this.evaluator);

        this.init();
    }

    init() {
        this.renderPage(this.currentPageId);
        this.updateInfo();
    }

    /**
     * 渲染页面
     */
    renderPage(pageId) {
        const page = this.config.pages.find(p => p.id === pageId);
        if (!page) {
            console.error(`页面不存在: ${pageId}`);
            return;
        }

        const container = document.getElementById('phone-content-2');
        const evaluationContext = {
            state: this.state,
            computedFunctions: {
                formatCurrency: (value) => {
                    return new Intl.NumberFormat('zh-CN', {
                        style: 'currency',
                        currency: 'CNY'
                    }).format(value);
                },
                formatDate: (value) => {
                    return new Date(value).toLocaleDateString('zh-CN');
                }
            }
        };

        // 渲染组件树（带表达式求值和可见性检查）
        container.innerHTML = this.renderComponentTree(
            page.componentTree,
            evaluationContext
        );

        this.currentPageId = pageId;
        this.updateInfo();
    }

    /**
     * 渲染组件树（增强版）
     */
    renderComponentTree(component, context) {
        if (!component) return '';

        // 检查可见性
        if (!this.visibilityChecker.checkVisibility(component, context)) {
            return ''; // 不渲染不可见的元素
        }

        const type = component.type;

        switch (type) {
            case 'safeArea':
                return this.renderSafeArea(component, context);
            case 'navBar':
                return this.renderNavBar(component, context);
            case 'banner':
                return this.renderBanner(component, context);
            case 'section':
                return this.renderSection(component, context);
            case 'grid':
                return this.renderGrid(component, context);
            case 'gridItem':
                return this.renderGridItem(component, context);
            case 'card':
                return this.renderCard(component, context);
            case 'list':
                return this.renderList(component, context);
            case 'listItem':
                return this.renderListItem(component, context);
            case 'text':
                return this.renderText(component, context);
            case 'button':
                return this.renderButton(component, context);
            default:
                console.warn(`未知组件类型: ${type}`);
                return '';
        }
    }

    /**
     * 渲染 Text 组件（支持动态属性）
     */
    renderText(component, context) {
        const style = component.style || {};
        let content = component.content;

        // 求值内容（可能是静态值或表达式）
        if (typeof content === 'string') {
            content = content; // 静态文本
        } else if (typeof content === 'object' && content !== null) {
            content = this.evaluator.evaluate(content, context);
        }

        // 生成样式字符串
        const styleStr = Object.entries(style).map(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${cssKey}: ${value}`;
        }).join('; ');

        return `<div style="${styleStr}">${content || ''}</div>`;
    }

    /**
     * 渲染 Grid 组件（支持子元素可见性过滤）
     */
    renderGrid(component, context) {
        if (!component.items) return '';

        // 过滤可见的网格项
        const visibleItems = this.visibilityChecker.filterVisibleElements(
            component.items,
            context
        );

        return `
            <div class="grid">
                ${visibleItems.map(item => {
                    return this.renderComponentTree(item, context);
                }).join('')}
            </div>
        `;
    }

    /**
     * 渲染 GridItem 组件
     */
    renderGridItem(component, context) {
        const icon = this.evaluator.evaluate(component.icon, context);
        const text = this.evaluator.evaluate(component.text, context);

        const onClickAction = component.onClickAction;

        const onClickAttr = onClickAction
            ? `onclick="app.handleAction('${JSON.stringify(onClickAction).replace(/'/g, "\\'")}')" `
            : '';

        return `
            <div class="grid-item" ${onClickAttr}>
                <div class="grid-item__icon">${icon}</div>
                <div class="grid-item__text">${text}</div>
            </div>
        `;
    }

    /**
     * 渲染 Banner 组件（支持动态内容）
     */
    renderBanner(component, context) {
        if (!component.items || component.items.length === 0) return '';

        const item = component.items[0];

        // 求值标题和副标题
        const title = this.evaluator.evaluate(item.title, context);
        const subtitle = this.evaluator.evaluate(item.subtitle, context);
        const onClickAction = item.onClickAction;

        const onClickAttr = onClickAction
            ? `onclick="app.handleAction('${JSON.stringify(onClickAction).replace(/'/g, "\\'")}')" `
            : '';

        return `
            <div class="banner" ${onClickAttr}>
                <div class="banner__title">${title || ''}</div>
                <div class="banner__subtitle">${subtitle || ''}</div>
            </div>
        `;
    }

    /**
     * 渲染 Section 组件
     */
    renderSection(component, context) {
        const title = component.title || '';
        const children = component.children
            ? component.children.map(child => this.renderComponentTree(child, context)).join('')
            : '';
        const spacing = component.spacing || 16;

        return `
            <div class="section" style="padding-top: ${spacing}px;">
                ${title ? `<div class="section__title">${title}</div>` : ''}
                ${children}
            </div>
        `;
    }

    /**
     * 渲染 Card 组件
     */
    renderCard(component, context) {
        const title = component.title || '';
        const children = component.children
            ? component.children.map(child => this.renderComponentTree(child, context)).join('')
            : '';

        return `
            <div class="card">
                ${title ? `<div class="card__title">${title}</div>` : ''}
                ${children}
            </div>
        `;
    }

    /**
     * 渲染 List 组件
     */
    renderList(component, context) {
        if (!component.items) return '';

        // 过滤可见的列表项
        const visibleItems = this.visibilityChecker.filterVisibleElements(
            component.items,
            context
        );

        return `
            <div class="list">
                ${visibleItems.map(item => {
                    return this.renderComponentTree(item, context);
                }).join('')}
            </div>
        `;
    }

    /**
     * 渲染 ListItem 组件
     */
    renderListItem(component, context) {
        const text = this.evaluator.evaluate(component.text, context);
        const onClickAction = component.onClickAction;

        const onClickAttr = onClickAction
            ? `onclick="app.handleAction('${JSON.stringify(onClickAction).replace(/'/g, "\\'")}')" `
            : '';

        return `
            <div class="list-item" ${onClickAttr}>
                <div class="list-item__text">${text}</div>
            </div>
        `;
    }

    /**
     * 渲染 Button 组件（支持动态属性）
     */
    renderButton(component, context) {
        // 求值按钮文本
        let text = component.text;
        if (typeof text === 'string') {
            text = text;
        } else if (typeof text === 'object' && text !== null) {
            text = this.evaluator.evaluate(text, context);
        }

        // 求值disabled状态
        let disabled = false;
        if (component.disabled) {
            disabled = this.evaluator.evaluate(component.disabled, context);
        }

        const buttonType = component.buttonType || 'primary';
        const size = component.size || 'medium';
        const onClickAction = component.onClickAction;

        const onClickAttr = onClickAction
            ? `onclick="app.handleAction('${JSON.stringify(onClickAction).replace(/'/g, "\\'")}')" `
            : '';

        return `
            <div class="button-wrapper">
                <button class="btn btn--${buttonType} btn--${size}" ${disabled ? 'disabled' : ''} ${onClickAttr}>
                    ${text}
                </button>
            </div>
        `;
    }

    /**
     * 渲染 SafeArea 组件
     */
    renderSafeArea(component, context) {
        if (!component.children) return '';
        return component.children.map(child => this.renderComponentTree(child, context)).join('');
    }

    /**
     * 渲染 NavBar 组件
     */
    renderNavBar(component, context) {
        const title = component.title || '';
        return ''; // NavBar由HTML模板固定渲染
    }

    /**
     * 处理Action
     */
    handleAction(actionString) {
        if (!actionString) return;

        const action = typeof actionString === 'string'
            ? JSON.parse(actionString)
            : actionString;

        switch (action.type) {
            case 'navigateTo':
                console.log(`导航到页面: ${action.pageId}`);
                alert(`导航到: ${action.pageId}`);
                break;
            case 'back':
                console.log('返回上一页');
                alert('返回上一页');
                break;
            default:
                console.warn(`未知动作类型: ${action.type}`);
        }
    }

    /**
     * 更新信息面板
     */
    updateInfo() {
        console.log(`当前页面: ${this.currentPageId}`);
    }
}

// 全局应用实例
window.app = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 加载增强版配置
        const response = await fetch('examples/smart-customer-service-enhanced.json');
        const config = await response.json();

        // 初始化应用
        window.app = new ProtoFlowAppEnhanced(config);

        console.log('✅ ProtoFlow Enhanced 初始化成功！');
    } catch (error) {
        console.error('❌ 初始化失败:', error);
    }
});
