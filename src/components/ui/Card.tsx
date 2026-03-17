import React from 'react';
import { cn } from '../../lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    glass?: boolean;
    interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, glass, interactive, children, style, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                whileHover={interactive ? { y: -2 } : undefined}
                transition={{ duration: 0.2 }}
                className={cn(
                    glass && 'glass',
                    className
                )}
                style={{
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    ...(!glass ? {
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                    } : {}),
                    ...(interactive ? {
                        cursor: 'pointer',
                    } : {}),
                    ...style,
                }}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={className}
        style={{
            padding: '16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            ...style,
        }}
        {...props}
    />
)

export const CardTitle = ({ className, style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
        className={className}
        style={{
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            color: 'var(--color-text-primary)',
            ...style,
        }}
        {...props}
    />
)

export const CardContent = ({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={className}
        style={{
            padding: '16px 16px',
            ...style,
        }}
        {...props}
    />
)
