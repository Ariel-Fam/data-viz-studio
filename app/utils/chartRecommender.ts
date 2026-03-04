import type { Column, ChartRecommendation } from '../types';

export function recommendCharts(columns: Column[]): ChartRecommendation[] {
  const numCols = columns.filter(c => ['number', 'currency', 'percentage'].includes(c.type));
  const catCols = columns.filter(c => ['category', 'text'].includes(c.type));
  const dateCols = columns.filter(c => c.type === 'date');

  const recs: ChartRecommendation[] = [];

  // Date + numeric → time series
  if (dateCols.length > 0 && numCols.length > 0) {
    recs.push({
      type: 'line',
      title: 'Time Series — Line Chart',
      description: `Track ${numCols[0].name} over ${dateCols[0].name}.`,
      reason: 'You have a date column and numeric values — perfect for showing trends over time.',
      xAxis: dateCols[0].name,
      yAxis: [numCols[0].name],
      confidence: 'high',
      icon: '📈',
    });
    recs.push({
      type: 'area',
      title: 'Area Chart — Cumulative View',
      description: `Visualize volume of ${numCols[0].name} over ${dateCols[0].name}.`,
      reason: 'Area charts emphasize volume and cumulative growth over time.',
      xAxis: dateCols[0].name,
      yAxis: [numCols[0].name],
      confidence: 'high',
      icon: '🏔️',
    });
    if (numCols.length >= 2) {
      recs.push({
        type: 'composed',
        title: 'Combo Chart — Bar + Line',
        description: `Compare ${numCols[0].name} (bars) with ${numCols[1].name} (line).`,
        reason: 'Combo charts show two related metrics together, ideal for volume vs. rate comparison.',
        xAxis: dateCols[0].name,
        yAxis: numCols.slice(0, 2).map(c => c.name),
        confidence: 'medium',
        icon: '📊',
      });
    }
  }

  // Category + numeric → bar chart
  if (catCols.length > 0 && numCols.length > 0) {
    recs.push({
      type: 'bar',
      title: 'Bar Chart — Category Comparison',
      description: `Compare ${numCols[0].name} across ${catCols[0].name} categories.`,
      reason: 'Bar charts are best for comparing discrete categories side by side.',
      xAxis: catCols[0].name,
      yAxis: [numCols[0].name],
      confidence: 'high',
      icon: '📊',
    });

    recs.push({
      type: 'pie',
      title: 'Pie / Donut Chart — Proportions',
      description: `Show how ${numCols[0].name} is distributed across ${catCols[0].name}.`,
      reason: 'Pie charts reveal share-of-total when there are a manageable number of categories.',
      xAxis: catCols[0].name,
      yAxis: [numCols[0].name],
      confidence: 'medium',
      icon: '🥧',
    });

    if (numCols.length >= 2) {
      recs.push({
        type: 'bar',
        title: 'Grouped Bar Chart — Multi-Series',
        description: `Compare multiple metrics across ${catCols[0].name} side by side.`,
        reason: 'Grouped bars compare several numeric metrics simultaneously for each category.',
        xAxis: catCols[0].name,
        yAxis: numCols.slice(0, 3).map(c => c.name),
        confidence: 'medium',
        icon: '📉',
      });
    }
  }

  // Two numeric → scatter plot
  if (numCols.length >= 2) {
    recs.push({
      type: 'scatter',
      title: 'Scatter Plot — Correlation',
      description: `Explore the relationship between ${numCols[0].name} and ${numCols[1].name}.`,
      reason: 'Scatter plots reveal correlations, clusters, and outliers between two numeric variables.',
      xAxis: numCols[0].name,
      yAxis: [numCols[1].name],
      confidence: 'high',
      icon: '🔵',
    });
  }

  // Multiple numeric → radar
  if (numCols.length >= 3) {
    recs.push({
      type: 'radar',
      title: 'Radar Chart — Multi-Metric Profile',
      description: `Compare multiple numeric dimensions at once${catCols[0] ? ` across ${catCols[0].name}` : ''}.`,
      reason: 'Radar charts are ideal for comparing multi-dimensional profiles of categories.',
      xAxis: catCols[0]?.name ?? numCols[0].name,
      yAxis: numCols.slice(0, 5).map(c => c.name),
      confidence: 'medium',
      icon: '🕸️',
    });
  }

  // Single numeric → histogram
  if (numCols.length >= 1) {
    recs.push({
      type: 'histogram',
      title: 'Histogram — Distribution',
      description: `See how values in ${numCols[0].name} are distributed.`,
      reason: 'Histograms show the frequency distribution, revealing skewness and outliers.',
      xAxis: numCols[0].name,
      yAxis: [numCols[0].name],
      confidence: 'medium',
      icon: '📶',
    });
  }

  // Deduplicate and take top 6
  return recs.slice(0, 6);
}
