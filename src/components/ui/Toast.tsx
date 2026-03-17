import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertCircle, Check } from 'lucide-react';

type ToastType = 'error' | 'success';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

let _nextId = 0;

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'error') => {
        const id = _nextId++;
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999,
                width: '100%',
                maxWidth: 400,
                padding: '0 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                pointerEvents: 'none',
            }}>
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const isError = toast.type === 'error';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 16,
                borderRadius: 16,
                border: isError
                    ? '1px solid rgba(var(--color-red-lebanese-rgb, 220,38,38), 0.3)'
                    : '1px solid rgba(16,185,129,0.3)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                background: isError
                    ? 'rgba(var(--color-red-lebanese-rgb, 220,38,38), 0.15)'
                    : 'rgba(16,185,129,0.15)',
            }}
        >
            {isError
                ? <AlertCircle size={18} style={{ color: 'var(--color-red-lebanese)', flexShrink: 0, marginTop: 2 }} />
                : <Check size={18} style={{ color: '#34d399', flexShrink: 0, marginTop: 2 }} />
            }
            <p style={{
                fontSize: 14, fontWeight: 500, flex: 1,
                color: isError ? 'var(--color-red-lebanese)' : '#34d399',
            }}>
                {toast.message}
            </p>
            <button
                onClick={() => onDismiss(toast.id)}
                style={{ flexShrink: 0, opacity: 0.5, cursor: 'pointer', touchAction: 'manipulation', border: 'none', background: 'none', padding: 0 }}
            >
                <X size={14} style={{ color: isError ? 'var(--color-red-lebanese)' : '#34d399' }} />
            </button>
        </motion.div>
    );
};
