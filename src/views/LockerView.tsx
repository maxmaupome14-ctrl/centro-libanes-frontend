import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Lock, ChevronLeft, MapPin, Maximize2, DollarSign, CheckCheck, ChevronRight, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';

const LOCKER_PRICES: Record<string, number> = { chico: 400, mediano: 600, grande: 800 };

const zoneName = (z: string) => {
    const map: Record<string, string> = {
        vestidores_principales: 'Vestidores Principales',
        vestidores_auxiliares: 'Vestidores Auxiliares',
        gym: 'Gimnasio',
        alberca: 'Alberca',
        cancha: 'Canchas',
    };
    return map[z] || z;
};

export const LockerView = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [activeUnit, setActiveUnit] = useState('Hermes');
    const [lockers, setLockers] = useState<any[]>([]);
    const [myLockers, setMyLockers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<'list' | 'details' | 'success'>('list');
    const [selected, setSelected] = useState<any>(null);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        fetchAll();
    }, [activeUnit]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [lockersRes, myRes] = await Promise.all([
                api.get(`/lockers?unit_name=${activeUnit}`),
                api.get('/lockers/my'),
            ]);
            setLockers(lockersRes.data);
            setMyLockers(myRes.data);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    const handleRent = async () => {
        if (!selected) return;
        setIsBooking(true);
        try {
            await api.post(`/lockers/${selected.id}/rent`, {});
            setStep('success');
            fetchAll();
        } catch (err: any) {
            showToast(err.response?.data?.error || err.message);
        } finally {
            setIsBooking(false);
        }
    };

    const handleToggleAutoRenew = async (_rentalId: string, lockerId: string) => {
        if (window.confirm('¿Deseas liberar este casillero al finalizar el periodo?')) {
            try {
                await api.post(`/lockers/${lockerId}/release`, {});
                fetchAll();
            } catch (err: any) {
                showToast(err.response?.data?.error || err.message);
            }
        }
    };

    const availableLockers = lockers.filter(l => l.is_available);

    if (!user) return null;

    return (
        <div className="pb-36">
            {/* Header */}
            <div className="sticky top-0 z-40 glass px-5 h-12 flex items-center gap-3 border-b border-[var(--color-border)]">
                <button onClick={() => navigate(-1)} aria-label="Volver" className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center cursor-pointer">
                    <ChevronLeft size={18} className="text-[var(--color-text-primary)]" />
                </button>
                <h1 className="text-[13px] font-bold tracking-wider uppercase flex-1">Casilleros</h1>
                <span className="text-[11px] text-[var(--color-text-tertiary)]">{availableLockers.length} disponibles</span>
            </div>

            <AnimatePresence mode="wait">
                {step === 'list' && (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pt-5 space-y-6">

                        {/* Unit toggle */}
                        <div className="bg-[var(--color-surface)] p-1 rounded-xl border border-[var(--color-border)] flex">
                            {['Hermes', 'Fredy Atala'].map(u => (
                                <button key={u} onClick={() => setActiveUnit(u)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeUnit === u
                                        ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
                                        : 'text-[var(--color-text-secondary)]'}`}>
                                    {u}
                                </button>
                            ))}
                        </div>

                        {/* My Active Rentals */}
                        {myLockers.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--color-text-tertiary)] px-1">Mis Casilleros Activos</p>
                                {myLockers.map((rental: any) => (
                                    <div key={rental.id} className="bg-[var(--color-surface)] border border-[var(--color-gold)]/20 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="w-11 h-11 bg-[var(--color-gold)]/10 rounded-xl flex items-center justify-center shrink-0">
                                            <Lock size={20} className="text-[var(--color-gold)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[var(--color-text-primary)] text-sm">Locker {rental.locker?.number}</p>
                                            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                                                {rental.locker?.unit?.short_name} · {zoneName(rental.locker?.zone)}
                                            </p>
                                            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                                                Hasta: {new Date(rental.end_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Activo</span>
                                            {rental.auto_renew && (
                                                <button onClick={() => handleToggleAutoRenew(rental.id, rental.locker?.id)}
                                                    className="text-[10px] text-[var(--color-red-lebanese)] font-semibold cursor-pointer">
                                                    Liberar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Available Lockers - List format */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--color-text-tertiary)] px-1">Disponibles para Renta</p>

                            {loading ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-20 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] animate-pulse" />
                                    ))}
                                </div>
                            ) : availableLockers.length === 0 ? (
                                <div className="py-12 text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                                    <Lock size={28} className="text-[var(--color-text-tertiary)] mx-auto mb-3" strokeWidth={1.5} />
                                    <p className="text-sm text-[var(--color-text-secondary)]">No hay casilleros disponibles</p>
                                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">en {activeUnit} en este momento</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {availableLockers.map(l => (
                                        <button
                                            key={l.id}
                                            onClick={() => { setSelected(l); setStep('details'); }}
                                            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-gold)]/40 rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer group text-left"
                                        >
                                            <div className="w-11 h-11 bg-[var(--color-surface-hover)] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[var(--color-gold)]/10 transition-colors">
                                                <Lock size={18} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-gold)] transition-colors" strokeWidth={1.6} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[var(--color-text-primary)] text-sm">Locker {l.number}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                                                        <MapPin size={10} /> {zoneName(l.zone)}
                                                    </span>
                                                    {l.floor && (
                                                        <span className="text-[11px] text-[var(--color-text-tertiary)]">Piso {l.floor}</span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                                                        <Maximize2 size={9} /> <span className="capitalize">{l.size}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-2">
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-[var(--color-gold)]">${(LOCKER_PRICES[l.size] || 600).toLocaleString()}</p>
                                                    <p className="text-[9px] text-[var(--color-text-tertiary)]">/ trimestre</p>
                                                </div>
                                                <ChevronRight size={16} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-gold)] transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {step === 'details' && selected && (
                    <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-5 pt-6">
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-xl">
                            {/* Top banner */}
                            <div className="bg-gradient-to-br from-[var(--color-green-cedar-dark)] to-[var(--color-green-cedar)] p-6 text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-3">
                                    <Lock size={28} className="text-white" strokeWidth={1.6} />
                                </div>
                                <h2 className="text-xl font-bold text-white">Locker {selected.number}</h2>
                                <p className="text-white/60 text-sm mt-1">{activeUnit} · {zoneName(selected.zone)}</p>
                            </div>

                            {/* Details */}
                            <div className="p-5 space-y-3">
                                {[
                                    { label: 'Zona', value: zoneName(selected.zone), icon: MapPin },
                                    { label: 'Tamaño', value: selected.size?.charAt(0).toUpperCase() + selected.size?.slice(1), icon: Maximize2 },
                                    { label: 'Costo trimestral', value: `$${(LOCKER_PRICES[selected.size] || 600).toLocaleString()} MXN`, icon: DollarSign },
                                    { label: 'Auto-renovación', value: 'Activada', icon: ToggleRight },
                                ].map(row => (
                                    <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
                                        <div className="flex items-center gap-2.5 text-[var(--color-text-tertiary)]">
                                            <row.icon size={14} />
                                            <span className="text-xs">{row.label}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[10px] text-[var(--color-text-tertiary)] text-center px-6 pb-5 leading-relaxed">
                                El cobro se aplica automáticamente al inicio de cada trimestre. Puedes cancelar la renovación desde aquí.
                            </p>

                            <div className="flex gap-3 px-5 pb-5">
                                <Button variant="outline" className="flex-1" onClick={() => setStep('list')}>Cancelar</Button>
                                <Button className="flex-1" onClick={handleRent} isLoading={isBooking}>Confirmar Renta</Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-5 pt-10 text-center space-y-5">
                        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full mx-auto flex items-center justify-center">
                            <CheckCheck size={36} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">¡Casillero Asignado!</h2>
                            <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
                                Locker {selected?.number} en {activeUnit} está listo para usarse.
                            </p>
                        </div>
                        <Button className="w-full" onClick={() => { setStep('list'); setSelected(null); }}>
                            Ver mis casilleros
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
