'use client';

import { useState, useCallback } from 'react';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, RotateCcw, Download,
  BarChart2, BarChart3, TrendingUp, PieChart, Circle, Radar, GitBranch,
  Activity, Layers, Info, ChevronDown, ChevronUp, Lightbulb,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAppStore } from '../store/AppContext';
import { ChartRenderer } from '../components/ChartRenderer';
import { InsightPanel } from '../components/InsightPanel';
import { COLOR_PALETTES, type ChartType, type AggregationType, type NumberFormat, type ChartConfig } from '../types';
import { generateInsights } from '../utils/stats';
import { toast } from 'sonner';

// ── Chart type config ──────────────────────────────────────────────────────────
const CHART_TYPES: { type: ChartType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'bar', label: 'Bar', icon: BarChart3 },
  { type: 'line', label: 'Line', icon: TrendingUp },
  { type: 'area', label: 'Area', icon: Activity },
  { type: 'pie', label: 'Pie', icon: PieChart },
  { type: 'donut', label: 'Donut', icon: Circle },
  { type: 'scatter', label: 'Scatter', icon: GitBranch },
  { type: 'radar', label: 'Radar', icon: Radar },
  { type: 'histogram', label: 'Histogram', icon: BarChart2 },
  { type: 'composed', label: 'Combo', icon: Layers },
];

const AGGREGATIONS: { value: AggregationType; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'median', label: 'Median' },
];

const NUMBER_FORMATS: { value: NumberFormat; label: string }[] = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'compact', label: 'Compact (1.2K)' },
];

// ── Collapsible section ────────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        {title}
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function ConfigRow({ label, children, tooltip }: { label: string; children: React.ReactNode; tooltip?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-normal text-muted-foreground">{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help"><Info className="size-3 text-muted-foreground/50" /></span>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-48">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Main chart builder ─────────────────────────────────────────────────────────
export function ChartBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { getChart, getDataset, updateChart } = useAppStore();

  const chart = getChart(id ?? '');
  const dataset = chart ? getDataset(chart.datasetId) : undefined;

  // All hooks must be called before any early returns
  const [config, setConfig] = useState<ChartConfig | undefined>(chart);

  const update = useCallback((patch: Partial<ChartConfig>) => {
    setConfig(c => c ? { ...c, ...patch } : c);
  }, []);

  const handleSave = useCallback(() => {
    if (config) {
      updateChart(config);
      toast.success('Chart saved!');
    }
  }, [config, updateChart]);

  const handleReset = useCallback(() => {
    if (chart) {
      setConfig(chart);
      toast.info('Chart reset to last saved state.');
    }
  }, [chart]);

  const handleExport = useCallback(() => {
    const svg = document.querySelector('.recharts-wrapper svg');
    if (!svg) { toast.error('No chart to export.'); return; }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `${config?.title ?? 'chart'}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [config]);

  // Early return after all hooks
  if (!chart || !dataset || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <BarChart3 className="size-12 text-muted-foreground/40" />
        <h2 className="font-semibold">Chart not found</h2>
        <Button onClick={() => router.push('/dashboard')}>← Back to Dashboard</Button>
      </div>
    );
  }

  const numericCols = dataset.columns.filter(c => ['number', 'currency', 'percentage'].includes(c.type)).map(c => c.name);
  const allCols = dataset.columns.map(c => c.name);
  const insights = generateInsights(dataset.rows, dataset.columns);

  return (
    <div className="flex h-full">
      {/* Left panel: config */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col bg-card">
        <div className="border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/dataset/${dataset.id}`)}
              className="p-1 rounded hover:bg-accent text-muted-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{config.title}</p>
              <p className="text-xs text-muted-foreground truncate">{dataset.name}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Chart type selector */}
          <Section title="Chart Type">
            <div className="grid grid-cols-3 gap-1.5">
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.type}
                  onClick={() => update({ chartType: ct.type })}
                  className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs border transition-colors ${
                    config.chartType === ct.type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ct.icon className="size-4" />
                  {ct.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Title */}
          <Section title="Title & Labels">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Chart Title</Label>
                <Input value={config.title} onChange={e => update({ title: e.target.value })} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Subtitle (optional)</Label>
                <Input
                  value={config.subtitle ?? ''}
                  onChange={e => update({ subtitle: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="Optional subtitle"
                />
              </div>
            </div>
          </Section>

          {/* Axes */}
          <Section title="Axes & Data">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">X Axis</Label>
                <Select value={config.xAxis} onValueChange={v => update({ xAxis: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select column" /></SelectTrigger>
                  <SelectContent>
                    {allCols.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Y Axis (values)</Label>
                <div className="space-y-1">
                  {config.yAxis.map((y, i) => (
                    <div key={i} className="flex gap-1">
                      <Select value={y} onValueChange={v => {
                        const ny = [...config.yAxis]; ny[i] = v; update({ yAxis: ny });
                      }}>
                        <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {numericCols.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost" size="icon" className="size-8 shrink-0"
                        onClick={() => update({ yAxis: config.yAxis.filter((_, ci) => ci !== i) })}
                        disabled={config.yAxis.length <= 1}
                      >×</Button>
                    </div>
                  ))}
                  {numericCols.length > config.yAxis.length && config.chartType !== 'pie' && config.chartType !== 'donut' && (
                    <Button
                      variant="outline" size="sm" className="w-full h-7 text-xs"
                      onClick={() => {
                        const next = numericCols.find(c => !config.yAxis.includes(c));
                        if (next) update({ yAxis: [...config.yAxis, next] });
                      }}
                    >+ Add Y Series</Button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Aggregation</Label>
                <Select value={config.aggregation} onValueChange={v => update({ aggregation: v as AggregationType })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGGREGATIONS.map(a => <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* Sort & Filter */}
          <Section title="Sort & Filter" defaultOpen={false}>
            <div className="space-y-2">
              <ConfigRow label="Sort by">
                <Select value={config.sortBy ?? '__none__'} onValueChange={v => update({ sortBy: v === '__none__' ? undefined : v })}>
                  <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" className="text-xs">None</SelectItem>
                    {allCols.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </ConfigRow>
              <ConfigRow label="Direction">
                <Select value={config.sortDirection} onValueChange={v => update({ sortDirection: v as 'asc' | 'desc' })}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc" className="text-xs">Ascending</SelectItem>
                    <SelectItem value="desc" className="text-xs">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </ConfigRow>
            </div>
          </Section>

          {/* Display */}
          <Section title="Display Options">
            <div className="space-y-3">
              {[
                { key: 'showLegend', label: 'Show Legend' },
                { key: 'showGridlines', label: 'Gridlines', tooltip: 'Show background grid lines' },
                { key: 'showMarkers', label: 'Data Markers', tooltip: 'Show dots at data points' },
                { key: 'smoothLines', label: 'Smooth Lines', tooltip: 'Curved interpolation for line/area charts' },
                { key: 'stacked', label: 'Stacked Mode', tooltip: 'Stack multiple series on top of each other' },
              ].map(opt => (
                <ConfigRow key={opt.key} label={opt.label} tooltip={opt.tooltip}>
                  <Switch
                    checked={!!config[opt.key as keyof ChartConfig]}
                    onCheckedChange={v => update({ [opt.key]: v })}
                    className="scale-90"
                  />
                </ConfigRow>
              ))}
            </div>
          </Section>

          {/* Format */}
          <Section title="Number Format" defaultOpen={false}>
            <Select value={config.numberFormat} onValueChange={v => update({ numberFormat: v as NumberFormat })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {NUMBER_FORMATS.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Section>

          {/* Color palette */}
          <Section title="Color Palette" defaultOpen={false}>
            <div className="space-y-2">
              {(Object.entries(COLOR_PALETTES) as [string, string[]][]).map(([name, colors]) => (
                <button
                  key={name}
                  onClick={() => update({ colorPalette: name })}
                  className={`w-full flex items-center gap-2 rounded-lg p-2 border transition-colors ${
                    config.colorPalette === name ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex gap-1">
                    {colors.slice(0, 5).map((c, i) => (
                      <div key={i} className="size-4 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-xs capitalize">{name}</span>
                  {config.colorPalette === name && <span className="ml-auto text-xs text-primary">✓</span>}
                </button>
              ))}
            </div>
          </Section>
        </ScrollArea>
      </div>

      {/* Center: chart preview */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-border px-4 py-2.5 flex items-center gap-2 shrink-0">
          <div className="flex-1">
            <p className="text-sm font-medium">{config.title}</p>
            {config.subtitle && <p className="text-xs text-muted-foreground">{config.subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{config.chartType}</Badge>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8" onClick={handleReset}>
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleExport}>
              <Download className="size-3.5" />
              Export
            </Button>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleSave}>
              <Save className="size-3.5" />
              Save
            </Button>
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <ChartRenderer config={config} dataset={dataset} height={400} />
          </div>

          {/* Chart info */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">About this chart</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {config.chartType === 'bar' && 'Bar charts compare discrete categories. Each bar height represents the aggregated value.'}
                  {config.chartType === 'line' && 'Line charts show trends over continuous data — ideal for time series.'}
                  {config.chartType === 'area' && 'Area charts emphasize volume and cumulative changes over time.'}
                  {config.chartType === 'pie' && 'Pie charts show proportional share of total. Best with 6 or fewer categories.'}
                  {config.chartType === 'donut' && 'Donut charts show proportional share with a center space for key metrics.'}
                  {config.chartType === 'scatter' && 'Scatter plots reveal correlations and clusters between two numeric variables.'}
                  {config.chartType === 'radar' && 'Radar charts compare multi-dimensional profiles across categories.'}
                  {config.chartType === 'histogram' && 'Histograms show the frequency distribution of a numeric variable.'}
                  {config.chartType === 'composed' && 'Combo charts layer bar and line series to compare related metrics.'}
                </p>
              </div>
            </div>
          </div>

          {/* Key insights */}
          {insights.slice(0, 3).map((insight, i) => {
            const colorsMap = {
              info: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
              warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
              success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
              trend: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
            };
            return (
              <div key={i} className={`rounded-lg px-4 py-3 border text-xs ${colorsMap[insight.type]}`}>
                <strong>{insight.title}:</strong> {insight.description}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: insights panel */}
      <div className="w-64 shrink-0 border-l border-border hidden xl:flex flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3 shrink-0">
          <h3 className="text-sm font-semibold">Dataset Insights</h3>
          <p className="text-xs text-muted-foreground">{dataset.name}</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <InsightPanel dataset={dataset} />
        </div>
      </div>
    </div>
  );
}