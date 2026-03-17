import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bell, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

const ROUTE_TITLES: Record<string, string> = {
    '/reservations': 'Reservar',
    '/family': 'Familia',
    '/profile': 'Perfil',
    '/lockers': 'Casilleros',
    '/payment': 'Pagos',
    '/notifications': 'Notificaciones',
    '/tournaments': 'Torneos',
    '/guests': 'Invitados',
    '/employee': 'Panel',
};

// Routes that show a back button instead of just a title
const BACK_ROUTES = new Set(['/lockers', '/payment', '/notifications', '/tournaments', '/guests']);

export function TopBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const title = ROUTE_TITLES[location.pathname];
    const isHome = location.pathname === '/';
    const showBack = BACK_ROUTES.has(location.pathname);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // notifications/my requires member profile — skip for staff
        if (user?.user_type === 'employee') return;
        api.get('/notifications/my')
            .then(res => setUnreadCount(res.data.unread_count || 0))
            .catch(() => {});
    }, [location.pathname, user]);

    return (
        <header style={{
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            paddingLeft: showBack ? 8 : 16,
            paddingRight: 16,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
        }}>
            {isHome ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src="/logo.png" alt="Centro Libanés" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
                    {user && (
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            {user.first_name}
                        </span>
                    )}
                </div>
            ) : showBack ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            width: 36, height: 36, borderRadius: 18,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 'none',
                            cursor: 'pointer', touchAction: 'manipulation',
                        }}
                    >
                        <ChevronLeft size={22} style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                    <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                        {title}
                    </h1>
                </div>
            ) : (
                <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                    {title}
                </h1>
            )}
            {user?.user_type !== 'employee' && (
                <button
                    onClick={() => navigate('/notifications')}
                    style={{
                        width: 40, height: 40, borderRadius: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none',
                        cursor: 'pointer', touchAction: 'manipulation',
                        position: 'relative',
                    }}
                >
                    <Bell size={20} style={{ color: 'var(--color-text-secondary)' }} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute', top: 6, right: 6,
                            minWidth: 16, height: 16, padding: '0 4px',
                            borderRadius: 8,
                            background: 'var(--color-red-lebanese)',
                            color: '#fff', fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid var(--color-surface)',
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            )}
        </header>
    );
}
