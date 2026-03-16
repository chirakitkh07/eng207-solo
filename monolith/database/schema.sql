-- schema.sql
-- Task Board Database Schema
-- ENGSE207 Software Architecture - Week 3 Lab

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'TODO' CHECK(status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    priority TEXT DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed data: sample tasks
INSERT INTO tasks (title, description, status, priority) VALUES
    ('Set up project structure', 'Initialize Node.js project with Express and SQLite dependencies', 'DONE', 'HIGH'),
    ('Design database schema', 'Create tasks table with all required columns and constraints', 'DONE', 'HIGH'),
    ('Implement REST API', 'Build all CRUD endpoints for the task board', 'IN_PROGRESS', 'HIGH'),
    ('Build Kanban UI', 'Create responsive kanban board with three columns', 'IN_PROGRESS', 'MEDIUM'),
    ('Write README documentation', 'Document setup steps, API endpoints, and architecture overview', 'TODO', 'MEDIUM'),
    ('Add input validation', 'Validate all form inputs and API request bodies', 'TODO', 'MEDIUM'),
    ('Test all API endpoints', 'Manually test each endpoint with Thunder Client or curl', 'TODO', 'LOW');
