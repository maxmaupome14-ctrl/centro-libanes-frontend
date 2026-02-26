import React from 'react';
import { cn } from '../../lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    glass?: boolean;
    interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, glass, interactive, children, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                whileHover={interactive ? { y: -2 } : undefined}
                transition={{ duration: 0.2 }}
                className={cn(
                    'rounded-[var(--radius-lg)] overflow-hidden transition-all duration-200',
                    glass
                        ? 'glass'
                        : 'bg-[var(--color-surface)] border border-[var(--color-border)]',
                    interactive && 'cursor-pointer hover:border-[var(--color-border-strong)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-5 py-4 flex flex-col space-y-1", className)} {...props} />
)

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("font-semibold leading-tight tracking-tight text-[var(--color-text-primary)]", className)} {...props} />
)

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("px-5 py-4", className)} {...props} />
)
