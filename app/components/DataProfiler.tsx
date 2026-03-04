import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import type { Dataset, DatasetProfile } from '../types';
import { computeColumnStats, detectOutliers, getNumericValues } from '../utils/stats';
import { countDuplicates } from '../utils/parser';
import { formatStat } from '../utils/formatters';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';

interface DataProfilerProps {
  dataset: Dataset;
}

function profileDataset(dataset: Dataset): DatasetProfile {
  const columnStats = dataset.columns.map(col =>
    computeColumnStats(dataset.rows, col.name, col.type)
  );
  const duplicateRows = countDuplicates(dataset.rows);
  const warnings = [];

  columnStats.forEach(cs => {
    if (cs.missing > 0) {
      warnings.push({
        level: 'warning' as const,
        message: `"${cs.column}" has ${cs.missing} missing value${cs.missing > 1 ? 's' : ''} (${((cs.missing / cs.count) * 100).toFixed(1)}%)`,
        column: cs.column,
      });
    }
    if (cs.type === 'number' || cs.type === 'currency' || cs.type === 'percentage') {
      const nums = getNumericValues(dataset.rows, cs.column);
      const outliers = detectOutliers(nums);
      if (outliers.length > 0) {
        warnings.push({
          level: 'warning' as const,
          message: `"${cs.column}" contains ${outliers.length} potential outlier${outliers.length > 1 ? 's' : ''}`,
          column: cs.column,
        });
      }
    }
  });

  if (duplicateRows > 0) {
    warnings.push({ level: 'warning' as const, message: `${duplicateRows} duplicate row${duplicateRows > 1 ? 's' : ''} detected` });
  }

  return {
    rowCount: dataset.rows.length,
    columnCount: dataset.columns.length,
    duplicateRows,
    columnStats,
    warnings,
  };
}

const TYPE_COLORS: Record<string, string> = {
  number: 'bg-blue-500/15 text-blue-600',
  currency: 'bg-emerald-500/15 text-emerald-600',
  percentage: 'bg-violet-500/15 text-violet-600',
  date: 'bg-orange-500/15 text-orange-600',
  category: 'bg-pink-500/15 text-pink-600',
  text: 'bg-gray-500/15 text-gray-600',
  boolean: 'bg-cyan-500/15 text-cyan-600',
};

export function DataProfiler({ dataset }: DataProfilerProps) {
  const profile = useMemo(() => profileDataset(dataset), [dataset]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Rows', value: profile.rowCount.toLocaleString(), icon: BarChart2 },
            { label: 'Columns', value: profile.columnCount.toString(), icon: BarChart2 },
            { label: 'Duplicates', value: profile.duplicateRows.toString(), icon: AlertTriangle },
            { label: 'Warnings', value: profile.warnings.length.toString(), icon: AlertTriangle },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-border bg-card p-3">
              <div className="text-2xl font-bold text-foreground">{item.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {profile.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quality Warnings</h4>
            {profile.warnings.map((w, i) => (
              <div key={i} className="flex gap-2 items-start rounded-md bg-amber-500/8 border border-amber-500/20 px-3 py-2">
                <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{w.message}</p>
              </div>
            ))}
          </div>
        )}

        {profile.warnings.length === 0 && (
          <div className="flex gap-2 items-center rounded-md bg-emerald-500/8 border border-emerald-500/20 px-3 py-2">
            <CheckCircle className="size-3.5 text-emerald-500" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">No data quality issues detected</p>
          </div>
        )}

        {/* Column Profiles */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Column Profiles</h4>
          {profile.columnStats.map(cs => {
            const completeness = ((cs.count - cs.missing) / cs.count) * 100;
            const isNumeric = cs.type === 'number' || cs.type === 'currency' || cs.type === 'percentage';

            return (
              <div key={cs.column} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{cs.column}</span>
                  <Badge className={`text-xs px-1.5 py-0 border-0 ${TYPE_COLORS[cs.type] ?? ''}`}>
                    {cs.type}
                  </Badge>
                  {cs.missing > 0 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 text-amber-500 border-amber-500/40">
                      {cs.missing} missing
                    </Badge>
                  )}
                </div>

                {/* Completeness bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Completeness</span>
                    <span>{completeness.toFixed(0)}%</span>
                  </div>
                  <Progress value={completeness} className="h-1" />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unique</span>
                    <span className="font-mono">{cs.unique.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Count</span>
                    <span className="font-mono">{cs.count.toLocaleString()}</span>
                  </div>
                  {isNumeric && cs.mean !== undefined && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mean</span>
                        <span className="font-mono">{formatStat(cs.mean)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Median</span>
                        <span className="font-mono">{formatStat(cs.median)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min</span>
                        <span className="font-mono">{formatStat(cs.min as number)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max</span>
                        <span className="font-mono">{formatStat(cs.max as number)}</span>
                      </div>
                      {cs.stdDev !== undefined && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-muted-foreground">Std Dev</span>
                          <span className="font-mono">{formatStat(cs.stdDev)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {!isNumeric && cs.mode !== undefined && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">Most Common</span>
                      <span className="font-mono truncate max-w-24">{String(cs.mode)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
