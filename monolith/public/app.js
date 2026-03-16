// app.js - Frontend Logic
// ENGSE207 Software Architecture - Week 3 Lab

// ========================================
// PART 1: STATE MANAGEMENT
// ========================================

let allTasks = [];
let currentFilter = 'ALL';

// ========================================
// PART 2: DOM ELEMENTS
// ========================================

const addTaskForm = document.getElementById('addTaskForm');
const statusFilter = document.getElementById('statusFilter');
const loadingOverlay = document.getElementById('loadingOverlay');

// Task list containers
const todoTasks = document.getElementById('todoTasks');
const progressTasks = document.getElementById('progressTasks');
const doneTasks = document.getElementById('doneTasks');

// Task counters
const todoCount = document.getElementById('todoCount');
const progressCount = document.getElementById('progressCount');
const doneCount = document.getElementById('doneCount');

// ========================================
// PART 3: API FUNCTIONS - FETCH TASKS
// ========================================

async function fetchTasks() {
    showLoading();
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        allTasks = data.tasks;
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        alert('❌ Failed to load tasks. Please refresh the page.');
    } finally {
        hideLoading();
    }
}

// ========================================
// PART 4: API FUNCTIONS - CREATE TASK
// ========================================

async function createTask(taskData) {
    showLoading();
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create task');
        }

        const data = await response.json();
        allTasks.unshift(data.task); // add to beginning
        renderTasks();

        // Reset form
        addTaskForm.reset();

        showToast('✅ Task created successfully!', 'success');
    } catch (error) {
        console.error('Error creating task:', error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ========================================
// PART 5: API FUNCTIONS - UPDATE STATUS
// ========================================

async function updateTaskStatus(taskId, newStatus) {
    showLoading();
    try {
        const response = await fetch(`/api/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to update status');
        }

        const data = await response.json();

        // Update task in local array
        const idx = allTasks.findIndex(t => t.id === taskId);
        if (idx !== -1) {
            allTasks[idx] = data.task;
        }

        renderTasks();
        showToast('🔄 Status updated!', 'success');
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ========================================
// PART 6: API FUNCTIONS - DELETE TASK
// ========================================

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    showLoading();
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to delete task');
        }

        // Remove from local array
        allTasks = allTasks.filter(t => t.id !== taskId);
        renderTasks();
        showToast('🗑️ Task deleted!', 'success');
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ========================================
// PART 7: RENDER FUNCTIONS - MAIN RENDER
// ========================================

function renderTasks() {
    // Clear all lists
    todoTasks.innerHTML = '';
    progressTasks.innerHTML = '';
    doneTasks.innerHTML = '';

    // Filter tasks
    let filteredTasks = allTasks;
    if (currentFilter !== 'ALL') {
        filteredTasks = allTasks.filter(task => task.status === currentFilter);
    }

    // Separate by status
    const todo = filteredTasks.filter(t => t.status === 'TODO');
    const progress = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
    const done = filteredTasks.filter(t => t.status === 'DONE');

    // Update counters (always show total from allTasks, not filtered)
    todoCount.textContent = allTasks.filter(t => t.status === 'TODO').length;
    progressCount.textContent = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
    doneCount.textContent = allTasks.filter(t => t.status === 'DONE').length;

    // Render each column
    renderTaskList(todo, todoTasks, 'TODO');
    renderTaskList(progress, progressTasks, 'IN_PROGRESS');
    renderTaskList(done, doneTasks, 'DONE');
}

// ========================================
// PART 8: RENDER FUNCTIONS - RENDER LIST
// ========================================

function renderTaskList(tasks, container, currentStatus) {
    if (tasks.length === 0) {
        const emptyMsg = currentFilter !== 'ALL' && currentStatus !== currentFilter
            ? '<div class="empty-state"><p>🔍 Filtered out</p></div>'
            : '<div class="empty-state"><p>No tasks here</p><p>Add one above! 👆</p></div>';
        container.innerHTML = emptyMsg;
        return;
    }

    tasks.forEach(task => {
        const card = createTaskCard(task, currentStatus);
        container.appendChild(card);
    });
}

// ========================================
// PART 9: RENDER FUNCTIONS - CREATE CARD
// ========================================

function createTaskCard(task, currentStatus) {
    const card = document.createElement('div');
    card.className = 'task-card';

    const priorityClass = `priority-${task.priority.toLowerCase()}`;

    card.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <span class="priority-badge ${priorityClass}">${task.priority}</span>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
            🕒 Created: ${formatDate(task.created_at)}
        </div>
        <div class="task-actions">
            ${createStatusButtons(task.id, currentStatus)}
            <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">
                🗑️ Delete
            </button>
        </div>
    `;

    return card;
}

// ========================================
// PART 10: HELPER FUNCTIONS - STATUS BUTTONS
// ========================================

function createStatusButtons(taskId, currentStatus) {
    const buttons = [];

    if (currentStatus === 'TODO') {
        buttons.push(`
            <button class="btn btn-warning btn-sm" onclick="updateTaskStatus(${taskId}, 'IN_PROGRESS')">
                → In Progress
            </button>
        `);
        buttons.push(`
            <button class="btn btn-success btn-sm" onclick="updateTaskStatus(${taskId}, 'DONE')">
                → Done
            </button>
        `);
    }

    if (currentStatus === 'IN_PROGRESS') {
        buttons.push(`
            <button class="btn btn-warning btn-sm" onclick="updateTaskStatus(${taskId}, 'TODO')">
                ← To Do
            </button>
        `);
        buttons.push(`
            <button class="btn btn-success btn-sm" onclick="updateTaskStatus(${taskId}, 'DONE')">
                → Done
            </button>
        `);
    }

    if (currentStatus === 'DONE') {
        buttons.push(`
            <button class="btn btn-warning btn-sm" onclick="updateTaskStatus(${taskId}, 'TODO')">
                ← To Do
            </button>
        `);
        buttons.push(`
            <button class="btn btn-warning btn-sm" onclick="updateTaskStatus(${taskId}, 'IN_PROGRESS')">
                ← In Progress
            </button>
        `);
    }

    return buttons.join('');
}

// ========================================
// PART 11: UTILITY FUNCTIONS
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Simple toast notification (no external library needed)
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('toast-show'), 10);
    // Remove after 2.5s
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ========================================
// PART 12: EVENT LISTENERS
// ========================================

addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;

    if (!title) {
        showToast('⚠️ Please enter a task title', 'error');
        return;
    }

    createTask({ title, description, priority });
});

statusFilter.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderTasks();
});

// ========================================
// PART 13: INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Task Board App Initialized');
    console.log('📊 Architecture: Monolithic');
    fetchTasks();
});

// ========================================
// PART 14: GLOBAL FUNCTION EXPOSURE
// ========================================

window.updateTaskStatus = updateTaskStatus;
window.deleteTask = deleteTask;
