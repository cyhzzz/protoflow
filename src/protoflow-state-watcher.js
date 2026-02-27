/**
 * ProtoFlow with StateWatcher - 集成状态监听功能
 * 演示如何在现有架构中集成 StateWatcher
 */

class ProtoFlowAppWithStateWatcher {
    constructor(config) {
        this.config = config.app;
        this.state = this.config.state || {};
        this.currentPageId = this.config.router.initialPageId;
        this.pageHistory = [this.currentPageId];

        // 初始化表达式求值器
        this.evaluator = new ExpressionEvaluator();

        // 初始化可见性检查器
        this.visibilityChecker = new VisibilityChecker(this.evaluator);

        // 初始化状态监听器
        this.initStateWatcher();

        this.init();
    }

    /**
     * 初始化状态监听器
     */
    initStateWatcher() {
        // 创建 StateWatcher 实例
        this.stateWatcher = new StateWatcher(
            this.handleWatcherTrigger.bind(this),
            this.evaluator
        );

        // 收集所有组件中的 watch 配置
        this.collectWatchers();

        // 将实例暴露到全局，方便调试
        window.stateWatcher = this.stateWatcher;
    }

    /**
     * 收集组件中的 watch 配置
     */
    collectWatchers() {
        this.config.pages.forEach(page => {
            this.collectWatchersFromComponent(page.componentTree);
        });
    }

    /**
     * 递归收集组件中的 watch 配置
     */
    collectWatchersFromComponent(component) {
        if (!component) return;

        // 如果组件有 watch 配置，添加监听器
        if (component.watch) {
            for (const [path, watcherConfig] of Object.entries(component.watch)) {
                this.stateWatcher.addWatcher(path, watcherConfig);
                console.log(`👀 添加监听器: ${path}`, watcherConfig);
            }
        }

        // 递归处理子组件
        if (component.children) {
            if (Array.isArray(component.children)) {
                component.children.forEach(child => {
                    this.collectWatchersFromComponent(child);
                });
            } else {
                this.collectWatchersFromComponent(component.children);
            }
        }

        // 处理 grid/items
        if (component.items) {
            if (Array.isArray(component.items)) {
                component.items.forEach(item => {
                    this.collectWatchersFromComponent(item);
                });
            }
        }

        // 处理 list/items
        if (component.type === 'list' || component.type === 'grid') {
            if (component.items) {
                component.items.forEach(item => {
                    this.collectWatchersFromComponent(item);
                });
            }
        }
    }

    /**
     * 处理 Watcher 触发
     */
    handleWatcherTrigger(trigger, context) {
        console.log('🔔 Watcher 触发:', trigger);

        const { path, oldValue, newValue, watcher } = trigger;

        // 求值 action 参数
        const action = this.evaluator.evaluate(watcher.action, {
            ...context,
            state: this.state,
            oldValue,
            newValue
        });

        // 执行 action
        this.executeAction(action);
    }

    /**
     * 执行 action
     */
    executeAction(action) {
        if (!action || !action.type) {
            console.warn('无效的 action:', action);
            return;
        }

        console.log(`🎬 执行 Action: ${action.type}`, action);

        switch (action.type) {
            case 'showToast':
                this.showToast(action.toast);
                break;
            case 'navigateTo':
                console.log(`导航到页面: ${action.pageId}`);
                alert(`导航到: ${action.pageId}`);
                break;
            case 'back':
                console.log('返回上一页');
                alert('返回上一页');
                break;
            case 'validatePhone':
                this.validatePhone();
                break;
            default:
                console.warn(`未实现的 action 类型: ${action.type}`);
        }
    }

    /**
     * 显示 Toast
     */
    showToast(toastConfig) {
        const message = this.evaluator.evaluate(toastConfig.message, {
            state: this.state
        });

        console.log(`🍞 显示 Toast: ${message}`);
        window.showToast(message);
    }

    /**
     * 验证手机号
     */
    validatePhone() {
        const phone = this.state.form.phone;
        if (phone === '13800138000') {
            console.log('✅ 手机号正确');
        } else if (phone.length > 0) {
            console.log('❌ 手机号不正确');
        }
    }

    /**
     * 更新状态
     */
    setState(path, value) {
        const oldValue = this.getNestedValue(this.state, path);
        this.setNestedValue(this.state, path, value);

        // 通知状态变化
        this.stateWatcher.notify(path, value, oldValue, {
            state: this.state,
            computedFunctions: this.getComputedFunctions()
        });

        // 重新渲染
        this.renderPage(this.currentPageId);
    }

    /**
     * 获取嵌套值
     */
    getNestedValue(obj, path) {
        if (!path) return undefined;

        const keys = path.split('/');
        let current = obj;

        for (const key of keys) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = current[key];
        }

        return current;
    }

    /**
     * 设置嵌套值
     */
    setNestedValue(obj, path, value) {
        if (!path) return;

        const keys = path.split('/');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
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

        const container = document.getElementById('phone-content');
        const evaluationContext = {
            state: this.state,
            computedFunctions: this.getComputedFunctions()
        };

        // 渲染组件树
        container.innerHTML = this.renderComponentTree(
            page.componentTree,
            evaluationContext
        );

        this.currentPageId = pageId;
        this.updateInfo();
    }

    /**
     * 渲染组件树
     */
    renderComponentTree(component, context) {
        if (!component) return '';

        // 检查可见性
        if (!this.visibilityChecker.checkVisibility(component, context)) {
            return '';
        }

        const type = component.type;

        switch (type) {
            case 'safeArea':
                return this.renderSafeArea(component, context);
            case 'navBar':
                return this.renderNavBar(component, context);
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
            case 'input':
                return this.renderInput(component, context);
            case 'divider':
                return '<div class="divider"></div>';
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

        // 求值内容
        if (typeof content === 'object' && content !== null) {
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
        const subtext = this.evaluator.evaluate(component.subtext, context);
        const onClickAction = component.onClickAction;

        const onClickAttr = onClickAction
            ? `onclick="app.handleAction('${JSON.stringify(onClickAction).replace(/'/g, "\\'")}')" `
            : '';

        return `
            <div class="list-item" ${onClickAttr}>
                <div class="list-item__content">
                    <div class="list-item__text">${text || ''}</div>
                    ${subtext ? `<div class="list-item__subtext">${subtext}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 渲染 Button 组件
     */
    renderButton(component, context) {
        let text = component.text;
        if (typeof text === 'object' && text !== null) {
            text = this.evaluator.evaluate(text, context);
        }

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
     * 渲染 Input 组件
     */
    renderInput(component, context) {
        const inputType = component.inputType || 'text';
        const placeholder = component.placeholder || '';
        const maxLength = component.maxLength || null;

        const value = this.evaluator.evaluate(component.value, context);

        const maxLengthAttr = maxLength ? `maxlength="${maxLength}"` : '';
        const valueAttr = value ? `value="${value}"` : '';

        return `
            <div class="input-wrapper">
                <input
                    type="${inputType}"
                    class="input"
                    placeholder="${placeholder}"
                    ${maxLengthAttr}
                    ${valueAttr}
                    oninput="app.handleInput(event, '${component.value.$bindState || ''}')"
                />
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
     * 处理 Action（外部调用）
     */
    handleAction(actionString) {
        if (!actionString) return;

        const action = typeof actionString === 'string'
            ? JSON.parse(actionString)
            : actionString;

        // 更新状态并重新渲染
        switch (action.type) {
            case 'addToCart':
                this.addToCart(action.item);
                break;
            case 'clearCart':
                this.clearCart();
                break;
            case 'toggleVip':
                this.toggleVip();
                break;
            default:
                console.warn(`未知动作类型: ${action.type}`);
        }
    }

    /**
     * 处理输入
     */
    handleInput(event, path) {
        const value = event.target.value;
        this.setState(path, value);
    }

    /**
     * 添加到购物车
     */
    addToCart(item) {
        const path = `/cart/quantity/${item}`;
        const current = this.getNestedValue(this.state, path) || 0;
        this.setState(path, current + 1);

        // 更新总数
        const totalPath = '/cart/total';
        const total = this.getNestedValue(this.state, totalPath) || 0;
        this.setState(totalPath, total + 1);
    }

    /**
     * 清空购物车
     */
    clearCart() {
        this.state.cart.quantity = {
            iphone: 0,
            macbook: 0,
            airpods: 0
        };
        this.state.cart.total = 0;

        this.stateWatcher.notify('/cart', this.state.cart, undefined, {
            state: this.state,
            computedFunctions: this.getComputedFunctions()
        });

        this.renderPage(this.currentPageId);
    }

    /**
     * 切换VIP
     */
    toggleVip() {
        const path = '/user/vip';
        const current = this.state.user.vip || false;
        this.setState(path, !current);
    }

    /**
     * 获取计算函数
     */
    getComputedFunctions() {
        return {
            formatCurrency: (value) => {
                return new Intl.NumberFormat('zh-CN', {
                    style: 'currency',
                    currency: 'CNY'
                }).format(value);
            }
        };
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
        // 加载配置
        const response = await fetch('examples/state-watcher-demo.json');
        const config = await response.json();

        // 初始化应用
        window.app = new ProtoFlowAppWithStateWatcher(config);

        console.log('✅ ProtoFlow with StateWatcher 初始化成功！');
    } catch (error) {
        console.error('❌ 初始化失败:', error);
    }
});
