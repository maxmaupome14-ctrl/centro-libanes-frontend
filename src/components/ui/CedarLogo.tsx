/**
 * Inline SVG of the Centro Libanés cedar tree emblem.
 * Rendered as SVG for crisp display at any size & easy color control.
 */
export const CedarLogo = ({
    size = 48,
    color = 'var(--color-gold)',
    className = '',
}: {
    size?: number;
    color?: string;
    className?: string;
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Cedar tree — stylized layered chevrons */}
        <g fill={color}>
            {/* Top point */}
            <path d="M50 8 L56 18 L44 18 Z" />
            {/* Layer 1 */}
            <path d="M50 14 L62 28 L38 28 Z" />
            {/* Layer 2 */}
            <path d="M50 22 L68 38 L32 38 Z" />
            {/* Layer 3 */}
            <path d="M50 30 L74 48 L26 48 Z" />
            {/* Layer 4 */}
            <path d="M50 38 L80 58 L20 58 Z" />
            {/* Layer 5 — widest */}
            <path d="M50 46 L86 68 L14 68 Z" />
            {/* Trunk */}
            <rect x="46" y="68" width="8" height="16" rx="2" />
            {/* Base */}
            <rect x="36" y="84" width="28" height="4" rx="2" />
        </g>
    </svg>
);
