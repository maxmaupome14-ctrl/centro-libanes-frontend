import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Shield, Check, X, UserPlus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

const MOCK_STATEMENT = {
    maintenance: [{ id: 'm1', month: 'Febrero 2026', amount: 8500, status: 'vencido' }],
    services: [
        { id: 's1', user: 'Andrea S.', desc: 'Masaje Relajante', amount: 950 },
        { id: 's2', user: 'Leo Nicolas', desc: 'Clínica de Tenis', amount: 1200 }
    ],
    lockers: [{ id: 'l1', desc: 'Locker Caballeros H04', amount: 450 }]
};

export const FamilyView = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'family' | 'statement' | 'approvals'>('family');
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const totalDue = 8500 + 950 + 1200 + 450;

    useEffect(() => {
        const fetchFamily = async () => {
            if (!user?.membership_id) return;
            try {
                const res = await api.get(`/membership/${user.membership_id}/beneficiaries`);
                setFamilyMembers(res.data);
            } catch (err) {
                console.error('Error fetching family', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFamily();
    }, [user]);

    if (!user) return null;

    const tabs = [
        { key: 'family' as const, label: 'Familia' },
        { key: 'approvals' as const, label: 'Aprobaciones', badge: true },
        { key: 'statement' as const, label: 'Estado Cta.' },
    ];

    return (
        <div className="pb-24">

            {/* ── Header ── */}
            <div className="relative bg-gradient-to-b from-[var(--color-green-cedar-dark)] to-[var(--color-green-cedar)] pt-6 pb-16 px-5 overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-[-50%] right-[-30%] w-[300px] h-[300px] rounded-full bg-white/5 blur-[100px]" />
                <div className="relative z-10">
                    <h1 className="text-lg font-bold text-white tracking-tight">Administración Familiar</h1>
                    <p className="text-white/50 text-sm mt-0.5">
                        Membresía <span className="text-[var(--color-gold-light)] font-semibold">{user.member_number || '---'}</span>
                    </p>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="px-5 -mt-10 relative z-20 space-y-5">

                {/* Tab Pills */}
                <div className="bg-[var(--color-surface)] p-1 rounded-[var(--radius-md)] flex border border-[var(--color-border)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-[var(--radius-sm)] transition-all relative ${activeTab === tab.key
                                ? 'bg-[var(--color-gold)] text-[var(--color-bg)] shadow-sm'
                                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                }`}
                        >
                            {tab.label}
                            {tab.badge && (
                                <span className={`absolute top-1 right-2 w-1.5 h-1.5 rounded-full ${activeTab === tab.key ? 'bg-[var(--color-bg)]' : 'bg-[var(--color-red-lebanese)]'
                                    } animate-pulse`} />
                            )}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ── TAB: FAMILIA ── */}
                    {activeTab === 'family' && (
                        <motion.div
                            key="family"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-3"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center py-8 gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-[var(--color-gold)] animate-spin" />
                                    <span className="text-sm text-[var(--color-text-tertiary)]">Cargando...</span>
                                </div>
                            ) : familyMembers.map(member => (
                                <div
                                    key={member.id}
                                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 flex items-center gap-4 hover:border-[var(--color-border-strong)] transition-all"
                                >
                                    <div className="w-11 h-11 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-strong)] flex items-center justify-center text-sm font-bold text-[var(--color-gold)] shrink-0">
                                        {member.first_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{member.first_name} {member.last_name}</h3>
                                        <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1 mt-0.5">
                                            <Shield size={11} className="text-[var(--color-gold-dark)]" />
                                            <span className="capitalize">{member.role}</span>
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {member.is_active ? (
                                            <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Activo</span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest rounded-full bg-[var(--color-red-lebanese)]/10 text-[var(--color-red-lebanese)]">Inactivo</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {user.role === 'titular' && (
                                <Button variant="outline" className="w-full py-5 border-dashed">
                                    <UserPlus size={16} />
                                    Agregar Beneficiario
                                </Button>
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
                            className="space-y-4"
                        >
                            <p className="text-[10px] font-bold tracking-[2px] text-[var(--color-text-tertiary)] uppercase">Pendientes de autorización</p>

                            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
                                <div className="p-4 flex gap-3 border-l-2 border-l-[var(--color-gold)]">
                                    <div className="w-10 h-10 bg-[var(--color-surface-hover)] rounded-full flex shrink-0 items-center justify-center text-xs font-bold text-[var(--color-gold)]">
                                        LN
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">Cancha de Tenis</h4>
                                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Leo Nicolas • Hoy 17:00</p>
                                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1 opacity-70">Requiere tu aprobación por reserva de recurso principal.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 p-3 pt-0 px-4 border-t border-[var(--color-border)]">
                                    <Button variant="outline" size="sm" className="flex-1 text-[var(--color-red-lebanese)] border-[var(--color-border-strong)]">
                                        <X size={14} /> Rechazar
                                    </Button>
                                    <Button size="sm" className="flex-1">
                                        <Check size={14} /> Aprobar
                                    </Button>
                                </div>
                            </div>
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
                            className="space-y-4"
                        >
                            {/* Alert Card */}
                            <div className="bg-[var(--color-red-lebanese)] rounded-[var(--radius-lg)] p-5 relative overflow-hidden">
                                <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                                    <AlertCircle size={80} />
                                </div>
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <p className="text-red-200 text-[10px] font-bold uppercase tracking-widest">Saldo Vencido</p>
                                        <h2 className="text-2xl font-bold text-white mt-1">
                                            ${totalDue.toLocaleString('es-MX')} <span className="text-sm font-normal opacity-70">MXN</span>
                                        </h2>
                                        <p className="text-xs text-red-100/70 mt-0.5">Fecha límite excedida por 4 días</p>
                                    </div>
                                    <Button size="sm" className="bg-white text-[var(--color-red-lebanese)] hover:bg-white/90 shadow-none border-0" onClick={() => navigate('/payment')}>
                                        Pagar
                                    </Button>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                                <div className="bg-[var(--color-surface-hover)] px-4 py-3 border-b border-[var(--color-border)]">
                                    <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Desglose del Mes</p>
                                </div>

                                <div className="p-4 space-y-4">
                                    {/* Maintenance */}
                                    <div>
                                        <p className="text-[9px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Mantenimiento</p>
                                        {MOCK_STATEMENT.maintenance.map(m => (
                                            <div key={m.id} className="flex justify-between items-center py-1">
                                                <span className="text-sm text-[var(--color-text-primary)]">{m.month}</span>
                                                <span className="text-sm font-semibold text-[var(--color-red-lebanese)]">${m.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="h-px bg-[var(--color-border)]" />

                                    {/* Services */}
                                    <div>
                                        <p className="text-[9px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Servicios Extra</p>
                                        {MOCK_STATEMENT.services.map(s => (
                                            <div key={s.id} className="flex justify-between items-start py-1.5">
                                                <div>
                                                    <p className="text-sm text-[var(--color-text-primary)]">{s.desc}</p>
                                                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{s.user}</p>
                                                </div>
                                                <span className="text-sm font-medium text-[var(--color-text-primary)] shrink-0">${s.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="h-px bg-[var(--color-border)]" />

                                    {/* Total */}
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-bold text-[var(--color-text-primary)]">Total</span>
                                        <span className="font-bold text-lg text-[var(--color-gold)]">${totalDue.toLocaleString('es-MX')} MXN</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
