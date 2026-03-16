// server.js
// Task Board - Monolithic Application
// ENGSE207 Software Architecture - Week 3 Lab

// ========================================
// PART 1: IMPORT DEPENDENCIES
// ========================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ========================================
// PART 2: INITIALIZE APPLICATION
// ========================================

const app = express();
const PORT = 3000;

// ========================================
// PART 3: MIDDLEWARE CONFIGURATION
// ========================================

app.use(express.json());
app.use(express.static('public'));

// ========================================
// PART 4: DATABASE CONNECTION
// ========================================

const db = new sqlite3.Database('./database/tasks.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');

        // Initialize schema if table does not exist yet
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (execErr) => {
            if (execErr) {
                // Table may already exist – that is fine
                console.log('ℹ️  Schema already applied (or minor error, continuing)');
            } else {
                console.log('✅ Database schema initialized');
            }
        });
    }
});

// Enable WAL mode for better performance
db.run('PRAGMA journal_mode=WAL;');

// ========================================
// PART 5: API ROUTES - GET ALL TASKS
// ========================================

app.get('/api/tasks', (req, res) => {
    const { status } = req.query;
    let sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
    const params = [];

    if (status && status !== 'ALL') {
        sql = 'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC';
        params.push(status);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching tasks:', err.message);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        } else {
            res.json({ tasks: rows });
        }
    });
});

// ========================================
// PART 6: API ROUTES - GET SINGLE TASK
// ========================================

app.get('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM tasks WHERE id = ?';

    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('Error fetching task:', err.message);
            res.status(500).json({ error: 'Failed to fetch task' });
        } else if (!row) {
            res.status(404).json({ error: 'Task not found' });
        } else {
            res.json({ task: row });
        }
    });
});

// ========================================
// PART 7: API ROUTES - CREATE TASK
// ========================================

app.post('/api/tasks', (req, res) => {
    const { title, description, priority } = req.body;

    // Validation: title is required
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    const taskPriority = validPriorities.includes(priority) ? priority : 'MEDIUM';

    const sql = `
        INSERT INTO tasks (title, description, status, priority)
        VALUES (?, ?, 'TODO', ?)
    `;

    db.run(sql, [title.trim(), description || '', taskPriority], function (err) {
        if (err) {
            console.error('Error creating task:', err.message);
            res.status(500).json({ error: 'Failed to create task' });
        } else {
            // Return the newly created task
            db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (getErr, row) => {
                if (getErr) {
                    res.status(201).json({ id: this.lastID, message: 'Task created' });
                } else {
                    res.status(201).json({ task: row });
                }
            });
        }
    });
});

// ========================================
// PART 8: API ROUTES - UPDATE TASK
// ========================================

app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;

    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];

    // Build dynamic SQL
    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const values = [];

    if (title !== undefined) {
        if (title.trim() === '') return res.status(400).json({ error: 'Title cannot be empty' });
        updates.push('title = ?');
        values.push(title.trim());
    }
    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }
    if (status !== undefined) {
        if (!validStatuses.includes(status))
            return res.status(400).json({ error: 'Invalid status. Must be TODO, IN_PROGRESS, or DONE' });
        updates.push('status = ?');
        values.push(status);
    }
    if (priority !== undefined) {
        if (!validPriorities.includes(priority))
            return res.status(400).json({ error: 'Invalid priority. Must be LOW, MEDIUM, or HIGH' });
        updates.push('priority = ?');
        values.push(priority);
    }

    if (updates.length === 1) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, values, function (err) {
        if (err) {
            console.error('Error updating task:', err.message);
            res.status(500).json({ error: 'Failed to update task' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Task not found' });
        } else {
            db.get('SELECT * FROM tasks WHERE id = ?', [id], (getErr, row) => {
                res.json({ task: row, message: 'Task updated successfully' });
            });
        }
    });
});

// ========================================
// PART 9: API ROUTES - DELETE TASK
// ========================================

app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tasks WHERE id = ?';

    db.run(sql, [id], function (err) {
        if (err) {
            console.error('Error deleting task:', err.message);
            res.status(500).json({ error: 'Failed to delete task' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Task not found' });
        } else {
            res.json({ message: 'Task deleted successfully', id: parseInt(id) });
        }
    });
});

// ========================================
// PART 10: API ROUTES - UPDATE STATUS
// ========================================

app.patch('/api/tasks/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            error: 'Invalid status. Must be TODO, IN_PROGRESS, or DONE'
        });
    }

    const sql = 'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    db.run(sql, [status, id], function (err) {
        if (err) {
            console.error('Error updating status:', err.message);
            res.status(500).json({ error: 'Failed to update status' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Task not found' });
        } else {
            db.get('SELECT * FROM tasks WHERE id = ?', [id], (getErr, row) => {
                res.json({ task: row, message: 'Status updated successfully' });
            });
        }
    });
});

// ========================================
// PART 11: SERVE FRONTEND
// ========================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================================
// PART 12: START SERVER
// ========================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Task Board application started`);
    console.log(`📊 Architecture: Monolithic (All-in-one)`);
    console.log(`🔗 API endpoints available at http://localhost:${PORT}/api/tasks`);
});

// ========================================
// PART 13: GRACEFUL SHUTDOWN
// ========================================

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});
