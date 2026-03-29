import { useMemo } from 'react';
import { format, parseISO, startOfMonth, startOfQuarter, startOfWeek, startOfYear } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ChartConfig, Dataset } from '../types';
import { COLOR_PALETTES } from '../types';
import { aggregateData, applyFilters } from '../utils/stats';
import { formatNumber } from '../utils/formatters';

interface ChartRendererProps {
  config: ChartConfig;
  dataset: Dataset;
  height?: number;
}

function parseDateValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  const iso = parseISO(raw);
  if (!Number.isNaN(iso.getTime())) return iso;
  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function buildTimeFrameLabel(value: unknown, timeFrame: ChartConfig['timeFrame']): string {
  const date = parseDateValue(value);
  if (!date || !timeFrame || timeFrame === 'none') return String(value ?? '');

  switch (timeFrame) {
    case 'day':
      return format(date, 'MMM d, yyyy');
    case 'week':
      return `Week of ${format(startOfWeek(date), 'MMM d, yyyy')}`;
    case 'month':
      return format(startOfMonth(date), 'MMM yyyy');
    case 'quarter':
      return format(startOfQuarter(date), "QQQ yyyy");
    case 'year':
      return format(startOfYear(date), 'yyyy');
    default:
      return String(value ?? '');
  }
}

function isWithinConfiguredDateRange(value: unknown, start?: string, end?: string): boolean {
  const date = parseDateValue(value);
  if (!date) return false;

  const startDate = start ? parseDateValue(start) : null;
  const endDate = end ? parseDateValue(end) : null;

  if (startDate && date < startDate) return false;
  if (endDate) {
    const inclusiveEnd = new Date(endDate);
    inclusiveEnd.setHours(23, 59, 59, 999);
    if (date > inclusiveEnd) return false;
  }

  return true;
}

type ChartRow = Record<string, unknown>;

const DEFAULT_MAX_DATA_POINTS: Partial<Record<ChartConfig['chartType'], number>> = {
  bar: 20,
  line: 40,
  area: 40,
  radar: 10,
};

function getResolvedMaxDataPoints(config: ChartConfig): number | null {
  if (config.showAllData) return null;
  return config.maxDataPoints ?? DEFAULT_MAX_DATA_POINTS[config.chartType] ?? 24;
}

function getResolvedMaxXAxisTicks(config: ChartConfig): number {
  if (config.maxXAxisTicks) return config.maxXAxisTicks;
  return config.chartType === 'line' || config.chartType === 'area'
    ? 10
    : 8;
}

function evenlySampleRows<T>(rows: T[], maxItems: number): T[] {
  if (rows.length <= maxItems) return rows;
  if (maxItems <= 1) return rows.slice(0, 1);

  const sampled: T[] = [];
  for (let i = 0; i < maxItems; i += 1) {
    const index = Math.round((i * (rows.length - 1)) / (maxItems - 1));
    sampled.push(rows[index]);
  }
  return sampled;
}

function limitRowsForDisplay(rows: ChartRow[], config: ChartConfig): ChartRow[] {
  const maxItems = getResolvedMaxDataPoints(config);
  if (!maxItems || rows.length <= maxItems) return rows;

  switch (config.chartType) {
    case 'line':
    case 'area':
      return evenlySampleRows(rows, maxItems);
    case 'bar':
    case 'radar':
    default:
      return rows.slice(0, maxItems);
  }
}

export function ChartRenderer({ config, dataset, height = 320 }: ChartRendererProps) {
  const palette = COLOR_PALETTES[config.colorPalette as keyof typeof COLOR_PALETTES] ?? COLOR_PALETTES.default;
  const timeFrame = config.timeFrame ?? 'none';
  const selectedXAxis = dataset.columns.find(column => column.name === config.xAxis);
  const canUseTimeFrame = selectedXAxis?.type === 'date' && timeFrame !== 'none';
  const canUseDateRange = selectedXAxis?.type === 'date' && (!!config.dateRangeStart || !!config.dateRangeEnd);

  const data = useMemo(() => {
    let rows = applyFilters(dataset.rows, config.filters);

    if (canUseDateRange) {
      rows = rows.filter(row =>
        isWithinConfiguredDateRange(
          row[config.xAxis],
          config.dateRangeStart,
          config.dateRangeEnd,
        ),
      );
    }

    if (config.sortBy) {
      rows = [...rows].sort((a, b) => {
        const va = a[config.sortBy!];
        const vb = b[config.sortBy!];
        const cmp = typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va ?? '').localeCompare(String(vb ?? ''));
        return config.sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    // Aggregate for bar/line/area charts
    if (config.yAxis.length > 0) {
      const aggregated = aggregateData(
        rows,
        config.xAxis,
        config.yAxis,
        config.aggregation,
        canUseTimeFrame ? timeFrame : 'none',
      );

      if (canUseTimeFrame) {
        return aggregated.sort((a, b) => {
          const aTime = typeof a.__sortValue === 'number' ? a.__sortValue : 0;
          const bTime = typeof b.__sortValue === 'number' ? b.__sortValue : 0;
          return aTime - bTime;
        });
      }

      return aggregated;
    }

    return rows;
  }, [dataset.rows, config, canUseTimeFrame, canUseDateRange, timeFrame]);
  const displayData = useMemo(
    () => limitRowsForDisplay(data as ChartRow[], config),
    [data, config],
  );

  const tooltipFormatter = (value: number) => formatNumber(value, config.numberFormat);

  const commonAxisProps = {
    tick: { fontSize: 11, fill: 'currentColor', opacity: 0.7 },
    axisLine: { stroke: 'currentColor', strokeOpacity: 0.2 },
    tickLine: false,
  };

  const gridProps = config.showGridlines
    ? <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
    : null;

  const tooltipStyle = {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--color-foreground)',
  };
  const maxXAxisTicks = getResolvedMaxXAxisTicks(config);
  const shouldCondenseXAxis = ['bar', 'line', 'area'].includes(config.chartType)
    && displayData.length > maxXAxisTicks;
  const xAxisInterval = shouldCondenseXAxis ? Math.max(0, Math.ceil(displayData.length / maxXAxisTicks) - 1) : 0;
  const xAxisAngle = shouldCondenseXAxis ? -35 : 0;
  const xAxisHeight = shouldCondenseXAxis ? 58 : 32;
  const cartesianMargin = { top: 8, right: 16, bottom: shouldCondenseXAxis ? 28 : 8, left: 8 };
  const renderEmptyState = (message: string) => (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 px-6 text-center">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">No chart data to display</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
      </div>
    </div>
  );

  if (displayData.length === 0) {
    return renderEmptyState('Try widening the date range, adjusting the selected axes, or lowering the display limits.');
  }

  if (config.chartType === 'radar') {
    const radarData = displayData.map((row: ChartRow) => {
      const entry: Record<string, unknown> = { subject: String(row[config.xAxis] ?? '') };
      config.yAxis.forEach(y => { entry[y] = Number(row[y] ?? 0); });
      return entry;
    });

    if (radarData.length === 0) {
      return renderEmptyState('This radar chart has no categories to compare after the current filters are applied.');
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }} />
          {config.yAxis.map((y, i) => (
            <Radar
              key={y}
              name={y}
              dataKey={y}
              stroke={palette[i % palette.length]}
              fill={palette[i % palette.length]}
              fillOpacity={0.25}
            />
          ))}
          <Tooltip formatter={(v: number) => tooltipFormatter(v)} contentStyle={tooltipStyle} />
          {config.showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (config.chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={displayData as ChartRow[]} margin={cartesianMargin}>
          {gridProps}
          <XAxis
            dataKey={config.xAxis}
            tickFormatter={(value) => canUseTimeFrame ? buildTimeFrameLabel(value, timeFrame) : String(value ?? '')}
            interval={xAxisInterval}
            angle={xAxisAngle}
            textAnchor={shouldCondenseXAxis ? 'end' : 'middle'}
            height={xAxisHeight}
            minTickGap={6}
            {...commonAxisProps}
          />
          <YAxis tickFormatter={(v) => formatNumber(v, config.numberFormat)} {...commonAxisProps} />
          <Tooltip formatter={(v: number) => tooltipFormatter(v)} contentStyle={tooltipStyle} />
          {config.showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {config.yAxis.map((y, i) => (
            <Bar
              key={y}
              dataKey={y}
              fill={palette[i % palette.length]}
              stackId={config.stacked ? 'stack' : undefined}
              radius={config.stacked ? undefined : [3, 3, 0, 0]}
              fillOpacity={0.9}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (config.chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={displayData as ChartRow[]} margin={cartesianMargin}>
          {gridProps}
          <XAxis
            dataKey={config.xAxis}
            tickFormatter={(value) => canUseTimeFrame ? buildTimeFrameLabel(value, timeFrame) : String(value ?? '')}
            interval={xAxisInterval}
            angle={xAxisAngle}
            textAnchor={shouldCondenseXAxis ? 'end' : 'middle'}
            height={xAxisHeight}
            minTickGap={6}
            {...commonAxisProps}
          />
          <YAxis tickFormatter={(v) => formatNumber(v, config.numberFormat)} {...commonAxisProps} />
          <Tooltip formatter={(v: number) => tooltipFormatter(v)} contentStyle={tooltipStyle} />
          {config.showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {config.yAxis.map((y, i) => (
            <Area
              key={y}
              type={config.smoothLines ? 'monotone' : 'linear'}
              dataKey={y}
              stroke={palette[i % palette.length]}
              fill={palette[i % palette.length]}
              fillOpacity={0.18}
              stackId={config.stacked ? 'stack' : undefined}
              dot={config.showMarkers ? { r: 3 } : false}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }


  // Default: Line chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={displayData as ChartRow[]} margin={cartesianMargin}>
        {gridProps}
        <XAxis
          dataKey={config.xAxis}
          tickFormatter={(value) => canUseTimeFrame ? buildTimeFrameLabel(value, timeFrame) : String(value ?? '')}
          interval={xAxisInterval}
          angle={xAxisAngle}
          textAnchor={shouldCondenseXAxis ? 'end' : 'middle'}
          height={xAxisHeight}
          minTickGap={6}
          {...commonAxisProps}
        />
        <YAxis tickFormatter={(v) => formatNumber(v, config.numberFormat)} {...commonAxisProps} />
        <Tooltip formatter={(v: number) => tooltipFormatter(v)} contentStyle={tooltipStyle} />
        {config.showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {config.yAxis.map((y, i) => (
          <Line
            key={y}
            type={config.smoothLines ? 'monotone' : 'linear'}
            dataKey={y}
            stroke={palette[i % palette.length]}
            strokeWidth={2}
            dot={config.showMarkers ? { r: 3 } : false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
