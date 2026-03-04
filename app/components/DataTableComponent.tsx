import { useState, useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, flexRender,
  type SortingState, type ColumnFiltersState, type VisibilityState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Download, Eye } from 'lucide-react';
import type { Dataset } from '../types';
import { formatNumber } from '../utils/formatters';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface DataTableComponentProps {
  dataset: Dataset;
}

export function DataTableComponent({ dataset }: DataTableComponentProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Build TanStack columns from dataset columns
  const columns = useMemo(() =>
    dataset.columns.map(col => ({
      id: col.key,
      accessorKey: col.key,
      header: col.name,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const val = getValue();
        if (val === null || val === undefined || val === '') {
          return <span className="text-muted-foreground italic text-xs">—</span>;
        }
        if (typeof val === 'number' && (col.type === 'currency' || col.type === 'percentage' || col.type === 'number')) {
          return (
            <span className="font-mono text-right">
              {formatNumber(val, col.type === 'currency' ? 'currency' : col.type === 'percentage' ? 'percentage' : 'number', 1)}
            </span>
          );
        }
        if (typeof val === 'boolean') {
          return (
            <Badge variant={val ? 'default' : 'secondary'} className="text-xs">
              {val ? 'Yes' : 'No'}
            </Badge>
          );
        }
        return <span>{String(val)}</span>;
      },
      filterFn: 'includesString' as const,
    })),
    [dataset.columns]
  );

  const table = useReactTable({
    data: dataset.rows,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  // Compute column totals for numeric columns
  const columnTotals = useMemo(() => {
    const totals: Record<string, number | null> = {};
    dataset.columns.forEach(col => {
      if (['number', 'currency', 'percentage'].includes(col.type)) {
        const sum = dataset.rows.reduce((acc, row) => {
          const v = row[col.key];
          return acc + (typeof v === 'number' ? v : 0);
        }, 0);
        totals[col.key] = sum;
      } else {
        totals[col.key] = null;
      }
    });
    return totals;
  }, [dataset]);

  const exportCSV = () => {
    const rows = table.getFilteredRowModel().rows;
    const headers = dataset.columns.map(c => c.name).join(',');
    const body = rows.map(row =>
      dataset.columns.map(col => {
        const v = row.getValue(col.key);
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '');
      }).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${dataset.name}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search all columns…"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8">
              <Eye className="size-3.5" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {table.getAllColumns().filter(col => col.getCanHide()).map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={val => col.toggleVisibility(!!val)}
                className="text-sm"
              >
                {col.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={exportCSV}>
          <Download className="size-3.5" />
          Export
        </Button>

        <span className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length.toLocaleString()} of {dataset.rows.length.toLocaleString()} rows
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap border-b border-border cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === 'asc'
                          ? <ChevronUp className="size-3" />
                          : header.column.getIsSorted() === 'desc'
                          ? <ChevronDown className="size-3" />
                          : <ChevronsUpDown className="size-3 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIdx) => (
              <tr
                key={row.id}
                className={`border-b border-border transition-colors hover:bg-accent/40 ${rowIdx % 2 === 1 ? 'bg-muted/20' : ''}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}

            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={dataset.columns.length} className="px-3 py-10 text-center text-muted-foreground text-sm">
                  No rows match your filter.
                </td>
              </tr>
            )}
          </tbody>

          {/* Totals row */}
          <tfoot className="sticky bottom-0 bg-muted/80 backdrop-blur border-t border-border">
            <tr>
              {table.getVisibleLeafColumns().map((col, i) => {
                const total = columnTotals[col.id];
                const dsCol = dataset.columns.find(c => c.key === col.id);
                return (
                  <td key={col.id} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    {i === 0 ? (
                      <span>Totals</span>
                    ) : total !== null && dsCol ? (
                      <span className="font-mono">{formatNumber(total, dsCol.type === 'currency' ? 'currency' : 'number', 0)}</span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>«</Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>»</Button>
        </div>
        <select
          className="h-7 px-1 text-xs border border-border rounded bg-background"
          value={table.getState().pagination.pageSize}
          onChange={e => table.setPageSize(Number(e.target.value))}
        >
          {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} per page</option>)}
        </select>
      </div>
    </div>
  );
}
