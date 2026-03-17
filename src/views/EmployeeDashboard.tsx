import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { CalendarDays, Clock, CheckCircle2, Check, UserX, DollarSign, TrendingUp, Receipt, QrCode, ShieldCheck, UserCheck, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// ── Recepcion Tab (QR / Code validation for all staff) ──────────
const RecepcionTab = () => {
    const { showToast } = useToast();
    const [codeInput, setCodeInput] = useState('');
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [checkingIn, setCheckingIn] = useState(false);

    const getResultType = (res: any): 'granted' | 'denied' | 'suspended' => {
        if (!res) return 'denied';
        // Member QR result
        if (res.member_number !== undefined) {
            if (res.valid && res.status === 'activa') return 'granted';
            if (res.status === 'suspendida') return 'suspended';
            return 'denied';
        }
        // Guest pass result
        if (res.valid) return 'granted';
        if (res.pass?.status === 'cancelled') return 'denied';
        return 'denied';
    };

    const resultColors = {
        granted: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: '#10B981', label: 'ACCESO PERMITIDO' },
        denied: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#EF4444', label: 'ACCESO DENEGADO' },
        suspended: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#F59E0B', label: 'MEMBRESIA SUSPENDIDA' },
    };

    const handleValidate = async () => {
        const code = codeInput.trim();
        if (!code) return;
        setValidating(true);
        setResult(null);

        try {
            const isMemberCode = code.toUpperCase().startsWith('CL-');

            if (isMemberCode) {
                const res = await api.post('/admin/qr/validate', { code: code.toUpperCase() });
                setResult({ type: 'member', ...res.data });
            } else {
                const res = await api.post('/guests/validate', { pass_code: code.toUpperCase() });
                setResult({ type: 'guest', ...res.data });
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Codigo invalido';
            setResult({ type: 'error', valid: false, message: errorMsg });
        } finally {
            setValidating(false);
        }
    };

    const handleCheckin = async (passId: string) => {
        setCheckingIn(true);
        try {
            await api.post(`/guests/${passId}/checkin`);
            showToast('Invitado registrado exitosamente');
            setResult((prev: any) => prev ? { ...prev, checkedIn: true } : prev);
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Error al registrar');
        } finally {
            setCheckingIn(false);
        }
    };

    const handleClear = () => {
        setCodeInput('');
        setResult(null);
    };

    const rType = result ? getResultType(result) : null;
    const colors = rType ? resultColors[rType] : null;

    return (
        <motion.div {...f(0.08)} style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(201,168,76,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <QrCode size={20} style={{ color: '#C9A84C' }} strokeWidth={1.6} />
                </div>
                <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Control de Acceso</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Valida codigos de socio o pases de invitado</p>
                </div>
            </div>

            {/* Input area */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{
                            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--color-text-tertiary)', pointerEvents: 'none',
                        }} />
                        <input
                            value={codeInput}
                            onChange={e => setCodeInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleValidate()}
                            placeholder="CL-0001 o codigo de invitado..."
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                paddingLeft: 36, paddingRight: 14, paddingTop: 12, paddingBottom: 12,
                                background: 'var(--color-surface-hover)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 12, fontSize: 15, fontWeight: 500,
                                color: 'var(--color-text-primary)', outline: 'none',
                                letterSpacing: '0.02em',
                            }}
                        />
                    </div>
                    <button
                        onClick={handleValidate}
                        disabled={validating || !codeInput.trim()}
                        style={{
                            paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12,
                            background: validating || !codeInput.trim() ? 'rgba(201,168,76,0.3)' : '#C9A84C',
                            color: '#0F1419', fontWeight: 700, fontSize: 13,
                            borderRadius: 12, border: 'none',
                            cursor: validating || !codeInput.trim() ? 'default' : 'pointer',
                            touchAction: 'manipulation',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 6, minWidth: 80, flexShrink: 0,
                        }}
                    >
                        {validating ? (
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            'Validar'
                        )}
                    </button>
                </div>

                {/* Quick hint */}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <span style={{
                        fontSize: 10, color: 'var(--color-text-tertiary)',
                        background: 'rgba(201,168,76,0.06)', padding: '3px 8px',
                        borderRadius: 6, fontWeight: 500,
                    }}>
                        CL-XXXX = Socio
                    </span>
                    <span style={{
                        fontSize: 10, color: 'var(--color-text-tertiary)',
                        background: 'rgba(6,182,212,0.06)', padding: '3px 8px',
                        borderRadius: 6, fontWeight: 500,
                    }}>
                        Otro = Pase invitado
                    </span>
                </div>
            </div>

            {/* Result card */}
            <AnimatePresence mode="wait">
                {result && colors && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="card"
                        style={{
                            padding: 0, overflow: 'hidden',
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        {/* Status banner */}
                        <div style={{
                            background: colors.bg, padding: '14px 20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 12, height: 12, borderRadius: 6,
                                    background: colors.text,
                                    boxShadow: `0 0 8px ${colors.text}40`,
                                }} />
                                <p style={{
                                    fontSize: 13, fontWeight: 800, color: colors.text,
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                }}>
                                    {colors.label}
                                </p>
                            </div>
                            <button
                                onClick={handleClear}
                                style={{
                                    background: 'none', border: 'none', padding: 4,
                                    cursor: 'pointer', touchAction: 'manipulation',
                                    color: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 600,
                                }}
                            >
                                Limpiar
                            </button>
                        </div>

                        {/* Details */}
                        <div style={{ padding: '16px 20px' }}>
                            {/* Member result */}
                            {result.type === 'member' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 14,
                                            background: `${colors.text}12`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <ShieldCheck size={22} style={{ color: colors.text }} strokeWidth={1.6} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                                {result.titular || 'Socio'}
                                            </p>
                                            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                                Socio #{result.member_number}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex', gap: 8,
                                        paddingTop: 12,
                                        borderTop: '1px solid var(--color-border)',
                                    }}>
                                        <div style={{
                                            flex: 1, padding: '8px 12px', borderRadius: 10,
                                            background: 'var(--color-surface-hover)', textAlign: 'center',
                                        }}>
                                            <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Tipo</p>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: '#C9A84C' }}>{result.tier || '—'}</p>
                                        </div>
                                        <div style={{
                                            flex: 1, padding: '8px 12px', borderRadius: 10,
                                            background: 'var(--color-surface-hover)', textAlign: 'center',
                                        }}>
                                            <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Estado</p>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: colors.text, textTransform: 'capitalize' }}>{result.status || '—'}</p>
                                        </div>
                                    </div>
                                    {result.message && (
                                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                            {result.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Guest pass result */}
                            {result.type === 'guest' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 14,
                                            background: `${colors.text}12`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <UserCheck size={22} style={{ color: colors.text }} strokeWidth={1.6} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                                {result.pass?.guest_name || 'Invitado'}
                                            </p>
                                            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                                Pase de invitado
                                                {result.pass?.invited_by && (
                                                    <span> &middot; Invita: {result.pass.invited_by.first_name} {result.pass.invited_by.last_name}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {result.pass && (
                                        <div style={{
                                            display: 'flex', gap: 8,
                                            paddingTop: 12,
                                            borderTop: '1px solid var(--color-border)',
                                        }}>
                                            <div style={{
                                                flex: 1, padding: '8px 12px', borderRadius: 10,
                                                background: 'var(--color-surface-hover)', textAlign: 'center',
                                            }}>
                                                <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Codigo</p>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: '#C9A84C', fontFamily: 'monospace', letterSpacing: 1 }}>{result.pass.pass_code}</p>
                                            </div>
                                            <div style={{
                                                flex: 1, padding: '8px 12px', borderRadius: 10,
                                                background: 'var(--color-surface-hover)', textAlign: 'center',
                                            }}>
                                                <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Estado</p>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: colors.text, textTransform: 'capitalize' }}>{result.pass.status || '—'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {!result.valid && result.reason && (
                                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                            {result.reason}
                                        </p>
                                    )}

                                    {/* Check-in button for valid active guest passes */}
                                    {result.valid && result.pass && !result.checkedIn && (
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleCheckin(result.pass.id)}
                                            disabled={checkingIn}
                                            style={{
                                                width: '100%', padding: '14px 0',
                                                background: checkingIn ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10B981, #059669)',
                                                color: 'white', fontWeight: 700, fontSize: 14,
                                                borderRadius: 12, border: 'none',
                                                cursor: checkingIn ? 'default' : 'pointer',
                                                touchAction: 'manipulation',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                marginTop: 4,
                                            }}
                                        >
                                            {checkingIn ? (
                                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                            ) : (
                                                <>
                                                    <Check size={18} strokeWidth={2.5} />
                                                    Registrar Entrada
                                                </>
                                            )}
                                        </motion.button>
                                    )}

                                    {/* Already checked in */}
                                    {result.checkedIn && (
                                        <div style={{
                                            width: '100%', padding: '14px 0', marginTop: 4,
                                            background: 'rgba(16,185,129,0.06)',
                                            border: '1px solid rgba(16,185,129,0.2)',
                                            borderRadius: 12,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            color: '#10B981', fontWeight: 700, fontSize: 14,
                                        }}>
                                            <CheckCircle2 size={18} strokeWidth={2} />
                                            Entrada Registrada
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error result */}
                            {result.type === 'error' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 14,
                                        background: 'rgba(239,68,68,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <ShieldCheck size={22} style={{ color: '#EF4444' }} strokeWidth={1.6} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Codigo no encontrado</p>
                                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                            {result.message || 'Verifica el codigo e intenta de nuevo'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state when no result */}
            {!result && !validating && (
                <motion.div {...f(0.15)} className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 18,
                        background: 'rgba(201,168,76,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <QrCode size={26} style={{ color: 'var(--color-text-tertiary)' }} strokeWidth={1.4} />
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        Escanea o ingresa un codigo
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 6, lineHeight: 1.5 }}>
                        Ingresa el codigo QR del socio (CL-XXXX) o el codigo del pase de invitado para validar el acceso
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
};

export const EmployeeDashboard = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'hoy' | 'agenda' | 'ganancias' | 'recepcion'>('hoy');
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
                    {(['hoy', 'agenda', 'ganancias', 'recepcion'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 12, fontWeight: 500,
                                cursor: 'pointer', outline: 'none', border: 'none', transition: 'all 200ms',
                                touchAction: 'manipulation',
                                color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                background: activeTab === tab ? 'var(--color-surface)' : 'transparent',
                                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)' : 'none',
                            }}>
                            {tab === 'hoy' ? 'Hoy' : tab === 'agenda' ? 'Agenda' : tab === 'ganancias' ? 'Ganancias' : 'Recepcion'}
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

                {/* RECEPCION */}
                {activeTab === 'recepcion' && <RecepcionTab />}

            </div>
        </div>
    );
};
