/**
 * StudyZone - Assignment Tracker Module (js/assignment.js)
 * Day 4 - Task 1: Complete Assignment Management System.
 */

document.addEventListener('DOMContentLoaded', () => {
    AssignmentManager.init();
});

const AssignmentManager = {
    currentFilter: 'all',
    currentSort: 'date',
    searchQuery: '',
    editingId: null,

    init() {
        this.bindEvents();
        this.renderAssignments();
    },

    bindEvents() {
        const newBtn = document.getElementById('btn-new-assignment');
        if (newBtn) newBtn.addEventListener('click', () => this.openCreateModal());

        const closeBtn = document.getElementById('close-assignment-modal');
        const cancelBtn = document.getElementById('cancel-assignment-modal');
        const backdrop = document.getElementById('assignment-modal-backdrop');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (backdrop) backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.closeModal();
        });

        const form = document.getElementById('assignment-editor-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveAssignment();
            });
        }

        const filterBtns = document.querySelectorAll('.assignment-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.getAttribute('data-filter') || 'all';
                this.renderAssignments();
            });
        });

        const searchInput = document.getElementById('assignment-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderAssignments();
            });
        }

        const sortSelect = document.getElementById('assignment-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.renderAssignments();
            });
        }
    },

    openCreateModal() {
        if (!Storage.requireAuth()) return;
        this.editingId = null;
        document.getElementById('assignment-modal-title').textContent = 'New Assignment';
        document.getElementById('assign-title-input').value = '';
        document.getElementById('assign-course-input').value = '';
        document.getElementById('assign-date-input').value = new Date().toISOString().split('T')[0];
        document.getElementById('assign-priority-input').value = 'medium';
        document.getElementById('assign-status-input').value = 'Not Started';
        document.getElementById('assign-marks-input').value = '';

        const modal = document.getElementById('assignment-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    openEditModal(id) {
        if (!Storage.requireAuth()) return;
        const assignments = Storage.loadAssignments();
        const item = assignments.find(a => a.id === id);
        if (!item) return;

        this.editingId = id;
        document.getElementById('assignment-modal-title').textContent = 'Edit Assignment';
        document.getElementById('assign-title-input').value = item.title;
        document.getElementById('assign-course-input').value = item.course || 'General';
        document.getElementById('assign-date-input').value = item.dueDate || '';
        document.getElementById('assign-priority-input').value = item.priority || 'medium';
        document.getElementById('assign-status-input').value = item.status || 'Not Started';
        document.getElementById('assign-marks-input').value = item.marks || '';

        const modal = document.getElementById('assignment-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    closeModal() {
        this.editingId = null;
        const modal = document.getElementById('assignment-modal-backdrop');
        if (modal) modal.classList.remove('active');
    },

    handleSaveAssignment() {
        if (!Storage.requireAuth()) return;

        const titleInput = document.getElementById('assign-title-input');
        const courseInput = document.getElementById('assign-course-input');
        const dateInput = document.getElementById('assign-date-input');
        const priorityInput = document.getElementById('assign-priority-input');
        const statusInput = document.getElementById('assign-status-input');
        const marksInput = document.getElementById('assign-marks-input');

        const title = titleInput ? titleInput.value.trim() : '';
        const course = courseInput && courseInput.value.trim() ? courseInput.value.trim() : 'General';
        const dueDate = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];
        const priority = priorityInput ? priorityInput.value : 'medium';
        const status = statusInput ? statusInput.value : 'Not Started';
        const marks = marksInput ? marksInput.value.trim() : '';

        if (!title) {
            alert('Please enter an Assignment Title!');
            if (titleInput) titleInput.focus();
            return;
        }

        const yearPart = parseInt(dueDate.split('-')[0], 10);
        if (isNaN(yearPart) || yearPart < 2020 || yearPart > 2099) {
            alert('Invalid year! Please enter a valid 4-digit year (e.g. 2026).');
            if (dateInput) dateInput.focus();
            return;
        }

        const data = {
            id: this.editingId || 'assign_' + Date.now(),
            title,
            course,
            dueDate,
            priority,
            status,
            marks
        };

        Storage.saveAssignment(data);
        this.closeModal();
        this.renderAssignments();

        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
        this.syncTimetable();
    },

    syncTimetable() {
        if (window.TimetableManager && typeof window.TimetableManager.renderTimetable === 'function') {
            window.TimetableManager.renderTimetable();
        }
    },

    deleteAssignment(id) {
        if (!Storage.requireAuth()) return;
        if (confirm('Are you sure you want to delete this assignment?')) {
            Storage.deleteAssignment(id);
            this.renderAssignments();

            if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
                window.Dashboard.renderDashboard();
            }
            this.syncTimetable();
        }
    },

    toggleSubmitted(id) {
        if (!Storage.requireAuth()) return;
        const assignments = Storage.loadAssignments();
        const item = assignments.find(a => a.id === id);
        if (!item) return;

        const newStatus = item.status === 'Submitted' ? 'Not Started' : 'Submitted';
        Storage.saveAssignment({ ...item, status: newStatus });
        this.renderAssignments();

        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
        this.syncTimetable();
    },

    renderAssignments() {
        const container = document.getElementById('assignment-list-container');
        if (!container) return;

        let assignments = Storage.loadAssignments();

        // Update Counter Banner
        const totalCount = assignments.length;
        const pendingCount = assignments.filter(a => a.status !== 'Submitted' && a.status !== 'Graded').length;
        const submittedCount = assignments.filter(a => a.status === 'Submitted' || a.status === 'Graded').length;

        const today = new Date().toISOString().split('T')[0];
        const overdueCount = assignments.filter(a => a.status !== 'Submitted' && a.status !== 'Graded' && a.dueDate < today).length;

        document.getElementById('assign-counter-total').textContent = totalCount;
        document.getElementById('assign-counter-pending').textContent = pendingCount;
        document.getElementById('assign-counter-submitted').textContent = submittedCount;
        document.getElementById('assign-counter-overdue').textContent = overdueCount;

        // Apply Filter Tabs
        if (this.currentFilter === 'pending') {
            assignments = assignments.filter(a => a.status !== 'Submitted' && a.status !== 'Graded');
        } else if (this.currentFilter === 'submitted') {
            assignments = assignments.filter(a => a.status === 'Submitted' || a.status === 'Graded');
        } else if (this.currentFilter === 'overdue') {
            assignments = assignments.filter(a => a.status !== 'Submitted' && a.status !== 'Graded' && a.dueDate < today);
        }

        // Apply Search
        if (this.searchQuery) {
            assignments = assignments.filter(a =>
                a.title.toLowerCase().includes(this.searchQuery) ||
                (a.course && a.course.toLowerCase().includes(this.searchQuery))
            );
        }

        // Apply Sort
        if (this.currentSort === 'priority') {
            const pMap = { high: 3, medium: 2, low: 1 };
            assignments.sort((a, b) => (pMap[b.priority] || 0) - (pMap[a.priority] || 0));
        } else if (this.currentSort === 'subject') {
            assignments.sort((a, b) => (a.course || '').localeCompare(b.course || ''));
        } else {
            assignments.sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));
        }

        if (assignments.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <span class="empty-state-icon">📚</span>
                    <p class="empty-state-text">No assignments tracked.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = assignments.map(item => {
            const isOverdue = item.status !== 'Submitted' && item.status !== 'Graded' && item.dueDate < today;
            const isSubmitted = item.status === 'Submitted' || item.status === 'Graded';

            return `
                <div class="assignment-card searchable-item ${isSubmitted ? 'submitted' : ''}">
                    <div class="assign-card-header">
                        <span class="badge badge-course">${item.course || 'General'}</span>
                        <span class="badge badge-priority-${item.priority || 'medium'}">${(item.priority || 'medium').toUpperCase()}</span>
                    </div>

                    <h3 class="assign-card-title">${item.title}</h3>

                    <div class="assign-card-meta">
                        <span>📅 Due: ${item.dueDate}</span>
                        ${isOverdue ? '<span style="color:var(--accent-rose); font-weight:700;">⚠️ Overdue</span>' : ''}
                        ${item.marks ? `<span>💯 Marks: ${item.marks}</span>` : ''}
                    </div>

                    <div style="display:flex; align-items:center; justify-content:space-between; margin-top:14px; padding-top:10px; border-top:1px solid var(--border-subtle);">
                        <button class="btn-secondary-sm" onclick="AssignmentManager.toggleSubmitted('${item.id}')" style="height:32px; font-size:0.76rem;">
                            ${isSubmitted ? '✓ Submitted' : 'Mark as Submitted'}
                        </button>

                        <div style="display:flex; gap:6px;">
                            <button class="btn-action-icon" onclick="AssignmentManager.openEditModal('${item.id}')" title="Edit">✎</button>
                            <button class="btn-action-icon delete" onclick="AssignmentManager.deleteAssignment('${item.id}')" title="Delete">&times;</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
};

window.AssignmentManager = AssignmentManager;
