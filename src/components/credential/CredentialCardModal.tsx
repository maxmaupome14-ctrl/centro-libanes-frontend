import { useEffect } from 'react';
import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';
import { useToast } from '../ui/Toast';

/* Apple Wallet mark — stacked-card icon matching Apple HIG wallet glyph */
const AppleWalletMark = () => (
    <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="8" width="90" height="104" rx="16" fill="black"/>
        <rect x="15" y="8" width="90" height="104" rx="16" stroke="white" strokeWidth="2"/>
        <rect x="15" y="24" width="90" height="18" fill="#FF3B30"/>
        <rect x="15" y="42" width="90" height="18" fill="#FF9500"/>
        <rect x="15" y="60" width="90" height="18" fill="#FFCC00"/>
        <rect x="15" y="78" width="90" height="18" fill="#34C759"/>
    </svg>
);

interface Props {
    open: boolean;
    onClose: () => void;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        member_number: string;
        role: string;
        photo_url?: string;
    };
}

export function CredentialCardModal({ open, onClose, user }: Props) {
    const resolved = useThemeStore((s) => s.resolved);
    const isDark = resolved === 'dark';
    const { showToast } = useToast();

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 90,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)',
                    }}
                    onClick={onClose}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                            border: 'none',
                        }}
                    >
                        <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                    </button>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            width: 320,
                            borderRadius: 24,
                            overflow: 'hidden',
                            background: 'linear-gradient(155deg, #003D24 0%, #005A36 40%, #007A4A 100%)',
                            boxShadow: '0 20px 60px rgba(0,60,36,0.4), 0 8px 20px rgba(0,0,0,0.15)',
                        }}
                    >
                        {/* Gold shimmer border (dark mode only) */}
                        {isDark && (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 24,
                                    pointerEvents: 'none',
                                    padding: 2,
                                    background: 'linear-gradient(135deg, transparent 25%, #C9A84C 50%, transparent 75%)',
                                    backgroundSize: '200% 200%',
                                    animation: 'shimmer-border 3s ease-in-out infinite',
                                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                    WebkitMaskComposite: 'xor',
                                    maskComposite: 'exclude',
                                }}
                            />
                        )}

                        <div style={{ position: 'relative', padding: 24, paddingTop: 32 }}>
                            {/* Club header */}
                            <div style={{ marginBottom: 32 }}>
                                <img src="/logo.png" alt="Centro Libanés" style={{ height: 32, width: 'auto', objectFit: 'contain', opacity: 0.9 }} />
                            </div>

                            {/* Avatar + Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                                {user.photo_url ? (
                                    <img src={user.photo_url} alt="" style={{
                                        width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)',
                                        objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    }} />
                                ) : (
                                    <div style={{
                                        width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        background: 'rgba(201,168,76,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    }}>
                                        <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: 18 }}>
                                            {user.first_name?.[0]}{user.last_name?.[0]}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
                                        {user.first_name} {user.last_name}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textTransform: 'capitalize', marginTop: 2 }}>{user.role}</p>
                                </div>
                            </div>

                            {/* Member number */}
                            <div style={{ marginBottom: 24 }}>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>No. Socio</p>
                                <p style={{ color: '#fff', fontWeight: 700, fontSize: 24, letterSpacing: 5 }}>{user.member_number}</p>
                            </div>

                            {/* QR Code */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                                <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                                    <QRCodeSVG
                                        value={`CL-MEMBER:${user.id}`}
                                        size={160}
                                        level="M"
                                        bgColor="#FFFFFF"
                                        fgColor="#003D24"
                                    />
                                </div>
                            </div>

                            {/* Add to Apple Wallet */}
                            <button
                                onClick={() => showToast('Próximamente — integración con Apple Wallet', 'success')}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    height: 44,
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    background: '#000',
                                    touchAction: 'manipulation',
                                    border: 'none',
                                    transition: 'background-color 0.15s',
                                }}
                            >
                                <AppleWalletMark />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: 500, letterSpacing: '0.05em' }}>ADD TO</span>
                                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginTop: -1 }}>Apple Wallet</span>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
