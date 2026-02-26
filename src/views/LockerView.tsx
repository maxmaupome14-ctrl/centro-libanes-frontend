import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Lock, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LockerView = () => {
    const { user } = useAuthStore();
    const [activeUnit, setActiveUnit] = useState('Hermes');
    const [lockers, setLockers] = useState<any[]>([]);
    const [myLockers, setMyLockers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState('Caballeros');
    const [bookingStep, setBookingStep] = useState<'list' | 'details' | 'success'>('list');
    const [selectedLocker, setSelectedLocker] = useState<any>(null);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        fetchMyLockers();
        fetchLockers();
    }, [activeUnit]);

    const fetchLockers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/lockers?unit_name=${activeUnit}`);
            setLockers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyLockers = async () => {
        try {
            const res = await api.get('/lockers/my');
            setMyLockers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRent = async () => {
        if (!selectedLocker) return;
        setIsBooking(true);
        try {
            await api.post(`/lockers/${selectedLocker.id}/rent`, {});
            setBookingStep('success');
            fetchMyLockers();
            fetchLockers();
        } catch (err: any) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsBooking(false);
        }
    };

    const handleRelease = async (lockerId: string) => {
        if (window.confirm('¿Estás seguro de liberar este locker al finalizar el periodo?')) {
            try {
                await api.post(`/lockers/${lockerId}/release`, {});
                fetchMyLockers();
                fetchLockers();
            } catch (err: any) {
                alert('Error: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    const filteredLockers = lockers.filter(l => l.zone === selectedZone);

    if (!user) return null;

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="relative bg-gradient-to-b from-[var(--color-green-cedar-dark)] to-[var(--color-green-cedar)] pt-6 pb-16 px-5 overflow-hidden">
                <div className="absolute top-[-50%] right-[-30%] w-[300px] h-[300px] rounded-full bg-white/5 blur-[100px]" />
                <div className="relative z-10">
                    <h1 className="text-lg font-bold text-white tracking-tight">Mis Casilleros</h1>
                    <p className="text-white/50 text-sm mt-0.5">Renta y administración anual</p>
                </div>
            </div>

            <div className="px-5 -mt-10 relative z-20 space-y-6">

                <AnimatePresence mode="wait">
                    {bookingStep === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* My Lockers */}
                            {myLockers.length > 0 && (
                                <div className="space-y-3">
                                    <h2 className="text-[10px] uppercase tracking-[2px] font-bold text-[var(--color-text-tertiary)] ml-1">Rentados Actualmente</h2>
                                    {myLockers.map((rental: any) => (
                                        <div key={rental.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded-xl flex items-center justify-center">
                                                    <Lock size={20} className="text-[var(--color-gold)]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[var(--color-text-primary)]">Locker {rental.locker.number}</h3>
                                                    <p className="text-[11px] text-[var(--color-text-tertiary)]">{rental.locker.unit.short_name} • {rental.locker.zone}</p>
                                                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 font-medium">Auto-Renueva: {rental.auto_renew ? 'Sí' : 'No'}</p>
                                                </div>
                                            </div>
                                            {rental.auto_renew && (
                                                <button onClick={() => handleRelease(rental.locker.id)} className="text-[11px] font-semibold text-[var(--color-red-lebanese)] bg-[var(--color-red-lebanese)]/10 px-3 py-1.5 rounded-lg border border-[var(--color-red-lebanese)]/20">
                                                    Liberar
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Rent New Locker Section */}
                            <div className="space-y-4 pt-2">
                                <h2 className="text-[10px] uppercase tracking-[2px] font-bold text-[var(--color-text-tertiary)] ml-1">Rentar Nuevo Casillero</h2>

                                {/* Filters */}
                                <div className="bg-[var(--color-surface)] p-3 rounded-2xl border border-[var(--color-border)] space-y-3">
                                    <div className="flex bg-[var(--color-surface-hover)] rounded-xl p-1">
                                        {['Hermes', 'Fredy Atala'].map(u => (
                                            <button key={u} onClick={() => setActiveUnit(u)}
                                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeUnit === u ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]' : 'text-[var(--color-text-secondary)]'}`}>
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex bg-[var(--color-surface-hover)] rounded-xl p-1">
                                        {['Caballeros', 'Damas'].map(z => (
                                            <button key={z} onClick={() => setSelectedZone(z)}
                                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${selectedZone === z ? 'bg-[var(--color-gold)] text-[var(--color-bg)]' : 'text-[var(--color-text-secondary)]'}`}>
                                                {z}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Availability Grid */}
                                {loading ? (
                                    <div className="py-10 text-center text-[var(--color-text-tertiary)] text-sm">Cargando casilleros...</div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2">
                                        {filteredLockers.map(l => (
                                            <button
                                                key={l.id}
                                                disabled={!l.is_available}
                                                onClick={() => { setSelectedLocker(l); setBookingStep('details'); }}
                                                className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${l.is_available
                                                    ? 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-gold)]/50 cursor-pointer'
                                                    : 'bg-[var(--color-surface-hover)] border-transparent opacity-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                <span className={`text-[13px] font-bold ${l.is_available ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>
                                                    {l.number}
                                                </span>
                                                <span className="text-[9px] uppercase font-medium text-[var(--color-text-tertiary)]">
                                                    {l.size}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {bookingStep === 'details' && selectedLocker && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl shadow-xl space-y-5"
                        >
                            <div className="text-center space-y-1">
                                <div className="w-16 h-16 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-2xl mx-auto flex items-center justify-center mb-3">
                                    <Lock size={28} />
                                </div>
                                <h2 className="text-xl font-bold font-display text-[var(--color-text-primary)]">Rentar Casillero</h2>
                                <p className="text-sm text-[var(--color-text-tertiary)]">Locker {selectedLocker.number}</p>
                            </div>

                            <div className="bg-[var(--color-surface-hover)] rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--color-text-tertiary)]">Unidad</span>
                                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{activeUnit}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--color-text-tertiary)]">Zona</span>
                                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{selectedZone}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--color-text-tertiary)]">Tamaño</span>
                                    <span className="text-sm font-semibold text-[var(--color-text-primary)] capitalize">{selectedLocker.size}</span>
                                </div>
                                <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
                                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">Costo por trimestre</span>
                                    <span className="text-base font-bold text-[var(--color-gold)]">
                                        ${selectedLocker.size === 'chico' ? 400 : selectedLocker.size === 'mediano' ? 600 : 800} <span className="text-[10px] text-[var(--color-text-tertiary)]">MXN</span>
                                    </span>
                                </div>
                            </div>

                            <p className="text-[10px] text-[var(--color-text-tertiary)] text-center px-4 leading-relaxed">
                                El cobro se realizará automáticamente a tu método de pago registrado al inicio de cada trimestre. Puedes cancelar la renovación automática en cualquier momento.
                            </p>

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setBookingStep('list')}>Cancelar</Button>
                                <Button className="flex-1" onClick={handleRent} isLoading={isBooking}>Confirmar</Button>
                            </div>
                        </motion.div>
                    )}

                    {bookingStep === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full mx-auto flex items-center justify-center mb-2">
                                <CheckCheck size={32} />
                            </div>
                            <h2 className="text-xl font-bold font-display text-[var(--color-text-primary)]">¡Locker Asignado!</h2>
                            <p className="text-sm text-[var(--color-text-tertiary)] px-4">
                                Tu casillero {selectedLocker?.number} en {activeUnit} zona {selectedZone} está listo para usarse.
                            </p>
                            <div className="pt-4">
                                <Button className="w-full" onClick={() => { setBookingStep('list'); setSelectedLocker(null); }}>
                                    Ver mis casilleros
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
