// Core data types for the application

export type ColumnType = 'number' | 'text' | 'category' | 'date' | 'boolean' | 'percentage' | 'currency';

export interface Column {
  name: string;
  key: string;
  type: ColumnType;
}

export type Row = Record<string, string | number | boolean | null>;

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  columns: Column[];
  rows: Row[];
  createdAt: string;
  source: 'manual' | 'csv' | 'json' | 'sample';
}

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar' | 'histogram' | 'composed';

export type AggregationType = 'sum' | 'average' | 'count' | 'min' | 'max' | 'median';

export type NumberFormat = 'number' | 'percentage' | 'currency' | 'compact';

export type SortDirection = 'asc' | 'desc';

export interface FilterConfig {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains';
  value: string | number;
}

export interface ChartConfig {
  id: string;
  datasetId: string;
  name: string;
  chartType: ChartType;
  xAxis: string;
  yAxis: string[];
  groupBy?: string;
  aggregation: AggregationType;
  filters: FilterConfig[];
  sortBy?: string;
  sortDirection: SortDirection;
  title: string;
  subtitle?: string;
  showLegend: boolean;
  showGridlines: boolean;
  showMarkers: boolean;
  smoothLines: boolean;
  stacked: boolean;
  colorPalette: string;
  numberFormat: NumberFormat;
  createdAt: string;
}

export interface ColumnStats {
  column: string;
  type: ColumnType;
  count: number;
  missing: number;
  unique: number;
  mean?: number;
  median?: number;
  mode?: string | number;
  min?: number | string;
  max?: number | string;
  sum?: number;
  stdDev?: number;
  variance?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  range?: number;
}

export interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  duplicateRows: number;
  columnStats: ColumnStats[];
  warnings: ProfileWarning[];
}

export interface ProfileWarning {
  level: 'info' | 'warning' | 'error';
  message: string;
  column?: string;
}

export type ChartRecommendationConfidence = 'high' | 'medium' | 'low';

export interface ChartRecommendation {
  type: ChartType;
  title: string;
  description: string;
  reason: string;
  xAxis: string;
  yAxis: string[];
  confidence: ChartRecommendationConfidence;
  icon: string;
}

export type InsightType = 'info' | 'warning' | 'success' | 'trend';

export interface Insight {
  type: InsightType;
  title: string;
  description: string;
}

export type ColorPaletteName = 'default' | 'ocean' | 'sunset' | 'forest' | 'monochrome' | 'vivid';

export const COLOR_PALETTES: Record<ColorPaletteName, string[]> = {
  default: ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a855f7'],
  ocean:   ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#a5f3fc'],
  sunset:  ['#f97316', '#f59e0b', '#ef4444', '#ec4899', '#f43f5e', '#fb923c'],
  forest:  ['#10b981', '#059669', '#047857', '#065f46', '#84cc16', '#22c55e'],
  monochrome: ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'],
  vivid:   ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
};
