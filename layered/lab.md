# 🏛️ คู่มือปฏิบัติการ ENGSE207 - สัปดาห์ที่ 4
## Layered (3-Tier) Architecture: Refactoring Task Board 
---

**สัปดาห์ที่ 4 - Layered (3-Tier):**
```
┌─────────────────────────────────────────┐
│  Presentation Layer (Controllers)       │  ← ชั้นที่ 1: รับ-ส่งข้อมูล HTTP
│  - จัดการ HTTP requests/responses        │
│  - ตรวจสอบรูปแบบข้อมูลเข้า                  │
│  - จัดรูปแบบข้อมูลออก (JSON)                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Business Logic Layer (Services)        │  ← ชั้นที่ 2: ตรรกะทางธุรกิจ
│  - กฎทางธุรกิจ (Business rules)           │
│  - การตรวจสอบข้อมูล (Validation)          │
│  - การประมวลผลและคำนวณ                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Data Access Layer (Repositories)       │  ← ชั้นที่ 3: จัดการฐานข้อมูล
│  - CRUD operations                      │
│  - Query execution                      │
│  - Data persistence                     │
└─────────────────────────────────────────┘
              ↓
         [Database]

### โครงสร้างโปรเจกต์สัปดาห์ที่ 4:

```
week4-layered/
├── server.js                      # จุดเริ่มต้นโปรแกรม
├── package.json
├── .env                           # ตัวแปร environment
├── database/
│   ├── schema.sql
│   ├── tasks.db
│   └── connection.js              # การเชื่อมต่อฐานข้อมูล
├── src/
│   ├── controllers/               # ⭐ Presentation Layer
│   │   └── taskController.js
│   ├── services/                  # ⭐ Business Logic Layer
│   │   └── taskService.js
│   ├── repositories/              # ⭐ Data Access Layer
│   │   └── taskRepository.js
│   ├── models/                    # โมเดลข้อมูล
│   │   └── Task.js
│   ├── middleware/                # Express middleware
│   │   ├── errorHandler.js
│   │   └── validator.js
│   └── utils/                     # เครื่องมือช่วย
│       └── logger.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .gitignore
└── README.md
```

---

## ส่วนที่ 1: ทำความเข้าใจ Layers (30 นาที)

### 1.1 หน้าที่ของแต่ละ Layer

#### 📊 Presentation Layer (Controllers)
**หน้าที่:**
- รับ HTTP requests จาก client
- ตรวจสอบรูปแบบข้อมูลที่เข้ามา (format validation)
- เรียกใช้ Business Logic Layer
- จัดรูปแบบ responses เป็น JSON
- จัดการ HTTP errors

**สิ่งที่ไม่ควรมี:**
- ❌ Business logic
- ❌ Database queries
- ❌ การคำนวณที่ซับซ้อน

**ตัวอย่างโค้ดที่ควรอยู่ใน Controller:**
```javascript
// ✅ ถูกต้อง - อยู่ใน Controller
async createTask(req, res, next) {
    const taskData = {
        title: req.body.title,
        description: req.body.description
    };
    const task = await taskService.createTask(taskData);
    res.status(201).json({ success: true, data: task });
}

// ❌ ผิด - Business logic อยู่ใน Controller
async createTask(req, res, next) {
    // ❌ การตรวจสอบเหล่านี้ควรอยู่ใน Service
    if (req.body.title.length < 3) {
        return res.status(400).json({ error: 'Title too short' });
    }
    if (req.body.priority === 'HIGH' && !req.body.description) {
        return res.status(400).json({ error: 'High priority needs description' });
    }
    // ...
}
```

#### 🧠 Business Logic Layer (Services)
**หน้าที่:**
- กฎทางธุรกิจและการตรวจสอบ (Business rules & validation)
- การแปลงข้อมูล (Data transformation)
- การประสานงาน (Workflow orchestration)
- การจัดการ transactions
- การคำนวณที่ซับซ้อน

**สิ่งที่ไม่ควรมี:**
- ❌ HTTP handling
- ❌ Database queries โดยตรง
- ❌ UI concerns

**ตัวอย่างโค้ดที่ควรอยู่ใน Service:**
```javascript
// ✅ ถูกต้อง - Business logic อยู่ใน Service
async createTask(taskData) {
    const task = new Task(taskData);
    
    // ✅ Business validation
    const validation = task.isValid();
    if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
    }
    
    // ✅ Business rules
    if (task.priority === 'HIGH' && !task.description) {
        throw new Error('งานลำดับความสำคัญสูงต้องมีรายละเอียด');
    }
    
    // ✅ เรียกใช้ Repository
    return await taskRepository.create(task);
}
```

#### 💾 Data Access Layer (Repositories)
**หน้าที่:**
- CRUD operations
- ประมวลผล queries
- จัดเก็บข้อมูล (Data persistence)
- จัดการการเชื่อมต่อฐานข้อมูล

**สิ่งที่ไม่ควรมี:**
- ❌ Business logic
- ❌ HTTP handling
- ❌ Data transformation logic

### 1.2 Communication Flow

```javascript
// Example Flow: Create Task

// 1. Presentation Layer (Controller)
POST /api/tasks
↓
TaskController.createTask(req, res)
  - Validate input format
  - Extract data from request
  ↓
  
// 2. Business Logic Layer (Service)
TaskService.createTask(taskData)
  - Apply business rules
  - Validate business constraints
  - Transform data if needed
  ↓
  
// 3. Data Access Layer (Repository)
TaskRepository.create(task)
  - Execute SQL INSERT
  - Return created task
  ↓
  
// Response flows back up
Repository → Service → Controller → HTTP Response
```

**ตัวอย่างโค้ดที่ควรอยู่ใน Repository:**
```javascript
// ✅ ถูกต้อง - เฉพาะ database operations
async create(task) {
    const data = task.toDatabase();
    const sql = `INSERT INTO tasks (title, description, status, priority) 
                 VALUES (?, ?, ?, ?)`;
    const result = await database.run(sql, [
        data.title, data.description, data.status, data.priority
    ]);
    return await this.findById(result.lastID);
}

// ❌ ผิด - มี business logic ใน Repository
async create(task) {
    // ❌ Validation ควรอยู่ใน Service
    if (task.title.length < 3) {
        throw new Error('Title too short');
    }
    // ...
}
```
---

## ส่วนที่ 2: Refactoring เป็น 3-Tier (90 นาที)

### 2.1 ตั้งค่าโครงสร้างโปรเจกต์ (15 นาที)

```bash
# สร้างโฟลเดอร์
mkdir -p src/{controllers,services,repositories,models,middleware,utils}
mkdir -p tests

# ติดตั้ง dependencies เพิ่มเติม
npm install dotenv
npm install --save-dev jest

# สร้างไฟล์ config
touch .env src/middleware/{errorHandler.js,validator.js}
touch src/utils/logger.js database/connection.js
```

**สร้างไฟล์ .env:**
```env
NODE_ENV=development
PORT=3000
DB_PATH=./database/tasks.db
LOG_LEVEL=debug
```

### 2.2 สร้าง Data Model (10 นาที)

**src/models/Task.js:**
```javascript
/**
 * Task Data Model
 * แทนข้อมูล task พร้อม validation
 */
class Task {
    constructor(data = {}) {
        this.id = data.id || null;
        this.title = data.title || '';
        this.description = data.description || '';
        this.status = data.status || 'TODO';
        this.priority = data.priority || 'MEDIUM';
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    // การตรวจสอบความถูกต้อง
    isValid() {
        const errors = [];
        
        // ตรวจสอบ title
        if (!this.title || this.title.trim().length < 3) {
            errors.push('ชื่องานต้องมีอย่างน้อย 3 ตัวอักษร');
        }
        if (this.title && this.title.length > 100) {
            errors.push('ชื่องานต้องไม่เกิน 100 ตัวอักษร');
        }
        
        // ตรวจสอบ status
        const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
        if (!validStatuses.includes(this.status)) {
            errors.push('สถานะไม่ถูกต้อง');
        }
        
        // ตรวจสอบ priority
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
        if (!validPriorities.includes(this.priority)) {
            errors.push('ระดับความสำคัญไม่ถูกต้อง');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    // แปลงเป็น object สำหรับฐานข้อมูล
    toDatabase() {
        return {
            title: this.title.trim(),
            description: this.description ? this.description.trim() : null,
            status: this.status,
            priority: this.priority
        };
    }

    // แปลงเป็น JSON สำหรับ API response
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: this.status,
            priority: this.priority,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Task;
```

### 2.3 สร้าง Database Connection (10 นาที)

**database/connection.js:**
```javascript
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

class Database {
    constructor() {
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            const dbPath = process.env.DB_PATH || './database/tasks.db';
            
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('❌ เชื่อมต่อฐานข้อมูลล้มเหลว:', err.message);
                    reject(err);
                } else {
                    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ:', dbPath);
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve(this.db);
                }
            });
        });
    }

    getConnection() {
        if (!this.db) {
            throw new Error('ยังไม่ได้เชื่อมต่อฐานข้อมูล เรียก connect() ก่อน');
        }
        return this.db;
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ ปิดการเชื่อมต่อฐานข้อมูล');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Helper: Run query ด้วย Promise
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    // Helper: Get single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Helper: Get all rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Singleton instance
const database = new Database();

module.exports = database;
```

### 2.4 สร้าง Data Access Layer - Repository (20 นาที)

**src/repositories/taskRepository.js:**
```javascript
const database = require('../../database/connection');
const Task = require('../models/Task');

class TaskRepository {
    /**
     * ค้นหา tasks ทั้งหมด
     * @param {Object} filters - ตัวกรอง { status, priority }
     * @returns {Promise<Array>}
     */
    async findAll(filters = {}) {
        let sql = 'SELECT * FROM tasks WHERE 1=1';
        const params = [];

        if (filters.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.priority) {
            sql += ' AND priority = ?';
            params.push(filters.priority);
        }

        sql += ' ORDER BY created_at DESC';

        const rows = await database.all(sql, params);
        return rows.map(row => new Task(row));
    }

    /**
     * ค้นหา task ตาม ID
     * @param {number} id
     * @returns {Promise<Task|null>}
     */
    async findById(id) {
        const sql = 'SELECT * FROM tasks WHERE id = ?';
        const row = await database.get(sql, [id]);
        return row ? new Task(row) : null;
    }

    /**
     * สร้าง task ใหม่
     * @param {Task} task
     * @returns {Promise<Task>}
     */
    async create(task) {
        const data = task.toDatabase();
        const sql = `
            INSERT INTO tasks (title, description, status, priority)
            VALUES (?, ?, ?, ?)
        `;
        
        const result = await database.run(sql, [
            data.title,
            data.description,
            data.status,
            data.priority
        ]);

        return await this.findById(result.lastID);
    }

    /**
     * อัพเดท task
     * @param {number} id
     * @param {Object} updates
     * @returns {Promise<Task|null>}
     */
    async update(id, updates) {
        const fields = [];
        const params = [];

        if (updates.title !== undefined) {
            fields.push('title = ?');
            params.push(updates.title);
        }
        if (updates.description !== undefined) {
            fields.push('description = ?');
            params.push(updates.description);
        }
        if (updates.status !== undefined) {
            fields.push('status = ?');
            params.push(updates.status);
        }
        if (updates.priority !== undefined) {
            fields.push('priority = ?');
            params.push(updates.priority);
        }

        if (fields.length === 0) {
            return await this.findById(id);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
        await database.run(sql, params);

        return await this.findById(id);
    }

    /**
     * ลบ task
     * @param {number} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        const sql = 'DELETE FROM tasks WHERE id = ?';
        const result = await database.run(sql, [id]);
        return result.changes > 0;
    }

    /**
     * นับจำนวน tasks ตาม status
     * @returns {Promise<Object>}
     */
    async countByStatus() {
        const sql = `
            SELECT status, COUNT(*) as count
            FROM tasks
            GROUP BY status
        `;
        const rows = await database.all(sql);
        
        return rows.reduce((acc, row) => {
            acc[row.status] = row.count;
            return acc;
        }, {});
    }
}

module.exports = new TaskRepository();
```

### 2.5 สร้าง Business Logic Layer - Service (20 นาที)

**src/services/taskService.js:**
```javascript
const taskRepository = require('../repositories/taskRepository');
const Task = require('../models/Task');

class TaskService {
    /**
     * ดึง tasks ทั้งหมดพร้อมตัวกรอง
     */
    async getAllTasks(filters = {}) {
        return await taskRepository.findAll(filters);
    }

    /**
     * ดึง task ตาม ID
     */
    async getTaskById(id) {
        const task = await taskRepository.findById(id);
        
        if (!task) {
            throw new Error(`ไม่พบ task ที่มี ID ${id}`);
        }
        
        return task;
    }

    /**
     * สร้าง task ใหม่พร้อมตรวจสอบกฎทางธุรกิจ
     */
    async createTask(taskData) {
        // สร้าง task model
        const task = new Task(taskData);

        // ตรวจสอบความถูกต้องพื้นฐาน
        const validation = task.isValid();
        if (!validation.valid) {
            throw new Error(`ข้อมูลไม่ถูกต้อง: ${validation.errors.join(', ')}`);
        }

        // กฎทางธุรกิจเพิ่มเติม
        if (task.priority === 'HIGH' && !task.description) {
            throw new Error('งานลำดับความสำคัญสูงต้องมีรายละเอียด');
        }

        // บันทึกลงฐานข้อมูล
        const createdTask = await taskRepository.create(task);
        
        // Business logic: บันทึก log งานสำคัญ
        if (createdTask.priority === 'HIGH') {
            console.log(`🔥 สร้างงานลำดับความสำคัญสูง: ${createdTask.title}`);
        }

        return createdTask;
    }

    /**
     * อัพเดท task พร้อมกฎทางธุรกิจ
     */
    async updateTask(id, updates) {
        // ตรวจสอบว่า task มีอยู่จริง
        const existingTask = await this.getTaskById(id);

        // ตรวจสอบการอัพเดท
        if (updates.title !== undefined) {
            const tempTask = new Task({ ...existingTask, ...updates });
            const validation = tempTask.isValid();
            if (!validation.valid) {
                throw new Error(`ข้อมูลไม่ถูกต้อง: ${validation.errors.join(', ')}`);
            }
        }

        // กฎทางธุรกิจ: ไม่สามารถเปลี่ยนจาก DONE กลับไปเป็น TODO
        if (existingTask.status === 'DONE' && updates.status === 'TODO') {
            throw new Error('ไม่สามารถเปลี่ยนงานที่เสร็จแล้วกลับไปเป็น TODO ได้');
        }

        // กฎทางธุรกิจ: HIGH priority ต้องมี description
        if (updates.priority === 'HIGH' && !existingTask.description && !updates.description) {
            throw new Error('งานลำดับความสำคัญสูงต้องมีรายละเอียด');
        }

        const updatedTask = await taskRepository.update(id, updates);

        // บันทึก log เมื่อเปลี่ยน status
        if (updates.status && updates.status !== existingTask.status) {
            console.log(`📝 เปลี่ยนสถานะ task ${id}: ${existingTask.status} → ${updates.status}`);
        }

        return updatedTask;
    }

    /**
     * ลบ task พร้อมกฎทางธุรกิจ
     */
    async deleteTask(id) {
        // ตรวจสอบว่า task มีอยู่จริง
        const task = await this.getTaskById(id);

        // กฎทางธุรกิจ: บันทึก log เมื่อลบงานสำคัญ
        if (task.priority === 'HIGH') {
            console.log(`⚠️ กำลังลบงานลำดับความสำคัญสูง: ${task.title}`);
        }

        return await taskRepository.delete(id);
    }

    /**
     * ดึงสถิติ tasks
     */
    async getStatistics() {
        const counts = await taskRepository.countByStatus();
        const allTasks = await taskRepository.findAll();

        return {
            total: allTasks.length,
            byStatus: {
                TODO: counts.TODO || 0,
                IN_PROGRESS: counts.IN_PROGRESS || 0,
                DONE: counts.DONE || 0
            },
            byPriority: {
                LOW: allTasks.filter(t => t.priority === 'LOW').length,
                MEDIUM: allTasks.filter(t => t.priority === 'MEDIUM').length,
                HIGH: allTasks.filter(t => t.priority === 'HIGH').length
            }
        };
    }

    /**
     * เลื่อนงานไปสถานะถัดไป
     */
    async moveToNextStatus(id) {
        const task = await this.getTaskById(id);
        
        const statusFlow = {
            'TODO': 'IN_PROGRESS',
            'IN_PROGRESS': 'DONE',
            'DONE': 'DONE'
        };

        const nextStatus = statusFlow[task.status];
        
        if (nextStatus === task.status) {
            throw new Error('งานนี้เสร็จสมบูรณ์แล้ว');
        }

        return await this.updateTask(id, { status: nextStatus });
    }
}

module.exports = new TaskService();
```

### 2.6 สร้าง Presentation Layer - Controller (15 นาที)

**src/controllers/taskController.js:**
```javascript
const taskService = require('../services/taskService');

class TaskController {
    /**
     * GET /api/tasks
     * ดึง tasks ทั้งหมดพร้อมตัวกรอง
     */
    async getAllTasks(req, res, next) {
        try {
            const filters = {};
            
            if (req.query.status) {
                filters.status = req.query.status.toUpperCase();
            }
            if (req.query.priority) {
                filters.priority = req.query.priority.toUpperCase();
            }

            const tasks = await taskService.getAllTasks(filters);
            
            res.json({
                success: true,
                data: tasks,
                count: tasks.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/tasks/:id
     * ดึง task ตาม ID
     */
    async getTaskById(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID ไม่ถูกต้อง'
                });
            }

            const task = await taskService.getTaskById(id);
            
            res.json({
                success: true,
                data: task
            });
        } catch (error) {
            if (error.message.includes('ไม่พบ')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * POST /api/tasks
     * สร้าง task ใหม่
     */
    async createTask(req, res, next) {
        try {
            const taskData = {
                title: req.body.title,
                description: req.body.description,
                status: req.body.status,
                priority: req.body.priority
            };

            const task = await taskService.createTask(taskData);
            
            res.status(201).json({
                success: true,
                data: task,
                message: 'สร้างงานสำเร็จ'
            });
        } catch (error) {
            if (error.message.includes('ข้อมูลไม่ถูกต้อง') || 
                error.message.includes('ต้องมีรายละเอียด')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * PUT /api/tasks/:id
     * อัพเดท task
     */
    async updateTask(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID ไม่ถูกต้อง'
                });
            }

            const updates = {};
            if (req.body.title !== undefined) updates.title = req.body.title;
            if (req.body.description !== undefined) updates.description = req.body.description;
            if (req.body.status !== undefined) updates.status = req.body.status;
            if (req.body.priority !== undefined) updates.priority = req.body.priority;

            const task = await taskService.updateTask(id, updates);
            
            res.json({
                success: true,
                data: task,
                message: 'อัพเดทงานสำเร็จ'
            });
        } catch (error) {
            if (error.message.includes('ไม่พบ')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.message.includes('ข้อมูลไม่ถูกต้อง') || 
                error.message.includes('ไม่สามารถ')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * DELETE /api/tasks/:id
     * ลบ task
     */
    async deleteTask(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID ไม่ถูกต้อง'
                });
            }

            await taskService.deleteTask(id);
            
            res.json({
                success: true,
                message: 'ลบงานสำเร็จ'
            });
        } catch (error) {
            if (error.message.includes('ไม่พบ')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }

    /**
     * GET /api/tasks/stats
     * ดึงสถิติ tasks
     */
    async getStatistics(req, res, next) {
        try {
            const stats = await taskService.getStatistics();
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/tasks/:id/next-status
     * เลื่อนงานไปสถานะถัดไป
     */
    async moveToNextStatus(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    error: 'ID ไม่ถูกต้อง'
                });
            }

            const task = await taskService.moveToNextStatus(id);
            
            res.json({
                success: true,
                data: task,
                message: 'เปลี่ยนสถานะงานสำเร็จ'
            });
        } catch (error) {
            if (error.message.includes('ไม่พบ')) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            if (error.message.includes('เสร็จสมบูรณ์แล้ว')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    }
}

module.exports = new TaskController();
```

### 2.7 สร้าง Middleware (10 นาที)

**src/middleware/errorHandler.js:**
```javascript
/**
 * Middleware จัดการ errors ทั้งหมด
 */
function errorHandler(err, req, res, next) {
    console.error('❌ เกิดข้อผิดพลาด:', err);

    // Default error
    let statusCode = 500;
    let message = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์';

    // Database errors
    if (err.message && err.message.includes('SQLITE')) {
        statusCode = 500;
        message = 'เกิดข้อผิดพลาดในฐานข้อมูล';
    }

    // Validation errors
    if (err.message && err.message.includes('ข้อมูลไม่ถูกต้อง')) {
        statusCode = 400;
        message = err.message;
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

module.exports = errorHandler;
```

**src/utils/logger.js:**
```javascript
/**
 * Logger utility
 */
class Logger {
    info(message, ...args) {
        console.log(`ℹ️  [INFO] ${message}`, ...args);
    }

    error(message, ...args) {
        console.error(`❌ [ERROR] ${message}`, ...args);
    }

    warn(message, ...args) {
        console.warn(`⚠️  [WARN] ${message}`, ...args);
    }

    debug(message, ...args) {
        if (process.env.LOG_LEVEL === 'debug') {
            console.log(`🐛 [DEBUG] ${message}`, ...args);
        }
    }
}

module.exports = new Logger();
```

### 2.8 อัพเดท Server File (10 นาที)

**server.js:**
```javascript
require('dotenv').config();
const express = require('express');
const database = require('./database/connection');
const taskController = require('./src/controllers/taskController');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Routes - Statistics (ต้องอยู่ก่อน :id routes)
app.get('/api/tasks/stats', taskController.getStatistics.bind(taskController));

// Routes - CRUD
app.get('/api/tasks', taskController.getAllTasks.bind(taskController));
app.get('/api/tasks/:id', taskController.getTaskById.bind(taskController));
app.post('/api/tasks', taskController.createTask.bind(taskController));
app.put('/api/tasks/:id', taskController.updateTask.bind(taskController));
app.delete('/api/tasks/:id', taskController.deleteTask.bind(taskController));

// Routes - Special actions
app.patch('/api/tasks/:id/next-status', taskController.moveToNextStatus.bind(taskController));

// Error handling middleware (ต้องอยู่สุดท้าย)
app.use(errorHandler);

// เริ่ม server
async function startServer() {
    try {
        // เชื่อมต่อฐานข้อมูล
        await database.connect();
        
        // เริ่ม Express server
        app.listen(PORT, () => {
            logger.info(`🚀 เซิร์ฟเวอร์ทำงานที่ http://localhost:${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        logger.error('ไม่สามารถเริ่มเซิร์ฟเวอร์ได้:', error);
        process.exit(1);
    }
}

// จัดการการปิดอย่างถูกต้อง
process.on('SIGINT', async () => {
    logger.info('กำลังปิดเซิร์ฟเวอร์...');
    await database.close();
    process.exit(0);
});

startServer();


### 3.2 Checklist การทดสอบ



## โครงสร้างโปรเจกต์
```
week4-layered/
├── src/
│   ├── controllers/    # Presentation Layer
│   ├── services/       # Business Logic Layer
│   ├── repositories/   # Data Access Layer
│   ├── models/         # Data Models
│   └── middleware/     # Express middleware
├── database/
├── public/
└── server.js
```


┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                    │
│                    (HTML/CSS/JavaScript)                │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           ▼
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER (Controllers)           │
│                                                         │
│  ┌──────────────┐    ┌─────────────────────────┐        │
│  │Task          │    │  - Input Validation     │        │
│  │Controller    │───▶│  - Response Formatting  │        │
│  └──────────────┘    │  - HTTP Error Handling  │        │
│                      └─────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│            BUSINESS LOGIC LAYER (Services)              │
│                                                         │
│  ┌──────────────┐    ┌─────────────────────────┐        │
│  │Task          │    │  - Business Rules       │        │
│  │Service       │───▶│  - Validation Logic     │        │
│  └──────────────┘    │  - Orchestration        │        │
│                      └─────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           DATA ACCESS LAYER (Repositories)              │
│                                                         │
│  ┌──────────────┐    ┌─────────────────────────┐        │
│  │Task          │    │  - CRUD Operations      │        │
│  │Repository    │───▶│  - Query Execution      │        │
│  └──────────────┘    │  - Data Mapping         │        │
│                      └─────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   DATABASE   │
                   │   (SQLite)   │
                   └──────────────┘

## Data Flow Example: Create Task

1. Client sends POST /api/tasks
   ↓
2. TaskController.createTask()
   - Validates HTTP request
   - Extracts data
   ↓
3. TaskService.createTask(data)
   - Validates business rules
   - Applies business logic
   ↓
4. TaskRepository.create(task)
   - Executes SQL INSERT
   - Returns created task
   ↓
5. Response flows back up
   Repository → Service → Controller → Client