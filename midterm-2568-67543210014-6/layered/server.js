// server.js - Layered Student Management System
const express = require('express');
const path = require('path');

const studentRoutes = require('./src/presentation/routes/studentRoutes');
const errorHandler = require('./src/presentation/middlewares/errorHandler');

// (แนะนำ) เรียก connection เพื่อให้สร้างตาราง/เชื่อม DB ตั้งแต่เริ่ม
// ถ้า connection.js ของคุณ export เป็น side-effect ก็แค่ require ครั้งเดียวพอ
require('./src/data/database/connection');

const app = express();

// ---- Middlewares ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve UI (Layered UI อยู่ใน public/)
app.use(express.static(path.join(__dirname, 'public')));

// ---- Routes ----
app.use('/api/students', studentRoutes);

// Health check (optional แต่ช่วยเทสดี)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---- Error Handler (ต้องอยู่ล่างสุด) ----
app.use(errorHandler);

// ---- Start server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Student Management System running on http://localhost:${PORT}`);
});
