import type { Row, Column, ColumnStats, Insight, ColumnType } from '../types';

/** Extract numeric values from a column */
export function getNumericValues(rows: Row[], column: string): number[] {
  return rows
    .map(r => r[column])
    .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
    .map(v => Number(v));
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mode(values: (string | number)[]): string | number | undefined {
  if (values.length === 0) return undefined;
  const freq: Record<string, number> = {};
  values.forEach(v => { const k = String(v); freq[k] = (freq[k] || 0) + 1; });
  let maxCount = 0;
  let modeVal: string | number | undefined;
  Object.entries(freq).forEach(([k, count]) => {
    if (count > maxCount) { maxCount = count; modeVal = k; }
  });
  return modeVal;
}

export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1);
}

export function stdDev(values: number[]): number {
  return Math.sqrt(variance(values));
}

export function quartiles(values: number[]): { q1: number; q3: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lower = sorted.slice(0, mid);
  const upper = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
  return { q1: median(lower), q3: median(upper) };
}

export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return [];
  const { q1, q3 } = quartiles(values);
  const iqrVal = q3 - q1;
  const lower = q1 - 1.5 * iqrVal;
  const upper = q3 + 1.5 * iqrVal;
  return values.filter(v => v < lower || v > upper);
}

export function correlation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const xSlice = xs.slice(0, n);
  const ySlice = ys.slice(0, n);
  const xMean = mean(xSlice);
  const yMean = mean(ySlice);
  const num = xSlice.reduce((s, x, i) => s + (x - xMean) * (ySlice[i] - yMean), 0);
  const den = Math.sqrt(
    xSlice.reduce((s, x) => s + Math.pow(x - xMean, 2), 0) *
    ySlice.reduce((s, y) => s + Math.pow(y - yMean, 2), 0)
  );
  return den === 0 ? 0 : Math.max(-1, Math.min(1, num / den));
}

export function trendDirection(values: number[]): 'up' | 'down' | 'flat' {
  if (values.length < 2) return 'flat';
  const first = values[0];
  const last = values[values.length - 1];
  const change = (last - first) / (Math.abs(first) || 1);
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'flat';
}

/** Compute growth rate (%) between first and last value */
export function growthRate(values: number[]): number {
  if (values.length < 2 || values[0] === 0) return 0;
  return ((values[values.length - 1] - values[0]) / Math.abs(values[0])) * 100;
}

/** Moving average */
export function movingAverage(values: number[], window = 3): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return mean(slice);
  });
}

export function computeColumnStats(rows: Row[], column: string, type: ColumnType): ColumnStats {
  const allValues = rows.map(r => r[column]);
  const missing = allValues.filter(v => v === null || v === undefined || v === '').length;
  const nonMissing = allValues.filter(v => v !== null && v !== undefined && v !== '');
  const unique = new Set(nonMissing.map(String)).size;

  const stats: ColumnStats = { column, type, count: rows.length, missing, unique };

  if (type === 'number' || type === 'percentage' || type === 'currency') {
    const nums = getNumericValues(rows, column);
    if (nums.length > 0) {
      stats.mean = mean(nums);
      stats.median = median(nums);
      stats.mode = mode(nums);
      stats.min = Math.min(...nums);
      stats.max = Math.max(...nums);
      stats.sum = nums.reduce((a, b) => a + b, 0);
      stats.stdDev = stdDev(nums);
      stats.variance = variance(nums);
      stats.range = (stats.max as number) - (stats.min as number);
      if (nums.length >= 4) {
        const { q1, q3 } = quartiles(nums);
        stats.q1 = q1;
        stats.q3 = q3;
        stats.iqr = q3 - q1;
      }
    }
  } else {
    if (nonMissing.length > 0) {
      const sorted = [...nonMissing].map(String).sort();
      stats.min = sorted[0];
      stats.max = sorted[sorted.length - 1];
      stats.mode = mode(nonMissing as string[]);
    }
  }

  return stats;
}

export function generateInsights(rows: Row[], columns: Column[]): Insight[] {
  const insights: Insight[] = [];
  const numCols = columns.filter(c => ['number', 'currency', 'percentage'].includes(c.type));
  const catCols = columns.filter(c => ['category', 'text'].includes(c.type));

  insights.push({
    type: 'info',
    title: 'Dataset Overview',
    description: `Your dataset has ${rows.length.toLocaleString()} rows and ${columns.length} columns (${numCols.length} numeric, ${catCols.length} categorical).`,
  });

  numCols.forEach(col => {
    const nums = getNumericValues(rows, col.name);
    if (nums.length === 0) return;

    const cv = nums.length > 0 ? stdDev(nums) / (Math.abs(mean(nums)) || 1) : 0;
    if (cv > 1) {
      insights.push({
        type: 'warning',
        title: `High Variability — "${col.name}"`,
        description: `"${col.name}" has a high coefficient of variation (${(cv * 100).toFixed(0)}%), indicating significant spread.`,
      });
    }

    const outliers = detectOutliers(nums);
    if (outliers.length > 0) {
      insights.push({
        type: 'warning',
        title: `Outliers in "${col.name}"`,
        description: `${outliers.length} potential outlier${outliers.length > 1 ? 's' : ''} detected (outside 1.5× IQR).`,
      });
    }

    const trend = trendDirection(nums);
    if (trend !== 'flat') {
      const rate = growthRate(nums);
      insights.push({
        type: 'trend',
        title: `"${col.name}" Trend`,
        description: `"${col.name}" shows an overall ${trend === 'up' ? '↑ upward' : '↓ downward'} trend (${rate > 0 ? '+' : ''}${rate.toFixed(1)}% change from first to last value).`,
      });
    }
  });

  // Correlation insights for first two numeric columns
  if (numCols.length >= 2) {
    const x = getNumericValues(rows, numCols[0].name);
    const y = getNumericValues(rows, numCols[1].name);
    const corr = correlation(x, y);
    const absCorr = Math.abs(corr);
    if (absCorr > 0.7) {
      insights.push({
        type: 'success',
        title: 'Strong Correlation Detected',
        description: `"${numCols[0].name}" and "${numCols[1].name}" are strongly ${corr > 0 ? 'positively' : 'negatively'} correlated (r = ${corr.toFixed(2)}).`,
      });
    } else if (absCorr > 0.4) {
      insights.push({
        type: 'info',
        title: 'Moderate Correlation',
        description: `"${numCols[0].name}" and "${numCols[1].name}" show moderate ${corr > 0 ? 'positive' : 'negative'} correlation (r = ${corr.toFixed(2)}).`,
      });
    }
  }

  // Category distribution insights
  catCols.slice(0, 2).forEach(col => {
    const values = rows.map(r => r[col.name]).filter(v => v !== null && v !== undefined && v !== '');
    const total = values.length;
    if (total === 0) return;
    const freq: Record<string, number> = {};
    values.forEach(v => { const k = String(v); freq[k] = (freq[k] || 0) + 1; });
    const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      const topPct = ((entries[0][1] / total) * 100).toFixed(1);
      insights.push({
        type: 'info',
        title: `Top Category — "${col.name}"`,
        description: `"${entries[0][0]}" is the most common value in "${col.name}", representing ${topPct}% of all entries.`,
      });
    }
  });

  // Missing values
  const missingCols = columns.filter(col =>
    rows.some(r => r[col.name] === null || r[col.name] === undefined || r[col.name] === '')
  );
  if (missingCols.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Missing Values Present',
      description: `${missingCols.length} column(s) contain missing values: ${missingCols.map(c => `"${c.name}"`).join(', ')}.`,
    });
  }

  return insights;
}

/** Aggregate rows by a group column */
export function aggregateData(
  rows: Row[],
  xField: string,
  yFields: string[],
  agg: string
): Row[] {
  const groups = new Map<string, Row[]>();
  rows.forEach(row => {
    const key = String(row[xField] ?? '(empty)');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  });

  return Array.from(groups.entries()).map(([key, groupRows]) => {
    const result: Row = { [xField]: key };
    yFields.forEach(field => {
      const nums = getNumericValues(groupRows, field);
      if (nums.length === 0) { result[field] = null; return; }
      switch (agg) {
        case 'sum': result[field] = nums.reduce((a, b) => a + b, 0); break;
        case 'average': result[field] = mean(nums); break;
        case 'count': result[field] = groupRows.length; break;
        case 'min': result[field] = Math.min(...nums); break;
        case 'max': result[field] = Math.max(...nums); break;
        case 'median': result[field] = median(nums); break;
        default: result[field] = nums.reduce((a, b) => a + b, 0);
      }
    });
    return result;
  });
}

/** Apply filters to rows */
export function applyFilters(rows: Row[], filters: import('../types').FilterConfig[]): Row[] {
  return rows.filter(row =>
    filters.every(f => {
      const val = row[f.column];
      const fval = f.value;
      switch (f.operator) {
        case 'eq': return String(val) === String(fval);
        case 'neq': return String(val) !== String(fval);
        case 'gt': return Number(val) > Number(fval);
        case 'gte': return Number(val) >= Number(fval);
        case 'lt': return Number(val) < Number(fval);
        case 'lte': return Number(val) <= Number(fval);
        case 'contains': return String(val).toLowerCase().includes(String(fval).toLowerCase());
        case 'notContains': return !String(val).toLowerCase().includes(String(fval).toLowerCase());
        default: return true;
      }
    })
  );
}
