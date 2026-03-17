import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import {
    UserPlus, Calendar, X, Check, Copy,
    ChevronRight, AlertCircle, Users, Ticket, Phone,
    Send
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────

interface GuestPass {
    id: string;
    guest_name: string;
    guest_phone?: string;
    guest_email?: string;
    visit_date: string;
    pass_code: string;
    status: string;
    checked_in_at?: string;
    max_guests: number;
    fee: string;
    notes?: string;
    created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Activo', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    used: { label: 'Utilizado', color: '#6366F1', bg: 'rgba(99,102,241,0.08)' },
    expired: { label: 'Expirado', color: '#6B7280', bg: 'rgba(107,114,128,0.08)' },
    cancelled: { label: 'Cancelado', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
};

function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

function isToday(d: string): boolean {
    const visit = new Date(d);
    const today = new Date();
    return visit.toDateString() === today.toDateString();
}

function isFuture(d: string): boolean {
    const visit = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return visit >= today;
}

// ─── Main Component ───────────────────────────────────────

export function GuestPassView() {
    const [passes, setPasses] = useState<GuestPass[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedPass, setSelectedPass] = useState<GuestPass | null>(null);
    const { showToast } = useToast();
    const { user } = useAuthStore();

    const fetchPasses = async () => {
        try {
            const res = await api.get('/guests');
            setPasses(res.data);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPasses(); }, []);

    const activePasses = passes.filter(p => p.status === 'active' && isFuture(p.visit_date));
    const pastPasses = passes.filter(p => p.status !== 'active' || !isFuture(p.visit_date));
    const thisMonthCount = passes.filter(p => {
        const d = new Date(p.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status !== 'cancelled';
    }).length;

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div style={{ padding: '24px 16px 16px' }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                    Pases de Invitado
                </h1>
                <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    Invita amigos y familiares al club por un día
                </p>
            </div>

            {/* Month limit indicator */}
            <div style={{ padding: '0 16px 16px' }}>
                <div style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            Pases incluidos este mes
                        </span>
                        <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: thisMonthCount >= 3 ? '#EF4444' : 'var(--color-text-primary)',
                        }}>
                            {thisMonthCount}/3
                        </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--color-border)', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 2,
                            width: `${Math.min((thisMonthCount / 3) * 100, 100)}%`,
                            background: thisMonthCount >= 3 ? '#EF4444' : '#059669',
                            transition: 'width 300ms ease',
                        }} />
                    </div>
                    {thisMonthCount >= 3 && (
                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
                            Has usado todos tus pases incluidos este mes
                        </p>
                    )}
                </div>
            </div>

            {/* Create button OR request-more button */}
            <div style={{ padding: '0 16px 16px' }}>
                {thisMonthCount >= 3 ? (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            const subject = encodeURIComponent('Solicitud de pases de invitado adicionales');
                            const body = encodeURIComponent(
                                `Hola,\n\nHe utilizado mis 3 pases de invitado incluidos este mes y me gustaría solicitar pases adicionales.\n\nSocio: ${user?.first_name} ${user?.last_name}\nNo. Socio: ${user?.member_number}\n\nGracias.`
                            );
                            window.open(`mailto:administracion@centrolibanes.com?subject=${subject}&body=${body}`, '_self');
                        }}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #C9A84C, #B8943F)',
                            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                            touchAction: 'manipulation', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        <Send size={16} />
                        Solicitar más pases
                    </motion.button>
                ) : (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowCreate(true)}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                            background: '#007A4A',
                            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                            touchAction: 'manipulation', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        <UserPlus size={18} />
                        Crear pase de invitado
                    </motion.button>
                )}
            </div>

            {/* Active passes */}
            {loading ? (
                <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                    <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--color-border)', borderTopColor: '#C9A84C', borderRadius: '50%', margin: '0 auto' }} />
                </div>
            ) : (
                <>
                    {activePasses.length > 0 && (
                        <div style={{ padding: '0 16px' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                Pases activos
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                {activePasses.map(p => (
                                    <PassCard key={p.id} pass={p} onTap={() => setSelectedPass(p)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {pastPasses.length > 0 && (
                        <div style={{ padding: '0 16px' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                Historial
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {pastPasses.map(p => (
                                    <PassCard key={p.id} pass={p} onTap={() => setSelectedPass(p)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {passes.length === 0 && (
                        <div style={{ padding: '60px 16px', textAlign: 'center' }}>
                            <Ticket size={48} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 16px', opacity: 0.3 }} />
                            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                Sin pases de invitado
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                                Crea tu primer pase para invitar a alguien al club
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Create sheet */}
            <AnimatePresence>
                {showCreate && (
                    <CreatePassSheet
                        onClose={() => setShowCreate(false)}
                        onCreated={() => {
                            setShowCreate(false);
                            fetchPasses();
                            showToast('Pase creado exitosamente', 'success');
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Detail sheet */}
            <AnimatePresence>
                {selectedPass && (
                    <PassDetailSheet
                        pass={selectedPass}
                        onClose={() => setSelectedPass(null)}
                        onCancelled={() => {
                            setSelectedPass(null);
                            fetchPasses();
                            showToast('Pase cancelado', 'success');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Pass Card ────────────────────────────────────────────

function PassCard({ pass, onTap }: { pass: GuestPass; onTap: () => void }) {
    const config = STATUS_CONFIG[pass.status] || STATUS_CONFIG.active;
    const today = isToday(pass.visit_date);

    return (
        <div
            onClick={onTap}
            className="card-interactive"
            style={{
                padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                touchAction: 'manipulation',
                border: today && pass.status === 'active' ? '1px solid rgba(5,150,105,0.3)' : undefined,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Icon */}
                <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: config.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Ticket size={18} style={{ color: config.color }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pass.guest_name}
                        </p>
                        {today && pass.status === 'active' && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: 'rgba(5,150,105,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                                HOY
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Calendar size={11} /> {formatDate(pass.visit_date)}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: config.color }}>
                            {config.label}
                        </span>
                    </div>
                </div>

                {/* Code preview */}
                {pass.status === 'active' && (
                    <span style={{
                        fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                        color: 'var(--color-text-primary)', letterSpacing: 2,
                    }}>
                        {pass.pass_code}
                    </span>
                )}
                <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
            </div>
        </div>
    );
}

// ─── Create Pass Sheet ────────────────────────────────────

function CreatePassSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [visitDate, setVisitDate] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    // Default to tomorrow
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setVisitDate(tomorrow.toISOString().split('T')[0]);
    }, []);

    const handleSubmit = async () => {
        if (!guestName.trim()) {
            showToast('Nombre del invitado requerido', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/guests', {
                guest_name: guestName.trim(),
                guest_phone: guestPhone.trim() || undefined,
                visit_date: visitDate,
                notes: notes.trim() || undefined,
            });
            onCreated();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Error al crear pase', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px', borderRadius: 10,
        background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)', fontSize: 14,
        outline: 'none', boxSizing: 'border-box',
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
            />
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                    background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
                    maxHeight: '85vh', overflow: 'auto', maxWidth: 430, margin: '0 auto',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                    <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
                </div>

                <div style={{ padding: '8px 20px 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Nuevo Pase</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, touchAction: 'manipulation' }}>
                            <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                        </button>
                    </div>

                    {/* Guest name */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                            Nombre del invitado *
                        </label>
                        <input
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            placeholder="Juan Pérez"
                            style={inputStyle}
                        />
                    </div>

                    {/* Phone */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                            Teléfono (opcional)
                        </label>
                        <input
                            value={guestPhone}
                            onChange={e => setGuestPhone(e.target.value)}
                            placeholder="449 123 4567"
                            type="tel"
                            style={inputStyle}
                        />
                    </div>

                    {/* Visit date */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                            Fecha de visita *
                        </label>
                        <input
                            type="date"
                            value={visitDate}
                            onChange={e => setVisitDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={inputStyle}
                        />
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                            Notas (opcional)
                        </label>
                        <input
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Viene a jugar pádel conmigo"
                            style={inputStyle}
                        />
                    </div>

                    {/* Info banner */}
                    <div style={{
                        padding: '12px 14px', borderRadius: 10, marginBottom: 16,
                        background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)',
                        display: 'flex', gap: 10,
                    }}>
                        <AlertCircle size={16} style={{ color: '#C9A84C', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            Tu invitado recibirá un código de 6 dígitos que deberá mostrar en recepción el día de la visita.
                        </p>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        disabled={submitting || !guestName.trim() || !visitDate}
                        style={{
                            width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                            background: '#007A4A',
                            opacity: (submitting || !guestName.trim() || !visitDate) ? 0.5 : 1,
                            color: '#fff', fontSize: 16, fontWeight: 700,
                            cursor: 'pointer', touchAction: 'manipulation',
                        }}
                    >
                        {submitting ? 'Creando...' : 'Crear pase'}
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
}

// ─── Pass Detail Sheet ────────────────────────────────────

function PassDetailSheet({ pass, onClose, onCancelled }: {
    pass: GuestPass; onClose: () => void; onCancelled: () => void;
}) {
    const [cancelling, setCancelling] = useState(false);
    const { showToast } = useToast();
    const config = STATUS_CONFIG[pass.status] || STATUS_CONFIG.active;
    const canCancel = pass.status === 'active' && isFuture(pass.visit_date);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(pass.pass_code);
            showToast('Código copiado', 'success');
        } catch {
            showToast(pass.pass_code, 'success');
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await api.delete(`/guests/${pass.id}`);
            onCancelled();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Error', 'error');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
            />
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                    background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
                    maxHeight: '85vh', overflow: 'auto', maxWidth: 430, margin: '0 auto',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                    <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
                </div>

                <div style={{ padding: '8px 20px 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Detalle del Pase</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, touchAction: 'manipulation' }}>
                            <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                        </button>
                    </div>

                    {/* Pass code — premium ticket style */}
                    {pass.status === 'active' && (
                        <div
                            onClick={copyCode}
                            style={{
                                borderRadius: 16, marginBottom: 20, cursor: 'pointer',
                                touchAction: 'manipulation', overflow: 'hidden',
                                boxShadow: '0 8px 24px rgba(0,60,36,0.25)',
                            }}
                        >
                            {/* Top: club branding */}
                            <div style={{
                                background: 'linear-gradient(145deg, #003D24, #007A4A)',
                                padding: '16px 20px 14px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2 }}>
                                        Centro Libanés
                                    </p>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                                        Pase de Día
                                    </p>
                                </div>
                                <Ticket size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
                            </div>
                            {/* Tear line */}
                            <div style={{
                                borderTop: '2px dashed rgba(255,255,255,0.15)',
                                background: 'linear-gradient(145deg, #004D2E, #005A36)',
                            }} />
                            {/* Code section */}
                            <div style={{
                                background: 'linear-gradient(145deg, #004D2E, #006B3F)',
                                padding: '20px', textAlign: 'center',
                            }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                                    Código de acceso
                                </p>
                                <p style={{ fontSize: 40, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: 10 }}>
                                    {pass.pass_code}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 }}>
                                    <Copy size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Toca para copiar</p>
                                </div>
                            </div>
                            {/* Bottom: guest info */}
                            <div style={{
                                background: 'linear-gradient(145deg, #005A36, #007A4A)',
                                padding: '12px 20px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                                    {pass.guest_name}
                                </span>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                    {formatDate(pass.visit_date)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                        <DetailRow icon={Users} label="Invitado" value={pass.guest_name} />
                        <DetailRow icon={Calendar} label="Fecha" value={formatDate(pass.visit_date)} />
                        {pass.guest_phone && <DetailRow icon={Phone} label="Teléfono" value={pass.guest_phone} />}
                        <DetailRow icon={Ticket} label="Estado" value={config.label} valueColor={config.color} />
                        {pass.checked_in_at && (
                            <DetailRow icon={Check} label="Check-in" value={new Date(pass.checked_in_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} />
                        )}
                        {pass.notes && <DetailRow icon={AlertCircle} label="Notas" value={pass.notes} />}
                    </div>

                    {/* Cancel button */}
                    {canCancel && (
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 12,
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.06)',
                                color: '#EF4444', fontSize: 15, fontWeight: 600,
                                cursor: 'pointer', touchAction: 'manipulation',
                                opacity: cancelling ? 0.5 : 1,
                            }}
                        >
                            {cancelling ? 'Cancelando...' : 'Cancelar pase'}
                        </button>
                    )}
                </div>
            </motion.div>
        </>
    );
}

function DetailRow({ icon: Icon, label, value, valueColor }: {
    icon: any; label: string; value: string; valueColor?: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
            <Icon size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', width: 80, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: valueColor || 'var(--color-text-primary)', flex: 1 }}>{value}</span>
        </div>
    );
}
