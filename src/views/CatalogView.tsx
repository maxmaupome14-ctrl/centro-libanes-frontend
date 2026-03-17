import { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import {
    MapPin, Clock, Search, Dumbbell, X, CalendarDays, Check,
    Waves, Scissors, Music2, ChevronRight, LayoutGrid,
    Star, User as UserIcon, Swords, Flower2, Flame, Leaf, Palette, Baby, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import { useFavorites } from '../hooks/useFavorites';
import { downloadICS } from '../lib/calendar';

const TIME_SLOTS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

// Smart category system — maps backend categories to user-facing filters
const CATEGORY_CONFIG: Record<string, { label: string; Icon: any; color: string; group: string }> = {
    // Resources (courts)
    _resource:             { label: 'Canchas',          Icon: Trophy,      color: '#007A4A', group: 'resource' },
    // Services (appointments)
    spa:                   { label: 'Spa',              Icon: Flower2,     color: '#EC4899', group: 'service' },
    barberia:              { label: 'Barbería',         Icon: Scissors,    color: '#B8963E', group: 'service' },
    // Activity categories (classes)
    deportes:              { label: 'Deportes',         Icon: Dumbbell,    color: '#059669', group: 'activity' },
    acuaticas:             { label: 'Acuáticas',        Icon: Waves,       color: '#06B6D4', group: 'activity' },
    fitness:               { label: 'Fitness',          Icon: Flame,       color: '#F97316', group: 'activity' },
    danza:                 { label: 'Danza',            Icon: Music2,      color: '#8B5CF6', group: 'activity' },
    artes_marciales:       { label: 'Artes Marciales',  Icon: Swords,      color: '#EF4444', group: 'activity' },
    bienestar:             { label: 'Bienestar',        Icon: Leaf,        color: '#14B8A6', group: 'activity' },
    cultural:              { label: 'Cultural',         Icon: Palette,     color: '#6366F1', group: 'activity' },
    infantil:              { label: 'Infantil',         Icon: Baby,        color: '#F59E0B', group: 'activity' },
    estimulacion_temprana: { label: 'Estimulación',     Icon: Baby,        color: '#F59E0B', group: 'activity' },
};

type FilterId = string;

function getItemStyle(item: any): { color: string; Icon: any; typeLabel: string } {
    const cat = (item.category || '').toLowerCase();
    const type = item.type;

    if (type === 'resource') {
        if (cat.includes('padel')) return { color: '#007A4A', Icon: Trophy, typeLabel: 'Pádel' };
        if (cat.includes('tenis')) return { color: '#007A4A', Icon: Trophy, typeLabel: 'Tenis' };
        if (cat.includes('squash') || cat.includes('racquetball')) return { color: '#059669', Icon: Trophy, typeLabel: cat };
        if (cat.includes('natacion') || cat.includes('acuatica') || cat.includes('aqua')) return { color: '#06B6D4', Icon: Waves, typeLabel: 'Acuático' };
        return { color: '#007A4A', Icon: Trophy, typeLabel: 'Cancha' };
    }
    if (type === 'service') {
        if (cat.includes('barberia') || cat.includes('barber')) return { color: '#B8963E', Icon: Scissors, typeLabel: 'Barbería' };
        return { color: '#EC4899', Icon: Flower2, typeLabel: 'Spa' };
    }
    // activity
    if (cat.includes('danza') || cat.includes('baile')) return { color: '#8B5CF6', Icon: Music2, typeLabel: 'Danza' };
    if (cat.includes('artes_marciales') || cat.includes('artes marciales')) return { color: '#EF4444', Icon: Swords, typeLabel: 'Artes Marciales' };
    if (cat.includes('natacion') || cat.includes('acuatica')) return { color: '#06B6D4', Icon: Waves, typeLabel: 'Acuático' };
    if (cat.includes('yoga') || cat.includes('pilates') || cat.includes('bienestar')) return { color: '#14B8A6', Icon: Leaf, typeLabel: 'Bienestar' };
    if (cat.includes('fitness') || cat.includes('gimnasio')) return { color: '#F97316', Icon: Flame, typeLabel: 'Fitness' };
    if (cat.includes('cultural')) return { color: '#6366F1', Icon: Palette, typeLabel: 'Cultural' };
    if (cat.includes('infantil') || cat.includes('estimulacion')) return { color: '#F59E0B', Icon: Baby, typeLabel: 'Infantil' };
    return { color: '#059669', Icon: Dumbbell, typeLabel: 'Clase' };
}

const DAY_ABBR: Record<string, string> = {
    lunes: 'Lun', martes: 'Mar', miércoles: 'Mié', miercoles: 'Mié',
    jueves: 'Jue', viernes: 'Vie', sábado: 'Sáb', sabado: 'Sáb', domingo: 'Dom',
    monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue',
    friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
};

function parseScheduleDisplay(raw: string): string[] {
    if (!raw) return [];
    const slots = raw.split(',').map(s => s.trim()).filter(Boolean);
    const groups: Record<string, string[]> = {};
    for (const slot of slots) {
        const parts = slot.split(' ');
        if (parts.length < 2) continue;
        const day = DAY_ABBR[parts[0].toLowerCase()] || parts[0];
        const time = parts[1].replace('-', '–');
        if (!groups[time]) groups[time] = [];
        if (!groups[time].includes(day)) groups[time].push(day);
    }
    return Object.entries(groups).map(([time, days]) => `${days.join(' · ')}  ${time}`);
}

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
    const [activeFilter, setActiveFilter] = useState<FilterId>('_all');
    const [ageGroup, setAgeGroup] = useState<AgeGroup>('todos');
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { toggleFavorite, isFavorite } = useFavorites();

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [bookingStep, setBookingStep] = useState<'details' | 'confirm' | 'success' | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [isBooking, setIsBooking] = useState(false);
    const [slotAvailability, setSlotAvailability] = useState<Record<string, { status: string; available: number; total: number }>>({});
    const [, setLoadingSlots] = useState(false);
    const [waitlistSlot, setWaitlistSlot] = useState<string | null>(null); // slot being waitlisted

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
                // silently fail
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, [activeUnit]);

    const handleBook = async () => {
        if (!user || !selectedItem) return;
        const times = selectedTimes.length > 0 ? selectedTimes : selectedTime ? [selectedTime] : [];
        if (selectedItem.type !== 'activity' && (!selectedDate || times.length === 0)) return;
        setIsBooking(true);
        try {
            if (selectedItem.type === 'activity') {
                await api.post('/enrollments', { activity_id: selectedItem.id });
            } else {
                const sortedTimes = [...times].sort();
                const startTime = sortedTimes[0];
                const lastHour = parseInt(sortedTimes[sortedTimes.length - 1].split(':')[0]);
                const endHour = String(lastHour + 1).padStart(2, '0') + ':00';
                const payload: any = { date: selectedDate, start_time: startTime, end_time: endHour };
                if (selectedItem.type === 'service') payload.service_id = selectedItem.id;
                else if (selectedItem.type === 'resource') payload.resource_id = selectedItem.id;
                if (selectedStaff) payload.staff_id = selectedStaff;
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

    const fetchSlotAvailability = (item: any, date: string) => {
        if (!item || item.type === 'activity') return;
        setLoadingSlots(true);
        const param = item.type === 'service' ? `service_id=${item.id}` : `resource_id=${item.id}`;
        api.get(`/reservations/slots?${param}&date=${date}`)
            .then(res => {
                const map: Record<string, { status: string; available: number; total: number }> = {};
                for (const s of res.data.slots || []) {
                    map[s.time] = { status: s.status, available: s.available, total: s.total };
                }
                setSlotAvailability(map);
            })
            .catch(() => setSlotAvailability({}))
            .finally(() => setLoadingSlots(false));
    };

    const openBooking = (item: any) => {
        setSelectedItem(item);
        setSelectedDate(next7Days[0].value);
        setSelectedTime('');
        setSelectedTimes([]);
        setSelectedStaff(null);
        setStaffList([]);
        setSlotAvailability({});
        setBookingStep('details');
        if (item.type === 'service' && item.id) {
            // Services: fetch only staff linked to this specific service
            api.get(`/staff?service_id=${encodeURIComponent(item.id)}`)
                .then(res => setStaffList(res.data || []))
                .catch(() => {});
        }
        // Resources (canchas): no staff picker — booking a court doesn't require an instructor
        // Fetch slot availability for default date
        if (item.type !== 'activity') {
            fetchSlotAvailability(item, next7Days[0].value);
        }
    };

    const closeBooking = () => {
        setSelectedItem(null);
        setBookingStep(null);
        setSelectedDate('');
        setSelectedTime('');
        setSelectedTimes([]);
        setSelectedStaff(null);
        setStaffList([]);
    };

    // Build dynamic filters from actual data
    const dynamicFilters = useMemo(() => {
        const catCounts: Record<string, number> = {};
        for (const item of catalogItems) {
            if (item.type === 'resource') {
                catCounts['_resource'] = (catCounts['_resource'] || 0) + 1;
            } else if (item.type === 'service') {
                const cat = (item.category || 'spa').toLowerCase();
                catCounts[cat] = (catCounts[cat] || 0) + 1;
            } else {
                const cat = (item.category || '').toLowerCase();
                catCounts[cat] = (catCounts[cat] || 0) + 1;
            }
        }
        // Build ordered filter list: resources first, then services, then activities
        const order = ['_resource', 'spa', 'barberia', 'deportes', 'acuaticas', 'fitness', 'danza', 'artes_marciales', 'bienestar', 'cultural', 'infantil', 'estimulacion_temprana'];
        const filters = order
            .filter(id => catCounts[id] > 0 && CATEGORY_CONFIG[id])
            .map(id => ({ id, ...CATEGORY_CONFIG[id], count: catCounts[id] }));
        return filters;
    }, [catalogItems]);

    const filteredItems = useMemo(() => {
        return catalogItems
            .filter(item => {
                if (activeFilter === '_all') return true;
                if (activeFilter === '_resource') return item.type === 'resource';
                // service categories
                if (item.type === 'service') return (item.category || '').toLowerCase() === activeFilter;
                // activity categories
                if (item.type === 'activity') {
                    const cat = (item.category || '').toLowerCase();
                    if (cat !== activeFilter) return false;
                    if (ageGroup === 'todos') return true;
                    return getAgeGroup(item) === ageGroup || getAgeGroup(item) === 'todos';
                }
                return false;
            })
            .sort((a, b) => {
                const aFav = isFavorite(a.id) ? 0 : 1;
                const bFav = isFavorite(b.id) ? 0 : 1;
                if (aFav !== bFav) return aFav - bFav;
                return a.name.localeCompare(b.name);
            });
    }, [catalogItems, activeFilter, ageGroup, isFavorite]);

    const enrolledIds = useMemo(() => new Set(myEnrollments.map(e => e.activity_id)), [myEnrollments]);

    const enrolledActivities = useMemo(() =>
        filteredItems.filter(item => item.type === 'activity' && enrolledIds.has(item.id)),
    [filteredItems, enrolledIds]);

    const availableActivities = useMemo(() =>
        filteredItems.filter(item => item.type === 'activity' && !enrolledIds.has(item.id)),
    [filteredItems, enrolledIds]);

    const isActivityFilter = useMemo(() => {
        const cfg = CATEGORY_CONFIG[activeFilter];
        return cfg?.group === 'activity' || activeFilter === '_all';
    }, [activeFilter]);

    const visibleAgeGroups = useMemo((): AgeGroup[] => {
        if (!isActivityFilter) return [];
        const activities = filteredItems.filter(i => i.type === 'activity');
        const groups = new Set<AgeGroup>(activities.map(getAgeGroup));
        if (groups.size <= 1) return [];
        const order: AgeGroup[] = ['todos', 'niños', 'adultos'];
        return order.filter(g => g === 'todos' || groups.has(g));
    }, [filteredItems, isActivityFilter]);

    const getAvailColor = (item: any) => {
        if (item.available_slots === 0) return '#EF4444';
        if (item.available_slots && item.available_slots <= 2) return '#F59E0B';
        return '#10B981';
    };

    const handleTimeToggle = (t: string) => {
        setSelectedTimes(prev => {
            if (prev.includes(t)) return prev.filter(x => x !== t);
            const next = [...prev, t].sort();
            const hours = next.map(x => parseInt(x.split(':')[0]));
            for (let i = 1; i < hours.length; i++) {
                if (hours[i] - hours[i - 1] !== 1) return prev;
            }
            return next;
        });
        setSelectedTime(t);
    };

    const handleJoinWaitlist = async (timeSlot: string) => {
        if (!selectedItem || !selectedDate) return;
        setWaitlistSlot(timeSlot);
        try {
            await api.post('/waitlist', {
                resource_type: selectedItem.type === 'resource' ? (selectedItem.resource_type || selectedItem.category) : undefined,
                service_id: selectedItem.type === 'service' ? selectedItem.id : undefined,
                date: selectedDate,
                time_slot: timeSlot,
            });
            showToast('Te anotaste en la lista de espera', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Error al unirte a la lista', 'error');
        } finally {
            setWaitlistSlot(null);
        }
    };

    const renderCard = (item: any, idx: number, isEnrolled: boolean) => {
        const { color, Icon, typeLabel } = getItemStyle(item);
        const isIncluded = !item.price || item.price === 0;
        const enrollment = isEnrolled ? myEnrollments.find(e => e.activity_id === item.id) : null;
        const scheduleStr = enrollment?.schedules?.length ? formatSchedule(enrollment.schedules) : null;
        const fav = isFavorite(item.id);
        const isResource = item.type === 'resource';
        const availColor = getAvailColor(item);
        return (
            <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                onClick={() => openBooking(item)}
                style={{
                    touchAction: 'manipulation', width: '100%', textAlign: 'left',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 16, overflow: 'hidden',
                    transition: 'all 200ms', cursor: 'pointer',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        width: 4, alignSelf: 'stretch', flexShrink: 0, borderRadius: '16px 0 0 16px',
                        background: isEnrolled ? '#10B981' : isResource ? availColor : color,
                    }} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isEnrolled ? '#10B98118' : `${color}18`,
                        }}>
                            <Icon size={19} style={{ color: isEnrolled ? '#10B981' : color }} strokeWidth={1.6} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                <h3 style={{
                                    fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)',
                                    lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {item.name}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                    {isResource && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                            style={{ padding: 4, cursor: 'pointer', background: 'none', border: 'none', touchAction: 'manipulation' }}
                                        >
                                            <Star size={14} style={{ color: fav ? 'var(--color-gold)' : 'var(--color-text-tertiary)', fill: fav ? 'var(--color-gold)' : 'none' }} />
                                        </button>
                                    )}
                                    {isEnrolled ? (
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8,
                                            padding: '2px 8px', borderRadius: 9999,
                                            background: 'rgba(16,185,129,0.15)', color: '#34D399',
                                        }}>
                                            Inscrito
                                        </span>
                                    ) : (
                                        <ChevronRight size={15} style={{ color: 'var(--color-text-tertiary)', marginTop: 2, transition: 'transform 200ms' }} />
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                                {activeFilter === 'Todo' && (
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8,
                                        padding: '2px 6px', borderRadius: 6, background: `${color}18`, color,
                                    }}>
                                        {typeLabel}
                                    </span>
                                )}
                                {isResource && (
                                    <span style={{ width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: availColor }} />
                                )}
                                {scheduleStr ? (
                                    <span style={{ fontSize: 11, color: 'rgba(52,211,153,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={10} />{scheduleStr}
                                    </span>
                                ) : (
                                    <>
                                        {item.time && (
                                            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={10} />{item.time}
                                            </span>
                                        )}
                                    </>
                                )}
                                {isIncluded ? (
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#34D399' }}>Incluido</span>
                                ) : (
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' }}>${item.price} MXN</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.button>
        );
    };

    return (
        <div style={{ paddingBottom: 100 }}>

            {/* ── Header + Sede selector ── */}
            <div style={{ padding: '24px 16px 20px' }}>
                <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                    Reservar
                </h1>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    Canchas, clases y servicios en el club
                </p>

                {/* Sede segmented control */}
                <div style={{ marginTop: 16 }}>
                    <div style={{
                        position: 'relative', display: 'flex', padding: 3, borderRadius: 12,
                        background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)',
                    }}>
                        <motion.div
                            style={{
                                position: 'absolute', top: 3, bottom: 3, width: 'calc(50% - 3px)', borderRadius: 9,
                                background: 'var(--color-green-cedar)',
                                boxShadow: '0 2px 8px rgba(0,90,54,0.3)',
                            }}
                            initial={false}
                            animate={{ left: activeUnit === 'Hermes' ? '3px' : 'calc(50%)' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                        {(['Hermes', 'Fredy Atala'] as const).map((unit) => (
                            <button
                                key={unit}
                                onClick={() => setActiveUnit(unit)}
                                style={{
                                    position: 'relative', zIndex: 10, flex: 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
                                    transition: 'color 200ms', cursor: 'pointer', outline: 'none', border: 'none',
                                    background: 'transparent',
                                    color: activeUnit === unit ? 'white' : 'var(--color-text-tertiary)',
                                }}
                            >
                                <MapPin size={13} strokeWidth={2} />
                                {unit}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Category Filters (horizontal scroll pills) ── */}
            <div style={{ padding: '0 0 20px' }}>
                <div className="scrollbar-none" style={{
                    display: 'flex', gap: 8, overflowX: 'auto',
                    paddingLeft: 16, paddingRight: 16, paddingBottom: 4,
                }}>
                    {/* "Todo" pill */}
                    <button
                        onClick={() => { setActiveFilter('_all'); setAgeGroup('todos'); }}
                        style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                            transition: 'all 200ms', border: 'none',
                            background: activeFilter === '_all' ? 'var(--color-gold)' : 'var(--color-surface)',
                            color: activeFilter === '_all' ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                            outline: activeFilter === '_all' ? 'none' : '1px solid var(--color-border)',
                            fontWeight: 600, fontSize: 13,
                        }}
                    >
                        <LayoutGrid size={14} />
                        Todo
                        {!isLoading && (
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 9999,
                                background: activeFilter === '_all' ? 'rgba(0,0,0,0.15)' : 'var(--color-surface-hover)',
                                color: activeFilter === '_all' ? 'var(--color-bg)' : 'var(--color-text-tertiary)',
                            }}>
                                {catalogItems.length}
                            </span>
                        )}
                    </button>

                    {/* Dynamic category pills */}
                    {dynamicFilters.map(f => {
                        const active = activeFilter === f.id;
                        const FIcon = f.Icon;
                        return (
                            <button
                                key={f.id}
                                onClick={() => { setActiveFilter(f.id); setAgeGroup('todos'); }}
                                style={{
                                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                                    transition: 'all 200ms', border: 'none',
                                    background: active ? f.color : 'var(--color-surface)',
                                    color: active ? 'white' : 'var(--color-text-secondary)',
                                    outline: active ? 'none' : '1px solid var(--color-border)',
                                    fontWeight: 600, fontSize: 13,
                                }}
                            >
                                <FIcon size={14} strokeWidth={1.8} />
                                {f.label}
                                {!isLoading && (
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 9999,
                                        background: active ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-hover)',
                                        color: active ? 'rgba(255,255,255,0.9)' : 'var(--color-text-tertiary)',
                                    }}>
                                        {f.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Age Group Sub-filter (Clases only) ── */}
            <AnimatePresence>
                {isActivityFilter && visibleAgeGroups.length > 0 && (
                    <motion.div
                        key="age-filter"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ padding: '0 16px', marginBottom: 16, overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', gap: 8 }}>
                            {visibleAgeGroups.map(g => {
                                const labels: Record<AgeGroup, string> = { todos: 'Todos', niños: 'Niños', adultos: 'Adultos' };
                                const active = ageGroup === g;
                                return (
                                    <button
                                        key={g}
                                        onClick={() => setAgeGroup(g)}
                                        style={{
                                            padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                                            cursor: 'pointer', transition: 'all 200ms', border: 'none',
                                            background: active ? 'rgba(201,168,76,0.15)' : 'var(--color-surface)',
                                            outline: active ? '1px solid rgba(201,168,76,0.5)' : '1px solid var(--color-border)',
                                            color: active ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                                        }}
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
            <div style={{ padding: '0 16px' }}>
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="animate-pulse" style={{
                                height: 80, borderRadius: 16,
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                            }} />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div style={{ padding: '64px 0', textAlign: 'center' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <Search size={22} style={{ color: 'var(--color-text-tertiary)' }} />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Sin resultados</p>
                        <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                            No hay opciones disponibles en U. {activeUnit}
                        </p>
                        <Button variant="outline" size="sm" style={{ marginTop: 16 }} onClick={() => setActiveFilter('Todo')}>
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
                            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                            {activeFilter === 'Clases' ? (
                                <>
                                    {enrolledActivities.length > 0 && (
                                        <>
                                            <p className="section-header" style={{ paddingLeft: 2 }}>
                                                Mis Clases
                                            </p>
                                            {enrolledActivities.map((item, idx) => renderCard(item, idx, true))}
                                        </>
                                    )}
                                    {enrolledActivities.length > 0 && availableActivities.length > 0 && (
                                        <div style={{ height: 1, background: 'var(--color-border)' }} />
                                    )}
                                    {availableActivities.length > 0 && (
                                        <>
                                            <p className="section-header" style={{ paddingLeft: 2 }}>
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

            {/* ═══ BOOKING BOTTOM SHEET ═══ */}
            <AnimatePresence>
                {bookingStep && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 200,
                            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                        }}
                        onClick={closeBooking}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            style={{
                                width: '100%', maxWidth: 430,
                                background: 'var(--color-bg)',
                                borderRadius: '28px 28px 0 0',
                                maxHeight: '88vh', overflowY: 'auto',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle */}
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-border-strong)' }} />
                            </div>

                            {/* ── Step: Details ── */}
                            {bookingStep === 'details' && (
                                <div style={{ padding: '20px 20px 32px' }}>
                                    {/* Item header */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            {(() => {
                                                const { color, Icon, typeLabel } = getItemStyle(selectedItem);
                                                return (
                                                    <>
                                                        <div style={{
                                                            width: 48, height: 48, borderRadius: 16, flexShrink: 0,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: `${color}18`,
                                                        }}>
                                                            <Icon size={22} style={{ color }} strokeWidth={1.5} />
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2, color }}>
                                                                {typeLabel}
                                                            </p>
                                                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                                                                {selectedItem.name}
                                                            </h2>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <button onClick={closeBooking} aria-label="Cerrar"
                                            style={{
                                                width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                                                background: 'var(--color-surface)', border: 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', transition: 'background 200ms',
                                            }}>
                                            <X size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                                        </button>
                                    </div>

                                    {/* Meta badges */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '6px 12px', borderRadius: 12,
                                            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                            fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500,
                                        }}>
                                            <MapPin size={11} /> {selectedItem.unit}
                                        </span>
                                        {selectedItem.price > 0 ? (
                                            <span style={{
                                                padding: '6px 12px', borderRadius: 12,
                                                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                                fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)',
                                            }}>
                                                ${selectedItem.price} MXN
                                            </span>
                                        ) : (
                                            <span style={{
                                                padding: '6px 12px', borderRadius: 12,
                                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                                                color: '#34D399', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8,
                                            }}>
                                                Incluido en membresía
                                            </span>
                                        )}
                                    </div>

                                    {/* Date/time for courts & services */}
                                    {selectedItem.type !== 'activity' && (
                                        <>
                                            <p className="section-header" style={{ marginBottom: 12 }}>
                                                Selecciona fecha
                                            </p>
                                            <div className="scrollbar-none" style={{
                                                display: 'flex', gap: 8, overflowX: 'auto',
                                                paddingBottom: 8, marginBottom: 20,
                                            }}>
                                                {next7Days.map((d) => {
                                                    const sel = selectedDate === d.value;
                                                    return (
                                                        <button
                                                            key={d.value}
                                                            onClick={() => { setSelectedDate(d.value); setSelectedTimes([]); setSelectedTime(''); fetchSlotAvailability(selectedItem, d.value); }}
                                                            style={{
                                                                flexShrink: 0, width: 58, padding: '12px 0',
                                                                borderRadius: 16, display: 'flex', flexDirection: 'column',
                                                                alignItems: 'center', gap: 2, cursor: 'pointer',
                                                                transition: 'all 200ms', border: 'none',
                                                                background: sel ? 'var(--color-gold)' : 'var(--color-surface)',
                                                                color: sel ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                                                                outline: sel ? 'none' : '1px solid var(--color-border)',
                                                                boxShadow: sel ? '0 4px 12px rgba(201,168,76,0.3)' : 'none',
                                                            }}
                                                        >
                                                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{d.day}</span>
                                                            <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{d.num}</span>
                                                            <span style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase' }}>{d.month}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <p className="section-header" style={{ marginBottom: 12 }}>
                                                Selecciona horario
                                            </p>
                                            <div className="scrollbar-none" style={{
                                                display: 'flex', gap: 8, overflowX: 'auto',
                                                scrollSnapType: 'x mandatory',
                                                paddingBottom: 8, marginBottom: 20,
                                                marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
                                            }}>
                                                {(Object.keys(slotAvailability).length > 0
                                                    ? Object.keys(slotAvailability).sort()
                                                    : TIME_SLOTS
                                                ).map((t) => {
                                                    const isSelected = selectedTimes.includes(t) || selectedTime === t;
                                                    const price = selectedItem?.price || 0;
                                                    const slot = slotAvailability[t];
                                                    const isFull = slot?.status === 'full';
                                                    const isLimited = slot?.status === 'limited';
                                                    const dotColor = isFull ? '#EF4444' : isLimited ? '#F59E0B' : '#10B981';

                                                    return (
                                                        <button
                                                            key={t}
                                                            onClick={() => isFull ? handleJoinWaitlist(t) : handleTimeToggle(t)}
                                                            disabled={waitlistSlot === t}
                                                            style={{
                                                                touchAction: 'manipulation', scrollSnapAlign: 'start',
                                                                flexShrink: 0, width: 72, padding: '12px 0',
                                                                borderRadius: 16, display: 'flex', flexDirection: 'column',
                                                                alignItems: 'center', gap: 4,
                                                                cursor: 'pointer',
                                                                transition: 'all 200ms', border: 'none',
                                                                opacity: waitlistSlot === t ? 0.5 : 1,
                                                                background: isSelected ? 'var(--color-gold)' : isFull ? 'rgba(239,68,68,0.06)' : 'var(--color-surface)',
                                                                color: isSelected ? 'var(--color-bg)' : isFull ? '#EF4444' : 'var(--color-text-secondary)',
                                                                outline: isSelected ? 'none' : `1px solid ${isFull ? 'rgba(239,68,68,0.2)' : 'var(--color-border)'}`,
                                                                boxShadow: isSelected ? '0 4px 12px rgba(201,168,76,0.3)' : 'none',
                                                            }}
                                                        >
                                                            <span style={{ fontSize: 14, fontWeight: 700 }}>{t}</span>
                                                            {slot && (
                                                                <span style={{
                                                                    display: 'flex', alignItems: 'center', gap: 3,
                                                                    fontSize: 9, fontWeight: 600,
                                                                    color: isSelected ? 'var(--color-bg)' : dotColor,
                                                                }}>
                                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'var(--color-bg)' : dotColor, opacity: isSelected ? 0.6 : 1 }} />
                                                                    {isFull ? 'Espera' : `${slot.available}/${slot.total}`}
                                                                </span>
                                                            )}
                                                            {!slot && price > 0 && (
                                                                <span style={{
                                                                    fontSize: 10, fontWeight: 600,
                                                                    opacity: isSelected ? 0.7 : 1,
                                                                    color: isSelected ? 'var(--color-bg)' : 'var(--color-text-tertiary)',
                                                                }}>
                                                                    ${price}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {selectedTimes.length > 1 && (
                                                <p style={{ fontSize: 11, color: 'var(--color-gold)', fontWeight: 600, marginBottom: 16 }}>
                                                    {selectedTimes.length} horas seleccionadas ({selectedTimes[0]} – {String(parseInt(selectedTimes[selectedTimes.length - 1].split(':')[0]) + 1).padStart(2, '0')}:00)
                                                </p>
                                            )}

                                            {/* Staff picker (resources + services) */}
                                            {selectedItem?.type === 'service' && staffList.length > 0 && (
                                                <>
                                                    <p className="section-header" style={{ marginBottom: 12 }}>
                                                        ¿Con quién?
                                                    </p>
                                                    <div className="scrollbar-none" style={{
                                                        display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory',
                                                        paddingBottom: 8, marginBottom: 20,
                                                        marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
                                                    }}>
                                                        <button
                                                            onClick={() => setSelectedStaff(null)}
                                                            style={{
                                                                touchAction: 'manipulation', flexShrink: 0,
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                                                width: 72, padding: '12px 0', borderRadius: 16, cursor: 'pointer',
                                                                transition: 'all 200ms', border: 'none',
                                                                background: !selectedStaff ? 'rgba(201,168,76,0.1)' : 'var(--color-surface)',
                                                                outline: !selectedStaff ? '1px solid rgba(201,168,76,0.4)' : '1px solid var(--color-border)',
                                                                color: !selectedStaff ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: 40, height: 40, borderRadius: 20,
                                                                background: 'var(--color-surface-hover)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                                <UserIcon size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                                                            </div>
                                                            <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1.3, textAlign: 'center' }}>Sin pref.</span>
                                                        </button>
                                                        {staffList.map((s: any) => {
                                                            const isSel = selectedStaff === s.id;
                                                            return (
                                                                <button
                                                                    key={s.id}
                                                                    onClick={() => setSelectedStaff(s.id)}
                                                                    style={{
                                                                        touchAction: 'manipulation', flexShrink: 0,
                                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                                                        width: 72, padding: '12px 0', borderRadius: 16, cursor: 'pointer',
                                                                        transition: 'all 200ms', border: 'none',
                                                                        background: isSel ? 'rgba(201,168,76,0.1)' : 'var(--color-surface)',
                                                                        outline: isSel ? '1px solid rgba(201,168,76,0.4)' : '1px solid var(--color-border)',
                                                                        color: isSel ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        width: 40, height: 40, borderRadius: 20,
                                                                        background: 'var(--color-surface-hover)',
                                                                        border: '1px solid var(--color-border-strong)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        fontSize: 11, fontWeight: 700,
                                                                    }}>
                                                                        {s.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                                    </div>
                                                                    <span style={{
                                                                        fontSize: 10, fontWeight: 600, lineHeight: 1.3,
                                                                        textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap', width: '100%', padding: '0 4px',
                                                                    }}>{s.name?.split(' ')[0]}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}

                                    {/* Activity info */}
                                    {selectedItem.type === 'activity' && (
                                        enrolledIds.has(selectedItem.id) ? (
                                            <div style={{
                                                marginBottom: 24, padding: 16, borderRadius: 16,
                                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                                            }}>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: '#34D399', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
                                                    Ya estás inscrito
                                                </p>
                                                {(() => {
                                                    const enrollment = myEnrollments.find(e => e.activity_id === selectedItem.id);
                                                    const schedules = enrollment?.schedules || [];
                                                    return schedules.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            {schedules.map((s: any, i: number) => (
                                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6EE7B7', fontWeight: 600 }}>
                                                                    <Clock size={13} />
                                                                    <span>{DAY_ABBR[s.day.toLowerCase()] || s.day} · {s.start}–{s.end}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ fontSize: 14, color: '#6EE7B7', fontWeight: 500 }}>Múltiples sesiones incluidas</p>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                                    Al inscribirte tendrás acceso durante el mes en curso en todos los horarios disponibles.
                                                </p>
                                                {selectedItem.schedule_display && (() => {
                                                    const lines = parseScheduleDisplay(selectedItem.schedule_display);
                                                    if (!lines.length) return null;
                                                    return (
                                                        <div style={{
                                                            borderRadius: 16, padding: 16,
                                                            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                                        }}>
                                                            <p className="section-header" style={{ marginBottom: 12 }}>Horarios</p>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                {lines.map((line, i) => (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                                                        <Clock size={12} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                                                                        {line}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )
                                    )}

                                    {selectedItem.type === 'activity' && enrolledIds.has(selectedItem.id) ? (
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <Button variant="outline" style={{ flex: 1 }} onClick={closeBooking}>
                                                Cerrar
                                            </Button>
                                            <button
                                                onClick={handleCancelEnrollment}
                                                disabled={isBooking}
                                                style={{
                                                    flex: 1, padding: '12px 0', borderRadius: 16, fontSize: 14, fontWeight: 600,
                                                    cursor: 'pointer', transition: 'all 200ms',
                                                    border: '1px solid rgba(220,38,38,0.3)',
                                                    background: 'rgba(220,38,38,0.1)',
                                                    color: 'var(--color-red-lebanese)',
                                                    opacity: isBooking ? 0.5 : 1,
                                                }}
                                            >
                                                {isBooking ? 'Cancelando...' : 'Cancelar inscripción'}
                                            </button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="lg"
                                            style={{ width: '100%' }}
                                            disabled={selectedItem.type !== 'activity' && (!selectedDate || (selectedTimes.length === 0 && !selectedTime))}
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
                                <div style={{ padding: '20px 20px 32px' }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--color-text-primary)' }}>
                                        {selectedItem.type === 'activity' ? 'Confirmar Inscripción' : 'Confirmar Reserva'}
                                    </h2>

                                    <div style={{
                                        background: 'var(--color-surface)', borderRadius: 16,
                                        border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: 24,
                                    }}>
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
                                                    : (() => {
                                                        const times = selectedTimes.length > 0 ? selectedTimes : [selectedTime];
                                                        const sorted = [...times].sort();
                                                        const endH = String(parseInt(sorted[sorted.length - 1].split(':')[0]) + 1).padStart(2, '0') + ':00';
                                                        return `${sorted[0]} – ${endH}` + (times.length > 1 ? ` (${times.length}h)` : '');
                                                    })()
                                            },
                                            ...(selectedStaff && staffList.length > 0 ? [{
                                                label: 'Instructor',
                                                value: staffList.find((s: any) => s.id === selectedStaff)?.name || 'Seleccionado'
                                            }] : []),
                                            {
                                                label: 'Costo',
                                                value: (() => {
                                                    const slots = selectedTimes.length > 0 ? selectedTimes.length : 1;
                                                    const total = (selectedItem.price || 0) * slots;
                                                    return total > 0 ? `$${total} MXN` : 'Incluido en membresía';
                                                })(),
                                                highlight: true
                                            },
                                        ].map((row, i, arr) => (
                                            <div key={row.label} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '14px 16px',
                                                borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                                            }}>
                                                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{row.label}</span>
                                                <span style={{
                                                    fontSize: 14, fontWeight: 600, textTransform: 'capitalize',
                                                    textAlign: 'right', maxWidth: '55%',
                                                    color: row.highlight ? 'var(--color-gold)' : 'var(--color-text-primary)',
                                                }}>
                                                    {row.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <Button variant="outline" style={{ flex: 1 }} onClick={() => setBookingStep('details')}>
                                            Regresar
                                        </Button>
                                        <Button style={{ flex: 1 }} onClick={handleBook} isLoading={isBooking}>
                                            Confirmar
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── Step: Success ── */}
                            {bookingStep === 'success' && (
                                <div style={{ padding: '20px 20px 40px', textAlign: 'center' }}>
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        style={{
                                            width: 80, height: 80, borderRadius: 40,
                                            background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 20px',
                                        }}
                                    >
                                        <Check size={36} style={{ color: '#34D399' }} strokeWidth={2.5} />
                                    </motion.div>
                                    <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        {selectedItem.type === 'activity' ? '¡Inscripción exitosa!' : '¡Reserva confirmada!'}
                                    </h2>
                                    <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', marginTop: 8, maxWidth: 260, margin: '8px auto 0', lineHeight: 1.5 }}>
                                        {selectedItem.type === 'activity'
                                            ? <>Tu inscripción a <strong style={{ color: 'var(--color-text-secondary)' }}>{selectedItem.name}</strong> fue registrada.</>
                                            : <>Tu reserva para <strong style={{ color: 'var(--color-text-secondary)' }}>{selectedItem.name}</strong> fue confirmada.</>
                                        }
                                    </p>
                                    {selectedItem.type !== 'activity' && selectedDate && (
                                        <button
                                            onClick={() => {
                                                const times = selectedTimes.length > 0 ? selectedTimes : selectedTime ? [selectedTime] : [];
                                                const sorted = [...times].sort();
                                                const lastH = parseInt(sorted[sorted.length - 1].split(':')[0]);
                                                const endH = String(lastH + 1).padStart(2, '0') + ':00';
                                                downloadICS({
                                                    title: selectedItem.name,
                                                    date: selectedDate,
                                                    startTime: sorted[0],
                                                    endTime: endH,
                                                    location: `Centro Libanés — ${selectedItem.unit || ''}`,
                                                    description: `Reserva en Centro Libanés`,
                                                });
                                            }}
                                            style={{
                                                width: '100%', marginTop: 20, padding: '12px 0',
                                                borderRadius: 12, border: '1px solid var(--color-border)',
                                                background: 'transparent', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 600,
                                                touchAction: 'manipulation',
                                            }}
                                        >
                                            <CalendarDays size={16} />
                                            Agregar al calendario
                                        </button>
                                    )}
                                    <Button style={{ width: '100%', marginTop: 12 }} onClick={closeBooking}>
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
