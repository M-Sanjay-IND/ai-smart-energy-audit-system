import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  icon?: string;
  children: ReactNode;
  glow?: 'green' | 'cyan' | 'red' | 'none';
  className?: string;
  animationDelay?: number;
  span?: 2 | 3 | 'full';
  onClick?: () => void;
}

export default function Card({
  title,
  icon,
  children,
  glow = 'none',
  className = '',
  animationDelay,
  span,
  onClick,
}: CardProps) {
  const glowClass = glow !== 'none' ? `card-glow${glow === 'green' ? '' : `-${glow}`}` : '';
  const spanClass = span ? `card-span-${span}` : '';
  const delayClass = animationDelay ? `animate-in animate-in-delay-${animationDelay}` : 'animate-in';

  return (
    <div
      className={`card ${glowClass} ${spanClass} ${delayClass} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {title && (
        <div className="card-header">
          <div className="card-title">
            {icon && <span className="card-icon">{icon}</span>}
            {title}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
