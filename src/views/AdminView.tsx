import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { UserPlus, Briefcase, MapPin, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminView = () => {
    const { user } = useAuthStore();
    const [staff, setStaff] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newStaff, setNewStaff] = useState({
        name: '', role: 'instructor', employment_type: 'planta', unit_id: '', phone: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffRes, unitsRes] = await Promise.all([
                api.get('/admin/staff'),
                api.get('/admin/units')
            ]);
            setStaff(staffRes.data);
            setUnits(unitsRes.data);
            if (unitsRes.data.length > 0) {
                setNewStaff(prev => ({ ...prev, unit_id: unitsRes.data[0].id }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/staff', newStaff);
            setIsAdding(false);
            fetchData();
            setNewStaff({ name: '', role: 'instructor', employment_type: 'planta', unit_id: units[0]?.id || '', phone: '' });
        } catch (err: any) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeactivate = async (id: string, name: string) => {
        if (window.confirm(`¿Estás seguro de desactivar a ${name}?`)) {
            try {
                await api.delete(`/admin/staff/${id}`);
                fetchData();
            } catch (err: any) {
                alert('Error: ' + (err.response?.data?.error || err.message));
            }
        }
    };

    // Ensure we are mostly just showing this if not an employee since this is admin
    // In a real app we'd have a specific "Admin" role, but here we just show it
    if (!user) return null;

    return (
        <div className="pb-24 max-w-[480px] mx-auto min-h-screen bg-[var(--color-bg)]">
            <div className="sticky top-0 z-50 glass px-5 h-14 flex items-center justify-between border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[var(--color-gold)]" />
                    <span className="text-[13px] font-bold tracking-wider uppercase">Portal Admin</span>
                </div>
                <button onClick={() => setIsAdding(!isAdding)} className="w-8 h-8 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center justify-center hover:bg-[var(--color-gold)]/20 transition-colors">
                    {isAdding ? <X size={16} /> : <UserPlus size={16} />}
                </button>
            </div>

            <div className="px-5 py-6">
                <AnimatePresence mode="wait">
                    {isAdding ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[var(--color-surface)] p-5 border border-[var(--color-border)] rounded-2xl space-y-4 shadow-xl"
                        >
                            <div>
                                <h2 className="text-lg font-bold font-display text-[var(--color-text-primary)]">Registrar Empleado</h2>
                                <p className="text-[11px] text-[var(--color-text-tertiary)]">Añade personal a la plataforma</p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-4 pt-2">
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)] mb-1.5 block">Nombre Completo</label>
                                    <input required value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} className="w-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-gold)]" placeholder="Ej. Roberto García" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)] mb-1.5 block">Rol</label>
                                        <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} className="w-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none">
                                            <option value="instructor">Instructor</option>
                                            <option value="masajista">Masajista</option>
                                            <option value="coach">Coach</option>
                                            <option value="recepcionista">Recepcionista</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)] mb-1.5 block">Contratación</label>
                                        <select value={newStaff.employment_type} onChange={e => setNewStaff({ ...newStaff, employment_type: e.target.value })} className="w-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none">
                                            <option value="planta">Planta</option>
                                            <option value="comisionista">Comisionista</option>
                                            <option value="renta">Pago Renta</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)] mb-1.5 block">Unidad Asignada</label>
                                    <select required value={newStaff.unit_id} onChange={e => setNewStaff({ ...newStaff, unit_id: e.target.value })} className="w-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none">
                                        {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-tertiary)] mb-1.5 block">Teléfono (Opcional)</label>
                                    <input type="tel" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} className="w-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-gold)]" placeholder="10 dígitos" />
                                </div>
                                <div className="pt-2">
                                    <Button type="submit" className="w-full py-4 text-sm">Registrar Empleado</Button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <h2 className="text-[10px] uppercase tracking-[2px] font-bold text-[var(--color-text-tertiary)] ml-1">Directorio de Staff</h2>
                            {loading ? (
                                <div className="py-10 text-center text-sm text-[var(--color-text-tertiary)]">Cargando staff...</div>
                            ) : (
                                <div className="space-y-3">
                                    {staff.map(s => (
                                        <div key={s.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-2xl flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-gold)] font-bold text-sm shrink-0 border border-[var(--color-border-strong)]">
                                                    {s.name[0]}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[13px] text-[var(--color-text-primary)] leading-tight">{s.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1 capitalize"><Briefcase size={10} /> {s.role}</span>
                                                        <span className="w-1 h-1 rounded-full bg-[var(--color-border-strong)]" />
                                                        <span className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1"><MapPin size={10} /> {s.unit.short_name}</span>
                                                    </div>
                                                    {!s.is_active && <p className="text-[10px] text-[var(--color-red-lebanese)] mt-1 font-bold">Inactivo</p>}
                                                </div>
                                            </div>
                                            {s.is_active && (
                                                <button onClick={() => handleDeactivate(s.id, s.name)} className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-[var(--color-surface-hover)] flex items-center justify-center hover:bg-[var(--color-red-lebanese)]/10 hover:text-[var(--color-red-lebanese)]">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
