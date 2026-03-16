// src/business/services/studentService.js
const studentRepository = require('../../data/repositories/studentRepository');
const studentValidator = require('../validators/studentValidator');

// ----------------------------
// Simple HTTP-friendly errors
// ----------------------------
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class StudentService {
  // GET /api/students?major=&status=
  async getAllStudents(major = null, status = null) {
    // 1) Validate filters (if provided)
    try {
      if (major !== null && major !== undefined && major !== '') {
        studentValidator.validateMajor(major);
      } else {
        major = null;
      }

      if (status !== null && status !== undefined && status !== '') {
        studentValidator.validateStatus(status);
      } else {
        status = null;
      }
    } catch (e) {
      throw new ValidationError(e.message || 'Invalid filters');
    }

    // 2) Repo: fetch data
    const students = await studentRepository.findAll(major, status);

    // 3) Compute statistics (for dashboard UI)
    const stats = this.#computeStatistics(students);

    // 4) Return combined result
    return { students, statistics: stats };
  }

  // GET /api/students/:id
  async getStudentById(id) {
    // 1) Validate ID
    try {
      studentValidator.validateId(id);
    } catch (e) {
      throw new ValidationError(e.message || 'Invalid id');
    }

    // 2) Repo fetch
    const student = await studentRepository.findById(Number(id));

    // 3) Not found
    if (!student) {
      throw new NotFoundError(`Student id=${id} not found`);
    }

    // 4) Return
    return student;
  }

  // POST /api/students
  async createStudent(studentData) {
    // 1) Validate required fields + formats
    try {
      studentValidator.validateCreateStudent(studentData);
      // ถ้า validator ของคุณแยกเป็นราย field ให้ใช้แบบนี้แทน:
      // studentValidator.validateStudentCode(studentData.student_code);
      // studentValidator.validateEmail(studentData.email);
      // studentValidator.validateMajor(studentData.major);
      // studentValidator.validateName(studentData.first_name, 'first_name');
      // studentValidator.validateName(studentData.last_name, 'last_name');
    } catch (e) {
      throw new ValidationError(e.message || 'Invalid student data');
    }

    // 2) Prevent duplicate student_code/email (ถ้า repo รองรับตรวจซ้ำ)
    // (ถ้า repo ของคุณไม่มี findByStudentCode/findByEmail ให้ข้ามส่วนนี้ได้)
    if (typeof studentRepository.findByStudentCode === 'function') {
      const existed = await studentRepository.findByStudentCode(studentData.student_code);
      if (existed) throw new ConflictError('student_code already exists');
    }
    if (typeof studentRepository.findByEmail === 'function') {
      const existed = await studentRepository.findByEmail(studentData.email);
      if (existed) throw new ConflictError('email already exists');
    }

    // 3) Set defaults
    const payload = {
      student_code: studentData.student_code,
      first_name: studentData.first_name,
      last_name: studentData.last_name,
      email: studentData.email,
      major: studentData.major,
      gpa: (studentData.gpa === undefined || studentData.gpa === null || studentData.gpa === '') ? 0.0 : Number(studentData.gpa),
      status: studentData.status || 'active'
    };

    // Validate defaults too
    try {
      studentValidator.validateGPA(payload.gpa);
      studentValidator.validateStatus(payload.status);
    } catch (e) {
      throw new ValidationError(e.message);
    }

    // 4) Create
    const created = await studentRepository.create(payload);
    return created;
  }

  // PUT /api/students/:id
  async updateStudent(id, studentData) {
    // 1) Validate ID
    try {
      studentValidator.validateId(id);
    } catch (e) {
      throw new ValidationError(e.message || 'Invalid id');
    }

    // 2) Ensure target exists
    const existing = await studentRepository.findById(Number(id));
    if (!existing) {
      throw new NotFoundError(`Student id=${id} not found`);
    }

    // 3) Validate update payload (อนุญาตเฉพาะ field ที่แก้ได้)
    // โดยทั่วไป PUT จะส่งข้อมูลครบชุด (student_code, first_name, last_name, email, major)
    try {
      studentValidator.validateUpdateStudent(studentData);
      // หรือถ้าไม่มี validateUpdateStudent ให้ validate ทีละ field:
      // if (studentData.student_code !== undefined) studentValidator.validateStudentCode(studentData.student_code);
      // if (studentData.email !== undefined) studentValidator.validateEmail(studentData.email);
      // if (studentData.major !== undefined) studentValidator.validateMajor(studentData.major);
      // if (studentData.first_name !== undefined) studentValidator.validateName(studentData.first_name, 'first_name');
      // if (studentData.last_name !== undefined) studentValidator.validateName(studentData.last_name, 'last_name');
    } catch (e) {
      throw new ValidationError(e.message || 'Invalid update data');
    }

    // 4) Prevent duplicates if changing student_code/email
    if (
      typeof studentRepository.findByStudentCode === 'function' &&
      studentData.student_code &&
      studentData.student_code !== existing.student_code
    ) {
      const existed = await studentRepository.findByStudentCode(studentData.student_code);
      if (existed) throw new ConflictError('student_code already exists');
    }

    if (
      typeof studentRepository.findByEmail === 'function' &&
      studentData.email &&
      studentData.email !== existing.email
    ) {
      const existed = await studentRepository.findByEmail(studentData.email);
      if (existed) throw new ConflictError('email already exists');
    }

    // 5) Update via repository
    const updated = await studentRepository.update(Number(id), {
      student_code: studentData.student_code,
      first_name: studentData.first_name,
      last_name: studentData.last_name,
      email: studentData.email,
      major: studentData.major
      // โดยปกติ PUT ของโจทย์ “ไม่แก้ gpa/status” ให้แยก endpoint เฉพาะอยู่แล้ว
    });

    return updated;
  }

  // PATCH /api/students/:id/gpa
  async updateGPA(id, gpa) {
    // 1) Validate ID + GPA
    try {
      studentValidator.validateId(id);
      studentValidator.validateGPA(gpa);
    } catch (e) {
      throw new ValidationError(e.message || 'Invalid GPA or id');
    }

    // 2) Ensure exists
    const existing = await studentRepository.findById(Number(id));
    if (!existing) {
      throw new NotFoundError(`Student id=${id} not found`);
    }

    // 3) Update GPA
    const updated = await studentRepository.updateGPA(Number(id), Number(gpa));
    return updated;
  }

  // PATCH /api/students/:id/status
  async updateStatus(id, status) {
    // 1) Validate ID + status
    try {
      studentValidator.validateId(id);
      studentValidator.validateStatus(status);
    } catch (e) {
      throw new ValidationError(e.message || 'Invalid status or id');
    }

    // 2) Ensure exists
    const existing = await studentRepository.findById(Number(id));
    if (!existing) {
      throw new NotFoundError(`Student id=${id} not found`);
    }

    // 3) Business rule: withdrawn cannot be changed
    if (String(existing.status).toLowerCase() === 'withdrawn') {
      throw new ConflictError('Cannot change status of withdrawn student');
    }

    // (Optional rule) ถ้าอยากป้องกันเปลี่ยนไปค่าเดิม
    if (String(existing.status).toLowerCase() === String(status).toLowerCase()) {
      return existing;
    }

    // 4) Update
    const updated = await studentRepository.updateStatus(Number(id), status);
    return updated;
  }

  // DELETE /api/students/:id
  async deleteStudent(id) {
    // 1) Validate ID
    try {
      studentValidator.validateId(id);
    } catch (e) {
      throw new ValidationError(e.message || 'Invalid id');
    }

    // 2) Ensure exists
    const existing = await studentRepository.findById(Number(id));
    if (!existing) {
      throw new NotFoundError(`Student id=${id} not found`);
    }

    // 3) Business rule: cannot delete active student
    if (String(existing.status).toLowerCase() === 'active') {
      throw new ConflictError('Cannot delete active student. Change status first.');
    }

    // 4) Delete
    await studentRepository.delete(Number(id));
    return { message: 'Student deleted successfully' };
  }

  // ----------------------------
  // Private helper: statistics
  // ----------------------------
  #computeStatistics(students) {
    const stats = {
      active: 0,
      graduated: 0,
      suspended: 0,
      withdrawn: 0,
      total: students.length,
      averageGPA: 0.0
    };

    let sumGPA = 0;
    let gpaCount = 0;

    for (const s of students) {
      const st = String(s.status || '').toLowerCase();
      if (st === 'active') stats.active += 1;
      else if (st === 'graduated') stats.graduated += 1;
      else if (st === 'suspended') stats.suspended += 1;
      else if (st === 'withdrawn') stats.withdrawn += 1;

      const gpa = Number(s.gpa);
      if (!Number.isNaN(gpa)) {
        sumGPA += gpa;
        gpaCount += 1;
      }
    }

    stats.averageGPA = gpaCount === 0 ? 0.0 : Number((sumGPA / gpaCount).toFixed(2));
    return stats;
  }
}

module.exports = new StudentService();
