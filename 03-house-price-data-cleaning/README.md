# House Price Prediction — Data Cleaning

A complete, end-to-end data cleaning pipeline for a messy house-price dataset, built with `pandas`. This is the preprocessing step that would normally come before training a house price prediction model.

**[→ Try it live in the browser](./web/index.html)** — the same pipeline, reimplemented in JavaScript, running step-by-step on the same dataset with no Python install needed. See [Live demo](#live-demo-webindexhtml) below.

## Key decisions

**`pandas`, not a rewrite in something else.** Unlike the calculator or the student system, this project's whole point is demonstrating a specific, industry-standard tool for a specific job — real data cleaning is done in pandas (or its equivalents), not hand-rolled loops. So the Python script stays the actual deliverable; the `web/` folder is an added JS port for viewing it live, not a replacement (see the top-level README for why that split exists across projects).

**Median imputation, not mean.** Missing values in `area_sqft`, `bathrooms`, `age_years`, and `price_lakhs` are filled with each column's median rather than its mean. The mean gets pulled around by the same outliers this pipeline is also trying to fix later, so filling with it would mean the "clean" values are quietly distorted by the dirty ones. The median is robust to that — it's the value least affected by a handful of extreme rows.

**Capping outliers with IQR, not deleting them.** The 7 extreme `price_lakhs` rows get clipped to the IQR bounds (`[Q1 − 1.5×IQR, Q3 + 1.5×IQR]`) instead of being dropped. Deleting them would be simpler, but it throws away real rows and can bias a small dataset like this one; capping keeps every row in the dataset while still preventing a handful of extreme values from skewing downstream analysis or a model trained on this data.

## What's messy in the raw data (`raw_house_data.csv`)
- Duplicate rows
- Missing values across several columns
- Inconsistent text casing (`"hyderabad"`, `"HYDERABAD "`, `"Hyderabad"`)
- Prices stored as currency-formatted strings (`"₹35.4 L"`)
- Negative/impossible values (negative square footage)
- Extreme price outliers

## What the cleaning script does (`data_cleaning.py`)
1. Removes duplicate rows
2. Standardizes text fields (city names, furnishing status)
3. Parses currency-formatted price strings back into numbers
4. Fixes impossible negative values
5. Imputes missing values using the column median
6. Caps outliers using the IQR method
7. Corrects data types (ints vs. floats)
8. Writes the result to `cleaned_house_data.csv`

## Run it
```bash
pip install pandas numpy
python3 data_cleaning.py
```

The script prints a step-by-step report to the console as it cleans the data.

## Files
| File | Purpose |
|---|---|
| `raw_house_data.csv` | Synthetic, intentionally messy source data (308 rows) |
| `data_cleaning.py` | Cleaning pipeline |
| `cleaned_house_data.csv` | Output — generated when you run the script |
| `web/` | Interactive browser version — see below |

## Live demo (`web/index.html`)

Open `web/index.html` in any browser — no install, no server, works fully offline. It's the same 8-stage pipeline as `data_cleaning.py`, ported to plain JavaScript, running on the same `raw_house_data.csv` (inlined into the page so it works over `file://`):

- **Run Next Step** to go through the 8 stages one at a time and watch the row count, log, and data preview update after each one
- **Run All Steps** to execute the whole pipeline at once
- **Reset** to start over from the raw data
- **Download Cleaned CSV** once finished, to save the result

The JS port was checked against the Python script's own output before shipping: same 308 → 300 row reduction, same 8 duplicates removed, same 3 negative-area fixes, same IQR bounds and 7 capped outliers. The two implementations agree.

## Files (web/)
| File | Purpose |
|---|---|
| `web/index.html` | Layout |
| `web/style.css` | Styling |
| `web/data.js` | The raw CSV, inlined as a JS string |
| `web/pipeline.js` | The 8 cleaning steps + CSV parsing/stats helpers — kept DOM-free so it's independently testable |
| `web/app.js` | Step controls, log rendering, table preview, CSV download |
