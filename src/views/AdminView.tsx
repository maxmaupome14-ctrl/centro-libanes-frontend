import { useState, useEffect, type ElementType } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import {
    LayoutDashboard, Users, CalendarDays,
    Briefcase, Wallet, Settings, ShieldCheck, ChevronRight,
    Activity, TrendingUp, AlertCircle,
    Lock, Megaphone, Plus, Trash2, Edit3, X, Check, Search, UserCheck
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Gestión de Eventos</h2>
                    <p className="text-slate-400 text-sm mt-1">Crea y administra los eventos del club</p>
                </div>
                <Button onClick={openCreate} className="bg-[var(--color-gold)] text-[var(--color-bg)] hover:opacity-90 text-xs font-semibold">
                    <Plus size={16} /> Nuevo Evento
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-[#0B1120] border border-[var(--color-gold)]/30 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-white">{editing ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                            <button onClick={() => setShowForm(false)} aria-label="Cerrar" className="text-slate-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'title', label: 'Título *', type: 'text', placeholder: '' },
                                { key: 'location', label: 'Ubicación', type: 'text', placeholder: 'Ej. Piscina Olímpica' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">{f.label}</label>
                                    <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)]" />
                                </div>
                            ))}
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Categoría</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)]">
                                    {['general', 'torneo', 'social', 'curso', 'nutricion', 'infantil', 'deportivo'].map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Fecha y Hora *</label>
                                <input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)]" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Descripción</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] resize-none" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Color de Tarjeta</label>
                                <div className="flex gap-2 flex-wrap">
                                    {EVENT_COLORS.map(c => (
                                        <button key={c.value} onClick={() => setForm({ ...form, image_color: c.value })}
                                            className={`w-8 h-8 rounded-lg border-2 transition-all ${form.image_color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ background: c.value }} title={c.label} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-6 pt-4">
                                {[{ key: 'is_published', label: 'Publicado' }, { key: 'is_featured', label: 'Destacado' }].map(cb => (
                                    <label key={cb.key} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form[cb.key]} onChange={e => setForm({ ...form, [cb.key]: e.target.checked })} className="w-4 h-4 accent-[var(--color-gold)]" />
                                        <span className="text-sm text-slate-300">{cb.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-700 text-slate-400">Cancelar</Button>
                            <Button onClick={handleSave} isLoading={saving} className="bg-[var(--color-gold)] text-[var(--color-bg)]">
                                <Check size={16} /> {editing ? 'Guardar Cambios' : 'Crear Evento'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-[#0B1120] rounded-2xl border border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 text-sm">Cargando eventos...</div>
                ) : fetchError ? (
                    <div className="p-12 text-center">
                        <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
                        <p className="text-red-400 text-sm">{fetchError}</p>
                        <button onClick={fetchEvents} className="mt-4 px-4 py-2 text-xs text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">Reintentar</button>
                    </div>
                ) : events.length === 0 ? (
                    <div className="p-12 text-center">
                        <Megaphone size={36} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">Sin eventos registrados</p>
                        <p className="text-slate-600 text-xs mt-1">Crea el primer evento del club</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#05080F] text-slate-500 font-medium text-[10px] uppercase tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Evento</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Categoría</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {events.map(ev => (
                                <tr key={ev.id} className="hover:bg-slate-900/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-10 rounded-full shrink-0" style={{ background: ev.image_color || '#007A4A' }} />
                                            <div>
                                                <p className="font-semibold text-slate-200">{ev.title}</p>
                                                {ev.location && <p className="text-xs text-slate-500 mt-0.5">{ev.location}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">
                                        {new Date(ev.event_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}<br />
                                        {new Date(ev.event_date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}h
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-800 text-slate-300">{ev.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => togglePublish(ev)}
                                            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${ev.is_published ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                            {ev.is_published ? 'Publicado' : 'Borrador'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button onClick={() => openEdit(ev)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><Edit3 size={15} /></button>
                                            <button onClick={() => handleDelete(ev.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
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

// ── Staff Tab ──────────────────────────────────────────────
const StaffTab = () => {
    const { showToast } = useToast();
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

    const toggleActive = async (s: any) => {
        try {
            await api.patch(`/admin/staff/${s.id}`, { is_active: !s.is_active });
            fetchStaff();
        } catch (err: any) { showToast(err.response?.data?.error || err.message); }
    };

    const filtered = staff.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.role.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Personal del Club</h2>
                    <p className="text-slate-400 text-sm mt-1">{staff.length} empleados · {units.length} unidades</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o puesto..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-[var(--color-gold)]" />
            </div>

            <div className="bg-[#0B1120] rounded-2xl border border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 text-sm">Cargando personal...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">Sin resultados</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#05080F] text-slate-500 font-medium text-[10px] uppercase tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Empleado</th>
                                <th className="px-6 py-4">Puesto</th>
                                <th className="px-6 py-4">Unidad</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filtered.map(s => (
                                <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center text-[var(--color-gold)] text-xs font-bold shrink-0">
                                                {s.name[0]}
                                            </div>
                                            <p className="font-semibold text-slate-200">{s.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 capitalize text-xs">{s.role?.replace(/_/g, ' ')}</td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">{s.unit?.short_name || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-800 text-slate-300">{s.employment_type?.replace(/_/g, ' ')}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleActive(s)}
                                            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${s.is_active ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                            {s.is_active ? 'Activo' : 'Inactivo'}
                                        </button>
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
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white">Panel Principal</h2>
                <p className="text-slate-400 text-sm mt-1">Resumen operativo del club</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard title="Personal Activo" value={loading ? '—' : stats.staff} icon={UserCheck} trend="Empleados registrados" />
                <MetricCard title="Eventos Creados" value={loading ? '—' : stats.events} icon={Megaphone} trend="Total en sistema" />
                <MetricCard title="Unidades" value={loading ? '—' : stats.units} icon={Activity} trend="Hermes · Fredy Atala" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0B1120] rounded-2xl border border-slate-800 p-6">
                    <h3 className="font-bold text-base mb-4 text-white flex items-center gap-2">
                        <TrendingUp size={16} className="text-[var(--color-gold)]" />
                        Accesos Rápidos
                    </h3>
                    <div className="space-y-2">
                        {[
                            { label: 'Gestionar Eventos', desc: 'Crear, editar y publicar eventos del club', tab: 'eventos', icon: Megaphone },
                            { label: 'Ver Personal', desc: 'Lista completa de empleados por unidad', tab: 'staff', icon: Users },
                        ].map(item => (
                            <button key={item.tab} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
                                onClick={() => document.dispatchEvent(new CustomEvent('admin-tab', { detail: item.tab }))}>
                                <div className="w-9 h-9 rounded-xl bg-[var(--color-gold)]/10 flex items-center justify-center shrink-0">
                                    <item.icon size={16} className="text-[var(--color-gold)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#0B1120] rounded-2xl border border-slate-800 p-6">
                    <h3 className="font-bold text-base mb-4 text-white flex items-center gap-2">
                        <AlertCircle size={16} className="text-slate-400" />
                        Módulos en Desarrollo
                    </h3>
                    <div className="space-y-2">
                        {['Mapa en Vivo', 'Control de Lockers', 'Finanzas & Penalizaciones', 'Catálogo CRM', 'Agenda Staff'].map(m => (
                            <div key={m} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                                <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                                <p className="text-sm text-slate-500">{m}</p>
                                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-600">Próximamente</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
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
        <div className="flex h-screen bg-[#020617] overflow-hidden text-slate-300">

            {/* ── Sidebar ── */}
            <div className="w-60 bg-[#0B1120] border-r border-[#1E293B] flex-col hidden md:flex shrink-0">
                <div className="h-16 flex items-center px-5 border-b border-[#1E293B] gap-2.5">
                    <ShieldCheck className="text-[var(--color-gold)] shrink-0" size={20} />
                    <span className="font-bold text-sm tracking-wide text-white">Centro de Control</span>
                </div>
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-[var(--color-gold)]/[0.12] text-[var(--color-gold)] border-l-2 border-[var(--color-gold)] pl-[10px]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
                            <tab.icon size={16} className="mr-3 shrink-0" />
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-[#1E293B]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[var(--color-gold)] font-bold text-sm">
                            {user.first_name[0]}
                        </div>
                        <div>
                            <p className="text-sm font-bold leading-none text-white">{user.first_name} {user.last_name}</p>
                            <p className="text-[10px] text-[var(--color-gold)] mt-1 uppercase tracking-wider">Administrador</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-[#0B1120] border-b border-[#1E293B] flex items-center justify-between px-8 shrink-0">
                    <h1 className="text-lg font-bold text-white">{TABS.find(t => t.id === activeTab)?.label}</h1>
                    <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            En línea
                        </span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-6xl mx-auto">
                            {activeTab === 'dashboard' && <DashboardTab />}
                            {activeTab === 'eventos' && <EventsTab />}
                            {activeTab === 'staff' && <StaffTab />}
                            {['agenda', 'lockers', 'finanzas', 'catalogo', 'config'].includes(activeTab) && (
                                <div className="bg-[#0B1120] rounded-2xl border border-slate-800 p-16 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-5">
                                        <Settings size={28} />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-400">En Desarrollo</h2>
                                    <p className="text-slate-600 mt-2 max-w-sm text-sm">Este módulo estará disponible en una próxima versión del sistema.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0B1120] border-t border-slate-800 flex justify-around items-center px-4 z-50">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
                    { id: 'eventos', icon: Megaphone, label: 'Eventos' },
                    { id: 'staff', icon: Users, label: 'Personal' },
                    { id: 'config', icon: Settings, label: 'Config' },
                ].map(t => (
                    <button key={t.id} aria-label={t.label} onClick={() => setActiveTab(t.id)}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition ${activeTab === t.id ? 'text-[var(--color-gold)] bg-[var(--color-gold)]/10' : 'text-slate-400'}`}>
                        <t.icon size={20} />
                        <span className="text-[9px] font-semibold">{t.label}</span>
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

const MetricCard = ({ title, value, icon: Icon, trend, color = "text-[var(--color-gold)]" }: MetricCardProps) => {
    const isRed = color.includes('red');
    return (
        <div className="bg-[#0B1120] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${isRed ? 'bg-red-500/10 border-red-500/30' : 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/30'} border flex items-center justify-center ${color}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div>
                <h4 className="text-slate-400 text-[11px] uppercase tracking-widest">{title}</h4>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold text-white">{value}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">{trend}</span>
                </div>
            </div>
        </div>
    );
};
