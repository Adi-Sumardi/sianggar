import { useState, useCallback, useRef, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type PaginationState,
} from '@tanstack/react-table';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';

// ---------------------------------------------------------------------------
// Skeleton row placeholder
// ---------------------------------------------------------------------------

function SkeletonRows({ columns, rows = 6 }: { columns: number; rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-slate-100">
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <td key={colIdx} className="px-4 py-3">
                            <div
                                className={cn(
                                    'h-4 animate-pulse rounded bg-slate-200',
                                    colIdx === 0 ? 'w-3/4' : 'w-1/2',
                                )}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
    searchPlaceholder?: string;
    searchColumn?: string;
    onRowClick?: (row: TData) => void;
    pagination?: {
        pageIndex: number;
        pageSize: number;
        pageCount: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (size: number) => void;
    };
    emptyMessage?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    searchValue?: string;
    className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<TData, TValue>({
    columns,
    data,
    isLoading = false,
    searchPlaceholder = 'Cari...',
    searchColumn,
    onRowClick,
    pagination: externalPagination,
    emptyMessage = 'Data tidak ditemukan',
    className,
}: DataTableProps<TData, TValue>) {
    // Internal state
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [internalPagination, setInternalPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: externalPagination?.pageSize ?? 10,
    });

    // Debounced search
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [searchInput, setSearchInput] = useState('');

    const handleSearchChange = useCallback(
        (value: string) => {
            setSearchInput(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                if (searchColumn) {
                    // Column-level filtering handled via table columnFilters
                    setGlobalFilter(value);
                } else {
                    setGlobalFilter(value);
                }
            }, 300);
        },
        [searchColumn],
    );

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // Determine if server-side pagination is used
    const isServerPagination = !!externalPagination;

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
            pagination: isServerPagination
                ? { pageIndex: externalPagination.pageIndex, pageSize: externalPagination.pageSize }
                : internalPagination,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: isServerPagination ? undefined : setInternalPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: isServerPagination ? undefined : getPaginationRowModel(),
        ...(isServerPagination && {
            pageCount: externalPagination.pageCount,
            manualPagination: true,
        }),
    });

    // Pagination helpers
    const pageIndex = isServerPagination ? externalPagination.pageIndex : table.getState().pagination.pageIndex;
    const pageSize = isServerPagination ? externalPagination.pageSize : table.getState().pagination.pageSize;
    const pageCount = isServerPagination ? externalPagination.pageCount : table.getPageCount();

    const goToPage = (page: number) => {
        if (isServerPagination) {
            externalPagination.onPageChange(page);
        } else {
            table.setPageIndex(page);
        }
    };
    const setPageSize = (size: number) => {
        if (isServerPagination) {
            externalPagination.onPageSizeChange(size);
        } else {
            table.setPageSize(size);
        }
    };
    const canPreviousPage = pageIndex > 0;
    const canNextPage = pageIndex < pageCount - 1;

    // Build visible page numbers (max 5)
    const visiblePages: number[] = [];
    if (pageCount <= 5) {
        for (let i = 0; i < pageCount; i++) visiblePages.push(i);
    } else {
        let start = Math.max(0, pageIndex - 2);
        let end = Math.min(pageCount - 1, start + 4);
        if (end - start < 4) start = Math.max(0, end - 4);
        for (let i = start; i <= end; i++) visiblePages.push(i);
    }

    // Total row count for display
    const totalRows = isServerPagination
        ? externalPagination.pageCount * externalPagination.pageSize
        : table.getFilteredRowModel().rows.length;

    return (
        <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
            {/* Search bar */}
            <div className="border-b border-slate-100 px-4 py-3">
                <div className="relative max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {searchInput && (
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
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50/80">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className={cn(
                                            'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500',
                                            header.column.getCanSort() && 'cursor-pointer select-none hover:text-slate-700',
                                        )}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanSort() && (
                                                <span className="text-slate-400">
                                                    {header.column.getIsSorted() === 'asc' ? (
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    ) : header.column.getIsSorted() === 'desc' ? (
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ArrowUpDown className="h-3.5 w-3.5" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <SkeletonRows columns={columns.length} />
                        ) : table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length}>
                                    <EmptyState
                                        title={emptyMessage}
                                        description="Belum ada data yang tersedia."
                                    />
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        'transition-colors hover:bg-blue-50/30',
                                        onRowClick && 'cursor-pointer',
                                    )}
                                    onClick={() => onRowClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3 text-slate-700">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile card view */}
            <div className="block divide-y divide-slate-100 sm:hidden">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2 px-4 py-3">
                            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                        </div>
                    ))
                ) : table.getRowModel().rows.length === 0 ? (
                    <EmptyState
                        title={emptyMessage}
                        description="Belum ada data yang tersedia."
                    />
                ) : (
                    table.getRowModel().rows.map((row) => (
                        <div
                            key={row.id}
                            className={cn(
                                'space-y-1.5 px-4 py-3 transition-colors hover:bg-blue-50/30',
                                onRowClick && 'cursor-pointer',
                            )}
                            onClick={() => onRowClick?.(row.original)}
                        >
                            {row.getVisibleCells().map((cell) => {
                                const header = cell.column.columnDef.header;
                                const headerText = typeof header === 'string' ? header : cell.column.id;

                                return (
                                    <div key={cell.id} className="flex items-start justify-between gap-2">
                                        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                                            {headerText}
                                        </span>
                                        <span className="text-right text-sm text-slate-700">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {!isLoading && pageCount > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
                    {/* Info + page size selector */}
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>
                            Menampilkan{' '}
                            {pageIndex * pageSize + 1}
                            {' - '}
                            {Math.min((pageIndex + 1) * pageSize, totalRows)}
                            {' dari '}
                            {totalRows} data
                        </span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                        >
                            {[10, 20, 30, 50, 100].map((size) => (
                                <option key={size} value={size}>
                                    {size} / halaman
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Page navigation */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => goToPage(0)}
                            disabled={!canPreviousPage}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Halaman pertama"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => goToPage(pageIndex - 1)}
                            disabled={!canPreviousPage}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Halaman sebelumnya"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        {visiblePages.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => goToPage(p)}
                                className={cn(
                                    'min-w-8 rounded px-2 py-1 text-sm font-medium transition-colors',
                                    p === pageIndex
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 hover:bg-slate-100',
                                )}
                            >
                                {p + 1}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => goToPage(pageIndex + 1)}
                            disabled={!canNextPage}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Halaman berikutnya"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => goToPage(pageCount - 1)}
                            disabled={!canNextPage}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Halaman terakhir"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
