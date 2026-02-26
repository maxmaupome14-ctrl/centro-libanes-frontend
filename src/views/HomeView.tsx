import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import {
    CalendarDays, Lock, User, ChevronRight, Dumbbell, Sparkles,
    Waves, Music, Heart, ArrowRight, Check, Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Cedar Tree SVG (watermark for the credential card) ── */
const CedarWatermark = () => (
    <svg viewBox="0 0 100 120" fill="none" className="absolute right-6 bottom-4 h-[110px] opacity-[0.06] pointer-events-none">
        <path d="M50 0L35 20H42L28 38H38L20 60H35L15 82H40L30 100H70L60 82H85L65 60H80L62 38H72L58 20H65L50 0Z" fill="white" />
        <rect x="45" y="100" width="10" height="18" fill="white" rx="2" />
    </svg>
);

const CATEGORIES = [
    { name: 'Deportes', icon: Dumbbell, color: '#007A4A', bg: 'rgba(0,122,74,0.1)' },
    { name: 'Spa', icon: Sparkles, color: '#C9A84C', bg: 'rgba(201,168,76,0.1)' },
    { name: 'Acuáticas', icon: Waves, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
    { name: 'Danza', icon: Music, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
];

const FEATURED = [
    { title: 'Natación Libre', sub: 'Piscina Olímpica', gradient: 'linear-gradient(135deg, #005A36, #007A4A)', icon: Waves },
    { title: 'Clínica de Tenis', sub: 'Canchas 1-4', gradient: 'linear-gradient(135deg, #1a3a5c, #2d5a8a)', icon: Trophy },
    { title: 'Yoga Restaurativo', sub: 'L-M-V 7:00 am', gradient: 'linear-gradient(135deg, #6B4226, #A0522D)', icon: Heart },
];

export const HomeView = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [reservations, setReservations] = useState<any[]>([]);
    const [loadingRes, setLoadingRes] = useState(true);

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const res = await api.get('/reservations/user');
                setReservations(res.data);
            } catch { /* empty */ }
            finally { setLoadingRes(false); }
        };
        fetchReservations();
    }, []);

    if (!user) return null;

    const f = (delay: number) => ({
        initial: { opacity: 0, y: 14 } as const,
        animate: { opacity: 1, y: 0 } as const,
        transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    });

    return (
        <div className="pb-28">

            {/* ═══════════ GREETING ═══════════ */}
            <motion.div {...f(0)} style={{ padding: '12px 24px 20px' }}>
                <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Bienvenido de vuelta</p>
                <h1 style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {user.first_name} {user.last_name}
                </h1>
            </motion.div>

            {/* ═══════════ CREDENTIAL CARD ═══════════ */}
            <motion.div {...f(0.05)} style={{ padding: '0 20px' }}>
                <div
                    onClick={() => navigate('/profile')}
                    style={{
                        background: 'linear-gradient(145deg, #003D24 0%, #005A36 40%, #007A4A 100%)',
                        borderRadius: 22,
                        padding: '26px 24px',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: 200,
                        cursor: 'pointer',
                        boxShadow: '0 14px 40px rgba(0,90,54,0.3), 0 4px 12px rgba(0,0,0,0.1)',
                    }}
                >
                    {/* Card shine */}
                    <div style={{
                        position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                        animation: 'shimmer 4s ease-in-out infinite',
                    }} />
                    {/* Border glow */}
                    <div className="absolute inset-0 rounded-[22px] border border-white/[0.06] pointer-events-none" />
                    {/* Cedar watermark */}
                    <CedarWatermark />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {/* Top: Club name + badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500 }}>
                                    Centro Libanés
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 3 }}>
                                    Club Deportivo y Social
                                </p>
                            </div>
                            <span style={{
                                background: 'rgba(255,255,255,0.12)',
                                borderRadius: 8,
                                padding: '5px 12px',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#E8D590',
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: 0.5,
                            }}>
                                {user.role === 'titular' ? 'PLATINO' : user.role?.toUpperCase()}
                            </span>
                        </div>

                        {/* Middle: Photo + Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 26, overflow: 'hidden',
                                border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            }}>
                                <img src="/demo-avatar.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Socio</p>
                                <p style={{ color: '#fff', fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 600, marginTop: 2 }}>
                                    {user.first_name} {user.last_name}
                                </p>
                            </div>
                        </div>

                        {/* Bottom: Number + Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 22 }}>
                            <div>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>No. Socio</p>
                                <p style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: 4, marginTop: 3 }}>
                                    {user.member_number}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 1 }}>DESDE 2018</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, justifyContent: 'flex-end' }}>
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-400" />
                                    </span>
                                    <span style={{ color: '#4ADE80', fontSize: 12, fontWeight: 500 }}>Activo</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══════════ MAINTENANCE STATUS ═══════════ */}
            <motion.div {...f(0.1)} style={{ padding: '16px 20px 0' }}>
                <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]"
                    style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12, background: 'rgba(45,139,78,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Check size={20} className="text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Mantenimiento al corriente</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>Próximo pago: 1 Abril 2026 — $4,850 MXN</p>
                    </div>
                </div>
            </motion.div>

            {/* ═══════════ QUICK ACTIONS ═══════════ */}
            <motion.div {...f(0.15)} style={{ padding: '24px 20px 0' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, paddingLeft: 4 }}>
                    Acceso Rápido
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                        { label: 'Lockers', icon: Lock, path: '#' },
                        { label: 'Reservar', icon: CalendarDays, path: '/reservations' },
                        { label: 'Mi Perfil', icon: User, path: '/profile' },
                    ].map((a) => {
                        const Icon = a.icon;
                        return (
                            <motion.button key={a.label}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => navigate(a.path)}
                                className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all"
                                style={{ borderRadius: 18, padding: '20px 10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14,
                                    background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={20} className="text-[var(--color-gold)]" strokeWidth={1.6} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{a.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* ═══════════ CATEGORIES ═══════════ */}
            <motion.div {...f(0.22)} style={{ padding: '24px 20px 0' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14, paddingLeft: 4 }}>
                    Explorar
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <button key={cat.name}
                                onClick={() => navigate('/reservations')}
                                className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all text-left group"
                                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 18 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 14, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={19} style={{ color: cat.color }} strokeWidth={1.6} />
                                </div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>{cat.name}</p>
                                <ArrowRight size={15} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors" style={{ flexShrink: 0 }} />
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* ═══════════ FEATURED (Horizontal scroll) ═══════════ */}
            <motion.div {...f(0.28)} style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', marginBottom: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: 1, textTransform: 'uppercase' }}>Destacados</p>
                    <button onClick={() => navigate('/reservations')} className="text-[11px] font-semibold text-[var(--color-gold)] flex items-center gap-0.5">
                        Ver todo <ChevronRight size={14} />
                    </button>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x" style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 4 }}>
                    {FEATURED.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <button key={i} onClick={() => navigate('/reservations')} className="shrink-0 snap-start text-left" style={{ width: 190, borderRadius: 18, overflow: 'hidden', background: item.gradient }}>
                                <div style={{ padding: 18, height: 130, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 14, right: 14, opacity: 0.1 }}><Icon size={44} strokeWidth={1} /></div>
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={17} style={{ color: 'white' }} strokeWidth={1.6} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{item.title}</h3>
                                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>{item.sub}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* ═══════════ RESERVATIONS ═══════════ */}
            <motion.div {...f(0.33)} style={{ padding: '24px 20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', letterSpacing: 1, textTransform: 'uppercase' }}>Próximas Reservas</p>
                    <button onClick={() => navigate('/reservations')} className="text-[11px] font-semibold text-[var(--color-gold)] flex items-center gap-0.5">
                        Ver todas <ChevronRight size={14} />
                    </button>
                </div>
                {loadingRes ? (
                    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] flex items-center justify-center gap-2.5">
                        <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-[var(--color-gold)] animate-spin" />
                        <span style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>Cargando...</span>
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] text-center" style={{ padding: '28px 20px' }}>
                        <CalendarDays size={22} className="text-[var(--color-text-tertiary)] mx-auto" style={{ marginBottom: 10 }} />
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>No tienes reservas próximas</p>
                        <button onClick={() => navigate('/reservations')} style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gold)', marginTop: 8, display: 'inline-block' }}>
                            Agendar ahora →
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {reservations.map(resv => (
                            <div key={resv.id} className="bg-[var(--color-surface)] border border-[var(--color-border)]" style={{ borderRadius: 18, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(0,122,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Dumbbell size={19} className="text-[var(--color-green-cedar-light)]" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resv.service?.name || 'Reserva'}</h4>
                                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>Próximamente</p>
                                </div>
                                <div style={{ background: 'rgba(0,90,54,0.1)', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-green-cedar-light)' }}>Confirmada</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
};
