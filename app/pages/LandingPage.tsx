'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  TrendingUp, BarChart3, Upload, Table,
  Brain, Zap, ArrowRight, Database, Play, PencilRuler, FlaskConical
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Image from 'next/image';

const FEATURES = [
  {
    icon: Upload,
    title: 'Flexible Data Import',
    description: 'Upload CSV files, paste JSON, or enter data manually with auto type detection.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Smart Chart Recommendations',
    description: 'AI-powered chart suggestions based on your data structure and column types.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Brain,
    title: 'Statistical Insights',
    description: 'Automatic mean, median, std dev, outlier detection, correlations, and trend analysis.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: BarChart3,
    title: 'Interactive Chart Builder',
    description: 'Drag-and-drop chart configuration with 9+ chart types, custom palettes, and export.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Table,
    title: 'Advanced Data Table',
    description: 'Sort, filter, search, paginate, and export your data with column-level controls.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Database,
    title: 'Data Profiling',
    description: 'Instant column stats, missing value detection, type inference, and quality warnings.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: PencilRuler,
    title: 'Built-in Whiteboard',
    description: 'Generate ideas, sketch dashboard layouts, and map analysis plans in a dedicated whiteboard workspace.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: FlaskConical,
    title: 'Data Science Explorer',
    description: 'Dive into live macro indicators, top vs lower economy comparisons, and population + geography insights.',
    color: 'text-fuchsia-500',
    bg: 'bg-fuchsia-500/10',
  },
];

const CHART_TYPES = [
  'Bar', 'Line', 'Area', 'Pie/Donut', 'Scatter', 'Radar', 'Histogram', 'Combo', 'Stacked'
];

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-12 text-center sm:px-6 md:py-16 lg:px-8 lg:py-24">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-3xl mx-auto space-y-6"
        >

          <div className="flex items-center justify-center">

            <Image
              src="/softwareLogo.png"
              alt="DataViz Studio"
              width={120}
              height={120}
            />

          </div>
          <Badge className="gap-1.5 text-sm px-3 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
            <TrendingUp className="size-3.5" />
            Data Visualization & Analytics Platform
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Turn raw data into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-cyan-500">
              clear insights
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Import, explore, visualize, and understand your data with powerful charts, 
            statistical analysis — all in one place.
          </p>

          <div className="flex items-center gap-3 justify-center flex-wrap">
            <Button size="lg" className="gap-2" onClick={() => router.push('/import')}>
              <Upload className="size-4" />
              Import Your Data
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={() => router.push('/dashboard')}>
              <BarChart3 className="size-4" />
              View Dashboard
            </Button>
          </div>

          {/* Chart type pills */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {CHART_TYPES.map(type => (
              <span key={type} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                {type}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold mb-2">Everything you need for data exploration</h2>
          <p className="text-muted-foreground">Built for analysts, developers, and anyone who wants to understand their data.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Includes a built-in whiteboard for idea generation, planning metrics, and mapping chart concepts before implementation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: 'easeOut' }}
              className="h-full rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className={`size-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`size-5 ${feature.color}`} />
              </div>
              <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold sm:text-base">{feature.title}</h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sample datasets */}
      

      {/* CTA */}
      <section className="px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-lg mx-auto rounded-2xl border border-border bg-card p-10 shadow-sm">
          <Play className="size-10 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Ready to explore your data?</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Upload a CSV, paste JSON, or create a dataset manually in seconds.
          </p>
          <Button
            className="h-auto w-full max-w-full gap-2 whitespace-normal px-4 py-2 text-center sm:w-auto sm:whitespace-nowrap"
            onClick={() => router.push('/import')}
          >
            <Upload className="size-4" />
            Get Started — Import Data
          </Button>
        </div>
      </section>
    </div>
  );
}