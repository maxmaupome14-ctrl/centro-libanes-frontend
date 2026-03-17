import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Users, User, ArrowUpDown, Briefcase } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePlatform } from '../../hooks/usePlatform';
import { ProfileSwitcher } from '../ui/ProfileSwitcher';

const memberTabs = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Reservar', path: '/reservations', icon: CalendarDays },
    { name: 'Familia', path: '/family', icon: Users },
    { name: 'Perfil', path: '/profile', icon: User },
];

const employeeTabs = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Panel', path: '/employee', icon: Briefcase },
    { name: 'Perfil', path: '/profile', icon: User },
];

export const BottomNav = () => {
    const user = useAuthStore((s) => s.user);
    const familyProfiles = useAuthStore((s) => s.familyProfiles);
    const { isAndroid } = usePlatform();
    const [showSwitcher, setShowSwitcher] = useState(false);
    const hasMultipleProfiles = familyProfiles.length > 1;
    const isEmployee = user?.user_type === 'employee';
    const tabs = isEmployee ? employeeTabs : memberTabs;

    return (
        <>
            <nav
                className={isAndroid ? undefined : 'glass'}
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: 430,
                    zIndex: 50,
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    ...(isAndroid
                        ? {
                            background: 'var(--color-surface)',
                            borderTop: '1px solid var(--color-border)',
                        }
                        : {}),
                }}
            >
                {/* Active profile indicator (only for multi-profile families, never employees) */}
                {hasMultipleProfiles && !isEmployee && user && (
                    <button
                        onClick={() => setShowSwitcher(true)}
                        style={{
                            position: 'absolute',
                            top: -20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            paddingLeft: 12,
                            paddingRight: 12,
                            paddingTop: 4,
                            paddingBottom: 4,
                            borderRadius: 9999,
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                            transition: 'border-color 0.2s',
                        }}
                    >
                        <span style={{
                            width: 20,
                            height: 20,
                            borderRadius: 9999,
                            background: 'rgba(201,168,76,0.15)',
                            color: 'var(--color-gold)',
                            fontSize: 9,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {user.first_name[0]}{user.last_name[0]}
                        </span>
                        <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                        }}>{user.first_name}</span>
                        <ArrowUpDown size={10} style={{ color: 'var(--color-text-tertiary)' }} />
                    </button>
                )}

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: isAndroid ? 80 : 49,
                }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <NavLink
                                key={tab.name}
                                to={tab.path}
                                end={tab.path === '/'}
                                className={({ isActive }) =>
                                    `tap-feedback${isActive ? '' : ''}`
                                }
                                style={({ isActive }) => ({
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column' as const,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    height: '100%',
                                    transition: 'color 0.2s',
                                    position: 'relative' as const,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    color: isActive
                                        ? 'var(--color-gold)'
                                        : 'var(--color-text-tertiary)',
                                })}
                            >
                                {({ isActive }) => (
                                    <>
                                        {/* iOS: top indicator line */}
                                        {!isAndroid && isActive && (
                                            <span style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: 32,
                                                height: 2,
                                                background: 'var(--color-gold)',
                                                borderRadius: 9999,
                                            }} />
                                        )}
                                        {/* Android: pill indicator behind icon */}
                                        {isAndroid && isActive && (
                                            <span style={{
                                                position: 'absolute',
                                                top: 8,
                                                width: 64,
                                                height: 32,
                                                borderRadius: 9999,
                                                background: 'rgba(201,168,76,0.15)',
                                            }} />
                                        )}
                                        <Icon size={isAndroid ? 22 : 20} strokeWidth={isActive ? 2.2 : 1.6} style={{ position: 'relative', zIndex: 10 }} />
                                        <span style={{
                                            position: 'relative',
                                            zIndex: 10,
                                            fontWeight: 600,
                                            letterSpacing: '0.025em',
                                            fontSize: isAndroid ? 10 : 9,
                                        }}>{tab.name}</span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

            <ProfileSwitcher open={showSwitcher} onClose={() => setShowSwitcher(false)} />
        </>
    );
};
