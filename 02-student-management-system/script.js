// Student Management System — client-side version.
//
// The Python original stored records in a dictionary keyed by roll number:
//   students = { roll_no: { name, age, course, marks } }
// This does the same thing with a plain JS object, which is JS's closest
// equivalent to a Python dict. Data is persisted to localStorage so it
// survives a page refresh, the same way the Python version persisted to
// students.json between runs.

const STORAGE_KEY = "students";

function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// ---------------------------------------------------------------------
// Core CRUD operations on the students dictionary — kept separate from
// the DOM so they can be unit-tested directly.
// ---------------------------------------------------------------------

function addStudent(students, rollNo, data) {
  if (students[rollNo]) {
    throw new Error(`A student with roll number ${rollNo} already exists.`);
  }
  students[rollNo] = { ...data };
  return students;
}

function updateStudent(students, rollNo, data) {
  if (!students[rollNo]) {
    throw new Error(`No student found with roll number ${rollNo}.`);
  }
  students[rollNo] = { ...data };
  return students;
}

function deleteStudent(students, rollNo) {
  if (!students[rollNo]) {
    throw new Error(`No student found with roll number ${rollNo}.`);
  }
  delete students[rollNo];
  return students;
}

function searchStudents(students, query) {
  const q = query.trim().toLowerCase();
  if (!q) return Object.entries(students);
  return Object.entries(students).filter(
    ([rollNo, info]) =>
      rollNo.toLowerCase().includes(q) || info.name.toLowerCase().includes(q)
  );
}

// ---------------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------------

let students = loadStudents();
let editingRollNo = null; // null => "add" mode, otherwise "edit" mode

const form = document.getElementById("studentForm");
const rollNoInput = document.getElementById("rollNo");
const nameInput = document.getElementById("name");
const ageInput = document.getElementById("age");
const courseInput = document.getElementById("course");
const marksInput = document.getElementById("marks");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formError = document.getElementById("formError");
const searchInput = document.getElementById("searchInput");
const tableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const studentCount = document.getElementById("studentCount");

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearError() {
  formError.textContent = "";
  formError.hidden = true;
}

function resetForm() {
  form.reset();
  editingRollNo = null;
  rollNoInput.disabled = false;
  formTitle.textContent = "Add Student";
  submitBtn.textContent = "Add Student";
  cancelBtn.hidden = true;
  clearError();
}

function enterEditMode(rollNo) {
  const info = students[rollNo];
  if (!info) return;
  editingRollNo = rollNo;
  rollNoInput.value = rollNo;
  rollNoInput.disabled = true;
  nameInput.value = info.name;
  ageInput.value = info.age;
  courseInput.value = info.course;
  marksInput.value = info.marks;
  formTitle.textContent = `Edit Student — Roll No. ${rollNo}`;
  submitBtn.textContent = "Save Changes";
  cancelBtn.hidden = false;
  clearError();
  rollNoInput.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

function renderTable() {
  const query = searchInput.value;
  const entries = searchStudents(students, query).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true })
  );

  tableBody.innerHTML = "";
  emptyState.hidden = entries.length > 0;
  studentCount.textContent = Object.keys(students).length;

  entries.forEach(([rollNo, info]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${rollNo}</td>
      <td>${info.name}</td>
      <td>${info.age}</td>
      <td>${info.course}</td>
      <td>${info.marks}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="edit-btn" data-roll="${rollNo}">Edit</button>
          <button type="button" class="delete-btn" data-roll="${rollNo}">Delete</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  clearError();

  const rollNo = rollNoInput.value.trim();
  const data = {
    name: nameInput.value.trim(),
    age: ageInput.value,
    course: courseInput.value.trim(),
    marks: marksInput.value,
  };

  try {
    if (editingRollNo) {
      updateStudent(students, editingRollNo, data);
    } else {
      addStudent(students, rollNo, data);
    }
    saveStudents(students);
    resetForm();
    renderTable();
  } catch (err) {
    showError(err.message);
  }
});

cancelBtn.addEventListener("click", resetForm);

tableBody.addEventListener("click", (e) => {
  const target = e.target;
  const rollNo = target.dataset.roll;
  if (!rollNo) return;

  if (target.classList.contains("edit-btn")) {
    enterEditMode(rollNo);
  } else if (target.classList.contains("delete-btn")) {
    if (confirm(`Delete student ${students[rollNo]?.name ?? rollNo} (roll ${rollNo})?`)) {
      deleteStudent(students, rollNo);
      saveStudents(students);
      if (editingRollNo === rollNo) resetForm();
      renderTable();
    }
  }
});

searchInput.addEventListener("input", renderTable);

renderTable();
