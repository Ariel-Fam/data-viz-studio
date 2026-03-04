Build a full-featured graphing and data-insights web application using Next.js 15.3.8, TypeScript, Tailwind CSS, and a modern component system such as shadcn/ui. The app should feel like a polished hybrid of Microsoft Excel charting tools, modern BI dashboards, and popular graphing/data exploration tools. It must help users not only create charts, but also understand their data through summaries, trends, comparisons, and statistical insights.

Core goal

Create an application where a user can:

Manually enter data for one or more graphs

Upload CSV files

Paste JSON data with a flexible key-value structure

Clean, transform, preview, and visualize the data

Generate meaningful chart recommendations automatically

Calculate key descriptive statistics like mean, median, mode, min, max, range, variance, standard deviation, total, count, percentage, growth rate, and moving averages

Interact with charts and dashboards to uncover useful insights

Technical requirements

Use Next.js 15.3.8 App Router

Use TypeScript

Use Tailwind CSS

Use responsive design for mobile, tablet, and desktop

Use a clean, modern, professional UI

Use modular architecture with reusable components

Use client/server boundaries appropriately

Use strong typing for datasets, chart configs, and transformation logic

Use local state and/or a lightweight state manager where appropriate

Add loading, empty, error, and validation states

Add accessibility support: keyboard navigation, labels, ARIA where needed, color contrast awareness

Organize the project cleanly into components, hooks, utils, lib, types, and feature folders

Recommended libraries

Use the best libraries for this stack where appropriate:

Recharts or Nivo for charting

PapaParse for CSV parsing

Zod for validation

React Hook Form for forms

TanStack Table for interactive data tables

date-fns for date handling

Lucide React for icons

Framer Motion for subtle UI transitions

Optional: xlsx support for spreadsheet-like import/export if helpful

Main features
1. Data input methods

Support multiple data input flows:

A. Manual entry

Let users create datasets manually

User can define:

Dataset name

Column names

Row values

Value types: number, text, category, date, boolean, percentage, currency

Allow adding/removing rows and columns dynamically

Provide spreadsheet-like entry experience

Include validation for bad values, missing fields, duplicate column names, malformed dates, etc.

B. CSV upload

Allow drag-and-drop or file picker upload

Parse CSV and show a preview table

Auto-detect headers and data types

Let the user remap columns if detection is wrong

Handle commas, quoted strings, empty cells, and inconsistent row lengths gracefully

C. JSON paste

User can paste JSON in flexible structures such as:

array of objects

key-value object

nested structures where possible

Detect structure and transform into tabular format when possible

Show a preview and allow the user to choose which keys to visualize

Validate malformed JSON with clear error messaging

2. Data profiling and understanding

Once data is loaded, generate a data summary panel similar to spreadsheet profiling tools:

Number of rows

Number of columns

Column names

Detected data types per column

Missing values count per column

Duplicate rows count

Unique values per column

Basic quality warnings:

missing values

outliers

duplicate categories

likely wrong type detection

mixed type columns

3. Smart chart recommendations

Based on the structure of the data, automatically recommend the best chart types, similar to Excel’s “recommended charts”:

Bar chart for category comparisons

Line chart for time series trends

Area chart for cumulative trends

Pie / donut chart for proportions with few categories

Scatter plot for relationship between two numeric variables

Histogram for distribution of a numeric field

Box plot for spread and outlier analysis

Stacked bar / stacked area for composition over time or grouped categories

Radar chart for multi-metric profile comparison

Heatmap for dense matrix-like or correlation-style data

Combo chart where useful, e.g. bars + line

For each recommendation, explain why that chart is useful for the selected data.

4. Chart builder

Create a powerful interactive chart builder where the user can:

Select chart type

Pick X-axis and Y-axis

Choose grouping / series fields

Filter data

Sort ascending/descending

Aggregate data by:

sum

average

count

min

max

median

Change chart title, subtitle, labels, legend, tooltip content

Toggle gridlines, markers, stacked mode, smooth lines, percentages

Format numbers as:

plain number

percentage

currency

compact notation (e.g. 1.2K)

Customize date grouping:

day

week

month

quarter

year

Choose color palettes

Export chart as image if possible

Save chart configuration locally

5. Spreadsheet-style analysis tools

Take strong inspiration from Microsoft Excel and popular analytics tools. Add:

Sort and filter controls

Column-based filtering

Search across dataset

Conditional highlighting for high/low values

Quick totals row

Column summaries

Pivot-like summaries

Group by one or more fields

Aggregation summaries by selected categories

Derived columns:

percentage change

cumulative sum

difference from previous row

normalized values

moving average

ratio columns

Basic formula-style helpers for transformations where feasible

6. Statistics and insight engine

Add a statistics and insight sidebar that updates based on selected data:

Mean

Average

Median

Mode

Count

Sum

Min / max

Range

Standard deviation

Variance

Quartiles

Interquartile range

Correlation for numeric pairs

Trend direction for time series

Top categories

Bottom categories

Share of total

Outlier detection

Also generate plain-language insights such as:

“Sales peak in March and decline steadily after June.”

“Category A contributes 42% of the total.”

“There may be outliers in this column.”

“This metric has high variability.”

“Two numeric columns appear moderately positively correlated.”

These insights should be useful, readable, and tied directly to visible data.

7. Interactive dashboard experience

The app should feel like a mini analytics platform:

Main dashboard page

Data import area

Dataset preview table

Statistics summary cards

Recommended chart panel

Chart workspace

Filters sidebar

Insights sidebar

Saved views or recent charts section

Let users build multiple charts from the same dataset and display them in a dashboard layout.

8. Table view and data exploration

Include an advanced data table with:

Pagination

Sorting

Filtering

Search

Column visibility toggle

Sticky headers

Inline formatting

Summary footer

Optional row selection

Export filtered data

9. Helpful UX features

Include as many helpful features as possible:

Sample demo datasets

Empty state with onboarding tips

Tooltips explaining chart use cases

Auto-detected chart suggestions after upload

Smart defaults for axes and aggregations

Error messages that explain how to fix data issues

Responsive layout

Dark mode support

Save chart settings in local storage

Reset chart config button

“Explain this chart” helper text

10. Visual design direction

Design the app to look:

modern

professional

spacious

clean

dashboard-like

suitable for data work

Use:

rounded cards

soft shadows

responsive grid layout

strong typography hierarchy

elegant spacing

polished form controls

tasteful motion and transitions

charts that remain readable on smaller screens

11. Suggested pages / routes

Use App Router and create a sensible structure such as:

/ → landing / overview

/dashboard → main analytics workspace

/import → upload and paste data

/dataset/[id] → dataset details and profiling

/charts/[id] → chart builder/editor

/insights/[id] → insight summary view

12. Code quality expectations

Generate production-quality code with:

clear folder structure

reusable components

type-safe utility functions

clean separation of concerns

comments where logic is non-obvious

meaningful naming

robust error handling

scalable architecture

13. Deliverables

Provide:

Full project structure

All key source files

Reusable components

Type definitions

Utility functions for parsing, profiling, and statistics

Example sample datasets

Setup instructions

Explanation of how each major feature works

14. Bonus features if feasible

If possible, also include:

correlation matrix

anomaly/outlier flagging

trendline support

downloadable reports

chart presets

dashboard cards

local persistence of imported datasets

theme toggle

AI-like natural language insight summaries based on selected chart

Build the app so it is genuinely useful for users who want to understand their data, not just draw charts. Prioritize clarity, usability, flexibility, and insight generation over superficial visuals.