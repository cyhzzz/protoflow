// ProtoFlow Application State
class ProtoFlowApp {
    constructor() {
        this.currentProject = 'smart-customer-service';
        this.currentPage = 'home';
        this.pageHistory = [];
        this.projects = this.loadProjects();
        this.init();
    }

    init() {
        this.renderProjectNav();
        this.renderPhone();
        this.bindEvents();
    }

    // 加载项目数据
    loadProjects() {
        return {
            'smart-customer-service': {
                name: '智能客服',
                description: '银行智能客服系统原型',
                pages: {
                    'home': {
                        name: '首页',
                        description: '展示功能宫格和快捷入口',
                        render: () => this.renderSmartCustomerServiceHome()
                    },
                    'query-branch': {
                        name: '开户行查询',
                        description: '查询开户行信息',
                        render: () => this.renderQueryBranch()
                    },
                    'transfer-progress': {
                        name: '转账进度',
                        description: '查看转账汇款进度',
                        render: () => this.renderTransferProgress()
                    },
                    'transaction-query': {
                        name: '交易查询',
                        description: '查询交易明细',
                        render: () => this.renderTransactionQuery()
                    },
                    'profile': {
                        name: '我的',
                        description: '个人中心',
                        render: () => this.renderProfile()
                    }
                },
                tabBar: [
                    { id: 'home', icon: '🏠', activeIcon: '🏠', title: '首页' },
                    { id: 'transaction-query', icon: '💳', activeIcon: '💳', title: '交易' },
                    { id: 'profile', icon: '👤', activeIcon: '👤', title: '我的' }
                ]
            },
            'ecommerce': {
                name: '电商APP',
                description: '电商平台原型',
                pages: {
                    'home': {
                        name: '首页',
                        description: '商品分类和推荐',
                        render: () => this.renderEcommerceHome()
                    },
                    'product-list': {
                        name: '商品列表',
                        description: '浏览商品',
                        render: () => this.renderProductList()
                    },
                    'cart': {
                        name: '购物车',
                        description: '我的购物车',
                        render: () => this.renderCart()
                    },
                    'profile': {
                        name: '我的',
                        description: '个人中心',
                        render: () => this.renderProfile()
                    }
                },
                tabBar: [
                    { id: 'home', icon: '🏠', activeIcon: '🏠', title: '首页' },
                    { id: 'product-list', icon: '🛒', activeIcon: '🛒', title: '分类' },
                    { id: 'cart', icon: '🛍️', activeIcon: '🛍️', title: '购物车' },
                    { id: 'profile', icon: '👤', activeIcon: '👤', title: '我的' }
                ]
            },
            'finance': {
                name: '金融APP',
                description: '金融理财原型',
                pages: {
                    'home': {
                        name: '首页',
                        description: '账户总览',
                        render: () => this.renderFinanceHome()
                    },
                    'invest': {
                        name: '投资理财',
                        description: '理财产品',
                        render: () => this.renderInvest()
                    },
                    'transfer': {
                        name: '转账汇款',
                        description: '转账功能',
                        render: () => this.renderTransfer()
                    },
                    'profile': {
                        name: '我的',
                        description: '个人中心',
                        render: () => this.renderProfile()
                    }
                },
                tabBar: [
                    { id: 'home', icon: '🏠', activeIcon: '🏠', title: '首页' },
                    { id: 'invest', icon: '📈', activeIcon: '📈', title: '理财' },
                    { id: 'transfer', icon: '💸', activeIcon: '💸', title: '转账' },
                    { id: 'profile', icon: '👤', activeIcon: '👤', title: '我的' }
                ]
            }
        };
    }

    // 渲染项目导航
    renderProjectNav() {
        const nav = document.getElementById('project-nav');
        if (!nav) return;

        nav.innerHTML = '';
        Object.keys(this.projects).forEach(projectId => {
            const project = this.projects[projectId];
            const btn = document.createElement('button');
            btn.className = `top-nav__item ${projectId === this.currentProject ? 'top-nav__item--active' : ''}`;
            btn.textContent = project.name;
            btn.dataset.project = projectId;
            nav.appendChild(btn);
        });
    }

    // 渲染手机屏幕
    renderPhone() {
        const phoneScreen = document.getElementById('phone-screen');
        if (!phoneScreen) return;

        const project = this.projects[this.currentProject];
        const page = project.pages[this.currentPage];

        if (!page) return;

        phoneScreen.innerHTML = `
            <div class="status-bar">
                <span>9:41</span>
                <span>5G</span>
                <span>🔋</span>
            </div>
            <div class="nav-bar">
                ${this.renderBackButton()}
                <div class="nav-bar__title">${page.name}</div>
                <div style="width: 40px;"></div>
            </div>
            <div class="content slide-left">
                ${page.render()}
            </div>
            ${this.renderTabBar()}
        `;

        this.updateInfoPanel();
        this.bindPhoneEvents();
    }

    // 渲染返回按钮
    renderBackButton() {
        if (this.pageHistory.length === 0) {
            return '<div style="width: 40px;"></div>';
        }
        return `<button class="nav-bar__back" onclick="app.goBack()">←</button>`;
    }

    // 渲染TabBar
    renderTabBar() {
        const project = this.projects[this.currentProject];
        if (!project.tabBar) return '';

        const activeIndex = project.tabBar.findIndex(tab => tab.id === this.currentPage);

        return `
            <div class="tab-bar">
                ${project.tabBar.map((tab, index) => `
                    <div class="tab-item ${index === activeIndex ? 'tab-item--active' : ''}"
                         onclick="app.switchTab('${tab.id}')">
                        <div class="tab-item__icon">${tab.activeIcon}</div>
                        <div class="tab-item__text">${tab.title}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 智能客服首页
    renderSmartCustomerServiceHome() {
        return `
            <div class="carousel">
                <div class="carousel__title">新功能上线</div>
                <div class="carousel__subtitle">智能客服全面升级</div>
            </div>
            <div class="grid-section">
                <div class="section-title">快捷服务</div>
                <div class="grid">
                    ${this.renderGridItem('🏦', '开户行查询', 'query-branch')}
                    ${this.renderGridItem('💸', '转账进度', 'transfer-progress')}
                    ${this.renderGridItem('💳', '账户管理费', 'account-fee')}
                    ${this.renderGridItem('🛠️', '更多工具', 'more-tools')}
                    ${this.renderGridItem('💰', '贷款查询', 'loan-query')}
                    ${this.renderGridItem('📈', '理财查询', 'investment-query')}
                    ${this.renderGridItem('💳', '卡片服务', 'card-service')}
                    ${this.renderGridItem('🔒', '安全中心', 'security-center')}
                </div>
            </div>
            <div class="card">
                <div class="section-title">我关心的</div>
                <div class="list">
                    ${this.renderListItem('⏱️', '转账汇款到账时间？', 'transfer-time')}
                    ${this.renderListItem('💰', '手机银行转账手续费全免吗？', 'transfer-fee')}
                    ${this.renderListItem('📋', '如何查询13个月前的交易明细？', 'transaction-history')}
                    ${this.renderListItem('❓', '对最近的交易有疑问？', 'transaction-dispute')}
                </div>
            </div>
        `;
    }

    // 电商APP首页
    renderEcommerceHome() {
        return `
            <div class="carousel" style="background: linear-gradient(135deg, #FF6B6B, #FF8E53);">
                <div class="carousel__title">精选商品</div>
                <div class="carousel__subtitle">限时优惠，不容错过</div>
            </div>
            <div class="grid-section">
                <div class="section-title">商品分类</div>
                <div class="grid">
                    ${this.renderGridItem('👕', '服装', 'clothing')}
                    ${this.renderGridItem('👟', '鞋靴', 'shoes')}
                    ${this.renderGridItem('💄', '美妆', 'beauty')}
                    ${this.renderGridItem('⌚', '配饰', 'accessories')}
                    ${this.renderGridItem('📱', '数码', 'electronics')}
                    ${this.renderGridItem('🏠', '家居', 'home')}
                    ${this.renderGridItem('🍔', '食品', 'food')}
                    ${this.renderGridItem('📚', '图书', 'books')}
                </div>
            </div>
            <div class="card">
                <div class="section-title">为你推荐</div>
                <div class="list">
                    ${this.renderListItem('🔥', '热销商品', 'hot-products')}
                    ${this.renderListItem('🆕', '新品上市', 'new-arrivals')}
                    ${this.renderListItem('💰', '限时折扣', 'limited-offers')}
                </div>
            </div>
        `;
    }

    // 金融APP首页
    renderFinanceHome() {
        return `
            <div class="carousel" style="background: linear-gradient(135deg, #00B67A, #00D6A8);">
                <div class="carousel__title">账户总览</div>
                <div class="carousel__subtitle">总资产 ¥ 1,234,567.89</div>
            </div>
            <div class="card">
                <div class="section-title">快捷操作</div>
                <div class="grid">
                    ${this.renderGridItem('💸', '转账汇款', 'transfer')}
                    ${this.renderGridItem('💰', '投资理财', 'invest')}
                    ${this.renderGridItem('📊', '资产分析', 'analysis')}
                    ${this.renderGridItem('🔔', '消息通知', 'notification')}
                </div>
            </div>
            <div class="card">
                <div class="section-title">最新动态</div>
                <div class="list">
                    ${this.renderListItem('💰', '理财产品到期提醒', 'product-expiry')}
                    ${this.renderListItem('📝', '账单已生成', 'bill-generated')}
                    ${this.renderListItem('🎁', '活动邀请', 'activity-invite')}
                </div>
            </div>
        `;
    }

    // 渲染宫格项
    renderGridItem(icon, text, pageId) {
        return `
            <div class="grid-item" onclick="app.navigate('${pageId}')">
                <div class="grid-item__icon">${icon}</div>
                <div class="grid-item__text">${text}</div>
            </div>
        `;
    }

    // 渲染列表项
    renderListItem(icon, text, pageId) {
        return `
            <div class="list-item" onclick="app.navigate('${pageId}')">
                <div class="list-item__icon">${icon}</div>
                <div class="list-item__content">
                    <div class="list-item__title">${text}</div>
                </div>
                <div class="list-item__arrow">›</div>
            </div>
        `;
    }

    // 页面跳转
    navigate(pageId) {
        const project = this.projects[this.currentProject];

        if (!project.pages[pageId]) {
            console.warn(`页面不存在: ${pageId}`);
            return;
        }

        this.pageHistory.push(this.currentPage);
        this.currentPage = pageId;
        this.renderPhone();
    }

    // 返回上一页
    goBack() {
        if (this.pageHistory.length === 0) return;

        const prevPage = this.pageHistory.pop();
        this.currentPage = prevPage;
        this.renderPhone();
    }

    // Tab切换
    switchTab(tabId) {
        const project = this.projects[this.currentProject];

        if (!project.pages[tabId]) {
            console.warn(`Tab页面不存在: ${tabId}`);
            return;
        }

        // 清空历史栈
        this.pageHistory = [];
        this.currentPage = tabId;
        this.renderPhone();
    }

    // 切换项目
    switchProject(projectId) {
        if (!this.projects[projectId]) {
            console.warn(`项目不存在: ${projectId}`);
            return;
        }

        this.currentProject = projectId;
        this.currentPage = 'home';
        this.pageHistory = [];
        this.renderProjectNav();
        this.renderPhone();
    }

    // 更新信息面板
    updateInfoPanel() {
        const project = this.projects[this.currentProject];
        const page = project.pages[this.currentPage];

        document.getElementById('project-title').textContent = project.name;
        document.getElementById('current-page').textContent = `${page.name} (${this.currentPage})`;
        document.getElementById('page-description').textContent = page.description;

        // 更新面包屑
        const breadcrumb = document.getElementById('page-breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <li>${page.name} (${this.currentPage})</li>
                ${this.pageHistory.map(pageId => `
                    <li style="color: var(--color-text-tertiary);">
                        ${project.pages[pageId]?.name || pageId}
                    </li>
                `).reverse().join('')}
            `;
        }
    }

    // 绑定事件
    bindEvents() {
        // 项目导航点击
        document.querySelectorAll('#project-nav .top-nav__item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.target.dataset.project;
                this.switchProject(projectId);
            });
        });
    }

    // 绑定手机内事件
    bindPhoneEvents() {
        // 动态绑定的内容在渲染时已经通过onclick绑定
    }
}

// 初始化应用
const app = new ProtoFlowApp();
