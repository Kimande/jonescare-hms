-- =========================================================
-- Jones Care HMS — Schema
-- 14 tables
-- =========================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  gender        ENUM('MALE','FEMALE','OTHER') NOT NULL,
  license_no    VARCHAR(60)  NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('ADMIN','RECEPTIONIST','DOCTOR','NURSE','LAB_TECH','PHARMACIST','PATIENT') NOT NULL,
  status        ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email   (email),
  UNIQUE KEY uq_users_license (license_no),
  INDEX      idx_users_role   (role)
) ENGINE=InnoDB;

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  patient_no   VARCHAR(20) NOT NULL,
  name         VARCHAR(120) NOT NULL,
  dob          DATE NOT NULL,
  gender       ENUM('MALE','FEMALE','OTHER') NOT NULL,
  phone        VARCHAR(20) NOT NULL,
  national_id  VARCHAR(20) NULL,
  county       VARCHAR(60) NULL,
  town         VARCHAR(60) NULL,
  address      VARCHAR(255) NULL,
  sha_number   VARCHAR(40) NULL,
  user_id      INT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_patients_no    (patient_no),
  UNIQUE KEY uq_patients_user  (user_id),
  INDEX      idx_patients_name (name),
  INDEX      idx_patients_phone(phone),
  INDEX      idx_patients_county(county),
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id  INT NOT NULL,
  date_time  DATETIME NOT NULL,
  status     ENUM('BOOKED','RESCHEDULED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'BOOKED',
  reason     VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_appt_doctor_time (doctor_id, date_time),
  CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id)  REFERENCES users(id)
) ENGINE=InnoDB;

-- VISITS
CREATE TABLE IF NOT EXISTS visits (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT NOT NULL,
  doctor_id      INT NULL,
  appointment_id INT NULL,
  vitals         JSON NULL,
  diagnosis      TEXT NULL,
  notes          TEXT NULL,
  status         ENUM('WAITING','IN_CONSULTATION','COMPLETED') NOT NULL DEFAULT 'WAITING',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_visits_appt    (appointment_id),
  INDEX      idx_visits_patient(patient_id),
  INDEX      idx_visits_status (status),
  CONSTRAINT fk_visits_patient FOREIGN KEY (patient_id)     REFERENCES patients(id),
  CONSTRAINT fk_visits_doctor  FOREIGN KEY (doctor_id)      REFERENCES users(id),
  CONSTRAINT fk_visits_appt    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
) ENGINE=InnoDB;

-- SERVICES
CREATE TABLE IF NOT EXISTS services (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(120) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  UNIQUE KEY uq_services_name (name)
) ENGINE=InnoDB;

-- BILLS
CREATE TABLE IF NOT EXISTS bills (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  visit_id   INT NOT NULL,
  total      DECIMAL(10,2) NOT NULL DEFAULT 0,
  status     ENUM('UNPAID','PARTIAL','PAID','ARCHIVED') NOT NULL DEFAULT 'UNPAID',
  payer_type ENUM('SELF','INSURANCE','OTHER') NOT NULL DEFAULT 'SELF',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bills_visit (visit_id),
  CONSTRAINT fk_bills_visit FOREIGN KEY (visit_id) REFERENCES visits(id)
) ENGINE=InnoDB;

-- BILL ITEMS
CREATE TABLE IF NOT EXISTS bill_items (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  bill_id   INT NOT NULL,
  item_type ENUM('SERVICE','DRUG') NOT NULL,
  item_id   INT NOT NULL,
  quantity  INT NOT NULL DEFAULT 1,
  price     DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_billitems_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  bill_id     INT NOT NULL,
  method      ENUM('CASH','MPESA','CARD','INSURANCE','OTHER') NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  reference   VARCHAR(80) NULL,
  received_by INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_bill     FOREIGN KEY (bill_id)     REFERENCES bills(id),
  CONSTRAINT fk_pay_receiver FOREIGN KEY (received_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- LAB REQUESTS
CREATE TABLE IF NOT EXISTS lab_requests (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  visit_id      INT NOT NULL,
  test_name     VARCHAR(120) NOT NULL,
  status        ENUM('PENDING','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'PENDING',
  result        TEXT NULL,
  technician_id INT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lab_visit FOREIGN KEY (visit_id)      REFERENCES visits(id),
  CONSTRAINT fk_lab_tech  FOREIGN KEY (technician_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- DRUGS
CREATE TABLE IF NOT EXISTS drugs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  stock_qty     INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  UNIQUE KEY uq_drugs_name (name)
) ENGINE=InnoDB;

-- PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  visit_id   INT NOT NULL,
  drug_id    INT NOT NULL,
  dosage     VARCHAR(120) NOT NULL,
  quantity   INT NOT NULL,
  status     ENUM('PENDING','DISPENSED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_presc_visit FOREIGN KEY (visit_id) REFERENCES visits(id),
  CONSTRAINT fk_presc_drug  FOREIGN KEY (drug_id)  REFERENCES drugs(id)
) ENGINE=InnoDB;

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  action     VARCHAR(60) NOT NULL,
  table_name VARCHAR(60) NOT NULL,
  record_id  INT NULL,
  timestamp  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_table (table_name, record_id),
  INDEX idx_audit_user  (user_id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- INTEGRATIONS (POS, AI, SHA, SMS registry)
CREATE TABLE IF NOT EXISTS integrations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(60) NOT NULL,
  base_url   VARCHAR(255) NULL,
  status     ENUM('DISABLED','ENABLED','ERROR') NOT NULL DEFAULT 'DISABLED',
  config     JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_integrations_name (name)
) ENGINE=InnoDB;

-- INTEGRATION LOGS
CREATE TABLE IF NOT EXISTS integration_logs (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  integration_id INT NOT NULL,
  direction      ENUM('OUTBOUND','INBOUND') NOT NULL,
  endpoint       VARCHAR(255) NOT NULL,
  status_code    INT NULL,
  payload        JSON NULL,
  response       JSON NULL,
  error          TEXT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_intlogs (integration_id, created_at),
  CONSTRAINT fk_intlogs_integration FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- AI INSIGHTS
CREATE TABLE IF NOT EXISTS ai_insights (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  type       VARCHAR(60) NOT NULL,
  period     VARCHAR(40) NOT NULL,
  summary    TEXT NOT NULL,
  source     VARCHAR(60) NOT NULL DEFAULT 'AGENTIC_AI',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_insights (type, period)
) ENGINE=InnoDB;