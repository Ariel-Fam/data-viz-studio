'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Upload, FileText, Braces, PenLine, CheckCircle2,
  AlertCircle, X, Plus, Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAppStore } from '../store/AppContext';
import { parseCSV, parseJSON } from '../utils/parser';
import type { Column, ColumnType, Row } from '../types';

const COLUMN_TYPES: ColumnType[] = ['number', 'text', 'category', 'date', 'boolean', 'percentage', 'currency'];

// ── CSV Tab ────────────────────────────────────────────────────────────────────
function CSVImport() {
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<{ columns: Column[]; rows: Row[]; errors: string[] } | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addDataset } = useAppStore();
  const router = useRouter();

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setPreviewData({ columns: [], rows: [], errors: ['Please upload a valid .csv file.'] });
      return;
    }
    setDatasetName(file.name.replace('.csv', ''));
    const reader = new FileReader();
    reader.onload = e => {
      const result = parseCSV(e.target?.result as string);
      setPreviewData(result);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleImport = async () => {
    if (!previewData || previewData.rows.length === 0) return;
    const id = await addDataset({
      name: datasetName || 'CSV Import',
      source: 'csv',
      columns: previewData.columns,
      rows: previewData.rows,
    });
    router.push(`/dataset/${id}`);
  };

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/40'
        }`}
      >
        <Upload className={`size-8 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="font-medium text-sm mb-1">Drop your CSV file here</p>
        <p className="text-xs text-muted-foreground">or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />
      </div>

      {/* Errors */}
      {previewData?.errors?.map((err, i) => (
        <div key={i} className="flex gap-2 items-start rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{err}</p>
        </div>
      ))}

      {/* Preview */}
      {previewData && previewData.rows.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="size-4" />
              <span className="text-sm font-medium">
                Parsed {previewData.rows.length.toLocaleString()} rows, {previewData.columns.length} columns
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dataset Name</label>
            <Input value={datasetName} onChange={e => setDatasetName(e.target.value)} placeholder="My Dataset" />
          </div>

          {/* Column type remapping */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Column Types (auto-detected — adjust if needed)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {previewData.columns.map((col, i) => (
                <div key={col.key} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-sm flex-1 truncate">{col.name}</span>
                  <Select
                    value={col.type}
                    onValueChange={val => {
                      const newCols = [...previewData.columns];
                      newCols[i] = { ...col, type: val as ColumnType };
                      setPreviewData({ ...previewData, columns: newCols });
                    }}
                  >
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div className="rounded-lg border border-border overflow-auto max-h-48">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  {previewData.columns.map(col => (
                    <th key={col.key} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                      {col.name}
                      <Badge className="ml-1.5 text-xs px-1 py-0" variant="secondary">{col.type}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.slice(0, 6).map((row, ri) => (
                  <tr key={ri} className="border-t border-border">
                    {previewData.columns.map(col => (
                      <td key={col.key} className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                        {row[col.name] === null ? <span className="italic opacity-50">null</span> : String(row[col.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button className="gap-2" onClick={() => void handleImport()}>
            <CheckCircle2 className="size-4" />
            Import Dataset ({previewData.rows.length.toLocaleString()} rows)
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ── JSON Tab ───────────────────────────────────────────────────────────────────
function JSONImport() {
  const [jsonText, setJsonText] = useState('');
  const [previewData, setPreviewData] = useState<{ columns: Column[]; rows: Row[]; errors: string[] } | null>(null);
  const [datasetName, setDatasetName] = useState('JSON Import');
  const { addDataset } = useAppStore();
  const router = useRouter();

  const handleParse = () => {
    const result = parseJSON(jsonText);
    setPreviewData(result);
  };

  const handleImport = async () => {
    if (!previewData || previewData.rows.length === 0) return;
    const id = await addDataset({ name: datasetName, source: 'json', columns: previewData.columns, rows: previewData.rows });
    router.push(`/dataset/${id}`);
  };

  const EXAMPLE = `[
  { "month": "Jan", "revenue": 42000, "category": "Alpha" },
  { "month": "Feb", "revenue": 58000, "category": "Alpha" },
  { "month": "Mar", "revenue": 71000, "category": "Beta" }
]`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Paste JSON Data</label>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setJsonText(EXAMPLE)}>
            Load example
          </Button>
        </div>
        <Textarea
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          placeholder='[{ "name": "Alice", "score": 95 }, ...]'
          className="font-mono text-xs min-h-40 resize-y"
        />
      </div>

      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleParse} disabled={!jsonText.trim()}>
        <Braces className="size-4" />
        Parse JSON
      </Button>

      {previewData?.errors?.map((err, i) => (
        <div key={i} className="flex gap-2 items-start rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{err}</p>
        </div>
      ))}

      {previewData && previewData.rows.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="size-4" />
            <span className="text-sm font-medium">{previewData.rows.length} rows, {previewData.columns.length} columns detected</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dataset Name</label>
            <Input value={datasetName} onChange={e => setDatasetName(e.target.value)} />
          </div>

          <div className="rounded-lg border border-border overflow-auto max-h-40">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  {previewData.columns.map(col => (
                    <th key={col.key} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                      {col.name} <Badge className="ml-1 text-xs px-1 py-0" variant="secondary">{col.type}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.slice(0, 5).map((row, ri) => (
                  <tr key={ri} className="border-t border-border">
                    {previewData.columns.map(col => (
                      <td key={col.key} className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                        {String(row[col.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button className="gap-2" onClick={() => void handleImport()}>
            <CheckCircle2 className="size-4" />
            Import Dataset
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ── Manual Entry Tab ───────────────────────────────────────────────────────────
function ManualEntry() {
  const [datasetName, setDatasetName] = useState('My Dataset');
  const [columns, setColumns] = useState<Column[]>([
    { name: 'Name', key: 'Name', type: 'text' },
    { name: 'Value', key: 'Value', type: 'number' },
  ]);
  const [rows, setRows] = useState<Row[]>([
    { Name: '', Value: '' },
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const { addDataset } = useAppStore();
  const router = useRouter();

  const addColumn = () => {
    const name = `Column ${columns.length + 1}`;
    setColumns(c => [...c, { name, key: name, type: 'text' }]);
    setRows(r => r.map(row => ({ ...row, [name]: '' })));
  };

  const updateColumnName = (i: number, name: string) => {
    const oldKey = columns[i].key;
    const newCols = [...columns];
    newCols[i] = { ...newCols[i], name, key: name };
    setColumns(newCols);
    setRows(rows.map(r => {
      const newRow = { ...r, [name]: r[oldKey] };
      delete newRow[oldKey];
      return newRow;
    }));
  };

  const removeColumn = (i: number) => {
    const key = columns[i].key;
    setColumns(c => c.filter((_, ci) => ci !== i));
    setRows(r => r.map(row => { const nr = { ...row }; delete nr[key]; return nr; }));
  };

  const addRow = () => {
    const newRow: Row = {};
    columns.forEach(col => { newRow[col.key] = ''; });
    setRows(r => [...r, newRow]);
  };

  const removeRow = (i: number) => setRows(r => r.filter((_, ri) => ri !== i));

  const updateCell = (rowIdx: number, colKey: string, val: string) => {
    setRows(r => r.map((row, i) => i === rowIdx ? { ...row, [colKey]: val } : row));
  };

  const handleImport = async () => {
    const errs: string[] = [];
    if (!datasetName.trim()) errs.push('Dataset name is required.');
    if (columns.length === 0) errs.push('Add at least one column.');
    const dupNames = columns.map(c => c.name).filter((n, i, arr) => arr.indexOf(n) !== i);
    if (dupNames.length > 0) errs.push(`Duplicate column names: ${dupNames.join(', ')}`);
    setErrors(errs);
    if (errs.length > 0) return;

    // Cast values based on column type
    const typedRows: Row[] = rows.map(row => {
      const nr: Row = {};
      columns.forEach(col => {
        const raw = String(row[col.key] ?? '').trim();
        if (raw === '') { nr[col.key] = null; return; }
        if (col.type === 'number' || col.type === 'currency' || col.type === 'percentage') {
          const n = parseFloat(raw.replace(/[$€£%,]/g, ''));
          nr[col.key] = isNaN(n) ? null : n;
        } else if (col.type === 'boolean') {
          nr[col.key] = /^(true|yes|1)$/i.test(raw);
        } else {
          nr[col.key] = raw;
        }
      });
      return nr;
    }).filter(row => Object.values(row).some(v => v !== null && v !== ''));

    const id = await addDataset({ name: datasetName, source: 'manual', columns, rows: typedRows });
    router.push(`/dataset/${id}`);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Dataset Name</label>
        <Input value={datasetName} onChange={e => setDatasetName(e.target.value)} placeholder="My Dataset" />
      </div>

      {errors.map((e, i) => (
        <div key={i} className="flex gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{e}</p>
        </div>
      ))}

      {/* Spreadsheet grid */}
      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="w-8 px-2 py-2 text-xs text-muted-foreground">#</th>
              {columns.map((col, ci) => (
                <th key={col.key} className="px-2 py-1.5 min-w-32 border-l border-border">
                  <div className="flex items-center gap-1">
                    <Input
                      value={col.name}
                      onChange={e => updateColumnName(ci, e.target.value)}
                      className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium"
                      placeholder="Column name"
                    />
                    <Select
                      value={col.type}
                      onValueChange={val => {
                        const nc = [...columns]; nc[ci] = { ...nc[ci], type: val as ColumnType }; setColumns(nc);
                      }}
                    >
                      <SelectTrigger className="h-6 w-24 text-xs border-0 bg-transparent p-0 focus-visible:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMN_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button onClick={() => removeColumn(ci)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="size-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-2 py-1.5 border-l border-border">
                <button onClick={addColumn} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="size-3.5" />
                  Add
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t border-border hover:bg-accent/20 group">
                <td className="px-2 py-1 text-xs text-muted-foreground text-center">{ri + 1}</td>
                {columns.map(col => (
                  <td key={col.key} className="border-l border-border px-0 py-0">
                    <Input
                      value={String(row[col.key] ?? '')}
                      onChange={e => updateCell(ri, col.key, e.target.value)}
                      className="h-8 rounded-none border-0 focus-visible:ring-0 text-sm bg-transparent"
                      placeholder="—"
                    />
                  </td>
                ))}
                <td className="border-l border-border px-2">
                  <button onClick={() => removeRow(ri)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
          <Plus className="size-4" />
          Add Row
        </Button>
        <Button className="gap-2" onClick={() => void handleImport()}>
          <CheckCircle2 className="size-4" />
          Create Dataset ({rows.length} rows)
        </Button>
      </div>
    </div>
  );
}

// ── Main Import Page ───────────────────────────────────────────────────────────
export function ImportPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-semibold">Import Data</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a CSV file, paste JSON, or enter data manually.
        </p>
      </div>

      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="csv" className="flex-1 gap-1.5">
            <FileText className="size-4" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger value="json" className="flex-1 gap-1.5">
            <Braces className="size-4" />
            JSON Paste
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex-1 gap-1.5">
            <PenLine className="size-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="csv"><CSVImport /></TabsContent>
          <TabsContent value="json"><JSONImport /></TabsContent>
          <TabsContent value="manual"><ManualEntry /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
