import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '../../store/themeStore';

const options: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { mode: 'light', label: 'Claro', Icon: Sun },
    { mode: 'dark', label: 'Oscuro', Icon: Moon },
    { mode: 'auto', label: 'Auto', Icon: Monitor },
];

export function ThemeToggle() {
    const mode = useThemeStore((s) => s.mode);
    const setMode = useThemeStore((s) => s.setMode);

    return (
        <div style={{ display: 'flex', borderRadius: 12, background: 'var(--color-surface-hover)', padding: 4, gap: 4 }}>
            {options.map(({ mode: m, label, Icon }) => {
                const active = mode === m;
                return (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            transition: 'all 0.15s',
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                            border: 'none',
                            ...(active
                                ? {
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text-primary)',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                }
                                : {
                                    background: 'transparent',
                                    color: 'var(--color-text-tertiary)',
                                }),
                        }}
                    >
                        <Icon size={14} strokeWidth={1.8} />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
