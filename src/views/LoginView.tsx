import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Shield, Fingerprint, ChevronLeft, User, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const LoginView = () => {
    const navigate = useNavigate();
    const { login, setFamilyContext } = useAuthStore();

    // Lobby choice: member or employee
    const [userType, setUserType] = useState<'member' | 'employee' | null>(null);

    // Member flow
    const [step, setStep] = useState<'membresia' | 'perfil' | 'pin'>('membresia');
    const [memberNum, setMemberNum] = useState('');
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');

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
            if (res.data.profiles.length === 1) {
                setSelectedProfile(res.data.profiles[0]);
            }
            setStep('pin');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error buscando socio');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMemberLogin = async () => {
        setError('');
        setIsLoading(true);

        // If multiple profiles and none selected yet, show profile chooser
        if (profiles.length > 1 && !selectedProfile) {
            setIsLoading(false);
            setStep('perfil');
            return;
        }

        const profile = selectedProfile || profiles[0];

        try {
            const payload = {
                profile_id: profile.id,
                pin: profile.is_minor ? pin : undefined,
                password: profile.is_minor ? undefined : password,
            };
            const res = await api.post('/auth/login', payload);
            const userData = {
                id: res.data.user?.id || profile.id,
                membership_id: res.data.user?.membership_id || '',
                member_number: String(res.data.user?.member_number || memberNum),
                role: res.data.user?.role || profile.role,
                first_name: res.data.user?.first_name || profile.first_name,
                last_name: res.data.user?.last_name || profile.last_name,
                user_type: 'member' as const,
                photo_url: res.data.user?.photo_url || profile.photo_url,
            };
            login(userData, res.data.token);
            if (profiles.length > 1) {
                setFamilyContext(profiles, { password: password || undefined, pin: pin || undefined });
            }
            navigate('/welcome');
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
                employment_type: staff.employment_type || '',
            };
            login(userData, res.data.token);
            navigate('/');
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
        setPassword('');
        setError('');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: '1.5rem', paddingRight: '1.5rem', position: 'relative', overflow: 'hidden' }}>

            {/* Background blurs */}
            <div style={{ position: 'absolute', top: '-20%', left: '-15%', width: '500px', height: '500px', borderRadius: '9999px', background: 'var(--color-green-cedar)', opacity: 0.03, filter: 'blur(120px)' }} />
            <div style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: '500px', height: '500px', borderRadius: '9999px', background: 'var(--color-gold)', opacity: 0.04, filter: 'blur(120px)' }} />

            <AnimatePresence mode="wait">

                {/* ═══════════ LOBBY: MEMBER OR EMPLOYEE ═══════════ */}
                {!userType && (
                    <motion.div
                        key="lobby"
                        variants={slideVariants}
                        initial="enter" animate="center" exit="exit"
                        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
                        style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                    >
                        <div style={{ marginBottom: '2.5rem' }}>
                            <img src="/logo.png" alt="Centro Libanés" style={{ height: '6rem', width: 'auto', marginLeft: 'auto', marginRight: 'auto', objectFit: 'contain' }} />
                        </div>

                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                            Bienvenido
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>
                            ¿Cómo deseas ingresar?
                        </p>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                onClick={() => setUserType('member')}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', transition: 'all 0.2s', textAlign: 'left', cursor: 'pointer', touchAction: 'manipulation' }}
                            >
                                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(0,90,54,0.1)' }}>
                                    <User size={22} style={{ color: 'var(--color-green-cedar)' }} strokeWidth={1.6} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Soy Miembro</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>Ingresa con tu número de membresía</p>
                                </div>
                                <ChevronLeft size={16} style={{ color: 'var(--color-text-tertiary)', transform: 'rotate(180deg)', transition: 'transform 0.2s' }} />
                            </button>

                            <button
                                onClick={() => setUserType('employee')}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', transition: 'all 0.2s', textAlign: 'left', cursor: 'pointer', touchAction: 'manipulation' }}
                            >
                                <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(201,168,76,0.1)' }}>
                                    <Briefcase size={22} style={{ color: 'var(--color-gold)' }} strokeWidth={1.6} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Soy Empleado</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>Ingresa con usuario y contraseña</p>
                                </div>
                                <ChevronLeft size={16} style={{ color: 'var(--color-text-tertiary)', transform: 'rotate(180deg)', transition: 'transform 0.2s' }} />
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
                        style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                    >
                        <div style={{ marginBottom: '2rem' }}>
                            <img src="/logo.png" alt="Centro Libanés" style={{ height: '5rem', width: 'auto', marginLeft: 'auto', marginRight: 'auto', objectFit: 'contain' }} />
                        </div>

                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                            Acceso Miembros
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                            Ingresa tu número de membresía
                        </p>

                        <form onSubmit={e => { e.preventDefault(); if (memberNum) handleLookupMembership(); }} style={{ width: '100%' }}>
                            <input
                                type="text"
                                maxLength={6}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                style={{ width: '100%', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: '1rem', height: '3.5rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.15em', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', cursor: 'pointer', touchAction: 'manipulation' }}
                                placeholder="ej. 31505"
                                value={memberNum}
                                onChange={e => setMemberNum(e.target.value.replace(/\D/g, ''))}
                                autoFocus
                            />

                            {error && <p style={{ color: 'var(--color-red-lebanese)', fontSize: '0.875rem', marginTop: '0.75rem' }}>{error}</p>}

                            <Button type="submit" size="lg" style={{ width: '100%', marginTop: '1.5rem', cursor: 'pointer', touchAction: 'manipulation' }} disabled={isLoading || !memberNum} isLoading={isLoading}>
                                Continuar
                            </Button>
                        </form>

                        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '2rem', width: '100%', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }} onClick={goBack}>
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
                        style={{ width: '100%', maxWidth: '380px' }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>¿Quién eres?</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>
                                Membresía <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>{memberNum}</span>
                            </p>
                        </div>

                        <div className="scrollbar-none" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '55vh', overflowY: 'auto' }}>
                            {profiles.map((p) => (
                                <motion.button
                                    key={p.id}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--color-border)', transition: 'all 0.2s', textAlign: 'left', background: 'var(--color-surface)', cursor: 'pointer', touchAction: 'manipulation' }}
                                    onClick={() => {
                                        setSelectedProfile(p);
                                        setError('');
                                        setPin('');
                                        setPassword('');
                                        setStep('pin');
                                    }}
                                >
                                    <div style={{ width: '3rem', height: '3rem', borderRadius: '9999px', background: 'var(--color-surface-hover)', border: '1px solid var(--color-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-gold)', flexShrink: 0 }}>
                                        {p.first_name[0]}{p.last_name[0]}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '15px' }}>{p.first_name} {p.last_name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'capitalize', marginTop: '0.125rem' }}>{p.role}</p>
                                    </div>
                                    {p.is_minor && <Shield size={16} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />}
                                </motion.button>
                            ))}
                        </div>

                        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '2rem', width: '100%', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
                            onClick={() => { setStep('pin'); setError(''); }}>
                            <ChevronLeft size={16} /> Regresar
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
                        style={{ width: '100%', maxWidth: '300px', textAlign: 'center' }}
                    >
                        {selectedProfile ? (
                            <>
                                <div style={{ width: '5rem', height: '5rem', borderRadius: '9999px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-gold)', background: 'var(--color-surface)', border: '2px solid rgba(201,168,76,0.3)', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(201,168,76,0.1)' }}>
                                    {selectedProfile.first_name[0]}{selectedProfile.last_name[0]}
                                </div>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Hola, {selectedProfile.first_name}</h2>
                            </>
                        ) : (
                            <>
                                <div style={{ width: '5rem', height: '5rem', borderRadius: '9999px', marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-gold)', background: 'var(--color-surface)', border: '2px solid rgba(201,168,76,0.3)', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(201,168,76,0.1)' }}>
                                    <Shield size={28} />
                                </div>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Membresía {memberNum}</h2>
                            </>
                        )}
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                            {selectedProfile?.is_minor ? 'Ingresa tu PIN de 4 dígitos' : 'Verifica tu identidad'}
                        </p>

                        {error && <p style={{ color: 'var(--color-red-lebanese)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

                        {selectedProfile?.is_minor ? (
                            <>
                                <input
                                    type="password" maxLength={4} inputMode="numeric"
                                    style={{ width: '100%', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: '1rem', height: '3.5rem', textAlign: 'center', fontSize: '1.875rem', letterSpacing: '0.5em', outline: 'none', transition: 'all 0.2s', marginBottom: '1.5rem', boxSizing: 'border-box', cursor: 'pointer', touchAction: 'manipulation' }}
                                    value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={e => e.key === 'Enter' && pin.length >= 4 && handleMemberLogin()}
                                    autoFocus
                                />
                                <Button size="lg" style={{ width: '100%', cursor: 'pointer', touchAction: 'manipulation' }} onClick={handleMemberLogin} disabled={isLoading || pin.length < 4} isLoading={isLoading}>
                                    Entrar
                                </Button>
                            </>
                        ) : (
                            <>
                                <input
                                    type="password"
                                    style={{ width: '100%', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: '1rem', height: '3.5rem', paddingLeft: '1.25rem', paddingRight: '1.25rem', fontSize: '15px', outline: 'none', transition: 'all 0.2s', marginBottom: '1.5rem', boxSizing: 'border-box', cursor: 'pointer', touchAction: 'manipulation' }}
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && password && handleMemberLogin()}
                                    autoFocus
                                />
                                <Button size="lg" style={{ width: '100%', cursor: 'pointer', touchAction: 'manipulation' }} onClick={handleMemberLogin} disabled={isLoading || !password} isLoading={isLoading}>
                                    <Fingerprint size={20} /> Entrar
                                </Button>
                            </>
                        )}

                        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '2rem', width: '100%', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }}
                            onClick={() => { setStep('membresia'); setPin(''); setPassword(''); setError(''); setProfiles([]); setSelectedProfile(null); }}>
                            <ChevronLeft size={16} /> Cambiar membresía
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
                        style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                    >
                        <div style={{ marginBottom: '2rem' }}>
                            <img src="/logo.png" alt="Centro Libanés" style={{ height: '5rem', width: 'auto', marginLeft: 'auto', marginRight: 'auto', objectFit: 'contain' }} />
                        </div>

                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                            Acceso Empleados
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                            Ingresa tus credenciales
                        </p>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                style={{ width: '100%', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: '1rem', height: '3.5rem', paddingLeft: '1.25rem', paddingRight: '1.25rem', fontSize: '15px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', cursor: 'pointer', touchAction: 'manipulation' }}
                                placeholder="Usuario"
                                value={empUsername}
                                onChange={e => setEmpUsername(e.target.value)}
                                autoFocus
                            />
                            <input
                                type="password"
                                style={{ width: '100%', background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: '1rem', height: '3.5rem', paddingLeft: '1.25rem', paddingRight: '1.25rem', fontSize: '15px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', cursor: 'pointer', touchAction: 'manipulation' }}
                                placeholder="Contraseña"
                                value={empPassword}
                                onChange={e => setEmpPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && empUsername && empPassword && handleEmployeeLogin()}
                            />
                        </div>

                        {error && <p style={{ color: 'var(--color-red-lebanese)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</p>}

                        <Button size="lg" style={{ width: '100%', cursor: 'pointer', touchAction: 'manipulation' }} onClick={handleEmployeeLogin} disabled={isLoading || !empUsername || !empPassword} isLoading={isLoading}>
                            <Briefcase size={18} /> Ingresar
                        </Button>

                        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '2rem', width: '100%', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer', touchAction: 'manipulation' }} onClick={goBack}>
                            <ChevronLeft size={16} /> Regresar
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};
