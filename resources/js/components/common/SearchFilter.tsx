import { useCallback, useState, useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterConfig {
    key: string;
    label: string;
    type: 'select' | 'text' | 'date';
    options?: Array<{ value: string; label: string }>;
}

interface SearchFilterProps {
    filters: FilterConfig[];
    values: Record<string, string>;
    onChange: (values: Record<string, string>) => void;
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    className?: string;
}

export function SearchFilter({
    filters,
    values,
    onChange,
    onSearch,
    searchPlaceholder = 'Cari...',
    className,
}: SearchFilterProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Debounced search
    const handleSearchChange = useCallback(
        (val: string) => {
            setSearchQuery(val);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onSearch?.(val);
            }, 300);
        },
        [onSearch],
    );

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            onChange({ ...values, [key]: value });
        },
        [values, onChange],
    );

    const removeFilter = useCallback(
        (key: string) => {
            const next = { ...values };
            delete next[key];
            onChange(next);
        },
        [values, onChange],
    );

    const clearAll = useCallback(() => {
        onChange({});
        setSearchQuery('');
        onSearch?.('');
    }, [onChange, onSearch]);

    // Active filters for chip display
    const activeFilters = Object.entries(values).filter(([, v]) => v !== '');

    const getFilterLabel = (key: string, value: string): string => {
        const config = filters.find((f) => f.key === key);
        if (!config) return value;
        if (config.type === 'select' && config.options) {
            const option = config.options.find((o) => o.value === value);
            return option ? `${config.label}: ${option.label}` : `${config.label}: ${value}`;
        }
        return `${config.label}: ${value}`;
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Filter bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Search input */}
                {onSearch !== undefined && (
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => handleSearchChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                                aria-label="Hapus pencarian"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Filter controls */}
                <div className="flex flex-wrap items-center gap-2">
                    {filters.length > 0 && (
                        <SlidersHorizontal className="hidden h-4 w-4 text-slate-400 sm:block" />
                    )}
                    {filters.map((filter) => {
                        if (filter.type === 'select' && filter.options) {
                            return (
                                <select
                                    key={filter.key}
                                    value={values[filter.key] ?? ''}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            filter.key,
                                            e.target.value,
                                        )
                                    }
                                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">{filter.label}</option>
                                    {filter.options.map((opt) => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            );
                        }

                        if (filter.type === 'date') {
                            return (
                                <input
                                    key={filter.key}
                                    type="date"
                                    value={values[filter.key] ?? ''}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            filter.key,
                                            e.target.value,
                                        )
                                    }
                                    placeholder={filter.label}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            );
                        }

                        // text filter
                        return (
                            <input
                                key={filter.key}
                                type="text"
                                value={values[filter.key] ?? ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        filter.key,
                                        e.target.value,
                                    )
                                }
                                placeholder={filter.label}
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        );
                    })}
                </div>
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {activeFilters.map(([key, value]) => (
                        <span
                            key={key}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                        >
                            {getFilterLabel(key, value)}
                            <button
                                type="button"
                                onClick={() => removeFilter(key)}
                                className="rounded-full p-0.5 transition-colors hover:bg-blue-100"
                                aria-label={`Hapus filter ${key}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs font-medium text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-700"
                    >
                        Hapus semua
                    </button>
                </div>
            )}
        </div>
    );
}
