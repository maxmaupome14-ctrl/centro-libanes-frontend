import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from './Toast';

interface RatingSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitted: () => void;
    reservationId: string;
    staffId?: string;
    serviceId?: string;
    resourceType?: string;
    itemName: string;
    staffName?: string;
}

export function RatingSheet({
    isOpen, onClose, onSubmitted,
    reservationId, staffId, serviceId, resourceType,
    itemName, staffName,
}: RatingSheetProps) {
    const [score, setScore] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    const LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

    const handleSubmit = async () => {
        if (score === 0) {
            showToast('Selecciona una calificación', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/ratings', {
                reservation_id: reservationId,
                staff_id: staffId || undefined,
                service_id: serviceId || undefined,
                resource_type: resourceType || undefined,
                score,
                comment: comment.trim() || undefined,
                is_anonymous: anonymous,
            });
            showToast('Gracias por tu calificación', 'success');
            onSubmitted();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Error al enviar', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
                    />
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                            background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
                            maxWidth: 430, margin: '0 auto',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
                        </div>

                        <div style={{ padding: '8px 20px 32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Calificar</h2>
                                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, touchAction: 'manipulation' }}>
                                    <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                                </button>
                            </div>

                            {/* What they're rating */}
                            <p style={{ fontSize: 15, color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 4 }}>
                                {itemName}
                            </p>
                            {staffName && (
                                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                                    con {staffName}
                                </p>
                            )}

                            {/* Stars */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        onMouseEnter={() => setHovered(n)}
                                        onMouseLeave={() => setHovered(0)}
                                        onClick={() => setScore(n)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            padding: 4, touchAction: 'manipulation',
                                            transition: 'transform 150ms',
                                            transform: (hovered === n || score === n) ? 'scale(1.15)' : 'scale(1)',
                                        }}
                                    >
                                        <Star
                                            size={36}
                                            fill={n <= (hovered || score) ? '#C9A84C' : 'none'}
                                            style={{ color: n <= (hovered || score) ? '#C9A84C' : 'var(--color-border)' }}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Label */}
                            <p style={{
                                textAlign: 'center', fontSize: 14, fontWeight: 600, marginBottom: 20,
                                color: score > 0 ? '#C9A84C' : 'var(--color-text-tertiary)',
                                minHeight: 20,
                            }}>
                                {LABELS[hovered || score] || 'Toca una estrella'}
                            </p>

                            {/* Comment */}
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="¿Algo que quieras compartir? (opcional)"
                                rows={3}
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: 10,
                                    background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)', fontSize: 14, resize: 'none',
                                    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                                    marginBottom: 12,
                                }}
                            />

                            {/* Anonymous toggle */}
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                                cursor: 'pointer', touchAction: 'manipulation',
                            }}>
                                <div
                                    onClick={() => setAnonymous(!anonymous)}
                                    style={{
                                        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                                        border: `2px solid ${anonymous ? '#C9A84C' : 'var(--color-border)'}`,
                                        background: anonymous ? '#C9A84C' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    {anonymous && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                                </div>
                                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Publicar de forma anónima</span>
                            </label>

                            {/* Submit */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSubmit}
                                disabled={submitting || score === 0}
                                style={{
                                    width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                                    background: '#C9A84C',
                                    opacity: (submitting || score === 0) ? 0.5 : 1,
                                    color: '#fff', fontSize: 16, fontWeight: 700,
                                    cursor: 'pointer', touchAction: 'manipulation',
                                }}
                            >
                                {submitting ? 'Enviando...' : 'Enviar calificación'}
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/** Small inline star display for showing average ratings */
export function StarDisplay({ score, count, size = 14 }: { score: number; count?: number; size?: number }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Star size={size} fill="#C9A84C" style={{ color: '#C9A84C' }} />
            <span style={{ fontSize: size - 2, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {score.toFixed(1)}
            </span>
            {count != null && (
                <span style={{ fontSize: size - 3, color: 'var(--color-text-tertiary)' }}>({count})</span>
            )}
        </span>
    );
}
