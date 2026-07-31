// Data-cleaning pipeline — a JS port of ../data_cleaning.py, kept free of
// any DOM code so it can be unit-tested directly (see the Node test suite
// used during development).

const COLUMNS = ["house_id", "city", "area_sqft", "bedrooms", "bathrooms", "age_years", "furnishing", "price_lakhs"];
const NUMERIC_COLUMNS = ["house_id", "area_sqft", "bedrooms", "bathrooms", "age_years", "price_lakhs"];

// ---------------------------------------------------------------------
// CSV parsing (the raw file has no quoted/escaped commas, so a simple
// split is safe and matches what pandas.read_csv would produce here).
// ---------------------------------------------------------------------

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = {};
    header.forEach((col, i) => {
      const raw = cells[i] ?? "";
      row[col] = raw === "" ? null : raw;
    });
    return row;
  });
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------
// Stats helpers (mirroring pandas defaults)
// ---------------------------------------------------------------------

function median(values) {
  const nums = values.filter((v) => v !== null).slice().sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
}

// Linear-interpolation quantile, matching numpy/pandas' default.
function quantile(values, q) {
  const nums = values.filter((v) => v !== null).slice().sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const pos = (nums.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return nums[base + 1] !== undefined ? nums[base] + rest * (nums[base + 1] - nums[base]) : nums[base];
}

function titleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------
// Pipeline steps — each takes (rows) and returns { rows, log[] }
// ---------------------------------------------------------------------

function stepLoad(rawCsv) {
  const rows = parseCSV(rawCsv);
  const log = [
    `Loaded ${rows.length} rows × ${COLUMNS.length} columns.`,
    `Columns: ${COLUMNS.join(", ")}`,
  ];
  return { rows, log };
}

function stepDropDuplicates(rows) {
  const seen = new Set();
  const keptRows = [];
  let removed = 0;
  rows.forEach((row) => {
    const key = COLUMNS.filter((c) => c !== "house_id")
      .map((c) => row[c])
      .join("|");
    if (seen.has(key)) {
      removed++;
    } else {
      seen.add(key);
      keptRows.push(row);
    }
  });
  return { rows: keptRows, log: [`Removed ${removed} duplicate rows.`] };
}

function stepCleanText(rows) {
  const cleaned = rows.map((row) => ({
    ...row,
    city: row.city ? titleCase(row.city.trim()) : row.city,
    furnishing: row.furnishing ? titleCase(row.furnishing.trim()) : "Unknown",
  }));
  return { rows: cleaned, log: ["Standardized city casing and furnishing labels; filled blank furnishing with 'Unknown'."] };
}

function stepParsePrice(rows) {
  const cleaned = rows.map((row) => {
    if (row.price_lakhs === null) return { ...row, price_lakhs: null };
    const digits = String(row.price_lakhs).replace(/[^\d.]/g, "");
    return { ...row, price_lakhs: digits ? parseFloat(digits) : null };
  });
  return { rows: cleaned, log: ["Parsed currency-formatted price strings (e.g. '₹35.4 L') into plain numbers."] };
}

function stepFixNegativeArea(rows) {
  let fixed = 0;
  const cleaned = rows.map((row) => {
    const area = toNumber(row.area_sqft);
    if (area !== null && area < 0) {
      fixed++;
      return { ...row, area_sqft: Math.abs(area) };
    }
    return { ...row, area_sqft: area };
  });
  return { rows: cleaned, log: [`Fixed ${fixed} negative area_sqft values (took absolute value).`] };
}

function stepHandleMissing(rows) {
  const cols = ["area_sqft", "bathrooms", "age_years", "price_lakhs"];
  const before = {};
  cols.forEach((c) => {
    before[c] = rows.filter((r) => toNumber(r[c]) === null).length;
  });

  const medians = {};
  cols.forEach((c) => {
    medians[c] = median(rows.map((r) => toNumber(r[c])));
  });

  const cleaned = rows.map((row) => {
    const updated = { ...row };
    cols.forEach((c) => {
      const val = toNumber(row[c]);
      updated[c] = val === null ? medians[c] : val;
    });
    return updated;
  });

  const log = [
    `Missing values before imputation: ${cols.map((c) => `${c}=${before[c]}`).join(", ")}`,
    `Filled with column medians: ${cols.map((c) => `${c}=${medians[c]}`).join(", ")}`,
  ];
  return { rows: cleaned, log };
}

function stepCapOutliers(rows) {
  const values = rows.map((r) => toNumber(r.price_lakhs));
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  let capped = 0;
  const cleaned = rows.map((row) => {
    const val = toNumber(row.price_lakhs);
    if (val < lower || val > upper) {
      capped++;
      return { ...row, price_lakhs: val < lower ? lower : upper };
    }
    return row;
  });

  const log = [
    `IQR bounds: [${lower.toFixed(2)}, ${upper.toFixed(2)}] lakhs`,
    `Capped ${capped} outlier rows to the IQR bounds.`,
  ];
  return { rows: cleaned, log };
}

function stepFixDtypes(rows) {
  const cleaned = rows.map((row) => ({
    house_id: Math.round(toNumber(row.house_id)),
    city: row.city,
    area_sqft: Math.round(toNumber(row.area_sqft)),
    bedrooms: Math.round(toNumber(row.bedrooms)),
    bathrooms: Math.round(toNumber(row.bathrooms)),
    age_years: Math.round(toNumber(row.age_years)),
    furnishing: row.furnishing,
    price_lakhs: Math.round(toNumber(row.price_lakhs) * 100) / 100,
  }));
  return { rows: cleaned, log: ["Rounded numeric columns to their final types (ints for counts/ages, 2dp for price)."] };
}

const PIPELINE_STEPS = [
  { id: 1, title: "Load raw data", run: (rows, raw) => stepLoad(raw) },
  { id: 2, title: "Remove duplicates", run: stepDropDuplicates },
  { id: 3, title: "Standardize text fields", run: stepCleanText },
  { id: 4, title: "Parse currency-formatted prices", run: stepParsePrice },
  { id: 5, title: "Fix negative area values", run: stepFixNegativeArea },
  { id: 6, title: "Impute missing values (median)", run: stepHandleMissing },
  { id: 7, title: "Cap outliers (IQR method)", run: stepCapOutliers },
  { id: 8, title: "Finalize column types", run: stepFixDtypes },
];

function rowsToCSV(rows) {
  const header = COLUMNS.join(",");
  const lines = rows.map((row) => COLUMNS.map((c) => row[c]).join(","));
  return [header, ...lines].join("\n") + "\n";
}
