import Papa from 'papaparse';
import type { Column, Row, ColumnType } from '../types';

/** Detect the data type of a column based on its values */
export function detectType(values: (string | null | undefined)[]): ColumnType {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '').map(String);
  if (nonEmpty.length === 0) return 'text';

  const boolPattern = /^(true|false|yes|no)$/i;
  if (nonEmpty.every(v => boolPattern.test(v))) return 'boolean';

  const numPattern = /^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$/;
  if (nonEmpty.every(v => numPattern.test(v.replace(/\s/g, '')))) return 'number';

  const pctPattern = /^-?\d+(\.\d+)?%$/;
  if (nonEmpty.every(v => pctPattern.test(v.trim()))) return 'percentage';

  const currPattern = /^[$€£¥]\s*-?\d[\d,.]*$|^-?\d[\d,.]*\s*[$€£¥]$/;
  if (nonEmpty.every(v => currPattern.test(v.trim()))) return 'currency';

  // Date detection: ISO format, MM/DD/YYYY, DD-MM-YYYY etc.
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,
    /^[A-Z][a-z]{2}\s+\d{4}$/,
    /^\d{4}\/\d{2}\/\d{2}$/,
  ];
  const dateMatches = nonEmpty.filter(v => datePatterns.some(p => p.test(v.trim())));
  if (dateMatches.length > nonEmpty.length * 0.8) return 'date';

  // Category: fewer unique values relative to total
  const unique = new Set(nonEmpty).size;
  if (unique <= Math.min(30, nonEmpty.length * 0.4)) return 'category';

  return 'text';
}

/** Parse a raw value based on detected column type */
function parseValue(raw: string | undefined | null, type: ColumnType): string | number | boolean | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const trimmed = raw.trim();

  switch (type) {
    case 'number': {
      const cleaned = trimmed.replace(/,/g, '');
      const n = parseFloat(cleaned);
      return isNaN(n) ? null : n;
    }
    case 'currency': {
      const cleaned = trimmed.replace(/[$€£¥,\s]/g, '');
      const n = parseFloat(cleaned);
      return isNaN(n) ? null : n;
    }
    case 'percentage': {
      const cleaned = trimmed.replace('%', '');
      const n = parseFloat(cleaned);
      return isNaN(n) ? null : n;
    }
    case 'boolean':
      return /^(true|yes|1)$/i.test(trimmed);
    default:
      return trimmed;
  }
}

/** Parse CSV string using PapaParse */
export function parseCSV(content: string): { columns: Column[]; rows: Row[]; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  const errors: string[] = result.errors.map((e: Papa.ParseError) => e.message);
  const headers = (result.meta.fields ?? []) as string[];
  const rawRows = result.data;

  if (headers.length === 0) {
    return { columns: [], rows: [], errors: ['No headers detected. Please check your CSV format.'] };
  }

  const columns: Column[] = headers.map(header => {
    const values = rawRows.map((r: Record<string, string>) => r[header] ?? null);
    const type = detectType(values);
    return { name: header, key: header, type };
  });

  const rows: Row[] = rawRows.map((raw: Record<string, string>) => {
    const row: Row = {};
    columns.forEach(col => {
      row[col.name] = parseValue(raw[col.name], col.type);
    });
    return row;
  });

  return { columns, rows, errors };
}

/** Flatten nested JSON object to a single level */
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val as Record<string, unknown>, newKey));
    } else {
      result[newKey] = val === null || val === undefined ? '' : String(val);
    }
  }
  return result;
}

/** Parse JSON string into tabular format */
export function parseJSON(content: string): { columns: Column[]; rows: Row[]; errors: string[] } {
  try {
    const parsed = JSON.parse(content);
    let arr: Record<string, string>[] = [];

    if (Array.isArray(parsed)) {
      arr = parsed
        .filter(item => typeof item === 'object' && item !== null && !Array.isArray(item))
        .map(item => flattenObject(item as Record<string, unknown>));
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Try to find an array inside
      const arrKey = Object.keys(parsed).find(k => Array.isArray((parsed as Record<string, unknown>)[k]));
      if (arrKey) {
        const innerArr = (parsed as Record<string, unknown[]>)[arrKey];
        arr = innerArr
          .filter(item => typeof item === 'object' && item !== null)
          .map(item => flattenObject(item as Record<string, unknown>));
      } else {
        // Top-level key-value object → single row or key-value rows
        const entries = Object.entries(parsed as Record<string, unknown>);
        arr = entries.map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''),
        }));
      }
    }

    if (arr.length === 0) {
      return { columns: [], rows: [], errors: ['No tabular data found in JSON. Expected an array of objects.'] };
    }

    const headers = Array.from(new Set(arr.flatMap(obj => Object.keys(obj))));

    const columns: Column[] = headers.map(header => {
      const values = arr.map(r => r[header] ?? null);
      const type = detectType(values);
      return { name: header, key: header, type };
    });

    const rows: Row[] = arr.map(raw => {
      const row: Row = {};
      columns.forEach(col => {
        row[col.name] = parseValue(raw[col.name], col.type);
      });
      return row;
    });

    return { columns, rows, errors: [] };
  } catch (e) {
    return {
      columns: [],
      rows: [],
      errors: [`Invalid JSON: ${(e as Error).message}`],
    };
  }
}

/** Count duplicate rows */
export function countDuplicates(rows: Row[]): number {
  const seen = new Set<string>();
  let dupes = 0;
  rows.forEach(row => {
    const key = JSON.stringify(row);
    if (seen.has(key)) dupes++;
    else seen.add(key);
  });
  return dupes;
}
