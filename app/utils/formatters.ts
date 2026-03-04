import type { NumberFormat } from '../types';

export function formatNumber(value: number | null | undefined, format: NumberFormat = 'number', decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '—';

  switch (format) {
    case 'percentage':
      return `${value.toFixed(decimals)}%`;
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
    case 'compact':
      return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    case 'number':
    default:
      return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(value);
  }
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatStat(value: number | string | undefined, precision = 2): string {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'string') return value;
  if (isNaN(value)) return '—';
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: precision });
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
