// app.js - FINAL WORKING VERSION

// --- HTML TEMPLATES (stored as strings in JS) ---
const pageTemplates = {
    'dashboard': `
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div class="lg:col-span-3 space-y-6">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-6 text-white">
                        <h2 class="text-2xl font-semibold mb-2">Welcome back!</h2>
                        <p id="dashboard-month" class="text-blue-200 dark:text-blue-300">Here's your financial overview.</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="card p-6"><div class="flex items-center justify-between"><div><p class="text-text-secondary text-sm font-medium">Total Income</p><p id="dashboard-total-income" class="text-2xl font-bold text-success font-data">₹0.00</p></div><div class="bg-success-50 dark:bg-green-500/10 p-3 rounded-lg"><i class="fas fa-arrow-trend-up text-success text-xl"></i></div></div></div>
                        <div class="card p-6"><div class="flex items-center justify-between"><div><p class="text-text-secondary text-sm font-medium">Total Expenses</p><p id="dashboard-total-expense" class="text-2xl font-bold text-error font-data">₹0.00</p></div><div class="bg-error-50 dark:bg-red-500/10 p-3 rounded-lg"><i class="fas fa-arrow-trend-down text-error text-xl"></i></div></div></div>
                        <div class="card p-6"><div class="flex items-center justify-between"><div><p class="text-text-secondary text-sm font-medium">Net Savings</p><p id="dashboard-balance" class="text-2xl font-bold text-primary font-data">₹0.00</p></div><div class="bg-primary-50 dark:bg-blue-500/10 p-3 rounded-lg"><i class="fas fa-wallet text-primary text-xl"></i></div></div></div>
                    </div>
                    <div class="card p-6"><h3 class="text-lg font-semibold text-text-primary mb-6">Expense Breakdown (This Month)</h3><div class="relative h-80"><canvas id="expenseChart"></canvas></div></div>
                    <div class="card p-6"><div class="flex items-center justify-between mb-6"><h3 class="text-lg font-semibold text-text-primary">Recent Transactions</h3><a href="#history" class="nav-link text-primary text-sm font-medium">View All</a></div><div id="recent-transactions-list" class="space-y-3"></div></div>
                </div>
                <div class="lg:col-span-1 space-y-6">
                    <div class="card p-6"><h3 class="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3><div class="space-y-3"><a href="#add-transaction" class="nav-link btn-primary w-full flex items-center justify-center space-x-2 active-scale-98"><i class="fas fa-plus"></i><span>Add Transaction</span></a><a href="#budget" class="nav-link btn-secondary w-full flex items-center justify-center space-x-2 active-scale-98"><i class="fas fa-chart-pie"></i><span>Set Budget</span></a><a href="#goals" class="nav-link btn-accent w-full flex items-center justify-center space-x-2 active-scale-98"><i class="fas fa-piggy-bank"></i><span>Savings Goal</span></a></div></div>
                    <div class="card p-6" id="dashboard-budget-progress"></div><div class="card p-6" id="dashboard-savings-progress"></div>
                </div>
            </div>
        </main>`,
    'add-transaction': `
        <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 animate-fade-in">
             <!-- Paste <main> content from add_edit_transaction.html here -->
             <h1 class="text-2xl font-bold">Add New Transaction</h1>
             <p class="text-text-secondary">This page is under construction. Please add the form HTML here.</p>
        </main>`,
    // ... Add templates for other pages here
    'history': `<main class="p-8 text-center animate-fade-in"><h1 class="text-2xl font-bold">Transaction History</h1><p>This page is under construction.</p></main>`,
    'budget': `<main class="p-8 text-center animate-fade-in"><h1 class="text-2xl font-bold">Budget Planning</h1><p>This page is under construction.</p></main>`,
    'goals': `<main class="p-8 text-center animate-fade-in"><h1 class="text-2xl font-bold">Savings Goals</h1><p>This page is under construction.</p></main>`,
    'settings': `<main class="p-8 text-center animate-fade-in"><h1 class="text-2xl font-bold">Settings & Preferences</h1><p>This page is under construction.</p></main>`,
};

document.addEventListener('DOMContentLoaded', () => {
    const app = {
        container: document.getElementById('app-container'),
        currentChart: null,
        init() {
            this.setupEventListeners();
            this.router();
            this.applyTheme();
        },
        setupEventListeners() {
            window.addEventListener('hashchange', () => this.router());
            document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleTheme());
            document.getElementById('mobileMenuToggle').addEventListener('click', () => document.getElementById('mobileMenu').classList.toggle('hidden'));
        },
        toggleTheme() {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
            this.router();
        },
        applyTheme() {
            if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        },
        renderPage(pageKey) {
            if(this.currentChart) { this.currentChart.destroy(); this.currentChart = null; }
            const templateHtml = pageTemplates[pageKey];
            if (templateHtml) {
                this.container.innerHTML = templateHtml;
                if (pageInitializers[pageKey]) pageInitializers[pageKey]();
            } else {
                this.container.innerHTML = `<main class="text-center p-8"><h1 class="text-2xl">Page Not Found</h1></main>`;
            }
        },
        updateActiveNavLink(hash) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active', 'text-primary', 'bg-primary-50');
                 if(link.getAttribute('href') === hash) {
                    link.classList.add('active', 'text-primary', 'bg-primary-50');
                }
            });
            document.getElementById('mobileMenu').classList.add('hidden');
        },
        router() {
            const hash = window.location.hash || '#dashboard';
            const pageKey = hash.substring(1);
            this.renderPage(pageKey);
            this.updateActiveNavLink(hash);
        }
    };

    const pageInitializers = {
        'dashboard': initializeDashboardPage,
    };
    
    function initializeDashboardPage() {
        // Mock data for demonstration. In a real app, this comes from localStorage or a server.
        const transactions = [
            { date: '2024-07-15', type: 'income', category: 'Salary', description: 'Monthly Salary', amount: 50000 },
            { date: '2024-07-16', type: 'expense', category: 'Food & Dining', description: 'Starbucks', amount: 350 },
            { date: '2024-07-17', type: 'expense', category: 'Transportation', description: 'Metro Card', amount: 500 },
            { date: '2024-07-18', type: 'expense', category: 'Shopping', description: 'Amazon', amount: 2500 },
        ];
        
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
        
        const recentList = document.getElementById('recent-transactions-list');
        recentList.innerHTML = '';
        if (transactions.length > 0) {
             transactions.slice(0, 5).forEach(t => {
                 const isExpense = t.type === 'expense';
                 const icon = { 'Salary': 'fa-wallet', 'Food & Dining': 'fa-utensils', 'Transportation': 'fa-car', 'Shopping': 'fa-shopping-bag' }[t.category] || 'fa-dollar-sign';
                 const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                 recentList.innerHTML += `
                     <div class="flex items-center justify-between p-2 hover:bg-secondary-100 dark:hover:bg-gray-700 rounded-lg">
                        <div class="flex items-center space-x-3"><div class="p-3 rounded-lg ${isExpense ? 'bg-error-50 dark:bg-red-500/10' : 'bg-success-50 dark:bg-green-500/10'}"><i class="fas ${icon} ${isExpense ? 'text-error' : 'text-success'}"></i></div><div><p class="font-medium text-text-primary">${t.description}</p><p class="text-sm text-text-secondary">${t.category} • ${date}</p></div></div>
                        <span class="font-data font-semibold ${isExpense ? 'text-error' : 'text-success'}">${isExpense ? '-' : '+'}₹${t.amount.toFixed(2)}</span>
                     </div>`;
             });
        } else {
            recentList.innerHTML = '<p class="text-text-secondary text-center py-4">No recent transactions.</p>';
        }

        const expenseCtx = document.getElementById('expenseChart')?.getContext('2d');
        if (expenseCtx) {
            const expenseData = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
            if (Object.keys(expenseData).length > 0) {
                app.currentChart = new Chart(expenseCtx, { type: 'doughnut', data: { labels: Object.keys(expenseData), datasets: [{ data: Object.values(expenseData), backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'], borderWidth: 0, }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: true, position: 'bottom', labels: { color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#334155' } } } } });
            } else {
                 expenseCtx.canvas.parentElement.innerHTML = '<p class="text-text-secondary text-center py-16">No expense data to display a chart.</p>';
            }
        }
    }

    app.init();
});
