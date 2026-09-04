import type { CSSProperties } from 'react';

/** Toalla doblada — glifo propio, compatible con las props de lucide (size / strokeWidth / style). */
export const TowelIcon = ({ size = 18, strokeWidth = 1.6, style, className }: {
    size?: number; strokeWidth?: number; style?: CSSProperties; className?: string;
}) => (
    <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
        style={style} className={className} aria-hidden="true"
    >
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M4 10h16" />
        <path d="M8 14h8" />
        <path d="M8 17h5" />
    </svg>
);
