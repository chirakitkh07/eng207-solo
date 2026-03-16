// server.js - Monolithic Student Management System
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Database connection (ปนกับทุกอย่าง)
const db = new sqlite3.Database('./students.db', (err) => {
    if (err) console.error('Database error:', err);
    else console.log('Connected to SQLite database');
});

// Create tables if not exists
db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_code TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    major TEXT NOT NULL,
    gpa REAL DEFAULT 0.0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// ===== API ENDPOINTS =====

// GET /api/students - ดึงนักศึกษาทั้งหมด
app.get('/api/students', (req, res) => {
    // Validation (ปนกับ HTTP handling)
    const { major, status } = req.query;
    
    // Database query (ปนกับทุกอย่าง)
    let sql = 'SELECT * FROM students';
    let params = [];
    let conditions = [];
    
    if (major) {
        conditions.push('major = ?');
        params.push(major);
    }
    
    if (status) {
        conditions.push('status = ?');
        params.push(status);
    }
    
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Business logic: คำนวณสถิติ (ปนกับทุกอย่าง)
        const active = rows.filter(s => s.status === 'active').length;
        const graduated = rows.filter(s => s.status === 'graduated').length;
        const suspended = rows.filter(s => s.status === 'suspended').length;
        const avgGPA = rows.length > 0 
            ? (rows.reduce((sum, s) => sum + s.gpa, 0) / rows.length).toFixed(2)
            : 0;
        
        res.json({
            students: rows,
            statistics: { 
                active, 
                graduated, 
                suspended, 
                total: rows.length,
                averageGPA: parseFloat(avgGPA)
            }
        });
    });
});

// GET /api/students/:id - ดึงนักศึกษาคนเดียว
app.get('/api/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Validation
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid student ID' });
    }
    
    // Database query
    db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json(row);
    });
});

// POST /api/students - เพิ่มนักศึกษาใหม่
app.post('/api/students', (req, res) => {
    const { student_code, first_name, last_name, email, major } = req.body;
    
    // Validation (ปนกับ HTTP handling)
    if (!student_code || !first_name || !last_name || !email || !major) {
        return res.status(400).json({ 
            error: 'student_code, first_name, last_name, email, and major are required' 
        });
    }
    
    // Business logic: validate student code format (ปนกับทุกอย่าง)
    // Format: YYXXXXX (e.g., 6531503001)
    const codePattern = /^\d{10}$/;
    if (!codePattern.test(student_code)) {
        return res.status(400).json({ 
            error: 'Invalid student code format (must be 10 digits)' 
        });
    }
    
    // Business logic: validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ 
            error: 'Invalid email format' 
        });
    }
    
    // Business logic: validate major
    const validMajors = ['CS', 'SE', 'IT', 'CE', 'DS'];
    if (!validMajors.includes(major)) {
        return res.status(400).json({ 
            error: 'Invalid major. Must be one of: CS, SE, IT, CE, DS' 
        });
    }
    
    // Database insert (ปนกับทุกอย่าง)
    const sql = 'INSERT INTO students (student_code, first_name, last_name, email, major) VALUES (?, ?, ?, ?, ?)';
    
    db.run(sql, [student_code, first_name, last_name, email, major], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(409).json({ 
                    error: 'Student code or email already exists' 
                });
            }
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Get the created student
        db.get('SELECT * FROM students WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json(row);
        });
    });
});

// PUT /api/students/:id - อัพเดทนักศึกษา
app.put('/api/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { student_code, first_name, last_name, email, major } = req.body;
    
    // Validation
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid student ID' });
    }
    
    if (!student_code || !first_name || !last_name || !email || !major) {
        return res.status(400).json({ 
            error: 'All fields are required' 
        });
    }
    
    // Business logic: validate formats
    const codePattern = /^\d{10}$/;
    if (!codePattern.test(student_code)) {
        return res.status(400).json({ 
            error: 'Invalid student code format' 
        });
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ 
            error: 'Invalid email format' 
        });
    }
    
    const validMajors = ['CS', 'SE', 'IT', 'CE', 'DS'];
    if (!validMajors.includes(major)) {
        return res.status(400).json({ 
            error: 'Invalid major' 
        });
    }
    
    // Check if student exists
    db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Update student
        const sql = 'UPDATE students SET student_code = ?, first_name = ?, last_name = ?, email = ?, major = ? WHERE id = ?';
        
        db.run(sql, [student_code, first_name, last_name, email, major, id], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ 
                        error: 'Student code or email already exists' 
                    });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Return updated student
            db.get('SELECT * FROM students WHERE id = ?', [id], (err, updatedRow) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json(updatedRow);
            });
        });
    });
});

// PATCH /api/students/:id/gpa - อัพเดท GPA
app.patch('/api/students/:id/gpa', (req, res) => {
    const id = parseInt(req.params.id);
    const { gpa } = req.body;
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid student ID' });
    }
    
    // Business logic: validate GPA range
    if (gpa === undefined || gpa < 0 || gpa > 4.0) {
        return res.status(400).json({ 
            error: 'GPA must be between 0.0 and 4.0' 
        });
    }
    
    // Check if student exists
    db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Update GPA
        db.run('UPDATE students SET gpa = ? WHERE id = ?', 
            [gpa, id], 
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                // Return updated student
                db.get('SELECT * FROM students WHERE id = ?', [id], (err, updatedRow) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json(updatedRow);
                });
            }
        );
    });
});

// PATCH /api/students/:id/status - เปลี่ยนสถานะ
app.patch('/api/students/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid student ID' });
    }
    
    // Business logic: validate status
    const validStatuses = ['active', 'graduated', 'suspended', 'withdrawn'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: 'Invalid status. Must be one of: active, graduated, suspended, withdrawn' 
        });
    }
    
    // Check if student exists
    db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Business logic: cannot change status of withdrawn student
        if (row.status === 'withdrawn') {
            return res.status(400).json({ 
                error: 'Cannot change status of withdrawn student' 
            });
        }
        
        // Update status
        db.run('UPDATE students SET status = ? WHERE id = ?', 
            [status, id], 
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                
                // Return updated student
                db.get('SELECT * FROM students WHERE id = ?', [id], (err, updatedRow) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }
                    res.json(updatedRow);
                });
            }
        );
    });
});

// DELETE /api/students/:id - ลบนักศึกษา
app.delete('/api/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid student ID' });
    }
    
    // Business logic: cannot delete active student
    db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        if (row.status === 'active') {
            return res.status(400).json({ 
                error: 'Cannot delete active student. Change status first.' 
            });
        }
        
        // Delete student
        db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ message: 'Student deleted successfully' });
        });
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Student Management System running on http://localhost:${PORT}`);
});