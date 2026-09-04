import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import jsQR from 'jsqr';
import { X, Camera, Keyboard } from 'lucide-react';

/**
 * Lector de QR con la cámara del teléfono (sin apps externas).
 * Usa getUserMedia + jsQR; en navegadores sin cámara o sin permiso muestra un aviso
 * y deja al usuario escribir el código a mano.
 */
export const QrScanner = ({ onScan, onClose, title = 'Escanear QR', hint = 'Apunta al código QR del socio' }: {
    onScan: (text: string) => void;
    onClose: () => void;
    title?: string;
    hint?: string;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const doneRef = useRef(false);
    const onScanRef = useRef(onScan);
    onScanRef.current = onScan;
    const [error, setError] = useState<string | null>(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let raf = 0;
        let cancelled = false;

        const start = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setError('Este navegador no permite usar la cámara. Escribe el código a mano.');
                return;
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (!video || !canvas) return;
                video.srcObject = stream;
                video.setAttribute('playsinline', 'true');
                await video.play();
                setActive(true);
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;

                let frame = 0;
                const tick = () => {
                    if (cancelled || doneRef.current) return;
                    frame++;
                    if (frame % 2 === 0 && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
                        const scale = Math.min(1, 640 / video.videoWidth);
                        const w = Math.round(video.videoWidth * scale);
                        const h = Math.round(video.videoHeight * scale);
                        canvas.width = w; canvas.height = h;
                        ctx.drawImage(video, 0, 0, w, h);
                        const img = ctx.getImageData(0, 0, w, h);
                        const code = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
                        if (code?.data) {
                            doneRef.current = true;
                            try { navigator.vibrate?.(60); } catch { /* sin vibración */ }
                            onScanRef.current(code.data.trim());
                            return;
                        }
                    }
                    raf = requestAnimationFrame(tick);
                };
                raf = requestAnimationFrame(tick);
            } catch (e: any) {
                setError(e?.name === 'NotAllowedError'
                    ? 'Permiso de cámara denegado. Actívalo en los ajustes del navegador o escribe el código a mano.'
                    : 'No se pudo abrir la cámara. Escribe el código a mano.');
            }
        };
        start();
        // Si la cámara no arranca en 6 s (sin dispositivo, permiso colgado), ofrecer captura manual
        const watchdog = window.setTimeout(() => {
            if (!cancelled && !doneRef.current && !(videoRef.current && videoRef.current.srcObject)) {
                setError('No se pudo abrir la cámara. Escribe el código a mano.');
            }
        }, 6000);

        return () => {
            cancelled = true;
            clearTimeout(watchdog);
            cancelAnimationFrame(raf);
            stream?.getTracks().forEach(t => t.stop());
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000', display: 'flex', flexDirection: 'column' }}
        >
            <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: active ? 1 : 0 }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Top bar */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 14px', background: 'linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0))', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Camera size={16} />
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>{title}</span>
                </div>
                <button onClick={onClose} aria-label="Cerrar" style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>
                    <X size={18} />
                </button>
            </div>

            {/* Viewfinder */}
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!error && (
                    <div style={{ width: 240, height: 240, position: 'relative' }}>
                        {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
                            <span key={v + h} style={{
                                position: 'absolute', [v]: 0, [h]: 0, width: 34, height: 34,
                                borderTop: v === 'top' ? '3px solid #C9A84C' : 'none',
                                borderBottom: v === 'bottom' ? '3px solid #C9A84C' : 'none',
                                borderLeft: h === 'left' ? '3px solid #C9A84C' : 'none',
                                borderRight: h === 'right' ? '3px solid #C9A84C' : 'none',
                                borderRadius: 6,
                            }} />
                        ))}
                        {active && (
                            <motion.div
                                animate={{ top: ['8%', '88%', '8%'] }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ position: 'absolute', left: 12, right: 12, height: 2, background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)', boxShadow: '0 0 12px rgba(201,168,76,0.8)' }}
                            />
                        )}
                    </div>
                )}
                {error && (
                    <div style={{ margin: 24, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.08)', color: '#fff', textAlign: 'center', maxWidth: 320 }}>
                        <Keyboard size={22} style={{ marginBottom: 8, opacity: 0.8 }} />
                        <p style={{ fontSize: 13, lineHeight: 1.5 }}>{error}</p>
                    </div>
                )}
                {!error && !active && (
                    <p style={{ position: 'absolute', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Abriendo cámara…</p>
                )}
            </div>

            {/* Bottom */}
            <div style={{ position: 'relative', padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 20px)', background: 'linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0))', color: '#fff', textAlign: 'center' }}>
                <p style={{ fontSize: 12, opacity: 0.85, marginBottom: 12 }}>{hint}</p>
                <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Keyboard size={14} /> Escribir el código a mano
                </button>
            </div>
        </motion.div>
    );
};
