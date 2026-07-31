-- ─── DEPARTMENT ──────────────────────────────────────────────────────────────

INSERT INTO departments (id, name, code) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Computer Science & Engineering', 'CSE');

-- ─── ACTIVE SEMESTER ─────────────────────────────────────────────────────────

INSERT INTO semesters (id, name, start_date, end_date, is_active) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Semester 6 — 2026', '2026-01-01', '2026-06-30', TRUE);

-- ─── SUBJECTS (Semester 6, CSE) ──────────────────────────────────────────────

INSERT INTO subjects (id, department_id, code, name, semester_number, credits) VALUES
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS601', 'Data Structures & Algorithms',  6, 4),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS602', 'Operating Systems',             6, 4),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS603', 'Database Management Systems',   6, 4),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS604', 'Computer Networks',             6, 3),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS605', 'Theory of Computation',        6, 3),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS606', 'Software Engineering',         6, 3);
