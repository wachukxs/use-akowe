import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] rounded-(--radius) transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 focus:border-[hsl(var(--border-strong))] focus:-translate-y-[0.125rem] focus:-translate-x-[0.125rem] placeholder:text-[hsl(var(--muted-foreground))]',
            error && 'border-[hsl(var(--destructive))] focus-visible:outline-[hsl(var(--destructive))]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-[hsl(var(--destructive))] uppercase tracking-[0.08em]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

