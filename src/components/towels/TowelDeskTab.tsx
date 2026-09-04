import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Check, AlertTriangle, Users, RefreshCw, Minus, Plus, Sparkles, Clock, Camera } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import { useAuthStore } from '../../store/authStore';
import { TowelIcon } from './TowelIcon';
import { QrScanner } from '../ui/QrScanner';

const f = (delay: number) => ({
    initial: { opacity: 0, y: 12 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' hrs';

const ROLE_LABEL: Record<string, string> = { titular: 'Titular', conyugue: 'Cónyuge', hijo: 'Hijo/a', dependiente: 'Dependiente' };

interface Loan {
    id: string; quantity: number; returned_qty: number; pending: number; status: string;
    issued_at: string; due_at: string; overdue: boolean; profile_id: string;
    profile: { id: string; first_name: string; last_name: string; role: string };
    membership: { member_number: number };
    unit?: { short_name: string };
}

const GOLD = '#C9A84C';
const GREEN = '#10B981';
const RED = '#EF4444';

const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    padding: '12px 14px',
    background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)',
    borderRadius: 12, fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', outline: 'none',
};

const primaryBtn = (disabled: boolean) => ({
    padding: '12px 18px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700,
    background: disabled ? 'rgba(201,168,76,0.3)' : GOLD, color: '#0F1419',
    cursor: disabled ? 'default' : 'pointer', touchAction: 'manipulation' as const,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0,
});

const ghostBtn = (color: string, disabled = false) => ({
    padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
    background: `${color}14`, color, border: `1px solid ${color}40`,
    cursor: disabled ? 'default' : 'pointer', touchAction: 'manipulation' as const, opacity: disabled ? 0.5 : 1,
    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
});

const Avatar = ({ first, last, color = GOLD }: { first: string; last?: string; color?: string }) => (
    <div style={{ width: 40, height: 40, borderRadius: 20, background: `${color}1A`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
        {first?.[0]}{last?.[0] || ''}
    </div>
);

export const TowelDeskTab = () => {
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [summary, setSummary] = useState<any>(null);
    const [open, setOpen] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState('');
    const [searching, setSearching] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [qty, setQty] = useState(1);
    const [busy, setBusy] = useState<string | null>(null);
    const [laundryQty, setLaundryQty] = useState('');
    const [scanning, setScanning] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const [s, o] = await Promise.all([api.get('/towels/summary'), api.get('/towels/open')]);
            setSummary(s.data);
            setOpen(o.data);
        } catch { /* silently fail */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const search = async (value?: string) => {
        const v = (value ?? code).trim();
        if (!v) return;
        setSearching(true);
        try {
            const r = await api.post('/towels/resolve', { code: v });
            setResult(r.data);
            setQty(1);
        } catch (e: any) {
            setResult({ error: e.response?.data?.error || 'No se encontró al socio' });
        } finally {
            setSearching(false);
        }
    };

    const reloadProfile = async (profileId: string) => search(`CL-MEMBER:${profileId}`);

    const issue = async () => {
        if (!result?.profile) return;
        setBusy('issue');
        try {
            await api.post('/towels/issue', { profile_id: result.profile.id, quantity: qty });
            showToast(`${qty} ${qty === 1 ? 'toalla entregada' : 'toallas entregadas'} a ${result.profile.first_name}`);
            await Promise.all([reloadProfile(result.profile.id), refresh()]);
        } catch (e: any) {
            showToast(e.response?.data?.error || 'No se pudo entregar');
        } finally {
            setBusy(null);
        }
    };

    const receive = async (loan: Loan) => {
        setBusy(loan.id);
        try {
            await api.post(`/towels/${loan.id}/return`, {});
            showToast('Toallas recibidas ✓');
            await refresh();
            if (result?.profile?.id && (result.profile.id === loan.profile?.id || result.profile.id === loan.profile_id)) {
                await reloadProfile(result.profile.id);
            }
        } catch (e: any) {
            showToast(e.response?.data?.error || 'Error al recibir');
        } finally {
            setBusy(null);
        }
    };

    const laundryBack = async () => {
        const n = parseInt(laundryQty, 10);
        if (!n || n < 1 || !summary?.unit?.id) return;
        setBusy('laundry');
        try {
            await api.patch(`/towels/stock/${summary.unit.id}`, { action: 'laundry_to_clean', quantity: n });
            showToast(`${n} toallas de regreso a limpias`);
            setLaundryQty('');
            await refresh();
        } catch (e: any) {
            showToast(e.response?.data?.error || 'Error al ajustar stock');
        } finally {
            setBusy(null);
        }
    };

    const clear = () => { setCode(''); setResult(null); };

    const stock = summary?.stock;
    const tracked = stock && stock.total > 0;
    const maxIssuable = result?.profile
        ? Math.max(0, Math.min(result.max - result.open_count, tracked ? stock.clean : 99))
        : 0;
    const canIssue = !!result?.profile && result.can_issue && maxIssuable > 0;
    const overdueCount = open.filter(l => l.overdue).length;
    const sedeName = summary?.unit?.short_name || user?.unit_name || 'tu sede';

    return (
        <motion.div {...f(0.08)} style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {scanning && (
                <QrScanner
                    title="Control de toallas"
                    hint="Apunta a la credencial digital del socio"
                    onScan={c => { setScanning(false); setCode(c); search(c); }}
                    onClose={() => setScanning(false)}
                />
            )}
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,122,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TowelIcon size={20} style={{ color: '#007A4A' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Control de Toallas</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{sedeName} · entrega y recepción por QR o número de socio</p>
                </div>
                <button onClick={refresh} aria-label="Actualizar" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>
                    <RefreshCw size={14} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
            </div>

            {/* Stock strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                    { label: 'Limpias', value: loading ? '–' : tracked ? stock.clean : '∞', color: GREEN },
                    { label: 'En uso', value: loading ? '–' : summary?.open ?? 0, color: GOLD },
                    { label: 'Lavandería', value: loading ? '–' : stock?.laundry ?? 0, color: '#06B6D4' },
                ].map(s => (
                    <div key={s.label} className="card" style={{ padding: 14, textAlign: 'center' }}>
                        <p style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
                        <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 6 }}>{s.label}</p>
                    </div>
                ))}
            </div>
            {summary && (
                <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: -6 }}>
                    Hoy: {summary.today.issued} entregas · {summary.today.returned} devoluciones
                    {overdueCount > 0 && <span style={{ color: RED, fontWeight: 600 }}> · {overdueCount} vencida(s)</span>}
                </p>
            )}

            {/* Search */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }} />
                        <input
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && search()}
                            placeholder="Escanea QR, no. de socio o nombre"
                            style={{ ...inputStyle, paddingLeft: 36 }}
                        />
                    </div>
                    <button onClick={() => setScanning(true)} aria-label="Escanear QR con la cámara" style={{ width: 46, borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-hover)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', flexShrink: 0 }}>
                        <Camera size={18} />
                    </button>
                    <button onClick={() => search()} disabled={searching || !code.trim()} style={primaryBtn(searching || !code.trim())}>
                        {searching ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Buscar'}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {['QR de socio', 'No. socio (ej. 31505)', 'Apellido'].map(h => (
                        <span key={h} style={{ fontSize: 10, color: 'var(--color-text-tertiary)', background: 'rgba(201,168,76,0.06)', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>{h}</span>
                    ))}
                </div>
            </div>

            {/* Result */}
            <AnimatePresence mode="wait">
                {result && (
                    <motion.div key={result.profile?.id || result.error || 'candidates'}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="card" style={{ padding: 0, overflow: 'hidden', border: `1px solid ${result.error ? 'rgba(239,68,68,0.3)' : result.profile?.membership_status === 'activa' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.3)'}` }}>

                        {result.error && (
                            <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <AlertTriangle size={18} style={{ color: RED, flexShrink: 0 }} />
                                <p style={{ fontSize: 13, fontWeight: 600, color: RED, flex: 1 }}>{result.error}</p>
                                <button onClick={clear} style={ghostBtn('#94A3B8')}>Limpiar</button>
                            </div>
                        )}

                        {result.candidates && (
                            <div style={{ padding: 16 }}>
                                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 10 }}>Varios socios coinciden. ¿Cuál?</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {result.candidates.map((c: any) => (
                                        <button key={c.id} onClick={() => reloadProfile(c.id)} className="card-interactive" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', touchAction: 'manipulation', textAlign: 'left' }}>
                                            <Avatar first={c.first_name} last={c.last_name} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.first_name} {c.last_name}</p>
                                                <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>#{c.member_number} · {ROLE_LABEL[c.role] || c.role}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.profile && (
                            <>
                                {/* Member banner */}
                                <div style={{ padding: '14px 18px', background: result.profile.membership_status === 'activa' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Avatar first={result.profile.first_name} last={result.profile.last_name} color={result.profile.membership_status === 'activa' ? GREEN : '#F59E0B'} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{result.profile.first_name} {result.profile.last_name}</p>
                                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                            Socio #{result.profile.member_number} · {ROLE_LABEL[result.profile.role] || result.profile.role} · {result.profile.membership_status === 'activa' ? 'Membresía activa' : 'MEMBRESÍA SUSPENDIDA'}
                                        </p>
                                    </div>
                                    <button onClick={clear} aria-label="Limpiar" style={{ width: 30, height: 30, borderRadius: 15, border: 'none', background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)', cursor: 'pointer', touchAction: 'manipulation', fontSize: 14 }}>×</button>
                                </div>

                                {/* Family switcher */}
                                {result.family?.length > 1 && (
                                    <div style={{ padding: '12px 18px 0', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }} className="scrollbar-none">
                                        <Users size={13} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                                        {result.family.map((m: any) => {
                                            const active = m.id === result.profile.id;
                                            return (
                                                <button key={m.id} onClick={() => !active && reloadProfile(m.id)} style={{
                                                    padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                                                    background: active ? GOLD : 'var(--color-surface-hover)', color: active ? '#0F1419' : 'var(--color-text-secondary)',
                                                    border: '1px solid ' + (active ? GOLD : 'var(--color-border)'), cursor: active ? 'default' : 'pointer', touchAction: 'manipulation',
                                                }}>
                                                    {m.first_name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Open loans of this member */}
                                <div style={{ padding: '14px 18px 0' }}>
                                    {result.open_loans.length === 0 ? (
                                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Sin toallas pendientes.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {result.open_loans.map((l: Loan) => (
                                                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: l.overdue ? 'rgba(239,68,68,0.06)' : 'var(--color-surface-hover)', border: `1px solid ${l.overdue ? 'rgba(239,68,68,0.25)' : 'var(--color-border)'}` }}>
                                                    <TowelIcon size={16} style={{ color: l.overdue ? RED : GOLD }} />
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{l.pending} {l.pending === 1 ? 'toalla' : 'toallas'} sin devolver</p>
                                                        <p style={{ fontSize: 10, color: l.overdue ? RED : 'var(--color-text-tertiary)' }}>{l.overdue ? 'VENCIDA · ' : ''}entregadas {fmtTime(l.issued_at)}{l.unit?.short_name ? ` · ${l.unit.short_name}` : ''}</p>
                                                    </div>
                                                    <button onClick={() => receive(l)} disabled={busy === l.id} style={ghostBtn(GREEN, busy === l.id)}>
                                                        {busy === l.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />} Recibir
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Issue controls */}
                                <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface-hover)', overflow: 'hidden' }}>
                                        <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={!canIssue || qty <= 1} aria-label="Menos" style={{ width: 38, height: 42, border: 'none', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', touchAction: 'manipulation', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                                        <span style={{ minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{canIssue ? qty : 0}</span>
                                        <button onClick={() => setQty(q => Math.min(maxIssuable, q + 1))} disabled={!canIssue || qty >= maxIssuable} aria-label="Más" style={{ width: 38, height: 42, border: 'none', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', touchAction: 'manipulation', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                                    </div>
                                    <button onClick={issue} disabled={!canIssue || busy === 'issue'} style={{ ...primaryBtn(!canIssue || busy === 'issue'), flex: 1 }}>
                                        {busy === 'issue' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><TowelIcon size={15} /> Entregar {canIssue ? qty : ''} {qty === 1 || !canIssue ? 'toalla' : 'toallas'}</>}
                                    </button>
                                </div>
                                {!canIssue && (
                                    <p style={{ padding: '0 18px 16px', marginTop: -8, fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <AlertTriangle size={12} /> {result.reason || (tracked && stock.clean < 1 ? 'Sin toallas limpias en stock' : 'No se pueden entregar toallas')}
                                    </p>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Open loans in this unit */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <p className="section-header">Sin devolver en {sedeName}</p>
                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{open.length} {open.length === 1 ? 'socio' : 'socios'}</span>
                </div>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1, 2].map(i => <div key={i} className="animate-pulse" style={{ height: 64, borderRadius: 16, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />)}
                    </div>
                ) : open.length === 0 ? (
                    <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Check size={20} style={{ color: GREEN }} />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Todo en orden</p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3 }}>No hay toallas pendientes de devolver</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {open.map(l => (
                            <div key={l.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${l.overdue ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}` }}>
                                <Avatar first={l.profile.first_name} last={l.profile.last_name} color={l.overdue ? RED : GOLD} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {l.profile.first_name} {l.profile.last_name} <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>#{l.membership.member_number}</span>
                                    </p>
                                    <p style={{ fontSize: 11, color: l.overdue ? RED : 'var(--color-text-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={10} /> {l.pending} {l.pending === 1 ? 'toalla' : 'toallas'} · desde {fmtTime(l.issued_at)}{l.overdue ? ' · VENCIDA' : ''}
                                    </p>
                                </div>
                                <button onClick={() => receive(l)} disabled={busy === l.id} style={ghostBtn(GREEN, busy === l.id)}>
                                    {busy === l.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />} Recibir
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Laundry */}
            <div className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={16} style={{ color: '#06B6D4' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Regresaron de lavandería</p>
                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{stock?.laundry ?? 0} en lavandería · pasan a limpias</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="number" inputMode="numeric" min={1} value={laundryQty}
                        onChange={e => setLaundryQty(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && laundryBack()}
                        placeholder="Cantidad"
                        style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={laundryBack} disabled={busy === 'laundry' || !parseInt(laundryQty, 10)} style={primaryBtn(busy === 'laundry' || !parseInt(laundryQty, 10))}>
                        {busy === 'laundry' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Registrar'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
