import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Users, User, Lock } from 'lucide-react';

const tabs = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Reservar', path: '/reservations', icon: CalendarDays },
    { name: 'Lockers', path: '/lockers', icon: Lock },
    { name: 'Familia', path: '/family', icon: Users },
    { name: 'Perfil', path: '/profile', icon: User },
];

export const BottomNav = () => {
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 glass pb-safe">
            <div className="flex items-center h-[60px]">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <NavLink
                            key={tab.name}
                            to={tab.path}
                            end={tab.path === '/'}
                            className={({ isActive }) =>
                                `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors relative ${isActive
                                    ? 'text-[var(--color-gold)]'
                                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--color-gold)] rounded-full" />
                                    )}
                                    <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
                                    <span className="text-[9px] font-semibold tracking-wide">{tab.name}</span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};
