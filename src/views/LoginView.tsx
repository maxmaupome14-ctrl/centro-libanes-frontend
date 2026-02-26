import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Shield, Fingerprint, ChevronLeft, User, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const LoginView = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    // Lobby choice: member or employee
    const [userType, setUserType] = useState<'member' | 'employee' | null>(null);

    // Member flow
    const [step, setStep] = useState<'membresia' | 'perfil' | 'pin'>('membresia');
    const [memberNum, setMemberNum] = useState('');
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [pin, setPin] = useState('');

    // Employee flow
    const [empUsername, setEmpUsername] = useState('');
    const [empPassword, setEmpPassword] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    /* ── Member Handlers ── */
    const handleLookupMembership = async () => {
        setError('');
        setIsLoading(true);
        try {
            const res = await api.post('/auth/select-profile', { member_number: memberNum });
            setProfiles(res.data.profiles);
            setStep('perfil');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error buscando socio');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMemberLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            const payload = {
                profile_id: selectedProfile.id,
                pin: selectedProfile.is_minor ? pin : undefined,
                password: selectedProfile.is_minor ? undefined : 'demo123'
            };
            const res = await api.post('/auth/login', payload);
            const userData = {
                id: res.data.user?.id || selectedProfile.id,
                membership_id: res.data.user?.membership_id || '',
                member_number: String(res.data.user?.member_number || memberNum),
                role: res.data.user?.role || selectedProfile.role,
                first_name: res.data.user?.first_name || selectedProfile.first_name,
                last_name: res.data.user?.last_name || selectedProfile.last_name,
                user_type: 'member' as const,
            };
            login(userData, res.data.token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'PIN incorrecto');
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Employee Handlers ── */
    const handleEmployeeLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            const res = await api.post('/auth/staff-login', {
                username: empUsername,
                password: empPassword,
            });
            const staff = res.data.staff;
            const userData = {
                id: staff.id,
                membership_id: '',
                member_number: '',
                role: staff.role,
                first_name: staff.name.split(' ')[0] || staff.name,
                last_name: staff.name.split(' ').slice(1).join(' ') || '',
                user_type: 'employee' as const,
                unit_name: staff.unit_name || '',
            };
            login(userData, res.data.token);
            navigate('/employee');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Credenciales incorrectas');
        } finally {
            setIsLoading(false);
        }
    };

    const slideVariants = {
        enter: { opacity: 0, x: 30, scale: 0.98 },
        center: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: -30, scale: 0.98 },
    };

    const goBack = () => {
        setUserType(null);
        setStep('membresia');
        setMemberNum('');
        setProfiles([]);
        setSelectedProfile(null);
        setPin('');
        setEmpUsername('');
        setEmpPassword('');
        setError('');
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 relative overflow-hidden">

            {/* Background blurs */}
            <div className="absolute top-[-20%] left-[-15%] w-[500px] h-[500px] rounded-full bg-[var(--color-green-cedar)] opacity-[0.03] blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[var(--color-gold)] opacity-[0.04] blur-[120px]" />

            <AnimatePresence mode="wait">

                {/* ═══════════ LOBBY: MEMBER OR EMPLOYEE ═══════════ */}
                {!userType && (
                    <motion.div
                        key="lobby"
                        variants={slideVariants}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
                        className="w-full max-w-[340px] flex flex-col items-center text-center"
                    >
                        <div className="mb-10">
                            <img src="/logo.png" alt="Centro Libanés" className="h-24 w-auto mx-auto object-contain" />
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                            Bienvenido
                        </h1>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-10">
                            ¿Cómo deseas ingresar?
                        </p>

                        <div className="w-full flex flex-col gap-3">
                            <button
                                onClick={() => setUserType('member')}
                                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(0,90,54,0.1)' }}>
                                    <User size={22} className="text-[var(--color-green-cedar)]" strokeWidth={1.6} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">Soy Miembro</p>
                                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Ingresa con tu número de membresía</p>
                                </div>
                                <ChevronLeft size={16} className="text-[var(--color-text-tertiary)] rotate-180 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => setUserType('employee')}
                                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(201,168,76,0.1)' }}>
                                    <Briefcase size={22} className="text-[var(--color-gold)]" strokeWidth={1.6} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">Soy Empleado</p>
                                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">Ingresa con usuario y contraseña</p>
                                </div>
                                <ChevronLeft size={16} className="text-[var(--color-text-tertiary)] rotate-180 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════ MEMBER FLOW: STEP 1 — MEMBRESÍA ═══════════ */}
                {userType === 'member' && step === 'membresia' && (
                    <motion.div
                        key="member-step1"
                        variants={slideVariants}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
                        className="w-full max-w-[340px] flex flex-col items-center text-center"
                    >
                        <div className="mb-8">
                            <img src="/logo.png" alt="Centro Libanés" className="h-20 w-auto mx-auto object-contain" />
                        </div>

                        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                            Acceso Miembros
                        </h1>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                            Ingresa tu número de membresía
                        </p>

                        <input
                            type="text"
                            maxLength={6}
                            inputMode="numeric"
                            className="w-full bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-2xl h-14 text-center text-2xl font-bold tracking-[0.15em] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50 focus:border-[var(--color-gold)] transition-all"
                            placeholder="31505"
                            value={memberNum}
                            onChange={e => setMemberNum(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={e => e.key === 'Enter' && memberNum && handleLookupMembership()}
                            autoFocus
                        />

                        {error && <p className="text-[var(--color-red-lebanese)] text-sm mt-3">{error}</p>}

                        <Button size="lg" className="w-full mt-6" onClick={handleLookupMembership} disabled={isLoading || !memberNum} isLoading={isLoading}>
                            Continuar
                        </Button>

                        <button className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] mt-8 w-full transition-colors" onClick={goBack}>
                            <ChevronLeft size={16} /> Regresar
                        </button>
                    </motion.div>
                )}

                {/* ═══════════ MEMBER FLOW: STEP 2 — PERFIL ═══════════ */}
                {userType === 'member' && step === 'perfil' && (
                    <motion.div
                        key="member-step2"
                        variants={slideVariants}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
                        className="w-full max-w-[380px]"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">¿Quién eres?</h2>
                            <p className="text-sm text-[var(--color-text-tertiary)] mt-1.5">
                                Membresía <span className="text-[var(--color-gold)] font-semibold">{memberNum}</span>
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto scrollbar-none">
                            {profiles.map((p) => (
                                <motion.button
                                    key={p.id}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]"
                                    onClick={() => { setSelectedProfile(p); setError(''); setStep('pin'); }}
                                >
                                    <div className="w-12 h-12 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-strong)] flex items-center justify-center text-sm font-bold text-[var(--color-gold)] shrink-0">
                                        {p.first_name[0]}{p.last_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[var(--color-text-primary)] text-[15px]">{p.first_name} {p.last_name}</p>
                                        <p className="text-xs text-[var(--color-text-tertiary)] capitalize mt-0.5">{p.role}</p>
                                    </div>
                                    {p.is_minor && <Shield size={16} className="text-[var(--color-gold)] shrink-0" />}
                                </motion.button>
                            ))}
                        </div>

                        <button className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] mt-8 w-full transition-colors"
                            onClick={() => { setStep('membresia'); setProfiles([]); }}>
                            <ChevronLeft size={16} /> Cambiar membresía
                        </button>
                    </motion.div>
                )}

                {/* ═══════════ MEMBER FLOW: STEP 3 — PIN ═══════════ */}
                {userType === 'member' && step === 'pin' && (
                    <motion.div
                        key="member-step3"
                        variants={slideVariants}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
                        className="w-full max-w-[300px] text-center"
                    >
                        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-[var(--color-gold)] bg-[var(--color-surface)] border-2 border-[var(--color-gold)]/30 mb-6 shadow-[0_0_30px_rgba(201,168,76,0.1)]">
                            {selectedProfile?.first_name[0]}{selectedProfile?.last_name[0]}
                        </div>

                        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Hola, {selectedProfile?.first_name}</h2>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                            {selectedProfile?.is_minor ? 'Ingresa tu PIN de 4 dígitos' : 'Verifica tu identidad'}
                        </p>

                        {error && <p className="text-[var(--color-red-lebanese)] text-sm mb-4">{error}</p>}

                        {selectedProfile?.is_minor ? (
                            <>
                                <input
                                    type="password" maxLength={4} inputMode="numeric"
                                    className="w-full bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-2xl h-14 text-center text-3xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50 focus:border-[var(--color-gold)] transition-all mb-6"
                                    value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={e => e.key === 'Enter' && pin.length >= 4 && handleMemberLogin()}
                                    autoFocus
                                />
                                <Button size="lg" className="w-full" onClick={handleMemberLogin} disabled={isLoading || pin.length < 4} isLoading={isLoading}>
                                    Entrar
                                </Button>
                            </>
                        ) : (
                            <Button size="lg" className="w-full" onClick={handleMemberLogin} disabled={isLoading} isLoading={isLoading}>
                                <Fingerprint size={20} /> Usar Biometría
                            </Button>
                        )}

                        <button className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] mt-8 w-full transition-colors"
                            onClick={() => { setStep('perfil'); setPin(''); setError(''); }}>
                            <ChevronLeft size={16} /> Cambiar perfil
                        </button>
                    </motion.div>
                )}

                {/* ═══════════ EMPLOYEE FLOW ═══════════ */}
                {userType === 'employee' && (
                    <motion.div
                        key="employee"
                        variants={slideVariants}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
                        className="w-full max-w-[340px] flex flex-col items-center text-center"
                    >
                        <div className="mb-8">
                            <img src="/logo.png" alt="Centro Libanés" className="h-20 w-auto mx-auto object-contain" />
                        </div>

                        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                            Acceso Empleados
                        </h1>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                            Ingresa tus credenciales
                        </p>

                        <div className="w-full space-y-3 mb-4">
                            <input
                                type="text"
                                className="w-full bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-2xl h-14 px-5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50 focus:border-[var(--color-gold)] transition-all"
                                placeholder="Usuario"
                                value={empUsername}
                                onChange={e => setEmpUsername(e.target.value)}
                                autoFocus
                            />
                            <input
                                type="password"
                                className="w-full bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-2xl h-14 px-5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50 focus:border-[var(--color-gold)] transition-all"
                                placeholder="Contraseña"
                                value={empPassword}
                                onChange={e => setEmpPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && empUsername && empPassword && handleEmployeeLogin()}
                            />
                        </div>

                        {error && <p className="text-[var(--color-red-lebanese)] text-sm mb-3">{error}</p>}

                        <Button size="lg" className="w-full" onClick={handleEmployeeLogin} disabled={isLoading || !empUsername || !empPassword} isLoading={isLoading}>
                            <Briefcase size={18} /> Ingresar
                        </Button>

                        <button className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] mt-8 w-full transition-colors" onClick={goBack}>
                            <ChevronLeft size={16} /> Regresar
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};
