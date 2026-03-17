import { Lock } from 'lucide-react';

interface Props {
    lockers: any[];
    selectedFloor?: string | null;
    onFloorSelect?: (floor: string) => void;
}

export const LockerFloorPlan = ({ lockers, selectedFloor, onFloorSelect }: Props) => {
    // Group available lockers by floor
    const byFloor: Record<string, number> = {};
    const totalByFloor: Record<string, number> = {};
    for (const l of lockers) {
        const floor = l.floor || '1';
        totalByFloor[floor] = (totalByFloor[floor] || 0) + 1;
        if (l.is_available) byFloor[floor] = (byFloor[floor] || 0) + 1;
    }

    // Sort floors descending (top floor first visually)
    const floors = Object.keys(totalByFloor).sort((a, b) => Number(b) - Number(a));

    if (floors.length === 0) return null;

    const floorLabels: Record<string, string> = {
        '3': 'Piso Alto',
        '2': 'Piso Medio',
        '1': 'Planta Baja',
    };

    return (
        <div style={{ padding: '0 16px' }}>
            <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 16,
                overflow: 'hidden',
            }}>
                {floors.map((floor, i) => {
                    const available = byFloor[floor] || 0;
                    const total = totalByFloor[floor] || 0;
                    const isSelected = selectedFloor === floor;
                    const pct = total > 0 ? (available / total) * 100 : 0;

                    return (
                        <button
                            key={floor}
                            onClick={() => onFloorSelect?.(isSelected ? '' : floor)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '14px 16px',
                                background: isSelected ? 'rgba(201,168,76,0.06)' : 'transparent',
                                border: 'none',
                                borderBottom: i < floors.length - 1 ? '1px solid var(--color-border)' : 'none',
                                cursor: 'pointer',
                                touchAction: 'manipulation',
                                transition: 'background 200ms',
                                textAlign: 'left',
                            }}
                        >
                            {/* Floor icon */}
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: isSelected ? 'rgba(201,168,76,0.12)' : 'var(--color-surface-hover)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'background 200ms',
                            }}>
                                <Lock size={16} style={{ color: isSelected ? 'var(--color-gold)' : 'var(--color-text-tertiary)' }} />
                            </div>

                            {/* Floor info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    fontSize: 13, fontWeight: 600,
                                    color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                }}>
                                    {floorLabels[floor] || `Piso ${floor}`}
                                </p>

                                {/* Mini progress bar */}
                                <div style={{
                                    marginTop: 6, height: 4, borderRadius: 2,
                                    background: 'var(--color-surface-hover)',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${pct}%`,
                                        borderRadius: 2,
                                        background: pct > 50 ? '#34D399' : pct > 20 ? 'var(--color-gold)' : 'var(--color-red-lebanese)',
                                        transition: 'width 400ms ease',
                                    }} />
                                </div>
                            </div>

                            {/* Count */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{
                                    fontSize: 18, fontWeight: 700,
                                    color: available > 0 ? '#34D399' : 'var(--color-text-tertiary)',
                                }}>
                                    {available}
                                </p>
                                <p style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: -2 }}>
                                    de {total}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
