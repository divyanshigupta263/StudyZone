/**
 * StudyZone - Interactive Weekly Timetable Module (js/timetable.js)
 * 7-Day Weekly Schedule, Apple Calendar Card Aesthetics, & Zero Pre-saved Data.
 */

document.addEventListener('DOMContentLoaded', () => {
    TimetableManager.init();
});

const TimetableManager = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    activeMobileDay: 'Monday',
    editingId: null,

    init() {
        this.bindEvents();
        this.determineToday();
        this.renderTimetable();
    },

    determineToday() {
        const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
        const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        this.activeMobileDay = map[dayIndex] || 'Monday';
    },

    bindEvents() {
        // Global Add Class Button
        const addBtn = document.getElementById('btn-new-class');
        if (addBtn) addBtn.addEventListener('click', () => this.openCreateModal());

        // Modal Close triggers
        const closeBtn = document.getElementById('close-timetable-modal');
        const cancelBtn = document.getElementById('cancel-timetable-modal');
        const backdrop = document.getElementById('timetable-modal-backdrop');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (backdrop) backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) this.closeModal();
        });

        // Form Submit
        const form = document.getElementById('timetable-editor-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveClass();
            });
        }
    },

    // 1. Open Modal for Create / Edit
    openCreateModal(targetDay = null) {
        if (!Storage.requireAuth()) return;
        this.editingId = null;
        document.getElementById('timetable-modal-title').textContent = 'Add Scheduled Class';
        
        let selectedDay = targetDay;
        if (!selectedDay) {
            const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            selectedDay = map[new Date().getDay()] || 'Monday';
        }

        document.getElementById('class-day-input').value = selectedDay;
        document.getElementById('class-subject-input').value = '';
        document.getElementById('class-start-input').value = '09:00';
        document.getElementById('class-end-input').value = '10:30';
        document.getElementById('class-room-input').value = '';
        document.getElementById('class-prof-input').value = '';
        document.getElementById('class-color-input').value = 'blue';

        const modal = document.getElementById('timetable-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    openEditModal(id) {
        if (!Storage.requireAuth()) return;
        const list = Storage.loadData('timetable', []);
        const item = list.find(c => c.id === id);
        if (!item) return;

        this.editingId = id;
        document.getElementById('timetable-modal-title').textContent = 'Edit Class Schedule';
        document.getElementById('class-day-input').value = item.day || 'Monday';
        document.getElementById('class-subject-input').value = item.subject || '';
        document.getElementById('class-start-input').value = item.startTime || '09:00';
        document.getElementById('class-end-input').value = item.endTime || '10:30';
        document.getElementById('class-room-input').value = item.room || '';
        document.getElementById('class-prof-input').value = item.professor || '';
        document.getElementById('class-color-input').value = item.color || 'blue';

        const modal = document.getElementById('timetable-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    closeModal() {
        this.editingId = null;
        const modal = document.getElementById('timetable-modal-backdrop');
        if (modal) modal.classList.remove('active');
    },

    // 2. Save Class Schedule
    handleSaveClass() {
        if (!Storage.requireAuth()) return;

        const day = document.getElementById('class-day-input').value;
        const subject = document.getElementById('class-subject-input').value.trim();
        const startTime = document.getElementById('class-start-input').value;
        const endTime = document.getElementById('class-end-input').value;
        const room = document.getElementById('class-room-input').value.trim();
        const professor = document.getElementById('class-prof-input').value.trim();
        const color = document.getElementById('class-color-input').value;

        if (!subject || !startTime || !endTime) {
            alert('Please fill in Subject, Start Time, and End Time!');
            return;
        }

        if (startTime >= endTime) {
            alert('Start time must be earlier than End time!');
            return;
        }

        const list = Storage.loadData('timetable', []);

        if (this.editingId) {
            const index = list.findIndex(c => c.id === this.editingId);
            if (index >= 0) {
                list[index] = { ...list[index], day, subject, startTime, endTime, room, professor, color };
            }
        } else {
            list.push({
                id: 'class_' + Date.now(),
                day,
                subject,
                startTime,
                endTime,
                room,
                professor,
                color
            });
        }

        Storage.saveData('timetable', list);
        this.closeModal();
        this.renderTimetable();
        this.syncDashboardGlance();
    },

    // 3. Delete Class
    deleteClass(id) {
        if (confirm('Are you sure you want to remove this class from your schedule?')) {
            const list = Storage.loadData('timetable', []);
            const updated = list.filter(c => c.id !== id);
            Storage.saveData('timetable', updated);
            this.renderTimetable();
            this.syncDashboardGlance();
        }
    },

    // 4. Synchronize Dashboard Glance
    syncDashboardGlance() {
        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
    },

    getDayNameFromDate(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        const d = new Date(year, month, day);
        const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return map[d.getDay()];
    },

    // 5. Render Weekly Grid & Day Tabs (Includes Classes, Tasks, & Assignments)
    renderTimetable() {
        const gridContainer = document.getElementById('timetable-grid-container');
        const tabsContainer = document.getElementById('timetable-mobile-tabs');
        if (!gridContainer) return;

        const schedule = Storage.loadData('timetable', []);
        const tasks = Storage.loadTasks();
        const assignments = Storage.loadAssignments();
        const todayName = this.days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

        // Render Mobile Tabs
        if (tabsContainer) {
            tabsContainer.innerHTML = this.days.map(day => `
                <button class="timetable-tab-btn ${day === this.activeMobileDay ? 'active' : ''} ${day === todayName ? 'is-today' : ''}" 
                        onclick="TimetableManager.switchMobileDay('${day}')">
                    ${day.slice(0, 3)}
                </button>
            `).join('');
        }

        // Render 7-Day Grid
        gridContainer.innerHTML = this.days.map(day => {
            // 1. Classes for this day
            const dayClasses = schedule.filter(c => c.day === day).map(c => ({
                type: 'class',
                id: c.id,
                title: c.subject,
                timeText: `${this.formatTime(c.startTime)} - ${this.formatTime(c.endTime)}`,
                sortTime: c.startTime || '00:00',
                metaRoom: c.room,
                metaProf: c.professor,
                color: c.color || 'blue'
            }));

            // 2. Tasks for this day (Rendered in Purple)
            const dayTasks = tasks
                .filter(t => this.getDayNameFromDate(t.dueDate) === day)
                .map(t => ({
                    type: 'task',
                    id: t.id,
                    title: t.title,
                    timeText: `📋 TASK • ${t.priority.toUpperCase()}`,
                    sortTime: '23:57',
                    meta: `Due: ${t.dueDate}${t.course ? ' • ' + t.course : ''}`,
                    color: 'purple',
                    isDone: t.status === 'completed'
                }));

            // 3. Assignments for this day (Rendered in Rose / Red)
            const dayAssignments = assignments
                .filter(a => this.getDayNameFromDate(a.dueDate) === day)
                .map(a => ({
                    type: 'assignment',
                    id: a.id,
                    title: a.title,
                    timeText: `📚 ASSIGNMENT • ${(a.status || 'Pending').toUpperCase()}`,
                    sortTime: '23:58',
                    meta: `Due: ${a.dueDate}${a.course ? ' • ' + a.course : ''}`,
                    color: 'rose',
                    isSubmitted: a.status === 'Submitted' || a.status === 'Graded'
                }));

            const allItems = [...dayClasses, ...dayTasks, ...dayAssignments];
            allItems.sort((a, b) => (a.sortTime || '').localeCompare(b.sortTime || ''));

            const isToday = (day === todayName);
            const isMobileHidden = (day !== this.activeMobileDay);

            return `
                <div class="timetable-day-col ${isToday ? 'is-today' : ''} ${isMobileHidden ? 'mobile-hidden' : ''}">
                    <div class="day-col-header">
                        <div class="day-title-group">
                            <span class="day-name">${day}</span>
                            ${isToday ? '<span class="today-badge">TODAY</span>' : ''}
                        </div>
                        <button class="btn-add-class-sm" onclick="TimetableManager.openCreateModal('${day}')" title="Add Class to ${day}">+</button>
                    </div>

                    <div class="day-col-body">
                        ${allItems.length === 0 ? `
                            <div class="empty-day-slot">No classes or items</div>
                        ` : allItems.map(item => {
                            if (item.type === 'class') {
                                return `
                                    <div class="class-card class-color-${item.color}">
                                        <div class="class-card-time">${item.timeText}</div>
                                        <div class="class-card-subject">${this.escapeHtml(item.title)}</div>
                                        ${item.metaRoom || item.metaProf ? `
                                            <div class="class-card-meta">
                                                ${item.metaRoom ? `<span>📍 ${this.escapeHtml(item.metaRoom)}</span>` : ''}
                                                ${item.metaProf ? `<span>👨‍🏫 ${this.escapeHtml(item.metaProf)}</span>` : ''}
                                            </div>
                                        ` : ''}

                                        <div class="class-card-hover-actions">
                                            <button onclick="TimetableManager.openEditModal('${item.id}')" title="Edit">✎</button>
                                            <button onclick="TimetableManager.deleteClass('${item.id}')" title="Delete">&times;</button>
                                        </div>
                                    </div>
                                `;
                            } else if (item.type === 'task') {
                                return `
                                    <div class="class-card class-color-purple ${item.isDone ? 'submitted' : ''}">
                                        <div class="class-card-time" style="font-weight:800; font-size:0.68rem; color:var(--accent-purple);">${item.timeText}</div>
                                        <div class="class-card-subject" style="${item.isDone ? 'text-decoration:line-through; opacity:0.6;' : ''}">${this.escapeHtml(item.title)}</div>
                                        <div class="class-card-meta">
                                            <span>${this.escapeHtml(item.meta)}</span>
                                        </div>
                                        <div class="class-card-hover-actions">
                                            <button onclick="AppRouter.switchView('tasks')" title="View in Tasks">&rarr;</button>
                                        </div>
                                    </div>
                                `;
                            } else if (item.type === 'assignment') {
                                return `
                                    <div class="class-card class-color-rose ${item.isSubmitted ? 'submitted' : ''}">
                                        <div class="class-card-time" style="font-weight:800; font-size:0.68rem; color:var(--accent-rose);">${item.timeText}</div>
                                        <div class="class-card-subject" style="${item.isSubmitted ? 'opacity:0.6;' : ''}">${this.escapeHtml(item.title)}</div>
                                        <div class="class-card-meta">
                                            <span>${this.escapeHtml(item.meta)}</span>
                                        </div>
                                        <div class="class-card-hover-actions">
                                            <button onclick="AppRouter.switchView('assignments')" title="View in Assignments">&rarr;</button>
                                        </div>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },

    switchMobileDay(day) {
        this.activeMobileDay = day;
        this.renderTimetable();
    },

    formatTime(timeStr) {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${m} ${ampm}`;
    },

    escapeHtml(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
};

window.TimetableManager = TimetableManager;