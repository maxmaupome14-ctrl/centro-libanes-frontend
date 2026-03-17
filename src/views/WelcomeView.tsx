import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const ANIM_DURATION = 1900;

function getTimeGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

function ConfettiBurst() {
    const particles = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 200 - 100,
            y: -(Math.random() * 200 + 100),
            rotation: Math.random() * 720 - 360,
            color: ['#C9A84C', '#007A4A', '#EF4444', '#06B6D4', '#8B5CF6', '#F59E0B'][i % 6],
            delay: Math.random() * 0.3,
            size: 6 + Math.random() * 6,
        })),
    []);

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    style={{
                        position: 'absolute', borderRadius: 2,
                        width: p.size, height: p.size,
                        background: p.color, left: '50%', top: '50%',
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotation }}
                    transition={{ duration: 1.5, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
                />
            ))}
        </div>
    );
}

export const WelcomeView = () => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const [phase, setPhase] = useState<'logo' | 'greeting' | 'card' | 'exit'>('logo');
    const prefersReduced = useRef(
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    const greeting = useMemo(() => getTimeGreeting(), []);
    const [isBirthday, setIsBirthday] = useState(false);

    useEffect(() => {
        if (!user) return;
        import('../services/api').then(({ api }) => {
            Promise.allSettled([
                api.get('/profile/me').then(res => {
                    const bday = res.data?.birthday || res.data?.birth_date;
                    if (bday) {
                        const today = new Date();
                        const bd = new Date(bday);
                        if (bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate()) {
                            setIsBirthday(true);
                        }
                    }
                }),
                api.get('/notifications/my'),
                api.get('/reservations/my/upcoming'),
                api.get('/events'),
            ]);
        });
    }, [user]);

    useEffect(() => {
        if (sessionStorage.getItem('cl-welcome-shown') || !user) {
            navigate('/', { replace: true });
            return;
        }

        sessionStorage.setItem('cl-welcome-shown', '1');

        if (prefersReduced.current) {
            setPhase('greeting');
            const t = setTimeout(() => navigate('/', { replace: true }), 1200);
            return () => clearTimeout(t);
        }

        const t1 = setTimeout(() => setPhase('greeting'), 600);
        const t2 = setTimeout(() => setPhase('card'), 1400);
        const t3 = setTimeout(() => {
            setPhase('exit');
            setTimeout(() => navigate('/', { replace: true }), 200);
        }, ANIM_DURATION);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [navigate, user]);

    if (!user) return null;

    const greetingText = isBirthday
        ? `¡Feliz cumpleaños, ${user.first_name}! 🎂`
        : `${greeting}, ${user.first_name}`;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'var(--color-bg)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
        }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 600, height: 600, borderRadius: '50%',
                opacity: 0.06, filter: 'blur(150px)',
                background: 'radial-gradient(circle, var(--color-green-cedar), transparent)',
            }} />

            {isBirthday && phase === 'greeting' && <ConfettiBurst />}

            <AnimatePresence mode="wait">
                {phase === 'logo' && (
                    <motion.div
                        key="logo"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <img src="/logo.png" alt="Centro Libanés" style={{ height: 112, width: 'auto', objectFit: 'contain' }} />
                    </motion.div>
                )}

                {phase === 'greeting' && (
                    <motion.div
                        key="greeting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 32px' }}
                    >
                        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                            {greetingText}
                        </h1>
                    </motion.div>
                )}

                {phase === 'card' && (
                    <motion.div
                        key="card"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 32px' }}
                    >
                        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', marginBottom: 24 }}>
                            {greetingText}
                        </h1>
                        <div style={{
                            width: 280, borderRadius: 16, padding: 20, textAlign: 'center',
                            background: 'linear-gradient(145deg, #003D24, #005A36)',
                            boxShadow: '0 12px 40px rgba(0,60,36,0.35)',
                        }}>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Credencial Digital</p>
                            <p style={{ color: 'white', fontWeight: 700, letterSpacing: 5, fontSize: 24 }}>{user.member_number}</p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8, textTransform: 'capitalize' }}>{user.role}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
