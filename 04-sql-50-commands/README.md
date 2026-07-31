# 50 SQL Commands — Two-Table Schema

A MySQL project built around two related tables — `departments` and `employees` — demonstrating 50 SQL commands across every major category: filtering, aggregates, `GROUP BY`/`HAVING`, joins (inner/left/right/self), subqueries, string & date functions, `CASE` expressions, and data modification.

**[→ Try it live in the browser](./web/index.html)** — an interactive playground where you can click through all 50 queries (or write your own) and see real results, no MySQL install required. See [Live demo](#live-demo-webindexhtml) below for how it works.

## Key decisions

**MySQL, specifically.** The assignment calls for SQL commands, and MySQL is what I'm already using elsewhere in my stack — so this uses the real thing instead of a lighter substitute, and the schema/queries are written in actual MySQL 8+ syntax (`AUTO_INCREMENT`, `DATE`, `TIMESTAMPDIFF()`, etc.), not a generic SQL dialect that happens to also run elsewhere.

**Two related tables, not two independent ones.** `departments` and `employees` could've been any two unrelated tables — the brief just says "two tables." Making `employees.department_id` a foreign key, and additionally having `employees.manager_id` self-reference `employees.employee_id`, was deliberate: it's what makes real relational patterns possible — inner/left/right joins *and* a self-join (query #32, employee-to-manager) — instead of just running the same flat `SELECT` against two disconnected tables.

**The browser demo runs on SQLite, not MySQL — because it has to.** MySQL needs a running server process; there's no way to embed a live one in a static webpage. sql.js compiles SQLite itself to WebAssembly, which is what makes a truly interactive, click-and-run demo possible without asking anyone to install anything. The `.sql` files at the top of this folder are the real, unmodified MySQL deliverable; the demo is a verified translation of them (see the Live demo section below for the 4 queries where MySQL and SQLite syntax actually diverge).

## Schema
- **departments** — `department_id, department_name, location, budget`
- **employees** — `employee_id, first_name, last_name, email, phone, hire_date, job_title, salary, department_id, manager_id`

`employees.manager_id` self-references `employees.employee_id`, which is what makes the self-join query (#32) possible.

## Run it
```sql
SOURCE schema.sql;
SOURCE seed_data.sql;
SOURCE 50_sql_commands.sql;
```
(or paste each file into MySQL Workbench / any MySQL 8+ client in that order)

## What's covered
| Section | Commands |
|---|---|
| Basic SELECT | 1–5 |
| Filtering & operators | 6–14 |
| Aggregate functions | 15–21 |
| GROUP BY / HAVING | 22–28 |
| Joins (inner, left, right, self) | 29–36 |
| Subqueries (IN, EXISTS, correlated) | 37–42 |
| String & date functions | 43–46 |
| CASE expressions | 47–48 |
| UPDATE / DELETE | 49–50 |

## Files
| File | Purpose |
|---|---|
| `schema.sql` | Table definitions and foreign keys |
| `seed_data.sql` | 8 departments, 30 employees |
| `50_sql_commands.sql` | All 50 commands, organized and commented by section |
| `web/` | Interactive browser playground — see below |

Query logic was validated against a SQLite mirror of the schema before finalizing — every one of the 50 patterns executes and returns results as expected.

## Live demo (`web/index.html`)

Open `web/index.html` in any browser — no build step, no install. It loads [sql.js](https://sql.js.org/) (SQLite compiled to WebAssembly) from a CDN, builds the same two-table schema and seed data entirely in memory, and lets you:

- Click any of the 50 queries in the sidebar to load and run it instantly
- Edit the SQL directly in the textarea and re-run with the **Run ▶** button (or `Ctrl/Cmd + Enter`)
- Hit **Reset Database** to undo the two write queries (#49, #50) and restore the original 8 departments / 30 employees

The schema and all 50 queries were translated to SQLite for this demo (see Key decisions above for why); 4 of them (`#33`, `#44`, `#45`, `#46`) use slightly different syntax where MySQL and SQLite diverge (`RIGHT JOIN`, `SUBSTRING_INDEX`, `YEAR()`, `TIMESTAMPDIFF()`/`CURDATE()`) — noted inline in `web/data.js`. Every query was verified query-by-query against the real sql.js engine before shipping.

Needs an internet connection on first load (to fetch the ~1.5MB SQLite WASM engine from cdnjs) — same tradeoff the Employee Dashboard makes for Chart.js.
