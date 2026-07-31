-- ============================================================
-- 50 SQL Commands Based on Two Tables (departments, employees)
-- Target: MySQL 8.0+
-- Run schema.sql and seed_data.sql first.
-- ============================================================

USE company_db;

-- ============================================================
-- SECTION 1: Basic SELECT (1-5)
-- ============================================================

-- 1. Select every column from employees
SELECT * FROM employees;

-- 2. Select specific columns
SELECT first_name, last_name, salary FROM employees;

-- 3. Distinct list of departments in use
SELECT DISTINCT department_id FROM employees;

-- 4. All department names and locations
SELECT department_name, location FROM departments;

-- 5. Employees sorted by salary, highest first
SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC;

-- ============================================================
-- SECTION 2: Filtering & Operators (6-14)
-- ============================================================

-- 6. Employees earning above 60,000
SELECT first_name, last_name, salary FROM employees WHERE salary > 60000;

-- 7. Employees hired in or after 2022
SELECT first_name, last_name, hire_date FROM employees WHERE hire_date >= '2022-01-01';

-- 8. Salary within a range
SELECT first_name, last_name, salary FROM employees WHERE salary BETWEEN 40000 AND 80000;

-- 9. Job titles containing "Engineer"
SELECT first_name, last_name, job_title FROM employees WHERE job_title LIKE '%Engineer%';

-- 10. Employees in a specific set of departments
SELECT first_name, last_name, department_id FROM employees WHERE department_id IN (1, 3, 7);

-- 11. Employees with no manager (top of each department)
SELECT first_name, last_name FROM employees WHERE manager_id IS NULL;

-- 12. First names starting with 'A'
SELECT first_name, last_name FROM employees WHERE first_name LIKE 'A%';

-- 13. Top 5 highest-paid employees
SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 5;

-- 14. Next 5 highest-paid employees (pagination)
SELECT first_name, last_name, salary FROM employees ORDER BY salary DESC LIMIT 5 OFFSET 5;

-- ============================================================
-- SECTION 3: Aggregate Functions (15-21)
-- ============================================================

-- 15. Total number of employees
SELECT COUNT(*) AS total_employees FROM employees;

-- 16. Number of distinct departments with employees
SELECT COUNT(DISTINCT department_id) AS departments_in_use FROM employees;

-- 17. Average salary across the company
SELECT ROUND(AVG(salary), 2) AS avg_salary FROM employees;

-- 18. Highest salary
SELECT MAX(salary) AS highest_salary FROM employees;

-- 19. Lowest salary
SELECT MIN(salary) AS lowest_salary FROM employees;

-- 20. Total salary payout
SELECT SUM(salary) AS total_payroll FROM employees;

-- 21. Total department budget across the company
SELECT SUM(budget) AS total_budget FROM departments;

-- ============================================================
-- SECTION 4: GROUP BY / HAVING (22-28)
-- ============================================================

-- 22. Headcount per department
SELECT department_id, COUNT(*) AS headcount FROM employees GROUP BY department_id;

-- 23. Average salary per department
SELECT department_id, ROUND(AVG(salary), 2) AS avg_salary FROM employees GROUP BY department_id;

-- 24. Departments with more than 3 employees
SELECT department_id, COUNT(*) AS headcount
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 3;

-- 25. Job titles held by more than one employee
SELECT job_title, COUNT(*) AS holders FROM employees GROUP BY job_title HAVING COUNT(*) > 1;

-- 26. Departments whose average salary exceeds 60,000
SELECT department_id, ROUND(AVG(salary), 2) AS avg_salary
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 60000;

-- 27. Number of direct reports per manager
SELECT manager_id, COUNT(*) AS direct_reports
FROM employees
WHERE manager_id IS NOT NULL
GROUP BY manager_id;

-- 28. Headcount per department and job title
SELECT department_id, job_title, COUNT(*) AS headcount
FROM employees
GROUP BY department_id, job_title
ORDER BY department_id;

-- ============================================================
-- SECTION 5: JOINs across both tables (29-36)
-- ============================================================

-- 29. Every employee with their department name
SELECT e.first_name, e.last_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;

-- 30. Employees in Hyderabad-based departments
SELECT e.first_name, e.last_name, d.department_name, d.location
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
WHERE d.location = 'Hyderabad';

-- 31. All departments with their employee count (0 included)
SELECT d.department_name, COUNT(e.employee_id) AS headcount
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_name;

-- 32. Self-join: each employee with their manager's name
SELECT e.first_name AS employee_first_name,
       e.last_name AS employee_last_name,
       m.first_name AS manager_first_name,
       m.last_name AS manager_last_name
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;

-- 33. Departments and their employees, including departments with nobody assigned
SELECT d.department_name, e.first_name, e.last_name
FROM departments d
RIGHT JOIN employees e ON d.department_id = e.department_id;

-- 34. Average salary per department, joined with department name
SELECT d.department_name, ROUND(AVG(e.salary), 2) AS avg_salary
FROM employees e
JOIN departments d ON e.department_id = d.department_id
GROUP BY d.department_name
ORDER BY avg_salary DESC;

-- 35. Employees earning more than their department's average salary
SELECT e.first_name, e.last_name, e.salary, d.department_name
FROM employees e
JOIN departments d ON e.department_id = d.department_id
JOIN (
    SELECT department_id, AVG(salary) AS dept_avg
    FROM employees
    GROUP BY department_id
) dept_avgs ON e.department_id = dept_avgs.department_id
WHERE e.salary > dept_avgs.dept_avg;

-- 36. Departments with budget greater than total salary paid within them
SELECT d.department_name, d.budget, SUM(e.salary) AS total_salary
FROM departments d
JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_name, d.budget
HAVING d.budget > SUM(e.salary);

-- ============================================================
-- SECTION 6: Subqueries (37-42)
-- ============================================================

-- 37. Employees earning above the company-wide average
SELECT first_name, last_name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- 38. Employees in departments located in Hyderabad (via subquery)
SELECT first_name, last_name
FROM employees
WHERE department_id IN (SELECT department_id FROM departments WHERE location = 'Hyderabad');

-- 39. Departments that currently have at least one employee
SELECT department_name
FROM departments d
WHERE EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);

-- 40. Departments with no employees at all
SELECT department_name
FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.department_id);

-- 41. The single highest-paid employee
SELECT first_name, last_name, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);

-- 42. Departments whose budget is above the average department budget
SELECT department_name, budget
FROM departments
WHERE budget > (SELECT AVG(budget) FROM departments);

-- ============================================================
-- SECTION 7: String & Date Functions (43-46)
-- ============================================================

-- 43. Full name as a single column
SELECT CONCAT(first_name, ' ', last_name) AS full_name, salary FROM employees;

-- 44. Email domains in uppercase
SELECT email, UPPER(SUBSTRING_INDEX(email, '@', -1)) AS domain FROM employees;

-- 45. Year each employee was hired
SELECT first_name, last_name, YEAR(hire_date) AS hire_year FROM employees;

-- 46. Years of service per employee (tenure)
SELECT first_name, last_name, TIMESTAMPDIFF(YEAR, hire_date, CURDATE()) AS years_of_service
FROM employees
ORDER BY years_of_service DESC;

-- ============================================================
-- SECTION 8: CASE Expressions (47-48)
-- ============================================================

-- 47. Salary band label per employee
SELECT first_name, last_name, salary,
    CASE
        WHEN salary >= 100000 THEN 'High'
        WHEN salary >= 60000  THEN 'Medium'
        ELSE 'Entry'
    END AS salary_band
FROM employees;

-- 48. Flag employees as manager or individual contributor
SELECT first_name, last_name,
    CASE WHEN manager_id IS NULL THEN 'Manager' ELSE 'Individual Contributor' END AS role_type
FROM employees;

-- ============================================================
-- SECTION 9: Data Modification (49-50)
-- ============================================================

-- 49. Give everyone in Engineering a 10% raise
UPDATE employees
SET salary = salary * 1.10
WHERE department_id = (SELECT department_id FROM departments WHERE department_name = 'Engineering');

-- 50. Remove employees who have no assigned manager and are not in Engineering
--     (kept as an example of a guarded DELETE — comment out USE with caution)
DELETE FROM employees
WHERE manager_id IS NULL
  AND department_id <> (SELECT department_id FROM departments WHERE department_name = 'Engineering');
