/**
 * Core Application Logic & UI Helpers
 */

// Show UI alert message
const showAlert = (message, type = 'success') => {
    // Look for existing alert container or create one
    let alertContainer = document.getElementById('alert-container');

    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        document.body.appendChild(alertContainer);
    }

    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} animate-fade-in`;
    alertEl.innerHTML = message;
    alertEl.style.display = 'block';
    alertEl.style.minWidth = '300px';

    alertContainer.appendChild(alertEl);

    // Remove after 3 seconds
    setTimeout(() => {
        alertEl.style.opacity = '0';
        alertEl.style.transition = 'opacity 0.3s ease';
        setTimeout(() => alertEl.remove(), 300);
    }, 3000);
};

// Check authentication status and redirect if needed
const checkAuth = () => {
    const token = window.api.getToken();
    const user = window.api.getUser();

    // Pages that don't require auth
    const publicPages = ['index.html', 'signup.html', ''];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const isPublic = publicPages.includes(currentPage);

    if (!token && !isPublic) {
        window.location.href = 'index.html';
        return false;
    }

    if (token && isPublic) {
        window.location.href = 'dashboard.html';
        return false;
    }

    // Role-based protection check - only logs.html is Admin only
    if (user && user.role !== 'Admin') {
        const adminPages = ['logs.html'];
        if (adminPages.includes(currentPage)) {
            window.location.href = 'dashboard.html';
            return false;
        }
    }

    return true;
};

// Setup Navigation UI based on Role
const renderNavigation = () => {
    const user = window.api.getUser();
    const navContainer = document.getElementById('main-nav');

    if (!navContainer || !user) return;

    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    // Helper to generate nav item
    const navItem = (href, icon, text) => {
        const isActive = currentPage === href ? 'active' : '';
        // In the new CSS, active state is usually handled by background-color on .nav-item or .nav-sub-item
        // Let's add a simple active style if it's the current page
        const activeStyle = isActive ? 'background: var(--sidebar-hover); color: #fff;' : '';
        return `
            <a href="${href}" class="nav-item" style="${activeStyle}">
                <i class="${icon}"></i> ${text}
            </a>
        `;
    };

    let navLinks = `
        ${navItem('dashboard.html', 'fa-solid fa-border-all', 'Dashboard')}
        ${navItem('stock.html', 'fa-solid fa-boxes-stacked', 'Stock Management')}
        ${navItem('sales.html', 'fa-solid fa-file-invoice', 'Invoice / Sales')}
        ${navItem('predictions.html', 'fa-regular fa-file-lines', 'Report & Analytics')}
    `;

    if (user.role === 'Admin') {
        navLinks += navItem('logs.html', 'fa-solid fa-clock-rotate-left', 'Activity Logs');
    }

    navContainer.innerHTML = `
        <div class="brand">
            <div class="brand-icon-text">
                <div class="brand-icon">
                    <i class="fa-solid fa-brain"></i>
                </div>
                <div class="brand-title">
                    CANTEEN
                </div>
            </div>
            <div class="brand-subtitle">Management System</div>
        </div>

        <div class="nav-menu">
            ${navLinks}
        </div>

        <div class="logout-menu">
            <div style="padding: 0 1.5rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--accent);">Logged in as: ${user.name} (${user.role})</div>
            <a href="#" onclick="window.api?.Auth?.logout()" class="nav-item">
                <i class="fa-solid fa-arrow-right-from-bracket" style="transform: scaleX(-1);"></i> Logout
            </a>
        </div>
    `;
};

// Format Date string
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        renderNavigation();
    }
});

// Expose helpers globally
window.app = {
    showAlert,
    formatDate
};
