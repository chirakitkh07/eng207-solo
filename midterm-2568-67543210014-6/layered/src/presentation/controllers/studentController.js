// src/presentation/controllers/studentController.js
const studentService = require('../../business/services/studentService');

class StudentController {
  // GET /api/students?major=&status=
  async getAllStudents(req, res, next) {
    try {
      const { major = null, status = null } = req.query;

      const result = await studentService.getAllStudents(
        major && major !== '' ? major : null,
        status && status !== '' ? status : null
      );

      // result = { students, statistics }
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/students/:id
  async getStudentById(req, res, next) {
    try {
      const { id } = req.params;

      const student = await studentService.getStudentById(id);
      return res.status(200).json(student);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/students
  async createStudent(req, res, next) {
    try {
      const studentData = req.body;

      const created = await studentService.createStudent(studentData);
      return res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/students/:id
  async updateStudent(req, res, next) {
    try {
      const { id } = req.params;
      const studentData = req.body;

      const updated = await studentService.updateStudent(id, studentData);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/students/:id/gpa
  async updateGPA(req, res, next) {
    try {
      const { id } = req.params;
      const { gpa } = req.body;

      const updated = await studentService.updateGPA(id, gpa);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/students/:id/status
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await studentService.updateStatus(id, status);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/students/:id
  async deleteStudent(req, res, next) {
    try {
      const { id } = req.params;

      const result = await studentService.deleteStudent(id);

      // จะคืน 200 พร้อมข้อความ หรือจะใช้ 204 ก็ได้
      // แต่เพื่อให้ UI/debug ง่าย คืน message กลับไป
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentController();
