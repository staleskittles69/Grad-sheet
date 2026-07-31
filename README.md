# Grad-sheet

Five projects completed as part of the DS-1 batch (Gradstreet), covering the full stack I'm building toward: Python, SQL, and JavaScript — plus SIAAS, a larger full-stack project I built separately. **Projects 1–5 are launchable websites** — open `index.html` and it runs, no install required. SIAAS is a real backend + database + frontend stack, so it launches via Docker Compose instead — see its own README.

| # | Project | Stack | Description | Launch |
|---|---|---|---|---|
| 1 | [Scientific Calculator](./01-calculator) | HTML / CSS / JS | Basic + scientific modes (trig, log, powers, factorial) backed by a hand-written tokenizer/parser — no `eval()`. | [`01-calculator/index.html`](./01-calculator/index.html) |
| 2 | [Student Management System](./02-student-management-system) | HTML / CSS / JS | Add/search/edit/delete UI over a dictionary-style JS object, persisted with `localStorage`. | [`02-student-management-system/index.html`](./02-student-management-system/index.html) |
| 3 | [House Price Prediction — Data Cleaning](./03-house-price-data-cleaning) | Python (pandas) + JS demo | Full data cleaning pipeline: duplicates, missing values, outliers, inconsistent formatting. The Python script is the deliverable; the website is the same pipeline ported to JS so it's viewable/runnable live. | [`03-house-price-data-cleaning/web/index.html`](./03-house-price-data-cleaning/web/index.html) |
| 4 | [50 SQL Commands](./04-sql-50-commands) | MySQL + JS demo | Two-table relational schema (departments, employees) with 50 commands spanning joins, subqueries, aggregates, and more. The `.sql` files target real MySQL; the website runs the same schema and queries live via SQLite-in-the-browser. | [`04-sql-50-commands/web/index.html`](./04-sql-50-commands/web/index.html) |
| 5 | [Employee Dashboard](./05-employee-dashboard) | HTML / CSS / JS + Chart.js | Interactive dashboard visualizing the same employee dataset used in the SQL project. | [`05-employee-dashboard/index.html`](./05-employee-dashboard/index.html) |
| 6 | [SIAAS](./06-siaas) | React + Spring Boot + PostgreSQL + Docker | Student Intelligence & Academic Analytics System — a full-stack academic platform with JWT auth, RBAC, and an 18-table schema. Student self-service and the full admin panel are built and working; the faculty panel and analytics engine (risk scoring, rank prediction) have schema/design done but no backend yet. | `docker compose up --build` in [`06-siaas/`](./06-siaas) |

Each folder has its own README with more detail on what the project demonstrates. Projects 1, 2, and 3's website work fully offline (double-click and go, no connection needed). Project 4's website pulls its SQLite engine from a CDN and project 5 pulls Chart.js from a CDN — both need internet on first load. SIAAS needs Docker Desktop running; everything else builds inside containers.

## Key decisions

**Projects 1–5 each ship as a website, not just source files.** This wasn't required by the batch brief — it's a deliberate addition on top of it. A reviewer shouldn't need to install dependencies or stand up a local MySQL instance just to confirm the code works; a page they can open directly removes that friction and lets the project speak for itself.

**The Python script and the MySQL files are never replaced, only extended.** Projects 3 and 4 were originally meant to be a pandas script and a MySQL project respectively — that's what the assignment actually asked for, and pandas/MySQL are the right tools for those jobs (real data-cleaning work lives in pandas; a two-table relational schema is what MySQL is for). Rather than swap the language to make everything "web," each of those got a second, clearly-labeled JS **demo** that ports the same logic into the browser — the original `.py`/`.sql` files stay put as the actual deliverable and source of truth, and the demo is verified against them line-by-line before shipping (see each project's README for the specific numbers that were cross-checked).

**The 5 batch projects deliberately span Python, SQL, and JavaScript.** That's not incidental — it mirrors the stack I'm actually building: currently learning Python (Angela Yu's course), already using JS and MySQL day to day. Doing all 5 in one language would've been easier to keep consistent, but wouldn't have shown range.

**SIAAS is included as a full project, not a demo.** It was actually assigned to the AI-1 batch, not mine — but it caught my eye because it's close to the full-fledged student portal I've been building separately, so I spun up a quick demo of it and would like to walk through it further if you're interested. It's a real multi-service app (React frontend, Spring Boot backend, PostgreSQL, Docker Compose), included here as-is: some pieces are fully working, others (faculty panel, analytics engine) are designed but not built, and its own README says exactly which is which rather than glossing over the gap.

## A note on process

I used AI (Claude) to help me build and ship these faster — to plan the structure, write and test the code, and catch bugs before they shipped, rather than spending days getting stuck on syntax. I reviewed, ran, and understood every project before including it here. My general approach to learning is to build fast with AI, then go back and reverse-engineer what it produced — that's how these actually got learned, not just shipped.

## About me

I'm Manish, a Computer Science (CSD) student building a stack centered on C++, JavaScript, and MySQL, with Python currently in progress. Open to expanding that stack further. Actively looking for an internship, with an eye toward eventually moving into MLOps / cloud engineering.

Outside this batch, I'm building a full-stack College ERP (Next.js, MongoDB, JWT auth) — separate project, not part of this repo, but worth knowing about: three role-based portals (student, teacher, admin), attendance tracking, grade/marks management, timetables, notices and announcements, and assignment/test scheduling, all wired to live data end to end across every role.
