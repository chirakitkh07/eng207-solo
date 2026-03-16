# Student Management System – Layered Architecture

## C1. บริบท (Context)

โปรเจกต์นี้เป็น ระบบจัดการข้อมูลนักศึกษา (Student Management System)
พัฒนาด้วย สถาปัตยกรรมแบบ Layered Architecture (3-tier) เพื่อแยกความรับผิดชอบของระบบออกจากกันอย่างชัดเจน

ระบบนี้ช่วยให้ผู้ดูแลระบบสามารถ:

เพิ่ม แก้ไข และลบข้อมูลนักศึกษา

อัปเดตสถานะนักศึกษา (active, graduated, suspended, withdrawn)

อัปเดตเกรดเฉลี่ย (GPA)

ดูรายชื่อนักศึกษาและสถิติภาพรวมของระบบ

สถาปัตยกรรมของระบบถูกแบ่งออกเป็น 3 ชั้นหลัก ได้แก่:

Presentation Layer: จัดการ HTTP requests/responses และการเชื่อมต่อกับ UI

Business Logic Layer: ตรวจสอบกฎธุรกิจและความถูกต้องของข้อมูล

Data Access Layer: จัดการการเข้าถึงฐานข้อมูล SQLite 

## C2. แผนภาพ Container Diagram

```
┌─────────────────────────────────────┐
│     Presentation Layer              │
│  ┌──────────────────────────────┐   │
│  │ Routes → Controllers         │   │
│  │ (HTTP Handling)              │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Business Logic Layer            │
│  ┌──────────────────────────────┐   │
│  │ Services → Validators        │   │
│  │ (Business Rules)             │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Data Access Layer               │
│  ┌──────────────────────────────┐   │
│  │ Repositories → Database      │   │
│  │ (SQL Queries)                │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ▼
          ┌──────────┐
          │  SQLite  │
          └──────────┘


## หน้าที่ของแต่ละชั้น (Responsibilities)

### 1. Presentation Layer

จัดการ HTTP requests (GET, POST, PUT, PATCH, DELETE)

รับ request จาก Client (Web UI หรือ API Client)

เรียกใช้ Controller เพื่อประมวลผลคำสั่ง

ส่ง JSON response หรือ error กลับไปยัง Client

ไม่มี business logic หรือการติดต่อฐานข้อมูลโดยตรง

ตัวอย่างไฟล์

studentRoutes.js

studentController.js

errorHandler.js

### 2. Business Logic Layer

Services จัดการกฎธุรกิจของระบบนักศึกษา เช่น:

ไม่อนุญาตให้ลบนักศึกษาที่มีสถานะ active

ตรวจสอบช่วงค่า GPA ให้อยู่ระหว่าง 0.0 – 4.0

สร้างสถิติ (active, graduated, suspended, total, average GPA)

Validators ตรวจสอบความถูกต้องของข้อมูล เช่น:

รหัสนักศึกษา (10 หลัก)

รูปแบบอีเมล

ค่าที่อนุญาตของ major และ status

ส่ง error กลับไปยัง Presentation Layer หากข้อมูลหรือกฎธุรกิจไม่ผ่าน

ตัวอย่างไฟล์

studentService.js

studentValidator.js

### 3. Data Access Layer

Repositories จัดการ CRUD operations กับฐานข้อมูล

ติดต่อกับ SQLite โดยตรง

ไม่มี business logic หรือ validation

แปลงข้อมูลจาก database row เป็น JavaScript object

ตัวอย่างไฟล์

studentRepository.js

connection.js 

### 4. Database (SQLite)

ใช้ SQLite เป็นฐานข้อมูลของระบบ

เก็บข้อมูลนักศึกษาในตาราง students โดยมีฟิลด์หลัก เช่น:

id

student_code

first_name

last_name

email

major

gpa

status

created_at 

---

## การไหลของข้อมูล (Data Flow: Request → Response)

1. **Client** ส่ง HTTP request (จาก UI หรือ API)  
2. **Routes** ใน Presentation Layer รับ request และส่งต่อไปยัง **Controller**  
3. **Controller** เรียก **Service** ใน Business Logic Layer  
4. **Service** ตรวจสอบข้อมูลผ่าน **Validators** และประยุกต์กฎธุรกิจ  
5. หากต้องการ **Service** จะเรียก **Repository** ใน Data Access Layer เพื่ออ่าน/เขียน SQLite  
6. **Repository** คืนผลลัพธ์กลับไปยัง **Service**  
7. **Controller** จัดรูปแบบ response และส่ง JSON กลับ **Client**  
8. **Client** แสดงผลบน UI  

---
### ตัวอย่าง
```
Client (กด "Update GPA")
↓
Route PATCH /api/students/:id/gpa
↓
StudentController.updateGPA()
↓
StudentService.updateGPA()
↓
StudentValidator.validateGPA()
↓
StudentRepository.updateGPA(id, newGPA)
↓
SQLite อัปเดตข้อมูล GPA
↑
StudentService คืนข้อมูลนักศึกษาที่อัปเดต
↑
StudentController ส่ง JSON response
↑
Client UI แสดงค่า GPA ใหม่

