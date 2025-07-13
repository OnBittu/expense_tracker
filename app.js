// app.js
document.addEventListener('DOMContentLoaded', () => {
    // --- APP INITIALIZATION ---
    const app = {
        container: document.getElementById('app-container'),
        templates: {},
        currentChart: null,
        init() {
            this.cacheTemplates();
            this.setupEventListeners();
            this.router();
            this.applyTheme();
        },
        cacheTemplates() {
            document.querySelectorAll('template').forEach(template => {
                this.templates[template.id] = template.content.cloneNode(true);
            });
            // Clear the templates from the DOM after caching
            document.body.removeChild(document.getElementById('page-templates'));
        },
        setupEventListeners() {
            window.addEventListener('hashchange', () => this.router());
            document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleTheme());
            document.getElementById('mobileMenuToggle').addEventListener('click', () => document.getElementById('mobileMenu').classList.toggle('hidden'));
        },
        toggleTheme() {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            this.router(); // Re-render to apply chart colors
        },
        applyTheme() {
            if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        renderPage(templateId) {
            if(this.currentChart) { this.currentChart.destroy(); this.currentChart = null; }
            const templateContent = this.templates[templateId];
            if (templateContent) {
                this.container.innerHTML = '';
                this.container.appendChild(templateContent.cloneNode(true));
                if (pageInitializers[templateId]) pageInitializers[templateId]();
            } else {
                this.container.innerHTML = `<main class="text-center p-8"><h1 class="text-2xl">Page Not Found</h1></main>`;
            }
        },
        updateActiveNavLink(hash) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if(link.getAttribute('href') === hash) {
                    link.classList.add('active');
                }
            });
            document.getElementById('mobileMenu').classList.add('hidden');
        },
        router() {
            const hash = window.location.hash || '#dashboard';
            const templateId = `template-${hash.substring(1)}`;
            this.renderPage(templateId);
            this.updateActiveNavLink(hash);
        }
    };

    // --- PAGE-SPECIFIC INITIALIZERS ---
    const pageInitializers = {
        'template-dashboard': initializeDashboardPage,
        // Add other initializers as they are built
        // 'template-add-transaction': initializeAddTransactionPage,
    };
    
    function initializeDashboardPage() {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const currentMonthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });

        const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        document.getElementById('dashboard-total-income').textContent = `₹${totalIncome.toFixed(2)}`;
        document.getElementById('dashboard-total-expense').textContent = `₹${totalExpense.toFixed(2)}`;
        document.getElementById('dashboard-balance').textContent = `₹${(totalIncome - totalExpense).toFixed(2)}`;
        
        // Render Recent Transactions
        const recentList = document.getElementById('recent-transactions-list');
        recentList.innerHTML = '';
        const recentTransactions = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        if (recentTransactions.length > 0) {
             recentTransactions.forEach(t => {
                 const isExpense = t.type === 'expense';
                 const icon = getCategoryIcon(t.category);
                 const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                 recentList.innerHTML += `
                     <div class="flex items-center justify-between p-2 hover:bg-secondary-100 dark:hover:bg-gray-700 rounded-lg">
                        <div class="flex items-center space-x-3"><div class="p-3 rounded-lg ${isExpense ? 'bg-error-50 dark:bg-red-500/10' : 'bg-success-50 dark:bg-green-500/10'}"><i class="fas ${icon}"></i></div><div><p class="font-medium text-text-primary">${t.description || 'Transaction'}</p><p class="text-sm text-text-secondary">${t.category} • ${date}</p></div></div>
                        <span class="font-data font-semibold ${isExpense ? 'text-error' : 'text-success'}">${isExpense ? '-' : '+'}₹${t.amount.toFixed(2)}</span>
                     </div>`;
             });
        } else {
            recentList.innerHTML = '<p class="text-text-secondary text-center py-4">No recent transactions. Add one now!</p>';
        }

        // Render Chart
        const expenseCtx = document.getElementById('expenseChart')?.getContext('2d');
        if (expenseCtx) {
            const expenseData = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
            if (Object.keys(expenseData).length > 0) {
                app.currentChart = new Chart(expenseCtx, { type: 'doughnut', data: { labels: Object.keys(expenseData), datasets: [{ data: Object.values(expenseData), backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'], borderWidth: 0, }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: true, position: 'bottom', labels: { color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#334155' } } } } });
            } else {
                 expenseCtx.canvas.parentElement.innerHTML = '<p class="text-text-secondary text-center py-16">No expense data for this month to display a chart.</p>';
            }
        }
    }
    
    function getCategoryIcon(category) {
        const icons = { 'food-dining': 'fa-utensils', 'transportation': 'fa-car', 'shopping': 'fa-shopping-bag', 'entertainment': 'fa-film', 'utilities': 'fa-bolt', 'healthcare': 'fa-heartbeat', 'education': 'fa-book', 'travel': 'fa-plane', 'salary': 'fa-wallet', 'freelance': 'fa-laptop-code', 'investment': 'fa-chart-line', 'gift': 'fa-gift' };
        return icons[category] || 'fa-question-circle';
    }

    // Initialize the app
    app.init();
});
    //]]>
    </script>
</body>
</html>
