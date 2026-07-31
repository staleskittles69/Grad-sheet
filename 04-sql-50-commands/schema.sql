-- Schema: two related tables — departments and employees
-- Target: MySQL 8.0+

CREATE DATABASE IF NOT EXISTS company_db;
USE company_db;

DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
    department_id   INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL,
    location        VARCHAR(100) NOT NULL,
    budget          DECIMAL(12, 2) NOT NULL
);

CREATE TABLE employees (
    employee_id   INT PRIMARY KEY AUTO_INCREMENT,
    first_name    VARCHAR(50) NOT NULL,
    last_name     VARCHAR(50) NOT NULL,
    email         VARCHAR(120) UNIQUE NOT NULL,
    phone         VARCHAR(15),
    hire_date     DATE NOT NULL,
    job_title     VARCHAR(80) NOT NULL,
    salary        DECIMAL(10, 2) NOT NULL,
    department_id INT NOT NULL,
    manager_id    INT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
);
