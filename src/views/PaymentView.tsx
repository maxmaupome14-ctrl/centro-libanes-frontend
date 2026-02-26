import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { ArrowLeft, CreditCard, Apple, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PaymentView = () => {
    const navigate = useNavigate();
    const [statement, setStatement] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [paymentStep, setPaymentStep] = useState<'summary' | 'processing' | 'success'>('summary');
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'apple_pay'>('card');

    useEffect(() => {
        const fetchStatement = async () => {
            try {
                // To fetch statement we use the /api/membership/{id}/statement. 
                // We'll use a mocked id for now as in FamilyView until user context is fully globalized with membership_id
                const userRaw = localStorage.getItem('auth-storage');
                const userData = userRaw ? JSON.parse(userRaw).state.user : null;
                if (!userData?.membership_id) return;

                const res = await api.get(`/membership/${userData.membership_id}/statement`);
                setStatement(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatement();
    }, []);

    const handleCheckout = async () => {
        setPaymentStep('processing');
        try {
            // Mock gateway delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            await api.post('/payments/checkout', {
                amount: statement?.total_due,
                source_type: selectedMethod,
                source_id: 'statement_payment'
            });

            setPaymentStep('success');
        } catch (err: any) {
            alert('Error processing payment: ' + (err.response?.data?.error || err.message));
            setPaymentStep('summary');
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-text-tertiary)]">Cargando estado de cuenta...</div>;
    }

    if (!statement) {
        return <div className="min-h-screen bg-[var(--color-bg)] p-5 text-center text-[var(--color-text-tertiary)] pt-20">No se encontró estado de cuenta</div>;
    }

    return (
        <div className="pb-24 max-w-[480px] mx-auto min-h-screen bg-[var(--color-bg)]">
            {/* Header */}
            <div className="sticky top-0 z-50 glass px-5 h-14 flex items-center gap-3 border-b border-[var(--color-border)]">
                <Link to="/family" className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-text-primary)]">
                    <ArrowLeft size={18} />
                </Link>
                <span className="text-[13px] font-bold tracking-wider uppercase">Pago en línea</span>
            </div>

            <div className="px-5 py-6">
                <AnimatePresence mode="wait">
                    {paymentStep === 'summary' && (
                        <motion.div
                            key="summary"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Total Card */}
                            <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] text-center shadow-sm">
                                <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Total a Pagar</p>
                                <h1 className="text-4xl font-bold font-display text-[var(--color-text-primary)] tracking-tight">
                                    ${statement.total_due?.toLocaleString('es-MX')} <span className="text-lg text-[var(--color-text-tertiary)] font-normal">MXN</span>
                                </h1>
                                <p className="text-xs text-[var(--color-text-tertiary)] mt-2">Membresía {statement.membership_number}</p>
                            </div>

                            {/* Payment Methods */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--color-text-tertiary)] ml-1">Método de Pago</h3>

                                <button
                                    onClick={() => setSelectedMethod('card')}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedMethod === 'card'
                                        ? 'bg-[var(--color-surface)] border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]/20 shadow-sm'
                                        : 'bg-[var(--color-surface-hover)] border-[var(--color-border)]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMethod === 'card' ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)]' : 'bg-[var(--color-surface)] text-[var(--color-text-tertiary)]'}`}>
                                            <CreditCard size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[13px] font-bold text-[var(--color-text-primary)]">Tarjeta Guardada</p>
                                            <p className="text-[11px] text-[var(--color-text-tertiary)]">•••• •••• •••• 4242</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'card' ? 'border-[var(--color-gold)]' : 'border-[var(--color-border-strong)]'}`}>
                                        {selectedMethod === 'card' && <div className="w-2.5 h-2.5 bg-[var(--color-gold)] rounded-full" />}
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('apple_pay')}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedMethod === 'apple_pay'
                                        ? 'bg-[var(--color-surface)] border-[var(--color-text-primary)] ring-1 ring-[var(--color-text-primary)]/20 shadow-sm'
                                        : 'bg-[var(--color-surface-hover)] border-[var(--color-border)]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMethod === 'apple_pay' ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]' : 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'}`}>
                                            <Apple size={20} fill="currentColor" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[13px] font-bold text-[var(--color-text-primary)]">Apple Pay</p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'apple_pay' ? 'border-[var(--color-text-primary)]' : 'border-[var(--color-border-strong)]'}`}>
                                        {selectedMethod === 'apple_pay' && <div className="w-2.5 h-2.5 bg-[var(--color-text-primary)] rounded-full" />}
                                    </div>
                                </button>
                            </div>

                            {/* Secure Footer */}
                            <div className="flex flex-col gap-3 pt-6">
                                <Button
                                    className={`w-full py-5 text-[15px] font-semibold ${selectedMethod === 'apple_pay' ? 'bg-black text-white hover:bg-gray-900 shadow-xl border-0' : ''}`}
                                    onClick={handleCheckout}
                                >
                                    {selectedMethod === 'apple_pay' ? (
                                        <span className="flex items-center justify-center gap-1.5">Pagar con <Apple size={16} fill="white" /></span>
                                    ) : (
                                        "Pagar $" + statement.total_due?.toLocaleString('es-MX')
                                    )}
                                </Button>
                                <p className="text-[10px] text-[var(--color-text-tertiary)] px-6 text-center leading-relaxed">
                                    Pago procesado de forma segura siguiendo estándares PCI-DSS. Su banco puede aplicar cargos adicionales.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {paymentStep === 'processing' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 space-y-4"
                        >
                            <div className="w-16 h-16 rounded-full border-4 border-[var(--color-gold)]/20 border-t-[var(--color-gold)] animate-spin" />
                            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Procesando Pago</h2>
                            <p className="text-sm text-[var(--color-text-tertiary)]">No cierres esta pantalla...</p>
                        </motion.div>
                    )}

                    {paymentStep === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-3xl text-center space-y-5 shadow-xl"
                        >
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full mx-auto flex items-center justify-center mb-2">
                                <CheckCircle2 size={40} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold font-display text-[var(--color-text-primary)] mb-1">Pago Exitoso</h2>
                                <p className="text-[13px] text-[var(--color-text-tertiary)] max-w-[200px] mx-auto leading-relaxed">
                                    Hemos recibido tu pago de ${statement.total_due?.toLocaleString('es-MX')} MXN correctamente.
                                </p>
                            </div>

                            <div className="bg-[var(--color-surface-hover)] p-4 rounded-xl text-left border border-[var(--color-border)]">
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-[11px] text-[var(--color-text-tertiary)]">Recibo</span>
                                    <span className="text-[11px] font-semibold text-[var(--color-text-primary)] font-mono">#{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-[11px] text-[var(--color-text-tertiary)]">Fecha</span>
                                    <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">{new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-[11px] text-[var(--color-text-tertiary)]">Método</span>
                                    <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">
                                        {selectedMethod === 'apple_pay' ? 'Apple Pay' : 'Terminada en 4242'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button className="w-full" onClick={() => navigate('/family')}>Volver a Familia</Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
