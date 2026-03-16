// Global state
        let currentStatusFilter = 'all';
        let currentMajorFilter = 'all';
        
        // Load students on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadStudents();
        });
        
        // Load students from API
        async function loadStudents(status = null, major = null) {
            try {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('student-list').style.display = 'none';
                
                let url = '/api/students';
                const params = [];
                if (status) params.push(`status=${status}`);
                if (major) params.push(`major=${major}`);
                if (params.length > 0) url += '?' + params.join('&');
                
                const response = await fetch(url);
                const data = await response.json();
                
                displayStudents(data.students);
                updateStatistics(data.statistics);
                
                document.getElementById('loading').style.display = 'none';
                document.getElementById('student-list').style.display = 'grid';
                
            } catch (error) {
                console.error('Error loading students:', error);
                alert('Failed to load students. Please try again.');
                document.getElementById('loading').style.display = 'none';
            }
        }
        
        // Display students in grid
        function displayStudents(students) {
            const container = document.getElementById('student-list');
            
            if (students.length === 0) {
                container.innerHTML = '<div class="no-students">🎓 No students found</div>';
                return;
            }
            
            container.innerHTML = students.map(student => {
                const gpaClass = getGPAClass(student.gpa);
                return `
                    <div class="student-card">
                        <div class="student-header">
                            <div>
                                <h3>${escapeHtml(student.first_name)} ${escapeHtml(student.last_name)}</h3>
                                <span class="student-code">🆔 ${escapeHtml(student.student_code)}</span>
                            </div>
                            <span class="status-badge status-${student.status}">
                                ${student.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div class="student-details">
                            <div class="detail-row">
                                <span class="detail-label">📧 Email:</span>
                                <span class="detail-value">${escapeHtml(student.email)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">📚 Major:</span>
                                <span class="detail-value">${escapeHtml(student.major)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">📊 GPA:</span>
                                <span class="gpa-badge ${gpaClass}">${student.gpa.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="actions">
                            <button class="btn btn-info" onclick="showGPAModal(${student.id}, ${student.gpa})">Update GPA</button>
                            <button class="btn btn-warning" onclick="showStatusModal(${student.id}, '${student.status}')">Change Status</button>
                            <button class="btn btn-secondary" onclick="editStudent(${student.id})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteStudent(${student.id}, '${student.status}')">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Get GPA class for color coding
        function getGPAClass(gpa) {
            if (gpa >= 3.5) return 'gpa-excellent';
            if (gpa >= 3.0) return 'gpa-good';
            if (gpa >= 2.0) return 'gpa-fair';
            return 'gpa-poor';
        }
        
        // Update statistics
        function updateStatistics(stats) {
            document.getElementById('stat-active').textContent = stats.active;
            document.getElementById('stat-graduated').textContent = stats.graduated;
            document.getElementById('stat-suspended').textContent = stats.suspended;
            document.getElementById('stat-total').textContent = stats.total;
            document.getElementById('stat-gpa').textContent = stats.averageGPA.toFixed(2);
        }
        
        // Filter students
        function filterStudents(status, major) {
            currentStatusFilter = status;
            currentMajorFilter = major;
            
            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Load students with filter
            loadStudents(
                status === 'all' ? null : status,
                major === 'all' ? null : major
            );
        }
        
        // Show add student modal
        function showAddModal() {
            document.getElementById('modal-title').textContent = 'Add New Student';
            document.getElementById('student-form').reset();
            document.getElementById('student-id').value = '';
            document.getElementById('student-modal').style.display = 'flex';
        }
        
        // Close modal
        function closeModal() {
            document.getElementById('student-modal').style.display = 'none';
        }
        
        // Handle form submit
        async function handleSubmit(event) {
            event.preventDefault();
            
            const id = document.getElementById('student-id').value;
            const studentData = {
                student_code: document.getElementById('student_code').value,
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                email: document.getElementById('email').value,
                major: document.getElementById('major').value
            };
            
            try {
                let response;
                if (id) {
                    // Update existing student
                    response = await fetch(`/api/students/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(studentData)
                    });
                } else {
                    // Create new student
                    response = await fetch('/api/students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(studentData)
                    });
                }
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error);
                }
                
                alert(id ? 'Student updated successfully!' : 'Student added successfully!');
                closeModal();
                loadStudents(
                    currentStatusFilter === 'all' ? null : currentStatusFilter,
                    currentMajorFilter === 'all' ? null : currentMajorFilter
                );
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        // Edit student
        async function editStudent(id) {
            try {
                const response = await fetch(`/api/students/${id}`);
                const student = await response.json();
                
                document.getElementById('modal-title').textContent = 'Edit Student';
                document.getElementById('student-id').value = student.id;
                document.getElementById('student_code').value = student.student_code;
                document.getElementById('first_name').value = student.first_name;
                document.getElementById('last_name').value = student.last_name;
                document.getElementById('email').value = student.email;
                document.getElementById('major').value = student.major;
                
                document.getElementById('student-modal').style.display = 'flex';
                
            } catch (error) {
                alert('Error loading student details: ' + error.message);
            }
        }
        
        // Show GPA modal
        function showGPAModal(id, currentGPA) {
            document.getElementById('gpa-student-id').value = id;
            document.getElementById('gpa').value = currentGPA.toFixed(2);
            document.getElementById('gpa-modal').style.display = 'flex';
        }
        
        // Close GPA modal
        function closeGPAModal() {
            document.getElementById('gpa-modal').style.display = 'none';
        }
        
        // Handle GPA submit
        async function handleGPASubmit(event) {
            event.preventDefault();
            
            const id = document.getElementById('gpa-student-id').value;
            const gpa = parseFloat(document.getElementById('gpa').value);
            
            try {
                const response = await fetch(`/api/students/${id}/gpa`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gpa })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error);
                }
                
                alert('GPA updated successfully!');
                closeGPAModal();
                loadStudents(
                    currentStatusFilter === 'all' ? null : currentStatusFilter,
                    currentMajorFilter === 'all' ? null : currentMajorFilter
                );
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        // Show status modal
        function showStatusModal(id, currentStatus) {
            document.getElementById('status-student-id').value = id;
            document.getElementById('status').value = currentStatus;
            document.getElementById('status-modal').style.display = 'flex';
        }
        
        // Close status modal
        function closeStatusModal() {
            document.getElementById('status-modal').style.display = 'none';
        }
        
        // Handle status submit
        async function handleStatusSubmit(event) {
            event.preventDefault();
            
            const id = document.getElementById('status-student-id').value;
            const status = document.getElementById('status').value;
            
            try {
                const response = await fetch(`/api/students/${id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error);
                }
                
                alert('Status updated successfully!');
                closeStatusModal();
                loadStudents(
                    currentStatusFilter === 'all' ? null : currentStatusFilter,
                    currentMajorFilter === 'all' ? null : currentMajorFilter
                );
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        // Delete student
        async function deleteStudent(id, status) {
            if (status === 'active') {
                alert('Cannot delete active student. Change status first.');
                return;
            }
            
            if (!confirm('Are you sure you want to delete this student?')) return;
            
            try {
                const response = await fetch(`/api/students/${id}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error);
                }
                
                alert('Student deleted successfully!');
                loadStudents(
                    currentStatusFilter === 'all' ? null : currentStatusFilter,
                    currentMajorFilter === 'all' ? null : currentMajorFilter
                );
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return String(text).replace(/[&<>"']/g, m => map[m]);
        }