// ProtoFlow Application - JSON配置解析器
class ProtoFlowApp {
    constructor(config) {
        this.config = config.app;
        this.currentPageId = this.config.router.initialPageId;
        this.pageHistory = [this.currentPageId];
        this.currentTab = 0;

        this.init();
    }

    // 初始化应用
    init() {
        this.renderTabBar();
        this.renderPage(this.currentPageId);
        this.updateInfo();
        this.bindEvents();
    }

    // 绑定事件
    bindEvents() {
        // 返回按钮
        const backButton = document.getElementById('nav-back');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.navigateBack();
            });
        }

        // 项目切换
        document.querySelectorAll('#project-nav .top-nav__item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.target.dataset.project;
                this.switchProject(projectId);
            });
        });
    }

    // 渲染Tab栏
    renderTabBar() {
        const tabBar = document.getElementById('tab-bar');
        if (!tabBar) return;

        const tabBarConfig = this.config.tabBar;
        if (!tabBarConfig) return;

        tabBar.innerHTML = tabBarConfig.items.map((item, index) => {
            const isActive = index === tabBarConfig.selectedIndex;
            return `
                <div class="tab-bar__item ${isActive ? 'tab-bar__item--active' : ''}" data-page="${item.pageId}" data-index="${index}">
                    <span class="tab-bar__icon">${isActive ? (item.selectedIcon || item.icon) : item.icon}</span>
                    <span class="tab-bar__text">${item.title}</span>
                </div>
            `;
        }).join('');

        // 绑定Tab点击事件
        tabBar.querySelectorAll('.tab-bar__item').forEach(tab => {
            tab.addEventListener('click', () => {
                const pageId = tab.dataset.page;
                const index = parseInt(tab.dataset.index);

                // 更新当前Tab
                this.currentTab = index;
                this.config.tabBar.selectedIndex = index;

                // 渲染Tab栏（更新激活状态）
                this.renderTabBar();

                // 渲染页面
                this.navigateTo(pageId);
            });
        });
    }

    // 渲染页面
    renderPage(pageId) {
        const page = this.config.pages.find(p => p.id === pageId);
        if (!page) {
            console.error(`页面不存在: ${pageId}`);
            return;
        }

        // 更新导航栏
        this.updateNavBar(page);

        // 渲染组件树
        const container = document.getElementById('phone-content');
        container.innerHTML = this.renderComponentTree(page.componentTree);

        // 添加进入动画
        container.classList.add('fade-in');
        setTimeout(() => {
            container.classList.remove('fade-in');
        }, 300);

        // 更新当前页面ID
        this.currentPageId = pageId;
        this.updateInfo();
    }

    // 更新导航栏
    updateNavBar(page) {
        const navTitle = document.getElementById('nav-title');
        const backButton = document.getElementById('nav-back');

        if (navTitle) {
            navTitle.textContent = page.name;
        }

        if (backButton) {
            // 如果不是首页且历史记录大于1，显示返回按钮
            const showBack = this.pageHistory.length > 1 && pageId !== this.config.router.initialPageId;
            backButton.style.display = showBack ? 'block' : 'none';
        }
    }

    // 渲染组件树
    renderComponentTree(component) {
        if (!component) return '';

        const type = component.type;

        switch (type) {
            case 'safeArea':
                return this.renderSafeArea(component);
            case 'statusBar':
                return this.renderStatusBar(component);
            case 'navBar':
                return this.renderNavBar(component);
            case 'banner':
                return this.renderBanner(component);
            case 'section':
                return this.renderSection(component);
            case 'grid':
                return this.renderGrid(component);
            case 'card':
                return this.renderCard(component);
            case 'list':
                return this.renderList(component);
            case 'button':
                return this.renderButton(component);
            case 'input':
                return this.renderInput(component);
            case 'picker':
                return this.renderPicker(component);
            case 'text':
                return this.renderText(component);
            default:
                console.warn(`未知组件类型: ${type}`);
                return '';
        }
    }

    // 渲染SafeArea
    renderSafeArea(component) {
        if (!component.children) return '';

        return component.children.map(child => this.renderComponentTree(child)).join('');
    }

    // 渲染StatusBar
    renderStatusBar(component) {
        return ''; // 状态栏由HTML模板固定渲染
    }

    // 渲染NavBar
    renderNavBar(component) {
        return ''; // 导航栏由HTML模板固定渲染
    }

    // 渲染Banner
    renderBanner(component) {
        if (!component.items || component.items.length === 0) return '';

        const item = component.items[0];
        const action = item.onClickAction;

        const onClickAttr = action ? `onclick="app.handleAction('${JSON.stringify(action).replace(/'/g, "\\'")}')"` : '';

        return `
            <div class="banner" ${onClickAttr}>
                <div class="banner__title">${item.title || ''}</div>
                <div class="banner__subtitle">${item.subtitle || ''}</div>
            </div>
        `;
    }

    // 渲染Section
    renderSection(component) {
        const title = component.title || '';
        const children = component.children ? component.children.map(child => this.renderComponentTree(child)).join('') : '';
        const spacing = component.spacing || 16;

        return `
            <div class="section" style="padding-top: ${spacing}px;">
                ${title ? `<div class="section__title">${title}</div>` : ''}
                ${children}
            </div>
        `;
    }

    // 渲染Grid
    renderGrid(component) {
        if (!component.items) return '';

        return `
            <div class="grid">
                ${component.items.map(item => {
                    const icon = item.icon || '';
                    const text = item.text || '';
                    const action = item.onClickAction;

                    const onClickAttr = action ? `onclick="app.handleAction('${JSON.stringify(action).replace(/'/g, "\\'")}')"` : '';

                    return `
                        <div class="grid-item" ${onClickAttr}>
                            <div class="grid-item__icon">${icon}</div>
                            <div class="grid-item__text">${text}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 渲染Card
    renderCard(component) {
        const title = component.title || '';
        const children = component.children ? component.children.map(child => this.renderComponentTree(child)).join('') : '';

        return `
            <div class="card">
                ${title ? `<div class="card__title">${title}</div>` : ''}
                ${children}
            </div>
        `;
    }

    // 渲染List
    renderList(component) {
        if (!component.items) return '';

        return `
            <div class="list">
                ${component.items.map(item => {
                    const icon = item.icon || '';
                    const text = item.text || '';
                    const accessory = item.accessory || '';
                    const action = item.onClickAction;

                    const onClickAttr = action ? `onclick="app.handleAction('${JSON.stringify(action).replace(/'/g, "\\'")}')"` : '';

                    const accessoryHtml = accessory === 'arrow' ? '<span class="list-item__arrow">›</span>' : '';

                    return `
                        <div class="list-item" ${onClickAttr}>
                            ${icon ? `<div class="list-item__icon">${icon}</div>` : ''}
                            <div class="list-item__text">${text}</div>
                            ${accessoryHtml}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 渲染Button
    renderButton(component) {
        const text = component.text || '';
        const buttonType = component.buttonType || 'primary';
        const size = component.size || 'medium';
        const action = component.onClickAction;

        const onClickAttr = action ? `onclick="app.handleAction('${JSON.stringify(action).replace(/'/g, "\\'")}')"` : '';

        return `
            <div class="button-wrapper">
                <button class="btn btn--${buttonType} btn--${size}" ${onClickAttr}>${text}</button>
            </div>
        `;
    }

    // 渲染Input
    renderInput(component) {
        const inputType = component.inputType || 'text';
        const placeholder = component.placeholder || '';
        const maxLength = component.maxLength || '';

        return `
            <div class="input-wrapper">
                <input type="${inputType}" placeholder="${placeholder}" maxlength="${maxLength}" class="input" />
            </div>
        `;
    }

    // 渲染Picker
    renderPicker(component) {
        const placeholder = component.placeholder || '选择日期';
        const minDate = component.minDate || '';
        const maxDate = component.maxDate || '';

        return `
            <div class="input-wrapper">
                <input type="date" min="${minDate}" max="${maxDate}" class="input" />
            </div>
        `;
    }

    // 渲染Text
    renderText(component) {
        const content = component.content || '';
        const style = component.style || {};

        const styleStr = Object.entries(style).map(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${cssKey}: ${value}`;
        }).join('; ');

        return `<div style="${styleStr}">${content.replace(/\n/g, '<br>')}</div>`;
    }

    // 处理动作
    handleAction(actionString) {
        if (!actionString) return;

        const action = typeof actionString === 'string' ? JSON.parse(actionString) : actionString;

        switch (action.type) {
            case 'navigateTo':
                this.navigateTo(action.pageId);
                break;
            case 'back':
                this.navigateBack();
                break;
            case 'showToast':
                this.showToast(action.toast);
                break;
            default:
                console.warn(`未知动作类型: ${action.type}`);
        }
    }

    // 导航到指定页面
    navigateTo(pageId) {
        const page = this.config.pages.find(p => p.id === pageId);
        if (!page) {
            console.error(`页面不存在: ${pageId}`);
            return;
        }

        // 添加到历史记录
        this.pageHistory.push(pageId);

        // 渲染页面
        this.renderPage(pageId);
    }

    // 返回上一页
    navigateBack() {
        if (this.pageHistory.length <= 1) {
            return; // 已经是首页了
        }

        // 移除当前页面
        this.pageHistory.pop();

        // 获取上一页
        const previousPageId = this.pageHistory[this.pageHistory.length - 1];

        // 渲染上一页
        this.renderPage(previousPageId);
    }

    // 显示Toast
    showToast(toastConfig) {
        const message = toastConfig.message || '提示';
        const icon = toastConfig.icon || 'info';
        const duration = toastConfig.duration || 3000;

        // 显示Toast
        if (typeof showToast === 'function') {
            showToast(message, icon);
        } else {
            console.log(`Toast: ${message}`);
        }

        // 自动隐藏
        setTimeout(() => {
            // Toast会自动消失
        }, duration);
    }

    // 更新信息面板
    updateInfo() {
        const page = this.config.pages.find(p => p.id === this.currentPageId);
        if (!page) return;

        // 更新当前页面
        const currentPageEl = document.getElementById('current-page');
        if (currentPageEl) {
            currentPageEl.textContent = `${page.name} (${this.currentPageId})`;
        }

        // 更新页面描述
        const descriptionEl = document.getElementById('page-description');
        if (descriptionEl) {
            descriptionEl.textContent = page.description || '';
        }

        // 更新面包屑
        const breadcrumbEl = document.getElementById('page-breadcrumb');
        if (breadcrumbEl) {
            breadcrumbEl.innerHTML = `
                <li>✓ ${page.name} (${this.currentPageId})</li>
                ${this.pageHistory.slice(0, -1).reverse().map(pageId => {
                    const p = this.config.pages.find(page => page.id === pageId);
                    return `<li style="color: var(--color-text-tertiary);">${p ? `${p.name} (${pageId})` : pageId}</li>`;
                }).join('')}
            `;
        }
    }

    // 切换项目
    switchProject(projectId) {
        console.log(`切换项目: ${projectId}`);
        // TODO: 实现项目切换逻辑
        showToast('项目切换功能开发中', 'info');
    }
}
