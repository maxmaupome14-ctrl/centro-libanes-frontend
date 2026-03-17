import { useState, useEffect } from 'react';
import { X, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';

interface Props {
    userId: string;
}

export function HospitalityCard({ userId }: Props) {
    const [anniversary, setAnniversary] = useState<{ years: number } | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check for anniversary via profile
        const key = `cl-anniversary-${new Date().toISOString().split('T')[0]}`;
        if (sessionStorage.getItem(key)) return;

        api.get('/profile/me')
            .then(res => {
                const joinDate = res.data?.created_at || res.data?.join_date || res.data?.membership_start;
                if (!joinDate) return;
                const join = new Date(joinDate);
                const today = new Date();
                if (join.getMonth() === today.getMonth() && join.getDate() === today.getDate()) {
                    const years = today.getFullYear() - join.getFullYear();
                    if (years > 0) {
                        setAnniversary({ years });
                    }
                }
            })
            .catch(() => {});
    }, [userId]);

    if (!anniversary || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{
                    margin: '0 16px 16px',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.02))',
                    border: '1px solid rgba(201,168,76,0.2)',
                }}
            >
                <div style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'rgba(var(--color-gold-rgb, 201,168,76), 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Award size={18} style={{ color: 'var(--color-gold)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            ¡Feliz aniversario!
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2, lineHeight: 1.625 }}>
                            {anniversary.years === 1
                                ? '1 año como socio del Centro Libanés'
                                : `${anniversary.years} años como socio del Centro Libanés`
                            }
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setDismissed(true);
                            const key = `cl-anniversary-${new Date().toISOString().split('T')[0]}`;
                            sessionStorage.setItem(key, '1');
                        }}
                        style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'var(--color-surface-hover)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, cursor: 'pointer', touchAction: 'manipulation', border: 'none',
                        }}
                    >
                        <X size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
