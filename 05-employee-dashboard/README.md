# Employee Dashboard

An interactive employee analytics dashboard built with vanilla HTML/CSS/JS and [Chart.js](https://www.chartjs.org/) — no backend, no server, just open the file.

Uses the same 30-employee, 8-department dataset as the [SQL project](../04-sql-50-commands), so the two projects tell a consistent story: same data, modeled relationally in MySQL and visualized here.

## Key decisions

**Chart.js, not hand-rolled charts.** It would be possible to draw the bar charts with raw `<canvas>`/SVG, but that's solving a problem a well-established library already solves well — real dashboards are built on charting libraries, not custom rendering code, so pulling one in is the more representative choice, not a shortcut.

**Same dataset as the SQL project, not a fresh one.** The 30 employees / 8 departments here are the exact same rows seeded in the [SQL project](../04-sql-50-commands). That's meant to show a realistic pipeline — the same relational data modeled in MySQL and then visualized — rather than two projects that just happen to both be about "employees" with no actual connection between them.

**Data is inlined (`data.js`), not fetched.** The first version called `fetch('data.json')`, which fails outright when a page is opened directly as a file (`file://` pages can't `fetch()` other local files in most browsers) — it would only have worked from a local server. Inlining the same data as a JS constant makes double-clicking `index.html` actually work, matching how every other project in this batch launches.

## Features
- Summary cards: total employees, departments, payroll, average salary
- Bar charts: headcount by department, average salary by department
- Searchable, filterable, sortable employee table (by name, department, salary, hire date)

## Run it
Just double-click `index.html`, or open it in a browser directly (`file://…`). No local server needed.

## Files
| File | Purpose |
|---|---|
| `index.html` | Layout |
| `style.css` | Styling |
| `script.js` | Chart rendering, filtering/sorting logic |
| `data.js` | Employee + department data, inlined as a JS constant so the page works over `file://` without a `fetch()` call |
| `data.json` | Same data in plain JSON — `data.js` is generated from this; kept as the readable source of truth |
