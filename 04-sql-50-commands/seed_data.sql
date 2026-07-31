-- Seed data for company_db
USE company_db;

-- Departments
INSERT INTO departments (department_id, department_name, location, budget) VALUES
(1, 'Engineering', 'Hyderabad', 4500000),
(2, 'Human Resources', 'Bangalore', 1200000),
(3, 'Sales', 'Chennai', 2800000),
(4, 'Marketing', 'Hyderabad', 1600000),
(5, 'Finance', 'Mumbai', 2000000),
(6, 'Customer Support', 'Vijayawada', 900000),
(7, 'Product', 'Bangalore', 2500000),
(8, 'IT Operations', 'Hyderabad', 1300000);

-- Employees
INSERT INTO employees (employee_id, first_name, last_name, email, phone, hire_date, job_title, salary, department_id, manager_id) VALUES
(1, 'Nikhil', 'Pillai', 'nikhil.pillai1@company.com', '9585151261', '2019-09-19', 'DevOps Engineer', 120516, 1, NULL),
(2, 'Arjun', 'Rao', 'arjun.rao2@company.com', '9776331422', '2019-03-11', 'Recruiter', 121179, 2, NULL),
(3, 'Nikhil', 'Nair', 'nikhil.nair3@company.com', '9678417751', '2016-01-19', 'Account Manager', 95942, 3, NULL),
(4, 'Sandeep', 'Verma', 'sandeep.verma4@company.com', '9760955423', '2020-03-19', 'Content Strategist', 138425, 4, NULL),
(5, 'Manish', 'Pillai', 'manish.pillai5@company.com', '9163942516', '2019-01-13', 'Finance Manager', 94139, 5, NULL),
(6, 'Rajesh', 'Kumar', 'rajesh.kumar6@company.com', '9935487536', '2019-08-15', 'Support Team Lead', 91971, 6, NULL),
(7, 'Nikhil', 'Patel', 'nikhil.patel7@company.com', '9350875089', '2016-05-17', 'Product Manager', 124021, 7, NULL),
(8, 'Manish', 'Menon', 'manish.menon8@company.com', '9803087908', '2015-05-16', 'IT Support Engineer', 119971, 8, NULL),
(9, 'Pooja', 'Gupta', 'pooja.gupta9@company.com', '9775872064', '2023-07-14', 'Marketing Executive', 72109, 4, 4),
(10, 'Arjun', 'Singh', 'arjun.singh10@company.com', '9457111100', '2023-05-11', 'System Administrator', 55395, 8, 8),
(11, 'Manish', 'Gupta', 'manish.gupta11@company.com', '9208497648', '2024-02-05', 'Product Analyst', 81335, 7, 7),
(12, 'Manish', 'Reddy', 'manish.reddy12@company.com', '9302277356', '2021-08-06', 'Content Strategist', 71653, 4, 4),
(13, 'Nikhil', 'Naidu', 'nikhil.naidu13@company.com', '9791183852', '2019-12-25', 'Support Executive', 62474, 6, 6),
(14, 'Sandeep', 'Sharma', 'sandeep.sharma14@company.com', '9962656529', '2021-07-07', 'Support Executive', 52681, 6, 6),
(15, 'Varun', 'Nair', 'varun.nair15@company.com', '9746412435', '2018-04-06', 'Sales Manager', 90992, 3, 3),
(16, 'Manoj', 'Patel', 'manoj.patel16@company.com', '9377323416', '2018-01-05', 'Financial Analyst', 63936, 5, 5),
(17, 'Manish', 'Singh', 'manish.singh17@company.com', '9178811100', '2022-06-27', 'SEO Specialist', 60308, 4, 4),
(18, 'Rahul', 'Sharma', 'rahul.sharma18@company.com', '9745623609', '2019-10-21', 'Financial Analyst', 36016, 5, 5),
(19, 'Meera', 'Iyer', 'meera.iyer19@company.com', '9716941183', '2022-08-05', 'Support Team Lead', 89549, 6, 6),
(20, 'Karthik', 'Pillai', 'karthik.pillai20@company.com', '9345224769', '2021-03-21', 'Product Analyst', 55369, 7, 7),
(21, 'Abhishek', 'Patel', 'abhishek.patel21@company.com', '9775359205', '2019-12-07', 'HR Executive', 83458, 2, 2),
(22, 'Lakshmi', 'Kumar', 'lakshmi.kumar22@company.com', '9552536249', '2023-07-16', 'Finance Manager', 40144, 5, 5),
(23, 'Aditi', 'Sharma', 'aditi.sharma23@company.com', '9894384974', '2018-01-17', 'IT Support Engineer', 50624, 8, 8),
(24, 'Gautam', 'Gupta', 'gautam.gupta24@company.com', '9658425437', '2020-07-27', 'Product Manager', 54230, 7, 7),
(25, 'Divya', 'Joshi', 'divya.joshi25@company.com', '9700615036', '2023-02-05', 'Senior Software Engineer', 66411, 1, 1),
(26, 'Manoj', 'Pillai', 'manoj.pillai26@company.com', '9319020650', '2022-10-03', 'HR Manager', 48919, 2, 2),
(27, 'Neha', 'Reddy', 'neha.reddy27@company.com', '9164913680', '2018-05-14', 'DevOps Engineer', 51322, 1, 1),
(28, 'Aditi', 'Rao', 'aditi.rao28@company.com', '9488850403', '2020-06-17', 'System Administrator', 41041, 8, 8),
(29, 'Karthik', 'Joshi', 'karthik.joshi29@company.com', '9660427698', '2021-06-22', 'Account Manager', 80299, 3, 3),
(30, 'Varun', 'Rao', 'varun.rao30@company.com', '9483832691', '2022-01-01', 'DevOps Engineer', 94651, 1, 1);
