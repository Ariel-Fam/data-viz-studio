'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  BarChart3, Database, Plus, Trash2, ChevronRight,
  Eye, LayoutGrid, Import,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAppStore } from '../store/AppContext';
import { ChartRenderer } from '../components/ChartRenderer';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import type { Dataset } from '../types';

function StatCard({ label, value, sub, color = '' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className={`break-words text-xl font-bold sm:text-2xl ${color}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="mt-0.5 break-words text-sm font-medium leading-tight">{label}</div>
      {sub && <div className="mt-0.5 break-words text-xs leading-snug text-muted-foreground">{sub}</div>}
    </div>
  );
}

function DatasetCard({ dataset }: { dataset: Dataset }) {
  const router = useRouter();
  const { removeDataset } = useAppStore();
  const numCols = dataset.columns.filter(c => ['number', 'currency', 'percentage'].includes(c.type)).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Database className="size-4 text-primary" />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => router.push(`/dataset/${dataset.id}`)}>
            <Eye className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 hover:text-destructive" onClick={() => void removeDataset(dataset.id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <h3 className="font-semibold text-sm mb-1 leading-tight">{dataset.name}</h3>
      {dataset.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{dataset.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" />{dataset.rows.length.toLocaleString()} rows</span>
        <span>•</span>
        <span>{dataset.columns.length} cols ({numCols} numeric)</span>
        <span>•</span>
        <Badge variant="secondary" className="text-xs px-1.5 py-0">{dataset.source}</Badge>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs h-7"
        onClick={() => router.push(`/dataset/${dataset.id}`)}
      >
        <Eye className="size-3.5" />
        Explore Dataset
        <ChevronRight className="size-3 ml-auto" />
      </Button>
    </motion.div>
  );
}

function ChartCard({ chart }: { chart: ReturnType<typeof useAppStore>['charts'][0] }) {
  const router = useRouter();
  const { getDataset, removeChart } = useAppStore();
  const dataset = getDataset(chart.datasetId);

  if (!dataset) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="font-semibold text-sm truncate">{chart.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => router.push(`/charts/${chart.id}`)}>
            <Eye className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 hover:text-destructive" onClick={() => removeChart(chart.id)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{dataset.name} • {chart.chartType}</p>

      <div className="rounded-lg overflow-hidden bg-muted/20 border border-border/50">
        <ChartRenderer config={chart} dataset={dataset} height={160} />
      </div>

      <Button
        size="sm" variant="outline"
        className="w-full gap-1.5 text-xs h-7 mt-3"
        onClick={() => router.push(`/charts/${chart.id}`)}
      >
        Edit Chart
        <ChevronRight className="size-3 ml-auto" />
      </Button>
    </motion.div>
  );
}

export function DashboardPage() {
  const router = useRouter();
  const { datasets, charts, addDataset } = useAppStore();

  const loadSample = async (sample: typeof SAMPLE_DATASETS[0]) => {
    const exists = datasets.find(d => d.id === sample.id || d.name === sample.name);
    if (exists) { router.push(`/dataset/${exists.id}`); return; }
    const id = await addDataset({ name: sample.name, description: sample.description, source: 'sample', columns: sample.columns, rows: sample.rows });
    router.push(`/dataset/${id}`);
  };

  const totalRows = datasets.reduce((s, d) => s + d.rows.length, 0);

  return (
    <div className="space-y-5 p-3 sm:space-y-6 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-3xl font-semibold leading-tight sm:text-4xl">
            <LayoutGrid className="size-5 text-primary" />
            Dashboard
          </h1>
          <p className="mt-1 max-w-[40ch] text-sm text-muted-foreground">
            Your data workspace — datasets, charts, and analytics at a glance.
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full gap-1.5 px-3 text-xs sm:w-auto sm:text-sm"
            onClick={() => router.push('/import')}
          >
            <Import className="size-4" />
            Import Data
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Datasets" value={datasets.length} sub="imported or manual" color="text-primary" />
        <StatCard label="Charts" value={charts.length} sub="saved visualizations" color="text-violet-500" />
        <StatCard label="Total Rows" value={totalRows} sub="across all datasets" color="text-emerald-500" />
        <StatCard label="Columns" value={datasets.reduce((s, d) => s + d.columns.length, 0)} sub="total data columns" color="text-cyan-500" />
      </div>

      {/* Empty state */}
      {datasets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-5 text-center sm:p-12">
          <BarChart3 className="size-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="font-semibold mb-2">No datasets yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Import a CSV file, paste JSON, or enter data manually to start exploring.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button className="gap-2" onClick={() => router.push('/import')}>
              <Plus className="size-4" />
              Import Data
            </Button>
          </div>

          {/* Sample datasets */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Or try a sample dataset:</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {SAMPLE_DATASETS.map(s => (
                <Button key={s.id} variant="outline" size="sm" className="gap-1.5" onClick={() => void loadSample(s)}>
                  <Database className="size-3.5" />
                  {s.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Datasets */}
      {datasets.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium flex items-center gap-2">
              <Database className="size-4 text-muted-foreground" />
              Datasets ({datasets.length})
            </h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => router.push('/import')}>
              <Plus className="size-3.5" />
              Add Dataset
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {datasets.map(ds => <DatasetCard key={ds.id} dataset={ds} />)}
          </div>
        </section>
      )}

      {/* Charts */}
      {charts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              Saved Charts ({charts.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {charts.map(c => <ChartCard key={c.id} chart={c} />)}
          </div>
        </section>
      )}

      {/* Sample datasets prompt */}
      {datasets.length > 0 && (
        <section className="rounded-xl border border-dashed border-border p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-medium">Explore sample datasets</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Try pre-built datasets to see the full feature set.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {SAMPLE_DATASETS.map(s => (
                <Button key={s.id} variant="outline" size="sm" className="text-xs gap-1.5 h-7" onClick={() => void loadSample(s)}>
                  <Database className="size-3" />
                  {s.name.split(' ').slice(0, 2).join(' ')}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
