import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, AlertTriangle, CheckCircle2, Receipt, Info, Users, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { TowelIcon } from '../components/towels/TowelIcon';

const f = (delay: number) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const fmtTime = (iso: string | number | Date) =>
    new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' hrs';
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
const money = (n: number) => `$${Number(n).toLocaleString('es-MX')}`;

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    prestada: { label: 'En tu poder', color: '#C9A84C', bg: 'rgba(201,168,76,0.12)' },
    vencida: { label: 'Sin devolver', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    devuelta: { label: 'Devuelta', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    cobrada: { label: 'Cobrada', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

const ROLE_LABEL: Record<string, string> = { titular: 'Titular', conyugue: 'Cónyuge', hijo: 'Hijo/a', dependiente: 'Dependiente' };

interface Loan {
    id: string; quantity: number; returned_qty: number; pending: number; status: string;
    issued_at: string; due_at: string; returned_at?: string | null; overdue: boolean;
    unit?: { short_name: string }; issued_by?: { name: string };
    profile?: { first_name: string; last_name: string; role: string };
}

const Badge = ({ status }: { status: string }) => {
    const s = STATUS[status] || STATUS.prestada;
    return (
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, padding: '3px 8px', borderRadius: 6, background: s.bg, color: s.color, flexShrink: 0 }}>
            {s.label}
        </span>
    );
};

export const TowelView = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/towels/my')
            .then(r => setData(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const open: Loan[] = data?.open || [];
    const familyOpen: Loan[] = data?.family_open || [];
    const history: Loan[] = data?.history || [];
    const charges: any[] = data?.charges || [];
    const cfg = data?.config || { fee_lost: 150, max_per_profile: 2, cutoff_hour: '22:00', grace_days: 1 };
    const pendingTotal = open.reduce((s, l) => s + l.pending, 0);
    const hasOverdue = open.some(l => l.overdue);
    const nextDue = open.length ? Math.min(...open.map(l => new Date(l.due_at).getTime())) : null;

    const heroBg = hasOverdue
        ? 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 100%)'
        : pendingTotal > 0
            ? 'linear-gradient(135deg, #005A36 0%, #007A4A 100%)'
            : 'linear-gradient(135deg, #1A1F26 0%, #2A313B 100%)';

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0' }}>
                <button onClick={() => navigate(-1)} aria-label="Regresar" style={{
                    width: 36, height: 36, borderRadius: 18, border: 'none',
                    background: 'var(--color-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', touchAction: 'manipulation',
                }}>
                    <ChevronLeft size={18} style={{ color: 'var(--color-text-primary)' }} />
                </button>
                <h1 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', flex: 1, color: 'var(--color-text-primary)' }}>Toallas</h1>
                {user?.member_number && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Socio #{user.member_number}</span>}
            </div>

            {loading ? (
                <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="animate-pulse" style={{ height: 150, borderRadius: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
                    <div className="animate-pulse" style={{ height: 72, borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
                    <div className="animate-pulse" style={{ height: 72, borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
                </div>
            ) : (
                <>
                    {/* Hero */}
                    <motion.div {...f(0)} style={{ padding: '20px 16px 0' }}>
                        <div style={{ borderRadius: 20, padding: 22, position: 'relative', overflow: 'hidden', background: heroBg, color: '#fff', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
                            <div style={{ position: 'absolute', right: 18, top: 14, opacity: 0.18 }}>
                                <TowelIcon size={84} strokeWidth={1.1} />
                            </div>
                            <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.7 }}>Toallas en tu poder</p>
                            <p style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, marginTop: 8, fontFamily: 'var(--font-display)' }}>{pendingTotal}</p>
                            <p style={{ fontSize: 13, marginTop: 12, opacity: 0.92, display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4 }}>
                                {hasOverdue ? (
                                    <><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} /> Devuélvelas hoy en vestidores para evitar un cargo de {money(cfg.fee_lost)} por toalla.</>
                                ) : pendingTotal > 0 && nextDue ? (
                                    <><Clock size={15} style={{ flexShrink: 0, marginTop: 2 }} /> Devuélvelas antes de las {fmtTime(nextDue)}.</>
                                ) : (
                                    <><CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 2 }} /> Sin toallas pendientes. Pídelas en vestidores mostrando tu QR.</>
                                )}
                            </p>
                        </div>
                    </motion.div>

                    {/* Open loans */}
                    {open.length > 0 && (
                        <motion.div {...f(0.06)} style={{ padding: '24px 16px 0' }}>
                            <p className="section-header" style={{ marginBottom: 12 }}>Préstamos activos</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {open.map(l => (
                                    <div key={l.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,122,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <TowelIcon size={20} style={{ color: '#007A4A' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                                {l.pending} {l.pending === 1 ? 'toalla' : 'toallas'}
                                                {l.returned_qty > 0 && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 500 }}> · {l.returned_qty} ya devuelta(s)</span>}
                                            </p>
                                            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <MapPin size={11} /> {l.unit?.short_name || 'Club'} · entregadas {fmtTime(l.issued_at)}
                                            </p>
                                            <p style={{ fontSize: 11, color: l.overdue ? '#EF4444' : 'var(--color-text-secondary)', marginTop: 2 }}>
                                                {l.overdue ? 'Vencidas — devuélvelas hoy' : `Vencen ${fmtDate(l.due_at)} a las ${fmtTime(l.due_at)}`}
                                            </p>
                                        </div>
                                        <Badge status={l.status} />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Family */}
                    {familyOpen.length > 0 && (
                        <motion.div {...f(0.1)} style={{ padding: '24px 16px 0' }}>
                            <p className="section-header" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={13} /> Tu familia</p>
                            <div className="card" style={{ padding: '4px 16px' }}>
                                {familyOpen.map((l, i) => (
                                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                                {l.profile?.first_name} {l.profile?.last_name}
                                                <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 500 }}> · {ROLE_LABEL[l.profile?.role || ''] || l.profile?.role}</span>
                                            </p>
                                            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{l.pending} toalla(s) · {l.unit?.short_name} · {fmtTime(l.issued_at)}</p>
                                        </div>
                                        <Badge status={l.status} />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Rules */}
                    <motion.div {...f(0.14)} style={{ padding: '24px 16px 0' }}>
                        <div className="card" style={{ padding: 16, display: 'flex', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Info size={16} style={{ color: 'var(--color-gold)' }} />
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>Cómo funciona</p>
                                <p>· Pide hasta <strong>{cfg.max_per_profile}</strong> toallas por persona mostrando tu QR en vestidores.</p>
                                <p>· Devuélvelas el mismo día antes de las <strong>{cfg.cutoff_hour} hrs</strong>.</p>
                                <p>· Si no regresan en {cfg.grace_days} día(s), se cargan <strong>{money(cfg.fee_lost)}</strong> por toalla a tu estado de cuenta.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Charges */}
                    {charges.length > 0 && (
                        <motion.div {...f(0.18)} style={{ padding: '24px 16px 0' }}>
                            <p className="section-header" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Receipt size={13} /> Cargos por toallas</p>
                            <div className="card" style={{ padding: '4px 16px' }}>
                                {charges.map((c, i) => (
                                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Toallas no devueltas</p>
                                            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{fmtDate(c.created_at)} · {c.status === 'completado' || c.status === 'pagado' ? 'Pagado' : 'Pendiente en estado de cuenta'}</p>
                                        </div>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>{money(Number(c.amount))}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => navigate('/payment')} style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--color-gold)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', touchAction: 'manipulation' }}>
                                Ver estado de cuenta →
                            </button>
                        </motion.div>
                    )}

                    {/* History */}
                    <motion.div {...f(0.22)} style={{ padding: '24px 16px 0' }}>
                        <p className="section-header" style={{ marginBottom: 12 }}>Historial</p>
                        {history.length === 0 ? (
                            <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(201,168,76,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <TowelIcon size={20} style={{ color: 'var(--color-gold)' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Aún no has pedido toallas</p>
                                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>Aquí verás tus préstamos anteriores</p>
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: '4px 16px' }}>
                                {history.map((l, i) => (
                                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid var(--color-border)' : 'none' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{l.quantity} {l.quantity === 1 ? 'toalla' : 'toallas'} · {l.unit?.short_name}</p>
                                            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                                {fmtDate(l.issued_at)} · {fmtTime(l.issued_at)}{l.returned_at ? ` → ${fmtTime(l.returned_at)}` : ''}
                                            </p>
                                        </div>
                                        <Badge status={l.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
};
