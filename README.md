# DataViz Studio (Next.js 15.3.8)

DataViz Studio is a full-featured graphing and data-insights web application built with:

- Next.js `15.3.8` (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui-style component system
- Recharts + TanStack Table + PapaParse + date-fns + react-hook-form + motion

It is designed to feel like a hybrid of spreadsheet charting workflows and modern BI dashboards.

## Quick Start

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## App Routes

- `/` - Landing and onboarding
- `/dashboard` - Main analytics workspace
- `/import` - CSV upload, JSON paste, and manual entry
- `/dataset/[id]` - Dataset exploration, profiling, recommendations
- `/charts/[id]` - Interactive chart builder/editor
- `/insights/[id]` - Dedicated insight summary view

## Implemented Feature Areas

- **Data input flows**
  - Manual spreadsheet-like entry (dynamic rows/columns + type selection)
  - CSV parsing and preview with type detection/remap
  - Flexible JSON paste parsing into tabular rows
- **Data profiling**
  - Row/column counts, duplicate detection, missing values, type awareness, warnings
- **Smart chart recommendations**
  - Context-aware recommended chart types with reasons/confidence
- **Chart builder**
  - Chart type selection, axis mapping, aggregation, sort options, display toggles
  - Number formatting, palette selection, export image, reset/save behavior
- **Stats and insights**
  - Descriptive statistics, trend and quality insights, plain-language callouts
- **Dashboard + table exploration**
  - Dataset and chart cards, interactive table controls, saved chart workflow
- **UX polish**
  - Empty/loading/error states, responsive layout, dark mode toggle, local persistence

## Project Structure

```text
app/
  layout.tsx                # Next App Router root layout
  app-shell.tsx             # Client providers + shared shell
  page.tsx                  # Landing route
  dashboard/page.tsx
  import/page.tsx
  dataset/[id]/page.tsx
  charts/[id]/page.tsx
  insights/[id]/page.tsx
  components/               # Reusable UI + feature components
  pages/                    # Feature page components rendered by routes
  store/                    # App context and state persistence
  utils/                    # Parsing, profiling, statistics, recommenders
  data/                     # Sample datasets
  types/                    # Strong app typing
styles/
  index.css
  tailwind.css
  theme.css
```

## Notes

- State is persisted in local storage for datasets/charts/theme.
- The app is optimized for client-side analytics workflows.
- Existing feature modules were migrated from Vite React into Next.js App Router.
