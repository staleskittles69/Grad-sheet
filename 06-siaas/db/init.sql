-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── IDENTITY & AUTH ─────────────────────────────────────────────────────────

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('STUDENT', 'FACULTY', 'ADMIN')),
    is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(100) NOT NULL,
    code       VARCHAR(20)  NOT NULL UNIQUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── PEOPLE ──────────────────────────────────────────────────────────────────

CREATE TABLE files (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_path   VARCHAR(500) NOT NULL,
    mime_type     VARCHAR(100),
    size_bytes    BIGINT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department_id    UUID         REFERENCES departments(id) ON DELETE SET NULL,
    profile_file_id  UUID         REFERENCES files(id) ON DELETE SET NULL,
    roll_number      VARCHAR(50)  NOT NULL UNIQUE,
    full_name        VARCHAR(255) NOT NULL,
    phone            VARCHAR(20),
    semester         INT          NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section          VARCHAR(10),
    admission_year   INT          NOT NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE faculty (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID         REFERENCES departments(id) ON DELETE SET NULL,
    full_name     VARCHAR(255) NOT NULL,
    designation   VARCHAR(100),
    employee_id   VARCHAR(50)  NOT NULL UNIQUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── ACADEMICS ───────────────────────────────────────────────────────────────

CREATE TABLE semesters (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date   DATE,
    is_active  BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE subjects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id   UUID        REFERENCES departments(id) ON DELETE SET NULL,
    code            VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    semester_number INT         NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
    credits         INT         NOT NULL DEFAULT 3,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE marks (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id   UUID           NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id   UUID           NOT NULL REFERENCES subjects(id),
    semester_id  UUID           NOT NULL REFERENCES semesters(id),
    internal     DECIMAL(5,2)   NOT NULL DEFAULT 0,
    external     DECIMAL(5,2)   NOT NULL DEFAULT 0,
    lab          DECIMAL(5,2)   NOT NULL DEFAULT 0,
    assignment   DECIMAL(5,2)   NOT NULL DEFAULT 0,
    total        DECIMAL(5,2)   NOT NULL DEFAULT 0,
    grade        VARCHAR(5),
    grade_points DECIMAL(3,1),
    created_at   TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP      NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, subject_id, semester_id)
);

CREATE TABLE assignments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID           NOT NULL REFERENCES subjects(id),
    faculty_id UUID           NOT NULL REFERENCES faculty(id),
    title      VARCHAR(255)   NOT NULL,
    due_date   DATE,
    max_marks  DECIMAL(5,2)   NOT NULL DEFAULT 100,
    created_at TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE TABLE faculty_subjects (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE (faculty_id, subject_id)
);

-- ─── ATTENDANCE ──────────────────────────────────────────────────────────────

CREATE TABLE attendance (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID        NOT NULL REFERENCES subjects(id),
    marked_by  UUID        REFERENCES faculty(id) ON DELETE SET NULL,
    date       DATE        NOT NULL,
    status     VARCHAR(10) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LEAVE')),
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, subject_id, date)
);

-- ─── ANALYTICS ───────────────────────────────────────────────────────────────

CREATE TABLE risk_scores (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id    UUID      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id   UUID      NOT NULL REFERENCES semesters(id),
    score         INT       NOT NULL CHECK (score BETWEEN 0 AND 100),
    level         VARCHAR(10) NOT NULL CHECK (level IN ('LOW', 'MEDIUM', 'HIGH')),
    factors       JSONB,
    calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, semester_id)
);

CREATE TABLE recommendations (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID      REFERENCES subjects(id) ON DELETE SET NULL,
    type       VARCHAR(50) NOT NULL,
    content    TEXT      NOT NULL,
    priority   INT       NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id   UUID      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    generated_by UUID      REFERENCES users(id) ON DELETE SET NULL,
    file_id      UUID      REFERENCES files(id) ON DELETE SET NULL,
    type         VARCHAR(50) NOT NULL DEFAULT 'FULL',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── SYSTEM ──────────────────────────────────────────────────────────────────

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    message    TEXT,
    type       VARCHAR(50) NOT NULL,
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  INET,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_students_user      ON students(user_id);
CREATE INDEX idx_students_dept      ON students(department_id);
CREATE INDEX idx_faculty_user       ON faculty(user_id);
CREATE INDEX idx_facsub_faculty     ON faculty_subjects(faculty_id);
CREATE INDEX idx_facsub_subject     ON faculty_subjects(subject_id);
CREATE INDEX idx_marks_student      ON marks(student_id);
CREATE INDEX idx_marks_subject      ON marks(subject_id);
CREATE INDEX idx_marks_semester     ON marks(semester_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_subject ON attendance(subject_id);
CREATE INDEX idx_attendance_date    ON attendance(date);
CREATE INDEX idx_risk_student       ON risk_scores(student_id);
CREATE INDEX idx_notif_user         ON notifications(user_id);
CREATE INDEX idx_notif_user_read    ON notifications(user_id, is_read);
CREATE INDEX idx_audit_user         ON audit_logs(user_id);
CREATE INDEX idx_audit_entity       ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_refresh_hash       ON refresh_tokens(token_hash);
