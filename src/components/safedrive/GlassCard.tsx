import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
  neon?: boolean;
  danger?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  strong = false,
  neon = false,
  danger = false,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl p-5 transition-all duration-300',
        strong ? 'glass-card-strong' : 'glass-card',
        neon && 'neon-border',
        danger && 'danger-border',
        className
      )}
    >
      {children}
    </div>
  );
};
