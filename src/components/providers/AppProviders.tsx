import { useEffect } from 'react';
import { PLATFORM } from '../../store/platformStore';
import { useThemeStore } from '../../store/themeStore';

export function AppProviders({ children }: { children: React.ReactNode }) {
    const resolved = useThemeStore((s) => s.resolved);

    useEffect(() => {
        document.documentElement.setAttribute('data-platform', PLATFORM);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', resolved);
    }, [resolved]);

    return <>{children}</>;
}
