import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchableSelectOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
}

export interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    isLoading?: boolean;
    className?: string;
    triggerClassName?: string;
    // For grouped options
    groups?: {
        label: string;
        options: SearchableSelectOption[];
    }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    emptyMessage = 'Tidak ditemukan.',
    disabled = false,
    isLoading = false,
    className,
    triggerClassName,
    groups,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Find selected option label
    const selectedLabel = useMemo(() => {
        if (!value) return null;

        // Check in flat options
        const found = options.find((opt) => opt.value === value);
        if (found) return found.label;

        // Check in groups
        if (groups) {
            for (const group of groups) {
                const foundInGroup = group.options.find((opt) => opt.value === value);
                if (foundInGroup) return foundInGroup.label;
            }
        }

        return null;
    }, [value, options, groups]);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        if (!search) return options;
        const query = search.toLowerCase();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(query) ||
                opt.description?.toLowerCase().includes(query)
        );
    }, [options, search]);

    const filteredGroups = useMemo(() => {
        if (!groups) return undefined;
        if (!search) return groups;

        const query = search.toLowerCase();
        return groups
            .map((group) => ({
                ...group,
                options: group.options.filter(
                    (opt) =>
                        opt.label.toLowerCase().includes(query) ||
                        opt.description?.toLowerCase().includes(query)
                ),
            }))
            .filter((group) => group.options.length > 0);
    }, [groups, search]);

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue === value ? '' : selectedValue);
        setOpen(false);
        setSearch('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled || isLoading}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value && 'text-muted-foreground',
                        triggerClassName
                    )}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Memuat...</span>
                        </span>
                    ) : (
                        <span className="truncate">{selectedLabel ?? placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn('w-[var(--radix-popover-trigger-width)] p-0', className)}
                align="start"
            >
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>

                        {/* Render grouped options */}
                        {filteredGroups?.map((group) => (
                            <CommandGroup key={group.label} heading={group.label}>
                                {group.options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={handleSelect}
                                        disabled={option.disabled}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === option.value ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{option.label}</span>
                                            {option.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}

                        {/* Render flat options (when no groups) */}
                        {!groups && filteredOptions.length > 0 && (
                            <CommandGroup>
                                {filteredOptions.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={handleSelect}
                                        disabled={option.disabled}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === option.value ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{option.label}</span>
                                            {option.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ---------------------------------------------------------------------------
// Async Searchable Select (for API-driven search)
// ---------------------------------------------------------------------------

export interface AsyncSearchableSelectProps {
    value?: string;
    onChange: (value: string) => void;
    onSearch: (query: string) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    isLoading?: boolean;
    className?: string;
    triggerClassName?: string;
    // Debounce delay in ms
    debounceMs?: number;
}

export function AsyncSearchableSelect({
    value,
    onChange,
    onSearch,
    options,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Ketik untuk mencari...',
    emptyMessage = 'Tidak ditemukan.',
    disabled = false,
    isLoading = false,
    className,
    triggerClassName,
    debounceMs = 300,
}: AsyncSearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    // Find selected option label
    const selectedLabel = useMemo(() => {
        if (!value) return null;
        const found = options.find((opt) => opt.value === value);
        return found?.label ?? null;
    }, [value, options]);

    const handleSearchChange = (newSearch: string) => {
        setSearch(newSearch);

        // Clear existing timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // Set new debounce timer
        const timer = setTimeout(() => {
            onSearch(newSearch);
        }, debounceMs);
        setDebounceTimer(timer);
    };

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue === value ? '' : selectedValue);
        setOpen(false);
        setSearch('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value && 'text-muted-foreground',
                        triggerClassName
                    )}
                >
                    <span className="truncate">{selectedLabel ?? placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn('w-[var(--radix-popover-trigger-width)] p-0', className)}
                align="start"
            >
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
                    </div>
                    <CommandList>
                        {!isLoading && options.length === 0 && (
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                        )}
                        {options.length > 0 && (
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={handleSelect}
                                        disabled={option.disabled}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === option.value ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{option.label}</span>
                                            {option.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
