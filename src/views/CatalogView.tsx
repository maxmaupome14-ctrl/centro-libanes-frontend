import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { MapPin, Clock, Search, Dumbbell, Sparkles, Music, Heart, X, CalendarDays, Check, Waves, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const categoryIcons: Record<string, any> = {
    deportes: Dumbbell,
    spa: Sparkles,
    danza: Music,
    bienestar: Heart,
    acuaticas: Waves,
    artes_marciales: Swords,
    natacion: Waves,
};

const categoryColors: Record<string, string> = {
    deportes: '#007A4A',
    spa: '#C9A84C',
    danza: '#8B5CF6',
    bienestar: '#EC4899',
    acuaticas: '#06B6D4',
    artes_marciales: '#EF4444',
    natacion: '#06B6D4',
};

const categoryLabels: Record<string, string> = {
    deportes: 'Deportes',
    spa: 'Spa',
    danza: 'Danza',
    bienestar: 'Bienestar',
    acuaticas: 'Acuáticas',
    artes_marciales: 'Artes Marciales',
    natacion: 'Natación',
};

export const CatalogView = () => {
    const { user } = useAuthStore();
    const [activeUnit, setActiveUnit] = useState<'Hermes' | 'Fredy Atala'>('Hermes');
    const [activeCategory, setActiveCategory] = useState('todos');
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Booking flow state
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [bookingStep, setBookingStep] = useState<'details' | 'confirm' | 'success' | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isBooking, setIsBooking] = useState(false);

    // Build categories dynamically from the catalog data
    const uniqueCats = Array.from(new Set(catalogItems.map(i => i.category?.toLowerCase()).filter(Boolean)));
    const categories = ['todos', ...uniqueCats];

    // Generate next 7 days for date picker
    const next7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return {
            value: d.toISOString().split('T')[0],
            day: d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''),
            num: d.getDate(),
            month: d.toLocaleDateString('es-MX', { month: 'short' }),
        };
    });

    // Time slots
    const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

    useEffect(() => {
        const fetchCatalog = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/catalog?unit_name=${activeUnit}`);
                setCatalogItems(res.data);
            } catch (err) {
                console.error('Error fetching catalog', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCatalog();
    }, [activeUnit]);

    const handleBook = async () => {
        if (!user || !selectedItem || !selectedDate || !selectedTime) return;
        setIsBooking(true);
        try {
            if (selectedItem.type === 'activity') {
                // Activities use the enrollment endpoint, date/time is just UI selected
                await api.post('/enrollments', { activity_id: selectedItem.id });
            } else {
                // Services and resources use the reservation endpoint
                const endHour = String(parseInt(selectedTime.split(':')[0]) + 1).padStart(2, '0') + ':00';
                const payload: any = {
                    date: selectedDate,
                    start_time: selectedTime,
                    end_time: endHour,
                };

                if (selectedItem.type === 'service') {
                    payload.service_id = selectedItem.id;
                } else if (selectedItem.type === 'resource') {
                    payload.resource_id = selectedItem.id;
                }

                await api.post('/reservations/book', payload);
            }
            setBookingStep('success');
        } catch (err: any) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsBooking(false);
        }
    };

    const openBooking = (item: any) => {
        setSelectedItem(item);
        setSelectedDate(next7Days[0].value);
        setSelectedTime('');
        setBookingStep('details');
    };

    const closeBooking = () => {
        setSelectedItem(null);
        setBookingStep(null);
        setSelectedDate('');
        setSelectedTime('');
    };

    const filteredActivities = catalogItems.filter(a =>
        activeCategory === 'todos' || (a.category?.toLowerCase() || '') === activeCategory
    );

    return (
        <div className="pb-28">

            {/* ── Header ── */}
            <div className="px-5 pt-5 pb-3">
                <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Reservar</h1>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Explora actividades, spa y canchas</p>
            </div>

            {/* ── Unit Toggle ── */}
            <div className="px-5 mb-4">
                <div className="relative flex p-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                    <motion.div
                        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[var(--color-surface-active)] rounded-lg border border-[var(--color-border-strong)]"
                        initial={false}
                        animate={{ left: activeUnit === 'Hermes' ? '4px' : 'calc(50%)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                    {(['Hermes', 'Fredy Atala'] as const).map((unit) => (
                        <button
                            key={unit}
                            className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeUnit === unit ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'
                                }`}
                            onClick={() => setActiveUnit(unit)}
                        >
                            <MapPin size={13} className={activeUnit === unit ? 'text-[var(--color-gold)]' : 'opacity-40'} />
                            U. {unit}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Category Filters ── */}
            <div className="px-5 mb-5">
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border ${activeCategory === cat
                                ? 'bg-[var(--color-gold)] text-[var(--color-bg)] border-[var(--color-gold)]'
                                : 'bg-transparent text-[var(--color-text-tertiary)] border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]'
                                }`}
                        >
                            {categoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Results ── */}
            <div className="px-5">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 gap-2.5">
                        <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-[var(--color-gold)] animate-spin" />
                        <p className="text-sm text-[var(--color-text-tertiary)]">Cargando...</p>
                    </div>
                ) : filteredActivities.length > 0 ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeUnit + activeCategory}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex flex-col gap-2.5"
                        >
                            {filteredActivities.map((act) => {
                                const catKey = act.category?.toLowerCase() || '';
                                const IconComp = categoryIcons[catKey] || Dumbbell;
                                const iconColor = categoryColors[catKey] || '#007A4A';

                                return (
                                    <button
                                        key={act.id}
                                        onClick={() => openBooking(act)}
                                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-border-strong)] transition-all text-left w-full"
                                    >
                                        <div className="p-4 flex items-center gap-3.5">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ background: `${iconColor}15` }}>
                                                <IconComp size={19} style={{ color: iconColor }} strokeWidth={1.6} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-[14px] text-[var(--color-text-primary)] leading-tight truncate">{act.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {act.time && (
                                                        <span className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1">
                                                            <Clock size={11} />{act.time}
                                                        </span>
                                                    )}
                                                    {act.price > 0 ? (
                                                        <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">${act.price} MXN</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Incluido</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gold)] shrink-0 px-2 py-1 rounded-lg bg-[var(--color-gold)]/[0.08] border border-[var(--color-gold)]/[0.1]">
                                                {act.category}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-4">
                            <Search size={22} className="text-[var(--color-text-tertiary)]" />
                        </div>
                        <p className="text-base font-bold">Sin resultados</p>
                        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">No hay actividades de {activeCategory} en U. {activeUnit}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveCategory('todos')}>Ver todo</Button>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════
             *  BOOKING MODAL (Fullscreen Bottom Sheet)
             * ═══════════════════════════════════════ */}
            <AnimatePresence>
                {bookingStep && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                        onClick={closeBooking}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="w-full max-w-[430px] bg-[var(--color-bg)] rounded-t-[28px] max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle bar */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
                            </div>

                            {bookingStep === 'details' && (
                                <div className="p-5 pb-8">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>{selectedItem.name}</h2>
                                            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 flex items-center gap-1.5">
                                                <MapPin size={12} /> U. {selectedItem.unit} · {selectedItem.time}
                                            </p>
                                        </div>
                                        <button onClick={closeBooking} className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
                                            <X size={16} className="text-[var(--color-text-tertiary)]" />
                                        </button>
                                    </div>

                                    {/* Price badge */}
                                    <div className="flex items-center gap-2 mb-6">
                                        {selectedItem.price > 0 ? (
                                            <span className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold">${selectedItem.price} MXN</span>
                                        ) : (
                                            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">Incluido en membresía</span>
                                        )}
                                        <span className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">{selectedItem.category}</span>
                                    </div>

                                    {/* Date picker */}
                                    {selectedItem.type !== 'activity' && (
                                        <>
                                            <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase mb-2">Selecciona fecha</p>
                                            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-5">
                                                {next7Days.map((d) => (
                                                    <button
                                                        key={d.value}
                                                        onClick={() => setSelectedDate(d.value)}
                                                        className={`shrink-0 w-[60px] py-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${selectedDate === d.value
                                                            ? 'bg-[var(--color-gold)] text-[var(--color-bg)] border-[var(--color-gold)]'
                                                            : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                                                            }`}
                                                    >
                                                        <span className="text-[10px] font-medium uppercase">{d.day}</span>
                                                        <span className="text-lg font-bold leading-none">{d.num}</span>
                                                        <span className="text-[10px] font-medium uppercase">{d.month}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Time picker */}
                                            <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase mb-2">Selecciona horario</p>
                                            <div className="grid grid-cols-4 gap-2 mb-6">
                                                {timeSlots.map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setSelectedTime(t)}
                                                        className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${selectedTime === t
                                                            ? 'bg-[var(--color-gold)] text-[var(--color-bg)] border-[var(--color-gold)]'
                                                            : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                                                            }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {selectedItem.type === 'activity' && (
                                        <div className="mb-6 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                                            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                                                Al inscribirte a esta actividad tendrás acceso garantizado durante el mes en curso. Revisa los horarios disponibles.
                                            </p>
                                            {selectedItem.schedule_display && (
                                                <div className="text-xs font-semibold px-3 py-2 bg-[var(--color-bg)] rounded-lg">
                                                    ⏰ {selectedItem.schedule_display}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        size="lg"
                                        className="w-full"
                                        disabled={selectedItem.type !== 'activity' && (!selectedDate || !selectedTime)}
                                        onClick={() => setBookingStep('confirm')}
                                    >
                                        <CalendarDays size={18} />
                                        Continuar
                                    </Button>
                                </div>
                            )}

                            {bookingStep === 'confirm' && (
                                <div className="p-5 pb-8">
                                    <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                                        {selectedItem.type === 'activity' ? 'Confirmar Inscripción' : 'Confirmar Reserva'}
                                    </h2>

                                    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 space-y-3 mb-6">
                                        <div className="flex justify-between">
                                            <span className="text-xs text-[var(--color-text-tertiary)]">Actividad</span>
                                            <span className="text-sm font-semibold">{selectedItem.name}</span>
                                        </div>
                                        <div className="h-px bg-[var(--color-border)]" />
                                        <div className="flex justify-between">
                                            <span className="text-xs text-[var(--color-text-tertiary)]">Unidad</span>
                                            <span className="text-sm font-medium">{selectedItem.unit}</span>
                                        </div>
                                        <div className="h-px bg-[var(--color-border)]" />
                                        <div className="flex justify-between">
                                            <span className="text-xs text-[var(--color-text-tertiary)]">Fecha</span>
                                            <span className="text-sm font-medium">
                                                {selectedItem.type === 'activity' ? 'Mensualidad' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </span>
                                        </div>
                                        <div className="h-px bg-[var(--color-border)]" />
                                        <div className="flex justify-between">
                                            <span className="text-xs text-[var(--color-text-tertiary)]">Horario</span>
                                            <span className="text-sm font-medium">
                                                {selectedItem.type === 'activity' ? 'Múltiples Sesiones' : `${selectedTime} - ${String(parseInt(selectedTime) + 1).padStart(2, '0')}:00`}
                                            </span>
                                        </div>
                                        <div className="h-px bg-[var(--color-border)]" />
                                        <div className="flex justify-between">
                                            <span className="text-xs text-[var(--color-text-tertiary)]">Costo</span>
                                            <span className="text-sm font-bold">{selectedItem.price > 0 ? `$${selectedItem.price} MXN` : 'Incluido'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1" onClick={() => setBookingStep('details')}>
                                            Regresar
                                        </Button>
                                        <Button className="flex-1" onClick={handleBook} isLoading={isBooking}>
                                            Confirmar
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {bookingStep === 'success' && (
                                <div className="p-5 pb-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                                        <Check size={32} className="text-emerald-400" />
                                    </div>
                                    <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                                        {selectedItem.type === 'activity' ? '¡Inscripción Exitosa!' : '¡Reserva Confirmada!'}
                                    </h2>
                                    <p className="text-sm text-[var(--color-text-tertiary)] mt-2 max-w-[280px] mx-auto">
                                        {selectedItem.type === 'activity'
                                            ? <>Tu inscripción a <span className="text-[var(--color-text-primary)] font-semibold">{selectedItem.name}</span> ha sido registrada exitosamente.</>
                                            : <>Tu reserva para <span className="text-[var(--color-text-primary)] font-semibold">{selectedItem.name}</span> ha sido registrada exitosamente.</>
                                        }
                                    </p>
                                    <Button className="w-full mt-6" onClick={closeBooking}>
                                        Listo
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
