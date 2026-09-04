import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, WifiOff, AlertTriangle } from 'lucide-react';

type State = 'idle' | 'slow' | 'offline' | 'suspended';

/**
 * Aviso discreto arriba de la app:
 *  - servidor lento (cold start de Railway ~15 s) o sin conexión — eventos api:slow / api:offline / api:ok
 *  - membresía suspendida al intentar una acción bloqueada — evento api:suspended (se oculta solo)
 * Los eventos los dispara src/services/api.ts.
 */
export const ConnectionBanner = () => {
    const [state, setState] = useState<State>('idle');

    useEffect(() => {
        let hideTimer: number | null = null;
        const onSlow = () => setState(s => (s === 'offline' || s === 'suspended' ? s : 'slow'));
        const onOffline = () => setState('offline');
        const onOk = () => setState(s => (s === 'suspended' ? s : 'idle'));
        const onSuspended = () => {
            setState('suspended');
            if (hideTimer !== null) clearTimeout(hideTimer);
            hideTimer = window.setTimeout(() => setState(s => (s === 'suspended' ? 'idle' : s)), 6000);
        };
        window.addEventListener('api:slow', onSlow);
        window.addEventListener('api:offline', onOffline);
        window.addEventListener('api:ok', onOk);
        window.addEventListener('api:suspended', onSuspended);
        return () => {
            if (hideTimer !== null) clearTimeout(hideTimer);
            window.removeEventListener('api:slow', onSlow);
            window.removeEventListener('api:offline', onOffline);
            window.removeEventListener('api:ok', onOk);
            window.removeEventListener('api:suspended', onSuspended);
        };
    }, []);

    const offline = state === 'offline';
    const suspended = state === 'suspended';
    const alert = offline || suspended;

    return (
        <AnimatePresence>
            {state !== 'idle' && (
                <motion.div
                    key={state}
                    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.25 }}
                    role="status"
                    onClick={suspended ? () => { window.location.href = '/payment'; } : undefined}
                    style={{
                        position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 10px)', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 900, maxWidth: 398, width: 'calc(100% - 32px)',
                        padding: '10px 14px', borderRadius: 14,
                        background: alert ? 'rgba(127,29,29,0.94)' : 'rgba(15,20,25,0.92)',
                        border: `1px solid ${alert ? 'rgba(239,68,68,0.5)' : 'rgba(201,168,76,0.4)'}`,
                        color: '#fff', fontSize: 12, fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 10,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)',
                        cursor: suspended ? 'pointer' : 'default', touchAction: 'manipulation',
                    }}
                >
                    {offline
                        ? <WifiOff size={15} style={{ color: '#FCA5A5', flexShrink: 0 }} />
                        : suspended
                            ? <AlertTriangle size={15} style={{ color: '#FCA5A5', flexShrink: 0 }} />
                            : <Loader2 size={15} style={{ color: '#C9A84C', flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
                    <span style={{ lineHeight: 1.35 }}>
                        {offline
                            ? 'Sin conexión con el club. Revisa tu internet; reintentamos en automático.'
                            : suspended
                                ? 'Membresía suspendida. Toca aquí para ponerte al corriente en tu estado de cuenta.'
                                : 'Conectando con el club… el servidor está despertando, unos segundos.'}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
