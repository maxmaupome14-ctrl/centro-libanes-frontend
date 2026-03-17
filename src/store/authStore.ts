import { create } from 'zustand';

export interface User {
    id: string;
    membership_id: string;
    member_number: string;
    role: string;
    first_name: string;
    last_name: string;
    user_type: 'member' | 'employee';
    unit_name?: string;
    employment_type?: string;
    photo_url?: string;
    tier?: string;
    join_date?: string;
}

export interface FamilyProfile {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    is_minor: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    // Multi-profile support (in-memory only, not persisted)
    familyProfiles: FamilyProfile[];
    memberCredentials: { password?: string; pin?: string } | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    setFamilyContext: (profiles: FamilyProfile[], credentials: { password?: string; pin?: string }) => void;
    switchProfile: (user: User, token: string) => void;
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
    familyProfiles: [],
    memberCredentials: null,
    login: (user, token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ user: null, token: null, isAuthenticated: false, familyProfiles: [], memberCredentials: null });
    },
    setFamilyContext: (profiles, credentials) => {
        set({ familyProfiles: profiles, memberCredentials: credentials });
    },
    switchProfile: (user, token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user, token });
    },
}));
