import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { CalendarDays, Clock, CheckCircle2, Check, UserX, DollarSign, TrendingUp, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';

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
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'hoy' | 'agenda' | 'ganancias'>('hoy');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0 });
    const [loadingToday, setLoadingToday] = useState(true);
    const [weekCounts, setWeekCounts] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [loadingWeek, setLoadingWeek] = useState(true);
    const [earnings, setEarnings] = useState<any>(null);
    const [loadingEarnings, setLoadingEarnings] = useState(true);

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

        api.get('/staff/me/earnings')
            .then(res => setEarnings(res.data))
            .catch(() => {})
            .finally(() => setLoadingEarnings(false));
    }, []);

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.patch(`/staff/me/appointments/${id}/status`, { status });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            const updated = appointments.map(a => a.id === id ? { ...a, status } : a);
            const confirmed = updated.filter(a => a.status === 'confirmada' || a.status === 'completada').length;
            const pending = updated.filter(a => a.status !== 'confirmada' && a.status !== 'completada' && a.status !== 'no_show').length;
            setStats({ total: updated.length, confirmed, pending });
        } catch { /* silently fail */ }
    };

    if (!user) return null;

    const today = new Date();
    const dateStr = today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
    const todayDayIdx = (() => { const d = today.getDay(); return d === 0 ? 6 : d - 1; })();

    return (
        <div style={{ paddingBottom: 100 }}>

            {/* ═══ Greeting ═══ */}
            <motion.div {...f(0)} style={{ padding: '24px 16px 0' }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'capitalize', marginBottom: 4 }}>{dateStr}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        Hola, {user.first_name}
                    </h1>
                    <div style={{
                        width: 44, height: 44, borderRadius: 22,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'var(--color-bg)', flexShrink: 0,
                        background: 'linear-gradient(135deg, #C9A84C, #B8963E)',
                    }}>
                        {user.first_name[0]}{user.last_name?.[0] || ''}
                    </div>
                </div>
            </motion.div>

            {/* ═══ Tab bar ═══ */}
            <motion.div {...f(0.05)} style={{ padding: '16px 16px 8px' }}>
                <div style={{ display: 'flex', padding: 2, borderRadius: 8, background: 'rgba(120,120,128,0.16)' }}>
                    {(['hoy', 'agenda', 'ganancias'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 13, fontWeight: 500,
                                cursor: 'pointer', outline: 'none', border: 'none', transition: 'all 200ms',
                                color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                background: activeTab === tab ? 'var(--color-surface)' : 'transparent',
                                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)' : 'none',
                            }}>
                            {tab === 'hoy' ? 'Hoy' : tab === 'agenda' ? 'Agenda' : 'Ganancias'}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* ═══ Content ═══ */}
            <div style={{ padding: '0 16px' }}>

                {/* HOY */}
                {activeTab === 'hoy' && (
                    <motion.div {...f(0.08)}>
                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 8, marginBottom: 24 }}>
                            {[
                                { label: 'Citas Hoy', value: stats.total, icon: CalendarDays, color: 'var(--color-green-cedar-light)' },
                                { label: 'Confirmadas', value: stats.confirmed, icon: CheckCircle2, color: 'var(--color-gold)' },
                                { label: 'Pendientes', value: stats.pending, icon: Clock, color: '#06B6D4' },
                            ].map(s => {
                                const Icon = s.icon;
                                return (
                                    <div key={s.label} className="card" style={{ padding: 14, textAlign: 'center' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                            <Icon size={17} style={{ color: s.color }} strokeWidth={1.6} />
                                        </div>
                                        <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{s.value}</p>
                                        <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 6 }}>{s.label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Appointments */}
                        <p className="section-header" style={{ marginBottom: 12 }}>Citas de Hoy</p>
                        {loadingToday ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ height: 68, borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} className="animate-pulse" />
                                ))}
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(201,168,76,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                    <CalendarDays size={22} style={{ color: 'var(--color-text-tertiary)' }} strokeWidth={1.4} />
                                </div>
                                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Sin citas hoy</p>
                                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>No tienes citas asignadas para hoy</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {appointments.map(apt => {
                                    const isPending = apt.status !== 'confirmada';
                                    return (
                                        <div key={apt.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: 12, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                background: isPending ? 'rgba(201,168,76,0.08)' : 'rgba(0,122,74,0.08)',
                                            }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>{apt.time}</span>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.service}</p>
                                                <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{apt.client}</p>
                                            </div>
                                            {apt.status === 'completada' ? (
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 700,
                                                    textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 0,
                                                    background: 'rgba(16,185,129,0.08)', color: '#10B981',
                                                    border: '1px solid rgba(16,185,129,0.15)',
                                                }}>Completada</span>
                                            ) : apt.status === 'no_show' ? (
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 700,
                                                    textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 0,
                                                    background: 'rgba(239,68,68,0.08)', color: '#EF4444',
                                                    border: '1px solid rgba(239,68,68,0.15)',
                                                }}>No Show</span>
                                            ) : (
                                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                    <button onClick={() => updateStatus(apt.id, 'completada')}
                                                        style={{
                                                            width: 32, height: 32, borderRadius: 8, border: 'none',
                                                            background: 'rgba(16,185,129,0.1)', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            touchAction: 'manipulation',
                                                        }}>
                                                        <Check size={15} style={{ color: '#10B981' }} />
                                                    </button>
                                                    <button onClick={() => updateStatus(apt.id, 'no_show')}
                                                        style={{
                                                            width: 32, height: 32, borderRadius: 8, border: 'none',
                                                            background: 'rgba(239,68,68,0.1)', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            touchAction: 'manipulation',
                                                        }}>
                                                        <UserX size={15} style={{ color: '#EF4444' }} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* AGENDA */}
                {activeTab === 'agenda' && (
                    <motion.div {...f(0.08)} style={{ marginTop: 8 }}>
                        <p className="section-header" style={{ marginBottom: 12 }}>Semana Actual</p>
                        <div className="card" style={{ overflow: 'hidden' }}>
                            {DAYS.map((day, i) => {
                                const isToday = i === todayDayIdx;
                                const count = weekCounts[i];
                                return (
                                    <div key={day} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '14px 16px',
                                        borderBottom: i < DAYS.length - 1 ? '1px solid var(--color-border)' : 'none',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isToday ? 'rgba(201,168,76,0.1)' : 'var(--color-surface-hover)',
                                            }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? 'var(--color-gold)' : 'var(--color-text-secondary)' }}>
                                                    {day.slice(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: isToday ? 'var(--color-gold)' : 'var(--color-text-primary)' }}>{day}</p>
                                        </div>
                                        {loadingWeek ? (
                                            <div style={{ width: 48, height: 16, borderRadius: 4, background: 'var(--color-surface-hover)' }} className="animate-pulse" />
                                        ) : (
                                            <span style={{ fontSize: 12, fontWeight: 600, color: count > 0 ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                                                {count > 0 ? `${count} cita${count !== 1 ? 's' : ''}` : '–'}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* GANANCIAS */}
                {activeTab === 'ganancias' && (
                    <motion.div {...f(0.08)} style={{ marginTop: 8 }}>
                        {loadingEarnings ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ height: 80, borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} className="animate-pulse" />
                                ))}
                            </div>
                        ) : !earnings ? (
                            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
                                <DollarSign size={22} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 14px' }} />
                                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Sin datos de ganancias</p>
                            </div>
                        ) : (
                            <>
                                {/* Earnings Card */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #1a1408, #2d2210)',
                                    borderRadius: 20, padding: 24, marginBottom: 20,
                                    border: '1px solid rgba(201,168,76,0.15)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <TrendingUp size={16} style={{ color: '#C9A84C' }} />
                                        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            Ganancias · {earnings.period}
                                        </p>
                                    </div>
                                    <h2 style={{ fontSize: 32, fontWeight: 700, color: '#C9A84C', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                        ${earnings.month_payout.toLocaleString('es-MX')}
                                        <span style={{ fontSize: 14, color: 'rgba(201,168,76,0.5)', fontWeight: 400, marginLeft: 4 }}>MXN</span>
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
                                        <div>
                                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Servicios</p>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{earnings.month_services}</p>
                                        </div>
                                        <div style={{ width: 1, height: 24, background: 'rgba(201,168,76,0.15)' }} />
                                        <div>
                                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Bruto</p>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>${earnings.month_gross.toLocaleString('es-MX')}</p>
                                        </div>
                                        <div style={{ width: 1, height: 24, background: 'rgba(201,168,76,0.15)' }} />
                                        <div>
                                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                                                {earnings.fixed_rent > 0 ? 'Renta' : 'Comisión'}
                                            </p>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                                                {earnings.fixed_rent > 0
                                                    ? `$${earnings.fixed_rent.toLocaleString('es-MX')}`
                                                    : `${Math.round(earnings.commission_rate * 100)}%`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Services List */}
                                {earnings.services.length > 0 && (
                                    <>
                                        <p className="section-header" style={{ marginBottom: 12 }}>Servicios del Mes</p>
                                        <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
                                            {earnings.services.map((s: any, idx: number) => (
                                                <div key={s.id} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '12px 16px',
                                                    borderBottom: idx < earnings.services.length - 1 ? '1px solid var(--color-border)' : 'none',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 8, height: 8, borderRadius: 4, background: '#C9A84C', flexShrink: 0 }} />
                                                        <div>
                                                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.service}</p>
                                                            <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                                                {s.client} · {new Date(s.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#C9A84C', flexShrink: 0 }}>
                                                        ${s.price.toLocaleString('es-MX')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Settlement History */}
                                {earnings.settlements.length > 0 && (
                                    <>
                                        <p className="section-header" style={{ marginBottom: 12 }}>Liquidaciones</p>
                                        <div className="card" style={{ overflow: 'hidden' }}>
                                            {earnings.settlements.map((s: any, idx: number) => {
                                                const isPaid = s.status === 'pagado';
                                                return (
                                                    <div key={s.id} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '12px 16px',
                                                        borderBottom: idx < earnings.settlements.length - 1 ? '1px solid var(--color-border)' : 'none',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <Receipt size={14} style={{ color: isPaid ? '#10B981' : 'var(--color-text-tertiary)', flexShrink: 0 }} />
                                                            <div>
                                                                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                                                    {new Date(s.period_start).toLocaleDateString('es-MX', { month: 'short' })} — {new Date(s.period_end).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                                                                </p>
                                                                <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                                                    {s.total_services} servicio{s.total_services !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <p style={{ fontSize: 13, fontWeight: 700, color: isPaid ? '#10B981' : 'var(--color-text-primary)' }}>
                                                                ${s.staff_payout.toLocaleString('es-MX')}
                                                            </p>
                                                            <span style={{
                                                                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                padding: '2px 6px', borderRadius: 4,
                                                                background: isPaid ? 'rgba(16,185,129,0.08)' : 'rgba(201,168,76,0.08)',
                                                                color: isPaid ? '#10B981' : '#C9A84C',
                                                            }}>{isPaid ? 'Pagado' : 'Pendiente'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

            </div>
        </div>
    );
};
