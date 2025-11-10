import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] shadow-[6px_6px_0_rgba(29,41,57,0.12)] transition-transform duration-150',
          hover && 'hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0_rgba(29,41,57,0.16)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;

