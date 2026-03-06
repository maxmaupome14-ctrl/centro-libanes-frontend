import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import {
    LayoutDashboard, Users, Map as MapIcon, CalendarDays,
    Briefcase, Wallet, Settings, ShieldCheck, ChevronRight,
    Activity, TrendingUp, AlertCircle, Search,
    Lock, Megaphone, Plus, Trash2, Edit3, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';

const TABS = [
    { id: 'dashboard', label: 'God View', icon: LayoutDashboard },
    { id: 'eventos', label: 'Eventos', icon: Megaphone },
    { id: 'mapa', label: 'Mapa en Vivo', icon: MapIcon },
    { id: 'membresias', label: 'Membresías', icon: Users },
    { id: 'agenda', label: 'Agenda Staff', icon: CalendarDays },
    { id: 'lockers', label: 'Control Lockers', icon: Lock },
    { id: 'finanzas', label: 'Finanzas & Penalizaciones', icon: Wallet },
    { id: 'catalogo', label: 'Catálogo CRM', icon: Briefcase },
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
        setLoading(true);
        setFetchError('');
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
        setForm({
            title: ev.title,
            description: ev.description || '',
            category: ev.category,
            event_date: ev.event_date?.slice(0, 16) || '',
            location: ev.location || '',
            image_color: ev.image_color || '#007A4A',
            is_published: ev.is_published,
            is_featured: ev.is_featured,
        });
        setEditing(ev);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.event_date) { showToast('Título y fecha son requeridos'); return; }
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/events/${editing.id}`, form);
            } else {
                await api.post('/events', form);
            }
            setShowForm(false);
            fetchEvents();
        } catch (err: any) {
            showToast(err.response?.data?.error || err.message);
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este evento?')) return;
        try {
            await api.delete(`/events/${id}`);
            fetchEvents();
        } catch (err: any) {
            showToast(err.response?.data?.error || err.message);
        }
    };

    const togglePublish = async (ev: any) => {
        try {
            await api.put(`/events/${ev.id}`, { is_published: !ev.is_published });
            fetchEvents();
        } catch { /* empty */ }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Gestión de Eventos</h2>
                    <p className="text-slate-400 text-sm mt-1">Crea y administra los eventos del club</p>
                </div>
                <Button onClick={openCreate} className="bg-[var(--color-gold)] text-[var(--color-bg)] hover:opacity-90 font-mono text-xs">
                    <Plus size={16} /> NUEVO EVENTO
                </Button>
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-[#0B1120] border border-[var(--color-gold)]/30 rounded-2xl p-6 space-y-4"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-white font-mono tracking-wider">{editing ? 'EDITAR EVENTO' : 'NUEVO EVENTO'}</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Título *</label>
                                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)]" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Categoría</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)]">
                                    {['general', 'torneo', 'social', 'curso', 'nutricion', 'infantil', 'deportivo'].map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Fecha y Hora *</label>
                                <input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)]" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Ubicación</label>
                                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                                    placeholder="Ej. Piscina Olímpica, Unidad Hermes"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)]" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">Descripción</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] resize-none" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-2">Color de Tarjeta</label>
                                <div className="flex gap-2 flex-wrap">
                                    {EVENT_COLORS.map(c => (
                                        <button key={c.value} onClick={() => setForm({ ...form, image_color: c.value })}
                                            className={`w-8 h-8 rounded-lg border-2 transition-all ${form.image_color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ background: c.value }} title={c.label} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-6 pt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 accent-[var(--color-gold)]" />
                                    <span className="text-sm text-slate-300">Publicado</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-[var(--color-gold)]" />
                                    <span className="text-sm text-slate-300">Destacado</span>
                                </label>
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

            {/* Events List */}
            <div className="bg-[#0B1120] rounded-2xl border border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 font-mono text-sm">LOADING...</div>
                ) : fetchError ? (
                    <div className="p-12 text-center">
                        <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
                        <p className="text-red-400 font-mono text-sm">ERROR AL CARGAR EVENTOS</p>
                        <p className="text-slate-500 text-xs mt-1 font-mono">{fetchError}</p>
                        <button onClick={fetchEvents} className="mt-4 px-4 py-2 text-xs font-mono text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                            REINTENTAR
                        </button>
                    </div>
                ) : events.length === 0 ? (
                    <div className="p-12 text-center">
                        <Megaphone size={36} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 font-mono">SIN EVENTOS REGISTRADOS</p>
                        <p className="text-slate-600 text-xs mt-1">Crea el primer evento del club</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#05080F] text-slate-500 font-medium text-[10px] uppercase font-mono tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">EVENTO</th>
                                <th className="px-6 py-4">FECHA</th>
                                <th className="px-6 py-4">CATEGORÍA</th>
                                <th className="px-6 py-4">ESTADO</th>
                                <th className="px-6 py-4 text-right">ACCIONES</th>
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
                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                        {new Date(ev.event_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        <br />
                                        {new Date(ev.event_date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}h
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-800 text-slate-300 font-mono">{ev.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => togglePublish(ev)}
                                            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded font-mono ${ev.is_published ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                            {ev.is_published ? 'PUBLICADO' : 'BORRADOR'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button onClick={() => openEdit(ev)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                                                <Edit3 size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(ev.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
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

export const AdminView = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Mock data for God View
    const metrics = {
        ocupacion: 78,
        lockers: 92,
        ingresos: 450000,
        proyectado: 500000,
        pendientes: 12
    };

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#020617] overflow-hidden text-slate-300">

            {/* ── Sidebar ── */}
            <div className="w-64 bg-[#0B1120] border-r border-[#1E293B] flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-[#1E293B]">
                    <ShieldCheck className="text-[var(--color-gold)] mr-2" size={24} />
                    <span className="font-bold text-lg font-display tracking-widest uppercase text-white">Centro Control</span>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                                ? 'bg-[var(--color-gold)]/[0.15] text-[var(--color-gold)] shadow-[inset_2px_0_0_var(--color-gold)]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <tab.icon size={18} className="mr-3" />
                            {tab.label}
                            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto opacity-50" />}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-[#1E293B]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[var(--color-gold)] font-bold shadow-[0_0_10px_rgba(201,168,76,0.3)]">
                            {user.first_name[0]}
                        </div>
                        <div>
                            <p className="text-sm font-bold leading-none text-white">{user.first_name} {user.last_name}</p>
                            <p className="text-[10px] uppercase tracking-widest text-[#06B6D4] mt-1 font-mono">SYSADMIN</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-[#0B1120] border-b border-[#1E293B] flex items-center justify-between px-8 md:px-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold font-display text-white uppercase tracking-wider">{TABS.find(t => t.id === activeTab)?.label}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 font-mono shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]" />
                            SECURE UPLINK
                        </span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 md:p-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-6xl mx-auto"
                        >
                            {activeTab === 'dashboard' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <MetricCard title="Ocupación Canchas" value={`${metrics.ocupacion}%`} icon={Activity} trend="+5%" />
                                        <MetricCard title="Lockers Ocupados" value={`${metrics.lockers}%`} icon={Lock} trend="Estable" />
                                        <MetricCard title="Ingresos Cobrados" value={`$${(metrics.ingresos / 1000).toFixed(0)}k`} icon={TrendingUp} trend="85% meta" />
                                        <MetricCard title="Alertas de Pago" value={metrics.pendientes} icon={AlertCircle} trend="Requieren acción" color="text-red-500" />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 bg-[#0B1120] rounded-2xl border border-slate-800 p-6 relative overflow-hidden">
                                            {/* Tech Grid Background Lines */}
                                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                                            <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                                                <Activity size={18} className="text-[#06B6D4]" />
                                                LIVE TELEMETRY: CANCHAS
                                            </h3>
                                            <div className="space-y-4 relative z-10">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-800 rounded-xl transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 text-[var(--color-gold)] flex items-center justify-center shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                                                                <Activity size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm text-slate-200">Cancha Pádel Atala 0{i}</p>
                                                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">AUTH_USER: MN-31505 • T-MINUS 45M</p>
                                                            </div>
                                                        </div>
                                                        <span className="px-2 py-1 rounded flex items-center gap-1.5 border border-[#06B6D4]/30 text-[10px] font-bold uppercase tracking-wider bg-[#06B6D4]/10 text-[#06B6D4] font-mono">
                                                            <span className="w-1 h-1 rounded-full bg-[#06B6D4] animate-pulse" />
                                                            ACTIVE
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-[#0B1120] rounded-2xl border border-slate-800 p-6">
                                            <h3 className="font-bold text-lg mb-4 text-white uppercase tracking-wider flex items-center gap-2">
                                                <Settings size={18} className="text-slate-400" />
                                                Quick Overrides
                                            </h3>
                                            <div className="space-y-3">
                                                <Button className="w-full justify-start text-left bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono text-[11px] tracking-wider" variant="outline">&gt; RUN_SYS_AUDIT</Button>
                                                <Button className="w-full justify-start text-left bg-slate-900/80 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-slate-300 font-mono text-[11px] tracking-wider transition-colors" variant="outline">&gt; FORCE_NOSHOW_CRON</Button>
                                                <Button className="w-full justify-start text-left bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono text-[11px] tracking-wider" variant="outline">&gt; OVERRIDE_CONFIG</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'mapa' && (
                                <div className="bg-[#0B1120] rounded-2xl border border-[#06B6D4]/30 p-8 text-center relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] pointer-events-none" />
                                    <MapIcon size={48} className="mx-auto text-[#06B6D4] mb-4 animate-[pulse_3s_ease-in-out_infinite]" />
                                    <h2 className="text-xl font-bold font-mono tracking-widest text-[#06B6D4]">TACTICAL MAP: OFFLINE</h2>
                                    <p className="text-slate-400 mt-2 font-mono text-sm">Awaiting geo-spatial data feed for sectors: Hermes, Fredy.</p>
                                </div>
                            )}

                            {activeTab === 'membresias' && (
                                <div className="bg-[#0B1120] rounded-2xl border border-slate-800 overflow-hidden">
                                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                        <div className="relative w-80">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                            <input placeholder="ENTER QUERY: ACTION / NAME" className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/30" />
                                        </div>
                                        <Button size="sm" className="bg-[#06B6D4]/10 border border-[#06B6D4]/50 text-[#06B6D4] hover:bg-[#06B6D4]/20 font-mono text-[10px]">+ INIT_MEMBER</Button>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[#05080F] text-slate-500 font-medium text-[10px] uppercase font-mono tracking-widest border-b border-slate-800">
                                            <tr>
                                                <th className="px-6 py-4">ID_ACCION</th>
                                                <th className="px-6 py-4">TITULAR_REF</th>
                                                <th className="px-6 py-4">STATUS_CODE</th>
                                                <th className="px-6 py-4 text-right">EXEC</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50 bg-[#0B1120]">
                                            <tr className="hover:bg-slate-900/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-white text-xs">#31505</td>
                                                <td className="px-6 py-4 font-semibold text-slate-300">Max Nicolas Maupome</td>
                                                <td className="px-6 py-4"><span className="text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider font-mono">OK / CLEARED</span></td>
                                                <td className="px-6 py-4 text-right"><Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-mono text-[10px]">ACCESS</Button></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'eventos' && <EventsTab />}

                            {/* Fallback for other tabs */}
                            {['agenda', 'lockers', 'finanzas', 'catalogo', 'config'].includes(activeTab) && (
                                <div className="bg-[#0B1120] rounded-2xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                                        <Settings size={32} />
                                    </div>
                                    <h2 className="text-xl font-bold font-mono tracking-widest text-slate-400">SECTOR CLASSIFIED</h2>
                                    <p className="text-slate-600 mt-2 max-w-sm font-mono text-xs">Module {TABS.find(t => t.id === activeTab)?.id.toUpperCase()} is restricted pending phase 2 authorization.</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile Nav Fallback */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0B1120] border-t border-slate-800 flex justify-around items-center px-4 z-50">
                <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-xl transition ${activeTab === 'dashboard' ? 'text-[var(--color-gold)] bg-[var(--color-gold)]/10' : 'text-slate-400'}`}>
                    <LayoutDashboard size={22} />
                </button>
                <button onClick={() => setActiveTab('eventos')} className={`p-2 rounded-xl transition ${activeTab === 'eventos' ? 'text-[var(--color-gold)] bg-[var(--color-gold)]/10' : 'text-slate-400'}`}>
                    <Megaphone size={22} />
                </button>
                <button onClick={() => setActiveTab('membresias')} className={`p-2 rounded-xl transition ${activeTab === 'membresias' ? 'text-[var(--color-gold)] bg-[var(--color-gold)]/10' : 'text-slate-400'}`}>
                    <Users size={22} />
                </button>
                <button onClick={() => setActiveTab('config')} className={`p-2 rounded-xl transition ${activeTab === 'config' ? 'text-[var(--color-gold)] bg-[var(--color-gold)]/10' : 'text-slate-400'}`}>
                    <Settings size={22} />
                </button>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, icon: Icon, trend, color = "text-[var(--color-gold)]" }: any) => {
    // Generate glow color based on the text color class passed
    const isRed = color.includes('red');
    const glowColor = isRed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(201, 168, 76, 0.2)';
    const borderColor = isRed ? 'border-red-500/30' : 'border-[var(--color-gold)]/30';
    const bgColor = isRed ? 'bg-red-500/10' : 'bg-[var(--color-gold)]/10';

    return (
        <div className="bg-[#0B1120] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 hover:bg-slate-900/50 transition-all relative overflow-hidden group">
            {/* Subtle highlight gradient on hover */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${isRed ? 'from-red-500/5' : 'from-[var(--color-gold)]/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-tr-2xl`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center ${color}`} style={{ boxShadow: `0 0 15px ${glowColor}` }}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="relative z-10">
                <h4 className="text-slate-400 text-[11px] font-mono uppercase tracking-widest">{title}</h4>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold font-display text-white">{value}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isRed ? 'text-red-400 bg-red-400/10 border border-red-400/20' : 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'} px-2 py-0.5 rounded font-mono`}>{trend}</span>
                </div>
            </div>
        </div>
    );
};
