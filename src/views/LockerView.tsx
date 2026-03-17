import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Lock, ChevronLeft, MapPin, Maximize2, DollarSign, CheckCheck, ChevronRight, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';
import { LockerFloorPlan } from '../components/ui/LockerFloorPlan';

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
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [confirmRelease, setConfirmRelease] = useState<{ rentalId: string; lockerId: string; number: string } | null>(null);

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

    const handleRelease = async () => {
        if (!confirmRelease) return;
        try {
            await api.post(`/lockers/${confirmRelease.lockerId}/release`, {});
            fetchAll();
            setConfirmRelease(null);
        } catch (err: any) {
            showToast(err.response?.data?.error || err.message);
        }
    };

    const availableLockers = lockers.filter(l => l.is_available);

    if (!user) return null;

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div className="glass" style={{
                position: 'sticky', top: 0, zIndex: 40,
                padding: '0 16px', height: 48,
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--color-border)',
            }}>
                <button onClick={() => navigate(-1)} aria-label="Volver" style={{
                    width: 40, height: 40, borderRadius: 20, border: 'none',
                    background: 'var(--color-surface-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', touchAction: 'manipulation',
                }}>
                    <ChevronLeft size={18} style={{ color: 'var(--color-text-primary)' }} />
                </button>
                <h1 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', flex: 1 }}>Casilleros</h1>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{availableLockers.length} disponibles</span>
            </div>

            <AnimatePresence mode="wait">
                {step === 'list' && (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Unit toggle (iOS HIG Segmented Control) */}
                        <div>
                        <p className="section-header" style={{ marginBottom: 12 }}>Sede</p>
                        <div style={{ display: 'flex', padding: 2, borderRadius: 8, background: 'rgba(120,120,128,0.16)' }}>
                            {['Hermes', 'Fredy Atala'].map(u => (
                                <button key={u} onClick={() => setActiveUnit(u)}
                                    style={{
                                        position: 'relative', flex: 1, padding: '7px 0',
                                        fontSize: 13, fontWeight: 500, borderRadius: 7, border: 'none',
                                        cursor: 'pointer', outline: 'none', transition: 'all 200ms',
                                        color: activeUnit === u ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                        background: activeUnit === u ? 'var(--color-surface)' : 'transparent',
                                        boxShadow: activeUnit === u ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)' : 'none',
                                    }}>
                                    {u}
                                </button>
                            ))}
                        </div>
                        </div>

                        {/* Floor Plan */}
                        <LockerFloorPlan
                            lockers={lockers}
                            selectedFloor={selectedZone}
                            onFloorSelect={(f) => setSelectedZone(f || null)}
                        />

                        {/* My Active Rentals */}
                        {myLockers.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <p className="section-header" style={{ marginBottom: 0, paddingLeft: 4 }}>Mis Casilleros Activos</p>
                                {myLockers.map((rental: any) => (
                                    <div key={rental.id} style={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid rgba(201,168,76,0.2)',
                                        borderRadius: 16, padding: 16,
                                        display: 'flex', alignItems: 'center', gap: 16,
                                    }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                            background: 'rgba(201,168,76,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Lock size={20} style={{ color: 'var(--color-gold)' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14 }}>Locker {rental.locker?.number}</p>
                                            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                                {rental.locker?.unit?.short_name} · {zoneName(rental.locker?.zone)}
                                            </p>
                                            <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                                                Hasta: {new Date(rental.end_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                                            <span style={{
                                                padding: '2px 8px', fontSize: 9, fontWeight: 700,
                                                textTransform: 'uppercase', letterSpacing: 1.2, borderRadius: 9999,
                                                background: 'rgba(52,211,153,0.1)', color: '#34D399',
                                                border: '1px solid rgba(52,211,153,0.2)',
                                            }}>Activo</span>
                                            {rental.auto_renew && (
                                                <button onClick={() => setConfirmRelease({ rentalId: rental.id, lockerId: rental.locker?.id, number: rental.locker?.number })}
                                                    style={{
                                                        fontSize: 10, fontWeight: 600, color: 'var(--color-red-lebanese)',
                                                        cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                                                    }}>
                                                    Liberar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Available Lockers - List format */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4 }}>
                                <p className="section-header" style={{ marginBottom: 0 }}>
                                    Disponibles {selectedZone ? `— Piso ${selectedZone}` : 'para Renta'}
                                </p>
                                {selectedZone && (
                                    <button onClick={() => setSelectedZone(null)} style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gold)', cursor: 'pointer', background: 'none', border: 'none', touchAction: 'manipulation' }}>
                                        Ver todos
                                    </button>
                                )}
                            </div>

                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse" style={{
                                            height: 80, background: 'var(--color-surface)',
                                            borderRadius: 16, border: '1px solid var(--color-border)',
                                        }} />
                                    ))}
                                </div>
                            ) : availableLockers.length === 0 ? (
                                <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(201,168,76,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                        <Lock size={22} style={{ color: 'var(--color-text-tertiary)' }} strokeWidth={1.5} />
                                    </div>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-secondary)' }}>No hay casilleros disponibles</p>
                                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>en {activeUnit} en este momento</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {(selectedZone ? availableLockers.filter(l => (l.floor || '1') === selectedZone) : availableLockers).map(l => (
                                        <button
                                            key={l.id}
                                            onClick={() => { setSelected(l); setStep('details'); }}
                                            style={{
                                                width: '100%', textAlign: 'left',
                                                background: 'var(--color-surface)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 16, padding: 16,
                                                display: 'flex', alignItems: 'center', gap: 16,
                                                transition: 'all 200ms', cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                                background: 'var(--color-surface-hover)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'background 200ms',
                                            }}>
                                                <Lock size={18} style={{ color: 'var(--color-text-tertiary)', transition: 'color 200ms' }} strokeWidth={1.6} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14 }}>Locker {l.number}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                                        <MapPin size={10} /> {zoneName(l.zone)}
                                                    </span>
                                                    {l.floor && (
                                                        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Piso {l.floor}</span>
                                                    )}
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                                        <Maximize2 size={9} /> <span style={{ textTransform: 'capitalize' }}>{l.size}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gold)' }}>${(LOCKER_PRICES[l.size] || 600).toLocaleString()}</p>
                                                    <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>/ trimestre</p>
                                                </div>
                                                <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)', transition: 'color 200ms' }} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {step === 'details' && selected && (
                    <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        style={{ padding: '24px 16px 0' }}>
                        <div style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 24, overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        }}>
                            {/* Top banner */}
                            <div style={{
                                background: 'linear-gradient(135deg, var(--color-green-cedar-dark), var(--color-green-cedar))',
                                padding: 24, textAlign: 'center',
                            }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: 16, margin: '0 auto 12px',
                                    background: 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Lock size={28} style={{ color: 'white' }} strokeWidth={1.6} />
                                </div>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Locker {selected.number}</h2>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>{activeUnit} · {zoneName(selected.zone)}</p>
                            </div>

                            {/* Details */}
                            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { label: 'Zona', value: zoneName(selected.zone), icon: MapPin },
                                    { label: 'Tamaño', value: selected.size?.charAt(0).toUpperCase() + selected.size?.slice(1), icon: Maximize2 },
                                    { label: 'Costo trimestral', value: `$${(LOCKER_PRICES[selected.size] || 600).toLocaleString()} MXN`, icon: DollarSign },
                                    { label: 'Auto-renovación', value: 'Activada', icon: ToggleRight },
                                ].map(row => (
                                    <div key={row.label} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 0',
                                        borderBottom: '1px solid var(--color-border)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-tertiary)' }}>
                                            <row.icon size={14} />
                                            <span style={{ fontSize: 12 }}>{row.label}</span>
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '0 16px 20px', lineHeight: 1.6 }}>
                                El cobro se aplica automáticamente al inicio de cada trimestre. Puedes cancelar la renovación desde aquí.
                            </p>

                            <div style={{ display: 'flex', gap: 12, padding: '0 16px 20px' }}>
                                <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep('list')}>Cancelar</Button>
                                <Button style={{ flex: 1 }} onClick={handleRent} isLoading={isBooking}>Confirmar Renta</Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: '40px 16px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 40,
                            background: 'rgba(16,185,129,0.1)', color: '#10B981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <CheckCheck size={36} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>¡Casillero Asignado!</h2>
                            <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', marginTop: 8 }}>
                                Locker {selected?.number} en {activeUnit} está listo para usarse.
                            </p>
                        </div>
                        <Button style={{ width: '100%' }} onClick={() => { setStep('list'); setSelected(null); }}>
                            Ver mis casilleros
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Release confirmation modal */}
            <AnimatePresence>
                {confirmRelease && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setConfirmRelease(null)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 60,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 24,
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--color-surface)',
                                borderRadius: 20,
                                padding: 24,
                                width: '100%',
                                maxWidth: 320,
                                textAlign: 'center',
                                border: '1px solid var(--color-border)',
                                boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                            }}
                        >
                            <div style={{
                                width: 56, height: 56, borderRadius: 28,
                                background: 'rgba(206,17,38,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <Lock size={24} style={{ color: 'var(--color-red-lebanese)' }} />
                            </div>
                            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                                Liberar Locker {confirmRelease.number}
                            </h3>
                            <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', lineHeight: 1.5, marginBottom: 24 }}>
                                El casillero se liberará al finalizar el periodo actual. Esta acción no se puede deshacer.
                            </p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Button variant="outline" style={{ flex: 1 }} onClick={() => setConfirmRelease(null)}>
                                    Cancelar
                                </Button>
                                <button
                                    onClick={handleRelease}
                                    style={{
                                        flex: 1, padding: '10px 0', borderRadius: 12,
                                        background: 'var(--color-red-lebanese)',
                                        color: 'white', fontSize: 14, fontWeight: 600,
                                        border: 'none', cursor: 'pointer',
                                        touchAction: 'manipulation',
                                    }}
                                >
                                    Liberar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
