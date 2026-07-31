let state = {
  employees: [],
  departments: [],
  search: "",
  departmentFilter: "all",
  sort: "name-asc",
};

function formatCurrency(amount) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function loadData() {
  // DASHBOARD_DATA comes from data.js (inlined, not fetched) so this page
  // works when opened directly as a file — no local server required.
  state.employees = DASHBOARD_DATA.employees;
  state.departments = DASHBOARD_DATA.departments;
  populateDepartmentFilter();
  renderSummary();
  renderCharts();
  renderTable();
}

function populateDepartmentFilter() {
  const select = document.getElementById("departmentFilter");
  state.departments.forEach((dept) => {
    const opt = document.createElement("option");
    opt.value = dept.name;
    opt.textContent = dept.name;
    select.appendChild(opt);
  });
}

function renderSummary() {
  const { employees, departments } = state;
  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);
  const avgSalary = totalPayroll / employees.length;

  document.getElementById("totalEmployees").textContent = employees.length;
  document.getElementById("totalDepartments").textContent = departments.length;
  document.getElementById("totalPayroll").textContent = formatCurrency(totalPayroll);
  document.getElementById("avgSalary").textContent = formatCurrency(avgSalary);
}

function renderCharts() {
  const { employees, departments } = state;

  const headcountByDept = departments.map(
    (d) => employees.filter((e) => e.departmentId === d.id).length
  );
  const avgSalaryByDept = departments.map((d) => {
    const deptEmployees = employees.filter((e) => e.departmentId === d.id);
    if (deptEmployees.length === 0) return 0;
    return deptEmployees.reduce((sum, e) => sum + e.salary, 0) / deptEmployees.length;
  });
  const labels = departments.map((d) => d.name);

  new Chart(document.getElementById("headcountChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Employees",
        data: headcountByDept,
        backgroundColor: "#6c63ff",
        borderRadius: 6,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });

  new Chart(document.getElementById("salaryChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Avg Salary (₹)",
        data: avgSalaryByDept.map((v) => Math.round(v)),
        backgroundColor: "#4fd1c5",
        borderRadius: 6,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function getFilteredSortedEmployees() {
  const { employees, search, departmentFilter, sort } = state;
  let result = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.jobTitle.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === "all" || e.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const [field, direction] = sort.split("-");
  result = [...result].sort((a, b) => {
    let cmp;
    if (field === "name") cmp = a.name.localeCompare(b.name);
    else if (field === "salary") cmp = a.salary - b.salary;
    else if (field === "hireDate") cmp = new Date(a.hireDate) - new Date(b.hireDate);
    return direction === "desc" ? -cmp : cmp;
  });

  return result;
}

function renderTable() {
  const tbody = document.getElementById("employeeTableBody");
  const emptyState = document.getElementById("emptyState");
  const rows = getFilteredSortedEmployees();

  tbody.innerHTML = "";
  emptyState.hidden = rows.length > 0;

  rows.forEach((e) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.name}</td>
      <td>${e.jobTitle}</td>
      <td>${e.department}</td>
      <td>${e.location}</td>
      <td>${e.hireDate}</td>
      <td>${formatCurrency(e.salary)}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  state.search = e.target.value;
  renderTable();
});

document.getElementById("departmentFilter").addEventListener("change", (e) => {
  state.departmentFilter = e.target.value;
  renderTable();
});

document.getElementById("sortSelect").addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderTable();
});

loadData();
