// app.js - Final Full Implementation
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
        const data = await response.json();
        allTasks = data.tasks;
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        alert('Failed to load tasks. Please refresh the page.');
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) throw new Error('Failed to create task');

        const data = await response.json();
        allTasks.unshift(data.task); 
        renderTasks();

        addTaskForm.reset();
        alert('✅ Task created successfully!');
    } catch (error) {
        console.error('Error creating task:', error);
        alert('❌ Failed to create task.');
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

        if (!response.ok) throw new Error('Failed to update status');

        const data = await response.json();

        // update in state
        const index = allTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            allTasks[index] = data.task;
        }

        renderTasks();
    } catch (error) {
        console.error('Error updating task:', error);
        alert('❌ Failed to update status.');
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

        if (!response.ok) throw new Error('Failed to delete task');

        allTasks = allTasks.filter(task => task.id !== taskId);

        renderTasks();
        alert('🗑️ Task deleted successfully!');
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('❌ Failed to delete task.');
    } finally {
        hideLoading();
    }
}


// ========================================
// PART 7: RENDER FUNCTIONS - MAIN RENDER
// ========================================

function renderTasks() {
    todoTasks.innerHTML = '';
    progressTasks.innerHTML = '';
    doneTasks.innerHTML = '';

    let filteredTasks = currentFilter === 'ALL'
        ? allTasks
        : allTasks.filter(task => task.status === currentFilter);

    const todo = filteredTasks.filter(t => t.status === 'TODO');
    const progress = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
    const done = filteredTasks.filter(t => t.status === 'DONE');

    todoCount.textContent = todo.length;
    progressCount.textContent = progress.length;
    doneCount.textContent = done.length;

    renderTaskList(todo, todoTasks, 'TODO');
    renderTaskList(progress, progressTasks, 'IN_PROGRESS');
    renderTaskList(done, doneTasks, 'DONE');
}


// ========================================
// PART 8: RENDER FUNCTIONS - RENDER LIST
// ========================================

function renderTaskList(tasks, container, currentStatus) {
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No tasks yet</p></div>';
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

function createTaskCard(task, status) {
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
            Created: ${formatDate(task.created_at)}
        </div>
        <div class="task-actions">
            ${createStatusButtons(task.id, status)}
            <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">🗑️ Delete</button>
        </div>
    `;

    return card;
}


// ========================================
// PART 10: HELPER - STATUS BUTTONS
// ========================================

function createStatusButtons(id, status) {
    const buttons = [];

    if (status !== 'TODO') {
        buttons.push(`
            <button class="btn btn-warning btn-sm" onclick="updateTaskStatus(${id}, 'TODO')">
                ← To Do
            </button>
        `);
    }
    if (status !== 'IN_PROGRESS') {
        buttons.push(`
            <button class="btn btn-primary btn-sm" onclick="updateTaskStatus(${id}, 'IN_PROGRESS')">
                → In Progress
            </button>
        `);
    }
    if (status !== 'DONE') {
        buttons.push(`
            <button class="btn btn-success btn-sm" onclick="updateTaskStatus(${id}, 'DONE')">
                ✓ Done
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


// ========================================
// PART 12: EVENT LISTENERS
// ========================================

addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;

    if (!title) {
        alert('Please enter a task title');
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
    fetchTasks();
});


// ========================================
// PART 14: GLOBAL EXPORT
// ========================================

window.updateTaskStatus = updateTaskStatus;
window.deleteTask = deleteTask;
