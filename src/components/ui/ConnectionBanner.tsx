import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, WifiOff } from 'lucide-react';

type State = 'idle' | 'slow' | 'offline';

/**
 * Aviso discreto cuando el servidor tarda (cold start de Railway ~15 s) o no responde.
 * Escucha los eventos que dispara src/services/api.ts.
 */
export const ConnectionBanner = () => {
    const [state, setState] = useState<State>('idle');

    useEffect(() => {
        const onSlow = () => setState(s => (s === 'offline' ? s : 'slow'));
        const onOffline = () => setState('offline');
        const onOk = () => setState('idle');
        window.addEventListener('api:slow', onSlow);
        window.addEventListener('api:offline', onOffline);
        window.addEventListener('api:ok', onOk);
        return () => {
            window.removeEventListener('api:slow', onSlow);
            window.removeEventListener('api:offline', onOffline);
            window.removeEventListener('api:ok', onOk);
        };
    }, []);

    const offline = state === 'offline';

    return (
        <AnimatePresence>
            {state !== 'idle' && (
                <motion.div
                    key={state}
                    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    role="status"
                    style={{
                        position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 10px)', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 900, maxWidth: 398, width: 'calc(100% - 32px)',
                        padding: '10px 14px', borderRadius: 14,
                        background: offline ? 'rgba(127,29,29,0.94)' : 'rgba(15,20,25,0.92)',
                        border: `1px solid ${offline ? 'rgba(239,68,68,0.5)' : 'rgba(201,168,76,0.4)'}`,
                        color: '#fff', fontSize: 12, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 10,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)',
                    }}
                >
                    {offline
                        ? <WifiOff size={15} style={{ color: '#FCA5A5', flexShrink: 0 }} />
                        : <Loader2 size={15} style={{ color: '#C9A84C', flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
                    <span style={{ lineHeight: 1.35 }}>
                        {offline
                            ? 'Sin conexión con el club. Revisa tu internet; reintentamos en automático.'
                            : 'Conectando con el club… el servidor está despertando, unos segundos.'}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
