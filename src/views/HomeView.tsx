import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import {
    CalendarDays, Lock, User, ChevronRight, Dumbbell, Sparkles,
    Waves, Music, Heart, ArrowRight, Check, Trophy, MapPin, UserPlus,
    Star, Zap, Scissors, Briefcase, ShieldCheck, type LucideIcon
} from 'lucide-react';

/* ── Icon name → component map for CMS dynamic icons ── */
const ICON_MAP: Record<string, LucideIcon> = {
    dumbbell: Dumbbell, sparkles: Sparkles, waves: Waves, music: Music,
    heart: Heart, trophy: Trophy, 'map-pin': MapPin, 'user-plus': UserPlus,
    star: Star, zap: Zap, calendar: CalendarDays, scissors: Scissors,
};
import { motion } from 'framer-motion';
import { CredentialCardModal } from '../components/credential/CredentialCardModal';
import { HospitalityCard } from '../components/ui/HospitalityCard';
import { WeatherCard } from '../components/ui/WeatherCard';
import { downloadICS } from '../lib/calendar';

/* ── Cedar Tree SVG (watermark for the credential card) ── */
const CedarWatermark = () => (
    <svg viewBox="0 0 100 120" fill="none" style={{ position: 'absolute', right: 24, bottom: 16, height: 110, opacity: 0.13, pointerEvents: 'none' }}>
        <path d="M50 0L35 20H42L28 38H38L20 60H35L15 82H40L30 100H70L60 82H85L65 60H80L62 38H72L58 20H65L50 0Z" fill="white" />
        <rect x="45" y="100" width="10" height="18" fill="white" rx="2" />
    </svg>
);

/* Fallbacks used when CMS API is unavailable */
const FALLBACK_EXPLORE = [
    { name: 'Deportes', icon: 'dumbbell', color: '#007A4A', background_color: 'rgba(0,122,74,0.08)', link: '/reservations' },
    { name: 'Spa & Barbería', icon: 'sparkles', color: '#C9A84C', background_color: 'rgba(201,168,76,0.08)', link: '/reservations' },
    { name: 'Acuáticas', icon: 'waves', color: '#06B6D4', background_color: 'rgba(6,182,212,0.08)', link: '/reservations' },
    { name: 'Danza', icon: 'music', color: '#8B5CF6', background_color: 'rgba(139,92,246,0.08)', link: '/reservations' },
    { name: 'Invitar amigos', icon: 'user-plus', color: '#059669', background_color: 'rgba(5,150,105,0.08)', link: '/guests' },
    { name: 'Mis pagos', icon: 'heart', color: '#EF4444', background_color: 'rgba(239,68,68,0.08)', link: '/payment' },
];
const FALLBACK_FEATURED = [
    { title: 'Natación Libre', subtitle: 'Piscina Olímpica', gradient_start: '#005A36', gradient_end: '#007A4A', icon: 'waves', link: '/reservations' },
    { title: 'Clínica de Tenis', subtitle: 'Canchas 1-4', gradient_start: '#1a3a5c', gradient_end: '#2d5a8a', icon: 'trophy', link: '/reservations' },
    { title: 'Yoga Restaurativo', subtitle: 'L-M-V 7:00 am', gradient_start: '#6B4226', gradient_end: '#A0522D', icon: 'heart', link: '/reservations' },
];

export const HomeView = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [reservations, setReservations] = useState<any[]>([]);
    const [loadingRes, setLoadingRes] = useState(true);
    const [maintenance, setMaintenance] = useState<{ status: string; nextDue: string; amount: number } | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [showCredential, setShowCredential] = useState(false);
    const [featured, setFeatured] = useState<any[]>(FALLBACK_FEATURED);
    const [exploreItems, setExploreItems] = useState<any[]>(FALLBACK_EXPLORE);
    const [banners, setBanners] = useState<any[]>([]);

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const res = await api.get('/reservations/user');
                setReservations(res.data);
            } catch { /* empty */ }
            finally { setLoadingRes(false); }
        };

        const fetchMaintenance = async () => {
            if (!user?.membership_id) return;
            try {
                const res = await api.get(`/payments/${user.membership_id}/statement`);
                const pending = res.data.maintenance?.find((b: any) => b.status === 'pendiente');
                setMaintenance({
                    status: pending ? 'pendiente' : 'al_corriente',
                    nextDue: pending ? pending.due_date : (res.data.maintenance?.[0]?.due_date || ''),
                    amount: pending ? Number(pending.amount) : Number(res.data.monthly_fee || 0),
                });
            } catch { /* empty */ }
        };

        const fetchEvents = async () => {
            try {
                const res = await api.get('/events');
                setEvents(res.data);
            } catch { /* empty */ }
            finally { setLoadingEvents(false); }
        };

        const fetchCMS = async () => {
            try {
                const [featRes, expRes, banRes] = await Promise.all([
                    api.get('/cms/featured'),
                    api.get('/cms/explore'),
                    api.get('/cms/banners'),
                ]);
                if (featRes.data.length > 0) setFeatured(featRes.data);
                if (expRes.data.length > 0) setExploreItems(expRes.data);
                setBanners(banRes.data);
            } catch { /* fall back to hardcoded */ }
        };

        if (user?.user_type !== 'employee') {
            fetchReservations();
            fetchMaintenance();
            fetchCMS();
        }
        fetchEvents();
    }, [user]);

    if (!user) return null;

    const isEmployee = user.user_type === 'employee';

    const f = (delay: number) => ({
        initial: { opacity: 0, y: 16 } as const,
        animate: { opacity: 1, y: 0 } as const,
        transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    });

    /* ── Time-aware greeting ── */
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <div style={{ paddingBottom: 100 }}>

            {/* ═══════════ GREETING ═══════════ */}
            <motion.div {...f(0)} style={{ padding: '24px 16px 8px' }}>
                <p style={{ fontSize: 15, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{greeting},</p>
                <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.15 }}>
                    {user.first_name} {user.last_name}
                </h1>
            </motion.div>

            {/* ═══════════ ANNIVERSARY CARD ═══════════ */}
            <HospitalityCard userId={user.id} />

            {/* ═══════════ WEATHER SUGGESTION ═══════════ */}
            <motion.div {...f(0.03)}>
                <WeatherCard />
            </motion.div>

            {/* ═══════════ BANNERS (CMS) ═══════════ */}
            {banners.length > 0 && (
                <motion.div {...f(0.04)} style={{ padding: '12px 16px 0' }}>
                    {banners.map(b => (
                        <button key={b.id} onClick={() => b.cta_link && navigate(b.cta_link)}
                            style={{
                                width: '100%', textAlign: 'left', borderRadius: 16, overflow: 'hidden',
                                background: `linear-gradient(135deg, ${b.background_color}dd, ${b.background_color})`,
                                padding: '18px 20px', cursor: b.cta_link ? 'pointer' : 'default',
                                touchAction: 'manipulation', border: 'none',
                                boxShadow: `0 8px 24px ${b.background_color}30`,
                            }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Anuncio</p>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginTop: 4, lineHeight: 1.3 }}>{b.title}</h3>
                            {b.subtitle && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{b.subtitle}</p>}
                            {b.cta_text && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{b.cta_text}</span>
                                    <ChevronRight size={12} style={{ color: 'white' }} />
                                </div>
                            )}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* ═══════════ CREDENTIAL CARD ═══════════ */}
            {isEmployee ? (
                /* ── Staff Credential Card ── */
                <motion.div {...f(0.05)} style={{ padding: '12px 16px 0' }}>
                    <div style={{
                        position: 'relative', overflow: 'hidden', borderRadius: 22,
                        padding: '22px 20px 20px',
                        background: 'linear-gradient(145deg, #1a1408 0%, #2d2210 50%, #1a1408 100%)',
                        border: '1px solid rgba(201,168,76,0.2)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.12)',
                    }}>
                        {/* Shimmer */}
                        <div style={{
                            position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.04), transparent)',
                            animation: 'shimmer 4s ease-in-out infinite',
                        }} />
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, pointerEvents: 'none', border: '1px solid rgba(201,168,76,0.08)' }} />
                        <CedarWatermark />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <img src="/logo.png" alt="Centro Libanés" style={{ height: 24, width: 'auto', objectFit: 'contain', opacity: 0.7 }} />
                                    <div>
                                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Centro Libanés</p>
                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1 }}>Club Deportivo y Social</p>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
                                    padding: '4px 10px', borderRadius: 8,
                                    background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)',
                                }}>Staff</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 24,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, flexShrink: 0, fontSize: 16,
                                    background: 'linear-gradient(135deg, #C9A84C, #B8963E)', color: '#1a1408',
                                }}>
                                    {user.first_name?.[0] ?? ''}{user.last_name?.[0] ?? ''}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>Empleado</p>
                                    <p style={{ color: '#fff', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.first_name} {user.last_name}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 18 }}>
                                <div>
                                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Puesto</p>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize', fontWeight: 500, marginTop: 3 }}>{user.role}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Unidad</p>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize', fontWeight: 500, marginTop: 3 }}>{user.unit_name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                /* ── Member Credential Card ── */
                <motion.div {...f(0.05)} style={{ padding: '12px 16px 0' }}>
                    <div
                        onClick={() => setShowCredential(true)}
                        style={{
                            background: 'linear-gradient(145deg, #003D24 0%, #005A36 40%, #007A4A 100%)',
                            borderRadius: 22,
                            padding: '22px 20px 20px',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            boxShadow: '0 16px 48px rgba(0,90,54,0.35), 0 4px 12px rgba(0,0,0,0.12)',
                            touchAction: 'manipulation',
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                            animation: 'shimmer 4s ease-in-out infinite',
                        }} />
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <CedarWatermark />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <img src="/logo.png" alt="Centro Libanés" style={{ height: 30, width: 'auto', objectFit: 'contain', opacity: 0.9 }} />
                                    <div>
                                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Centro Libanés</p>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>Club Deportivo y Social</p>
                                    </div>
                                </div>
                                <span style={{
                                    background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))',
                                    borderRadius: 20, padding: '5px 14px',
                                    border: '1px solid rgba(201,168,76,0.25)',
                                    color: '#E8D590', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                                }}>
                                    {user.role === 'titular' ? 'PLATINO' : user.role?.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 24,
                                    border: '2px solid rgba(255,255,255,0.12)', flexShrink: 0,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    background: 'rgba(201,168,76,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 16 }}>
                                        {user.first_name?.[0] ?? ''}{user.last_name?.[0] ?? ''}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500 }}>Socio</p>
                                    <p style={{ color: '#fff', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.first_name} {user.last_name}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18 }}>
                                <div>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>No. Socio</p>
                                    <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: 4, marginTop: 3 }}>{user.member_number}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                                        <span style={{ position: 'relative', display: 'flex', height: 6, width: 6 }}>
                                            <span className="animate-ping" style={{ position: 'absolute', height: '100%', width: '100%', borderRadius: '9999px', backgroundColor: '#4ade80', opacity: 0.75 }} />
                                            <span style={{ position: 'relative', borderRadius: '9999px', height: 6, width: 6, backgroundColor: '#4ade80' }} />
                                        </span>
                                        <span style={{ color: '#4ADE80', fontSize: 12, fontWeight: 500 }}>Activo</span>
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 6 }}>Toca para ver QR</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ═══════════ QUICK ACTIONS ═══════════ */}
            <motion.div {...f(0.12)} style={{ padding: '24px 16px 0' }}>
                <p className="section-header" style={{ marginBottom: 12 }}>Acceso Rápido</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                    {(isEmployee ? [
                        { label: 'Panel', icon: Briefcase, path: '/employee', color: '#C9A84C', bg: 'rgba(201,168,76,0.08)' },
                        ...(user.role === 'administrador' ? [{ label: 'Admin', icon: ShieldCheck, path: '/admin', color: '#6366F1', bg: 'rgba(99,102,241,0.08)' }] : []),
                        { label: 'Perfil', icon: User, path: '/profile', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)' },
                    ] : [
                        { label: 'Reservar', icon: CalendarDays, path: '/reservations', color: '#007A4A', bg: 'rgba(0,122,74,0.08)' },
                        { label: 'Torneos', icon: Trophy, path: '/tournaments', color: '#C9A84C', bg: 'rgba(201,168,76,0.08)' },
                        { label: 'Lockers', icon: Lock, path: '/lockers', color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
                        { label: 'Perfil', icon: User, path: '/profile', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)' },
                    ]).map((a) => {
                        const Icon = a.icon;
                        return (
                            <motion.button key={a.label}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(a.path)}
                                className="card-interactive"
                                style={{
                                    padding: '16px 6px 14px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                    cursor: 'pointer', touchAction: 'manipulation',
                                }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: a.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={18} style={{ color: a.color }} strokeWidth={1.6} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{a.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* ═══════════ EVENTS ═══════════ */}
            <motion.div {...f(0.18)} style={{ padding: '24px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
                    <p className="section-header">Próximos Eventos</p>
                </div>

                {loadingEvents ? (
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 16, paddingRight: 16 }} className="scrollbar-none">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse"
                                style={{ flexShrink: 0, borderRadius: 20, width: 220, height: 140, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ margin: '0 16px' }}>
                        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(201,168,76,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CalendarDays size={20} style={{ color: 'var(--color-gold)' }} strokeWidth={1.6} />
                            </div>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Sin eventos por ahora</p>
                                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>Próximamente habrá novedades</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 4, scrollSnapType: 'x mandatory' }} className="scrollbar-none">
                        {events.map((ev) => {
                            const bg = ev.image_color || '#007A4A';
                            const dateObj = new Date(ev.event_date);
                            const dayNum = dateObj.getDate();
                            const monthStr = dateObj.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
                            const timeStr = dateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={ev.id} style={{
                                    flexShrink: 0, scrollSnapAlign: 'start', cursor: 'pointer',
                                    width: 220, borderRadius: 20, overflow: 'hidden',
                                    background: `linear-gradient(135deg, ${bg}dd, ${bg})`,
                                    boxShadow: `0 8px 24px ${bg}40`,
                                    touchAction: 'manipulation',
                                }}>
                                    <div style={{ padding: 18, minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(8px)' }}>
                                            <span style={{ fontSize: 17, fontWeight: 700, color: 'white', lineHeight: 1 }}>{dayNum}</span>
                                            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>{monthStr}</span>
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>{ev.category}</span>
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 6 }}>{ev.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <CalendarDays size={11} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{timeStr}h</span>
                                                {ev.location && <>
                                                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                                                    <MapPin size={11} style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.location}</span>
                                                </>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* ═══════════ MAINTENANCE STATUS (members only) ═══════════ */}
            {!isEmployee && maintenance && (
                <motion.div {...f(0.22)} style={{ padding: '24px 16px 0' }}>
                    <div
                        className="card-interactive"
                        style={{
                            padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
                            borderColor: maintenance.status === 'pendiente' ? 'rgba(239,68,68,0.25)' : undefined,
                            cursor: 'pointer', touchAction: 'manipulation',
                        }}
                        onClick={() => navigate('/payment')}
                    >
                        <div style={{
                            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                            background: maintenance.status === 'pendiente' ? 'rgba(239,68,68,0.08)' : 'rgba(45,139,78,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Check size={20} style={{ color: maintenance.status === 'pendiente' ? '#EF4444' : '#4ADE80' }} strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {maintenance.status === 'pendiente' ? 'Mantenimiento pendiente' : 'Mantenimiento al corriente'}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
                                {maintenance.status === 'pendiente'
                                    ? `Debes $${maintenance.amount.toLocaleString('es-MX')} MXN`
                                    : `Próximo: ${maintenance.nextDue ? new Date(maintenance.nextDue).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : '—'}`
                                }
                            </p>
                        </div>
                        <ChevronRight size={18} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                    </div>
                </motion.div>
            )}

            {/* ═══════════ EXPLORE (members only) ═══════════ */}
            {!isEmployee && (
            <motion.div {...f(0.26)} style={{ padding: '24px 16px 0' }}>
                <p className="section-header" style={{ marginBottom: 12 }}>Explorar</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {exploreItems.map(item => {
                        const Icon = ICON_MAP[item.icon] || Dumbbell;
                        return (
                            <motion.button key={item.name}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate(item.link)}
                                className="card-interactive"
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', textAlign: 'left', cursor: 'pointer', touchAction: 'manipulation' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: item.background_color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} style={{ color: item.color }} strokeWidth={1.6} />
                                </div>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>{item.name}</p>
                                <ArrowRight size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
            )}

            {/* ═══════════ FEATURED (Horizontal scroll, members only) ═══════════ */}
            {!isEmployee && (
            <motion.div {...f(0.3)} style={{ padding: '24px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
                    <p className="section-header">Destacados</p>
                    <button onClick={() => navigate('/reservations')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', touchAction: 'manipulation' }}>
                        Ver todo <ChevronRight size={14} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 4, scrollSnapType: 'x mandatory' }} className="scrollbar-none">
                    {featured.map((item, i) => {
                        const Icon = ICON_MAP[item.icon] || Dumbbell;
                        const gradient = `linear-gradient(135deg, ${item.gradient_start}, ${item.gradient_end})`;
                        return (
                            <button key={item.id || i} onClick={() => navigate(item.link || '/reservations')} style={{
                                flexShrink: 0, scrollSnapAlign: 'start', textAlign: 'left', cursor: 'pointer',
                                width: 200, borderRadius: 20, overflow: 'hidden', background: gradient, touchAction: 'manipulation',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            }}>
                                <div style={{ padding: 20, height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 16, right: 16, opacity: 0.08 }}><Icon size={48} strokeWidth={1} /></div>
                                    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                                        <Icon size={18} style={{ color: 'white' }} strokeWidth={1.6} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{item.title}</h3>
                                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{item.subtitle}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </motion.div>
            )}

            {/* ═══════════ RESERVATIONS (members only) ═══════════ */}
            {!isEmployee && (
            <motion.div {...f(0.34)} style={{ padding: '24px 16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <p className="section-header">Próximas Reservas</p>
                    <button onClick={() => navigate('/reservations')} style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', touchAction: 'manipulation' }}>
                        Ver todas <ChevronRight size={14} />
                    </button>
                </div>
                {loadingRes ? (
                    <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div className="animate-spin" style={{ width: 16, height: 16, borderRadius: '9999px', border: '2px solid var(--color-gold)', borderTopColor: 'transparent' }} />
                        <span style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>Cargando...</span>
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(201,168,76,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <CalendarDays size={22} style={{ color: 'var(--color-text-tertiary)' }} strokeWidth={1.6} />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>No tienes reservas próximas</p>
                        <button onClick={() => navigate('/reservations')} style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gold)', marginTop: 10, display: 'inline-block', cursor: 'pointer', touchAction: 'manipulation' }}>
                            Agendar ahora →
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {reservations.map(resv => {
                            const dateStr = resv.date
                                ? new Date(resv.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
                                : '';
                            const timeStr = resv.start_time ? `${resv.start_time}${resv.end_time ? '–' + resv.end_time : ''}` : '';
                            const statusMap: Record<string, { label: string; bg: string; color: string }> = {
                                confirmada: { label: 'Confirmada', bg: 'rgba(0,90,54,0.1)', color: 'var(--color-green-cedar-light)' },
                                pendiente: { label: 'Pendiente', bg: 'rgba(201,168,76,0.1)', color: 'var(--color-gold)' },
                                pendiente_aprobacion: { label: 'Por aprobar', bg: 'rgba(201,168,76,0.1)', color: 'var(--color-gold)' },
                                en_curso: { label: 'En curso', bg: 'rgba(6,182,212,0.1)', color: '#06B6D4' },
                            };
                            const st = statusMap[resv.status] || statusMap.confirmada;
                            return (
                                <div key={resv.id} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,122,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Dumbbell size={19} style={{ color: 'var(--color-green-cedar-light)' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resv.service?.name || 'Reserva'}</h4>
                                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {dateStr && <span>{dateStr}</span>}
                                            {dateStr && timeStr && <span style={{ opacity: 0.4 }}>·</span>}
                                            {timeStr && <span>{timeStr}</span>}
                                            {resv.unit?.short_name && <><span style={{ opacity: 0.4 }}>·</span><span>{resv.unit.short_name}</span></>}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        {resv.date && resv.start_time && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadICS({
                                                        title: resv.service?.name || 'Reserva Centro Libanés',
                                                        date: resv.date,
                                                        startTime: resv.start_time,
                                                        endTime: resv.end_time || resv.start_time,
                                                        location: resv.unit?.short_name ? `Centro Libanés — ${resv.unit.short_name}` : 'Centro Libanés',
                                                    });
                                                }}
                                                style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,168,76,0.08)', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
                                                title="Agregar al calendario"
                                            >
                                                <CalendarDays size={14} style={{ color: 'var(--color-gold)' }} />
                                            </button>
                                        )}
                                        <div style={{ background: st.bg, borderRadius: 10, padding: '5px 12px' }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: st.color }}>{st.label}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
            )}

            {/* QR Credential Card Modal (members only) */}
            {!isEmployee && (
                <CredentialCardModal
                    open={showCredential}
                    onClose={() => setShowCredential(false)}
                    user={user}
                />
            )}
        </div>
    );
};
