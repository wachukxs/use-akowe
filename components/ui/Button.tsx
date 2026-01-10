import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center border-2 font-semibold tracking-[0.08em] uppercase rounded-[var(--radius)] transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const variants = {
      primary:
        'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))] shadow-[6px_6px_0_rgba(29,41,57,0.16)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0_rgba(29,41,57,0.18)] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0_rgba(29,41,57,0.2)]',
      secondary:
        'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-[hsl(var(--secondary))] shadow-[6px_6px_0_rgba(29,41,57,0.12)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0_rgba(29,41,57,0.16)] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0_rgba(29,41,57,0.18)]',
      outline:
        'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] border-[hsl(var(--border-strong))] shadow-[4px_4px_0_rgba(29,41,57,0.1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0_rgba(29,41,57,0.14)]',
      ghost:
        'bg-transparent text-[hsl(var(--foreground))] border-transparent hover:border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--surface-muted))] hover:-translate-y-0.5 hover:-translate-x-0.5',
      danger:
        'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] border-[hsl(var(--destructive))] shadow-[6px_6px_0_rgba(29,41,57,0.16)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0_rgba(29,41,57,0.2)]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

