import { useThemeStore } from '../store/themeStore';

export function useTheme() {
    const mode = useThemeStore((s) => s.mode);
    const resolved = useThemeStore((s) => s.resolved);
    const setMode = useThemeStore((s) => s.setMode);
    return { mode, resolved, setMode };
}
