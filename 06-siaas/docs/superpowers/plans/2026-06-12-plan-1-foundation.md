# SIAAS Plan 1 — Foundation & Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the complete monorepo, wire up all Docker services (Nginx, Spring Boot, PostgreSQL, Redis, React), create the full database schema with seed data, and verify the entire stack starts with one command.

**Architecture:** Monorepo with `/frontend`, `/backend`, `/db`, `/docker` folders. Docker Compose orchestrates 5 services with health checks and proper startup order. Spring Boot serves a health endpoint; React shows a placeholder page. All subsequent plans build on top of this foundation.

**Tech Stack:** Docker Compose, PostgreSQL 15, Redis 7, Spring Boot 3.2 (Java 17, Maven), React 18 (Vite, TypeScript), Nginx, Tailwind CSS, ShadCN UI

---

## File Map

| File | Responsibility |
|---|---|
| `docker-compose.yml` | Orchestrates all 5 services with health checks |
| `.env.example` | All environment variable definitions |
| `docker/nginx.conf` | Reverse proxy: routes `/api/*` → backend, `/*` → frontend |
| `db/init.sql` | Full PostgreSQL schema — 18 tables, indexes, constraints |
| `db/seed.sql` | Reference data: 1 department, 6 subjects, 1 semester |
| `backend/pom.xml` | All Maven dependencies for the full project |
| `backend/Dockerfile` | Multi-stage Maven build → JRE Alpine image |
| `backend/src/main/resources/application.yml` | DB, Redis, JWT, Swagger config |
| `backend/src/main/java/com/siaas/SiaasApplication.java` | Spring Boot entry point |
| `backend/src/main/java/com/siaas/common/ApiResponse.java` | Standard response wrapper used by all controllers |
| `backend/src/main/java/com/siaas/config/DataInitializer.java` | Seeds demo accounts on startup using BCrypt |
| `backend/src/main/java/com/siaas/health/HealthController.java` | `GET /api/v1/health` — smoke test endpoint |
| `frontend/package.json` | React + Vite + all frontend dependencies |
| `frontend/vite.config.ts` | Vite config with API proxy |
| `frontend/tailwind.config.ts` | Tailwind + glassmorphism theme tokens |
| `frontend/src/main.tsx` | React entry point |
| `frontend/src/App.tsx` | Root component with placeholder page |
| `frontend/Dockerfile` | Node dev server container |

---

## Task 1: Create monorepo directory structure

**Files:** directories only

- [ ] **Step 1: Create the folder tree**

Run from wherever you want to keep the project (e.g. your Desktop):

```powershell
mkdir siaas
cd siaas
mkdir frontend, backend, db, docker, docs
mkdir docs\superpowers\plans
mkdir docker\nginx
```

- [ ] **Step 2: Initialise git**

```powershell
git init
```

- [ ] **Step 3: Create .gitignore**

Create `siaas/.gitignore`:

```
# Environment
.env

# Java
backend/target/
backend/.mvn/
*.class

# Node
frontend/node_modules/
frontend/dist/
frontend/.vite/

# Uploads
uploads/

# Superpowers
.superpowers/

# IDE
.idea/
*.iml
.vscode/
```

- [ ] **Step 4: Commit**

```powershell
git add .gitignore
git commit -m "chore: init monorepo"
```

---

## Task 2: Environment configuration

**Files:**
- Create: `.env.example`
- Create: `.env` (copy of .env.example — never committed)

- [ ] **Step 1: Create `.env.example`**

```env
# PostgreSQL
POSTGRES_DB=siaas
POSTGRES_USER=siaas_user
POSTGRES_PASSWORD=siaas_pass_dev

# Spring Boot datasource (uses Docker service name 'postgres' as host)
DB_URL=jdbc:postgresql://postgres:5432/siaas
DB_USERNAME=siaas_user
DB_PASSWORD=siaas_pass_dev

# Redis (uses Docker service name 'redis' as host)
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=siaas-super-secret-key-minimum-32-chars-long-change-in-prod
JWT_EXPIRY_MS=900000
REFRESH_TOKEN_DAYS=7

# CORS — add your Vercel URL here when deploying
CORS_ORIGINS=http://localhost:5173,http://localhost:80

# File upload
UPLOAD_DIR=/app/uploads
```

- [ ] **Step 2: Copy to `.env` for local dev**

```powershell
Copy-Item .env.example .env
```

- [ ] **Step 3: Commit .env.example only**

```powershell
git add .env.example
git commit -m "chore: add env config template"
```

---

## Task 3: Docker Compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
version: "3.9"

services:

  postgres:
    image: postgres:15-alpine
    env_file: .env
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./db/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - siaas-net

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - siaas-net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    env_file: .env
    environment:
      SPRING_DATASOURCE_URL: ${DB_URL}
      SPRING_DATASOURCE_USERNAME: ${DB_USERNAME}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_DATA_REDIS_HOST: ${REDIS_HOST}
      SPRING_DATA_REDIS_PORT: ${REDIS_PORT}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRY_MS: ${JWT_EXPIRY_MS}
      REFRESH_TOKEN_DAYS: ${REFRESH_TOKEN_DAYS}
      CORS_ORIGINS: ${CORS_ORIGINS}
      UPLOAD_DIR: ${UPLOAD_DIR}
    volumes:
      - uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - siaas-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      VITE_API_URL: http://localhost/api/v1
    networks:
      - siaas-net

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
      - frontend
    networks:
      - siaas-net

volumes:
  pgdata:
  uploads:

networks:
  siaas-net:
    driver: bridge
```

- [ ] **Step 2: Commit**

```powershell
git add docker-compose.yml
git commit -m "chore: add docker-compose with all services"
```

---

## Task 4: Nginx configuration

**Files:**
- Create: `docker/nginx.conf`

- [ ] **Step 1: Create `docker/nginx.conf`**

```nginx
upstream backend {
    server backend:8080;
}

upstream frontend {
    server frontend:5173;
}

server {
    listen 80;
    server_name localhost;

    client_max_body_size 20M;

    # API requests → Spring Boot
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger UI → Spring Boot
    location /swagger-ui/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
    location /v3/api-docs {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }

    # Everything else → React Vite dev server
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_http_version 1.1;
    }
}
```

- [ ] **Step 2: Commit**

```powershell
git add docker/nginx.conf
git commit -m "chore: add nginx reverse proxy config"
```

---

## Task 5: PostgreSQL schema

**Files:**
- Create: `db/init.sql`

- [ ] **Step 1: Create `db/init.sql`**

```sql
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
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id  UUID           NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id  UUID           NOT NULL REFERENCES subjects(id),
    semester_id UUID           NOT NULL REFERENCES semesters(id),
    internal    DECIMAL(5,2)   NOT NULL DEFAULT 0,
    external    DECIMAL(5,2)   NOT NULL DEFAULT 0,
    lab         DECIMAL(5,2)   NOT NULL DEFAULT 0,
    assignment  DECIMAL(5,2)   NOT NULL DEFAULT 0,
    total       DECIMAL(5,2)   NOT NULL DEFAULT 0,
    grade       VARCHAR(5),
    grade_points DECIMAL(3,1),
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT NOW(),
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
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id   UUID      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id  UUID      NOT NULL REFERENCES semesters(id),
    score        INT       NOT NULL CHECK (score BETWEEN 0 AND 100),
    level        VARCHAR(10) NOT NULL CHECK (level IN ('LOW', 'MEDIUM', 'HIGH')),
    factors      JSONB,
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

CREATE INDEX idx_students_user        ON students(user_id);
CREATE INDEX idx_students_dept        ON students(department_id);
CREATE INDEX idx_faculty_user         ON faculty(user_id);
CREATE INDEX idx_marks_student        ON marks(student_id);
CREATE INDEX idx_marks_subject        ON marks(subject_id);
CREATE INDEX idx_marks_semester       ON marks(semester_id);
CREATE INDEX idx_attendance_student   ON attendance(student_id);
CREATE INDEX idx_attendance_subject   ON attendance(subject_id);
CREATE INDEX idx_attendance_date      ON attendance(date);
CREATE INDEX idx_risk_student         ON risk_scores(student_id);
CREATE INDEX idx_notif_user           ON notifications(user_id);
CREATE INDEX idx_notif_user_read      ON notifications(user_id, is_read);
CREATE INDEX idx_audit_user           ON audit_logs(user_id);
CREATE INDEX idx_audit_entity         ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_refresh_hash         ON refresh_tokens(token_hash);
```

- [ ] **Step 2: Commit**

```powershell
git add db/init.sql
git commit -m "feat: add complete postgresql schema (18 tables)"
```

---

## Task 6: Seed reference data

**Files:**
- Create: `db/seed.sql`

> Note: Demo user accounts (admin, faculty, student) are NOT seeded here. They are seeded by `DataInitializer.java` (Task 9) using BCrypt so passwords are properly hashed. This file only seeds static reference data.

- [ ] **Step 1: Create `db/seed.sql`**

```sql
-- ─── DEPARTMENT ──────────────────────────────────────────────────────────────

INSERT INTO departments (id, name, code) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Computer Science & Engineering', 'CSE');

-- ─── ACTIVE SEMESTER ─────────────────────────────────────────────────────────

INSERT INTO semesters (id, name, start_date, end_date, is_active) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Semester 6 — 2026', '2026-01-01', '2026-06-30', TRUE);

-- ─── SUBJECTS (Semester 6, CSE) ──────────────────────────────────────────────

INSERT INTO subjects (id, department_id, code, name, semester_number, credits) VALUES
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS601', 'Data Structures & Algorithms',   6, 4),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS602', 'Operating Systems',              6, 4),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS603', 'Database Management Systems',    6, 4),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS604', 'Computer Networks',              6, 3),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS605', 'Theory of Computation',         6, 3),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CS606', 'Software Engineering',          6, 3);
```

- [ ] **Step 2: Commit**

```powershell
git add db/seed.sql
git commit -m "feat: add reference seed data (dept, semester, subjects)"
```

---

## Task 7: Spring Boot project — pom.xml

**Files:**
- Create: `backend/pom.xml`

- [ ] **Step 1: Create `backend/pom.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.4</version>
        <relativePath/>
    </parent>

    <groupId>com.siaas</groupId>
    <artifactId>siaas-backend</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>SIAAS Backend</name>

    <properties>
        <java.version>17</java.version>
        <mapstruct.version>1.5.5.Final</mapstruct.version>
        <lombok.version>1.18.30</lombok.version>
        <jjwt.version>0.12.3</jjwt.version>
        <springdoc.version>2.3.0</springdoc.version>
        <itext.version>8.0.3</itext.version>
    </properties>

    <dependencies>
        <!-- Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <!-- AOP (for audit logging) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>

        <!-- PostgreSQL driver -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>${lombok.version}</version>
            <optional>true</optional>
        </dependency>

        <!-- MapStruct -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${mapstruct.version}</version>
        </dependency>

        <!-- Swagger / OpenAPI -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>${springdoc.version}</version>
        </dependency>

        <!-- iText PDF -->
        <dependency>
            <groupId>com.itextpdf</groupId>
            <artifactId>itext7-core</artifactId>
            <version>${itext.version}</version>
            <type>pom</type>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>${lombok.version}</version>
                        </path>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${mapstruct.version}</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: Commit**

```powershell
git add backend/pom.xml
git commit -m "chore: add spring boot pom with all dependencies"
```

---

## Task 8: Spring Boot configuration + entry point

**Files:**
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/siaas/SiaasApplication.java`
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create directory structure**

```powershell
New-Item -ItemType Directory -Force backend\src\main\java\com\siaas
New-Item -ItemType Directory -Force backend\src\main\resources
New-Item -ItemType Directory -Force backend\src\test\java\com\siaas
```

- [ ] **Step 2: Create `backend/src/main/resources/application.yml`**

```yaml
spring:
  application:
    name: siaas-backend

  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

  data:
    redis:
      host: ${SPRING_DATA_REDIS_HOST}
      port: ${SPRING_DATA_REDIS_PORT}

  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

server:
  port: 8080
  servlet:
    context-path: /

jwt:
  secret: ${JWT_SECRET}
  expiry-ms: ${JWT_EXPIRY_MS}
  refresh-token-days: ${REFRESH_TOKEN_DAYS}

app:
  cors-origins: ${CORS_ORIGINS}
  upload-dir: ${UPLOAD_DIR:/app/uploads}

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: alpha

logging:
  level:
    com.siaas: DEBUG
    org.springframework.security: INFO
```

- [ ] **Step 3: Create `backend/src/main/java/com/siaas/SiaasApplication.java`**

```java
package com.siaas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SiaasApplication {
    public static void main(String[] args) {
        SpringApplication.run(SiaasApplication.class, args);
    }
}
```

- [ ] **Step 4: Create `backend/Dockerfile`**

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies first (only re-downloads when pom.xml changes)
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# Build the jar
COPY src ./src
RUN mvn package -DskipTests -B -q

# ── Stage 2: Run ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN mkdir -p /app/uploads

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
```

- [ ] **Step 5: Commit**

```powershell
git add backend/
git commit -m "chore: spring boot skeleton with config and dockerfile"
```

---

## Task 9: Common types (ApiResponse)

**Files:**
- Create: `backend/src/main/java/com/siaas/common/ApiResponse.java`
- Create: `backend/src/main/java/com/siaas/common/PagedResponse.java`

- [ ] **Step 1: Create `ApiResponse.java`**

```java
package com.siaas.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.Instant;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final String message;
    private final T data;
    private final String error;
    private final Instant timestamp = Instant.now();

    private ApiResponse(boolean success, String message, T data, String error) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "OK", data, null);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data, null);
    }

    public static <T> ApiResponse<T> error(String error) {
        return new ApiResponse<>(false, null, null, error);
    }
}
```

- [ ] **Step 2: Create `PagedResponse.java`**

```java
package com.siaas.common;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@Builder
public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static <T> PagedResponse<T> from(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
```

- [ ] **Step 3: Create `GlobalExceptionHandler.java`**

```java
package com.siaas.common;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ApiResponse.error(message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid credentials"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Access denied"));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred"));
    }
}
```

- [ ] **Step 4: Create `ResourceNotFoundException.java`**

```java
package com.siaas.common;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
    public ResourceNotFoundException(String resource, String id) {
        super(resource + " not found with id: " + id);
    }
}
```

- [ ] **Step 5: Create `ConflictException.java`**

```java
package com.siaas.common;

public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
```

- [ ] **Step 6: Commit**

```powershell
git add backend/src/main/java/com/siaas/common/
git commit -m "feat: add ApiResponse wrapper and global exception handler"
```

---

## Task 10: Health endpoint

**Files:**
- Create: `backend/src/main/java/com/siaas/health/HealthController.java`
- Create: `backend/src/test/java/com/siaas/health/HealthControllerTest.java`

- [ ] **Step 1: Write the failing test first**

Create `backend/src/test/java/com/siaas/health/HealthControllerTest.java`:

```java
package com.siaas.health;

import com.siaas.common.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HealthController.class)
class HealthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    @WithMockUser
    void healthEndpointReturnsOk() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }
}
```

- [ ] **Step 2: Run test — expect FAIL (HealthController doesn't exist yet)**

```powershell
cd backend
mvn test -pl . -Dtest=HealthControllerTest -q
```

Expected: compilation error or test failure.

- [ ] **Step 3: Create `HealthController.java`**

```java
package com.siaas.health;

import com.siaas.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<Map<String, String>> health() {
        return ApiResponse.ok(Map.of(
                "status", "UP",
                "service", "SIAAS Backend"
        ));
    }
}
```

- [ ] **Step 4: Run test — expect PASS**

```powershell
mvn test -Dtest=HealthControllerTest -q
```

Expected output: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```powershell
git add backend/src/
git commit -m "feat: add health check endpoint with test"
```

---

## Task 11: Demo account seeder (DataInitializer)

**Files:**
- Create: `backend/src/main/java/com/siaas/config/DataInitializer.java`

> This seeds the 3 demo accounts (Admin, Faculty, Student) plus mock marks and attendance for the student. It runs on startup and skips if data already exists.

- [ ] **Step 1: Create directory**

```powershell
New-Item -ItemType Directory -Force backend\src\main\java\com\siaas\config
```

- [ ] **Step 2: Create `DataInitializer.java`**

```java
package com.siaas.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder passwordEncoder;

    // Fixed UUIDs so data is deterministic across restarts
    private static final String DEPT_ID     = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    private static final String SEM_ID      = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
    private static final String SUBJ_DSA    = "c3d4e5f6-a7b8-9012-cdef-123456789012";
    private static final String SUBJ_OS     = "d4e5f6a7-b8c9-0123-defa-234567890123";
    private static final String SUBJ_DBMS   = "e5f6a7b8-c9d0-1234-efab-345678901234";
    private static final String SUBJ_CN     = "f6a7b8c9-d0e1-2345-fabc-456789012345";
    private static final String SUBJ_TOC    = "a7b8c9d0-e1f2-3456-abcd-567890123456";
    private static final String SUBJ_SE     = "b8c9d0e1-f2a3-4567-bcde-678901234567";

    @Override
    @Transactional
    public void run(String... args) {
        if (alreadySeeded()) {
            log.info("Demo data already seeded — skipping.");
            return;
        }

        log.info("Seeding demo accounts and mock data...");

        String adminId   = seedUser("admin@siaas.dev",   "Admin@123",   "ADMIN");
        String facultyId = seedUser("faculty@siaas.dev", "Faculty@123", "FACULTY");
        String studentId = seedUser("student@siaas.dev", "Student@123", "STUDENT");

        String facultyProfileId = seedFaculty(facultyId, "Dr. Priya Sharma", "FAC001");
        String studentProfileId = seedStudent(studentId, "Rahul Singh", "CS21B001");

        seedMarks(studentProfileId);
        seedAttendance(studentProfileId, facultyProfileId);

        log.info("Demo data seeded successfully.");
        log.info("  admin@siaas.dev   / Admin@123");
        log.info("  faculty@siaas.dev / Faculty@123");
        log.info("  student@siaas.dev / Student@123");
    }

    private boolean alreadySeeded() {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = 'admin@siaas.dev'", Integer.class);
        return count != null && count > 0;
    }

    private String seedUser(String email, String password, String role) {
        String id = UUID.randomUUID().toString();
        String hash = passwordEncoder.encode(password);
        jdbc.update(
                "INSERT INTO users (id, email, password_hash, role, is_verified) VALUES (?::uuid, ?, ?, ?, true)",
                id, email, hash, role);
        return id;
    }

    private String seedFaculty(String userId, String name, String employeeId) {
        String id = UUID.randomUUID().toString();
        jdbc.update(
                "INSERT INTO faculty (id, user_id, department_id, full_name, designation, employee_id) " +
                "VALUES (?::uuid, ?::uuid, ?::uuid, ?, ?, ?)",
                id, userId, DEPT_ID, name, "Assistant Professor", employeeId);
        return id;
    }

    private String seedStudent(String userId, String name, String rollNumber) {
        String id = UUID.randomUUID().toString();
        jdbc.update(
                "INSERT INTO students (id, user_id, department_id, roll_number, full_name, semester, section, admission_year) " +
                "VALUES (?::uuid, ?::uuid, ?::uuid, ?, ?, 6, 'B', 2021)",
                id, userId, DEPT_ID, rollNumber, name);
        return id;
    }

    private void seedMarks(String studentId) {
        // subject_id, internal, external, lab, assignment, total, grade, grade_points
        Object[][] subjectMarks = {
            {SUBJ_DSA,  22, 58,  7,  4, 91, "O",  10.0},
            {SUBJ_OS,   20, 42,  5,  5, 72, "B+",  7.0},
            {SUBJ_DBMS, 14, 33,  8,  7, 62, "C",   5.0},
            {SUBJ_CN,   21, 52,  7,  5, 85, "A+",  9.0},
            {SUBJ_TOC,  16, 38,  6,  5, 65, "C",   5.0},
            {SUBJ_SE,   19, 46,  7,  6, 78, "B+",  7.0}
        };
        for (Object[] m : subjectMarks) {
            jdbc.update(
                "INSERT INTO marks (id, student_id, subject_id, semester_id, internal, external, lab, assignment, total, grade, grade_points) " +
                "VALUES (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID().toString(), studentId, m[0], SEM_ID,
                m[1], m[2], m[3], m[4], m[5], m[6], m[7]);
        }
    }

    private void seedAttendance(String studentId, String facultyId) {
        // subject_id → (present, absent) counts to generate
        Object[][] attendanceCounts = {
            {SUBJ_DSA,  24, 2},   // 92%
            {SUBJ_OS,   22, 4},   // 85%
            {SUBJ_DBMS, 16, 10},  // 62%
            {SUBJ_CN,   21, 5},   // 81%
            {SUBJ_TOC,  18, 8},   // 69%
            {SUBJ_SE,   20, 6}    // 77%
        };
        LocalDate startDate = LocalDate.of(2026, 1, 6);
        for (Object[] a : attendanceCounts) {
            String subjectId = (String) a[0];
            int present = (int) a[1];
            int absent  = (int) a[2];
            LocalDate date = startDate;
            for (int i = 0; i < present; i++) {
                date = nextWeekday(date);
                jdbc.update(
                    "INSERT INTO attendance (id, student_id, subject_id, marked_by, date, status) " +
                    "VALUES (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, 'PRESENT') " +
                    "ON CONFLICT DO NOTHING",
                    UUID.randomUUID().toString(), studentId, subjectId, facultyId, date);
                date = date.plusDays(1);
            }
            for (int i = 0; i < absent; i++) {
                date = nextWeekday(date);
                jdbc.update(
                    "INSERT INTO attendance (id, student_id, subject_id, marked_by, date, status) " +
                    "VALUES (?::uuid, ?::uuid, ?::uuid, ?::uuid, ?, 'ABSENT') " +
                    "ON CONFLICT DO NOTHING",
                    UUID.randomUUID().toString(), studentId, subjectId, facultyId, date);
                date = date.plusDays(1);
            }
        }
    }

    private LocalDate nextWeekday(LocalDate date) {
        while (date.getDayOfWeek().getValue() > 5) {
            date = date.plusDays(1);
        }
        return date;
    }
}
```

- [ ] **Step 3: Register BCryptPasswordEncoder as a bean**

Create `backend/src/main/java/com/siaas/config/AppConfig.java`:

```java
package com.siaas.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class AppConfig {

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

- [ ] **Step 4: Add a minimal SecurityConfig so the app starts without auth blocking health**

Create `backend/src/main/java/com/siaas/security/SecurityConfig.java`:

```java
package com.siaas.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/health", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

> Note: This is a placeholder SecurityConfig. Plan 2 (Auth) will replace it with the full JWT filter chain.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/
git commit -m "feat: add data initializer, BCrypt bean, placeholder security config"
```

---

## Task 12: React + Vite frontend skeleton

**Files:**
- Create: `frontend/package.json` and all Vite scaffold files
- Create: `frontend/Dockerfile`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: Scaffold Vite React TypeScript project**

```powershell
cd frontend
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?" — choose **Yes**.

- [ ] **Step 2: Install all frontend dependencies**

```powershell
npm install
npm install zustand @tanstack/react-query react-router-dom framer-motion recharts axios lucide-react
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
```

- [ ] **Step 3: Install ShadCN UI**

```powershell
npx shadcn@latest init
```

When prompted:
- Which style? → **Default**
- Which color? → **Violet**
- Use CSS variables? → **Yes**

- [ ] **Step 4: Update `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 5: Update `frontend/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Glassmorphism palette
        'glass-bg':     'rgba(255,255,255,0.05)',
        'glass-border': 'rgba(255,255,255,0.10)',
        'purple-glow':  '#a78bfa',
        'blue-glow':    '#60a5fa',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        'card-gradient': 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.1))',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

```powershell
npm install -D tailwindcss-animate
```

- [ ] **Step 6: Update `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 6%;
    --foreground: 210 40% 96%;
    --card: 222 47% 8%;
    --card-foreground: 210 40% 96%;
    --primary: 263 70% 75%;
    --primary-foreground: 222 47% 6%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 263 70% 75%;
    --radius: 0.75rem;
  }
}

body {
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  min-height: 100vh;
  color: hsl(var(--foreground));
  font-family: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 7: Replace `frontend/src/App.tsx` with a placeholder**

```tsx
function App() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          SIAAS
        </h1>
        <p className="text-slate-400 mt-2 text-sm">Student Intelligence & Academic Analytics System</p>
        <p className="text-slate-500 mt-4 text-xs">Foundation running ✓</p>
      </div>
    </div>
  )
}

export default App
```

- [ ] **Step 8: Update `frontend/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 9: Create `frontend/Dockerfile`**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

- [ ] **Step 10: Commit**

```powershell
cd ..
git add frontend/
git commit -m "feat: react vite typescript frontend with tailwind and shadcn"
```

---

## Task 13: Full stack smoke test

- [ ] **Step 1: Build and start all services**

From the `siaas/` root:

```powershell
docker-compose up --build
```

Wait for all services to report healthy. You should see:
```
postgres   | database system is ready to accept connections
redis      | Ready to accept connections
backend    | Started SiaasApplication
frontend   | VITE ready in ... ms
nginx      | start worker process
```

- [ ] **Step 2: Test health endpoint**

```powershell
Invoke-RestMethod http://localhost/api/v1/health
```

Expected:
```json
{
  "success": true,
  "message": "OK",
  "data": { "status": "UP", "service": "SIAAS Backend" },
  "timestamp": "..."
}
```

- [ ] **Step 3: Test frontend loads**

Open `http://localhost` in your browser.

Expected: glassmorphism card with "SIAAS" gradient text and "Foundation running ✓"

- [ ] **Step 4: Test Swagger UI loads**

Open `http://localhost/swagger-ui/index.html`

Expected: Swagger UI page showing the health endpoint.

- [ ] **Step 5: Verify demo accounts exist in DB**

```powershell
docker-compose exec postgres psql -U siaas_user -d siaas -c "SELECT email, role FROM users;"
```

Expected:
```
       email        |  role
--------------------+---------
 admin@siaas.dev    | ADMIN
 faculty@siaas.dev  | FACULTY
 student@siaas.dev  | STUDENT
```

- [ ] **Step 6: Verify marks seeded**

```powershell
docker-compose exec postgres psql -U siaas_user -d siaas -c "SELECT COUNT(*) FROM marks;"
```

Expected: `count = 6`

- [ ] **Step 7: Final commit**

```powershell
git add .
git commit -m "feat: complete foundation — all services running, db seeded, health endpoint live"
```

---

## Plan 1 Complete

At this point you have:
- ✅ Full monorepo structure
- ✅ 5 Docker services wired with health checks and correct startup order
- ✅ Complete PostgreSQL schema (18 tables, all indexes)
- ✅ Reference data seeded (department, semester, 6 subjects)
- ✅ 3 demo accounts with BCrypt-hashed passwords
- ✅ Mock marks + attendance data for the student demo account
- ✅ Spring Boot running with health endpoint + GlobalExceptionHandler
- ✅ React frontend with glassmorphism base styles + ShadCN
- ✅ Nginx routing requests correctly

**Next: Plan 2 — Auth** (JWT cookies, register, login, logout, refresh token rotation, RBAC)
