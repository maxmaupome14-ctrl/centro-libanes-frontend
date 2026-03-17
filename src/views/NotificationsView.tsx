import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Bell, ChevronLeft, Check, CalendarDays, CreditCard, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    is_read: boolean;
    created_at: string;
}

function getNotifIcon(type: string) {
    if (type.includes('payment') || type.includes('maintenance') || type.includes('pago')) return CreditCard;
    if (type.includes('reservation') || type.includes('reserva') || type.includes('reminder')) return CalendarDays;
    if (type.includes('alert') || type.includes('suspension') || type.includes('warning')) return AlertCircle;
    if (type.includes('approval') || type.includes('aprobacion')) return Check;
    return Info;
}

function getNotifColor(type: string) {
    if (type.includes('payment') || type.includes('maintenance')) return '#C9A84C';
    if (type.includes('alert') || type.includes('suspension')) return 'var(--color-red-lebanese)';
    if (type.includes('approval')) return '#10B981';
    return 'var(--color-gold)';
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export const NotificationsView = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/notifications/my');
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.unread_count);
            } catch { /* empty */ }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const markRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* empty */ }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* empty */ }
    };

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div style={{
                position: 'relative', overflow: 'hidden', padding: '24px 16px 56px',
                background: 'linear-gradient(to bottom, var(--color-green-cedar-dark), var(--color-green-cedar))',
            }}>
                <div style={{
                    position: 'absolute', top: '-50%', right: '-30%',
                    width: 300, height: 300, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)', filter: 'blur(100px)',
                }} />
                <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => navigate(-1)}
                        aria-label="Volver"
                        style={{
                            width: 36, height: 36, borderRadius: 18, border: 'none',
                            background: 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, cursor: 'pointer', touchAction: 'manipulation',
                            transition: 'background 200ms',
                        }}
                    >
                        <ChevronLeft size={18} style={{ color: 'white' }} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: -0.3 }}>Notificaciones</h1>
                        {unreadCount > 0 && (
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 2 }}>
                                <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>{unreadCount}</span> sin leer
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 20, padding: '0 16px', marginTop: -32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Mark all read */}
                {unreadCount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={markAllRead}
                            style={{
                                fontSize: 11, fontWeight: 600, color: 'var(--color-gold)',
                                display: 'flex', alignItems: 'center', gap: 6,
                                cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                            }}
                        >
                            <Check size={12} /> Marcar todas como leídas
                        </button>
                    </div>
                )}

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse" style={{
                                height: 80, borderRadius: 16,
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                            }} />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(201,168,76,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <Bell size={22} style={{ color: 'var(--color-text-tertiary)' }} strokeWidth={1.6} />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Sin notificaciones</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Te avisaremos aquí sobre reservas, pagos y más</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {notifications.map((notif, i) => {
                                const Icon = getNotifIcon(notif.type);
                                const color = getNotifColor(notif.type);
                                return (
                                    <motion.button
                                        key={notif.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.2 }}
                                        onClick={() => !notif.is_read && markRead(notif.id)}
                                        style={{
                                            width: '100%', textAlign: 'left',
                                            background: 'var(--color-surface)',
                                            border: `1px solid ${notif.is_read ? 'var(--color-border)' : 'var(--color-border-strong)'}`,
                                            borderRadius: 16, overflow: 'hidden',
                                            transition: 'all 200ms', cursor: 'pointer',
                                            opacity: notif.is_read ? 0.7 : 1,
                                            touchAction: 'manipulation',
                                        }}
                                    >
                                        <div style={{ padding: '16px 18px', display: 'flex', gap: 14, position: 'relative' }}>
                                            {/* Unread dot */}
                                            {!notif.is_read && (
                                                <div style={{ position: 'absolute', top: 14, left: 8, width: 6, height: 6, borderRadius: 3, background: 'var(--color-gold)' }} />
                                            )}
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                                background: `${color}18`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={17} style={{ color }} strokeWidth={1.6} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                                    <p style={{
                                                        fontSize: 13, fontWeight: 600, lineHeight: 1.3,
                                                        color: notif.is_read ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                                                    }}>
                                                        {notif.title}
                                                    </p>
                                                    <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', flexShrink: 0, marginTop: 2 }}>
                                                        {timeAgo(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p style={{
                                                    fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4,
                                                    lineHeight: 1.5, display: '-webkit-box',
                                                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                }}>
                                                    {notif.body}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};
