'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  BarChart3, Plus, Trash2, ChevronRight, AlertCircle,
  TableIcon, Activity, Lightbulb, ArrowLeft,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { useAppStore } from '../store/AppContext';
import { DataTableComponent } from '../components/DataTableComponent';
import { DataProfiler } from '../components/DataProfiler';
import { InsightPanel } from '../components/InsightPanel';
import { recommendCharts } from '../utils/chartRecommender';

export function DatasetPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { getDataset, getChartsForDataset, removeDataset, addChart } = useAppStore();
  const dataset = getDataset(id ?? '');
  const charts = getChartsForDataset(id ?? '');

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <AlertCircle className="size-12 text-muted-foreground/40" />
        <h2 className="font-semibold">Dataset not found</h2>
        <p className="text-sm text-muted-foreground">This dataset may have been deleted.</p>
        <Button onClick={() => router.push('/dashboard')}>← Back to Dashboard</Button>
      </div>
    );
  }

  const recommendations = recommendCharts(dataset.columns);
  const numCols = dataset.columns.filter(c => ['number', 'currency', 'percentage'].includes(c.type)).length;
  const catCols = dataset.columns.filter(c => ['category', 'text'].includes(c.type)).length;
  const dateCols = dataset.columns.filter(c => c.type === 'date').length;

  const createChart = (recIdx: number) => {
    const rec = recommendations[recIdx];
    const chartId = addChart({
      datasetId: dataset.id,
      name: rec.title,
      title: rec.title,
      chartType: rec.type,
      xAxis: rec.xAxis,
      yAxis: rec.yAxis,
      aggregation: 'sum',
      filters: [],
      sortDirection: 'asc',
      showLegend: true,
      showGridlines: true,
      showMarkers: false,
      smoothLines: true,
      stacked: false,
      colorPalette: 'default',
      numberFormat: 'number',
    });
    router.push(`/charts/${chartId}`);
  };

  const createBlankChart = () => {
    const firstNum = dataset.columns.find(c => ['number', 'currency', 'percentage'].includes(c.type));
    const firstCat = dataset.columns.find(c => ['category', 'text', 'date'].includes(c.type));
    const chartId = addChart({
      datasetId: dataset.id,
      name: `${dataset.name} — Chart`,
      title: `${dataset.name} Chart`,
      chartType: 'bar',
      xAxis: firstCat?.name ?? dataset.columns[0]?.name ?? '',
      yAxis: firstNum ? [firstNum.name] : [],
      aggregation: 'sum',
      filters: [],
      sortDirection: 'asc',
      showLegend: true,
      showGridlines: true,
      showMarkers: false,
      smoothLines: true,
      stacked: false,
      colorPalette: 'default',
      numberFormat: 'number',
    });
    router.push(`/charts/${chartId}`);
  };

  const handleDelete = async () => {
    await removeDataset(dataset.id);
    setDeleteDialogOpen(false);
    router.push('/dashboard');
  };

  const CONFIDENCE_COLORS = {
    high: 'text-emerald-500 bg-emerald-500/10',
    medium: 'text-amber-500 bg-amber-500/10',
    low: 'text-gray-500 bg-gray-500/10',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-1 p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-semibold">{dataset.name}</h1>
                <Badge variant="secondary" className="text-xs">{dataset.source}</Badge>
              </div>
              {dataset.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{dataset.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {dataset.rows.length.toLocaleString()} rows
                </span>
                <span>{dataset.columns.length} columns</span>
                <span>{numCols} numeric</span>
                <span>{catCols} categorical</span>
                {dateCols > 0 && <span>{dateCols} date</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5" onClick={createBlankChart}>
              <Plus className="size-4" />
              New Chart
            </Button>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 hover:text-destructive">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete dataset?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete dataset &quot;{dataset.name}&quot;? This will also delete all associated charts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => void handleDelete()}
                  >
                    Delete dataset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Main area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <Tabs defaultValue="data" className="h-full flex flex-col">
            <div className="border-b border-border px-4 shrink-0">
              <TabsList className="h-10 gap-0 bg-transparent p-0">
                {[
                  { value: 'data', label: 'Data', icon: TableIcon },
                  { value: 'profile', label: 'Profile', icon: Activity },
                  { value: 'charts', label: `Charts (${charts.length})`, icon: BarChart3 },
                  { value: 'recommend', label: 'Recommendations', icon: Lightbulb },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-sm px-4"
                  >
                    <tab.icon className="size-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <TabsContent value="data" className="h-full p-4 mt-0">
                <DataTableComponent dataset={dataset} />
              </TabsContent>

              <TabsContent value="profile" className="h-full mt-0 overflow-hidden">
                <DataProfiler dataset={dataset} />
              </TabsContent>

              <TabsContent value="charts" className="h-full mt-0 overflow-auto p-4">
                {charts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <BarChart3 className="size-12 text-muted-foreground/30" />
                    <h3 className="font-medium">No charts yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      Create a chart from this dataset or pick a recommendation below.
                    </p>
                    <Button size="sm" className="gap-1.5" onClick={createBlankChart}>
                      <Plus className="size-4" />
                      New Chart
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {charts.map(chart => (
                      <div
                        key={chart.id}
                        className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer"
                        onClick={() => router.push(`/charts/${chart.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">{chart.title}</h3>
                          <Badge variant="secondary" className="text-xs">{chart.chartType}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {chart.xAxis} × {chart.yAxis.join(', ')} • {chart.aggregation}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BarChart3 className="size-3" />
                          <span>Click to open chart builder</span>
                          <ChevronRight className="size-3 ml-auto" />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={createBlankChart}
                      className="rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary/50 hover:bg-accent/20 transition-all flex flex-col items-center gap-2"
                    >
                      <Plus className="size-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">New Chart</span>
                    </button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommend" className="h-full mt-0 overflow-auto p-4">
                <div className="space-y-4">
                  <div>
                    <h2 className="font-medium mb-1">Recommended Charts</h2>
                    <p className="text-sm text-muted-foreground">
                      Based on your data structure, these chart types are most suitable.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendations.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="text-2xl shrink-0">{rec.icon}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-sm">{rec.title}</h3>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${CONFIDENCE_COLORS[rec.confidence]}`}>
                                {rec.confidence} confidence
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 mb-3 italic">
                          &quot;{rec.reason}&quot;
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">X:</span> {rec.xAxis}&nbsp;
                            <span className="font-medium">Y:</span> {rec.yAxis.join(', ')}
                          </div>
                          <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => createChart(i)}>
                            <Plus className="size-3.5" />
                            Create
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right: Insights sidebar */}
        <div className="w-72 shrink-0 border-l border-border overflow-hidden hidden lg:flex flex-col">
          <InsightPanel dataset={dataset} />
        </div>
      </div>
    </div>
  );
}
