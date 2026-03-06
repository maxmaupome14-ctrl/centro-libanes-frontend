import { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import {
    MapPin, Clock, Search, Dumbbell, Sparkles, X, CalendarDays, Check,
    Waves, Scissors, Users, Music2, Shield, ChevronRight, Zap, Target, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';

const TIME_SLOTS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

const ALL_FILTERS = [
    { id: 'Canchas',   label: 'Canchas',        Icon: Target,     color: '#007A4A' },
    { id: 'Clases',    label: 'Clases',          Icon: Users,      color: '#C9A84C' },
    { id: 'Servicios', label: 'Spa & Servicios', Icon: Sparkles,   color: '#C9A84C' },
    { id: 'Todo',      label: 'Todas',           Icon: LayoutGrid, color: '#9CA3AF' },
] as const;

type FilterId = typeof ALL_FILTERS[number]['id'];

function getItemStyle(item: any): { color: string; Icon: any; typeLabel: string } {
    const cat = (item.category || '').toLowerCase();
    const type = item.type;

    if (type === 'resource') {
        if (cat.includes('padel')) return { color: '#007A4A', Icon: Target, typeLabel: 'Pádel' };
        if (cat.includes('tenis')) return { color: '#007A4A', Icon: Target, typeLabel: 'Tenis' };
        if (cat.includes('squash') || cat.includes('racquetball')) return { color: '#059669', Icon: Target, typeLabel: cat };
        if (cat.includes('natacion') || cat.includes('acuatica') || cat.includes('aqua')) return { color: '#06B6D4', Icon: Waves, typeLabel: 'Acuático' };
        return { color: '#007A4A', Icon: Dumbbell, typeLabel: 'Cancha' };
    }
    if (type === 'service') {
        if (cat.includes('barberia') || cat.includes('barber')) return { color: '#B8963E', Icon: Scissors, typeLabel: 'Barbería' };
        return { color: '#C9A84C', Icon: Sparkles, typeLabel: 'Spa' };
    }
    // activity
    if (cat.includes('danza') || cat.includes('baile')) return { color: '#8B5CF6', Icon: Music2, typeLabel: 'Danza' };
    if (cat.includes('artes_marciales') || cat.includes('artes marciales')) return { color: '#EF4444', Icon: Shield, typeLabel: 'Artes Marciales' };
    if (cat.includes('natacion') || cat.includes('acuatica')) return { color: '#06B6D4', Icon: Waves, typeLabel: 'Acuático' };
    if (cat.includes('yoga') || cat.includes('pilates') || cat.includes('bienestar')) return { color: '#EC4899', Icon: Sparkles, typeLabel: 'Bienestar' };
    if (cat.includes('fitness') || cat.includes('gimnasio')) return { color: '#F97316', Icon: Zap, typeLabel: 'Fitness' };
    return { color: '#007A4A', Icon: Users, typeLabel: 'Clase' };
}

const DAY_ABBR: Record<string, string> = {
    lunes: 'Lun', martes: 'Mar', miércoles: 'Mié', miercoles: 'Mié',
    jueves: 'Jue', viernes: 'Vie', sábado: 'Sáb', sabado: 'Sáb', domingo: 'Dom',
};

function formatSchedule(schedules: Array<{ day: string; start: string; end: string }>): string {
    if (!schedules.length) return '';
    const days = [...new Set(schedules.map(s => DAY_ABBR[s.day.toLowerCase()] || s.day))].join(' · ');
    const time = schedules[0].start + (schedules[0].end ? '–' + schedules[0].end : '');
    return `${days}  ${time}`;
}

type AgeGroup = 'todos' | 'niños' | 'adultos';

function getAgeGroup(item: any): AgeGroup {
    const label = (item.age_label || '').toLowerCase();
    if (label.includes('infantil') || label.includes('niño') || label.includes('junior') || label.includes('kids')) return 'niños';
    if (label.includes('adulto')) return 'adultos';
    // Fall back to numeric range
    const min = item.min_age ?? 0;
    const max = item.max_age ?? 99;
    if (max <= 17) return 'niños';
    if (min >= 18) return 'adultos';
    return 'todos';
}

export const CatalogView = () => {
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [activeUnit, setActiveUnit] = useState<'Hermes' | 'Fredy Atala'>('Hermes');
    const [activeFilter, setActiveFilter] = useState<FilterId>('Todo');
    const [ageGroup, setAgeGroup] = useState<AgeGroup>('todos');
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Booking state
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [bookingStep, setBookingStep] = useState<'details' | 'confirm' | 'success' | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isBooking, setIsBooking] = useState(false);

    const next7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return {
            value: d.toISOString().split('T')[0],
            day: d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''),
            num: d.getDate(),
            month: d.toLocaleDateString('es-MX', { month: 'short' }),
        };
    }), []);

    useEffect(() => {
        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const [catalogRes, enrollRes] = await Promise.all([
                    api.get(`/catalog?unit_name=${activeUnit}`),
                    api.get('/enrollments/my'),
                ]);
                setCatalogItems(catalogRes.data);
                setMyEnrollments(enrollRes.data);
            } catch {
                // silently fail — API errors shown via toast on actions
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, [activeUnit]);

    const handleBook = async () => {
        if (!user || !selectedItem) return;
        if (selectedItem.type !== 'activity' && (!selectedDate || !selectedTime)) return;
        setIsBooking(true);
        try {
            if (selectedItem.type === 'activity') {
                await api.post('/enrollments', { activity_id: selectedItem.id });
            } else {
                const endHour = String(parseInt(selectedTime.split(':')[0]) + 1).padStart(2, '0') + ':00';
                const payload: any = { date: selectedDate, start_time: selectedTime, end_time: endHour };
                if (selectedItem.type === 'service') payload.service_id = selectedItem.id;
                else if (selectedItem.type === 'resource') payload.resource_id = selectedItem.id;
                await api.post('/reservations/book', payload);
            }
            setBookingStep('success');
        } catch (err: any) {
            showToast(err.response?.data?.error || err.message);
        } finally {
            setIsBooking(false);
        }
    };

    const handleCancelEnrollment = async () => {
        const enrollment = myEnrollments.find(e => e.activity_id === selectedItem?.id);
        if (!enrollment) return;
        setIsBooking(true);
        try {
            await api.delete(`/enrollments/${enrollment.id}`);
            setMyEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
            closeBooking();
        } catch (err: any) {
            showToast(err.response?.data?.error || err.message);
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

    const filteredItems = useMemo(() => {
        return catalogItems
            .filter(item => {
                if (activeFilter === 'Todo') return true;
                if (activeFilter === 'Canchas') return item.type === 'resource';
                if (activeFilter === 'Servicios') return item.type === 'service';
                if (activeFilter === 'Clases') {
                    if (item.type !== 'activity') return false;
                    if (ageGroup === 'todos') return true;
                    return getAgeGroup(item) === ageGroup || getAgeGroup(item) === 'todos';
                }
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [catalogItems, activeFilter, ageGroup]);

    const counts = useMemo(() => ({
        Todo:      catalogItems.length,
        Canchas:   catalogItems.filter(i => i.type === 'resource').length,
        Clases:    catalogItems.filter(i => i.type === 'activity').length,
        Servicios: catalogItems.filter(i => i.type === 'service').length,
    }), [catalogItems]);

    // Only show filters that have items (always show Todo)
    const visibleFilters = useMemo(() =>
        ALL_FILTERS.filter(f => f.id === 'Todo' || counts[f.id as keyof typeof counts] > 0),
    [counts]);

    const enrolledIds = useMemo(() => new Set(myEnrollments.map(e => e.activity_id)), [myEnrollments]);

    const enrolledActivities = useMemo(() =>
        filteredItems.filter(item => item.type === 'activity' && enrolledIds.has(item.id)),
    [filteredItems, enrolledIds]);

    const availableActivities = useMemo(() =>
        filteredItems.filter(item => item.type === 'activity' && !enrolledIds.has(item.id)),
    [filteredItems, enrolledIds]);

    // Age groups present in activities (only shown when Clases is active)
    const visibleAgeGroups = useMemo((): AgeGroup[] => {
        const activities = catalogItems.filter(i => i.type === 'activity');
        const groups = new Set<AgeGroup>(activities.map(getAgeGroup));
        if (groups.size <= 1) return []; // no point showing filter with 1 group
        const order: AgeGroup[] = ['todos', 'niños', 'adultos'];
        return order.filter(g => g === 'todos' || groups.has(g));
    }, [catalogItems]);

    const renderCard = (item: any, idx: number, isEnrolled: boolean) => {
        const { color, Icon, typeLabel } = getItemStyle(item);
        const isIncluded = !item.price || item.price === 0;
        const enrollment = isEnrolled ? myEnrollments.find(e => e.activity_id === item.id) : null;
        const scheduleStr = enrollment?.schedules?.length ? formatSchedule(enrollment.schedules) : null;
        return (
            <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                onClick={() => openBooking(item)}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] active:scale-[0.99] transition-all text-left group cursor-pointer"
            >
                <div className="flex items-center">
                    <div className="w-1 self-stretch shrink-0 rounded-l-2xl" style={{ background: isEnrolled ? '#10B981' : color }} />
                    <div className="flex-1 flex items-center gap-3.5 px-4 py-4">
                        <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
                            style={{ background: isEnrolled ? '#10B98118' : `${color}18` }}>
                            <Icon size={19} style={{ color: isEnrolled ? '#10B981' : color }} strokeWidth={1.6} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-[14px] text-[var(--color-text-primary)] leading-tight truncate">
                                    {item.name}
                                </h3>
                                {isEnrolled ? (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
                                        Inscrito
                                    </span>
                                ) : (
                                    <ChevronRight size={15}
                                        className="text-[var(--color-text-tertiary)] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform"
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {activeFilter === 'Todo' && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                                        style={{ background: `${color}18`, color }}>
                                        {typeLabel}
                                    </span>
                                )}
                                {scheduleStr ? (
                                    <span className="text-[11px] text-emerald-400/80 flex items-center gap-1">
                                        <Clock size={10} />{scheduleStr}
                                    </span>
                                ) : (
                                    <>
                                        {item.time && (
                                            <span className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1">
                                                <Clock size={10} />{item.time}
                                            </span>
                                        )}
                                        {item.schedule_display && (
                                            <span className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1">
                                                <Clock size={10} />{item.schedule_display}
                                            </span>
                                        )}
                                    </>
                                )}
                                {isIncluded ? (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Incluido</span>
                                ) : (
                                    <span className="text-[11px] font-bold text-[var(--color-text-primary)]">${item.price} MXN</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.button>
        );
    };

    return (
        <div className="pb-36">

            {/* ── Header ── */}
            <div className="px-5 pt-6 pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    Reservar
                </h1>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    Canchas, clases y servicios en el club
                </p>
            </div>

            {/* ── Unit Toggle ── */}
            <div className="px-5 mb-5">
                <div className="relative flex p-1.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                    <motion.div
                        className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[var(--color-surface-active)] rounded-xl border border-[var(--color-border-strong)]"
                        initial={false}
                        animate={{ left: activeUnit === 'Hermes' ? '6px' : 'calc(50%)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                    {(['Hermes', 'Fredy Atala'] as const).map((unit) => (
                        <button
                            key={unit}
                            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-[15px] font-semibold transition-colors cursor-pointer min-h-[54px] ${activeUnit === unit
                                ? 'text-[var(--color-text-primary)]'
                                : 'text-[var(--color-text-tertiary)]'}`}
                            onClick={() => setActiveUnit(unit)}
                        >
                            <MapPin size={14} className={activeUnit === unit ? 'text-[var(--color-gold)]' : 'opacity-30'} />
                            {unit}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Category Blocks ── */}
            <div className="px-5 mb-5">
                <div className={`grid gap-3 ${visibleFilters.length <= 2 ? 'grid-cols-2' : visibleFilters.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {visibleFilters.map(f => {
                        const count = counts[f.id as keyof typeof counts];
                        const active = activeFilter === f.id;
                        const FIcon = f.Icon;
                        return (
                            <button
                                key={f.id}
                                onClick={() => { setActiveFilter(f.id); setAgeGroup('todos'); }}
                                className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border transition-all cursor-pointer ${active
                                    ? 'bg-[var(--color-gold)] text-[var(--color-bg)] border-[var(--color-gold)] shadow-[0_4px_18px_rgba(201,168,76,0.25)]'
                                    : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}
                            >
                                <FIcon
                                    size={22}
                                    strokeWidth={1.5}
                                    style={{ color: active ? 'var(--color-bg)' : f.color }}
                                />
                                <span className={`text-[12px] font-bold ${active ? 'text-[var(--color-bg)]' : 'text-[var(--color-text-secondary)]'}`}>
                                    {f.label}
                                </span>
                                {!isLoading && (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${active
                                        ? 'bg-black/15 text-[var(--color-bg)]'
                                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Age Group Sub-filter (Clases only) ── */}
            <AnimatePresence>
                {activeFilter === 'Clases' && visibleAgeGroups.length > 0 && (
                    <motion.div
                        key="age-filter"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 mb-4 overflow-hidden"
                    >
                        <div className="flex gap-2">
                            {visibleAgeGroups.map(g => {
                                const labels: Record<AgeGroup, string> = { todos: 'Todos', niños: 'Niños', adultos: 'Adultos' };
                                const active = ageGroup === g;
                                return (
                                    <button
                                        key={g}
                                        onClick={() => setAgeGroup(g)}
                                        className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all cursor-pointer ${active
                                            ? 'bg-[var(--color-gold)]/15 border-[var(--color-gold)]/50 text-[var(--color-gold)]'
                                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'}`}
                                    >
                                        {labels[g]}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Results ── */}
            <div className="px-5">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-4">
                            <Search size={22} className="text-[var(--color-text-tertiary)]" />
                        </div>
                        <p className="text-base font-bold text-[var(--color-text-primary)]">Sin resultados</p>
                        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                            No hay opciones disponibles en U. {activeUnit}
                        </p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveFilter('Todo')}>
                            Ver todo
                        </Button>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeUnit + activeFilter + ageGroup}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-3"
                        >
                            {activeFilter === 'Clases' ? (
                                <>
                                    {enrolledActivities.length > 0 && (
                                        <>
                                            <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase px-0.5">
                                                Mis Clases
                                            </p>
                                            {enrolledActivities.map((item, idx) => renderCard(item, idx, true))}
                                        </>
                                    )}
                                    {enrolledActivities.length > 0 && availableActivities.length > 0 && (
                                        <div className="h-px bg-[var(--color-border)]" />
                                    )}
                                    {availableActivities.length > 0 && (
                                        <>
                                            <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase px-0.5">
                                                {enrolledActivities.length > 0 ? 'Explorar' : 'Disponibles'}
                                            </p>
                                            {availableActivities.map((item, idx) => renderCard(item, idx, false))}
                                        </>
                                    )}
                                </>
                            ) : (
                                filteredItems.map((item, idx) => renderCard(item, idx, false))
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* ═══════════════════════════════════════
             *  BOOKING BOTTOM SHEET
             * ═══════════════════════════════════════ */}
            <AnimatePresence>
                {bookingStep && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end justify-center"
                        onClick={closeBooking}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            className="w-full max-w-[430px] bg-[var(--color-bg)] rounded-t-[28px] max-h-[88vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
                            </div>

                            {/* ── Step: Details ── */}
                            {bookingStep === 'details' && (
                                <div className="p-5 pb-8">
                                    {/* Item header */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-3.5">
                                            {(() => {
                                                const { color, Icon, typeLabel } = getItemStyle(selectedItem);
                                                return (
                                                    <>
                                                        <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center"
                                                            style={{ background: `${color}18` }}>
                                                            <Icon size={22} style={{ color }} strokeWidth={1.5} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                                                                style={{ color }}>
                                                                {typeLabel}
                                                            </p>
                                                            <h2 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight"
                                                                style={{ fontFamily: 'var(--font-display)' }}>
                                                                {selectedItem.name}
                                                            </h2>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <button onClick={closeBooking} aria-label="Cerrar"
                                            className="w-9 h-9 rounded-full bg-[var(--color-surface)] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
                                            <X size={16} className="text-[var(--color-text-tertiary)]" />
                                        </button>
                                    </div>

                                    {/* Meta badges */}
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] font-medium">
                                            <MapPin size={11} /> {selectedItem.unit}
                                        </span>
                                        {selectedItem.price > 0 ? (
                                            <span className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)]">
                                                ${selectedItem.price} MXN
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                                Incluido en membresía
                                            </span>
                                        )}
                                    </div>

                                    {/* Date/time for courts & services */}
                                    {selectedItem.type !== 'activity' && (
                                        <>
                                            <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase mb-3">
                                                Selecciona fecha
                                            </p>
                                            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-5">
                                                {next7Days.map((d) => (
                                                    <button
                                                        key={d.value}
                                                        onClick={() => setSelectedDate(d.value)}
                                                        className={`shrink-0 w-[58px] py-3 rounded-2xl flex flex-col items-center gap-0.5 border transition-all cursor-pointer ${selectedDate === d.value
                                                            ? 'bg-[var(--color-gold)] text-[var(--color-bg)] border-[var(--color-gold)] shadow-[0_4px_12px_rgba(201,168,76,0.3)]'
                                                            : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}
                                                    >
                                                        <span className="text-[9px] font-bold uppercase tracking-wide">{d.day}</span>
                                                        <span className="text-[18px] font-bold leading-tight">{d.num}</span>
                                                        <span className="text-[9px] font-medium uppercase">{d.month}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2px] uppercase mb-3">
                                                Selecciona horario
                                            </p>
                                            <div className="grid grid-cols-4 gap-2 mb-6">
                                                {TIME_SLOTS.map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setSelectedTime(t)}
                                                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${selectedTime === t
                                                            ? 'bg-[var(--color-gold)] text-[var(--color-bg)] border-[var(--color-gold)]'
                                                            : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Activity info */}
                                    {selectedItem.type === 'activity' && (
                                        enrolledIds.has(selectedItem.id) ? (
                                            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">
                                                    Ya estás inscrito
                                                </p>
                                                {(() => {
                                                    const enrollment = myEnrollments.find(e => e.activity_id === selectedItem.id);
                                                    const schedules = enrollment?.schedules || [];
                                                    return schedules.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {schedules.map((s: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 text-sm text-emerald-300 font-semibold">
                                                                    <Clock size={13} />
                                                                    <span>{DAY_ABBR[s.day.toLowerCase()] || s.day} · {s.start}–{s.end}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-emerald-300 font-medium">Múltiples sesiones incluidas</p>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="mb-6 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                                    Al inscribirte tendrás acceso durante el mes en curso en todos los horarios disponibles.
                                                </p>
                                                {selectedItem.schedule_display && (
                                                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                                                        <Clock size={13} className="text-[var(--color-gold)]" />
                                                        {selectedItem.schedule_display}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}

                                    {selectedItem.type === 'activity' && enrolledIds.has(selectedItem.id) ? (
                                        <div className="flex gap-3">
                                            <Button variant="outline" className="flex-1" onClick={closeBooking}>
                                                Cerrar
                                            </Button>
                                            <button
                                                onClick={handleCancelEnrollment}
                                                disabled={isBooking}
                                                className="flex-1 py-3 rounded-2xl text-sm font-semibold border border-[var(--color-red-lebanese)]/30 bg-[var(--color-red-lebanese)]/10 text-[var(--color-red-lebanese)] hover:bg-[var(--color-red-lebanese)]/20 transition-colors disabled:opacity-50 cursor-pointer"
                                            >
                                                {isBooking ? 'Cancelando...' : 'Cancelar inscripción'}
                                            </button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="lg"
                                            className="w-full"
                                            disabled={selectedItem.type !== 'activity' && (!selectedDate || !selectedTime)}
                                            onClick={() => setBookingStep('confirm')}
                                        >
                                            <CalendarDays size={18} />
                                            {selectedItem.type === 'activity' ? 'Inscribirse' : 'Continuar'}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* ── Step: Confirm ── */}
                            {bookingStep === 'confirm' && (
                                <div className="p-5 pb-8">
                                    <h2 className="text-lg font-bold mb-5 text-[var(--color-text-primary)]"
                                        style={{ fontFamily: 'var(--font-display)' }}>
                                        {selectedItem.type === 'activity' ? 'Confirmar Inscripción' : 'Confirmar Reserva'}
                                    </h2>

                                    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden mb-6">
                                        {[
                                            { label: selectedItem.type === 'activity' ? 'Actividad' : 'Servicio', value: selectedItem.name },
                                            { label: 'Unidad', value: selectedItem.unit },
                                            {
                                                label: 'Fecha',
                                                value: selectedItem.type === 'activity'
                                                    ? 'Inscripción mensual'
                                                    : new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
                                            },
                                            {
                                                label: 'Horario',
                                                value: selectedItem.type === 'activity'
                                                    ? 'Múltiples sesiones'
                                                    : `${selectedTime} – ${String(parseInt(selectedTime.split(':')[0]) + 1).padStart(2, '0')}:00`
                                            },
                                            {
                                                label: 'Costo',
                                                value: selectedItem.price > 0 ? `$${selectedItem.price} MXN` : 'Incluido en membresía',
                                                highlight: true
                                            },
                                        ].map((row, i, arr) => (
                                            <div key={row.label}
                                                className={`flex justify-between items-center px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
                                                <span className="text-xs text-[var(--color-text-tertiary)]">{row.label}</span>
                                                <span className={`text-sm font-semibold ${row.highlight ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-primary)]'} capitalize text-right max-w-[55%]`}>
                                                    {row.value}
                                                </span>
                                            </div>
                                        ))}
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

                            {/* ── Step: Success ── */}
                            {bookingStep === 'success' && (
                                <div className="p-5 pb-10 text-center">
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-5"
                                    >
                                        <Check size={36} className="text-emerald-400" strokeWidth={2.5} />
                                    </motion.div>
                                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]"
                                        style={{ fontFamily: 'var(--font-display)' }}>
                                        {selectedItem.type === 'activity' ? '¡Inscripción exitosa!' : '¡Reserva confirmada!'}
                                    </h2>
                                    <p className="text-sm text-[var(--color-text-tertiary)] mt-2 max-w-[260px] mx-auto leading-relaxed">
                                        {selectedItem.type === 'activity'
                                            ? <>Tu inscripción a <strong className="text-[var(--color-text-secondary)]">{selectedItem.name}</strong> fue registrada.</>
                                            : <>Tu reserva para <strong className="text-[var(--color-text-secondary)]">{selectedItem.name}</strong> fue confirmada.</>
                                        }
                                    </p>
                                    <Button className="w-full mt-7" onClick={closeBooking}>
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
