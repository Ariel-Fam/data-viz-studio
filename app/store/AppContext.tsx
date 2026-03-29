'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Dataset, ChartConfig } from '../types';
import { generateId } from '../utils/formatters';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const SUPPORTED_CHART_TYPES = new Set<ChartConfig['chartType']>(['bar', 'line', 'area', 'radar']);

function sanitizeChartConfig(chart: ChartConfig | (Omit<ChartConfig, 'chartType'> & { chartType: string })): ChartConfig {
  if (SUPPORTED_CHART_TYPES.has(chart.chartType as ChartConfig['chartType'])) {
    return chart as ChartConfig;
  }

  const fallbackType = chart.chartType === 'scatter' || chart.chartType === 'composed' ? 'line' : 'bar';

  return {
    ...chart,
    chartType: fallbackType,
    maxDataPoints: chart.maxDataPoints ?? (fallbackType === 'radar' ? 10 : fallbackType === 'bar' ? 20 : 40),
    maxXAxisTicks: chart.maxXAxisTicks ?? (fallbackType === 'bar' ? 8 : 10),
  };
}

// ── State shape ────────────────────────────────────────────────────────────────
interface AppState {
  datasets: Dataset[];
  charts: ChartConfig[];
  theme: 'light' | 'dark';
}

// ── Action types ───────────────────────────────────────────────────────────────
type AppAction =
  | { type: 'ADD_DATASET'; payload: Dataset }
  | { type: 'SET_DATASETS'; payload: Dataset[] }
  | { type: 'UPDATE_DATASET'; payload: Dataset }
  | { type: 'REMOVE_DATASET'; payload: string }
  | { type: 'ADD_CHART'; payload: ChartConfig }
  | { type: 'UPDATE_CHART'; payload: ChartConfig }
  | { type: 'REMOVE_CHART'; payload: string }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'HYDRATE'; payload: Partial<AppState> };

// ── Reducer ────────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_DATASET':
      return { ...state, datasets: [...state.datasets, action.payload] };
    case 'SET_DATASETS':
      return { ...state, datasets: action.payload };
    case 'UPDATE_DATASET':
      return {
        ...state,
        datasets: state.datasets.map(d => d.id === action.payload.id ? action.payload : d),
      };
    case 'REMOVE_DATASET':
      return {
        ...state,
        datasets: state.datasets.filter(d => d.id !== action.payload),
        charts: state.charts.filter(c => c.datasetId !== action.payload),
      };
    case 'ADD_CHART':
      return { ...state, charts: [...state.charts, action.payload] };
    case 'UPDATE_CHART':
      return {
        ...state,
        charts: state.charts.map(c => c.id === action.payload.id ? action.payload : c),
      };
    case 'REMOVE_CHART':
      return { ...state, charts: state.charts.filter(c => c.id !== action.payload) };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'HYDRATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const STORAGE_KEY = 'dataviz-studio-state';

function loadState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      charts: (parsed.charts ?? []).map(chart => sanitizeChartConfig(chart)),
      theme: parsed.theme ?? 'light',
    };
  } catch {
    return {};
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        charts: state.charts,
        theme: state.theme,
      }),
    );
  } catch {
    // quota exceeded or private mode — ignore
  }
}

// ── Context ────────────────────────────────────────────────────────────────────
interface AppContextValue extends AppState {
  addDataset: (dataset: Omit<Dataset, 'id' | 'createdAt'>) => Promise<string>;
  updateDataset: (dataset: Dataset) => Promise<void>;
  removeDataset: (id: string) => Promise<void>;
  addChart: (chart: Omit<ChartConfig, 'id' | 'createdAt'>) => string;
  updateChart: (chart: ChartConfig) => void;
  removeChart: (id: string) => void;
  toggleTheme: () => void;
  getDataset: (id: string) => Dataset | undefined;
  getChart: (id: string) => ChartConfig | undefined;
  getChartsForDataset: (datasetId: string) => ChartConfig[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    datasets: [],
    charts: [],
    theme: 'light',
  });
  const convexDatasets = useQuery(api.datasets.listMyDatasets);
  const createDatasetMutation = useMutation(api.datasets.createDataset);
  const updateDatasetMutation = useMutation(api.datasets.updateDataset);
  const deleteDatasetMutation = useMutation(api.datasets.deleteDataset);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    if (Object.keys(saved).length > 0) {
      dispatch({ type: 'HYDRATE', payload: saved });
    }
  }, []);

  // Persist to localStorage on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!convexDatasets) return;
    dispatch({ type: 'SET_DATASETS', payload: convexDatasets as Dataset[] });
  }, [convexDatasets]);

  // Apply dark/light class to document
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const addDataset = useCallback(async (dataset: Omit<Dataset, 'id' | 'createdAt'>): Promise<string> => {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const payload: Dataset = { ...dataset, id, createdAt };
    dispatch({
      type: 'ADD_DATASET',
      payload,
    });
    await createDatasetMutation({
      id,
      name: payload.name,
      description: payload.description,
      columns: payload.columns,
      rows: payload.rows,
      createdAt: payload.createdAt,
      source: payload.source,
    });
    return id;
  }, [createDatasetMutation]);

  const updateDataset = useCallback(async (dataset: Dataset) => {
    dispatch({ type: 'UPDATE_DATASET', payload: dataset });
    await updateDatasetMutation({
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      columns: dataset.columns,
      rows: dataset.rows,
      createdAt: dataset.createdAt,
      source: dataset.source,
    });
  }, [updateDatasetMutation]);

  const removeDataset = useCallback(async (id: string) => {
    dispatch({ type: 'REMOVE_DATASET', payload: id });
    await deleteDatasetMutation({ id });
  }, [deleteDatasetMutation]);

  const addChart = useCallback((chart: Omit<ChartConfig, 'id' | 'createdAt'>): string => {
    const id = generateId();
    dispatch({
      type: 'ADD_CHART',
      payload: sanitizeChartConfig({ ...chart, id, createdAt: new Date().toISOString() }),
    });
    return id;
  }, []);

  const updateChart = useCallback((chart: ChartConfig) => {
    dispatch({ type: 'UPDATE_CHART', payload: sanitizeChartConfig(chart) });
  }, []);

  const removeChart = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_CHART', payload: id });
  }, []);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  }, [state.theme]);

  const getDataset = useCallback((id: string) => state.datasets.find(d => d.id === id), [state.datasets]);
  const getChart = useCallback((id: string) => state.charts.find(c => c.id === id), [state.charts]);
  const getChartsForDataset = useCallback((datasetId: string) => state.charts.filter(c => c.datasetId === datasetId), [state.charts]);

  return (
    <AppContext.Provider value={{
      ...state,
      addDataset, updateDataset, removeDataset,
      addChart, updateChart, removeChart,
      toggleTheme, getDataset, getChart, getChartsForDataset,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider');
  return ctx;
}
