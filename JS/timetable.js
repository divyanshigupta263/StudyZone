/**
 * StudyZone - Interactive Weekly Timetable Module (js/timetable.js)
 * Day 4 - Task 2: 7-Day Weekly Schedule, Apple Calendar Card Aesthetics, & Dashboard Sync.
 */

document.addEventListener('DOMContentLoaded', () => {
    TimetableManager.init();
});

const TimetableManager = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    activeMobileDay: 'Monday',
    editingId: null,

    init() {
        this.seedDefaultSchedule();
        this.bindEvents();
        this.determineToday();
        this.renderTimetable();
    },

    determineToday() {
        const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
        const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        this.activeMobileDay = map[dayIndex] || 'Monday';
    },

    seedDefaultSchedule() {
        const existing = Storage.loadData('timetable', null);
        if (!existing || existing.length === 0) {
            const defaultClasses = [
                { id: 'c1', day: 'Monday', subject: 'CS301 — Operating Systems', startTime: '09:00', endTime: '10:30', room: 'Hall B', professor: 'Prof. Harrison', color: 'blue' },
                { id: 'c2', day: 'Monday', subject: 'MATH204 — Linear Algebra', startTime: '11:00', endTime: '12:30', room: 'Room 302', professor: 'Dr. Zhao', color: 'purple' },
                { id: 'c3', day: 'Tuesday', subject: 'CS302 — Databases', startTime: '10:00', endTime: '11:30', room: 'Lab 2', professor: 'Prof. Davis', color: 'green' },
                { id: 'c4', day: 'Wednesday', subject: 'CS301 — Operating Systems', startTime: '09:00', endTime: '10:30', room: 'Hall B', professor: 'Prof. Harrison', color: 'blue' },
                { id: 'c5', day: 'Wednesday', subject: 'CS405 — Web Engineering Lab', startTime: '14:00', endTime: '16:00', room: 'Tech Hub 4', professor: 'Eng. Miller', color: 'amber' },
                { id: 'c6', day: 'Thursday', subject: 'MATH204 — Linear Algebra', startTime: '11:00', endTime: '12:30', room: 'Room 302', professor: 'Dr. Zhao', color: 'purple' },
                { id: 'c7', day: 'Friday', subject: 'CS302 — Databases Lab', startTime: '13:00', endTime: '15:00', room: 'Lab 2', professor: 'Prof. Davis', color: 'green' },
                { id: 'c8', day: 'Saturday', subject: 'CS301 — Operating Systems', startTime: '09:00', endTime: '10:30', room: 'Hall B', professor: 'Prof. Harrison', color: 'blue' },
                { id: 'c9', day: 'Saturday', subject: 'MATH204 — Linear Algebra', startTime: '11:00', endTime: '12:30', room: 'Room 302', professor: 'Dr. Zhao', color: 'purple' },
                { id: 'c10', day: 'Saturday', subject: 'CS405 — Web Engineering Lab', startTime: '14:00', endTime: '16:00', room: 'Lab 4', professor: 'Tech Hub', color: 'amber' }
            ];
            Storage.saveData('timetable', defaultClasses);
        }
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
        if (backdrop) backdrop.addEventListener('click', () => this.closeModal());

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
    openCreateModal(targetDay = 'Monday') {
        this.editingId = null;
        document.getElementById('timetable-modal-title').textContent = 'Add Scheduled Class';
        document.getElementById('class-day-input').value = targetDay;
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

    // 5. Render Weekly Grid & Day Tabs
    renderTimetable() {
        const gridContainer = document.getElementById('timetable-grid-container');
        const tabsContainer = document.getElementById('timetable-mobile-tabs');
        if (!gridContainer) return;

        const schedule = Storage.loadData('timetable', []);
        const todayName = this.days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Map Mon=0 to Sun=6

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
            const dayClasses = schedule.filter(c => c.day === day);
            dayClasses.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

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
                        ${dayClasses.length === 0 ? `
                            <div class="empty-day-slot">No classes</div>
                        ` : dayClasses.map(c => `
                            <div class="class-card class-color-${c.color || 'blue'}">
                                <div class="class-card-time">${this.formatTime(c.startTime)} - ${this.formatTime(c.endTime)}</div>
                                <div class="class-card-subject">${this.escapeHtml(c.subject)}</div>
                                ${c.room || c.professor ? `
                                    <div class="class-card-meta">
                                        ${c.room ? `<span>📍 ${this.escapeHtml(c.room)}</span>` : ''}
                                        ${c.professor ? `<span>👨‍🏫 ${this.escapeHtml(c.professor)}</span>` : ''}
                                    </div>
                                ` : ''}

                                <div class="class-card-hover-actions">
                                    <button onclick="TimetableManager.openEditModal('${c.id}')" title="Edit">✎</button>
                                    <button onclick="TimetableManager.deleteClass('${c.id}')" title="Delete">&times;</button>
                                </div>
                            </div>
                        `).join('')}
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