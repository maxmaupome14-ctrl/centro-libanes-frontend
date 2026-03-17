import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Shield, Check, X, UserPlus, AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

export const FamilyView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'family' | 'statement' | 'approvals'>('family');

    // Navigate to specific tab via location.state (e.g. from ProfileView)
    useEffect(() => {
        const state = location.state as { tab?: string } | null;
        const tab = state?.tab;
        if (tab && ['family', 'statement', 'approvals'].includes(tab)) {
            setActiveTab(tab as 'family' | 'statement' | 'approvals');
        }
    }, [location.key]);
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statement, setStatement] = useState<any>(null);
    const [approvals, setApprovals] = useState<any[]>([]);
    const [loadingApprovals, setLoadingApprovals] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addForm, setAddForm] = useState({ first_name: '', last_name: '', date_of_birth: '', role: 'hijo' });
    const [addingMember, setAddingMember] = useState(false);

    useEffect(() => {
        const fetchFamily = async () => {
            if (!user?.membership_id) return;
            try {
                const requests: Promise<any>[] = [
                    api.get(`/membership/${user.membership_id}/beneficiaries`),
                    api.get(`/payments/${user.membership_id}/statement`),
                ];
                if (user.role === 'titular' || user.role === 'conyugue') {
                    requests.push(api.get('/reservations/pending-approvals'));
                }
                const results = await Promise.all(requests);
                setFamilyMembers(results[0].data);
                setStatement(results[1].data);
                if (results[2]) setApprovals(results[2].data);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
                setLoadingApprovals(false);
            }
        };
        fetchFamily();
    }, [user]);

    const handleApproval = async (id: string, action: 'approve' | 'reject') => {
        setActioningId(id);
        try {
            await api.post(`/reservations/approvals/${id}/${action}`);
            setApprovals(prev => prev.filter(a => a.id !== id));
        } catch {
            // silently fail
        } finally {
            setActioningId(null);
        }
    };

    const totalDue = statement?.totals?.total_due ?? 0;

    if (!user) return null;

    const tabs = [
        { key: 'family' as const, label: 'Familia' },
        { key: 'approvals' as const, label: 'Aprobaciones', badgeCount: approvals.length },
        { key: 'statement' as const, label: 'Estado Cta.' },
    ];

    return (
        <div style={{ paddingBottom: 100 }}>

            {/* ── Header ── */}
            <div style={{
                position: 'relative', overflow: 'hidden', padding: '24px 16px 56px',
                background: 'linear-gradient(to bottom, var(--color-green-cedar-dark), var(--color-green-cedar))',
            }}>
                {/* Decorative glow */}
                <div style={{
                    position: 'absolute', top: '-50%', right: '-30%',
                    width: 300, height: 300, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)', filter: 'blur(100px)',
                }} />
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: -0.3 }}>Administración Familiar</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 2 }}>
                        Membresía <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>{user.member_number || '---'}</span>
                    </p>
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ position: 'relative', zIndex: 20, padding: '0 16px', marginTop: -32, display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Tab Pills (iOS HIG Segmented Control) */}
                <div style={{ display: 'flex', padding: 2, borderRadius: 8, background: 'rgba(0,0,0,0.25)' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                position: 'relative', flex: 1, padding: '7px 0', minHeight: 32,
                                fontSize: 13, fontWeight: 500, borderRadius: 7, border: 'none',
                                cursor: 'pointer', outline: 'none', transition: 'all 200ms',
                                color: activeTab === tab.key ? 'var(--color-text-primary)' : 'rgba(255,255,255,0.85)',
                                background: activeTab === tab.key ? 'var(--color-surface)' : 'transparent',
                                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)' : 'none',
                            }}
                        >
                            {tab.label}
                            {tab.badgeCount != null && tab.badgeCount > 0 && (
                                <span className="animate-pulse" style={{
                                    position: 'absolute', top: 4, right: 8,
                                    width: 6, height: 6, borderRadius: 3,
                                    background: 'var(--color-red-lebanese)',
                                }} />
                            )}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="popLayout">

                    {/* ── TAB: FAMILIA ── */}
                    {activeTab === 'family' && (
                        <motion.div
                            key="family"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 8 }}>
                                    <div className="animate-spin" style={{ width: 16, height: 16, borderRadius: 8, border: '2px solid var(--color-gold)', borderTopColor: 'transparent' }} />
                                    <span style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>Cargando...</span>
                                </div>
                            ) : familyMembers.map(member => (
                                <div
                                    key={member.id}
                                    className="card"
                                    style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}
                                >
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 22, flexShrink: 0,
                                        background: 'var(--color-surface-hover)',
                                        border: '1px solid var(--color-border-strong)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 700, color: 'var(--color-gold)',
                                    }}>
                                        {member.first_name?.[0] ?? '?'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{member.first_name} {member.last_name}</h3>
                                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                            <Shield size={11} style={{ color: 'var(--color-gold-dark)' }} />
                                            <span style={{ textTransform: 'capitalize' }}>{member.role}</span>
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                        {member.is_active ? (
                                            <span style={{
                                                padding: '2px 8px', fontSize: 9, textTransform: 'uppercase',
                                                fontWeight: 700, letterSpacing: 1.2, borderRadius: 9999,
                                                background: 'rgba(52,211,153,0.1)', color: '#34D399',
                                                border: '1px solid rgba(52,211,153,0.2)',
                                            }}>Activo</span>
                                        ) : (
                                            <span style={{
                                                padding: '2px 8px', fontSize: 9, textTransform: 'uppercase',
                                                fontWeight: 700, letterSpacing: 1.2, borderRadius: 9999,
                                                background: 'rgba(var(--color-red-lebanese-rgb, 220,38,38),0.1)',
                                                color: 'var(--color-red-lebanese)',
                                            }}>Inactivo</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {user.role === 'titular' && !showAddForm && (
                                <Button variant="outline" style={{ width: '100%', padding: '20px 0', borderStyle: 'dashed' }} onClick={() => setShowAddForm(true)}>
                                    <UserPlus size={16} />
                                    Agregar Beneficiario
                                </Button>
                            )}
                            {showAddForm && (
                                <div style={{
                                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                    borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                                }}>
                                    <p className="section-header" style={{ marginBottom: 0 }}>Nuevo Beneficiario</p>
                                    {[
                                        { key: 'first_name', placeholder: 'Nombre' },
                                        { key: 'last_name', placeholder: 'Apellido' },
                                        { key: 'date_of_birth', placeholder: 'Fecha de nacimiento', type: 'date' },
                                    ].map(field => (
                                        <input key={field.key} type={field.type || 'text'} placeholder={field.placeholder}
                                            value={addForm[field.key as keyof typeof addForm]}
                                            onChange={e => setAddForm(f => ({ ...f, [field.key]: e.target.value }))}
                                            style={{
                                                width: '100%', background: 'var(--color-surface-hover)',
                                                border: '1px solid var(--color-border)', borderRadius: 12,
                                                padding: '10px 16px', fontSize: 13, color: 'var(--color-text-primary)',
                                                outline: 'none', boxSizing: 'border-box',
                                            }} />
                                    ))}
                                    <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                                        style={{
                                            width: '100%', background: 'var(--color-surface-hover)',
                                            border: '1px solid var(--color-border)', borderRadius: 12,
                                            padding: '10px 16px', fontSize: 13, color: 'var(--color-text-primary)',
                                            outline: 'none', boxSizing: 'border-box',
                                        }}>
                                        <option value="hijo">Hijo/a</option>
                                        <option value="conyugue">Cónyuge</option>
                                        <option value="dependiente">Dependiente</option>
                                    </select>
                                    <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                                        <button onClick={() => setShowAddForm(false)} style={{
                                            flex: 1, padding: '10px 0', borderRadius: 12,
                                            border: '1px solid var(--color-border)', background: 'transparent',
                                            fontSize: 12, color: 'var(--color-text-tertiary)', cursor: 'pointer',
                                        }}>Cancelar</button>
                                        <button disabled={addingMember || !addForm.first_name || !addForm.last_name}
                                            onClick={async () => {
                                                if (!user?.membership_id) return;
                                                setAddingMember(true);
                                                try {
                                                    await api.post(`/membership/${user.membership_id}/beneficiaries`, addForm);
                                                    const res = await api.get(`/membership/${user.membership_id}/beneficiaries`);
                                                    setFamilyMembers(res.data);
                                                    setShowAddForm(false);
                                                    setAddForm({ first_name: '', last_name: '', date_of_birth: '', role: 'hijo' });
                                                } catch { /* silently fail */ }
                                                finally { setAddingMember(false); }
                                            }}
                                            style={{
                                                flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                                                background: 'var(--color-gold)', color: 'var(--color-bg)',
                                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                opacity: (addingMember || !addForm.first_name || !addForm.last_name) ? 0.5 : 1,
                                            }}>
                                            {addingMember ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── TAB: APROBACIONES ── */}
                    {activeTab === 'approvals' && (
                        <motion.div
                            key="approvals"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                        >
                            <p className="section-header" style={{ marginBottom: 0 }}>Pendientes de autorización</p>

                            {loadingApprovals ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 8 }}>
                                    <div className="animate-spin" style={{ width: 16, height: 16, borderRadius: 8, border: '2px solid var(--color-gold)', borderTopColor: 'transparent' }} />
                                    <span style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>Cargando...</span>
                                </div>
                            ) : approvals.length === 0 ? (
                                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                        <Check size={22} style={{ color: '#10B981' }} strokeWidth={2} />
                                    </div>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Todo al día</p>
                                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>No hay reservas pendientes de aprobación</p>
                                </div>
                            ) : approvals.map((appr) => {
                                const initials = (appr.profile?.first_name?.[0] || '') + (appr.profile?.last_name?.[0] || '');
                                const serviceName = appr.service?.name || 'Reserva';
                                const dateStr = appr.date ? new Date(appr.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
                                const timeStr = appr.start_time ? `${appr.start_time}${appr.end_time ? '–' + appr.end_time : ''}` : '';
                                const requesterName = `${appr.profile?.first_name || ''} ${appr.profile?.last_name || ''}`.trim();
                                const isActioning = actioningId === appr.id;
                                return (
                                    <div key={appr.id} className="card" style={{ overflow: 'hidden' }}>
                                        <div style={{ padding: 16, display: 'flex', gap: 12, borderLeft: '2px solid var(--color-gold)' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                                                background: 'var(--color-surface-hover)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 12, fontWeight: 700, color: 'var(--color-gold)',
                                            }}>
                                                {initials}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{serviceName}</h4>
                                                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {requesterName}
                                                    {dateStr && <><span style={{ opacity: 0.4 }}>·</span> <CalendarDays size={10} />{dateStr}</>}
                                                    {timeStr && <><span style={{ opacity: 0.4 }}>·</span> <Clock size={10} />{timeStr}</>}
                                                </p>
                                                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4, opacity: 0.7 }}>Requiere tu aprobación</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                                            <Button variant="outline" size="sm" style={{ flex: 1, color: 'var(--color-red-lebanese)', borderColor: 'var(--color-border-strong)' }}
                                                onClick={() => handleApproval(appr.id, 'reject')} disabled={isActioning}>
                                                <X size={14} /> Rechazar
                                            </Button>
                                            <Button size="sm" style={{ flex: 1 }}
                                                onClick={() => handleApproval(appr.id, 'approve')} disabled={isActioning}>
                                                <Check size={14} /> Aprobar
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* ── TAB: ESTADO DE CUENTA ── */}
                    {activeTab === 'statement' && (
                        <motion.div
                            key="statement"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                        >
                            {/* Balance Card */}
                            {totalDue > 0 ? (
                                <div className="card-elevated" style={{ overflow: 'hidden' }}>
                                    {/* Red top banner */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, var(--color-red-lebanese), var(--color-red-lebanese-dark))',
                                        padding: '20px 20px 24px',
                                        position: 'relative',
                                    }}>
                                        <div style={{ position: 'absolute', right: -8, bottom: -8, opacity: 0.1 }}>
                                            <AlertCircle size={72} />
                                        </div>
                                        <div style={{ position: 'relative', zIndex: 1 }}>
                                            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                                                Saldo Pendiente
                                            </p>
                                            <h2 style={{ fontSize: 32, fontWeight: 700, color: 'white', marginTop: 6, letterSpacing: -0.5 }}>
                                                ${Number(totalDue).toLocaleString('es-MX')}
                                                <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>MXN</span>
                                            </h2>
                                        </div>
                                    </div>
                                    {/* Action area */}
                                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button onClick={() => navigate('/payment')} style={{ paddingLeft: 32, paddingRight: 32 }}>
                                            Pagar Adeudo
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Check size={20} style={{ color: '#10B981' }} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: '#10B981' }}>Al corriente</p>
                                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>No tienes saldos pendientes</p>
                                    </div>
                                </div>
                            )}

                            {/* Breakdown */}
                            {statement && (
                                <div className="card" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-hover)' }}>
                                        <p className="section-header" style={{ marginBottom: 0 }}>Desglose</p>
                                    </div>
                                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {statement.maintenance?.filter((m: any) => m.status === 'pendiente').map((m: any) => (
                                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Mantenimiento {m.period}</span>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-red-lebanese)' }}>${Number(m.amount).toLocaleString('es-MX')}</span>
                                            </div>
                                        ))}
                                        {statement.locker_rentals?.filter((l: any) => l.status !== 'pagada').map((l: any) => (
                                            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Locker {l.locker?.number}</span>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>${Number(l.price).toLocaleString('es-MX')}</span>
                                            </div>
                                        ))}
                                        <div style={{ height: 1, background: 'var(--color-border)' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Total</span>
                                            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-gold)' }}>${Number(totalDue).toLocaleString('es-MX')} MXN</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
