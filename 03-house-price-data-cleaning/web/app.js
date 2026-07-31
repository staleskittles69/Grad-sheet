// DOM wiring for the data-cleaning pipeline defined in pipeline.js.

let currentRows = null;
let currentStepIndex = 0; // number of steps completed so far

const stepsListEl = document.getElementById("stepsList");
const stepBtn = document.getElementById("stepBtn");
const runAllBtn = document.getElementById("runAllBtn");
const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");
const logOutputEl = document.getElementById("logOutput");
const tableTitleEl = document.getElementById("tableTitle");
const tableMetaEl = document.getElementById("tableMeta");
const tableHeadEl = document.getElementById("dataTableHead");
const tableBodyEl = document.getElementById("dataTableBody");

function renderSteps() {
  stepsListEl.innerHTML = "";
  PIPELINE_STEPS.forEach((step, i) => {
    const div = document.createElement("div");
    const done = i < currentStepIndex;
    const active = i === currentStepIndex;
    div.className = "step" + (done ? " done" : "") + (active ? " active" : "");
    div.innerHTML = `<span class="step-marker">${done ? "✓" : step.id}</span><span>${step.title}</span>`;
    stepsListEl.appendChild(div);
  });
}

function appendLog(lines) {
  lines.forEach((line) => {
    logOutputEl.textContent += line + "\n";
  });
  logOutputEl.scrollTop = logOutputEl.scrollHeight;
}

function renderTable(rows, title) {
  tableTitleEl.textContent = title;
  tableMetaEl.textContent = `${rows.length} rows`;

  const cols = rows.length ? Object.keys(rows[0]) : COLUMNS;
  tableHeadEl.innerHTML = `<tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>`;

  tableBodyEl.innerHTML = "";
  rows.slice(0, 12).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = cols
      .map((c) => {
        const val = row[c];
        return `<td>${val === null || val === undefined ? '<span class="null">NULL</span>' : val}</td>`;
      })
      .join("");
    tableBodyEl.appendChild(tr);
  });
}

function runNextStep() {
  if (currentStepIndex >= PIPELINE_STEPS.length) return;

  const step = PIPELINE_STEPS[currentStepIndex];
  const result = step.run(currentRows, RAW_CSV);
  currentRows = result.rows;
  currentStepIndex++;

  appendLog([`▶ Step ${step.id}: ${step.title}`, ...result.log.map((l) => `   ${l}`), ""]);

  const title = currentStepIndex === PIPELINE_STEPS.length ? "Cleaned Data (final)" : `After step ${currentStepIndex}: ${step.title}`;
  renderTable(currentRows, title);
  renderSteps();

  const finished = currentStepIndex === PIPELINE_STEPS.length;
  stepBtn.disabled = finished;
  runAllBtn.disabled = finished;
  downloadBtn.disabled = !finished;
}

function runAllSteps() {
  while (currentStepIndex < PIPELINE_STEPS.length) {
    runNextStep();
  }
}

function resetPipeline() {
  currentRows = null;
  currentStepIndex = 0;
  logOutputEl.textContent = "";
  renderSteps();
  renderTable(parseCSV(RAW_CSV), "Raw Data");
  stepBtn.disabled = false;
  runAllBtn.disabled = false;
  downloadBtn.disabled = true;
}

function downloadCleanedCSV() {
  const csv = rowsToCSV(currentRows);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cleaned_house_data.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

stepBtn.addEventListener("click", runNextStep);
runAllBtn.addEventListener("click", runAllSteps);
resetBtn.addEventListener("click", resetPipeline);
downloadBtn.addEventListener("click", downloadCleanedCSV);

resetPipeline();
