import { useCallback, useEffect, useState, type ElementType } from 'react';
import { AlertTriangle, Check, DollarSign, RefreshCw, Sparkles, Plus, Loader2, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import { TowelIcon } from './TowelIcon';

const GOLD = '#C9A84C';
const GREEN = '#10B981';
const RED = '#EF4444';
const CYAN = '#06B6D4';

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' hrs';
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
const money = (n: number) => `$${Number(n).toLocaleString('es-MX')}`;

const ROLE_LABEL: Record<string, string> = { titular: 'Titular', conyugue: 'Cónyuge', hijo: 'Hijo/a', dependiente: 'Dependiente' };

const Metric = ({ title, value, hint, icon: Icon, color }: { title: string; value: string | number; hint: string; icon: ElementType; color: string }) => (
    <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 150 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}14`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon size={20} style={{ color }} />
        </div>
        <div>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 8 }}>{title}</p>
            <p style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{hint}</p>
        </div>
    </div>
);

const actionBtn = (color: string, disabled = false) => ({
    padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
    background: `${color}14`, color, border: `1px solid ${color}40`,
    cursor: disabled ? 'default' : 'pointer', touchAction: 'manipulation' as const, opacity: disabled ? 0.5 : 1,
    display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' as const,
});

const th = { padding: '12px 20px' };
const td = { padding: '12px 20px', color: 'var(--color-text-tertiary)' };

export const TowelAdminTab = () => {
    const { showToast } = useToast();
    const [summary, setSummary] = useState<any>(null);
    const [stock, setStock] = useState<any[]>([]);
    const [open, setOpen] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    const [adjust, setAdjust] = useState<Record<string, string>>({});

    const refresh = useCallback(async () => {
        try {
            const [s, st, o] = await Promise.all([
                api.get('/towels/summary?all=1'),
                api.get('/towels/stock'),
                api.get('/towels/open?all=1'),
            ]);
            setSummary(s.data);
            setStock(st.data);
            setOpen(o.data);
        } catch { /* silently fail */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const run = async (key: string, fn: () => Promise<any>, okMsg: string) => {
        setBusy(key);
        try {
            const r = await fn();
            showToast(typeof okMsg === 'function' ? okMsg : okMsg);
            await refresh();
            return r;
        } catch (e: any) {
            showToast(e.response?.data?.error || 'Ocurrió un error');
        } finally {
            setBusy(null);
        }
    };

    const adjustStock = (unitId: string, action: 'laundry_to_clean' | 'add_new') => {
        const n = parseInt(adjust[unitId] || '', 10);
        if (!n || n < 1) { showToast('Escribe una cantidad'); return; }
        run(`${action}-${unitId}`, () => api.patch(`/towels/stock/${unitId}`, { action, quantity: n }), action === 'add_new' ? `${n} toallas nuevas agregadas` : `${n} toallas de regreso a limpias`)
            .then(() => setAdjust(a => ({ ...a, [unitId]: '' })));
    };

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando control de toallas...</div>;
    if (!summary) return <div style={{ padding: 48, textAlign: 'center', color: '#F87171' }}>Error al cargar el módulo de toallas</div>;

    const cfg = summary.config;
    const overdue = open.filter(l => l.overdue);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Control de Toallas</h2>
                    <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                        {summary.stock.total} toallas en inventario · máx. {cfg.max_per_profile} por persona · corte {cfg.cutoff_hour} hrs · cargo {money(cfg.fee_lost)} por toalla no devuelta ({cfg.grace_days} día(s) de gracia)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => run('process', () => api.post('/towels/process-overdue', {}), 'Vencidas y cobros procesados')} disabled={busy === 'process'} style={actionBtn(GOLD, busy === 'process')}>
                        {busy === 'process' ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Clock size={13} />} Procesar vencidas ahora
                    </button>
                    <button onClick={refresh} style={actionBtn('#94A3B8')}><RefreshCw size={13} /> Actualizar</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <Metric title="En uso ahora" value={summary.open} hint={`${summary.today.issued} entregadas hoy`} icon={TowelIcon} color={GOLD} />
                <Metric title="Sin devolver (vencidas)" value={summary.overdue} hint={overdue.length ? `${overdue.length} socio(s) por cobrar` : 'Todo en orden'} icon={AlertTriangle} color={summary.overdue > 0 ? RED : GREEN} />
                <Metric title="Perdidas este mes" value={summary.charged_month_count} hint={`${summary.stock.lost} acumuladas`} icon={TowelIcon} color={RED} />
                <Metric title="Cargos este mes" value={money(summary.charged_month_amount)} hint="Al estado de cuenta" icon={DollarSign} color={GREEN} />
            </div>

            {/* Stock per unit */}
            <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-tertiary)', marginBottom: 12 }}>Inventario por sede</p>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <tr>
                                <th style={th}>Sede</th><th style={th}>Total</th><th style={th}>Limpias</th><th style={th}>En uso</th><th style={th}>Lavandería</th><th style={th}>Perdidas</th><th style={th}>Ajustes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stock.map((s, idx) => {
                                const pct = s.total > 0 ? Math.round((s.clean / s.total) * 100) : 0;
                                return (
                                    <tr key={s.unit_id} style={{ borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined }}>
                                        <td style={{ ...td, fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.unit?.short_name}</td>
                                        <td style={td}>{s.total}</td>
                                        <td style={{ ...td, color: pct < 25 && s.total > 0 ? RED : GREEN, fontWeight: 600 }}>{s.clean}{s.total > 0 && <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 500 }}> ({pct}%)</span>}</td>
                                        <td style={{ ...td, color: GOLD, fontWeight: 600 }}>{s.in_use}</td>
                                        <td style={{ ...td, color: CYAN, fontWeight: 600 }}>{s.laundry}</td>
                                        <td style={{ ...td, color: RED, fontWeight: 600 }}>{s.lost}</td>
                                        <td style={td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <input type="number" min={1} value={adjust[s.unit_id] || ''} onChange={e => setAdjust(a => ({ ...a, [s.unit_id]: e.target.value }))} placeholder="Cant."
                                                    style={{ width: 64, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface-hover)', color: 'var(--color-text-primary)', fontSize: 12, outline: 'none' }} />
                                                <button onClick={() => adjustStock(s.unit_id, 'laundry_to_clean')} disabled={busy === `laundry_to_clean-${s.unit_id}`} style={actionBtn(CYAN, busy === `laundry_to_clean-${s.unit_id}`)}><Sparkles size={12} /> Lavadas</button>
                                                <button onClick={() => adjustStock(s.unit_id, 'add_new')} disabled={busy === `add_new-${s.unit_id}`} style={actionBtn(GREEN, busy === `add_new-${s.unit_id}`)}><Plus size={12} /> Nuevas</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Open loans */}
            <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-tertiary)', marginBottom: 12 }}>Toallas sin devolver · todo el club</p>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    {open.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No hay toallas pendientes de devolver</div>
                    ) : (
                        <table style={{ width: '100%', textAlign: 'left', fontSize: 13, borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                <tr>
                                    <th style={th}>Socio</th><th style={th}>Sede</th><th style={th}>Toallas</th><th style={th}>Entregadas</th><th style={th}>Vencen</th><th style={th}>Estado</th><th style={th}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {open.map((l, idx) => (
                                    <tr key={l.id} style={{ borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined }}>
                                        <td style={{ ...td, color: 'var(--color-text-primary)', fontWeight: 600 }}>
                                            {l.profile?.first_name} {l.profile?.last_name}
                                            <span style={{ display: 'block', fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 500 }}>#{l.membership?.member_number} · {ROLE_LABEL[l.profile?.role] || l.profile?.role}</span>
                                        </td>
                                        <td style={td}>{l.unit?.short_name}</td>
                                        <td style={{ ...td, fontWeight: 700, color: 'var(--color-text-primary)' }}>{l.pending}</td>
                                        <td style={td}>{fmtDate(l.issued_at)} · {fmtTime(l.issued_at)}</td>
                                        <td style={td}>{fmtDate(l.due_at)} · {fmtTime(l.due_at)}</td>
                                        <td style={td}>
                                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: l.overdue ? 'rgba(239,68,68,0.1)' : 'rgba(201,168,76,0.1)', color: l.overdue ? RED : GOLD }}>
                                                {l.overdue ? 'Vencida' : 'En uso'}
                                            </span>
                                        </td>
                                        <td style={td}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => run(`return-${l.id}`, () => api.post(`/towels/${l.id}/return`, {}), 'Toallas recibidas')} disabled={busy === `return-${l.id}`} style={actionBtn(GREEN, busy === `return-${l.id}`)}><Check size={12} /> Recibir</button>
                                                <button onClick={() => run(`charge-${l.id}`, () => api.post(`/towels/${l.id}/charge`, {}), `Cargo de ${money(l.pending * cfg.fee_lost)} aplicado`)} disabled={busy === `charge-${l.id}`} style={actionBtn(RED, busy === `charge-${l.id}`)}><DollarSign size={12} /> Cobrar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
