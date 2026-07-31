# Student Management System (Dictionary-Based)

A browser-based Student Management System built with vanilla HTML, CSS, and JavaScript. Records live in a single JS object keyed by roll number — `{ rollNo: { name, age, course, marks } }` — the same dictionary-of-dictionaries shape as the original Python version, just in JS's equivalent data structure.

## Features
- Add, search, edit, and delete student records through a form + table UI
- Duplicate roll numbers are rejected with an inline error, same as the CLI version
- Data persists across page reloads via `localStorage` — no backend needed
- Live search filters by roll number or name as you type

## Key decisions

**Rebuilt from a Python CLI into a browser app — on purpose.** This started as a terminal program (still true to the assignment title, "Using a Dictionary"), but a CLI is a screenshot at best in a portfolio — nobody clones a repo and runs a Python script just to evaluate it. Moving it to the browser means the actual working app is one click away, which matters more for getting noticed than staying literally faithful to "dictionary" meaning a Python `dict` specifically.

**A JS object, not an array or a class, to keep the "dictionary" idea intact.** The assignment is explicitly about using a dictionary as the data store, so the port keeps that structure rather than switching to something more "normal" for JS (like an array of student objects). `{ rollNo: { name, age, course, marks } }` is a JS object keyed by roll number — the direct equivalent of the original Python dict, which is what makes O(1) lookup-by-roll-number and the duplicate-roll-number check both trivial.

**`localStorage` instead of a backend.** A real Student Management System would use a database, but that's a different, much bigger project. `localStorage` gets the one property that actually matters for a demo — data survives a page refresh — without requiring a server, a database, or hosting, any of which would undercut the "just open the file" goal shared across all 5 projects.

## Run it
Just open `index.html` in a browser. No build step, no dependencies, no server required.

## Files
| File | Purpose |
|---|---|
| `index.html` | Form and table markup |
| `style.css` | Styling |
| `script.js` | CRUD logic on the students object, plus UI wiring |

## Design notes
- CRUD operations (`addStudent`, `updateStudent`, `deleteStudent`, `searchStudents`) are written as small, pure-ish functions that take and return the `students` object — kept separate from the DOM code so they're independently testable, not tangled into click handlers.
- The roll number field locks during an edit so it can't be changed out from under an existing record — updating a key in place isn't really "updating," it's delete-and-recreate, so this avoids that footgun.
- Verified end-to-end in a headless DOM (jsdom): add, reject-duplicate, search, edit, and delete all covered before shipping.
