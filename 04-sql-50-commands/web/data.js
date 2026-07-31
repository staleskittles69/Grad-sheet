// Generated data for the in-browser SQL playground.
// SCHEMA_SQL / SEED_SQL are SQLite-flavored equivalents of ../schema.sql and ../seed_data.sql
// (identical data, minor dialect differences noted in the 4 affected queries below).

const SCHEMA_SQL = "CREATE TABLE departments (\n  department_id   INTEGER PRIMARY KEY AUTOINCREMENT,\n  department_name TEXT NOT NULL,\n  location        TEXT NOT NULL,\n  budget          REAL NOT NULL\n);\n\nCREATE TABLE employees (\n  employee_id   INTEGER PRIMARY KEY AUTOINCREMENT,\n  first_name    TEXT NOT NULL,\n  last_name     TEXT NOT NULL,\n  email         TEXT UNIQUE NOT NULL,\n  phone         TEXT,\n  hire_date     TEXT NOT NULL,\n  job_title     TEXT NOT NULL,\n  salary        REAL NOT NULL,\n  department_id INTEGER NOT NULL,\n  manager_id    INTEGER,\n  FOREIGN KEY (department_id) REFERENCES departments(department_id),\n  FOREIGN KEY (manager_id) REFERENCES employees(employee_id)\n);\n";

const SEED_SQL = "-- Departments\nINSERT INTO departments (department_id, department_name, location, budget) VALUES\n(1, 'Engineering', 'Hyderabad', 4500000),\n(2, 'Human Resources', 'Bangalore', 1200000),\n(3, 'Sales', 'Chennai', 2800000),\n(4, 'Marketing', 'Hyderabad', 1600000),\n(5, 'Finance', 'Mumbai', 2000000),\n(6, 'Customer Support', 'Vijayawada', 900000),\n(7, 'Product', 'Bangalore', 2500000),\n(8, 'IT Operations', 'Hyderabad', 1300000);\n\n-- Employees\nINSERT INTO employees (employee_id, first_name, last_name, email, phone, hire_date, job_title, salary, department_id, manager_id) VALUES\n(1, 'Nikhil', 'Pillai', 'nikhil.pillai1@company.com', '9585151261', '2019-09-19', 'DevOps Engineer', 120516, 1, NULL),\n(2, 'Arjun', 'Rao', 'arjun.rao2@company.com', '9776331422', '2019-03-11', 'Recruiter', 121179, 2, NULL),\n(3, 'Nikhil', 'Nair', 'nikhil.nair3@company.com', '9678417751', '2016-01-19', 'Account Manager', 95942, 3, NULL),\n(4, 'Sandeep', 'Verma', 'sandeep.verma4@company.com', '9760955423', '2020-03-19', 'Content Strategist', 138425, 4, NULL),\n(5, 'Manish', 'Pillai', 'manish.pillai5@company.com', '9163942516', '2019-01-13', 'Finance Manager', 94139, 5, NULL),\n(6, 'Rajesh', 'Kumar', 'rajesh.kumar6@company.com', '9935487536', '2019-08-15', 'Support Team Lead', 91971, 6, NULL),\n(7, 'Nikhil', 'Patel', 'nikhil.patel7@company.com', '9350875089', '2016-05-17', 'Product Manager', 124021, 7, NULL),\n(8, 'Manish', 'Menon', 'manish.menon8@company.com', '9803087908', '2015-05-16', 'IT Support Engineer', 119971, 8, NULL),\n(9, 'Pooja', 'Gupta', 'pooja.gupta9@company.com', '9775872064', '2023-07-14', 'Marketing Executive', 72109, 4, 4),\n(10, 'Arjun', 'Singh', 'arjun.singh10@company.com', '9457111100', '2023-05-11', 'System Administrator', 55395, 8, 8),\n(11, 'Manish', 'Gupta', 'manish.gupta11@company.com', '9208497648', '2024-02-05', 'Product Analyst', 81335, 7, 7),\n(12, 'Manish', 'Reddy', 'manish.reddy12@company.com', '9302277356', '2021-08-06', 'Content Strategist', 71653, 4, 4),\n(13, 'Nikhil', 'Naidu', 'nikhil.naidu13@company.com', '9791183852', '2019-12-25', 'Support Executive', 62474, 6, 6),\n(14, 'Sandeep', 'Sharma', 'sandeep.sharma14@company.com', '9962656529', '2021-07-07', 'Support Executive', 52681, 6, 6),\n(15, 'Varun', 'Nair', 'varun.nair15@company.com', '9746412435', '2018-04-06', 'Sales Manager', 90992, 3, 3),\n(16, 'Manoj', 'Patel', 'manoj.patel16@company.com', '9377323416', '2018-01-05', 'Financial Analyst', 63936, 5, 5),\n(17, 'Manish', 'Singh', 'manish.singh17@company.com', '9178811100', '2022-06-27', 'SEO Specialist', 60308, 4, 4),\n(18, 'Rahul', 'Sharma', 'rahul.sharma18@company.com', '9745623609', '2019-10-21', 'Financial Analyst', 36016, 5, 5),\n(19, 'Meera', 'Iyer', 'meera.iyer19@company.com', '9716941183', '2022-08-05', 'Support Team Lead', 89549, 6, 6),\n(20, 'Karthik', 'Pillai', 'karthik.pillai20@company.com', '9345224769', '2021-03-21', 'Product Analyst', 55369, 7, 7),\n(21, 'Abhishek', 'Patel', 'abhishek.patel21@company.com', '9775359205', '2019-12-07', 'HR Executive', 83458, 2, 2),\n(22, 'Lakshmi', 'Kumar', 'lakshmi.kumar22@company.com', '9552536249', '2023-07-16', 'Finance Manager', 40144, 5, 5),\n(23, 'Aditi', 'Sharma', 'aditi.sharma23@company.com', '9894384974', '2018-01-17', 'IT Support Engineer', 50624, 8, 8),\n(24, 'Gautam', 'Gupta', 'gautam.gupta24@company.com', '9658425437', '2020-07-27', 'Product Manager', 54230, 7, 7),\n(25, 'Divya', 'Joshi', 'divya.joshi25@company.com', '9700615036', '2023-02-05', 'Senior Software Engineer', 66411, 1, 1),\n(26, 'Manoj', 'Pillai', 'manoj.pillai26@company.com', '9319020650', '2022-10-03', 'HR Manager', 48919, 2, 2),\n(27, 'Neha', 'Reddy', 'neha.reddy27@company.com', '9164913680', '2018-05-14', 'DevOps Engineer', 51322, 1, 1),\n(28, 'Aditi', 'Rao', 'aditi.rao28@company.com', '9488850403', '2020-06-17', 'System Administrator', 41041, 8, 8),\n(29, 'Karthik', 'Joshi', 'karthik.joshi29@company.com', '9660427698', '2021-06-22', 'Account Manager', 80299, 3, 3),\n(30, 'Varun', 'Rao', 'varun.rao30@company.com', '9483832691', '2022-01-01', 'DevOps Engineer', 94651, 1, 1);\n";

const QUERIES = [
  {
    "id": 1,
    "section": "Basic SELECT",
    "title": "Every column from employees",
    "sql": "SELECT * FROM employees;"
  },
  {
    "id": 2,
    "section": "Basic SELECT",
    "title": "Specific columns",
    "sql": "SELECT first_name, last_name, salary FROM employees;"
  },
  {
    "id": 3,
    "section": "Basic SELECT",
    "title": "Distinct departments in use",
    "sql": "SELECT DISTINCT department_id FROM employees;"
  },
  {
    "id": 4,
    "section": "Basic SELECT",
    "title": "All department names and locations",
    "sql": "SELECT department_name, location FROM departments;"
  },
  {
    "id": 5,
    "section": "Basic SELECT",
    "title": "Employees sorted by salary (desc)",
    "sql": "SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC;"
  },
  {
    "id": 6,
    "section": "Filtering & Operators",
    "title": "Salary above 60,000",
    "sql": "SELECT first_name, last_name, salary FROM employees WHERE salary > 60000;"
  },
  {
    "id": 7,
    "section": "Filtering & Operators",
    "title": "Hired in or after 2022",
    "sql": "SELECT first_name, last_name, hire_date FROM employees WHERE hire_date >= '2022-01-01';"
  },
  {
    "id": 8,
    "section": "Filtering & Operators",
    "title": "Salary within a range",
    "sql": "SELECT first_name, last_name, salary FROM employees WHERE salary BETWEEN 40000 AND 80000;"
  },
  {
    "id": 9,
    "section": "Filtering & Operators",
    "title": "Job titles containing 'Engineer'",
    "sql": "SELECT first_name, last_name, job_title FROM employees WHERE job_title LIKE '%Engineer%';"
  },
  {
    "id": 10,
    "section": "Filtering & Operators",
    "title": "Employees in a set of departments",
    "sql": "SELECT first_name, last_name, department_id FROM employees WHERE department_id IN (1, 3, 7);"
  },
  {
    "id": 11,
    "section": "Filtering & Operators",
    "title": "Employees with no manager",
    "sql": "SELECT first_name, last_name FROM employees WHERE manager_id IS NULL;"
  },
  {
    "id": 12,
    "section": "Filtering & Operators",
    "title": "First names starting with 'A'",
    "sql": "SELECT first_name, last_name FROM employees WHERE first_name LIKE 'A%';"
  },
  {
    "id": 13,
    "section": "Filtering & Operators",
    "title": "Top 5 highest-paid employees",
    "sql": "SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 5;"
  },
  {
    "id": 14,
    "section": "Filtering & Operators",
    "title": "Next 5 highest-paid (pagination)",
    "sql": "SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 5 OFFSET 5;"
  },
  {
    "id": 15,
    "section": "Aggregate Functions",
    "title": "Total number of employees",
    "sql": "SELECT COUNT(*) AS total_employees FROM employees;"
  },
  {
    "id": 16,
    "section": "Aggregate Functions",
    "title": "Distinct departments with employees",
    "sql": "SELECT COUNT(DISTINCT department_id) AS departments_in_use FROM employees;"
  },
  {
    "id": 17,
    "section": "Aggregate Functions",
    "title": "Average salary company-wide",
    "sql": "SELECT ROUND(AVG(salary), 2) AS avg_salary FROM employees;"
  },
  {
    "id": 18,
    "section": "Aggregate Functions",
    "title": "Highest salary",
    "sql": "SELECT MAX(salary) AS highest_salary FROM employees;"
  },
  {
    "id": 19,
    "section": "Aggregate Functions",
    "title": "Lowest salary",
    "sql": "SELECT MIN(salary) AS lowest_salary FROM employees;"
  },
  {
    "id": 20,
    "section": "Aggregate Functions",
    "title": "Total salary payout",
    "sql": "SELECT SUM(salary) AS total_payroll FROM employees;"
  },
  {
    "id": 21,
    "section": "Aggregate Functions",
    "title": "Total department budget",
    "sql": "SELECT SUM(budget) AS total_budget FROM departments;"
  },
  {
    "id": 22,
    "section": "GROUP BY / HAVING",
    "title": "Headcount per department",
    "sql": "SELECT department_id, COUNT(*) AS headcount FROM employees GROUP BY department_id;"
  },
  {
    "id": 23,
    "section": "GROUP BY / HAVING",
    "title": "Average salary per department",
    "sql": "SELECT department_id, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department_id;"
  },
  {
    "id": 24,
    "section": "GROUP BY / HAVING",
    "title": "Departments with more than 3 employees",
    "sql": "SELECT department_id, COUNT(*) AS headcount FROM employees GROUP BY department_id HAVING COUNT(*) > 3;"
  },
  {
    "id": 25,
    "section": "GROUP BY / HAVING",
    "title": "Job titles held by more than one employee",
    "sql": "SELECT job_title, COUNT(*) AS holders FROM employees GROUP BY job_title HAVING COUNT(*) > 1;"
  },
  {
    "id": 26,
    "section": "GROUP BY / HAVING",
    "title": "Departments averaging above 60,000",
    "sql": "SELECT department_id, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department_id HAVING AVG(salary) > 60000;"
  },
  {
    "id": 27,
    "section": "GROUP BY / HAVING",
    "title": "Direct reports per manager",
    "sql": "SELECT manager_id, COUNT(*) AS direct_reports FROM employees WHERE manager_id IS NOT NULL GROUP BY manager_id;"
  },
  {
    "id": 28,
    "section": "GROUP BY / HAVING",
    "title": "Headcount per department and job title",
    "sql": "SELECT department_id, job_title, COUNT(*) AS headcount FROM employees GROUP BY department_id, job_title ORDER BY department_id;"
  },
  {
    "id": 29,
    "section": "Joins",
    "title": "Every employee with their department name",
    "sql": "SELECT e.first_name, e.last_name, d.department_name FROM employees e INNER JOIN departments d ON e.department_id = d.department_id;"
  },
  {
    "id": 30,
    "section": "Joins",
    "title": "Employees in Hyderabad-based departments",
    "sql": "SELECT e.first_name, e.last_name, d.department_name, d.location FROM employees e INNER JOIN departments d ON e.department_id = d.department_id WHERE d.location = 'Hyderabad';"
  },
  {
    "id": 31,
    "section": "Joins",
    "title": "Every department with employee count (0 included)",
    "sql": "SELECT d.department_name, COUNT(e.employee_id) AS headcount FROM departments d LEFT JOIN employees e ON d.department_id = e.department_id GROUP BY d.department_name;"
  },
  {
    "id": 32,
    "section": "Joins",
    "title": "Self-join: each employee with their manager's name",
    "sql": "SELECT e.first_name AS employee_first_name, e.last_name AS employee_last_name, m.first_name AS manager_first_name, m.last_name AS manager_last_name FROM employees e LEFT JOIN employees m ON e.manager_id = m.employee_id;"
  },
  {
    "id": 33,
    "section": "Joins",
    "title": "Departments and their employees (RIGHT JOIN, SQLite-safe rewrite)",
    "sql": "SELECT d.department_name, e.first_name, e.last_name FROM employees e LEFT JOIN departments d ON d.department_id = e.department_id;"
  },
  {
    "id": 34,
    "section": "Joins",
    "title": "Average salary per department, joined with name",
    "sql": "SELECT d.department_name, ROUND(AVG(e.salary), 2) AS avg_salary FROM employees e JOIN departments d ON e.department_id = d.department_id GROUP BY d.department_name ORDER BY avg_salary DESC;"
  },
  {
    "id": 35,
    "section": "Joins",
    "title": "Employees earning above their department's average",
    "sql": "SELECT e.first_name, e.last_name, e.salary, d.department_name FROM employees e JOIN departments d ON e.department_id = d.department_id JOIN (SELECT department_id, AVG(salary) AS dept_avg FROM employees GROUP BY department_id) dept_avgs ON e.department_id = dept_avgs.department_id WHERE e.salary > dept_avgs.dept_avg;"
  },
  {
    "id": 36,
    "section": "Joins",
    "title": "Departments where budget exceeds total salary paid",
    "sql": "SELECT d.department_name, d.budget, SUM(e.salary) AS total_salary FROM departments d JOIN employees e ON d.department_id = e.department_id GROUP BY d.department_name, d.budget HAVING d.budget > SUM(e.salary);"
  },
  {
    "id": 37,
    "section": "Subqueries",
    "title": "Employees earning above the company average",
    "sql": "SELECT first_name, last_name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);"
  },
  {
    "id": 38,
    "section": "Subqueries",
    "title": "Employees in Hyderabad-located departments (via subquery)",
    "sql": "SELECT first_name, last_name FROM employees WHERE department_id IN (SELECT department_id FROM departments WHERE location = 'Hyderabad');"
  },
  {
    "id": 39,
    "section": "Subqueries",
    "title": "Departments that currently have employees (EXISTS)",
    "sql": "SELECT department_name FROM departments d WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);"
  },
  {
    "id": 40,
    "section": "Subqueries",
    "title": "Departments with no employees at all",
    "sql": "SELECT department_name FROM departments d WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);"
  },
  {
    "id": 41,
    "section": "Subqueries",
    "title": "The single highest-paid employee",
    "sql": "SELECT first_name, last_name, salary FROM employees WHERE salary = (SELECT MAX(salary) FROM employees);"
  },
  {
    "id": 42,
    "section": "Subqueries",
    "title": "Departments with above-average budget",
    "sql": "SELECT department_name, budget FROM departments WHERE budget > (SELECT AVG(budget) FROM departments);"
  },
  {
    "id": 43,
    "section": "String & Date Functions",
    "title": "Full name as a single column",
    "sql": "SELECT (first_name || ' ' || last_name) AS full_name, salary FROM employees;"
  },
  {
    "id": 44,
    "section": "String & Date Functions",
    "title": "Email domain in uppercase",
    "sql": "SELECT email, UPPER(SUBSTR(email, INSTR(email, '@') + 1)) AS domain FROM employees;"
  },
  {
    "id": 45,
    "section": "String & Date Functions",
    "title": "Year each employee was hired",
    "sql": "SELECT first_name, last_name, CAST(STRFTIME('%Y', hire_date) AS INTEGER) AS hire_year FROM employees;"
  },
  {
    "id": 46,
    "section": "String & Date Functions",
    "title": "Years of service per employee",
    "sql": "SELECT first_name, last_name, (STRFTIME('%Y','now') - STRFTIME('%Y', hire_date)) AS years_of_service FROM employees ORDER BY years_of_service DESC;"
  },
  {
    "id": 47,
    "section": "CASE Expressions",
    "title": "Salary band label per employee",
    "sql": "SELECT first_name, last_name, salary, CASE WHEN salary >= 100000 THEN 'High' WHEN salary >= 60000 THEN 'Medium' ELSE 'Entry' END AS salary_band FROM employees;"
  },
  {
    "id": 48,
    "section": "CASE Expressions",
    "title": "Manager vs individual contributor flag",
    "sql": "SELECT first_name, last_name, CASE WHEN manager_id IS NULL THEN 'Manager' ELSE 'Individual Contributor' END AS role_type FROM employees;"
  },
  {
    "id": 49,
    "section": "Data Modification",
    "title": "Give Engineering a 10% raise (writes!)",
    "sql": "UPDATE employees SET salary = salary * 1.10 WHERE department_id = (SELECT department_id FROM departments WHERE department_name = 'Engineering');"
  },
  {
    "id": 50,
    "section": "Data Modification",
    "title": "Delete unmanaged employees outside Engineering (writes!)",
    "sql": "DELETE FROM employees WHERE manager_id IS NULL AND department_id <> (SELECT department_id FROM departments WHERE department_name = 'Engineering');"
  }
];
