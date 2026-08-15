/**
 * StudyZone - To-Do & Task Manager Controller (js/todo.js)
 * Day 3 - Task 1: Complete Task Management System (Create, Read, Update, Delete, Filter, Sort, Search).
 */

document.addEventListener('DOMContentLoaded', () => {
    TodoManager.init();
});

const TodoManager = {
    currentFilter: 'all',
    currentSort: 'recent',
    searchQuery: '',
    editingTaskId: null,

    init() {
        this.bindEvents();
        this.renderTasks();
    },

    bindEvents() {
        // Task Creation Form Submit
        const form = document.getElementById('todo-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTask();
            });
        }

        // Filter Tabs
        const filterBtns = document.querySelectorAll('.todo-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.getAttribute('data-filter') || 'all';
                this.renderTasks();
            });
        });

        // Search Input
        const searchInput = document.getElementById('todo-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderTasks();
            });
        }

        // Sort Dropdown Select
        const sortSelect = document.getElementById('todo-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.renderTasks();
            });
        }

        // Clear Completed Button
        const clearCompletedBtn = document.getElementById('todo-clear-completed');
        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener('click', () => {
                this.clearCompletedTasks();
            });
        }

        // Edit Modal Form Submit
        const editForm = document.getElementById('todo-edit-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveEdit();
            });
        }

        // Modal Close triggers
        const closeModalBtn = document.getElementById('close-task-modal');
        const modalBackdrop = document.getElementById('task-modal-backdrop');
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeEditModal());
        if (modalBackdrop) modalBackdrop.addEventListener('click', () => this.closeEditModal());
    },

    // 1. Add New Task
    handleAddTask() {
        const titleInput = document.getElementById('task-title-input');
        const courseInput = document.getElementById('task-course-input');
        const priorityInput = document.getElementById('task-priority-input');
        const dateInput = document.getElementById('task-date-input');

        if (!titleInput || !titleInput.value.trim()) {
            alert('Please enter a task title!');
            titleInput?.focus();
            return;
        }

        const newTask = {
            id: 'task_' + Date.now(),
            title: titleInput.value.trim(),
            course: courseInput ? courseInput.value : 'General',
            priority: priorityInput ? priorityInput.value : 'medium',
            dueDate: dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0],
            status: 'todo',
            createdAt: new Date().toISOString()
        };

        Storage.saveTask(newTask);

        titleInput.value = '';
        if (dateInput) dateInput.value = '';

        this.renderTasks();

        // Sync Dashboard stats
        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
    },

    // 2. Toggle Completion Status
    toggleTask(taskId) {
        const tasks = Storage.loadTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newStatus = task.status === 'completed' ? 'todo' : 'completed';
        Storage.updateTask(taskId, { status: newStatus });

        this.renderTasks();

        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
    },

    // 3. Delete Task
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            Storage.deleteTask(taskId);
            this.renderTasks();

            if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
                window.Dashboard.renderDashboard();
            }
        }
    },

    // 4. Batch Action: Clear Completed Tasks
    clearCompletedTasks() {
        const tasks = Storage.loadTasks();
        const activeOnly = tasks.filter(t => t.status !== 'completed');
        Storage.saveData('tasks', activeOnly);
        this.renderTasks();

        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
    },

    // 5. Edit Modal Functions
    openEditModal(taskId) {
        const tasks = Storage.loadTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;

        document.getElementById('edit-task-title').value = task.title;
        document.getElementById('edit-task-course').value = task.course || 'General';
        document.getElementById('edit-task-priority').value = task.priority || 'medium';
        document.getElementById('edit-task-date').value = task.dueDate || '';

        const modal = document.getElementById('task-edit-modal');
        if (modal) modal.classList.add('active');
    },

    closeEditModal() {
        this.editingTaskId = null;
        const modal = document.getElementById('task-edit-modal');
        if (modal) modal.classList.remove('active');
    },

    handleSaveEdit() {
        if (!this.editingTaskId) return;

        const title = document.getElementById('edit-task-title').value.trim();
        const course = document.getElementById('edit-task-course').value;
        const priority = document.getElementById('edit-task-priority').value;
        const dueDate = document.getElementById('edit-task-date').value;

        if (!title) {
            alert('Task title cannot be empty!');
            return;
        }

        Storage.updateTask(this.editingTaskId, { title, course, priority, dueDate });
        this.closeEditModal();
        this.renderTasks();

        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
    },

    // 6. Main Render Engine
    renderTasks() {
        const listContainer = document.getElementById('todo-list-container');
        if (!listContainer) return;

        let tasks = Storage.loadTasks();

        // Badge Counters
        const activeCount = tasks.filter(t => t.status !== 'completed').length;
        const completedCount = tasks.filter(t => t.status === 'completed').length;

        const activeCounterEl = document.getElementById('todo-active-count');
        const completedCounterEl = document.getElementById('todo-completed-count');
        if (activeCounterEl) activeCounterEl.textContent = activeCount;
        if (completedCounterEl) completedCounterEl.textContent = completedCount;

        // Apply Filter Tabs
        if (this.currentFilter === 'active') {
            tasks = tasks.filter(t => t.status !== 'completed');
        } else if (this.currentFilter === 'completed') {
            tasks = tasks.filter(t => t.status === 'completed');
        } else if (this.currentFilter === 'high') {
            tasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
        }

        // Apply Search Input
        if (this.searchQuery) {
            tasks = tasks.filter(t => 
                t.title.toLowerCase().includes(this.searchQuery) ||
                (t.course && t.course.toLowerCase().includes(this.searchQuery))
            );
        }

        // Apply Sorting
        if (this.currentSort === 'priority') {
            const pMap = { high: 3, medium: 2, low: 1 };
            tasks.sort((a, b) => (pMap[b.priority] || 0) - (pMap[a.priority] || 0));
        } else if (this.currentSort === 'date') {
            tasks.sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));
        } else {
            tasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        // Empty State
        if (tasks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">📋</span>
                    <p class="empty-state-text">No tasks match your current filter or search.</p>
                </div>
            `;
            return;
        }

        // Render Task Rows
        listContainer.innerHTML = tasks.map(task => {
            const isDone = task.status === 'completed';
            return `
                <div class="task-item ${isDone ? 'completed' : ''} searchable-item" data-task-id="${task.id}">
                    <div class="task-left">
                        <button class="task-checkbox ${isDone ? 'checked' : ''}" 
                                onclick="TodoManager.toggleTask('${task.id}')" 
                                aria-label="Toggle Complete">
                            ${isDone ? '✓' : ''}
                        </button>
                        <div class="task-info-group">
                            <span class="task-title">${this.escapeHtml(task.title)}</span>
                            <span class="task-meta">${task.dueDate ? `Due ${task.dueDate}` : 'No due date'}</span>
                        </div>
                    </div>

                    <div class="task-right">
                        <span class="badge badge-course">${task.course || 'General'}</span>
                        <span class="badge badge-priority-${task.priority || 'medium'}">${(task.priority || 'medium').toUpperCase()}</span>
                        
                        <div class="task-actions">
                            <button class="btn-action-icon" onclick="TodoManager.openEditModal('${task.id}')" title="Edit Task">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 2 2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-action-icon delete" onclick="TodoManager.deleteTask('${task.id}')" title="Delete Task">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    escapeHtml(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
};

window.TodoManager = TodoManager;