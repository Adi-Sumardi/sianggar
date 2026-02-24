import { forwardRef, useCallback, useState, useEffect, type ChangeEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    label?: ReactNode;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
    name?: string;
    id?: string;
    className?: string;
}

function formatDisplay(num: number): string {
    if (num === 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    (
        {
            value,
            onChange,
            label,
            error,
            disabled = false,
            placeholder = '0',
            name,
            id,
            className,
        },
        ref,
    ) => {
        const [display, setDisplay] = useState(() => formatDisplay(value));

        // Sync display when external value changes
        useEffect(() => {
            setDisplay(formatDisplay(value));
        }, [value]);

        const handleChange = useCallback(
            (e: ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;

                // Allow only digits and dots (thousand separators)
                const digitsOnly = raw.replace(/[^0-9]/g, '');
                const numeric = parseInt(digitsOnly, 10) || 0;

                setDisplay(formatDisplay(numeric));
                onChange(numeric);
            },
            [onChange],
        );

        const inputId = id ?? name;

        return (
            <div className={cn('space-y-1.5', className)}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-slate-700"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-slate-500">
                        Rp
                    </span>
                    <input
                        ref={ref}
                        id={inputId}
                        name={name}
                        type="text"
                        inputMode="numeric"
                        value={display}
                        onChange={handleChange}
                        disabled={disabled}
                        placeholder={placeholder}
                        className={cn(
                            'block w-full rounded-md border bg-white py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm transition-colors',
                            'placeholder:text-slate-400',
                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
                            error
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-slate-300',
                        )}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : undefined}
                    />
                </div>
                {error && (
                    <p
                        id={`${inputId}-error`}
                        className="text-xs text-red-600"
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    },
);

CurrencyInput.displayName = 'CurrencyInput';
