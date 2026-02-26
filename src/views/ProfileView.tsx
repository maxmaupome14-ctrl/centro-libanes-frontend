import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronRight, LogOut, Bell, Shield, CreditCard,
    HelpCircle, Lock, Smartphone, Globe, FileText
} from 'lucide-react';

export const ProfileView = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fadeUp = (delay: number) => ({
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay, ease: "easeOut" as any },
    });

    const menuSections = [
        {
            title: 'Cuenta',
            items: [
                { action: () => navigate('/family'), icon: CreditCard, label: 'Estado de Cuenta', desc: 'Pagos y facturación' },
                { action: () => alert('Visualizando datos...'), icon: Shield, label: 'Datos de Membresía', desc: `No. ${user.member_number} · ${user.role}` },
                { action: () => alert('Mostrando notificaciones...'), icon: Bell, label: 'Notificaciones', desc: 'Alertas y avisos' },
            ]
        },
        {
            title: 'Configuración',
            items: [
                { action: () => alert('Ajustes de seguridad...'), icon: Lock, label: 'Seguridad', desc: 'PIN y contraseña' },
                { action: () => alert('Configurando biometría...'), icon: Smartphone, label: 'Biometría', desc: 'Face ID / Touch ID' },
                { action: () => alert('Cambiando idioma...'), icon: Globe, label: 'Idioma', desc: 'Español' },
            ]
        },
        {
            title: 'Soporte',
            items: [
                { action: () => alert('Abriendo centro de soporte...'), icon: HelpCircle, label: 'Ayuda', desc: 'Centro de soporte' },
                { action: () => alert('Mostrando políticas...'), icon: FileText, label: 'Términos y Condiciones', desc: 'Políticas del club' },
            ]
        }
    ];

    return (
        <div className="pb-28">

            {/* ── Profile Header ── */}
            <motion.div {...fadeUp(0)} className="px-5 pt-6 pb-4 flex items-center gap-4">
                <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-[var(--color-border-strong)] shadow-lg shrink-0">
                    <img src="/demo-avatar.jpg" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                        {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
                        Socio #{user.member_number}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-400" />
                        </span>
                        <span className="text-emerald-400 text-[11px] font-semibold">Membresía Activa</span>
                    </div>
                </div>
            </motion.div>

            {/* ── Membership Card (mini, tappable to show QR) ── */}
            <motion.div {...fadeUp(0.05)} className="px-5 mb-4">
                <div className="rounded-2xl p-4 flex items-center gap-4"
                    style={{
                        background: 'linear-gradient(135deg, #002D1C, #005A36)',
                        boxShadow: '0 8px 24px rgba(0,60,36,0.2)',
                    }}>
                    <div className="flex-1">
                        <p className="text-[10px] text-white/50 tracking-[2px] uppercase mb-0.5">Credencial Digital</p>
                        <p className="text-white font-bold tracking-[5px] text-xl">{user.member_number}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="14" width="3" height="3" /><rect x="14" y="18" width="3" height="3" /><rect x="18" y="18" width="3" height="3" />
                        </svg>
                    </div>
                </div>
            </motion.div>

            {/* ── Menu Sections ── */}
            {menuSections.map((section, sIdx) => (
                <motion.div key={section.title} {...fadeUp(0.1 + sIdx * 0.06)} className="px-5 mt-5">
                    <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] tracking-[2.5px] uppercase mb-2 px-1">{section.title}</p>
                    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                        {section.items.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.label}
                                    onClick={item.action}
                                    className={`w-full flex items-center gap-3.5 p-4 text-left hover:bg-[var(--color-surface-hover)] transition-colors ${i < section.items.length - 1 ? 'border-b border-[var(--color-border)]' : ''
                                        }`}
                                >
                                    <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-hover)] flex items-center justify-center shrink-0">
                                        <Icon size={17} className="text-[var(--color-text-secondary)]" strokeWidth={1.6} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{item.label}</p>
                                        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 truncate">{item.desc}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            ))}

            {/* ── Logout ── */}
            <motion.div {...fadeUp(0.3)} className="px-5 mt-6">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-red-lebanese)]/10 hover:border-[var(--color-red-lebanese)]/20 transition-all group"
                >
                    <LogOut size={17} className="text-[var(--color-red-lebanese)] group-hover:text-[var(--color-red-lebanese-light)]" strokeWidth={1.6} />
                    <span className="text-[13px] font-semibold text-[var(--color-red-lebanese)]">Cerrar Sesión</span>
                </button>
            </motion.div>

            {/* ── App Version ── */}
            <div className="text-center mt-6">
                <p className="text-[10px] text-[var(--color-text-tertiary)]">Centro Libanés v1.0.0</p>
            </div>
        </div>
    );
};
