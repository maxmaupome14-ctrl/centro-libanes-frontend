import { useState, useEffect, type ElementType } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import {
    LayoutDashboard, Users, CalendarDays,
    Briefcase, Wallet, Settings, ShieldCheck, ChevronRight, ChevronDown,
    Activity, TrendingUp, AlertCircle,
    Lock, Megaphone, Plus, Trash2, Edit3, X, Check, Search, UserCheck,
    DollarSign, Clock, MapPin, Dumbbell, Scissors, BookOpen,
    FileText, Image, Star, ArrowUp, ArrowDown, Eye, EyeOff, Loader2, Link2, UserPlus, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';

const TABS = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'eventos', label: 'Eventos', icon: Megaphone },
    { id: 'staff', label: 'Personal', icon: Users },
    { id: 'agenda', label: 'Agenda Staff', icon: CalendarDays },
    { id: 'lockers', label: 'Control Lockers', icon: Lock },
    { id: 'finanzas', label: 'Finanzas', icon: Wallet },
    { id: 'comisiones', label: 'Comisiones', icon: DollarSign },
    { id: 'contenido', label: 'Contenido', icon: FileText },
    { id: 'recepcion', label: 'Recepción', icon: QrCode },
    { id: 'catalogo', label: 'Catálogo', icon: Briefcase },
    { id: 'config', label: 'Sistema', icon: Settings },
];

const EVENT_COLORS = [
    { label: 'Verde', value: '#007A4A' },
    { label: 'Azul', value: '#1a3a5c' },
    { label: 'Dorado', value: '#7A5A0A' },
    { label: 'Rojo', value: '#8B1A1A' },
    { label: 'Morado', value: '#4A1A7A' },
    { label: 'Café', value: '#6B4226' },
];

const BLANK_EVENT = { title: '', description: '', category: 'general', event_date: '', location: '', image_color: '#007A4A', is_published: true, is_featured: false };

// ── Events Tab ──────────────────────────────────────────────
const EventsTab = () => {
    const { showToast } = useToast();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState<any>(BLANK_EVENT);
    const [saving, setSaving] = useState(false);

    const fetchEvents = async () => {
        setLoading(true); setFetchError('');
        try {
            const res = await api.get('/events/all');
            setEvents(res.data);
        } catch (err: any) {
            setFetchError(err.response?.data?.error || err.message || 'Error al cargar eventos');
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchEvents(); }, []);

    const openCreate = () => { setForm(BLANK_EVENT); setEditing(null); setShowForm(true); };
    const openEdit = (ev: any) => {
        setForm({ title: ev.title, description: ev.description || '', category: ev.category, event_date: ev.event_date?.slice(0, 16) || '', location: ev.location || '', image_color: ev.image_color || '#007A4A', is_published: ev.is_published, is_featured: ev.is_featured });
        setEditing(ev); setShowForm(true);
    };
    const handleSave = async () => {
        if (!form.title || !form.event_date) { showToast('Título y fecha son requeridos'); return; }
        setSaving(true);
        try {
            editing ? await api.put(`/events/${editing.id}`, form) : await api.post('/events', form);
            setShowForm(false); fetchEvents();
        } catch (err: any) { showToast(err.response?.data?.error || err.message); }
        finally { setSaving(false); }
    };
    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este evento?')) return;
        try { await api.delete(`/events/${id}`); fetchEvents(); }
        catch (err: any) { showToast(err.response?.data?.error || err.message); }
    };
    const togglePublish = async (ev: any) => {
        try { await api.put(`/events/${ev.id}`, { is_published: !ev.is_published }); fetchEvents(); }
        catch { /* empty */ }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Gestión de Eventos</h2>
                    <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Crea y administra los eventos del club</p>
                </div>
                <Button onClick={openCreate} style={{ background: 'var(--color-gold)', color: 'var(--color-bg)', fontSize: 12, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation' }}>
                    <Plus size={16} /> Nuevo Evento
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        style={{ background: 'var(--color-surface)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{editing ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                            <button onClick={() => setShowForm(false)} aria-label="Cerrar" style={{ color: 'var(--color-text-tertiary)', cursor: 'pointer', touchAction: 'manipulation', background: 'none', border: 'none' }}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                            {[
                                { key: 'title', label: 'Título *', type: 'text', placeholder: '' },
                                { key: 'location', label: 'Ubicación', type: 'text', placeholder: 'Ej. Piscina Olímpica' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>{f.label}</label>
                                    <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                                        style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 14, color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            ))}
                            <div>
                                <label style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>Categoría</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 14, color: 'var(--color-text-primary)', outline: 'none', cursor: 'pointer', touchAction: 'manipulation', boxSizing: 'border-box' }}>
                                    {['general', 'torneo', 'social', 'curso', 'nutricion', 'infantil', 'deportivo'].map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>Fecha y Hora *</label>
                                <input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}
                                    style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 14, color: 'var(--color-text-primary)', outline: 'none', cursor: 'pointer', touchAction: 'manipulation', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>Descripción</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={2} style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 14, color: 'var(--color-text-primary)', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Color de Tarjeta</label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {EVENT_COLORS.map(c => (
                                        <button key={c.value} onClick={() => setForm({ ...form, image_color: c.value })}
                                            style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                border: form.image_color === c.value ? '2px solid white' : '2px solid transparent',
                                                transform: form.image_color === c.value ? 'scale(1.1)' : 'scale(1)',
                                                transition: 'all 200ms',
                                                background: c.value, cursor: 'pointer', touchAction: 'manipulation',
                                            }}
                                            title={c.label} />
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 16 }}>
                                {[{ key: 'is_published', label: 'Publicado' }, { key: 'is_featured', label: 'Destacado' }].map(cb => (
                                    <label key={cb.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', touchAction: 'manipulation' }}>
                                        <input type="checkbox" checked={form[cb.key]} onChange={e => setForm({ ...form, [cb.key]: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--color-gold)', cursor: 'pointer', touchAction: 'manipulation' }} />
                                        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{cb.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                            <Button variant="outline" onClick={() => setShowForm(false)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)', cursor: 'pointer', touchAction: 'manipulation' }}>Cancelar</Button>
                            <Button onClick={handleSave} isLoading={saving} style={{ background: 'var(--color-gold)', color: 'var(--color-bg)', cursor: 'pointer', touchAction: 'manipulation' }}>
                                <Check size={16} /> {editing ? 'Guardar Cambios' : 'Crear Evento'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>Cargando eventos...</div>
                ) : fetchError ? (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <AlertCircle size={22} style={{ color: '#EF4444' }} />
                        </div>
                        <p style={{ color: '#F87171', fontSize: 14 }}>{fetchError}</p>
                        <button onClick={fetchEvents} style={{ marginTop: 16, paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, fontSize: 12, color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', borderRadius: 8, background: 'transparent', cursor: 'pointer', touchAction: 'manipulation', transition: 'background 200ms' }}>Reintentar</button>
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(100,116,139,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <Megaphone size={22} style={{ color: 'var(--color-text-tertiary)' }} />
                        </div>
                        <p style={{ color: 'var(--color-text-tertiary)' }}>Sin eventos registrados</p>
                        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 12, marginTop: 4 }}>Crea el primer evento del club</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 14, borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>Evento</th>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>Fecha</th>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>Categoría</th>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>Estado</th>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((ev, idx) => (
                                <tr key={ev.id} style={{ borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined, transition: 'background 200ms' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.5)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 3, height: 40, borderRadius: 9999, flexShrink: 0, background: ev.image_color || '#007A4A' }} />
                                            <div>
                                                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{ev.title}</p>
                                                {ev.location && <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{ev.location}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                                        {new Date(ev.event_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}<br />
                                        {new Date(ev.event_date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })} hrs
                                    </td>
                                    <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>
                                        <span style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 4, background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>{ev.category}</span>
                                    </td>
                                    <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>
                                        <button onClick={() => togglePublish(ev)}
                                            style={{
                                                paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 4, cursor: 'pointer', touchAction: 'manipulation',
                                                background: ev.is_published ? 'rgba(52,211,153,0.1)' : '#1E293B',
                                                color: ev.is_published ? '#34D399' : '#64748B',
                                                border: ev.is_published ? '1px solid rgba(52,211,153,0.3)' : '1px solid #334155',
                                            }}>
                                            {ev.is_published ? 'Publicado' : 'Borrador'}
                                        </button>
                                    </td>
                                    <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                            <button onClick={() => openEdit(ev)} style={{ padding: 8, borderRadius: 8, color: 'var(--color-text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', transition: 'background 200ms' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}>
                                                <Edit3 size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(ev.id)} style={{ padding: 8, borderRadius: 8, color: 'var(--color-text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', transition: 'background 200ms' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#F87171'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ── Staff Service Assignment Row ────────────────────────────
const StaffServiceRow = ({ staffMember, onRefresh }: { staffMember: any; onRefresh: () => void }) => {
    const { showToast } = useToast();
    const [expanded, setExpanded] = useState(false);
    const [available, setAvailable] = useState<any[]>([]);
    const [assigned, setAssigned] = useState<string[]>([]);
    const [loadingSvc, setLoadingSvc] = useState(false);
    const [saving, setSaving] = useState(false);

    const currentAssigned = staffMember.services?.map((ss: any) => ss.service?.id).filter(Boolean) || [];

    const toggleExpand = async () => {
        if (expanded) { setExpanded(false); return; }
        setExpanded(true);
        setLoadingSvc(true);
        try {
            const res = await api.get(`/admin/staff/${staffMember.id}/services`);
            setAvailable(res.data.available);
            setAssigned(res.data.assigned);
        } catch { setAvailable([]); setAssigned([]); }
        finally { setLoadingSvc(false); }
    };

    const toggleService = (serviceId: string) => {
        setAssigned(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
    };

    const saveAssignments = async () => {
        setSaving(true);
        try {
            await api.put(`/admin/staff/${staffMember.id}/services`, { service_ids: assigned });
            showToast(`Servicios actualizados para ${staffMember.name}`);
            onRefresh();
        } catch (err: any) { showToast(err.response?.data?.error || 'Error al guardar'); }
        finally { setSaving(false); }
    };

    // Group available services by category
    const grouped = available.reduce((acc: Record<string, any[]>, svc: any) => {
        const cat = svc.category || 'otros';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(svc);
        return acc;
    }, {});

    const hasChanges = JSON.stringify([...assigned].sort()) !== JSON.stringify([...currentAssigned].sort());

    return (
        <>
            <tr style={{ borderTop: '1px solid rgba(30,41,59,0.5)', transition: 'background 200ms', cursor: 'pointer' }}
                onClick={toggleExpand}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {staffMember.name[0]}
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{staffMember.name}</p>
                            {currentAssigned.length > 0 && (
                                <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                    {currentAssigned.length} servicio{currentAssigned.length !== 1 ? 's' : ''} asignado{currentAssigned.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                    </div>
                </td>
                <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, color: 'var(--color-text-tertiary)', textTransform: 'capitalize', fontSize: 12 }}>{staffMember.role?.replace(/_/g, ' ')}</td>
                <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, color: 'var(--color-text-tertiary)', fontSize: 12 }}>{staffMember.unit?.short_name || '—'}</td>
                <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>
                    <span style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 4, background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>{staffMember.employment_type?.replace(/_/g, ' ')}</span>
                </td>
                <td style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 4,
                            background: staffMember.is_active ? 'rgba(52,211,153,0.1)' : '#1E293B',
                            color: staffMember.is_active ? '#34D399' : '#64748B',
                            border: staffMember.is_active ? '1px solid rgba(52,211,153,0.3)' : '1px solid #334155',
                        }}>
                            {staffMember.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        {expanded ? <ChevronDown size={14} style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />}
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                        <div style={{ background: 'rgba(15,23,42,0.6)', borderTop: '1px solid rgba(201,168,76,0.15)', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Link2 size={14} style={{ color: 'var(--color-gold)' }} />
                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Asignar Servicios</p>
                                </div>
                                {hasChanges && (
                                    <button onClick={(e) => { e.stopPropagation(); saveAssignments(); }} disabled={saving}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
                                            background: 'var(--color-gold)', color: '#020617', fontSize: 11, fontWeight: 700,
                                            borderRadius: 8, border: 'none', cursor: 'pointer', touchAction: 'manipulation',
                                            opacity: saving ? 0.7 : 1,
                                        }}>
                                        {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                                        Guardar
                                    </button>
                                )}
                            </div>
                            {loadingSvc ? (
                                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 12 }}>Cargando servicios...</div>
                            ) : available.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 12 }}>No hay servicios disponibles en esta unidad</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {Object.entries(grouped).map(([category, services]) => (
                                        <div key={category}>
                                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>{category}</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {(services as any[]).map((svc: any) => {
                                                    const isAssigned = assigned.includes(svc.id);
                                                    return (
                                                        <button key={svc.id} onClick={(e) => { e.stopPropagation(); toggleService(svc.id); }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                                                                borderRadius: 8, cursor: 'pointer', touchAction: 'manipulation',
                                                                fontSize: 12, fontWeight: 500, transition: 'all 200ms',
                                                                background: isAssigned ? 'rgba(201,168,76,0.15)' : '#1E293B',
                                                                color: isAssigned ? '#C9A84C' : '#94A3B8',
                                                                border: isAssigned ? '1px solid rgba(201,168,76,0.4)' : '1px solid #334155',
                                                            }}>
                                                            {isAssigned && <Check size={12} />}
                                                            {svc.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

// ── Staff Tab ──────────────────────────────────────────────
const StaffTab = () => {
    const [staff, setStaff] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const [staffRes, unitsRes] = await Promise.all([api.get('/admin/staff'), api.get('/admin/units')]);
            setStaff(staffRes.data); setUnits(unitsRes.data);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchStaff(); }, []);

    const filtered = staff.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.role.toLowerCase().includes(query.toLowerCase()));

    const totalAssignments = staff.reduce((sum, s) => sum + (s.services?.length || 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Personal del Club</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{staff.length} empleados · {units.length} unidades · {totalAssignments} asignaciones de servicio</p>
            </div>

            <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} size={16} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o puesto..."
                    style={{ width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 14, color: 'var(--color-text-secondary)', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>Cargando personal...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Sin resultados</div>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 14, borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>Empleado</th>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>Puesto</th>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>Unidad</th>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>Tipo</th>
                                <th style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <StaffServiceRow key={s.id} staffMember={s} onRefresh={fetchStaff} />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ── Finanzas Tab ──────────────────────────────────────────────
const FinanzasTab = () => {
    const [data, setData] = useState<any>(null);
    const [commissions, setCommissions] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingComm, setLoadingComm] = useState(true);
    const [showComm, setShowComm] = useState(false);

    useEffect(() => {
        api.get('/admin/finance/summary')
            .then(res => setData(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
        api.get('/admin/commissions')
            .then(res => setCommissions(res.data))
            .catch(() => {})
            .finally(() => setLoadingComm(false));
    }, []);

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando datos financieros...</div>;
    if (!data) return <div style={{ padding: 48, textAlign: 'center', color: '#F87171' }}>Error al cargar finanzas</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Finanzas</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Resumen financiero del club</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <MetricCard title="Ingresos del Mes" value={`$${Number(data.month_revenue).toLocaleString('es-MX')}`} icon={DollarSign} trend={`${data.month_transactions} txns`} />
                <MetricCard title="Pendiente de Cobro" value={`$${Number(data.pending_amount).toLocaleString('es-MX')}`} icon={AlertCircle} trend={`${data.pending_count} pagos`} color="red" />
                <MetricCard title="Mant. Pendiente" value={`$${Number(data.pending_maintenance).toLocaleString('es-MX')}`} icon={Wallet} trend={`${data.pending_maintenance_count} cuotas`} color={Number(data.pending_maintenance) > 0 ? 'red' : undefined} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>Ingresos Totales</h3>
                    <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-gold)', letterSpacing: -1 }}>${Number(data.total_revenue).toLocaleString('es-MX')}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{data.total_transactions} transacciones completadas</p>
                </div>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>Lockers Activos</h3>
                    <p style={{ fontSize: 32, fontWeight: 700, color: '#10B981', letterSpacing: -1 }}>{data.active_locker_count}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Ingreso: ${Number(data.active_locker_revenue).toLocaleString('es-MX')}</p>
                </div>
            </div>

            {/* Commission Tracking */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <button onClick={() => setShowComm(!showComm)}
                    style={{
                        width: '100%', padding: '16px 24px', borderBottom: showComm ? '1px solid #1E293B' : 'none',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation',
                    }}>
                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', textAlign: 'left' }}>Comisiones Independientes</h3>
                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2, textAlign: 'left' }}>
                            {commissions ? `${commissions.staff?.length || 0} proveedores · Corte del club: $${commissions.totals?.club_cut?.toLocaleString('es-MX') || '0'}` : 'Cargando...'}
                        </p>
                    </div>
                    {showComm ? <ChevronDown size={16} style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />}
                </button>
                {showComm && (
                    <div>
                        {loadingComm ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 12 }}>Cargando comisiones...</div>
                        ) : !commissions?.staff?.length ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 12 }}>No hay proveedores independientes</div>
                        ) : (
                            <>
                                {/* Summary row */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                                    {[
                                        { label: 'Ingresos Brutos', value: `$${commissions.totals.gross.toLocaleString('es-MX')}`, color: 'var(--color-text-primary)' },
                                        { label: 'Corte del Club', value: `$${commissions.totals.club_cut.toLocaleString('es-MX')}`, color: 'var(--color-gold)' },
                                        { label: 'Período', value: commissions.period, color: 'var(--color-text-tertiary)' },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: 'var(--color-surface-hover)', padding: '12px 16px', textAlign: 'center' }}>
                                            <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</p>
                                            <p style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                                {/* Staff breakdown */}
                                <table style={{ width: '100%', textAlign: 'left', fontSize: 12, borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        <tr>
                                            <th style={{ padding: '10px 16px' }}>Proveedor</th>
                                            <th style={{ padding: '10px 16px' }}>Servicios</th>
                                            <th style={{ padding: '10px 16px' }}>Bruto</th>
                                            <th style={{ padding: '10px 16px' }}>Club</th>
                                            <th style={{ padding: '10px 16px' }}>Pago Staff</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {commissions.staff.map((s: any, idx: number) => (
                                            <tr key={s.id} style={{ borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined }}>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.name}</p>
                                                    <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>{s.role?.replace(/_/g, ' ')} · {s.unit}</p>
                                                </td>
                                                <td style={{ padding: '10px 16px', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>{s.month_services}</td>
                                                <td style={{ padding: '10px 16px', color: 'var(--color-text-primary)', fontWeight: 600 }}>${s.month_gross.toLocaleString('es-MX')}</td>
                                                <td style={{ padding: '10px 16px', color: 'var(--color-gold)', fontWeight: 700 }}>${s.month_club_cut.toLocaleString('es-MX')}</td>
                                                <td style={{ padding: '10px 16px', color: 'var(--color-text-tertiary)' }}>${s.month_staff_payout.toLocaleString('es-MX')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Recent payments table */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Últimos Pagos</h3>
                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{data.recent_payments.length} registros</span>
                </div>
                {data.recent_payments.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Sin pagos registrados</div>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <tr>
                                <th style={{ padding: '12px 24px' }}>Socio</th>
                                <th style={{ padding: '12px 24px' }}>Tipo</th>
                                <th style={{ padding: '12px 24px' }}>Monto</th>
                                <th style={{ padding: '12px 24px' }}>Estado</th>
                                <th style={{ padding: '12px 24px' }}>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recent_payments.slice(0, 10).map((p: any, idx: number) => (
                                <tr key={p.id} style={{ borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined }}>
                                    <td style={{ padding: '12px 24px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                                        {p.profile ? `${p.profile.first_name} ${p.profile.last_name}` : `#${p.membership?.member_number || '—'}`}
                                    </td>
                                    <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>{p.type?.replace(/_/g, ' ')}</td>
                                    <td style={{ padding: '12px 24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>${Number(p.amount).toLocaleString('es-MX')}</td>
                                    <td style={{ padding: '12px 24px' }}>
                                        <span style={{
                                            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                            background: p.status === 'pagado' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: p.status === 'pagado' ? '#34D399' : '#F87171',
                                            border: `1px solid ${p.status === 'pagado' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                        }}>{p.status}</span>
                                    </td>
                                    <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                                        {new Date(p.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ── Lockers Tab ──────────────────────────────────────────────
const LockersTab = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'occupied' | 'available'>('all');

    useEffect(() => {
        api.get('/admin/lockers/overview')
            .then(res => setData(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando lockers...</div>;
    if (!data) return <div style={{ padding: 48, textAlign: 'center', color: '#F87171' }}>Error al cargar lockers</div>;

    const filtered = data.lockers.filter((l: any) => {
        if (filter === 'occupied') return l.rentals.length > 0;
        if (filter === 'available') return l.rentals.length === 0;
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Control de Lockers</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{data.total} lockers · {data.occupancy_rate}% ocupación</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <MetricCard title="Total Lockers" value={data.total} icon={Lock} trend="Instalados" />
                <MetricCard title="Ocupados" value={data.occupied} icon={UserCheck} trend={`${data.occupancy_rate}%`} />
                <MetricCard title="Disponibles" value={data.available} icon={Check} trend="Libres" />
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: 8 }}>
                {([['all', 'Todos'], ['occupied', 'Ocupados'], ['available', 'Disponibles']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setFilter(key)}
                        style={{
                            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: filter === key ? 'rgba(201,168,76,0.1)' : 'transparent',
                            color: filter === key ? 'var(--color-gold)' : '#94A3B8',
                            border: filter === key ? '1px solid rgba(201,168,76,0.3)' : '1px solid #334155',
                        }}>{label}</button>
                ))}
            </div>

            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Sin lockers en esta categoría</div>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <tr>
                                <th style={{ padding: '12px 24px' }}>Locker</th>
                                <th style={{ padding: '12px 24px' }}>Unidad</th>
                                <th style={{ padding: '12px 24px' }}>Zona</th>
                                <th style={{ padding: '12px 24px' }}>Tamaño</th>
                                <th style={{ padding: '12px 24px' }}>Estado</th>
                                <th style={{ padding: '12px 24px' }}>Rentado por</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((l: any, idx: number) => {
                                const rental = l.rentals[0];
                                return (
                                    <tr key={l.id} style={{ borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined }}>
                                        <td style={{ padding: '12px 24px', fontWeight: 700, color: 'var(--color-text-primary)' }}>#{l.number}</td>
                                        <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)' }}>{l.unit?.short_name}</td>
                                        <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>{l.zone}</td>
                                        <td style={{ padding: '12px 24px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)' }}>{l.size}</span>
                                        </td>
                                        <td style={{ padding: '12px 24px' }}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: 4, display: 'inline-block', marginRight: 8,
                                                background: rental ? '#C9A84C' : '#10B981',
                                            }} />
                                            <span style={{ color: rental ? '#C9A84C' : '#10B981', fontSize: 12, fontWeight: 600 }}>
                                                {rental ? 'Ocupado' : 'Libre'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)' }}>
                                            {rental ? `${rental.profile?.first_name} ${rental.profile?.last_name} (#${rental.membership?.member_number})` : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ── Agenda Tab ──────────────────────────────────────────────
const AgendaTab = () => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/reservations/today')
            .then(res => setReservations(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
        confirmada: { label: 'Confirmada', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
        pendiente: { label: 'Pendiente', color: '#C9A84C', bg: 'rgba(201,168,76,0.1)' },
        pendiente_aprobacion: { label: 'Por aprobar', color: '#C9A84C', bg: 'rgba(201,168,76,0.1)' },
        en_curso: { label: 'En curso', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
        completada: { label: 'Completada', color: 'var(--color-text-tertiary)', bg: 'rgba(100,116,139,0.1)' },
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Agenda del Día</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4, textTransform: 'capitalize' }}>{today} · {reservations.length} reservas</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <MetricCard title="Reservas Hoy" value={reservations.length} icon={CalendarDays} trend="Total" />
                <MetricCard title="Confirmadas" value={reservations.filter(r => r.status === 'confirmada').length} icon={Check} trend="Listas" />
                <MetricCard title="Pendientes" value={reservations.filter(r => r.status === 'pendiente' || r.status === 'pendiente_aprobacion').length} icon={Clock} trend="Por confirmar" />
            </div>

            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando agenda...</div>
                ) : reservations.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                        <CalendarDays size={32} style={{ color: '#334155', margin: '0 auto 12px' }} />
                        <p style={{ color: 'var(--color-text-tertiary)' }}>Sin reservas para hoy</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <tr>
                                <th style={{ padding: '12px 24px' }}>Hora</th>
                                <th style={{ padding: '12px 24px' }}>Socio</th>
                                <th style={{ padding: '12px 24px' }}>Servicio</th>
                                <th style={{ padding: '12px 24px' }}>Staff</th>
                                <th style={{ padding: '12px 24px' }}>Unidad</th>
                                <th style={{ padding: '12px 24px' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map((r: any, idx: number) => {
                                const st = statusConfig[r.status] || statusConfig.pendiente;
                                const startTime = r.start_time ? new Date(r.start_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—';
                                const endTime = r.end_time ? new Date(r.end_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
                                return (
                                    <tr key={r.id} style={{ borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined }}>
                                        <td style={{ padding: '12px 24px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                                            {startTime}{endTime ? `–${endTime}` : ''}
                                        </td>
                                        <td style={{ padding: '12px 24px', color: 'var(--color-text-primary)' }}>
                                            {r.profile?.first_name} {r.profile?.last_name}
                                        </td>
                                        <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)' }}>{r.service?.name || '—'}</td>
                                        <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)' }}>{r.staff?.name || '—'}</td>
                                        <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)' }}>{r.unit?.short_name || '—'}</td>
                                        <td style={{ padding: '12px 24px' }}>
                                            <span style={{
                                                padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                                background: st.bg, color: st.color, border: `1px solid ${st.color}30`,
                                            }}>{st.label}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ── Recepción Tab ──────────────────────────────────────────────
const RecepcionTab = () => {
    const { showToast } = useToast();
    const [passes, setPasses] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, checked_in: 0 });
    const [loading, setLoading] = useState(true);
    const [qrInput, setQrInput] = useState('');
    const [qrResult, setQrResult] = useState<any>(null);
    const [validating, setValidating] = useState(false);

    const fetchPasses = async () => {
        try {
            const res = await api.get('/admin/guests/today');
            setPasses(res.data.passes);
            setStats(res.data.stats);
        } catch { /* empty */ }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchPasses(); }, []);

    const handleCheckin = async (id: string) => {
        try {
            await api.post(`/guests/${id}/checkin`);
            showToast('Invitado registrado');
            fetchPasses();
        } catch (err: any) { showToast(err.response?.data?.error || 'Error'); }
    };

    const handleQrValidate = async () => {
        if (!qrInput.trim()) return;
        setValidating(true);
        try {
            const res = await api.post('/admin/qr/validate', { code: qrInput.trim() });
            setQrResult(res.data);
        } catch (err: any) {
            setQrResult({ valid: false, message: err.response?.data?.error || 'Código inválido' });
        }
        finally { setValidating(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Recepción</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Control de acceso y pases de invitado</p>
            </div>

            {/* QR / Member Code Validator */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <QrCode size={16} style={{ color: 'var(--color-gold)' }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Validar Acceso</h3>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input value={qrInput} onChange={e => setQrInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleQrValidate()}
                        placeholder="Escanea QR o ingresa código (CL-0001)..."
                        style={{ flex: 1, paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 14, color: 'var(--color-text-secondary)', outline: 'none' }} />
                    <button onClick={handleQrValidate} disabled={validating}
                        style={{ paddingLeft: 16, paddingRight: 16, background: 'var(--color-gold)', color: '#020617', fontWeight: 700, fontSize: 12, borderRadius: 10, border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}>
                        Validar
                    </button>
                </div>
                {qrResult && (
                    <div style={{
                        marginTop: 12, padding: 16, borderRadius: 12,
                        background: qrResult.valid ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${qrResult.valid ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 5, background: qrResult.valid ? '#34D399' : '#F87171' }} />
                            <p style={{ fontSize: 14, fontWeight: 700, color: qrResult.valid ? '#34D399' : '#F87171' }}>
                                {qrResult.valid ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
                            </p>
                        </div>
                        {qrResult.titular && <p style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>{qrResult.titular}</p>}
                        {qrResult.member_number && <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Socio #{qrResult.member_number} · {qrResult.tier}</p>}
                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{qrResult.message}</p>
                    </div>
                )}
            </div>

            {/* Today's Guest Passes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <MetricCard title="Invitados Hoy" value={String(stats.total)} icon={UserPlus} trend="Total" />
                <MetricCard title="Por Llegar" value={String(stats.pending)} icon={Clock} trend="Activos" />
                <MetricCard title="Ingresaron" value={String(stats.checked_in)} icon={Check} trend="Check-in" />
            </div>

            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Pases de Invitado — Hoy</h3>
                </div>
                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando...</div>
                ) : passes.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>No hay invitados esperados hoy</div>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <tr>
                                <th style={{ padding: '12px 20px' }}>Invitado</th>
                                <th style={{ padding: '12px 20px' }}>Código</th>
                                <th style={{ padding: '12px 20px' }}>Invita</th>
                                <th style={{ padding: '12px 20px' }}>Estado</th>
                                <th style={{ padding: '12px 20px' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {passes.map((p: any, idx: number) => (
                                <tr key={p.id} style={{ borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined }}>
                                    <td style={{ padding: '12px 20px' }}>
                                        <p style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.guest_name}</p>
                                        {p.guest_phone && <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{p.guest_phone}</p>}
                                    </td>
                                    <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-gold)', fontSize: 13, letterSpacing: 1 }}>{p.pass_code}</td>
                                    <td style={{ padding: '12px 20px', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                                        {p.invited_by ? `${p.invited_by.first_name} ${p.invited_by.last_name}` : '—'}
                                        {p.invited_by?.membership && <span style={{ color: 'var(--color-text-tertiary)' }}> #{p.invited_by.membership.member_number}</span>}
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <span style={{
                                            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                            background: p.status === 'used' ? 'rgba(52,211,153,0.1)' : 'rgba(201,168,76,0.1)',
                                            color: p.status === 'used' ? '#34D399' : '#C9A84C',
                                            border: `1px solid ${p.status === 'used' ? 'rgba(52,211,153,0.3)' : 'rgba(201,168,76,0.3)'}`,
                                        }}>{p.status === 'used' ? 'Ingresó' : 'Esperando'}</span>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        {p.status === 'active' ? (
                                            <button onClick={() => handleCheckin(p.id)}
                                                style={{
                                                    paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
                                                    background: 'rgba(52,211,153,0.1)', color: '#34D399', fontWeight: 700, fontSize: 10,
                                                    borderRadius: 6, border: '1px solid rgba(52,211,153,0.3)',
                                                    cursor: 'pointer', touchAction: 'manipulation', textTransform: 'uppercase',
                                                }}>Check-in</button>
                                        ) : (
                                            <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                                {p.checked_in_at ? new Date(p.checked_in_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ── Catálogo Tab ──────────────────────────────────────────────
const CatalogoTab = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'services' | 'resources' | 'activities'>('activities');

    useEffect(() => {
        api.get('/admin/catalog/stats')
            .then(res => setData(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando catálogo...</div>;
    if (!data) return <div style={{ padding: 48, textAlign: 'center', color: '#F87171' }}>Error al cargar catálogo</div>;

    const items = view === 'services' ? data.services : view === 'resources' ? data.resources : data.activities;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Catálogo del Club</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Servicios, canchas y actividades</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <MetricCard title="Servicios" value={data.total_services} icon={Scissors} trend="Spa/Barbería" />
                <MetricCard title="Canchas" value={data.total_resources} icon={Dumbbell} trend="Recursos" />
                <MetricCard title="Actividades" value={data.total_activities} icon={BookOpen} trend="Clases" />
                <MetricCard title="Inscritos" value={data.total_enrollments} icon={Users} trend="Activos" />
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', gap: 8 }}>
                {([['activities', 'Actividades'], ['services', 'Servicios'], ['resources', 'Canchas']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setView(key)}
                        style={{
                            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: view === key ? 'rgba(201,168,76,0.1)' : 'transparent',
                            color: view === key ? 'var(--color-gold)' : '#94A3B8',
                            border: view === key ? '1px solid rgba(201,168,76,0.3)' : '1px solid #334155',
                        }}>{label}</button>
                ))}
            </div>

            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                {items.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Sin items en esta categoría</div>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 13, borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-tertiary)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <tr>
                                <th style={{ padding: '12px 24px' }}>Nombre</th>
                                <th style={{ padding: '12px 24px' }}>Categoría</th>
                                <th style={{ padding: '12px 24px' }}>Unidad</th>
                                <th style={{ padding: '12px 24px' }}>Precio</th>
                                {view === 'activities' && <th style={{ padding: '12px 24px' }}>Inscritos</th>}
                                <th style={{ padding: '12px 24px' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item: any, idx: number) => (
                                <tr key={item.id} style={{ borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined }}>
                                    <td style={{ padding: '12px 24px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.name}</td>
                                    <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>{item.category || item.resource_type || '—'}</td>
                                    <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)' }}>{item.unit?.short_name || '—'}</td>
                                    <td style={{ padding: '12px 24px', fontWeight: 600, color: Number(item.price) > 0 ? 'white' : '#34D399' }}>
                                        {Number(item.price) > 0 ? `$${Number(item.price).toLocaleString('es-MX')}` : 'Incluido'}
                                    </td>
                                    {view === 'activities' && (
                                        <td style={{ padding: '12px 24px', color: 'var(--color-text-tertiary)' }}>
                                            {item._count?.enrollments ?? 0}{item.max_capacity ? `/${item.max_capacity}` : ''}
                                        </td>
                                    )}
                                    <td style={{ padding: '12px 24px' }}>
                                        <span style={{
                                            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                            background: item.is_active !== false ? 'rgba(52,211,153,0.1)' : 'rgba(100,116,139,0.1)',
                                            color: item.is_active !== false ? '#34D399' : '#64748B',
                                        }}>{item.is_active !== false ? 'Activo' : 'Inactivo'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// ── Contenido (CMS) Tab ──────────────────────────────────────────────
const ICON_OPTIONS = ['dumbbell', 'sparkles', 'waves', 'music', 'heart', 'trophy', 'calendar', 'star', 'zap', 'scissors', 'map-pin', 'user-plus'];

const ContenidoTab = () => {
    const { showToast } = useToast();
    const [section, setSection] = useState<'featured' | 'explore' | 'banners'>('featured');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any | null>(null);
    const [creating, setCreating] = useState(false);

    const endpoints: Record<string, string> = { featured: '/cms/featured/all', explore: '/cms/explore/all', banners: '/cms/banners/all' };
    const createEndpoints: Record<string, string> = { featured: '/cms/featured', explore: '/cms/explore', banners: '/cms/banners' };

    const load = () => {
        setLoading(true);
        api.get(endpoints[section]).then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, [section]);

    const handleSave = async (data: any, id?: string) => {
        try {
            if (id) {
                await api.patch(`${createEndpoints[section]}/${id}`, data);
                showToast('Actualizado', 'success');
            } else {
                await api.post(createEndpoints[section], data);
                showToast('Creado', 'success');
            }
            setEditing(null);
            setCreating(false);
            load();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Error', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`${createEndpoints[section]}/${id}`);
            showToast('Eliminado', 'success');
            load();
        } catch { showToast('Error al eliminar', 'error'); }
    };

    const handleToggle = async (id: string, active: boolean) => {
        await api.patch(`${createEndpoints[section]}/${id}`, { is_active: !active });
        load();
    };

    const handleReorder = async (id: string, dir: 'up' | 'down') => {
        const idx = items.findIndex(i => i.id === id);
        if ((dir === 'up' && idx <= 0) || (dir === 'down' && idx >= items.length - 1)) return;
        const swap = items[dir === 'up' ? idx - 1 : idx + 1];
        await Promise.all([
            api.patch(`${createEndpoints[section]}/${id}`, { display_order: swap.display_order }),
            api.patch(`${createEndpoints[section]}/${swap.id}`, { display_order: items[idx].display_order }),
        ]);
        load();
    };

    const sections = [
        { id: 'featured' as const, label: 'Destacados', icon: Star },
        { id: 'explore' as const, label: 'Explorar', icon: Dumbbell },
        { id: 'banners' as const, label: 'Banners', icon: Image },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Gestión de Contenido</h2>
                    <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Administra destacados, explorar y banners del home</p>
                </div>
                <button onClick={() => { setCreating(true); setEditing(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'var(--color-gold)', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', touchAction: 'manipulation', border: 'none' }}>
                    <Plus size={16} /> Nuevo
                </button>
            </div>

            {/* Section switcher */}
            <div style={{ display: 'flex', gap: 8 }}>
                {sections.map(s => (
                    <button key={s.id} onClick={() => { setSection(s.id); setCreating(false); setEditing(null); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            background: section === s.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                            color: section === s.id ? 'var(--color-gold)' : '#64748B',
                            border: `1px solid ${section === s.id ? 'rgba(201,168,76,0.2)' : '#1E293B'}`,
                            cursor: 'pointer', touchAction: 'manipulation',
                        }}>
                        <s.icon size={14} /> {s.label}
                    </button>
                ))}
            </div>

            {/* Create/Edit form */}
            {(creating || editing) && (
                <ContentForm section={section} item={editing} onSave={handleSave} onCancel={() => { setCreating(false); setEditing(null); }} />
            )}

            {/* Items list */}
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}><div className="animate-spin" style={{ width: 24, height: 24, borderRadius: 12, border: '2px solid var(--color-gold)', borderTopColor: 'transparent', margin: '0 auto' }} /></div>
            ) : items.length === 0 ? (
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>No hay contenido en esta sección</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((item, idx) => (
                        <div key={item.id} style={{
                            background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', padding: '14px 18px',
                            display: 'flex', alignItems: 'center', gap: 14, opacity: item.is_active ? 1 : 0.5,
                        }}>
                            {/* Preview swatch */}
                            {section === 'featured' && (
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                    background: `linear-gradient(135deg, ${item.gradient_start}, ${item.gradient_end})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700 }}>{idx + 1}</span>
                                </div>
                            )}
                            {section === 'explore' && (
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                    background: item.background_color || 'rgba(0,122,74,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <span style={{ fontSize: 18 }}>●</span>
                                </div>
                            )}
                            {section === 'banners' && (
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                    background: item.background_color || '#007A4A',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Image size={18} style={{ color: 'rgba(255,255,255,0.8)' }} />
                                </div>
                            )}

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>{item.title || item.name}</p>
                                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                    {item.subtitle || item.link || item.cta_text || '—'}
                                    {' · '}icon: {item.icon || '—'}
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button onClick={() => handleReorder(item.id, 'up')} disabled={idx === 0}
                                    style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--color-border)', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}>
                                    <ArrowUp size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                                </button>
                                <button onClick={() => handleReorder(item.id, 'down')} disabled={idx === items.length - 1}
                                    style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--color-border)', cursor: idx === items.length - 1 ? 'default' : 'pointer', opacity: idx === items.length - 1 ? 0.3 : 1 }}>
                                    <ArrowDown size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                                </button>
                                <button onClick={() => handleToggle(item.id, item.is_active)}
                                    style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                                    {item.is_active ? <Eye size={12} style={{ color: '#10B981' }} /> : <EyeOff size={12} style={{ color: '#EF4444' }} />}
                                </button>
                                <button onClick={() => { setEditing(item); setCreating(false); }}
                                    style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                                    <Edit3 size={12} style={{ color: '#C9A84C' }} />
                                </button>
                                <button onClick={() => handleDelete(item.id)}
                                    style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
                                    <Trash2 size={12} style={{ color: '#EF4444' }} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Generic content form for all CMS sections
const ContentForm = ({ section, item, onSave, onCancel }: { section: string; item: any; onSave: (data: any, id?: string) => void; onCancel: () => void }) => {
    const [form, setForm] = useState<any>(item || {});
    const set = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
        outline: 'none',
    };

    return (
        <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid rgba(201,168,76,0.15)', padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>
                {item ? 'Editar' : 'Nuevo'} {section === 'featured' ? 'Destacado' : section === 'explore' ? 'Item Explorar' : 'Banner'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {section === 'featured' && <>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Título *</label><input style={inputStyle} value={form.title || ''} onChange={e => set('title', e.target.value)} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Subtítulo</label><input style={inputStyle} value={form.subtitle || ''} onChange={e => set('subtitle', e.target.value)} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Color Inicio</label><input type="color" value={form.gradient_start || '#005A36'} onChange={e => set('gradient_start', e.target.value)} style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--color-border)', cursor: 'pointer' }} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Color Fin</label><input type="color" value={form.gradient_end || '#007A4A'} onChange={e => set('gradient_end', e.target.value)} style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--color-border)', cursor: 'pointer' }} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Icono</label><select style={inputStyle} value={form.icon || 'dumbbell'} onChange={e => set('icon', e.target.value)}>{ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Link</label><input style={inputStyle} value={form.link || '/reservations'} onChange={e => set('link', e.target.value)} /></div>
                </>}
                {section === 'explore' && <>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Nombre *</label><input style={inputStyle} value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Icono</label><select style={inputStyle} value={form.icon || 'dumbbell'} onChange={e => set('icon', e.target.value)}>{ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Color</label><input type="color" value={form.color || '#007A4A'} onChange={e => set('color', e.target.value)} style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--color-border)', cursor: 'pointer' }} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Link</label><input style={inputStyle} value={form.link || '/reservations'} onChange={e => set('link', e.target.value)} /></div>
                </>}
                {section === 'banners' && <>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Título *</label><input style={inputStyle} value={form.title || ''} onChange={e => set('title', e.target.value)} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Subtítulo</label><input style={inputStyle} value={form.subtitle || ''} onChange={e => set('subtitle', e.target.value)} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Color Fondo</label><input type="color" value={form.background_color || '#007A4A'} onChange={e => set('background_color', e.target.value)} style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--color-border)', cursor: 'pointer' }} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>CTA Texto</label><input style={inputStyle} value={form.cta_text || ''} onChange={e => set('cta_text', e.target.value)} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>CTA Link</label><input style={inputStyle} value={form.cta_link || ''} onChange={e => set('cta_link', e.target.value)} /></div>
                    <div><label style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'block', marginBottom: 4 }}>Ubicación</label><select style={inputStyle} value={form.placement || 'home_top'} onChange={e => set('placement', e.target.value)}><option value="home_top">Home Superior</option><option value="home_middle">Home Medio</option><option value="home_bottom">Home Inferior</option></select></div>
                </>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 8, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={() => onSave(form, item?.id)} style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--color-gold)', border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{item ? 'Guardar' : 'Crear'}</button>
            </div>
        </div>
    );
};

// ── Sistema Tab ──────────────────────────────────────────────
const SistemaTab = () => {
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/units')
            .then(res => setUnits(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Sistema</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Configuración y unidades del club</p>
            </div>

            {/* Units */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={16} style={{ color: 'var(--color-gold)' }} /> Unidades / Sedes
                    </h3>
                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{units.length} unidades</span>
                </div>
                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>Cargando...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {units.map((u, idx) => (
                            <div key={u.id} style={{
                                padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16,
                                borderTop: idx > 0 ? '1px solid rgba(30,41,59,0.5)' : undefined,
                            }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <MapPin size={17} style={{ color: 'var(--color-gold)' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>{u.name}</p>
                                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                        Código: {u.code} · {u.short_name}
                                    </p>
                                </div>
                                {u.operating_hours && (
                                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} /> {u.operating_hours}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* System info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Información del Sistema</h3>
                    {[
                        { label: 'Versión', value: 'v2.0.0' },
                        { label: 'Plataforma', value: 'React 19 + Vite' },
                        { label: 'Backend', value: 'Node.js + Prisma' },
                        { label: 'Base de datos', value: 'PostgreSQL (Supabase)' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(30,41,59,0.3)' }}>
                            <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>{item.label}</span>
                            <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>{item.value}</span>
                        </div>
                    ))}
                </div>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Módulos Activos</h3>
                    {[
                        { name: 'Reservaciones', active: true },
                        { name: 'Torneos', active: true },
                        { name: 'Pases de Invitado', active: true },
                        { name: 'Lista de Espera', active: true },
                        { name: 'Calificaciones', active: true },
                        { name: 'Pagos Stripe', active: false },
                        { name: 'CMS (Strapi)', active: false },
                    ].map(mod => (
                        <div key={mod.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(30,41,59,0.3)' }}>
                            <span style={{ fontSize: 13, color: mod.active ? '#E2E8F0' : '#475569' }}>{mod.name}</span>
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
                                background: mod.active ? 'rgba(52,211,153,0.1)' : 'rgba(100,116,139,0.08)',
                                color: mod.active ? '#34D399' : '#475569',
                                border: `1px solid ${mod.active ? 'rgba(52,211,153,0.2)' : 'rgba(100,116,139,0.15)'}`,
                            }}>{mod.active ? 'Activo' : 'Pendiente'}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Dashboard Tab ──────────────────────────────────────────────
const DashboardTab = () => {
    const [stats, setStats] = useState({ staff: 0, events: 0, units: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.get('/admin/staff'), api.get('/events/all'), api.get('/admin/units')])
            .then(([staffRes, eventsRes, unitsRes]) => {
                setStats({ staff: staffRes.data.length, events: eventsRes.data.length, units: unitsRes.data.length });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Panel Principal</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Resumen operativo del club</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <MetricCard title="Personal Activo" value={loading ? '—' : stats.staff} icon={UserCheck} trend="Empleados" />
                <MetricCard title="Eventos Creados" value={loading ? '—' : stats.events} icon={Megaphone} trend="En sistema" />
                <MetricCard title="Unidades" value={loading ? '—' : stats.units} icon={Activity} trend="Sedes" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <TrendingUp size={16} style={{ color: 'var(--color-gold)' }} />
                        Accesos Rápidos
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        {[
                            { label: 'Gestionar Eventos', desc: 'Crear, editar y publicar eventos', tab: 'eventos', icon: Megaphone },
                            { label: 'Ver Personal', desc: 'Empleados por unidad', tab: 'staff', icon: Users },
                            { label: 'Finanzas', desc: 'Ingresos, pagos y facturación', tab: 'finanzas', icon: Wallet },
                            { label: 'Control Lockers', desc: 'Ocupación y rentas activas', tab: 'lockers', icon: Lock },
                        ].map(item => (
                            <button key={item.tab}
                                onClick={() => document.dispatchEvent(new CustomEvent('admin-tab', { detail: item.tab }))}
                                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid var(--color-border)', textAlign: 'left', cursor: 'pointer', touchAction: 'manipulation', transition: 'border-color 200ms' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = '#475569')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1E293B')}
                            >
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <item.icon size={17} style={{ color: 'var(--color-gold)' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.label}</p>
                                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{item.desc}</p>
                                </div>
                                <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Activity size={16} style={{ color: 'var(--color-gold)' }} />
                        Estado de Módulos
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        {[
                            { name: 'Finanzas', built: true, tab: 'finanzas' },
                            { name: 'Control Lockers', built: true, tab: 'lockers' },
                            { name: 'Agenda Staff', built: true, tab: 'agenda' },
                            { name: 'Catálogo', built: true, tab: 'catalogo' },
                            { name: 'Sistema', built: true, tab: 'config' },
                            { name: 'Stripe Recurrente', built: false },
                            { name: 'CMS (Strapi)', built: false },
                        ].map(m => (
                            <button key={m.name}
                                onClick={() => m.tab && document.dispatchEvent(new CustomEvent('admin-tab', { detail: m.tab }))}
                                disabled={!m.tab}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                                    background: m.built ? 'rgba(16,185,129,0.04)' : 'rgba(15,23,42,0.4)',
                                    border: `1px solid ${m.built ? 'rgba(16,185,129,0.12)' : 'rgba(30,41,59,0.5)'}`,
                                    cursor: m.tab ? 'pointer' : 'default', touchAction: 'manipulation', textAlign: 'left',
                                    transition: 'border-color 200ms',
                                }}
                            >
                                <div style={{ width: 6, height: 6, borderRadius: 3, background: m.built ? '#10B981' : '#334155', flexShrink: 0 }} />
                                <p style={{ fontSize: 13, color: m.built ? '#E2E8F0' : '#475569', flex: 1 }}>{m.name}</p>
                                <span style={{
                                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.8,
                                    color: m.built ? '#10B981' : '#334155',
                                    background: m.built ? 'rgba(16,185,129,0.08)' : '#0F172A',
                                    border: `1px solid ${m.built ? 'rgba(16,185,129,0.15)' : '#1E293B'}`,
                                }}>{m.built ? 'Activo' : 'Próximo'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Comisiones Tab ──────────────────────────────────────────────
const ComisionesTab = () => {
    const { showToast } = useToast();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

    const fetchCommissions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/commissions');
            setData(res.data);
        } catch { setData(null); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCommissions(); }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await api.post('/admin/commissions/generate');
            showToast(res.data.message || 'Liquidaciones generadas');
            fetchCommissions();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Error al generar liquidaciones');
        } finally { setGenerating(false); }
    };

    if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>Cargando comisiones...</div>;
    if (!data) return <div style={{ padding: 48, textAlign: 'center', color: '#F87171', fontSize: 14 }}>Error al cargar comisiones</div>;

    const statusColor = (status: string) => {
        if (status === 'pagado') return { bg: 'rgba(52,211,153,0.1)', color: '#34D399', border: 'rgba(52,211,153,0.3)' };
        return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Comisiones</h2>
                    <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Gestión de comisiones y liquidaciones del personal independiente</p>
                </div>
                <button onClick={handleGenerate} disabled={generating}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 600,
                        background: generating ? '#1E293B' : 'var(--color-gold)', color: generating ? '#64748B' : '#0F1419',
                        cursor: generating ? 'not-allowed' : 'pointer', touchAction: 'manipulation', transition: 'all 200ms',
                    }}>
                    {generating ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                    {generating ? 'Generando...' : 'Generar Liquidaciones'}
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={18} style={{ color: 'var(--color-gold)' }} />
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>Total Bruto del Mes</p>
                    </div>
                    <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: -1 }}>${data.totals.gross.toLocaleString('es-MX')}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 6 }}>Período: {data.period}</p>
                </div>
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={18} style={{ color: 'var(--color-gold)' }} />
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>Comisión del Club</p>
                    </div>
                    <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-gold)', letterSpacing: -1 }}>${data.totals.club_cut.toLocaleString('es-MX')}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 6 }}>{data.staff?.length || 0} proveedores activos</p>
                </div>
            </div>

            {/* Staff List */}
            {!data.staff?.length ? (
                <div style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', padding: 48, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(100,116,139,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <Users size={22} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                    <p style={{ color: 'var(--color-text-tertiary)' }}>Sin proveedores independientes</p>
                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: 12, marginTop: 4 }}>Registra personal con tipo "independiente" para ver comisiones</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.staff.map((s: any) => {
                        const isExpanded = expandedStaff === s.id;
                        const rateLabel = s.fixed_rent > 0
                            ? `Renta fija: $${s.fixed_rent.toLocaleString('es-MX')}`
                            : `Comisión: ${Math.round(s.commission_rate * 100)}%`;

                        return (
                            <div key={s.id} style={{ background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                                {/* Staff Row */}
                                <button onClick={() => setExpandedStaff(isExpanded ? null : s.id)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px 20px', background: 'transparent', border: 'none',
                                        cursor: 'pointer', touchAction: 'manipulation',
                                        borderBottom: isExpanded ? '1px solid #1E293B' : 'none',
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                            {s.name?.charAt(0) || '?'}
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>{s.name}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                                                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>{s.role?.replace(/_/g, ' ')}</span>
                                                {s.unit && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>·</span>}
                                                {s.unit && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{s.unit}</span>}
                                                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>·</span>
                                                <span style={{ fontSize: 11, color: 'var(--color-gold)' }}>{rateLabel}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{s.month_services} servicios</p>
                                            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>${s.month_gross.toLocaleString('es-MX')}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Club</p>
                                            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gold)' }}>${s.month_club_cut.toLocaleString('es-MX')}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Pago Staff</p>
                                            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-tertiary)' }}>${s.month_staff_payout.toLocaleString('es-MX')}</p>
                                        </div>
                                        {isExpanded ? <ChevronDown size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
                                    </div>
                                </button>

                                {/* Settlement History (expanded) */}
                                {isExpanded && (
                                    <div style={{ padding: '16px 20px', background: 'var(--color-surface-hover)' }}>
                                        <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 12 }}>Historial de Liquidaciones</p>
                                        {!s.settlements?.length ? (
                                            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Sin liquidaciones registradas</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {s.settlements.slice(0, 3).map((st: any) => {
                                                    const sc = statusColor(st.status);
                                                    return (
                                                        <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                <Clock size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                                                                <div>
                                                                    <p style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                                                                        {new Date(st.period_start).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} — {new Date(st.period_end).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    </p>
                                                                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{st.total_services} servicios · Bruto: ${st.gross_revenue.toLocaleString('es-MX')}</p>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Pago</p>
                                                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>${st.staff_payout.toLocaleString('es-MX')}</p>
                                                                </div>
                                                                <span style={{
                                                                    padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                    background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                                                                }}>{st.status}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Main Admin View ──────────────────────────────────────────────
export const AdminView = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        const handler = (e: Event) => setActiveTab((e as CustomEvent).detail);
        document.addEventListener('admin-tab', handler);
        return () => document.removeEventListener('admin-tab', handler);
    }, []);

    if (!user) return null;

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#020617', overflow: 'hidden', color: 'var(--color-text-secondary)' }}>

            {/* ── Sidebar ── */}
            <div style={{ width: 240, background: 'var(--color-surface)', borderRight: '1px solid #1E293B', flexDirection: 'column', flexShrink: 0, display: 'flex' }}>
                <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--color-border)', gap: 10 }}>
                    <ShieldCheck size={20} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)', letterSpacing: 0.3 }}>Centro de Control</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                                cursor: 'pointer', touchAction: 'manipulation', transition: 'all 200ms', textAlign: 'left',
                                background: activeTab === tab.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--color-gold)' : '#94A3B8',
                                borderLeft: activeTab === tab.id ? '2px solid var(--color-gold)' : '2px solid transparent',
                                borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                            }}
                            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(30,41,59,0.5)'; }}
                            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <tab.icon size={16} style={{ flexShrink: 0 }} />
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div style={{ padding: 16, borderTop: '1px solid #1E293B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)', fontWeight: 700, fontSize: 13 }}>
                            {user.first_name[0]}
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{user.first_name} {user.last_name}</p>
                            <p style={{ fontSize: 10, color: 'var(--color-gold)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Administrador</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header style={{ height: 64, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', flexShrink: 0 }}>
                    <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{TABS.find(t => t.id === activeTab)?.label}</h1>
                    <span style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', color: '#10B981', padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' }} className="animate-pulse" />
                        En línea
                    </span>
                </header>

                <main style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto' }}>
                            {activeTab === 'dashboard' && <DashboardTab />}
                            {activeTab === 'eventos' && <EventsTab />}
                            {activeTab === 'staff' && <StaffTab />}
                            {activeTab === 'finanzas' && <FinanzasTab />}
                            {activeTab === 'comisiones' && <ComisionesTab />}
                            {activeTab === 'lockers' && <LockersTab />}
                            {activeTab === 'agenda' && <AgendaTab />}
                            {activeTab === 'contenido' && <ContenidoTab />}
                            {activeTab === 'recepcion' && <RecepcionTab />}
                            {activeTab === 'catalogo' && <CatalogoTab />}
                            {activeTab === 'config' && <SistemaTab />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile Nav */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: 'var(--color-surface)', borderTop: '1px solid #1E293B', display: 'none', justifyContent: 'space-around', alignItems: 'center', padding: '0 16px', zIndex: 50 }}>
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
                    { id: 'eventos', icon: Megaphone, label: 'Eventos' },
                    { id: 'staff', icon: Users, label: 'Personal' },
                    { id: 'config', icon: Settings, label: 'Config' },
                ].map(t => (
                    <button key={t.id} aria-label={t.label} onClick={() => setActiveTab(t.id)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                            padding: 8, borderRadius: 10, cursor: 'pointer', touchAction: 'manipulation', transition: 'all 200ms',
                            color: activeTab === t.id ? 'var(--color-gold)' : '#64748B',
                            background: activeTab === t.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                            border: 'none',
                        }}>
                        <t.icon size={20} />
                        <span style={{ fontSize: 9, fontWeight: 600 }}>{t.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: ElementType;
    trend: string;
    color?: string;
}

const MetricCard = ({ title, value, icon: Icon, trend, color }: MetricCardProps) => {
    const isRed = color?.includes('red');
    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: 16,
            border: '1px solid var(--color-border)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 160,
            transition: 'border-color 200ms',
        }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#475569')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#1E293B')}
        >
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: isRed ? 'rgba(239,68,68,0.08)' : 'rgba(201,168,76,0.08)',
                border: `1px solid ${isRed ? 'rgba(239,68,68,0.2)' : 'rgba(201,168,76,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
            }}>
                <Icon size={20} style={{ color: isRed ? '#EF4444' : 'var(--color-gold)' }} />
            </div>
            <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 1.2 }}>{title}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: -1, lineHeight: 1 }}>{value}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>{trend}</span>
                </div>
            </div>
        </div>
    );
};
