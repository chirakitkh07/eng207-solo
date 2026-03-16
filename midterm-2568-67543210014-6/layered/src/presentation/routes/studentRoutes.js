// src/presentation/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// ==============================
// Student Routes
// Base path: /api/students
// ==============================

// GET /api/students?major=&status=
router.get('/', studentController.getAllStudents);

// GET /api/students/:id
router.get('/:id', studentController.getStudentById);

// POST /api/students
router.post('/', studentController.createStudent);

// PUT /api/students/:id
router.put('/:id', studentController.updateStudent);

// PATCH /api/students/:id/gpa
router.patch('/:id/gpa', studentController.updateGPA);

// PATCH /api/students/:id/status
router.patch('/:id/status', studentController.updateStatus);

// DELETE /api/students/:id
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
