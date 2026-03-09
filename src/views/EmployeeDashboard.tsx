import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import {
    CalendarDays, Clock, LogOut, CheckCircle2,
    Users, Briefcase, MapPin, ShieldCheck, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const CedarMini = () => (
    <svg viewBox="0 0 100 120" fill="none" className="absolute right-5 bottom-3 h-[90px] opacity-[0.08] pointer-events-none">
        <path d="M50 0L35 20H42L28 38H38L20 60H35L15 82H40L30 100H70L60 82H85L65 60H80L62 38H72L58 20H65L50 0Z" fill="currentColor" />
        <rect x="45" y="100" width="10" height="18" fill="currentColor" rx="2" />
    </svg>
);

interface Appointment {
    id: string;
    service: string;
    client: string;
    time: string;
    end_time: string;
    status: string;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const f = (delay: number) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

export const EmployeeDashboard = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'hoy' | 'agenda' | 'perfil'>('hoy');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0 });
    const [loadingToday, setLoadingToday] = useState(true);
    const [weekCounts, setWeekCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [loadingWeek, setLoadingWeek] = useState(true);

    useEffect(() => {
        api.get('/staff/me/appointments')
            .then(res => {
                setAppointments(res.data.appointments);
                setStats({ total: res.data.total, confirmed: res.data.confirmed, pending: res.data.pending });
            })
            .catch(() => {})
            .finally(() => setLoadingToday(false));

        api.get('/staff/me/week')
            .then(res => setWeekCounts(res.data.counts))
            .catch(() => {})
            .finally(() => setLoadingWeek(false));
    }, []);

    if (!user) return null;

    const handleLogout = () => { logout(); navigate('/login'); };

    const today = new Date();
    const dateStr = today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const todayDayIdx = (() => { const d = today.getDay(); return d === 0 ? 6 : d - 1; })();

    return (
        <div className="min-h-screen bg-[var(--color-bg)]" style={{ maxWidth: 480, margin: '0 auto' }}>

            {/* ═══ Header ═══ */}
            <div className="sticky top-0 z-50 glass px-5 h-13 flex items-center justify-between border-b border-[var(--color-border)]" style={{ height: 52 }}>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Centro Libanés" className="h-5 w-auto object-contain opacity-80" />
                    <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase">Staff</span>
                </div>
                <button onClick={handleLogout} aria-label="Cerrar Sesión"
                    className="w-8 h-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
                    <LogOut size={14} className="text-[var(--color-text-tertiary)]" />
                </button>
            </div>

            {/* ═══ Greeting ═══ */}
            <motion.div {...f(0)} style={{ padding: '16px 20px 0' }}>
                <p className="text-xs text-[var(--color-text-tertiary)] capitalize mb-1">{dateStr}</p>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        Hola, {user.first_name}
                    </h1>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-[var(--color-bg)] shrink-0"
                        style={{ background: 'linear-gradient(135deg, #C9A84C, #B8963E)' }}>
                        {user.first_name[0]}{user.last_name?.[0] || ''}
                    </div>
                </div>
            </motion.div>

            {/* ═══ Tab bar ═══ */}
            <motion.div {...f(0.05)} className="px-5 pt-4 pb-2">
                <div className="flex bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-1 gap-0.5">
                    {(['hoy', 'agenda', 'perfil'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === tab
                                ? 'bg-[var(--color-gold)] text-[var(--color-bg)]'
                                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}>
                            {tab === 'hoy' ? 'Hoy' : tab === 'agenda' ? 'Agenda' : 'Perfil'}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* ═══ Content ═══ */}
            <div className="px-5 pb-16">

                {/* HOY */}
                {activeTab === 'hoy' && (
                    <motion.div {...f(0.08)}>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2.5 mt-2 mb-5">
                            {[
                                { label: 'Citas Hoy', value: stats.total, icon: CalendarDays, color: 'var(--color-green-cedar-light)' },
                                { label: 'Confirmadas', value: stats.confirmed, icon: CheckCircle2, color: 'var(--color-gold)' },
                                { label: 'Pendientes', value: stats.pending, icon: Clock, color: '#06B6D4' },
                            ].map(s => {
                                const Icon = s.icon;
                                return (
                                    <div key={s.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3 text-center">
                                        <Icon size={16} className="mx-auto mb-1.5" style={{ color: s.color }} strokeWidth={1.6} />
                                        <p className="text-2xl font-bold text-[var(--color-text-primary)] leading-none">{s.value}</p>
                                        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">{s.label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Appointments */}
                        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase mb-3">Citas de Hoy</p>
                        {loadingToday ? (
                            <div className="space-y-2.5">
                                {[1, 2, 3].map(i => <div key={i} className="h-[68px] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />)}
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 text-center">
                                <CalendarDays size={28} className="text-[var(--color-text-tertiary)] mx-auto mb-3" strokeWidth={1.4} />
                                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Sin citas hoy</p>
                                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">No tienes citas asignadas para hoy</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {appointments.map(apt => {
                                    const isPending = apt.status !== 'confirmada';
                                    return (
                                        <div key={apt.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex items-center gap-3.5">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ background: isPending ? 'rgba(201,168,76,0.1)' : 'rgba(0,122,74,0.1)' }}>
                                                <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">{apt.time}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{apt.service}</p>
                                                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{apt.client}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider shrink-0 ${isPending
                                                ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                {isPending ? 'Pendiente' : 'Confirmada'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* AGENDA */}
                {activeTab === 'agenda' && (
                    <motion.div {...f(0.08)} className="mt-2">
                        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase mb-3">Semana Actual</p>
                        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                            {DAYS.map((day, i) => {
                                const isToday = i === todayDayIdx;
                                const count = weekCounts[i];
                                return (
                                    <div key={day} className={`flex items-center justify-between px-4 py-3.5 ${i < DAYS.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isToday ? 'bg-[var(--color-gold)]/15' : 'bg-[var(--color-surface-hover)]'}`}>
                                                <span className={`text-[10px] font-bold ${isToday ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-secondary)]'}`}>
                                                    {day.slice(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <p className={`text-[13px] font-semibold ${isToday ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-primary)]'}`}>{day}</p>
                                        </div>
                                        {loadingWeek ? (
                                            <div className="w-12 h-4 rounded bg-[var(--color-surface-hover)] animate-pulse" />
                                        ) : (
                                            <span className={`text-[11px] font-semibold ${count > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>
                                                {count > 0 ? `${count} cita${count !== 1 ? 's' : ''}` : '–'}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* PERFIL */}
                {activeTab === 'perfil' && (
                    <motion.div {...f(0.08)} className="mt-2 space-y-4">
                        {/* Staff credential card */}
                        <div className="relative overflow-hidden rounded-2xl p-5"
                            style={{
                                background: 'linear-gradient(145deg, #1a1408 0%, #2d2210 50%, #1a1408 100%)',
                                border: '1px solid rgba(201,168,76,0.2)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            }}>
                            <CedarMini />
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div className="flex items-center justify-between mb-4">
                                    <img src="/logo.png" alt="Centro Libanés" className="h-5 w-auto object-contain opacity-70" />
                                    <span className="text-[9px] font-bold tracking-[2px] uppercase px-2.5 py-1 rounded-lg"
                                        style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                                        Staff
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #C9A84C, #B8963E)', color: '#1a1408', fontSize: 16 }}>
                                        {user.first_name[0]}{user.last_name?.[0] || ''}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Empleado</p>
                                        <h2 className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                                            {user.first_name} {user.last_name}
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div>
                                        <p className="text-[9px] text-white/30 uppercase tracking-wider">Puesto</p>
                                        <p className="text-[12px] text-white/80 capitalize font-medium mt-0.5">{user.role}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-white/30 uppercase tracking-wider">Unidad</p>
                                        <p className="text-[12px] text-white/80 capitalize font-medium mt-0.5">{user.unit_name || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                            {[
                                { icon: Briefcase, label: 'Tipo de Contrato', value: user.employment_type?.replace('_', ' ') || 'N/A' },
                                { icon: MapPin, label: 'Unidad', value: user.unit_name || 'N/A' },
                                { icon: Users, label: 'Rol', value: user.role || 'N/A' },
                            ].map((item, i, arr) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className={`flex items-center gap-3 p-4 ${i < arr.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
                                        <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-hover)] flex items-center justify-center shrink-0">
                                            <Icon size={15} className="text-[var(--color-text-secondary)]" strokeWidth={1.6} />
                                        </div>
                                        <span className="text-[12px] text-[var(--color-text-tertiary)] flex-1">{item.label}</span>
                                        <span className="text-[12px] font-semibold text-[var(--color-text-primary)] capitalize">{item.value}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Admin link — only for administrador role */}
                        {user.role === 'administrador' && (
                            <button onClick={() => navigate('/admin')}
                                className="w-full py-4 rounded-2xl border flex items-center justify-between px-4 cursor-pointer transition-colors hover:bg-[var(--color-gold)]/5"
                                style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.2)' }}>
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={16} className="text-[var(--color-gold)]" />
                                    <span className="text-[13px] font-semibold text-[var(--color-gold)]">Centro de Control Admin</span>
                                </div>
                                <ChevronRight size={15} className="text-[var(--color-gold)]/60" />
                            </button>
                        )}

                        {/* Logout */}
                        <button onClick={handleLogout}
                            className="w-full py-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-semibold text-[var(--color-red-lebanese)] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center justify-center gap-2 cursor-pointer">
                            <LogOut size={15} /> Cerrar Sesión
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
