import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import {
    ArrowLeft, CreditCard, Apple, CheckCircle2, Wallet, Clock,
    ChevronRight, Lock, Dumbbell, Receipt, AlertCircle, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';

const f = (delay: number) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    pendiente: { bg: 'rgba(201,168,76,0.1)', color: '#C9A84C', label: 'Pendiente' },
    vencido: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'Vencido' },
    pagado: { bg: 'rgba(16,185,129,0.1)', color: '#10B981', label: 'Pagado' },
    completado: { bg: 'rgba(16,185,129,0.1)', color: '#10B981', label: 'Pagado' },
    fallido: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'Fallido' },
};

export const PaymentView = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const [statement, setStatement] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'statement' | 'checkout' | 'processing' | 'success'>('statement');
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'apple_pay'>('card');
    const [paymentId, setPaymentId] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatement = async () => {
            if (!user?.membership_id) { setLoading(false); return; }
            try {
                const res = await api.get(`/payments/${user.membership_id}/statement`);
                setStatement(res.data);
            } catch { /* silently fail */ }
            finally { setLoading(false); }
        };
        fetchStatement();
    }, [user]);

    const handleCheckout = async () => {
        if (!statement?.totals?.total_due) return;
        setView('processing');
        try {
            const res = await api.post('/payments/create-intent', {
                amount: statement.totals.total_due,
                source_type: 'mantenimiento',
                source_id: statement.maintenance?.find((b: any) => b.status === 'pendiente')?.id || null,
                currency: 'mxn',
            });
            setPaymentId(res.data.payment_id);
            if (res.data.dev_mode) {
                await api.post(`/payments/${res.data.payment_id}/confirm`, {});
            }
            setView('success');
        } catch (err: any) {
            showToast(err.response?.data?.error || err.message);
            setView('checkout');
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: 9999, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-gold)' }} />
            </div>
        );
    }

    if (!statement) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: 20, textAlign: 'center', color: 'var(--color-text-tertiary)', paddingTop: 80 }}>
                No se encontró estado de cuenta
            </div>
        );
    }

    const allPayments = Object.values(statement.payments || {}).flat() as any[];
    const recentPayments = allPayments
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    const pendingMaintenance = (statement.maintenance || []).filter((b: any) => ['pendiente', 'vencido'].includes(b.status));
    const hasPending = statement.totals?.total_due > 0;

    return (
        <div style={{ maxWidth: 430, marginLeft: 'auto', marginRight: 'auto', minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 120 }}>
            {/* Header */}
            <div className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, paddingLeft: 16, paddingRight: 16, height: 56, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-border)' }}>
                <button onClick={() => view === 'checkout' ? setView('statement') : navigate(-1)} aria-label="Volver"
                    style={{ width: 40, height: 40, borderRadius: 9999, background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)', cursor: 'pointer', touchAction: 'manipulation', border: 'none' }}>
                    <ArrowLeft size={18} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {view === 'statement' ? 'Estado de Cuenta' : view === 'checkout' ? 'Pagar' : view === 'processing' ? 'Procesando' : 'Confirmación'}
                </span>
            </div>

            <div style={{ padding: '0 16px' }}>
                <AnimatePresence mode="wait">

                    {/* ═══ STATEMENT VIEW ═══ */}
                    {view === 'statement' && (
                        <motion.div key="statement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 24 }}>

                            {/* Balance Card */}
                            <motion.div {...f(0)} style={{
                                background: 'linear-gradient(135deg, #1A1F26 0%, #0F1419 100%)',
                                borderRadius: 24, padding: 24, border: '1px solid var(--color-border)',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 9999, background: 'rgba(201,168,76,0.04)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <Wallet size={16} style={{ color: 'var(--color-gold)' }} />
                                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Balance</p>
                                </div>
                                <h1 style={{ fontSize: 36, fontWeight: 700, color: hasPending ? '#EF4444' : '#10B981', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                    {hasPending ? '-' : ''}${statement.totals?.total_due?.toLocaleString('es-MX') || '0'}
                                    <span style={{ fontSize: 16, color: 'var(--color-text-tertiary)', fontWeight: 400, marginLeft: 4 }}>MXN</span>
                                </h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
                                    <div>
                                        <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Membresía</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>#{statement.membership_number}</p>
                                    </div>
                                    <div style={{ width: 1, height: 24, background: 'var(--color-border)' }} />
                                    <div>
                                        <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Plan</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gold)', textTransform: 'capitalize' }}>{statement.tier}</p>
                                    </div>
                                    <div style={{ width: 1, height: 24, background: 'var(--color-border)' }} />
                                    <div>
                                        <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Cuota</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>${statement.monthly_fee?.toLocaleString('es-MX')}</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Pending Charges */}
                            {pendingMaintenance.length > 0 && (
                                <motion.div {...f(0.05)}>
                                    <p className="section-header" style={{ marginBottom: 12 }}>Cargos Pendientes</p>
                                    <div className="card" style={{ overflow: 'hidden' }}>
                                        {pendingMaintenance.map((bill: any, idx: number) => {
                                            const st = STATUS_COLORS[bill.status] || STATUS_COLORS.pendiente;
                                            const isOverdue = bill.status === 'vencido';
                                            return (
                                                <div key={bill.id} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '14px 16px',
                                                    borderBottom: idx < pendingMaintenance.length - 1 ? '1px solid var(--color-border)' : 'none',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: 10,
                                                            background: isOverdue ? 'rgba(239,68,68,0.08)' : 'rgba(201,168,76,0.08)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            {isOverdue ? <AlertCircle size={16} style={{ color: '#EF4444' }} /> : <Receipt size={16} style={{ color: 'var(--color-gold)' }} />}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Mantenimiento {bill.period}</p>
                                                            <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                                                Vence: {new Date(bill.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ fontSize: 14, fontWeight: 700, color: isOverdue ? '#EF4444' : 'var(--color-text-primary)' }}>
                                                            ${Number(bill.amount).toLocaleString('es-MX')}
                                                        </p>
                                                        <span style={{
                                                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                            padding: '2px 6px', borderRadius: 4,
                                                            background: st.bg, color: st.color,
                                                        }}>{st.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* Active Services */}
                            {((statement.lockers?.length > 0) || (statement.enrollments?.length > 0)) && (
                                <motion.div {...f(0.1)}>
                                    <p className="section-header" style={{ marginBottom: 12 }}>Servicios Activos</p>
                                    <div className="card" style={{ overflow: 'hidden' }}>
                                        {(statement.lockers || []).filter((l: any) => l.status === 'activa').map((locker: any, idx: number) => (
                                            <div key={locker.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '14px 16px',
                                                borderBottom: '1px solid var(--color-border)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Lock size={16} style={{ color: '#06B6D4' }} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Locker #{locker.locker_number}</p>
                                                        <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{locker.locker_zone} · {locker.locker_size} · {locker.quarter}</p>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>${Number(locker.price).toLocaleString('es-MX')}</p>
                                            </div>
                                        ))}
                                        {(statement.enrollments || []).map((enr: any) => (
                                            <div key={enr.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '14px 16px',
                                                borderBottom: '1px solid var(--color-border)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Dumbbell size={16} style={{ color: '#6366F1' }} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{enr.activity}</p>
                                                        <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{enr.profile}</p>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>${Number(enr.price_monthly).toLocaleString('es-MX')}/mes</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Payment History */}
                            <motion.div {...f(0.15)}>
                                <p className="section-header" style={{ marginBottom: 12 }}>Historial de Pagos</p>
                                {recentPayments.length === 0 ? (
                                    <div className="card" style={{ padding: '32px 16px', textAlign: 'center' }}>
                                        <Clock size={24} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 8px' }} />
                                        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>Sin pagos registrados</p>
                                    </div>
                                ) : (
                                    <div className="card" style={{ overflow: 'hidden' }}>
                                        {recentPayments.map((p: any, idx: number) => {
                                            const st = STATUS_COLORS[p.status] || STATUS_COLORS.pendiente;
                                            return (
                                                <div key={p.id} style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '12px 16px',
                                                    borderBottom: idx < recentPayments.length - 1 ? '1px solid var(--color-border)' : 'none',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 8, height: 8, borderRadius: 4,
                                                            background: st.color, flexShrink: 0,
                                                        }} />
                                                        <div>
                                                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                                                                {p.status === 'completado' || p.status === 'pagado' ? 'Pago' : 'Cargo'} — {p.profile}
                                                            </p>
                                                            <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                                                {new Date(p.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p style={{
                                                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                                                        color: (p.status === 'completado' || p.status === 'pagado') ? '#10B981' : 'var(--color-text-primary)',
                                                    }}>
                                                        {(p.status === 'completado' || p.status === 'pagado') ? '-' : ''}${Number(p.amount).toLocaleString('es-MX')}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>

                            {/* Maintenance History (paid) */}
                            {statement.maintenance?.filter((b: any) => b.status === 'pagado').length > 0 && (
                                <motion.div {...f(0.2)}>
                                    <p className="section-header" style={{ marginBottom: 12 }}>Mantenimientos Pagados</p>
                                    <div className="card" style={{ overflow: 'hidden' }}>
                                        {statement.maintenance.filter((b: any) => b.status === 'pagado').slice(0, 6).map((bill: any, idx: number, arr: any[]) => (
                                            <div key={bill.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                borderBottom: idx < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                                                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Mantenimiento {bill.period}</p>
                                                </div>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>${Number(bill.amount).toLocaleString('es-MX')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ CHECKOUT VIEW ═══ */}
                    {view === 'checkout' && (
                        <motion.div key="checkout" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 24 }}>

                            {/* Total */}
                            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                                <p className="section-header" style={{ marginBottom: 8 }}>Total a Pagar</p>
                                <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                                    ${statement.totals?.total_due?.toLocaleString('es-MX')}
                                    <span style={{ fontSize: 16, color: 'var(--color-text-tertiary)', fontWeight: 400, marginLeft: 4 }}>MXN</span>
                                </h1>
                            </div>

                            {/* Payment Methods */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <h3 className="section-header" style={{ marginLeft: 4 }}>Método de Pago</h3>
                                {[
                                    { id: 'card' as const, label: 'Tarjeta de Crédito / Débito', sub: 'Visa · Mastercard · AMEX', icon: CreditCard, activeColor: 'var(--color-gold)' },
                                    { id: 'apple_pay' as const, label: 'Apple Pay', sub: '', icon: Apple, activeColor: 'var(--color-text-primary)' },
                                ].map(m => {
                                    const Icon = m.icon;
                                    const active = selectedMethod === m.id;
                                    return (
                                        <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: 16, borderRadius: 16, cursor: 'pointer', touchAction: 'manipulation',
                                                transition: 'all 0.15s ease',
                                                border: active ? `1px solid ${m.activeColor}` : '1px solid var(--color-border)',
                                                background: active ? 'var(--color-surface)' : 'var(--color-surface-hover)',
                                            }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 12,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: active ? `${m.activeColor}15` : 'var(--color-surface)',
                                                    color: active ? m.activeColor : 'var(--color-text-tertiary)',
                                                }}>
                                                    <Icon size={20} fill={m.id === 'apple_pay' ? 'currentColor' : 'none'} />
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{m.label}</p>
                                                    {m.sub && <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{m.sub}</p>}
                                                </div>
                                            </div>
                                            <div style={{
                                                width: 20, height: 20, borderRadius: 9999,
                                                border: active ? `2px solid ${m.activeColor}` : '2px solid var(--color-border-strong)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {active && <div style={{ width: 10, height: 10, background: m.activeColor, borderRadius: 9999 }} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
                                <Button onClick={handleCheckout}
                                    style={selectedMethod === 'apple_pay'
                                        ? { width: '100%', paddingTop: 20, paddingBottom: 20, fontSize: 15, fontWeight: 600, background: '#000', color: '#fff', border: 0, cursor: 'pointer', touchAction: 'manipulation' }
                                        : { width: '100%', paddingTop: 20, paddingBottom: 20, fontSize: 15, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation' }
                                    }>
                                    {selectedMethod === 'apple_pay'
                                        ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>Pagar con <Apple size={16} fill="white" /></span>
                                        : `Pagar $${statement.totals?.total_due?.toLocaleString('es-MX')}`
                                    }
                                </Button>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 }}>
                                    <Shield size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                                    <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Pago seguro · Estándares PCI-DSS</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ PROCESSING ═══ */}
                    {view === 'processing' && (
                        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 16 }}>
                            <div className="animate-spin" style={{ width: 64, height: 64, borderRadius: 9999, border: '4px solid var(--color-border)', borderTopColor: 'var(--color-gold)' }} />
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>Procesando Pago</h2>
                            <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>No cierres esta pantalla...</p>
                        </motion.div>
                    )}

                    {/* ═══ SUCCESS ═══ */}
                    {view === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ paddingTop: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                                <div style={{ width: 80, height: 80, background: 'rgba(16,185,129,0.1)', color: '#10B981', borderRadius: 9999, marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Pago Exitoso</h2>
                                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', maxWidth: 220, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                                    Hemos recibido tu pago de ${statement.totals?.total_due?.toLocaleString('es-MX')} MXN correctamente.
                                </p>

                                <div style={{ background: 'var(--color-surface-hover)', padding: 16, borderRadius: 12, textAlign: 'left', marginTop: 20, border: '1px solid var(--color-border)' }}>
                                    {[
                                        { label: 'Recibo', value: `#${paymentId?.slice(-8).toUpperCase() ?? '—'}` },
                                        { label: 'Fecha', value: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) },
                                        { label: 'Método', value: selectedMethod === 'apple_pay' ? 'Apple Pay' : 'Tarjeta' },
                                    ].map(row => (
                                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                                            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{row.label}</span>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button style={{ width: '100%', cursor: 'pointer', touchAction: 'manipulation' }} onClick={() => navigate('/')}>
                                Volver al Inicio
                            </Button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Sticky Pay Button (only on statement view when there's pending balance) */}
            {view === 'statement' && hasPending && (
                <div style={{
                    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '100%', maxWidth: 430, padding: '12px 16px',
                    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                    background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)',
                    zIndex: 40,
                }}>
                    <Button onClick={() => setView('checkout')}
                        style={{
                            width: '100%', paddingTop: 16, paddingBottom: 16,
                            fontSize: 15, fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                        <CreditCard size={18} />
                        Pagar ${statement.totals?.total_due?.toLocaleString('es-MX')} MXN
                    </Button>
                </div>
            )}
        </div>
    );
};
