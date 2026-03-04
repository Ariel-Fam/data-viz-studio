"use client";

import { useMemo, useEffect, useState } from "react";
import { motion } from "motion/react";
import Papa from "papaparse";
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle2,
  Compass,
  Database,
  FlaskConical,
  Globe2,
  Landmark,
  LineChart,
  Percent,
  PieChart,
  Sigma,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

type MetricDef = {
  id: string;
  indicator: string;
  title: string;
  description: string;
  unit: "usd" | "intlUsd" | "percent" | "count";
  sourceUrl: string;
};

type MetricValue = {
  value: number;
  year: string;
};

type EconomyRow = {
  countryCode: string;
  countryName: string;
  realGdpPerCapita: MetricValue;
  population: MetricValue | null;
  educationSpend: MetricValue | null;
};

type CountryOutcomesRow = {
  countryCode: string;
  countryName: string;
  realGdp: MetricValue;
  lifeExpectancy: MetricValue | null;
};

type EducationComparisonRow = {
  countryCode: string;
  countryName: string;
  educationSpend: MetricValue | null;
  tertiaryEnrollment: MetricValue | null;
  literacyRate: MetricValue | null;
};

type DemographicComparisonRow = {
  countryCode: string;
  countryName: string;
  birthRate: MetricValue | null;
  fertilityRate: MetricValue | null;
  urbanPopulationShare: MetricValue | null;
};

type SocialComparisonRow = {
  countryCode: string;
  countryName: string;
  divorceRate: MetricValue | null;
  internetUsers: MetricValue | null;
  unemployment: MetricValue | null;
};

type PopulationGeoRow = {
  countryCode: string;
  countryName: string;
  population: MetricValue | null;
  surfaceArea: MetricValue | null;
  landArea: MetricValue | null;
  populationDensity: MetricValue | null;
  region: string;
  incomeLevel: string;
};

const WORLD_BANK_BASE = "https://api.worldbank.org/v2/country/WLD/indicator";
const WORLD_BANK_COUNTRY_BASE = "https://api.worldbank.org/v2/country";

const METRICS: MetricDef[] = [
  {
    id: "gdp",
    indicator: "NY.GDP.MKTP.CD",
    title: "Global GDP (current US$)",
    description: "The total market value of final goods and services produced worldwide.",
    unit: "usd",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD",
  },
  {
    id: "gdpPpp",
    indicator: "NY.GDP.MKTP.PP.CD",
    title: "Global GDP, PPP (current international $)",
    description: "GDP adjusted by purchasing power parity to compare output across countries.",
    unit: "intlUsd",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.PP.CD",
  },
  {
    id: "gdpPerCapita",
    indicator: "NY.GDP.PCAP.CD",
    title: "Global GDP per capita (current US$)",
    description: "Average output per person; a rough proxy for living standards.",
    unit: "usd",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD",
  },
  {
    id: "inflation",
    indicator: "FP.CPI.TOTL.ZG",
    title: "Global inflation, consumer prices (annual %)",
    description: "Average annual change in consumer prices.",
    unit: "percent",
    sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG",
  },
  {
    id: "unemployment",
    indicator: "SL.UEM.TOTL.ZS",
    title: "Global unemployment (% of labor force)",
    description: "Share of people in the labor force who are unemployed.",
    unit: "percent",
    sourceUrl: "https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS",
  },
  {
    id: "trade",
    indicator: "NE.TRD.GNFS.ZS",
    title: "Global trade (% of GDP)",
    description: "Imports + exports as a share of GDP, a proxy for global integration.",
    unit: "percent",
    sourceUrl: "https://data.worldbank.org/indicator/NE.TRD.GNFS.ZS",
  },
];

const FOUNDATIONS = [
  {
    icon: Database,
    title: "Data lifecycle",
    text: "Frame the question, collect data, clean and validate, model and analyze, then communicate decisions.",
  },
  {
    icon: Sigma,
    title: "Descriptive statistics",
    text: "Summarize what happened using mean, median, spread, and distribution shape.",
  },
  {
    icon: Compass,
    title: "Inferential statistics",
    text: "Estimate what is likely true in the larger population using samples, confidence intervals, and tests.",
  },
  {
    icon: Brain,
    title: "Decision intelligence",
    text: "Turn model outputs into action by balancing uncertainty, cost, and business constraints.",
  },
];

const STAT_TOPICS = [
  {
    icon: Sigma,
    title: "Averages: mean, median, mode",
    text: "Mean captures central tendency but is sensitive to outliers. Median is robust for skewed data. Mode highlights common values.",
  },
  {
    icon: Activity,
    title: "Variance and standard deviation",
    text: "These quantify spread around the mean. High spread often means higher risk or heterogeneous behavior.",
  },
  {
    icon: TrendingUp,
    title: "Correlation vs causation",
    text: "Strong correlation does not prove causality. Always test mechanisms, confounders, and temporal order.",
  },
  {
    icon: Percent,
    title: "Percentiles and distributions",
    text: "Percentiles show relative rank and help explain inequality, tail risk, and segmentation patterns.",
  },
];

const WORKFLOW_STEPS = [
  "Define the decision and success metric.",
  "Collect relevant data and metadata.",
  "Profile quality: missingness, outliers, drift.",
  "Explore patterns with statistics and visualizations.",
  "Build and validate models or scenarios.",
  "Communicate insights with clear visuals and assumptions.",
  "Monitor outcomes and iterate continuously.",
];

const ADVANCED_TOPICS = [
  {
    icon: CheckCircle2,
    title: "Hypothesis testing and confidence",
    text: "When you test an idea, this helps you check if the result is real or just random chance.",
  },
  {
    icon: Compass,
    title: "Sampling and bias control",
    text: "Your results depend on who or what is included in the data. If the data is unfair or incomplete, conclusions can be misleading.",
  },
  {
    icon: TrendingUp,
    title: "Time-series thinking",
    text: "For data over time, look for long-term direction, repeating patterns, and sudden changes before making forecasts.",
  },
  {
    icon: Activity,
    title: "Model evaluation and drift",
    text: "After a model goes live, keep checking if it is still accurate. Real-world data changes, so models can get worse over time.",
  },
  {
    icon: Database,
    title: "Data governance and quality",
    text: "Good data rules keep numbers clean, consistent, and trustworthy so teams can make better decisions with confidence.",
  },
  {
    icon: Workflow,
    title: "Causal reasoning and experiments",
    text: "If you want to know what actually caused a result, run controlled tests (like A/B tests) instead of relying only on patterns.",
  },
];

const VISUALS = [
  {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
    alt: "Analytics dashboard on laptop",
    credit: "Photo by Carlos Muza on Unsplash",
    href: "https://unsplash.com/photos/hpjSkU2UYSU",
  },
  {
    src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80",
    alt: "Data strategy discussion with charts",
    credit: "Photo by Campaign Creators on Unsplash",
    href: "https://unsplash.com/photos/pypeCEaJeZY",
  },
  {
    src: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=1600&q=80",
    alt: "Global economic trading screens",
    credit: "Photo by Adeolu Eletu on Unsplash",
    href: "https://unsplash.com/photos/E7RLgUjjazc",
  },
];

function formatMetric(value: number, unit: MetricDef["unit"]) {
  if (unit === "percent") return `${value.toFixed(2)}%`;
  if (unit === "count") return value.toLocaleString();

  const trillion = 1_000_000_000_000;
  const billion = 1_000_000_000;
  const million = 1_000_000;
  const currencyPrefix = unit === "intlUsd" ? "Intl$ " : "$";

  if (Math.abs(value) >= trillion) return `${currencyPrefix}${(value / trillion).toFixed(2)}T`;
  if (Math.abs(value) >= billion) return `${currencyPrefix}${(value / billion).toFixed(2)}B`;
  if (Math.abs(value) >= million) return `${currencyPrefix}${(value / million).toFixed(2)}M`;
  return `${currencyPrefix}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function getLatestValue(rows: Array<{ value: number | null; date: string }>): MetricValue | null {
  const latest = rows.find((row) => typeof row.value === "number");
  if (!latest || latest.value === null) return null;
  return { value: latest.value, year: latest.date };
}

async function fetchWorldBankRows(
  url: string,
): Promise<Array<{ countryiso3code: string; country: { value: string }; value: number | null; date: string }>> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed request: ${url}`);
  const payload = (await response.json()) as [
    unknown,
    Array<{ countryiso3code: string; country: { value: string }; value: number | null; date: string }>,
  ];
  return Array.isArray(payload?.[1]) ? payload[1] : [];
}

async function fetchLatestIndicatorByCountry(
  indicator: string,
  countryCodes: Set<string>,
): Promise<Map<string, MetricValue>> {
  const rows = await fetchWorldBankRows(
    `${WORLD_BANK_COUNTRY_BASE}/all/indicator/${indicator}?format=json&per_page=20000`,
  );
  const latestByCountry = new Map<string, MetricValue>();
  for (const row of rows) {
    if (!countryCodes.has(row.countryiso3code)) continue;
    if (typeof row.value !== "number") continue;
    const current = latestByCountry.get(row.countryiso3code);
    if (!current || Number(row.date) > Number(current.year)) {
      latestByCountry.set(row.countryiso3code, { value: row.value, year: row.date });
    }
  }
  return latestByCountry;
}

export function DataSciencePage() {
  const [metrics, setMetrics] = useState<Record<string, MetricValue | null>>({});
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [topEconomies, setTopEconomies] = useState<EconomyRow[]>([]);
  const [topEconomiesLoading, setTopEconomiesLoading] = useState(true);
  const [topEconomiesError, setTopEconomiesError] = useState<string | null>(null);
  const [topEconomiesLoadedAt, setTopEconomiesLoadedAt] = useState<string | null>(null);
  const [countryOutcomes, setCountryOutcomes] = useState<CountryOutcomesRow[]>([]);
  const [countryOutcomesLoading, setCountryOutcomesLoading] = useState(true);
  const [countryOutcomesError, setCountryOutcomesError] = useState<string | null>(null);
  const [countryOutcomesLoadedAt, setCountryOutcomesLoadedAt] = useState<string | null>(null);
  const [worstCountryOutcomes, setWorstCountryOutcomes] = useState<CountryOutcomesRow[]>([]);
  const [worstCountryOutcomesLoading, setWorstCountryOutcomesLoading] = useState(true);
  const [worstCountryOutcomesError, setWorstCountryOutcomesError] = useState<string | null>(null);
  const [worstCountryOutcomesLoadedAt, setWorstCountryOutcomesLoadedAt] = useState<string | null>(null);
  const [educationRows, setEducationRows] = useState<EducationComparisonRow[]>([]);
  const [educationLoading, setEducationLoading] = useState(true);
  const [educationError, setEducationError] = useState<string | null>(null);
  const [demographicRows, setDemographicRows] = useState<DemographicComparisonRow[]>([]);
  const [demographicLoading, setDemographicLoading] = useState(true);
  const [demographicError, setDemographicError] = useState<string | null>(null);
  const [socialRows, setSocialRows] = useState<SocialComparisonRow[]>([]);
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [comparisonLoadedAt, setComparisonLoadedAt] = useState<string | null>(null);
  const [worstEducationRows, setWorstEducationRows] = useState<EducationComparisonRow[]>([]);
  const [worstEducationLoading, setWorstEducationLoading] = useState(true);
  const [worstEducationError, setWorstEducationError] = useState<string | null>(null);
  const [worstDemographicRows, setWorstDemographicRows] = useState<DemographicComparisonRow[]>([]);
  const [worstDemographicLoading, setWorstDemographicLoading] = useState(true);
  const [worstDemographicError, setWorstDemographicError] = useState<string | null>(null);
  const [worstSocialRows, setWorstSocialRows] = useState<SocialComparisonRow[]>([]);
  const [worstSocialLoading, setWorstSocialLoading] = useState(true);
  const [worstSocialError, setWorstSocialError] = useState<string | null>(null);
  const [worstComparisonLoadedAt, setWorstComparisonLoadedAt] = useState<string | null>(null);
  const [populationGeoRows, setPopulationGeoRows] = useState<PopulationGeoRow[]>([]);
  const [populationGeoLoading, setPopulationGeoLoading] = useState(true);
  const [populationGeoError, setPopulationGeoError] = useState<string | null>(null);
  const [populationGeoLoadedAt, setPopulationGeoLoadedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      try {
        const responses = await Promise.all(
          METRICS.map(async (metric) => {
            const response = await fetch(`${WORLD_BANK_BASE}/${metric.indicator}?format=json&per_page=80`, {
              cache: "no-store",
            });
            if (!response.ok) {
              throw new Error(`Failed to load ${metric.indicator}`);
            }
            const payload = (await response.json()) as [unknown, Array<{ value: number | null; date: string }>];
            const series = Array.isArray(payload?.[1]) ? payload[1] : [];
            return { metricId: metric.id, latest: getLatestValue(series) };
          }),
        );

        if (cancelled) return;
        const next: Record<string, MetricValue | null> = {};
        responses.forEach((item) => {
          next[item.metricId] = item.latest;
        });
        setMetrics(next);
        setLoadedAt(new Date().toISOString());
      } catch {
        if (!cancelled) {
          setMetricsError("Unable to fetch live economic metrics right now. Please try again shortly.");
        }
      } finally {
        if (!cancelled) setLoadingMetrics(false);
      }
    }

    loadMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadExtraComparisons() {
      if (countryOutcomes.length === 0) {
        setEducationRows([]);
        setDemographicRows([]);
        setSocialRows([]);
        setEducationLoading(false);
        setDemographicLoading(false);
        setSocialLoading(false);
        return;
      }

      setEducationLoading(true);
      setDemographicLoading(true);
      setSocialLoading(true);
      setEducationError(null);
      setDemographicError(null);
      setSocialError(null);

      const codeSet = new Set(countryOutcomes.map((row) => row.countryCode));

      try {
        const [educationSpendByCode, tertiaryByCode, literacyByCode] = await Promise.all([
          fetchLatestIndicatorByCountry("SE.XPD.TOTL.GD.ZS", codeSet),
          fetchLatestIndicatorByCountry("SE.TER.ENRR", codeSet),
          fetchLatestIndicatorByCountry("SE.ADT.LITR.ZS", codeSet),
        ]);

        if (!cancelled) {
          setEducationRows(
            countryOutcomes.map((row) => ({
              countryCode: row.countryCode,
              countryName: row.countryName,
              educationSpend: educationSpendByCode.get(row.countryCode) ?? null,
              tertiaryEnrollment: tertiaryByCode.get(row.countryCode) ?? null,
              literacyRate: literacyByCode.get(row.countryCode) ?? null,
            })),
          );
          setEducationLoading(false);
        }
      } catch {
        if (!cancelled) {
          setEducationError("Could not load education comparison data right now.");
          setEducationLoading(false);
        }
      }

      try {
        const [birthByCode, fertilityByCode, urbanShareByCode] = await Promise.all([
          fetchLatestIndicatorByCountry("SP.DYN.CBRT.IN", codeSet),
          fetchLatestIndicatorByCountry("SP.DYN.TFRT.IN", codeSet),
          fetchLatestIndicatorByCountry("SP.URB.TOTL.IN.ZS", codeSet),
        ]);

        if (!cancelled) {
          setDemographicRows(
            countryOutcomes.map((row) => ({
              countryCode: row.countryCode,
              countryName: row.countryName,
              birthRate: birthByCode.get(row.countryCode) ?? null,
              fertilityRate: fertilityByCode.get(row.countryCode) ?? null,
              urbanPopulationShare: urbanShareByCode.get(row.countryCode) ?? null,
            })),
          );
          setDemographicLoading(false);
        }
      } catch {
        if (!cancelled) {
          setDemographicError("Could not load demographic comparison data right now.");
          setDemographicLoading(false);
        }
      }

      try {
        const [internetByCode, unemploymentByCode] = await Promise.all([
          fetchLatestIndicatorByCountry("IT.NET.USER.ZS", codeSet),
          fetchLatestIndicatorByCountry("SL.UEM.TOTL.ZS", codeSet),
        ]);

        const divorceResponse = await fetch("https://ourworldindata.org/grapher/divorces-per-1000-people.csv", {
          cache: "no-store",
        });
        if (!divorceResponse.ok) {
          throw new Error("Could not load divorce dataset");
        }
        const divorceCsv = await divorceResponse.text();
        const parsed = Papa.parse<Record<string, string>>(divorceCsv, {
          header: true,
          skipEmptyLines: true,
        });

        const divorceByCode = new Map<string, MetricValue>();
        for (const row of parsed.data) {
          const code = (row.Code ?? "").trim();
          if (!codeSet.has(code)) continue;
          const year = String(row.Year ?? "").trim();
          const value = Number(row["Crude divorce rate"] ?? "");
          if (!Number.isFinite(value) || !year) continue;
          const current = divorceByCode.get(code);
          if (!current || Number(year) > Number(current.year)) {
            divorceByCode.set(code, { value, year });
          }
        }

        if (!cancelled) {
          setSocialRows(
            countryOutcomes.map((row) => ({
              countryCode: row.countryCode,
              countryName: row.countryName,
              divorceRate: divorceByCode.get(row.countryCode) ?? null,
              internetUsers: internetByCode.get(row.countryCode) ?? null,
              unemployment: unemploymentByCode.get(row.countryCode) ?? null,
            })),
          );
          setSocialLoading(false);
          setComparisonLoadedAt(new Date().toISOString());
        }
      } catch {
        if (!cancelled) {
          setSocialError("Could not load social comparison data right now.");
          setSocialLoading(false);
        }
      }
    }

    void loadExtraComparisons();
    return () => {
      cancelled = true;
    };
  }, [countryOutcomes]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorstComparisons() {
      if (worstCountryOutcomes.length === 0) {
        setWorstEducationRows([]);
        setWorstDemographicRows([]);
        setWorstSocialRows([]);
        setWorstEducationLoading(false);
        setWorstDemographicLoading(false);
        setWorstSocialLoading(false);
        return;
      }

      setWorstEducationLoading(true);
      setWorstDemographicLoading(true);
      setWorstSocialLoading(true);
      setWorstEducationError(null);
      setWorstDemographicError(null);
      setWorstSocialError(null);

      const codeSet = new Set(worstCountryOutcomes.map((row) => row.countryCode));

      try {
        const [educationSpendByCode, tertiaryByCode, literacyByCode] = await Promise.all([
          fetchLatestIndicatorByCountry("SE.XPD.TOTL.GD.ZS", codeSet),
          fetchLatestIndicatorByCountry("SE.TER.ENRR", codeSet),
          fetchLatestIndicatorByCountry("SE.ADT.LITR.ZS", codeSet),
        ]);

        if (!cancelled) {
          setWorstEducationRows(
            worstCountryOutcomes.map((row) => ({
              countryCode: row.countryCode,
              countryName: row.countryName,
              educationSpend: educationSpendByCode.get(row.countryCode) ?? null,
              tertiaryEnrollment: tertiaryByCode.get(row.countryCode) ?? null,
              literacyRate: literacyByCode.get(row.countryCode) ?? null,
            })),
          );
          setWorstEducationLoading(false);
        }
      } catch {
        if (!cancelled) {
          setWorstEducationError("Could not load education comparison data right now.");
          setWorstEducationLoading(false);
        }
      }

      try {
        const [birthByCode, fertilityByCode, urbanShareByCode] = await Promise.all([
          fetchLatestIndicatorByCountry("SP.DYN.CBRT.IN", codeSet),
          fetchLatestIndicatorByCountry("SP.DYN.TFRT.IN", codeSet),
          fetchLatestIndicatorByCountry("SP.URB.TOTL.IN.ZS", codeSet),
        ]);

        if (!cancelled) {
          setWorstDemographicRows(
            worstCountryOutcomes.map((row) => ({
              countryCode: row.countryCode,
              countryName: row.countryName,
              birthRate: birthByCode.get(row.countryCode) ?? null,
              fertilityRate: fertilityByCode.get(row.countryCode) ?? null,
              urbanPopulationShare: urbanShareByCode.get(row.countryCode) ?? null,
            })),
          );
          setWorstDemographicLoading(false);
        }
      } catch {
        if (!cancelled) {
          setWorstDemographicError("Could not load demographic comparison data right now.");
          setWorstDemographicLoading(false);
        }
      }

      try {
        const [internetByCode, unemploymentByCode] = await Promise.all([
          fetchLatestIndicatorByCountry("IT.NET.USER.ZS", codeSet),
          fetchLatestIndicatorByCountry("SL.UEM.TOTL.ZS", codeSet),
        ]);

        const divorceResponse = await fetch("https://ourworldindata.org/grapher/divorces-per-1000-people.csv", {
          cache: "no-store",
        });
        if (!divorceResponse.ok) {
          throw new Error("Could not load divorce dataset");
        }
        const divorceCsv = await divorceResponse.text();
        const parsed = Papa.parse<Record<string, string>>(divorceCsv, {
          header: true,
          skipEmptyLines: true,
        });

        const divorceByCode = new Map<string, MetricValue>();
        for (const row of parsed.data) {
          const code = (row.Code ?? "").trim();
          if (!codeSet.has(code)) continue;
          const year = String(row.Year ?? "").trim();
          const value = Number(row["Crude divorce rate"] ?? "");
          if (!Number.isFinite(value) || !year) continue;
          const current = divorceByCode.get(code);
          if (!current || Number(year) > Number(current.year)) {
            divorceByCode.set(code, { value, year });
          }
        }

        if (!cancelled) {
          setWorstSocialRows(
            worstCountryOutcomes.map((row) => ({
              countryCode: row.countryCode,
              countryName: row.countryName,
              divorceRate: divorceByCode.get(row.countryCode) ?? null,
              internetUsers: internetByCode.get(row.countryCode) ?? null,
              unemployment: unemploymentByCode.get(row.countryCode) ?? null,
            })),
          );
          setWorstSocialLoading(false);
          setWorstComparisonLoadedAt(new Date().toISOString());
        }
      } catch {
        if (!cancelled) {
          setWorstSocialError("Could not load social comparison data right now.");
          setWorstSocialLoading(false);
        }
      }
    }

    void loadWorstComparisons();
    return () => {
      cancelled = true;
    };
  }, [worstCountryOutcomes]);

  useEffect(() => {
    let cancelled = false;

    async function loadPopulationAndGeography() {
      if (countryOutcomes.length === 0) {
        setPopulationGeoRows([]);
        setPopulationGeoLoading(false);
        return;
      }

      setPopulationGeoLoading(true);
      setPopulationGeoError(null);

      const codeSet = new Set(countryOutcomes.map((row) => row.countryCode));

      try {
        const [populationByCode, surfaceByCode, landByCode, densityByCode, countriesResponse] = await Promise.all([
          fetchLatestIndicatorByCountry("SP.POP.TOTL", codeSet),
          fetchLatestIndicatorByCountry("AG.SRF.TOTL.K2", codeSet),
          fetchLatestIndicatorByCountry("AG.LND.TOTL.K2", codeSet),
          fetchLatestIndicatorByCountry("EN.POP.DNST", codeSet),
          fetch(`${WORLD_BANK_COUNTRY_BASE}?format=json&per_page=400`, { cache: "no-store" }),
        ]);

        if (!countriesResponse.ok) {
          throw new Error("Failed to load country metadata");
        }

        const countriesPayload = (await countriesResponse.json()) as [
          unknown,
          Array<{ id: string; region?: { value?: string }; incomeLevel?: { value?: string } }>,
        ];
        const countries = Array.isArray(countriesPayload?.[1]) ? countriesPayload[1] : [];
        const metadataByCode = new Map<string, { region: string; incomeLevel: string }>();
        for (const country of countries) {
          if (!codeSet.has(country.id)) continue;
          metadataByCode.set(country.id, {
            region: country.region?.value ?? "N/A",
            incomeLevel: country.incomeLevel?.value ?? "N/A",
          });
        }

        if (cancelled) return;
        setPopulationGeoRows(
          countryOutcomes.map((row) => ({
            countryCode: row.countryCode,
            countryName: row.countryName,
            population: populationByCode.get(row.countryCode) ?? null,
            surfaceArea: surfaceByCode.get(row.countryCode) ?? null,
            landArea: landByCode.get(row.countryCode) ?? null,
            populationDensity: densityByCode.get(row.countryCode) ?? null,
            region: metadataByCode.get(row.countryCode)?.region ?? "N/A",
            incomeLevel: metadataByCode.get(row.countryCode)?.incomeLevel ?? "N/A",
          })),
        );
        setPopulationGeoLoadedAt(new Date().toISOString());
      } catch {
        if (!cancelled) {
          setPopulationGeoError("Could not load population and geography comparison data right now.");
        }
      } finally {
        if (!cancelled) setPopulationGeoLoading(false);
      }
    }

    void loadPopulationAndGeography();
    return () => {
      cancelled = true;
    };
  }, [countryOutcomes]);

  useEffect(() => {
    let cancelled = false;

    async function loadCountryOutcomes() {
      setCountryOutcomesLoading(true);
      setCountryOutcomesError(null);

      try {
        const countriesResponse = await fetch(`${WORLD_BANK_COUNTRY_BASE}?format=json&per_page=400`, { cache: "no-store" });
        if (!countriesResponse.ok) {
          throw new Error("Failed to load country list");
        }
        const countriesPayload = (await countriesResponse.json()) as [
          unknown,
          Array<{ id: string; region?: { value?: string } }>,
        ];
        const countries = Array.isArray(countriesPayload?.[1]) ? countriesPayload[1] : [];
        const realCountryCodes = new Set(
          countries
            .filter((country) => country.region?.value !== "Aggregates")
            .map((country) => country.id),
        );

        const gdpRows = await fetchWorldBankRows(
          `${WORLD_BANK_COUNTRY_BASE}/all/indicator/NY.GDP.MKTP.KD?format=json&per_page=20000`,
        );
        const latestGdpByCode = new Map<string, { countryName: string; value: number; year: string }>();
        for (const row of gdpRows) {
          if (!realCountryCodes.has(row.countryiso3code)) continue;
          if (typeof row.value !== "number") continue;
          const current = latestGdpByCode.get(row.countryiso3code);
          if (!current || Number(row.date) > Number(current.year)) {
            latestGdpByCode.set(row.countryiso3code, {
              countryName: row.country.value,
              value: row.value,
              year: row.date,
            });
          }
        }

        const top11 = Array.from(latestGdpByCode.entries())
          .sort((a, b) => b[1].value - a[1].value)
          .slice(0, 11);
        const bottom11 = Array.from(latestGdpByCode.entries())
          .sort((a, b) => a[1].value - b[1].value)
          .slice(0, 11);
        const targetCodes = new Set(top11.map(([countryCode]) => countryCode));
        const worstCodes = new Set(bottom11.map(([countryCode]) => countryCode));

        const lifeRows = await fetchWorldBankRows(
          `${WORLD_BANK_COUNTRY_BASE}/all/indicator/SP.DYN.LE00.IN?format=json&per_page=20000`,
        );
        const latestLifeByCode = new Map<string, MetricValue>();
        for (const row of lifeRows) {
          if (!targetCodes.has(row.countryiso3code) && !worstCodes.has(row.countryiso3code)) continue;
          if (typeof row.value !== "number") continue;
          const current = latestLifeByCode.get(row.countryiso3code);
          if (!current || Number(row.date) > Number(current.year)) {
            latestLifeByCode.set(row.countryiso3code, { value: row.value, year: row.date });
          }
        }

        const rows: CountryOutcomesRow[] = top11.map(([countryCode, gdp]) => ({
          countryCode,
          countryName: gdp.countryName,
          realGdp: { value: gdp.value, year: gdp.year },
          lifeExpectancy: latestLifeByCode.get(countryCode) ?? null,
        }));
        const worstRows: CountryOutcomesRow[] = bottom11.map(([countryCode, gdp]) => ({
          countryCode,
          countryName: gdp.countryName,
          realGdp: { value: gdp.value, year: gdp.year },
          lifeExpectancy: latestLifeByCode.get(countryCode) ?? null,
        }));

        if (cancelled) return;
        setCountryOutcomes(rows);
        setCountryOutcomesLoadedAt(new Date().toISOString());
        setWorstCountryOutcomes(worstRows);
        setWorstCountryOutcomesLoadedAt(new Date().toISOString());
      } catch {
        if (!cancelled) {
          setCountryOutcomesError("Could not load GDP and life expectancy data right now.");
          setWorstCountryOutcomesError("Could not load GDP and life expectancy data right now.");
        }
      } finally {
        if (!cancelled) {
          setCountryOutcomesLoading(false);
          setWorstCountryOutcomesLoading(false);
        }
      }
    }

    void loadCountryOutcomes();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTopEconomies() {
      try {
        const countriesResponse = await fetch(`${WORLD_BANK_COUNTRY_BASE}?format=json&per_page=400`, { cache: "no-store" });
        if (!countriesResponse.ok) {
          throw new Error("Failed to load country list");
        }
        const countriesPayload = (await countriesResponse.json()) as [
          unknown,
          Array<{ id: string; region?: { value?: string } }>,
        ];
        const countries = Array.isArray(countriesPayload?.[1]) ? countriesPayload[1] : [];
        const realCountryCodes = new Set(
          countries
            .filter((country) => country.region?.value !== "Aggregates")
            .map((country) => country.id),
        );

        const gdpRows = await fetchWorldBankRows(
          `${WORLD_BANK_COUNTRY_BASE}/all/indicator/NY.GDP.PCAP.KD?format=json&per_page=20000`,
        );

        const latestGdpByCountry = new Map<string, { countryName: string; value: number; year: string }>();
        for (const row of gdpRows) {
          if (!realCountryCodes.has(row.countryiso3code)) continue;
          if (typeof row.value !== "number") continue;
          const current = latestGdpByCountry.get(row.countryiso3code);
          if (!current || Number(row.date) > Number(current.year)) {
            latestGdpByCountry.set(row.countryiso3code, {
              countryName: row.country.value,
              value: row.value,
              year: row.date,
            });
          }
        }

        const top11 = Array.from(latestGdpByCountry.entries())
          .sort((a, b) => b[1].value - a[1].value)
          .slice(0, 11);

        const enriched = await Promise.all(
          top11.map(async ([countryCode, gdp]) => {
            const [populationRows, educationRows] = await Promise.all([
              fetchWorldBankRows(
                `${WORLD_BANK_COUNTRY_BASE}/${countryCode}/indicator/SP.POP.TOTL?format=json&per_page=90`,
              ),
              fetchWorldBankRows(
                `${WORLD_BANK_COUNTRY_BASE}/${countryCode}/indicator/SE.XPD.TOTL.GD.ZS?format=json&per_page=90`,
              ),
            ]);

            return {
              countryCode,
              countryName: gdp.countryName,
              realGdpPerCapita: { value: gdp.value, year: gdp.year },
              population: getLatestValue(populationRows),
              educationSpend: getLatestValue(educationRows),
            } satisfies EconomyRow;
          }),
        );

        if (cancelled) return;
        setTopEconomies(enriched);
        setTopEconomiesLoadedAt(new Date().toISOString());
      } catch {
        if (!cancelled) {
          setTopEconomiesError("Could not load top economy data right now. Please try again shortly.");
        }
      } finally {
        if (!cancelled) setTopEconomiesLoading(false);
      }
    }

    loadTopEconomies();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestDataYear = useMemo(() => {
    const years = Object.values(metrics)
      .filter((item): item is MetricValue => Boolean(item))
      .map((item) => Number(item.year))
      .filter((year) => Number.isFinite(year));
    if (years.length === 0) return "N/A";
    return String(Math.max(...years));
  }, [metrics]);

  const maxTopPopulation = useMemo(() => {
    const values = populationGeoRows
      .map((row) => row.population?.value ?? 0)
      .filter((value) => Number.isFinite(value) && value > 0);
    if (values.length === 0) return 1;
    return Math.max(...values);
  }, [populationGeoRows]);

  return (
    <div className="min-h-full">
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-background to-violet-500/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_-10%,rgba(59,130,246,0.18),transparent)]" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.25fr_0.75fr]"
        >
          <Card className="border-border/70 bg-card/95 backdrop-blur">
            <CardHeader className="space-y-3">
              <Badge className="w-fit gap-1.5 bg-primary/10 text-primary hover:bg-primary/10">
                <FlaskConical className="size-3.5" />
                Data Science Explorer
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl">Understand global data with live comparisons</CardTitle>
              <CardDescription className="text-sm leading-relaxed sm:text-base">
                This section combines plain-English data science concepts with live world data. You can explore
                real-time macro indicators, compare top and lower-performing economies across education, demographic,
                and social factors, and review population + geography context like region, density, and surface area.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {[
                "Live World Bank Data",
                "GDP & PPP",
                "Top vs Lower Economies",
                "Population Graphs",
                "Geography Context",
                "Education, Demographic & Social Comparisons",
                "Plain-English Concepts",
              ].map((topic) => (
                <span key={topic} className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {topic}
                </span>
              ))}
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-3 shadow-xl backdrop-blur">
            <img src={VISUALS[0].src} alt={VISUALS[0].alt} className="h-full min-h-[220px] w-full rounded-xl object-cover" />
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Landmark className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Live economic indicators (World Bank)</h2>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">Source: World Bank Open Data API</Badge>
          <span>Latest data year detected: {latestDataYear}</span>
          <span>Fetched: {loadedAt ? new Date(loadedAt).toLocaleString() : "Loading..."}</span>
        </div>

        {metricsError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {metricsError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {METRICS.map((metric, index) => {
            const value = metrics[metric.id];
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Card className="h-full border-border/70">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base">{metric.title}</CardTitle>
                    <CardDescription>{metric.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-semibold tracking-tight">
                      {loadingMetrics ? "Loading..." : value ? formatMetric(value.value, metric.unit) : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">Latest year: {value?.year ?? "N/A"}</div>
                    <a href={metric.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      Indicator source
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Top 11 economies by real GDP per person (live)</h2>
        </div>
        <p className="mb-3 max-w-4xl text-sm text-muted-foreground">
          This table ranks countries by the latest available real GDP per capita (constant dollars), then adds latest
          population and education spending to provide better context.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">World Bank indicators: NY.GDP.PCAP.KD, SP.POP.TOTL, SE.XPD.TOTL.GD.ZS</Badge>
          <span>Fetched: {topEconomiesLoadedAt ? new Date(topEconomiesLoadedAt).toLocaleString() : "Loading..."}</span>
        </div>

        {topEconomiesError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {topEconomiesError}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Real GDP per capita</th>
                <th className="px-3 py-2 text-left">Population</th>
                <th className="px-3 py-2 text-left">Education spend (% GDP)</th>
              </tr>
            </thead>
            <tbody>
              {topEconomiesLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    Loading top economy data...
                  </td>
                </tr>
              )}
              {!topEconomiesLoading &&
                topEconomies.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {formatMetric(row.realGdpPerCapita.value, "usd")}
                      <div className="text-xs text-muted-foreground">Year: {row.realGdpPerCapita.year}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.population ? row.population.value.toLocaleString() : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.population?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.educationSpend ? `${row.educationSpend.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.educationSpend?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Source:{" "}
          <a
            href="https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.KD?format=json&per_page=20000"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            World Bank indicator API
          </a>{" "}
          (plus country-specific calls for population and education).
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Globe2 className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Top 11 countries: GDP and life expectancy</h2>
        </div>
        <p className="mb-3 max-w-4xl text-sm text-muted-foreground">
          This section focuses on top-performing countries by real GDP (total yearly output) and compares that with life expectancy.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">GDP: NY.GDP.MKTP.KD</Badge>
          <Badge variant="secondary">Life expectancy: SP.DYN.LE00.IN</Badge>
          <span>Fetched: {countryOutcomesLoadedAt ? new Date(countryOutcomesLoadedAt).toLocaleString() : "Loading..."}</span>
        </div>

        {countryOutcomesError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {countryOutcomesError}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Real GDP (annual)</th>
                <th className="px-3 py-2 text-left">Life expectancy</th>
              </tr>
            </thead>
            <tbody>
              {countryOutcomesLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={4}>
                    Loading country outcomes...
                  </td>
                </tr>
              )}
              {!countryOutcomesLoading &&
                countryOutcomes.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {formatMetric(row.realGdp.value, "usd")}
                      <div className="text-xs text-muted-foreground">Year: {row.realGdp.year}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.lifeExpectancy ? `${row.lifeExpectancy.value.toFixed(1)} years` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.lifeExpectancy?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Sources:{" "}
          <a
            href="https://api.worldbank.org/v2/country/all/indicator/SP.DYN.LE00.IN?format=json&per_page=20000"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            World Bank life expectancy API
          </a>
          .
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Top 11 countries: population graph + geography table</h2>
        </div>
        <p className="mb-3 max-w-4xl text-sm text-muted-foreground">
          This view compares the same top 11 countries with a population bar graph, then adds geography context like total
          surface area, land area, and population density.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">SP.POP.TOTL (Population)</Badge>
          <Badge variant="secondary">AG.SRF.TOTL.K2 (Surface area)</Badge>
          <Badge variant="secondary">AG.LND.TOTL.K2 (Land area)</Badge>
          <Badge variant="secondary">EN.POP.DNST (Population density)</Badge>
          <span>Fetched: {populationGeoLoadedAt ? new Date(populationGeoLoadedAt).toLocaleString() : "Loading..."}</span>
        </div>

        {populationGeoError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {populationGeoError}
          </div>
        )}

        <Card className="mb-5 border-border/70 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Population comparison graph (top 11)</CardTitle>
            <CardDescription>Bar lengths are relative to the largest population in this top-11 set.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {populationGeoLoading && <div className="text-sm text-muted-foreground">Loading population graph...</div>}
            {!populationGeoLoading &&
              populationGeoRows.map((row) => {
                const ratio = row.population ? Math.max(2, (row.population.value / maxTopPopulation) * 100) : 0;
                return (
                  <div key={`graph-${row.countryCode}`} className="grid grid-cols-[180px_1fr_auto] items-center gap-3 text-sm">
                    <div className="truncate font-medium">{row.countryName}</div>
                    <div className="h-3 rounded-full bg-muted">
                      <div className="h-3 rounded-full bg-primary/80" style={{ width: `${ratio}%` }} />
                    </div>
                    <div className="tabular-nums text-muted-foreground">
                      {row.population ? row.population.value.toLocaleString() : "N/A"}
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1020px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Population</th>
                <th className="px-3 py-2 text-left">Region</th>
                <th className="px-3 py-2 text-left">Income level</th>
                <th className="px-3 py-2 text-left">Surface area (sq. km)</th>
                <th className="px-3 py-2 text-left">Land area (sq. km)</th>
                <th className="px-3 py-2 text-left">Population density (people/sq. km)</th>
              </tr>
            </thead>
            <tbody>
              {populationGeoLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={8}>
                    Loading population and geography data...
                  </td>
                </tr>
              )}
              {!populationGeoLoading &&
                populationGeoRows.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {row.population ? row.population.value.toLocaleString() : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.population?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">{row.region}</td>
                    <td className="px-3 py-2">{row.incomeLevel}</td>
                    <td className="px-3 py-2">
                      {row.surfaceArea ? row.surfaceArea.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.surfaceArea?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.landArea ? row.landArea.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.landArea?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.populationDensity ? row.populationDensity.value.toFixed(2) : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.populationDensity?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Education comparison (top 11 countries)</h2>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">SE.XPD.TOTL.GD.ZS</Badge>
          <Badge variant="secondary">SE.TER.ENRR</Badge>
          <Badge variant="secondary">SE.ADT.LITR.ZS</Badge>
          <span>Fetched: {comparisonLoadedAt ? new Date(comparisonLoadedAt).toLocaleString() : "Loading..."}</span>
        </div>
        {educationError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {educationError}
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Education spend (% GDP)</th>
                <th className="px-3 py-2 text-left">Tertiary enrollment (%)</th>
                <th className="px-3 py-2 text-left">Adult literacy (%)</th>
              </tr>
            </thead>
            <tbody>
              {educationLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    Loading education comparison...
                  </td>
                </tr>
              )}
              {!educationLoading &&
                educationRows.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {row.educationSpend ? `${row.educationSpend.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.educationSpend?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.tertiaryEnrollment ? `${row.tertiaryEnrollment.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.tertiaryEnrollment?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.literacyRate ? `${row.literacyRate.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.literacyRate?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Demographic comparison (top 11 countries)</h2>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">SP.DYN.CBRT.IN (Birth rate)</Badge>
          <Badge variant="secondary">SP.DYN.TFRT.IN (Fertility)</Badge>
          <Badge variant="secondary">SP.URB.TOTL.IN.ZS (Urban share)</Badge>
          <span>Fetched: {comparisonLoadedAt ? new Date(comparisonLoadedAt).toLocaleString() : "Loading..."}</span>
        </div>
        {demographicError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {demographicError}
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Birth rate (per 1,000)</th>
                <th className="px-3 py-2 text-left">Fertility (births/woman)</th>
                <th className="px-3 py-2 text-left">Urban population (%)</th>
              </tr>
            </thead>
            <tbody>
              {demographicLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    Loading demographic comparison...
                  </td>
                </tr>
              )}
              {!demographicLoading &&
                demographicRows.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {row.birthRate ? row.birthRate.value.toFixed(2) : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.birthRate?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.fertilityRate ? row.fertilityRate.value.toFixed(2) : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.fertilityRate?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.urbanPopulationShare ? `${row.urbanPopulationShare.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.urbanPopulationShare?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Social factors comparison (top 11 countries)</h2>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">OWID: Crude divorce rate</Badge>
          <Badge variant="secondary">IT.NET.USER.ZS (Internet users)</Badge>
          <Badge variant="secondary">SL.UEM.TOTL.ZS (Unemployment)</Badge>
          <span>Fetched: {comparisonLoadedAt ? new Date(comparisonLoadedAt).toLocaleString() : "Loading..."}</span>
        </div>
        {socialError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {socialError}
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Divorce rate (per 1,000)</th>
                <th className="px-3 py-2 text-left">Internet users (%)</th>
                <th className="px-3 py-2 text-left">Unemployment (%)</th>
              </tr>
            </thead>
            <tbody>
              {socialLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    Loading social factors...
                  </td>
                </tr>
              )}
              {!socialLoading &&
                socialRows.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {row.divorceRate ? row.divorceRate.value.toFixed(2) : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.divorceRate?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.internetUsers ? `${row.internetUsers.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.internetUsers?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.unemployment ? `${row.unemployment.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.unemployment?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Globe2 className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Worst 11 economies (worst to better): GDP and life expectancy</h2>
        </div>
        <p className="mb-3 max-w-4xl text-sm text-muted-foreground">
          This table ranks the lowest 11 countries by real GDP (total yearly output), from worst to better, and compares
          them with life expectancy using the same methodology.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">GDP: NY.GDP.MKTP.KD</Badge>
          <Badge variant="secondary">Life expectancy: SP.DYN.LE00.IN</Badge>
          <span>
            Fetched: {worstCountryOutcomesLoadedAt ? new Date(worstCountryOutcomesLoadedAt).toLocaleString() : "Loading..."}
          </span>
        </div>

        {worstCountryOutcomesError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {worstCountryOutcomesError}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Real GDP (annual)</th>
                <th className="px-3 py-2 text-left">Life expectancy</th>
              </tr>
            </thead>
            <tbody>
              {worstCountryOutcomesLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={4}>
                    Loading worst-economy outcomes...
                  </td>
                </tr>
              )}
              {!worstCountryOutcomesLoading &&
                worstCountryOutcomes.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {formatMetric(row.realGdp.value, "usd")}
                      <div className="text-xs text-muted-foreground">Year: {row.realGdp.year}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.lifeExpectancy ? `${row.lifeExpectancy.value.toFixed(1)} years` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.lifeExpectancy?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Education comparison (worst 11 economies)</h2>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">SE.XPD.TOTL.GD.ZS</Badge>
          <Badge variant="secondary">SE.TER.ENRR</Badge>
          <Badge variant="secondary">SE.ADT.LITR.ZS</Badge>
          <span>Fetched: {worstComparisonLoadedAt ? new Date(worstComparisonLoadedAt).toLocaleString() : "Loading..."}</span>
        </div>
        {worstEducationError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {worstEducationError}
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Education spend (% GDP)</th>
                <th className="px-3 py-2 text-left">Tertiary enrollment (%)</th>
                <th className="px-3 py-2 text-left">Adult literacy (%)</th>
              </tr>
            </thead>
            <tbody>
              {worstEducationLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    Loading worst-economy education comparison...
                  </td>
                </tr>
              )}
              {!worstEducationLoading &&
                worstEducationRows.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {row.educationSpend ? `${row.educationSpend.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.educationSpend?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.tertiaryEnrollment ? `${row.tertiaryEnrollment.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.tertiaryEnrollment?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.literacyRate ? `${row.literacyRate.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.literacyRate?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Demographic comparison (worst 11 economies)</h2>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">SP.DYN.CBRT.IN (Birth rate)</Badge>
          <Badge variant="secondary">SP.DYN.TFRT.IN (Fertility)</Badge>
          <Badge variant="secondary">SP.URB.TOTL.IN.ZS (Urban share)</Badge>
          <span>Fetched: {worstComparisonLoadedAt ? new Date(worstComparisonLoadedAt).toLocaleString() : "Loading..."}</span>
        </div>
        {worstDemographicError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {worstDemographicError}
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Birth rate (per 1,000)</th>
                <th className="px-3 py-2 text-left">Fertility (births/woman)</th>
                <th className="px-3 py-2 text-left">Urban population (%)</th>
              </tr>
            </thead>
            <tbody>
              {worstDemographicLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    Loading worst-economy demographic comparison...
                  </td>
                </tr>
              )}
              {!worstDemographicLoading &&
                worstDemographicRows.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {row.birthRate ? row.birthRate.value.toFixed(2) : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.birthRate?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.fertilityRate ? row.fertilityRate.value.toFixed(2) : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.fertilityRate?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.urbanPopulationShare ? `${row.urbanPopulationShare.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.urbanPopulationShare?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Compass className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Social factors comparison (worst 11 economies)</h2>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">OWID: Crude divorce rate</Badge>
          <Badge variant="secondary">IT.NET.USER.ZS (Internet users)</Badge>
          <Badge variant="secondary">SL.UEM.TOTL.ZS (Unemployment)</Badge>
          <span>Fetched: {worstComparisonLoadedAt ? new Date(worstComparisonLoadedAt).toLocaleString() : "Loading..."}</span>
        </div>
        {worstSocialError && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {worstSocialError}
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-left">Divorce rate (per 1,000)</th>
                <th className="px-3 py-2 text-left">Internet users (%)</th>
                <th className="px-3 py-2 text-left">Unemployment (%)</th>
              </tr>
            </thead>
            <tbody>
              {worstSocialLoading && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={5}>
                    Loading worst-economy social factors...
                  </td>
                </tr>
              )}
              {!worstSocialLoading &&
                worstSocialRows.map((row, index) => (
                  <tr key={row.countryCode} className="border-t border-border">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{row.countryName}</td>
                    <td className="px-3 py-2">
                      {row.divorceRate ? row.divorceRate.value.toFixed(2) : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.divorceRate?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.internetUsers ? `${row.internetUsers.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.internetUsers?.year ?? "N/A"}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.unemployment ? `${row.unemployment.value.toFixed(2)}%` : "N/A"}
                      <div className="text-xs text-muted-foreground">Year: {row.unemployment?.year ?? "N/A"}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Foundations of data science</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FOUNDATIONS.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-3">
          <img src={VISUALS[1].src} alt={VISUALS[1].alt} className="h-full min-h-[240px] w-full rounded-xl object-cover" />
        </div>

        <div>
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <h2 className="text-xl font-semibold">Statistics and averages in practice</h2>
          </div>
          <div className="space-y-3">
            {STAT_TOPICS.map((topic, index) => (
              <motion.div
                key={topic.title}
                initial={{ opacity: 0, x: 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
                    <topic.icon className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold sm:text-base">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground">{topic.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChart className="size-4 text-primary" />
              <CardTitle>Why analysis and visualization matter</CardTitle>
            </div>
            <CardDescription>
              Data analysis turns raw records into meaning. Visualization turns meaning into shared understanding.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              "Find hidden patterns and anomalies early.",
              "Communicate evidence quickly across technical and non-technical teams.",
              "Compare scenarios and forecast outcomes under uncertainty.",
              "Measure intervention impact with transparent assumptions.",
              "Reduce bias by exposing distribution, scale, and outliers.",
              "Build trust with reproducible, source-linked insights.",
            ].map((point) => (
              <div key={point} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                {point}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-3">
          <img src={VISUALS[2].src} alt={VISUALS[2].alt} className="h-full min-h-[240px] w-full rounded-xl object-cover" />
        </div>

        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="size-4 text-primary" />
              <CardTitle>A practical workflow for data-driven teams</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {WORKFLOW_STEPS.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="text-sm">{step}</span>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <Brain className="size-4 text-primary" />
          <h2 className="text-xl font-semibold">Going deeper: advanced data topics</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ADVANCED_TOPICS.map((topic, index) => (
            <motion.div
              key={topic.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <topic.icon className="size-4" />
              </div>
              <h3 className="text-sm font-semibold sm:text-base">{topic.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{topic.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <Globe2 className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Sources and attribution</h2>
          </div>
          <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <h3 className="mb-2 font-medium text-foreground">Data sources</h3>
              <ul className="space-y-1">
                <li>
                  <a href="https://data.worldbank.org/" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    World Bank Open Data
                  </a>{" "}
                  - GDP, PPP, inflation, unemployment, and trade indicators.
                </li>
                <li>
                  <a href="https://api.worldbank.org/" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    World Bank API documentation
                  </a>{" "}
                  - direct indicator endpoints.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-medium text-foreground">Image credits</h3>
              <ul className="space-y-1">
                {VISUALS.map((image) => (
                  <li key={image.href}>
                    <a href={image.href} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {image.credit}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="gap-2" asChild>
              <a href="/import">
                <Sparkles className="size-4" />
                Start with your own dataset
              </a>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href="/dashboard">View analytics dashboard</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
