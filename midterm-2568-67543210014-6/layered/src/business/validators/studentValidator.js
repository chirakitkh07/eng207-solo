// src/business/validators/studentValidator.js
class StudentValidator {
    validateStudentData(data) {
        const { student_code, first_name, last_name, email, major } = data;
        
        if (!student_code || !first_name || !last_name || !email || !major) {
            throw new Error('All fields are required');
        }
        
        return true;
    }
    
    validateStudentCode(code) {
        // TODO: Validate student code format
        // Format: YYXXXXX (10 digits)
        const codePattern = /^\d{10}$/;
        
        if (!codePattern.test(code)) {
            throw new Error('Invalid student code format (must be 10 digits)');
        }
        
        return true;
    }
    
    validateEmail(email) {
        // TODO: Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailPattern.test(email)) {
            throw new Error('Invalid email format');
        }
        
        return true;
    }
    
    validateMajor(major) {
        // TODO: Validate major
        const validMajors = ['CS', 'SE', 'IT', 'CE', 'DS'];
        
        if (!validMajors.includes(major)) {
            throw new Error('Invalid major. Must be one of: CS, SE, IT, CE, DS');
        }
        
        return true;
    }
    
    validateGPA(gpa) {
        // TODO: Validate GPA range
        if (gpa < 0 || gpa > 4.0) {
            throw new Error('GPA must be between 0.0 and 4.0');
        }
        
        return true;
    }
    
    validateStatus(status) {
        // TODO: Validate status
        const validStatuses = ['active', 'graduated', 'suspended', 'withdrawn'];
        
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status. Must be one of: active, graduated, suspended, withdrawn');
        }
        
        return true;
    }
    
    validateId(id) {
        const numId = parseInt(id);
        if (isNaN(numId) || numId <= 0) {
            throw new Error('Invalid student ID');
        }
        return numId;
    }
}

module.exports = new StudentValidator();