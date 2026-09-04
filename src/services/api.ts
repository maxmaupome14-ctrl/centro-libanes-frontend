import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Estado de conexión (ConnectionBanner): servidor lento (cold start) / sin conexión ──
let slowTimer: number | null = null;
let pending = 0;
const emit = (name: string) => window.dispatchEvent(new Event(name));
const trackStart = () => {
    pending++;
    if (slowTimer === null) slowTimer = window.setTimeout(() => emit('api:slow'), 2500);
};
const trackEnd = () => {
    pending = Math.max(0, pending - 1);
    if (pending === 0 && slowTimer !== null) { clearTimeout(slowTimer); slowTimer = null; }
};

// Retry once on timeout/network error (Railway cold starts take ~15s)
api.interceptors.response.use(undefined, async (error) => {
    const config = error.config;
    if (
        config &&
        !config._retried &&
        (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')
    ) {
        config._retried = true;
        config.timeout = 25000;
        return api.request(config);
    }
    return Promise.reject(error);
});

api.interceptors.request.use((config) => {
    trackStart();
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => { trackEnd(); emit('api:ok'); return response; },
    (error) => {
        trackEnd();
        if (!error.response) {
            if (error.config?._retried) emit('api:offline');
        } else {
            emit('api:ok');
        }
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
            emit('api:suspended');
            if (window.location.pathname !== '/' && window.location.pathname !== '/payment') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);
