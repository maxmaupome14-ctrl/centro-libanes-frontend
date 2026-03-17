import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    ChevronRight, LogOut, Bell, Shield, CreditCard, Globe,
    Trophy, UserPlus, Lock, Briefcase, MapPin, Users, ShieldCheck, X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const ProfileView = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        // notifications/my requires a member profile — staff tokens get 401
        if (user?.user_type !== 'employee') {
            api.get('/notifications/my')
                .then(res => setUnreadCount(res.data.unread_count))
                .catch(() => {});
        }
    }, [user]);

    if (!user) return null;

    const isEmployee = user.user_type === 'employee';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fadeUp = (delay: number) => ({
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay, ease: "easeOut" as const },
    });

    const memberMenuSections = [
        {
            title: 'Cuenta',
            items: [
                { action: () => navigate('/family', { state: { tab: 'statement' } }), icon: CreditCard, label: 'Estado de Cuenta', desc: 'Pagos y facturación' },
                { action: () => navigate('/family'), icon: Shield, label: 'Datos de Membresía', desc: `No. ${user.member_number} · ${user.role}` },
                { action: () => navigate('/notifications'), icon: Bell, label: 'Notificaciones', desc: unreadCount > 0 ? `${unreadCount} sin leer` : 'Alertas y avisos', badge: unreadCount },
            ]
        },
        {
            title: 'Servicios',
            items: [
                { action: () => navigate('/tournaments'), icon: Trophy, label: 'Torneos', desc: 'Inscripciones y brackets' },
                { action: () => navigate('/guests'), icon: UserPlus, label: 'Pases de Invitado', desc: 'Invita amigos al club' },
                { action: () => navigate('/lockers'), icon: Lock, label: 'Casilleros', desc: 'Gestiona tu locker' },
            ]
        },
        {
            title: 'Configuración',
            items: [
                { icon: Globe, label: 'Idioma', desc: 'Español', disabled: true },
            ]
        }
    ] as const;

    const employeeMenuSections = [
        {
            title: 'Staff',
            items: [
                { action: () => navigate('/employee'), icon: Briefcase, label: 'Panel de Staff', desc: 'Citas y agenda semanal' },
                ...(user.role === 'administrador' ? [{ action: () => navigate('/admin'), icon: ShieldCheck, label: 'Panel Admin', desc: 'Gestión del club' }] : []),
                { action: () => navigate('/notifications'), icon: Bell, label: 'Notificaciones', desc: unreadCount > 0 ? `${unreadCount} sin leer` : 'Alertas y avisos', badge: unreadCount },
            ]
        },
        {
            title: 'Información',
            items: [
                { icon: Briefcase, label: 'Contrato', desc: (user.employment_type || 'N/A').replace('_', ' '), disabled: true },
                { icon: MapPin, label: 'Unidad', desc: user.unit_name || 'N/A', disabled: true },
                { icon: Users, label: 'Rol', desc: user.role || 'N/A', disabled: true },
            ]
        },
        {
            title: 'Configuración',
            items: [
                { icon: Globe, label: 'Idioma', desc: 'Español', disabled: true },
            ]
        }
    ];

    const menuSections = isEmployee ? employeeMenuSections : memberMenuSections;

    return (
        <div style={{ paddingBottom: 100 }}>

            {/* ── Profile Header ── */}
            <motion.div {...fadeUp(0)} style={{ padding: '24px 16px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                {user.photo_url ? (
                    <img src={user.photo_url} alt="" style={{
                        width: 64, height: 64, borderRadius: 32, objectFit: 'cover', flexShrink: 0,
                        border: '2px solid var(--color-border-strong)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }} />
                ) : (
                    <div style={{
                        width: 64, height: 64, borderRadius: 32, overflow: 'hidden', flexShrink: 0,
                        border: isEmployee ? '2px solid rgba(201,168,76,0.3)' : '2px solid var(--color-border-strong)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        background: isEmployee ? 'linear-gradient(135deg, #C9A84C, #B8963E)' : 'var(--color-surface-hover)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: isEmployee ? '#1a1408' : 'var(--color-gold)' }}>
                            {user.first_name?.[0] ?? ''}{user.last_name?.[0] ?? ''}
                        </span>
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {user.first_name} {user.last_name}
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                        {isEmployee ? (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ') : 'Staff') : `Socio #${user.member_number}`}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ position: 'relative', display: 'flex', width: 6, height: 6 }}>
                                <span className="animate-ping" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: 9999, background: '#34D399', opacity: 0.75 }} />
                                <span style={{ position: 'relative', borderRadius: 9999, width: 6, height: 6, background: '#34D399' }} />
                            </span>
                            <span style={{ color: '#34D399', fontSize: 10, fontWeight: 600 }}>{isEmployee ? 'Staff Activo' : 'Membresia Activa'}</span>
                        </div>
                        {!isEmployee && user.join_date && (
                            <>
                                <span style={{ color: 'var(--color-border-strong)', fontSize: 10 }}>·</span>
                                <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                                    Socio desde {new Date(user.join_date).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ── Credential Card (mini) ── */}
            <motion.div {...fadeUp(0.05)} style={{ padding: '0 16px', marginBottom: 0 }}>
                {isEmployee ? (
                    <div style={{
                        borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 16,
                        background: 'linear-gradient(135deg, #1a1408, #2d2210)',
                        border: '1px solid rgba(201,168,76,0.15)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, color: 'rgba(201,168,76,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Staff · {user.unit_name || 'Centro Libanés'}</p>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{(user.employment_type || '').replace('_', ' ')}</p>
                        </div>
                        <div style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: 'rgba(201,168,76,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Briefcase size={18} style={{ color: '#C9A84C' }} />
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setShowQR(true)} style={{
                        width: '100%', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 16,
                        background: 'linear-gradient(135deg, #002D1C, #005A36)',
                        boxShadow: '0 8px 24px rgba(0,60,36,0.2)',
                        border: 'none', cursor: 'pointer', touchAction: 'manipulation', textAlign: 'left',
                    }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Credencial Digital</p>
                            <p style={{ color: 'white', fontWeight: 700, letterSpacing: 5, fontSize: 20 }}>{user.member_number}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                {user.tier && <span style={{ fontSize: 9, color: '#C9A84C', fontWeight: 600, textTransform: 'capitalize' }}>{user.tier}</span>}
                                {user.tier && user.join_date && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>·</span>}
                                {user.join_date ? (
                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                                        Desde {new Date(user.join_date).getFullYear()}
                                    </span>
                                ) : (
                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Toca para mostrar QR</span>
                                )}
                            </div>
                        </div>
                        <div style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="14" width="3" height="3" /><rect x="14" y="18" width="3" height="3" /><rect x="18" y="18" width="3" height="3" />
                            </svg>
                        </div>
                    </button>
                )}
            </motion.div>

            {/* ── Apariencia ── */}
            <motion.div {...fadeUp(0.1)} style={{ padding: '24px 16px 0' }}>
                <p className="section-header" style={{ marginBottom: 12 }}>Apariencia</p>
                <ThemeToggle />
            </motion.div>

            {/* ── Menu Sections ── */}
            {menuSections.map((section, sIdx) => (
                <motion.div key={section.title} {...fadeUp(0.1 + sIdx * 0.06)} style={{ padding: '24px 16px 0' }}>
                    <p className="section-header" style={{ marginBottom: 12 }}>{section.title}</p>
                    <div style={{
                        background: 'var(--color-surface)', borderRadius: 16,
                        border: '1px solid var(--color-border)', overflow: 'hidden',
                    }}>
                        {section.items.map((item, i) => {
                            const Icon = item.icon;
                            const disabled = 'disabled' in item && item.disabled;
                            return (
                                <button
                                    key={item.label}
                                    onClick={'action' in item ? item.action : undefined}
                                    disabled={disabled}
                                    className={disabled ? undefined : 'menu-row'}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                                        padding: 16, textAlign: 'left',
                                        cursor: disabled ? 'default' : 'pointer',
                                        opacity: disabled ? 0.5 : 1,
                                        borderBottom: i < section.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                                        background: 'transparent', border: 'none',
                                        touchAction: 'manipulation',
                                    }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 12,
                                        background: 'var(--color-surface-hover)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <Icon size={17} style={{ color: 'var(--color-text-secondary)' }} strokeWidth={1.6} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.label}</p>
                                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
                                    </div>
                                    {!disabled && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            {'badge' in item && item.badge && (item.badge as number) > 0 && (
                                                <span style={{
                                                    minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9,
                                                    background: 'var(--color-red-lebanese)', color: 'white',
                                                    fontSize: 10, fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {(item.badge as number) > 99 ? '99+' : item.badge as number}
                                                </span>
                                            )}
                                            <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            ))}

            {/* ── Logout ── */}
            <motion.div {...fadeUp(0.3)} style={{ padding: '24px 16px 0' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: 16, borderRadius: 16,
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        cursor: 'pointer', touchAction: 'manipulation', transition: 'all 200ms',
                    }}
                >
                    <LogOut size={17} style={{ color: 'var(--color-red-lebanese)' }} strokeWidth={1.6} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-red-lebanese)' }}>Cerrar Sesión</span>
                </button>
            </motion.div>

            {/* ── App Version ── */}
            <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 16 }}>
                <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Centro Libanes v2.0.0</p>
            </div>

            {/* ── QR Access Modal ── */}
            <AnimatePresence>
                {showQR && !isEmployee && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowQR(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 200,
                            background: 'rgba(0,0,0,0.85)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: 24,
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', duration: 0.4 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'white', borderRadius: 24, padding: 32,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
                                maxWidth: 320, width: '100%',
                            }}
                        >
                            <button onClick={() => setShowQR(false)}
                                style={{
                                    position: 'absolute', top: 16, right: 16,
                                    width: 36, height: 36, borderRadius: 18,
                                    background: 'rgba(255,255,255,0.1)', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', touchAction: 'manipulation',
                                    color: 'white',
                                }}>
                                <X size={20} />
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 10, color: '#6B7280', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Centro Libanés</p>
                                <p style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Credencial de Acceso</p>
                            </div>

                            <div style={{
                                padding: 16, borderRadius: 16,
                                background: '#F9FAFB', border: '2px solid #E5E7EB',
                            }}>
                                <QRCodeSVG
                                    value={`CL-${user.member_number}`}
                                    size={200}
                                    level="H"
                                    bgColor="#F9FAFB"
                                    fgColor="#111827"
                                />
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 28, fontWeight: 700, color: '#111827', letterSpacing: 4 }}>{user.member_number}</p>
                                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{user.first_name} {user.last_name}</p>
                                <p style={{
                                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                                    color: '#C9A84C', marginTop: 8,
                                }}>Socio {user.tier ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1) : 'Activo'}</p>
                                {user.join_date && (
                                    <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
                                        Miembro desde {new Date(user.join_date).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                                    </p>
                                )}
                            </div>

                            <p style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.5 }}>
                                Muestra este código en recepción cuando el lector de palma no esté disponible
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
