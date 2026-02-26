import { create } from 'zustand';

interface User {
    id: string;
    membership_id: string;
    member_number: string;
    role: string;
    first_name: string;
    last_name: string;
    user_type: 'member' | 'employee'; // NEW
    unit_name?: string; // For employees
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
}

const getSavedUser = (): User | null => {
    try {
        const raw = localStorage.getItem('auth_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const savedUser = getSavedUser();
const savedToken = localStorage.getItem('auth_token');

export const useAuthStore = create<AuthState>((set) => ({
    user: savedUser,
    token: savedToken,
    isAuthenticated: !!(savedToken && savedUser),
    login: (user, token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ user: null, token: null, isAuthenticated: false });
    },
}));
