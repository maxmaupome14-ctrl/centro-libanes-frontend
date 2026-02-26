import React from 'react';
import { cn } from '../../lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const variants: Record<string, string> = {
            primary: 'bg-[var(--color-green-cedar)] text-white hover:bg-[var(--color-green-cedar-light)] shadow-[0_4px_16px_rgba(0,90,54,0.3)]',
            secondary: 'bg-[var(--color-gold)] text-[var(--color-bg)] hover:bg-[var(--color-gold-light)] shadow-[0_4px_16px_rgba(201,168,76,0.25)]',
            outline: 'border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-tertiary)]',
            ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]',
            danger: 'bg-[var(--color-red-lebanese)] text-white hover:bg-[var(--color-red-lebanese-light)] shadow-[0_4px_16px_rgba(206,17,38,0.25)]',
        };

        const sizes: Record<string, string> = {
            sm: 'h-8 px-3 text-xs font-medium rounded-[var(--radius-sm)] gap-1.5',
            md: 'h-11 px-5 text-sm font-semibold rounded-[var(--radius-md)] gap-2',
            lg: 'h-13 px-7 text-base font-semibold rounded-[var(--radius-md)] gap-2',
            icon: 'h-10 w-10 rounded-[var(--radius-md)] p-0',
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1 }}
                className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : null}
                {children}
            </motion.button>
        );
    }
);
Button.displayName = 'Button';
