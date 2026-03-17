import { useState } from 'react';
import { X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, type FamilyProfile } from '../../store/authStore';
import { api } from '../../services/api';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function ProfileSwitcher({ open, onClose }: Props) {
    const { user, familyProfiles, memberCredentials, switchProfile } = useAuthStore();
    const [switching, setSwitching] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleSwitch = async (profile: FamilyProfile) => {
        if (profile.id === user?.id) {
            onClose();
            return;
        }
        if (!memberCredentials) return;

        setSwitching(profile.id);
        setError('');

        try {
            const payload = {
                profile_id: profile.id,
                pin: profile.is_minor ? memberCredentials.pin : undefined,
                password: profile.is_minor ? undefined : memberCredentials.password,
            };
            const res = await api.post('/auth/login', payload);
            const userData = {
                id: res.data.user?.id || profile.id,
                membership_id: res.data.user?.membership_id || '',
                member_number: String(res.data.user?.member_number || user?.member_number || ''),
                role: res.data.user?.role || profile.role,
                first_name: res.data.user?.first_name || profile.first_name,
                last_name: res.data.user?.last_name || profile.last_name,
                user_type: 'member' as const,
            };
            switchProfile(userData, res.data.token);
            onClose();
        } catch {
            setError('No se pudo cambiar de perfil');
        } finally {
            setSwitching(null);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.5)' }}
                        onClick={onClose}
                    />
                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 81,
                            background: 'var(--color-surface)',
                            borderRadius: '24px 24px 0 0',
                            maxHeight: '70vh',
                            overflowY: 'auto',
                            paddingBottom: 'env(safe-area-inset-bottom, 20px)',
                        }}
                    >
                        {/* Handle */}
                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
                            <div style={{ width: 40, height: 4, borderRadius: 9999, background: 'var(--color-border-strong)' }} />
                        </div>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Cambiar Perfil</h2>
                            <button onClick={onClose} style={{
                                width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-hover)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', touchAction: 'manipulation', border: 'none',
                            }}>
                                <X size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                            </button>
                        </div>

                        {error && (
                            <p style={{ color: 'var(--color-red-lebanese)', fontSize: 14, padding: '0 16px', marginBottom: 8 }}>{error}</p>
                        )}

                        {/* Profile list */}
                        <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {familyProfiles.map((p) => {
                                const isActive = p.id === user?.id;
                                const isLoading = switching === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSwitch(p)}
                                        disabled={isLoading}
                                        style={{
                                            touchAction: 'manipulation',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 14,
                                            padding: 16,
                                            borderRadius: 16,
                                            border: isActive
                                                ? '1px solid rgba(var(--color-gold-rgb, 201,168,76), 0.3)'
                                                : '1px solid var(--color-border)',
                                            background: isActive
                                                ? 'rgba(var(--color-gold-rgb, 201,168,76), 0.05)'
                                                : 'var(--color-surface)',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 14, fontWeight: 700, flexShrink: 0,
                                            ...(isActive
                                                ? {
                                                    background: 'rgba(var(--color-gold-rgb, 201,168,76), 0.15)',
                                                    color: 'var(--color-gold)',
                                                    border: '2px solid rgba(var(--color-gold-rgb, 201,168,76), 0.3)',
                                                }
                                                : {
                                                    background: 'var(--color-surface-hover)',
                                                    color: 'var(--color-text-secondary)',
                                                    border: '1px solid var(--color-border-strong)',
                                                }),
                                        }}>
                                            {isLoading ? (
                                                <div className="animate-spin" style={{
                                                    width: 16, height: 16, borderRadius: '50%',
                                                    border: '2px solid var(--color-gold)',
                                                    borderTopColor: 'transparent',
                                                }} />
                                            ) : (
                                                <>{p.first_name[0]}{p.last_name[0]}</>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: 14, fontWeight: 600,
                                                color: isActive ? 'var(--color-gold)' : 'var(--color-text-primary)',
                                            }}>
                                                {p.first_name} {p.last_name}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>{p.role}</span>
                                                {p.is_minor && (
                                                    <span style={{
                                                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                                        background: 'rgba(var(--color-gold-rgb, 201,168,76), 0.1)',
                                                        color: 'var(--color-gold)', fontWeight: 600,
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                    }}>
                                                        <Shield size={10} /> Menor
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {isActive && (
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Activo</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
