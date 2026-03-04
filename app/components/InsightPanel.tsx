import { useMemo } from 'react';
import { TrendingUp, AlertTriangle, Info, CheckCircle, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import type { Dataset, Insight } from '../types';
import { generateInsights } from '../utils/stats';
import { ScrollArea } from './ui/scroll-area';

interface InsightPanelProps {
  dataset: Dataset;
  className?: string;
}

const INSIGHT_CONFIG = {
  info:    { icon: Info,          color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  success: { icon: CheckCircle,   color: 'text-emerald-500',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20' },
  trend:   { icon: TrendingUp,    color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
};

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const cfg = INSIGHT_CONFIG[insight.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-lg p-3 border ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex gap-2.5 items-start">
        <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold ${cfg.color} mb-0.5`}>{insight.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function InsightPanel({ dataset, className = '' }: InsightPanelProps) {
  const insights = useMemo(() => generateInsights(dataset.rows, dataset.columns), [dataset]);

  const counts = useMemo(() => ({
    info: insights.filter(i => i.type === 'info').length,
    warning: insights.filter(i => i.type === 'warning').length,
    success: insights.filter(i => i.type === 'success').length,
    trend: insights.filter(i => i.type === 'trend').length,
  }), [insights]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="shrink-0 p-4 border-b border-border">
        <h3 className="font-semibold text-sm mb-3">Data Insights</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Trends', count: counts.trend, color: 'text-violet-500' },
            { label: 'Warnings', count: counts.warning, color: 'text-amber-500' },
            { label: 'Positive', count: counts.success, color: 'text-emerald-500' },
            { label: 'Info', count: counts.info, color: 'text-blue-500' },
          ].map(item => (
            <div key={item.label} className="rounded-md bg-muted/40 px-2.5 py-2 text-center">
              <div className={`text-lg font-bold ${item.color}`}>{item.count}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2.5">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} index={i} />
          ))}
          {insights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Minus className="size-8 mx-auto mb-2 opacity-30" />
              No insights available.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
