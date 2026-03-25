/**
 * Base URL for the Backend API
 */
const API_URL = 'http://localhost:5000/api';

/**
 * Gets the JWT token from localStorage
 */
const getToken = () => localStorage.getItem('token');

/**
 * Gets the current user data from localStorage
 */
const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

/**
 * Generic fetch wrapper to handle authorization and JSON parsing
 */
const fetchAPI = async (endpoint, options = {}) => {
    const token = getToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            // If unauthorized, clear token and redirect to login
            if (response.status === 401 || response.status === 403) {
                if (endpoint !== '/auth/login' && endpoint !== '/auth/signup') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'index.html';
                }
            }
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
};

/**
 * Auth API methods
 */
const AuthAPI = {
    login: (credentials) => fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),
    signup: (userData) => fetchAPI('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
};

/**
 * Stock API methods
 */
const StockAPI = {
    getAll: (category = null) => fetchAPI(category ? `/stock?category=${encodeURIComponent(category)}` : '/stock'),
    add: (item) => fetchAPI('/stock', {
        method: 'POST',
        body: JSON.stringify(item)
    }),
    update: (id, item) => fetchAPI(`/stock/${id}`, {
        method: 'PUT',
        body: JSON.stringify(item)
    }),
    delete: (id) => fetchAPI(`/stock/${id}`, {
        method: 'DELETE'
    })
};

/**
 * Sales API methods
 */
const SalesAPI = {
    getAll: () => fetchAPI('/sales'),
    record: (saleData) => fetchAPI('/sales', {
        method: 'POST',
        body: JSON.stringify(saleData)
    })
};

/**
 * Orders API methods
 */
const OrdersAPI = {
    getMetrics: () => fetchAPI('/orders/metrics'),
    getActive: () => fetchAPI('/orders/active'),
    create: (orderData) => fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    }),
    updateStatus: (id, status) => fetchAPI(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    }),
    pay: (id) => fetchAPI(`/orders/${id}/pay`, {
        method: 'POST'
    })
};

/**
 * Analytics API methods
 */
const AnalyticsAPI = {
    getDashboard: () => fetchAPI('/analytics/dashboard'),
    getPredictions: () => fetchAPI('/analytics/predictions')
};

/**
 * Logs API methods
 */
const LogsAPI = {
    getAll: () => fetchAPI('/logs')
};

// Expose to global window object
window.api = {
    Auth: AuthAPI,
    Stock: StockAPI,
    Sales: SalesAPI,
    Orders: OrdersAPI,
    Analytics: AnalyticsAPI,
    Logs: LogsAPI,
    getUser,
    getToken
};
