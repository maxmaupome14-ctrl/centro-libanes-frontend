import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import {
    Trophy, Calendar, Users, MapPin, ChevronLeft, ChevronRight,
    Clock, Star, Swords, Award, X, Check, AlertCircle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────

interface Tournament {
    id: string;
    name: string;
    sport: string;
    format: string;
    team_size: number;
    max_teams: number;
    registration_fee: string;
    prize_description?: string;
    rules?: string;
    start_date: string;
    end_date?: string;
    registration_deadline: string;
    status: string;
    current_round: number;
    image_color?: string;
    unit: { name: string; short_name: string };
    registered_teams?: number;
    spots_left?: number;
    registrations?: Registration[];
    matches?: Match[];
}

interface Registration {
    id: string;
    team_name?: string;
    seed?: number;
    status: string;
    players: { id: string; profile_id: string; is_captain: boolean; profile: { id: string; first_name: string; last_name: string; photo_url?: string } }[];
}

interface Match {
    id: string;
    round: number;
    match_number: number;
    team_a_id?: string;
    team_b_id?: string;
    score_a?: string;
    score_b?: string;
    winner_id?: string;
    status: string;
    scheduled_date?: string;
    resource_code?: string;
}

// ─── Helpers ──────────────────────────────────────────────

const SPORT_LABELS: Record<string, string> = {
    padel: 'Pádel', tenis: 'Tenis', squash: 'Squash',
    natacion: 'Natación', futbol: 'Fútbol',
};

const FORMAT_LABELS: Record<string, string> = {
    single_elimination: 'Eliminación directa',
    double_elimination: 'Doble eliminación',
    round_robin: 'Todos contra todos',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: '#6B7280' },
    registration_open: { label: 'Inscripciones abiertas', color: '#059669' },
    in_progress: { label: 'En curso', color: '#C9A84C' },
    completed: { label: 'Finalizado', color: '#6366F1' },
    cancelled: { label: 'Cancelado', color: '#EF4444' },
};

const SPORT_COLORS: Record<string, string> = {
    padel: '#007A4A', tenis: '#059669', squash: '#6366F1',
    natacion: '#06B6D4', futbol: '#EF4444',
};

function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getRoundLabel(round: number, totalRounds: number): string {
    const remaining = totalRounds - round;
    if (remaining === 0) return 'Final';
    if (remaining === 1) return 'Semifinal';
    if (remaining === 2) return 'Cuartos';
    return `Ronda ${round}`;
}

// ─── Tournament List ──────────────────────────────────────

function TournamentList({ onSelect }: { onSelect: (id: string) => void }) {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        api.get('/tournaments').then(res => setTournaments(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const upcoming = tournaments.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    const past = tournaments.filter(t => t.status === 'completed' || t.status === 'cancelled');
    const list = tab === 'upcoming' ? upcoming : past;

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div style={{ padding: '24px 16px 16px' }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                    Torneos
                </h1>
                <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    Compite con otros socios del club
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', borderBottom: '1px solid var(--color-border)' }}>
                {(['upcoming', 'past'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            fontSize: 14, fontWeight: 600, touchAction: 'manipulation',
                            background: tab === t ? 'var(--color-text-primary)' : 'transparent',
                            color: tab === t ? 'var(--color-surface)' : 'var(--color-text-secondary)',
                        }}
                    >
                        {t === 'upcoming' ? 'Próximos' : 'Pasados'}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                    <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--color-border)', borderTopColor: '#C9A84C', borderRadius: '50%', margin: '0 auto' }} />
                </div>
            ) : list.length === 0 ? (
                <div style={{ padding: '60px 16px', textAlign: 'center' }}>
                    <Trophy size={48} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 16px', opacity: 0.3 }} />
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        {tab === 'upcoming' ? 'No hay torneos próximos' : 'Sin torneos pasados'}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                        Los torneos aparecerán aquí cuando se publiquen
                    </p>
                </div>
            ) : (
                <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {list.map((t, i) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <TournamentCard tournament={t} onTap={() => onSelect(t.id)} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function TournamentCard({ tournament: t, onTap }: { tournament: Tournament; onTap: () => void }) {
    const sportColor = t.image_color || SPORT_COLORS[t.sport] || '#007A4A';
    const statusInfo = STATUS_LABELS[t.status] || STATUS_LABELS.draft;
    const spotsText = t.spots_left != null ? `${t.registered_teams}/${t.max_teams} equipos` : '';

    return (
        <div
            onClick={onTap}
            className="card-interactive"
            style={{
                borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                touchAction: 'manipulation',
            }}
        >
            {/* Color bar top */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${sportColor}, ${sportColor}88)` }} />

            <div style={{ padding: '16px 16px 14px' }}>
                {/* Sport + status row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Swords size={14} style={{ color: sportColor }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: sportColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {SPORT_LABELS[t.sport] || t.sport}
                        </span>
                    </div>
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: statusInfo.color,
                        background: `${statusInfo.color}18`, padding: '3px 8px', borderRadius: 6,
                    }}>
                        {statusInfo.label}
                    </span>
                </div>

                {/* Name */}
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8, lineHeight: 1.25 }}>
                    {t.name}
                </h3>

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} /> {formatDate(t.start_date)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={13} /> {spotsText}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} /> {t.unit?.short_name}
                    </span>
                </div>

                {/* Format + team size */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <span style={{
                        fontSize: 11, color: 'var(--color-text-tertiary)',
                        background: 'var(--color-surface)', padding: '3px 8px', borderRadius: 6,
                    }}>
                        {FORMAT_LABELS[t.format] || t.format}
                    </span>
                    <span style={{
                        fontSize: 11, color: 'var(--color-text-tertiary)',
                        background: 'var(--color-surface)', padding: '3px 8px', borderRadius: 6,
                    }}>
                        {t.team_size === 1 ? 'Singles' : t.team_size === 2 ? 'Dobles' : `${t.team_size} jugadores`}
                    </span>
                </div>
            </div>

            {/* Registration bar */}
            {t.status === 'registration_open' && t.spots_left != null && (
                <div style={{
                    padding: '10px 16px',
                    background: `${sportColor}0A`,
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {t.spots_left > 0 ? `${t.spots_left} lugares disponibles` : 'Torneo lleno'}
                    </span>
                    <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
            )}
        </div>
    );
}

// ─── Tournament Detail ────────────────────────────────────

function TournamentDetail({ tournamentId, onBack }: { tournamentId: string; onBack: () => void }) {
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'bracket' | 'teams' | 'info'>('bracket');
    const [showRegister, setShowRegister] = useState(false);
    const user = useAuthStore(s => s.user);
    const { showToast } = useToast();

    const fetchTournament = async () => {
        try {
            const res = await api.get(`/tournaments/${tournamentId}`);
            setTournament(res.data);
        } catch { showToast('Error al cargar torneo', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTournament(); }, [tournamentId]);

    if (loading) return (
        <div style={{ padding: '60px 16px', textAlign: 'center' }}>
            <div className="animate-spin" style={{ width: 28, height: 28, border: '2px solid var(--color-border)', borderTopColor: '#C9A84C', borderRadius: '50%', margin: '0 auto' }} />
        </div>
    );

    if (!tournament) return null;

    const t = tournament;
    const sportColor = t.image_color || SPORT_COLORS[t.sport] || '#007A4A';
    const statusInfo = STATUS_LABELS[t.status] || STATUS_LABELS.draft;
    const registrations = t.registrations || [];
    const matches = t.matches || [];

    // Check if current user is registered
    const myRegistration = registrations.find(r =>
        r.status !== 'withdrawn' && r.players.some(p => p.profile_id === user?.id)
    );

    const canRegister = t.status === 'registration_open' &&
        !myRegistration &&
        new Date() < new Date(t.registration_deadline) &&
        registrations.filter(r => r.status !== 'withdrawn').length < t.max_teams;

    // Bracket calculations
    const totalRounds = matches.length > 0
        ? Math.max(...matches.map(m => m.round))
        : 0;

    // Team name lookup
    const teamMap: Record<string, string> = {};
    for (const r of registrations) {
        teamMap[r.id] = r.team_name || r.players.map(p => p.profile.first_name).join(' & ');
    }

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Back button */}
            <div style={{ padding: '12px 16px 0' }}>
                <button onClick={onBack} style={{
                    display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                    color: 'var(--color-text-secondary)', fontSize: 14, cursor: 'pointer', padding: 0,
                    touchAction: 'manipulation',
                }}>
                    <ChevronLeft size={18} /> Torneos
                </button>
            </div>

            {/* Hero */}
            <div style={{
                margin: '12px 16px 0', borderRadius: 20, overflow: 'hidden',
                background: `linear-gradient(145deg, ${sportColor}DD, ${sportColor})`,
                padding: '28px 20px', position: 'relative',
            }}>
                <div style={{ position: 'absolute', top: 12, right: 16 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 8,
                    }}>
                        {statusInfo.label}
                    </span>
                </div>
                <Trophy size={32} style={{ color: 'rgba(255,255,255,0.25)', marginBottom: 12 }} />
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                    {t.name}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Swords size={13} /> {SPORT_LABELS[t.sport] || t.sport}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} /> {formatDate(t.start_date)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} /> {t.unit?.short_name}
                    </span>
                </div>
                {/* Format badges */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: '#fff',
                        background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 6,
                    }}>
                        {FORMAT_LABELS[t.format] || t.format}
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: '#fff',
                        background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 6,
                    }}>
                        {t.team_size === 1 ? 'Singles' : t.team_size === 2 ? 'Dobles' : `${t.team_size}v${t.team_size}`}
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: '#fff',
                        background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 6,
                    }}>
                        {registrations.filter(r => r.status !== 'withdrawn').length}/{t.max_teams}
                    </span>
                </div>
            </div>

            {/* Register / My status */}
            <div style={{ padding: '12px 16px 0' }}>
                {myRegistration ? (
                    <div style={{
                        padding: '12px 16px', borderRadius: 12,
                        background: `${sportColor}12`, border: `1px solid ${sportColor}30`,
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <Check size={18} style={{ color: sportColor }} />
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                Inscrito como {teamMap[myRegistration.id]}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                {myRegistration.status === 'winner' ? 'Campeón' :
                                    myRegistration.status === 'eliminated' ? 'Eliminado' : 'Activo en torneo'}
                            </p>
                        </div>
                    </div>
                ) : canRegister ? (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowRegister(true)}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                            background: sportColor, color: '#fff', fontSize: 15, fontWeight: 700,
                            cursor: 'pointer', touchAction: 'manipulation',
                        }}
                    >
                        Inscribirme — {Number(t.registration_fee) > 0 ? `$${Number(t.registration_fee).toLocaleString()} MXN` : 'Gratis'}
                    </motion.button>
                ) : null}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, padding: '16px 16px 0', borderBottom: '1px solid var(--color-border)' }}>
                {(['bracket', 'teams', 'info'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1, padding: '10px 0 12px', border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, touchAction: 'manipulation',
                            background: 'transparent',
                            color: activeTab === tab ? sportColor : 'var(--color-text-tertiary)',
                            borderBottom: activeTab === tab ? `2px solid ${sportColor}` : '2px solid transparent',
                        }}
                    >
                        {tab === 'bracket' ? 'Bracket' : tab === 'teams' ? 'Equipos' : 'Info'}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'bracket' && (
                        <BracketView
                            matches={matches}
                            teamMap={teamMap}
                            totalRounds={totalRounds}
                            format={t.format}
                            sportColor={sportColor}
                            registrations={registrations}
                        />
                    )}
                    {activeTab === 'teams' && (
                        <TeamsView registrations={registrations} sportColor={sportColor} />
                    )}
                    {activeTab === 'info' && (
                        <InfoView tournament={t} sportColor={sportColor} />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Registration Sheet */}
            <AnimatePresence>
                {showRegister && (
                    <RegistrationSheet
                        tournament={t}
                        sportColor={sportColor}
                        onClose={() => setShowRegister(false)}
                        onRegistered={() => {
                            setShowRegister(false);
                            fetchTournament();
                            showToast('Inscripción exitosa', 'success');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Bracket View ─────────────────────────────────────────

function BracketView({ matches, teamMap, totalRounds, format, sportColor, registrations }: {
    matches: Match[];
    teamMap: Record<string, string>;
    totalRounds: number;
    format: string;
    sportColor: string;
    registrations: Registration[];
}) {
    if (matches.length === 0) {
        return (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <Swords size={40} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    Bracket pendiente
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    El bracket se generará cuando cierren las inscripciones
                </p>
            </div>
        );
    }

    if (format === 'round_robin') {
        return <RoundRobinView matches={matches} teamMap={teamMap} sportColor={sportColor} registrations={registrations} />;
    }

    // Group matches by round
    const rounds: Record<number, Match[]> = {};
    for (const m of matches) {
        if (!rounds[m.round]) rounds[m.round] = [];
        rounds[m.round].push(m);
    }

    return (
        <div>
            {/* Scroll hint */}
            {totalRounds > 2 && (
                <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Desliza para ver más rondas</span>
                </div>
            )}
            <div className="scrollbar-none" style={{ padding: '12px 16px 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ display: 'flex', gap: 16, minWidth: totalRounds * 200 }}>
                {Object.entries(rounds).map(([roundStr, roundMatches]) => {
                    const round = Number(roundStr);
                    return (
                        <div key={round} style={{ flex: '0 0 180px' }}>
                            <p style={{
                                fontSize: 12, fontWeight: 700, color: sportColor,
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                marginBottom: 12, textAlign: 'center',
                            }}>
                                {getRoundLabel(round, totalRounds)}
                            </p>
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                gap: 8, justifyContent: 'center', minHeight: '100%',
                            }}>
                                {roundMatches.map(m => (
                                    <MatchCard key={m.id} match={m} teamMap={teamMap} sportColor={sportColor} />
                                ))}
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
    );
}

function MatchCard({ match: m, teamMap, sportColor }: {
    match: Match; teamMap: Record<string, string>; sportColor: string;
}) {
    const teamA = m.team_a_id ? teamMap[m.team_a_id] || 'TBD' : 'BYE';
    const teamB = m.team_b_id ? teamMap[m.team_b_id] || 'TBD' : 'BYE';
    const isCompleted = m.status === 'completed';
    return (
        <div style={{
            borderRadius: 10, overflow: 'hidden',
            background: 'var(--color-surface-elevated)',
            border: `1px solid ${isCompleted ? `${sportColor}30` : 'var(--color-border)'}`,
            fontSize: 13,
        }}>
            {/* Team A */}
            <div style={{
                padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: m.winner_id === m.team_a_id ? `${sportColor}12` : 'transparent',
            }}>
                <span style={{
                    fontWeight: m.winner_id === m.team_a_id ? 700 : 400,
                    color: m.team_a_id ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
                }}>
                    {teamA}
                </span>
                {m.score_a && (
                    <span style={{ fontWeight: 700, color: m.winner_id === m.team_a_id ? sportColor : 'var(--color-text-secondary)', fontSize: 12 }}>
                        {m.score_a}
                    </span>
                )}
                {m.winner_id === m.team_a_id && !m.score_a && (
                    <Check size={14} style={{ color: sportColor }} />
                )}
            </div>
            {/* Divider */}
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            {/* Team B */}
            <div style={{
                padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: m.winner_id === m.team_b_id ? `${sportColor}12` : 'transparent',
            }}>
                <span style={{
                    fontWeight: m.winner_id === m.team_b_id ? 700 : 400,
                    color: m.team_b_id ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
                }}>
                    {teamB}
                </span>
                {m.score_b && (
                    <span style={{ fontWeight: 700, color: m.winner_id === m.team_b_id ? sportColor : 'var(--color-text-secondary)', fontSize: 12 }}>
                        {m.score_b}
                    </span>
                )}
                {m.winner_id === m.team_b_id && !m.score_b && (
                    <Check size={14} style={{ color: sportColor }} />
                )}
            </div>
        </div>
    );
}

// ─── Round Robin View ─────────────────────────────────────

function RoundRobinView({ matches, teamMap, sportColor, registrations }: {
    matches: Match[]; teamMap: Record<string, string>; sportColor: string; registrations: Registration[];
}) {
    // Build standings
    const standings = registrations
        .filter(r => r.status !== 'withdrawn')
        .map(reg => {
            const wins = matches.filter(m => m.status === 'completed' && m.winner_id === reg.id).length;
            const losses = matches.filter(m =>
                m.status === 'completed' &&
                (m.team_a_id === reg.id || m.team_b_id === reg.id) &&
                m.winner_id && m.winner_id !== reg.id
            ).length;
            return {
                id: reg.id,
                name: teamMap[reg.id] || 'TBD',
                wins,
                losses,
                played: wins + losses,
                points: wins * 3,
            };
        })
        .sort((a, b) => b.points - a.points || b.wins - a.wins);

    return (
        <div style={{ padding: '16px' }}>
            {/* Standings table */}
            <p style={{ fontSize: 12, fontWeight: 700, color: sportColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Tabla de posiciones
            </p>
            <div style={{
                borderRadius: 12, overflow: 'hidden',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-elevated)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 40px 40px 50px',
                    padding: '8px 12px', fontSize: 11, fontWeight: 600,
                    color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)',
                }}>
                    <span>Equipo</span>
                    <span style={{ textAlign: 'center' }}>G</span>
                    <span style={{ textAlign: 'center' }}>P</span>
                    <span style={{ textAlign: 'center' }}>Pts</span>
                </div>
                {standings.map((s, i) => (
                    <div
                        key={s.id}
                        style={{
                            display: 'grid', gridTemplateColumns: '1fr 40px 40px 50px',
                            padding: '10px 12px', fontSize: 13,
                            borderBottom: i < standings.length - 1 ? '1px solid var(--color-border)' : 'none',
                            background: i === 0 ? `${sportColor}08` : 'transparent',
                        }}
                    >
                        <span style={{ fontWeight: i === 0 ? 700 : 400, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {i === 0 && <Award size={14} style={{ color: '#C9A84C' }} />}
                            {s.name}
                        </span>
                        <span style={{ textAlign: 'center', color: '#059669', fontWeight: 600 }}>{s.wins}</span>
                        <span style={{ textAlign: 'center', color: '#EF4444' }}>{s.losses}</span>
                        <span style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.points}</span>
                    </div>
                ))}
            </div>

            {/* Match list */}
            <p style={{ fontSize: 12, fontWeight: 700, color: sportColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 24, marginBottom: 12 }}>
                Partidos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matches.map(m => (
                    <MatchCard key={m.id} match={m} teamMap={teamMap} sportColor={sportColor} />
                ))}
            </div>
        </div>
    );
}

// ─── Teams View ───────────────────────────────────────────

function TeamsView({ registrations, sportColor }: { registrations: Registration[]; sportColor: string }) {
    const active = registrations.filter(r => r.status !== 'withdrawn');

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <Users size={40} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Aún no hay equipos inscritos</p>
                </div>
            ) : (
                active.map((reg, i) => (
                    <div
                        key={reg.id}
                        style={{
                            padding: '14px 16px', borderRadius: 12,
                            background: 'var(--color-surface-elevated)',
                            border: `1px solid ${reg.status === 'winner' ? '#C9A84C40' : 'var(--color-border)'}`,
                            display: 'flex', alignItems: 'center', gap: 12,
                        }}
                    >
                        {/* Seed badge */}
                        <div style={{
                            width: 28, height: 28, borderRadius: 8, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            background: `${sportColor}15`, fontSize: 12, fontWeight: 700, color: sportColor,
                        }}>
                            {reg.seed || i + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {reg.team_name || reg.players.map(p => p.profile.first_name).join(' & ')}
                                {reg.status === 'winner' && <Award size={14} style={{ color: '#C9A84C' }} />}
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                {reg.players.map(p => `${p.profile.first_name} ${p.profile.last_name}`).join(' · ')}
                            </p>
                        </div>

                        {/* Status dot */}
                        {reg.status === 'eliminated' && (
                            <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>Eliminado</span>
                        )}
                        {reg.status === 'winner' && (
                            <span style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600 }}>Campeón</span>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

// ─── Info View ────────────────────────────────────────────

function InfoView({ tournament: t, sportColor }: { tournament: Tournament; sportColor: string }) {
    const fee = Number(t.registration_fee);

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Details grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            }}>
                {[
                    { label: 'Deporte', value: SPORT_LABELS[t.sport] || t.sport, icon: Swords },
                    { label: 'Formato', value: FORMAT_LABELS[t.format] || t.format, icon: Trophy },
                    { label: 'Equipos', value: `${t.team_size === 1 ? 'Singles' : t.team_size === 2 ? 'Dobles' : `${t.team_size}v${t.team_size}`}`, icon: Users },
                    { label: 'Máximo', value: `${t.max_teams} equipos`, icon: Star },
                    { label: 'Inicio', value: formatDate(t.start_date), icon: Calendar },
                    { label: 'Inscripción', value: fee > 0 ? `$${fee.toLocaleString()} MXN` : 'Gratis', icon: Award },
                ].map((item, i) => (
                    <div key={i} style={{
                        padding: '12px', borderRadius: 12,
                        background: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                    }}>
                        <item.icon size={16} style={{ color: sportColor, marginBottom: 6 }} />
                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{item.label}</p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Deadline */}
            <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: `${sportColor}08`, border: `1px solid ${sportColor}20`,
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <Clock size={16} style={{ color: sportColor }} />
                <div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Cierre de inscripciones</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {formatDate(t.registration_deadline)}
                    </p>
                </div>
            </div>

            {/* Prize */}
            {t.prize_description && (
                <div style={{
                    padding: '14px 16px', borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))',
                    border: '1px solid rgba(201,168,76,0.2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Award size={16} style={{ color: '#C9A84C' }} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#C9A84C' }}>Premio</p>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{t.prize_description}</p>
                </div>
            )}

            {/* Rules */}
            {t.rules && (
                <div style={{
                    padding: '14px 16px', borderRadius: 12,
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Reglas</p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {t.rules}
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Registration Sheet ───────────────────────────────────

function RegistrationSheet({ tournament, sportColor, onClose, onRegistered }: {
    tournament: Tournament; sportColor: string; onClose: () => void; onRegistered: () => void;
}) {
    const user = useAuthStore(s => s.user);
    const { showToast } = useToast();
    const [teamName, setTeamName] = useState('');
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // For doubles+, load family members as potential partners
    useEffect(() => {
        if (tournament.team_size > 1 && user?.membership_id) {
            api.get(`/membership/${user.membership_id}/profiles`)
                .then(res => {
                    setFamilyMembers(res.data.filter((p: any) => p.id !== user.id && p.is_active));
                })
                .catch(() => { });
        }
    }, [tournament.team_size, user]);

    const handleRegister = async () => {
        if (!user) return;
        const playerIds = [user.id, ...selectedPartners];

        if (playerIds.length !== tournament.team_size) {
            showToast(`Necesitas ${tournament.team_size} jugador(es) en total`, 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/tournaments/${tournament.id}/register`, {
                team_name: teamName || undefined,
                player_ids: playerIds,
            });
            onRegistered();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Error al inscribirte', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    zIndex: 100,
                }}
            />
            {/* Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                    background: 'var(--color-surface)', borderRadius: '20px 20px 0 0',
                    maxHeight: '85vh', overflow: 'auto', maxWidth: 430, margin: '0 auto',
                }}
            >
                {/* Handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                    <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
                </div>

                <div style={{ padding: '8px 20px 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Inscripción</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, touchAction: 'manipulation' }}>
                            <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
                        </button>
                    </div>

                    {/* Team name */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                            Nombre del equipo (opcional)
                        </label>
                        <input
                            value={teamName}
                            onChange={e => setTeamName(e.target.value)}
                            placeholder={`${user?.first_name} & compañero`}
                            style={{
                                width: '100%', padding: '12px 14px', borderRadius: 10,
                                background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)', fontSize: 14,
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Player 1 (self) */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                            Jugador 1 (tú)
                        </label>
                        <div style={{
                            padding: '12px 14px', borderRadius: 10,
                            background: `${sportColor}08`, border: `1px solid ${sportColor}25`,
                            fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500,
                        }}>
                            {user?.first_name} {user?.last_name}
                        </div>
                    </div>

                    {/* Partner selection (for doubles/team) */}
                    {tournament.team_size > 1 && (
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                                {tournament.team_size === 2 ? 'Compañero(a)' : `Compañeros (${tournament.team_size - 1} más)`}
                            </label>

                            {familyMembers.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {familyMembers.map(member => {
                                        const isSelected = selectedPartners.includes(member.id);
                                        return (
                                            <button
                                                key={member.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedPartners(prev => prev.filter(p => p !== member.id));
                                                    } else if (selectedPartners.length < tournament.team_size - 1) {
                                                        setSelectedPartners(prev => [...prev, member.id]);
                                                    }
                                                }}
                                                style={{
                                                    padding: '12px 14px', borderRadius: 10,
                                                    background: isSelected ? `${sportColor}12` : 'var(--color-surface-elevated)',
                                                    border: `1px solid ${isSelected ? sportColor : 'var(--color-border)'}`,
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    cursor: 'pointer', touchAction: 'manipulation',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: 6,
                                                    border: `2px solid ${isSelected ? sportColor : 'var(--color-border)'}`,
                                                    background: isSelected ? sportColor : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {isSelected && <Check size={13} style={{ color: '#fff' }} />}
                                                </div>
                                                <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                                                    {member.first_name} {member.last_name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    padding: '14px', borderRadius: 10,
                                    background: 'var(--color-surface-elevated)',
                                    border: '1px solid var(--color-border)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <AlertCircle size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                                            No hay miembros familiares disponibles
                                        </p>
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                                        Tu compañero debe ser socio del club. Contacta recepción para registrar parejas externas.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fee summary */}
                    {Number(tournament.registration_fee) > 0 && (
                        <div style={{
                            padding: '12px 14px', borderRadius: 10, marginBottom: 16,
                            background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Cuota de inscripción</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#C9A84C' }}>
                                ${Number(tournament.registration_fee).toLocaleString()} MXN
                            </span>
                        </div>
                    )}

                    {/* Submit */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleRegister}
                        disabled={submitting || (tournament.team_size > 1 && selectedPartners.length !== tournament.team_size - 1)}
                        style={{
                            width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                            background: sportColor,
                            opacity: (submitting || (tournament.team_size > 1 && selectedPartners.length !== tournament.team_size - 1)) ? 0.5 : 1,
                            color: '#fff', fontSize: 16, fontWeight: 700,
                            cursor: 'pointer', touchAction: 'manipulation',
                        }}
                    >
                        {submitting ? 'Inscribiendo...' : 'Confirmar inscripción'}
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
}

// ─── Main Component ───────────────────────────────────────

export function TournamentView() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return selectedId
        ? <TournamentDetail tournamentId={selectedId} onBack={() => setSelectedId(null)} />
        : <TournamentList onSelect={setSelectedId} />;
}
