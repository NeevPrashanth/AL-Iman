-- Al Iman Timesheet - MySQL DDL
-- Compatible with MySQL 8.x
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS aliman DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aliman;

-- === Reference tables ===
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(32) NOT NULL UNIQUE, -- LINE_MANAGER, CONTRACTOR, ADMIN
    label VARCHAR(64) NOT NULL
);

-- Contractors
CREATE TABLE contractors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(40),
    address VARCHAR(255),
    ni_number VARCHAR(32),
    hourly_rate DECIMAL(10,2) NOT NULL,
    role_title VARCHAR(80) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE contractor_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contractor_id BIGINT NOT NULL,
    snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(40),
    address VARCHAR(255),
    ni_number VARCHAR(32),
    hourly_rate DECIMAL(10,2) NOT NULL,
    role_title VARCHAR(80) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    active TINYINT(1),
    change_reason VARCHAR(255),
    CONSTRAINT fk_history_contractor FOREIGN KEY (contractor_id) REFERENCES contractors(id)
);

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role_id BIGINT NOT NULL,
    contractor_id BIGINT NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_user_contractor FOREIGN KEY (contractor_id) REFERENCES contractors(id)
);

-- Timesheet release windows (per month)
CREATE TABLE timesheet_releases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    month_year DATE NOT NULL, -- store 1st of month
    created_by BIGINT NOT NULL,
    released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_release_user FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY uk_release_month (month_year)
);

CREATE TABLE release_dates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    release_id BIGINT NOT NULL,
    work_date DATE NOT NULL,
    CONSTRAINT fk_release_dates FOREIGN KEY (release_id) REFERENCES timesheet_releases(id),
    UNIQUE KEY uk_release_date (release_id, work_date)
);

-- Timesheets
CREATE TABLE timesheets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contractor_id BIGINT NOT NULL,
    release_id BIGINT NOT NULL,
    status ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED') DEFAULT 'DRAFT',
    approver_id BIGINT NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ts_contractor FOREIGN KEY (contractor_id) REFERENCES contractors(id),
    CONSTRAINT fk_ts_release FOREIGN KEY (release_id) REFERENCES timesheet_releases(id),
    CONSTRAINT fk_ts_approver FOREIGN KEY (approver_id) REFERENCES users(id),
    UNIQUE KEY uk_ts_contractor_month (contractor_id, release_id)
);

CREATE TABLE timesheet_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    timesheet_id BIGINT NOT NULL,
    work_date DATE NOT NULL,
    hours_worked DECIMAL(5,2) DEFAULT 0,
    entry_type ENUM('WORK','HOLIDAY','SICK') DEFAULT 'WORK',
    comment VARCHAR(500),
    previous_comment VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_entry_ts FOREIGN KEY (timesheet_id) REFERENCES timesheets(id) ON DELETE CASCADE,
    UNIQUE KEY uk_entry_date (timesheet_id, work_date)
);

CREATE TABLE timesheet_entry_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entry_id BIGINT NOT NULL,
    comment VARCHAR(500),
    hours_worked DECIMAL(5,2),
    entry_type ENUM('WORK','HOLIDAY','SICK'),
    snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_entry_hist FOREIGN KEY (entry_id) REFERENCES timesheet_entries(id)
);

-- Events (for line manager to list)
CREATE TABLE events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(500),
    location VARCHAR(255),
    event_date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    created_by BIGINT NOT NULL,
    CONSTRAINT fk_event_user FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Email audit for notices
CREATE TABLE email_audit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    payload JSON,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(64) -- RELEASE_NOTICE, APPROVAL_NOTICE, REJECTION_NOTICE
);

-- Search indexes
CREATE INDEX idx_contractor_name ON contractors(full_name);
CREATE INDEX idx_contractor_role ON contractors(role_title);
CREATE INDEX idx_ts_status ON timesheets(status);
