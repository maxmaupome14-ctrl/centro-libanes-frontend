import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
    mode: ThemeMode;
    resolved: ResolvedTheme;
    setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'cl-theme';

let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;

function resolveTheme(mode: ThemeMode): ResolvedTheme {
    if (mode === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
}

function applyTheme(resolved: ResolvedTheme) {
    document.documentElement.setAttribute('data-theme', resolved);
}

function getInitialMode(): ThemeMode {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch { /* empty */ }
    return 'auto';
}

const initialMode = getInitialMode();
const initialResolved = resolveTheme(initialMode);
applyTheme(initialResolved);

export const useThemeStore = create<ThemeState>((set) => {
    function cleanupListener() {
        if (mediaQuery && mediaListener) {
            mediaQuery.removeEventListener('change', mediaListener);
            mediaQuery = null;
            mediaListener = null;
        }
    }

    function subscribeToSystem() {
        cleanupListener();
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaListener = (e: MediaQueryListEvent) => {
            const resolved: ResolvedTheme = e.matches ? 'dark' : 'light';
            applyTheme(resolved);
            set({ resolved });
        };
        mediaQuery.addEventListener('change', mediaListener);
    }

    // If initial mode is auto, subscribe immediately
    if (initialMode === 'auto') {
        subscribeToSystem();
    }

    return {
        mode: initialMode,
        resolved: initialResolved,
        setMode: (mode: ThemeMode) => {
            try {
                localStorage.setItem(STORAGE_KEY, mode);
            } catch { /* empty */ }

            const resolved = resolveTheme(mode);
            applyTheme(resolved);

            if (mode === 'auto') {
                subscribeToSystem();
            } else {
                cleanupListener();
            }

            set({ mode, resolved });
        },
    };
});
