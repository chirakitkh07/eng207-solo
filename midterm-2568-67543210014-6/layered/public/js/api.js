// frontend/js/api.js - API Client for Student Management
class StudentAPI {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    
    async getAllStudents(major = null, status = null) {
        let url = `${this.baseURL}/students`;
        const params = [];
        
        if (major) params.push(`major=${major}`);
        if (status) params.push(`status=${status}`);
        
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }
        return await response.json();
    }
    
    async getStudentById(id) {
        const response = await fetch(`${this.baseURL}/students/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch student');
        }
        return await response.json();
    }
    
    async createStudent(studentData) {
        const response = await fetch(`${this.baseURL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        return await response.json();
    }
    
    async updateStudent(id, studentData) {
        const response = await fetch(`${this.baseURL}/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        return await response.json();
    }
    
    async updateGPA(id, gpa) {
        const response = await fetch(`${this.baseURL}/students/${id}/gpa`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gpa })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        return await response.json();
    }
    
    async updateStatus(id, status) {
        const response = await fetch(`${this.baseURL}/students/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        return await response.json();
    }
    
    async deleteStudent(id) {
        const response = await fetch(`${this.baseURL}/students/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        return await response.json();
    }
}

// 🆕 สำคัญ! เปลี่ยน URL ตาม environment
const API_BASE_URL = 'http://localhost:3000/api';  // Local testing
// const API_BASE_URL = 'http://<VM-IP>:3000/api';  // Production (ใช้ IP ของ VM)

const api = new StudentAPI(API_BASE_URL);