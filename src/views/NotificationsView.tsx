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
        <div className="pb-24">
            {/* Header */}
            <div className="relative bg-gradient-to-b from-[var(--color-green-cedar-dark)] to-[var(--color-green-cedar)] pt-6 pb-16 px-5 overflow-hidden">
                <div className="absolute top-[-50%] right-[-30%] w-[300px] h-[300px] rounded-full bg-white/5 blur-[100px]" />
                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        aria-label="Volver"
                        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/20 transition-colors"
                    >
                        <ChevronLeft size={18} className="text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight">Notificaciones</h1>
                        {unreadCount > 0 && (
                            <p className="text-white/50 text-sm mt-0.5">
                                <span className="text-[var(--color-gold-light)] font-semibold">{unreadCount}</span> sin leer
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-5 -mt-10 relative z-20 space-y-4">
                {/* Mark all read */}
                {unreadCount > 0 && (
                    <div className="flex justify-end">
                        <button
                            onClick={markAllRead}
                            className="text-[11px] font-semibold text-[var(--color-gold)] flex items-center gap-1.5 cursor-pointer"
                        >
                            <Check size={12} /> Marcar todas como leídas
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 text-center">
                        <Bell size={28} className="text-[var(--color-text-tertiary)] mx-auto mb-3" />
                        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Sin notificaciones</p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Te avisaremos aquí sobre reservas, pagos y más</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        <div className="space-y-2">
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
                                        className={`w-full text-left bg-[var(--color-surface)] border rounded-2xl overflow-hidden transition-all cursor-pointer ${
                                            notif.is_read
                                                ? 'border-[var(--color-border)] opacity-70'
                                                : 'border-[var(--color-border-strong)] hover:border-[var(--color-gold)]/40'
                                        }`}
                                    >
                                        <div className="relative flex gap-3.5 p-4">
                                            {/* Unread dot */}
                                            {!notif.is_read && (
                                                <div className="absolute top-3 left-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />
                                            )}
                                            <div
                                                className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                                                style={{ background: `${color}18` }}
                                            >
                                                <Icon size={17} style={{ color }} strokeWidth={1.6} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-[13px] font-semibold leading-tight ${notif.is_read ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-[10px] text-[var(--color-text-tertiary)] shrink-0 mt-0.5">
                                                        {timeAgo(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1 leading-relaxed line-clamp-2">
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
