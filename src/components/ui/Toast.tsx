import { useState, useEffect, useCallback, createContext, useContext } from 'react';
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

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
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
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] w-full max-w-[400px] px-4 flex flex-col gap-2 pointer-events-none">
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
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md ${
                isError
                    ? 'bg-[var(--color-red-lebanese)]/15 border-[var(--color-red-lebanese)]/30'
                    : 'bg-emerald-500/15 border-emerald-500/30'
            }`}
        >
            {isError
                ? <AlertCircle size={18} className="text-[var(--color-red-lebanese)] shrink-0 mt-0.5" />
                : <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            }
            <p className={`text-sm font-medium flex-1 ${isError ? 'text-[var(--color-red-lebanese)]' : 'text-emerald-400'}`}>
                {toast.message}
            </p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            >
                <X size={14} className={isError ? 'text-[var(--color-red-lebanese)]' : 'text-emerald-400'} />
            </button>
        </motion.div>
    );
};
