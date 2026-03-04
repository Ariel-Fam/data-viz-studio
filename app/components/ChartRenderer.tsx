import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell, Legend as PieLegend,
  ScatterChart, Scatter, XAxis, YAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ComposedChart,
  CartesianGrid,
  Tooltip,
  Legend,
  Label,
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

// Build histogram bins from raw numeric values
function buildHistogramBins(values: number[], bins = 12): { range: string; count: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / bins || 1;
  const buckets: { range: string; count: number }[] = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + i * binSize).toFixed(1)}`,
    count: 0,
  }));
  values.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binSize), bins - 1);
    buckets[idx].count++;
  });
  return buckets;
}

export function ChartRenderer({ config, dataset, height = 320 }: ChartRendererProps) {
  const palette = COLOR_PALETTES[config.colorPalette as keyof typeof COLOR_PALETTES] ?? COLOR_PALETTES.default;

  const data = useMemo(() => {
    let rows = applyFilters(dataset.rows, config.filters);

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

    if (config.chartType === 'histogram') {
      const nums = rows
        .map(r => r[config.xAxis])
        .filter(v => v !== null && !isNaN(Number(v)))
        .map(Number);
      return buildHistogramBins(nums);
    }

    if (config.chartType === 'scatter') {
      return rows.map(r => ({
        x: r[config.xAxis],
        y: r[config.yAxis[0]] ?? null,
        name: r[config.xAxis],
      }));
    }

    // Aggregate for bar/line/area/composed
    if (config.yAxis.length > 0) {
      return aggregateData(rows, config.xAxis, config.yAxis, config.aggregation);
    }

    return rows;
  }, [dataset.rows, config]);

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

  if (config.chartType === 'pie' || config.chartType === 'donut') {
    const pieData = data.map((row: Record<string, unknown>) => ({
      name: String(row[config.xAxis] ?? ''),
      value: Number(row[config.yAxis[0]] ?? 0),
    }));
    const innerR = config.chartType === 'donut' ? '55%' : '0%';

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerR}
            outerRadius="72%"
            paddingAngle={2}
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => tooltipFormatter(v)} contentStyle={tooltipStyle} />
          {config.showLegend && <PieLegend wrapperStyle={{ fontSize: 11 }} />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (config.chartType === 'radar') {
    const radarData = data.map((row: Record<string, unknown>) => {
      const entry: Record<string, unknown> = { subject: String(row[config.xAxis] ?? '') };
      config.yAxis.forEach(y => { entry[y] = Number(row[y] ?? 0); });
      return entry;
    });

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

  if (config.chartType === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          {gridProps}
          <XAxis dataKey="x" type="number" name={config.xAxis} {...commonAxisProps}>
            <Label value={config.xAxis} position="insideBottom" offset={-2} style={{ fontSize: 11, opacity: 0.6 }} />
          </XAxis>
          <YAxis dataKey="y" type="number" name={config.yAxis[0]} {...commonAxisProps} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} formatter={(v: number) => tooltipFormatter(v)} />
          <Scatter data={data as Record<string, unknown>[]} fill={palette[0]} fillOpacity={0.8} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (config.chartType === 'histogram') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data as Record<string, unknown>[]} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          {gridProps}
          <XAxis dataKey="range" {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill={palette[0]} fillOpacity={0.85} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (config.chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data as Record<string, unknown>[]} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          {gridProps}
          <XAxis dataKey={config.xAxis} {...commonAxisProps} />
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
        <AreaChart data={data as Record<string, unknown>[]} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          {gridProps}
          <XAxis dataKey={config.xAxis} {...commonAxisProps} />
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

  if (config.chartType === 'composed') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data as Record<string, unknown>[]} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          {gridProps}
          <XAxis dataKey={config.xAxis} {...commonAxisProps} />
          <YAxis tickFormatter={(v) => formatNumber(v, config.numberFormat)} {...commonAxisProps} />
          <Tooltip formatter={(v: number) => tooltipFormatter(v)} contentStyle={tooltipStyle} />
          {config.showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {config.yAxis.map((y, i) =>
            i === 0 ? (
              <Bar key={y} dataKey={y} fill={palette[0]} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
            ) : (
              <Line
                key={y}
                type="monotone"
                dataKey={y}
                stroke={palette[i % palette.length]}
                strokeWidth={2}
                dot={config.showMarkers ? { r: 3 } : false}
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  // Default: Line chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data as Record<string, unknown>[]} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        {gridProps}
        <XAxis dataKey={config.xAxis} {...commonAxisProps} />
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
