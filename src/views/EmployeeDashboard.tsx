import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import {
    CalendarDays, Clock, LogOut, CheckCircle2,
    Users, Briefcase, MapPin, ShieldCheck
} from 'lucide-react';

/* Cedar SVG small watermark */
const CedarMini = () => (
    <svg viewBox="0 0 100 120" fill="none" className="h-8 opacity-[0.08]">
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
            .catch(() => { /* silently fail */ })
            .finally(() => setLoadingToday(false));

        api.get('/staff/me/week')
            .then(res => setWeekCounts(res.data.counts))
            .catch(() => { /* silently fail */ })
            .finally(() => setLoadingWeek(false));
    }, []);

    if (!user) return null;

    const handleLogout = () => { logout(); navigate('/login'); };

    const today = new Date();
    const dateStr = today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const todayDayIdx = (() => { const d = today.getDay(); return d === 0 ? 6 : d - 1; })(); // 0=Mon..5=Sat

    return (
        <div className="min-h-screen bg-[var(--color-bg)]" style={{ maxWidth: 480, margin: '0 auto' }}>
            {/* ═══ Compact header bar ═══ */}
            <div className="sticky top-0 z-50 glass px-5 h-12 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="" className="h-5 w-auto object-contain" />
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] tracking-wider uppercase">Staff</span>
                </div>
                <button onClick={handleLogout} aria-label="Cerrar Sesión" className="w-8 h-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center cursor-pointer">
                    <LogOut size={14} className="text-[var(--color-text-tertiary)]" />
                </button>
            </div>

            {/* ═══ Staff greeting + avatar ═══ */}
            <div style={{ padding: '16px 20px 0' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-[var(--color-text-tertiary)] capitalize">{dateStr}</p>
                        <h1 className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                            Hola, {user.first_name}
                        </h1>
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #C9A84C, #B8963E)' }}>
                        {user.first_name[0]}{user.last_name?.[0] || ''}
                    </div>
                </div>
            </div>

            {/* ═══ Tab bar ═══ */}
            <div className="px-5 pt-4 pb-1">
                <div className="flex bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-1 gap-0.5">
                    {(['hoy', 'agenda', 'perfil'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === tab
                                ? 'bg-[var(--color-gold)] text-[var(--color-bg)]'
                                : 'text-[var(--color-text-tertiary)]'
                                }`}
                        >
                            {tab === 'hoy' ? 'Hoy' : tab === 'agenda' ? 'Agenda' : 'Perfil'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ Content ═══ */}
            <div className="px-5 pb-10">
                {activeTab === 'hoy' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2.5 mt-4 mb-5">
                            {[
                                { label: 'Citas Hoy', value: stats.total, icon: CalendarDays, color: '#007A4A' },
                                { label: 'Confirmadas', value: stats.confirmed, icon: CheckCircle2, color: '#C9A84C' },
                                { label: 'Pendientes', value: stats.pending, icon: Clock, color: '#06B6D4' },
                            ].map(s => {
                                const Icon = s.icon;
                                return (
                                    <div key={s.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3 text-center">
                                        <Icon size={16} className="mx-auto mb-1" style={{ color: s.color }} strokeWidth={1.6} />
                                        <p className="text-xl font-bold text-[var(--color-text-primary)]">{s.value}</p>
                                        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{s.label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Appointments list */}
                        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase mb-2.5">Citas de Hoy</p>
                        {loadingToday ? (
                            <div className="space-y-2.5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-[68px] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
                                ))}
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
                                            {/* Time badge */}
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
                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                }`}>
                                                {isPending ? 'Pend.' : 'Conf.'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'agenda' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }} className="mt-4">
                        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase mb-2.5">Semana Actual</p>
                        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                            {DAYS.map((day, i) => {
                                const isToday = i === todayDayIdx;
                                const count = weekCounts[i];
                                return (
                                    <div key={day} className={`flex items-center justify-between p-3.5 ${i < DAYS.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isToday ? 'bg-[var(--color-gold)]/15' : 'bg-[var(--color-surface-hover)]'}`}>
                                                <span className={`text-[10px] font-bold ${isToday ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-secondary)]'}`}>
                                                    {day.slice(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className={`text-[13px] font-semibold ${isToday ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-primary)]'}`}>{day}</p>
                                                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                                                    {i < 5 ? '09:00 – 18:00' : '09:00 – 14:00'}
                                                </p>
                                            </div>
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
                    </div>
                )}

                {activeTab === 'perfil' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }} className="mt-4">
                        {/* Employee credential */}
                        <div className="relative overflow-hidden rounded-2xl p-5"
                            style={{
                                background: 'linear-gradient(145deg, #2a2317 0%, #3d3225 50%, #2a2317 100%)',
                                border: '1px solid rgba(201,168,76,0.15)',
                            }}>
                            <div className="absolute right-4 top-4 text-[var(--color-gold)]"><CedarMini /></div>
                            <p className="text-[10px] text-[var(--color-gold)]/50 tracking-[2px] uppercase font-medium">Empleado · Centro Libanés</p>
                            <h2 className="text-lg font-bold text-white mt-2" style={{ fontFamily: 'var(--font-display)' }}>{user.first_name} {user.last_name}</h2>
                            <div className="flex items-center gap-4 mt-3">
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Puesto</p>
                                    <p className="text-sm text-white/80 capitalize font-medium">{user.role}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Unidad</p>
                                    <p className="text-sm text-white/80 capitalize font-medium">{user.unit_name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden mt-4">
                            {[
                                { icon: Briefcase, label: 'Tipo', value: user.employment_type ? user.employment_type.replace('_', ' ') : 'N/A' },
                                { icon: MapPin, label: 'Unidad', value: user.unit_name || 'N/A' },
                                { icon: CalendarDays, label: 'Horario', value: 'L-V 9:00-18:00' },
                                { icon: Users, label: 'Rol', value: user.role || 'N/A' },
                            ].map((item, i, arr) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className={`flex items-center gap-3 p-3.5 ${i < arr.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
                                        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] flex items-center justify-center shrink-0">
                                            <Icon size={15} className="text-[var(--color-text-secondary)]" strokeWidth={1.6} />
                                        </div>
                                        <span className="text-[12px] text-[var(--color-text-tertiary)] flex-1">{item.label}</span>
                                        <span className="text-[12px] font-semibold text-[var(--color-text-primary)] capitalize">{item.value}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Admin link */}
                        <button
                            onClick={() => navigate('/admin')}
                            className="w-full mt-4 py-3.5 rounded-2xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 text-[13px] font-semibold text-[var(--color-gold)] hover:bg-[var(--color-gold)]/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <ShieldCheck size={15} /> Centro de Control Admin
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full mt-3 py-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-semibold text-[var(--color-red-lebanese)] hover:bg-[var(--color-surface-hover)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <LogOut size={15} /> Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ Bottom Tab Bar ═══ */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full glass border-t border-[var(--color-border)] flex justify-around" style={{ maxWidth: 480, paddingBottom: 'env(safe-area-inset-bottom, 16px)', paddingTop: 8 }}>
                {[
                    { key: 'hoy' as const, label: 'Hoy', icon: CalendarDays },
                    { key: 'agenda' as const, label: 'Agenda', icon: Clock },
                    { key: 'perfil' as const, label: 'Perfil', icon: Users },
                ].map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className="flex flex-col items-center gap-0.5 py-1 px-4 transition-colors cursor-pointer"
                            style={{ color: active ? 'var(--color-gold)' : 'var(--color-text-tertiary)' }}>
                            <Icon size={20} strokeWidth={active ? 2 : 1.4} />
                            <span className="text-[10px]" style={{ fontWeight: active ? 600 : 400 }}>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
