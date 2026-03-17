import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthEndpoint = error.config?.url?.includes('/auth/');
        const isAlreadyOnLogin = window.location.pathname === '/login';
        // Don't auto-logout employees for 401s on member-only endpoints
        const authUser = localStorage.getItem('auth_user');
        const isEmployee = authUser ? JSON.parse(authUser).user_type === 'employee' : false;
        if (error.response?.status === 401 && !isAuthEndpoint && !isAlreadyOnLogin && !isEmployee) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.href = '/login';
        }
        if (error.response?.status === 403 && error.response?.data?.error === 'suspension') {
            if (window.location.pathname !== '/' && window.location.pathname !== '/payment') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);
