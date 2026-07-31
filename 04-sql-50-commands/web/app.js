// Wires the QUERIES / SCHEMA_SQL / SEED_SQL data (from data.js) to an
// in-browser SQLite database via sql.js, and renders a query picker +
// editable SQL editor + results table.

let SQL = null;
let db = null;
let activeQueryId = null;

const sidebarEl = document.getElementById("sidebar");
const editorEl = document.getElementById("sqlEditor");
const activeLabelEl = document.getElementById("activeQueryLabel");
const statusLineEl = document.getElementById("statusLine");
const resultsEl = document.getElementById("resultsContainer");
const loadStatusEl = document.getElementById("loadStatus");
const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");

function isWriteQuery(sql) {
  return /^\s*(UPDATE|DELETE|INSERT)\b/i.test(sql);
}

function initDatabase() {
  db = new SQL.Database();
  db.run(SCHEMA_SQL);
  db.run(SEED_SQL);
}

function renderSidebar() {
  sidebarEl.innerHTML = "";
  const sections = [];
  const bySection = new Map();
  QUERIES.forEach((q) => {
    if (!bySection.has(q.section)) {
      bySection.set(q.section, []);
      sections.push(q.section);
    }
    bySection.get(q.section).push(q);
  });

  sections.forEach((section) => {
    const heading = document.createElement("div");
    heading.className = "sidebar-section-title";
    heading.textContent = section;
    sidebarEl.appendChild(heading);

    bySection.get(section).forEach((q) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "query-item" + (isWriteQuery(q.sql) ? " write-op" : "");
      btn.dataset.id = q.id;
      btn.innerHTML = `<span class="q-num">${q.id}.</span>${q.title}`;
      btn.addEventListener("click", () => selectQuery(q.id));
      sidebarEl.appendChild(btn);
    });
  });
}

function selectQuery(id) {
  const q = QUERIES.find((item) => item.id === id);
  if (!q) return;
  activeQueryId = id;
  editorEl.value = q.sql;
  activeLabelEl.textContent = `${id}. ${q.title}`;

  document.querySelectorAll(".query-item").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.id) === id);
  });

  runCurrentQuery();
}

function formatCell(value) {
  if (value === null || value === undefined) return '<span style="color:#b0b3c6">NULL</span>';
  return String(value);
}

function renderResults(res) {
  resultsEl.innerHTML = "";
  if (!res.length) {
    resultsEl.innerHTML = '<p style="color:#8a8fa3; font-size:13px;">Query ran successfully — no rows returned.</p>';
    return;
  }

  const { columns, values } = res[0];
  const table = document.createElement("table");
  table.className = "results-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  values.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = row.map((cell) => `<td>${formatCell(cell)}</td>`).join("");
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  resultsEl.appendChild(table);
}

function runCurrentQuery() {
  const sql = editorEl.value.trim();
  if (!sql) return;

  try {
    const res = db.exec(sql);

    if (isWriteQuery(sql)) {
      const affected = db.getRowsModified();
      statusLineEl.className = "status-line success";
      statusLineEl.textContent = `Query OK — ${affected} row(s) affected.`;
      resultsEl.innerHTML = "";
    } else {
      const rowCount = res.length ? res[0].values.length : 0;
      statusLineEl.className = "status-line success";
      statusLineEl.textContent = `Query OK — ${rowCount} row(s) returned.`;
      renderResults(res);
    }
  } catch (err) {
    statusLineEl.className = "status-line error";
    statusLineEl.textContent = `Error: ${err.message}`;
    resultsEl.innerHTML = "";
  }
}

function resetDatabase() {
  initDatabase();
  statusLineEl.className = "status-line success";
  statusLineEl.textContent = "Database reset to the original 8 departments / 30 employees.";
  resultsEl.innerHTML = "";
}

runBtn.addEventListener("click", runCurrentQuery);
resetBtn.addEventListener("click", resetDatabase);
editorEl.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    runCurrentQuery();
  }
});

initSqlJs({ locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}` })
  .then((sqlModule) => {
    SQL = sqlModule;
    initDatabase();
    renderSidebar();
    loadStatusEl.textContent = "";
    selectQuery(1);
  })
  .catch((err) => {
    loadStatusEl.textContent = `Failed to load the SQLite engine: ${err.message}. This demo needs an internet connection on first load to fetch sql.js from cdnjs.`;
    loadStatusEl.style.color = "#d64545";
  });
