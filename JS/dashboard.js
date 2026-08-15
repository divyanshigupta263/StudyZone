/**
 * StudyZone - Dashboard Controller (js/dashboard.js)
 * Day 2 - Task 2: Real-time Stats Engine, Quick Task Completion, and Activity Glance.
 */

document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

const Dashboard = {
    quotes: [
        { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
        { text: "Focus is a muscle. The more you practice avoiding distractions, the stronger it becomes.", author: "Cal Newport" },
        { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
        { text: "Procrastination makes easy things hard and hard things harder.", author: "Mason Cooley" },
        { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" }
    ],

    init() {
        this.renderGreetingAndClock();
        this.initQuoteGenerator();
        this.renderDashboard();
        
        // Refresh time every 30 seconds
        setInterval(() => this.renderGreetingAndClock(), 30000);
    },

    // 1. Time-based Greeting & Real-time Clock
    renderGreetingAndClock() {
        const now = new Date();
        const hours = now.getHours();

        let greetingText = 'Good morning, Alex ☀️';
        if (hours >= 12 && hours < 17) {
            greetingText = 'Good afternoon, Alex 🌤️';
        } else if (hours >= 17 || hours < 5) {
            greetingText = 'Good evening, Alex 🌙';
        }

        const greetingEl = document.getElementById('dashboard-greeting');
        if (greetingEl) greetingEl.textContent = greetingText;

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('en-US', options);
        
        let timeHours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = timeHours >= 12 ? 'PM' : 'AM';
        timeHours = timeHours % 12 || 12;
        const formattedTime = `${String(timeHours).padStart(2, '0')}:${minutes} ${ampm}`;

        const dateEl = document.getElementById('dashboard-date');
        if (dateEl) dateEl.textContent = `${dateString} • ${formattedTime}`;
    },

    // 2. Quote Generator
    initQuoteGenerator() {
        const quoteTextEl = document.getElementById('quote-text');
        const quoteAuthorEl = document.getElementById('quote-author');
        const refreshBtn = document.getElementById('quote-refresh-btn');

        if (!quoteTextEl || !quoteAuthorEl) return;

        const todayStr = new Date().toISOString().split('T')[0];
        const cachedQuoteData = Storage.loadData('daily_quote', null);

        if (cachedQuoteData && cachedQuoteData.date === todayStr && cachedQuoteData.quote) {
            this.displayQuote(cachedQuoteData.quote);
        } else {
            this.getNewRandomQuote();
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.getNewRandomQuote(true));
        }
    },

    getNewRandomQuote(isManualRefresh = false) {
        const quoteContainer = document.getElementById('quote-card-inner');
        if (quoteContainer) quoteContainer.classList.add('quote-fade-out');

        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * this.quotes.length);
            const selectedQuote = this.quotes[randomIndex];
            const todayStr = new Date().toISOString().split('T')[0];
            Storage.saveData('daily_quote', { date: todayStr, quote: selectedQuote });
            this.displayQuote(selectedQuote);
            if (quoteContainer) quoteContainer.classList.remove('quote-fade-out');
        }, isManualRefresh ? 200 : 0);
    },

    displayQuote(quoteObj) {
        const quoteTextEl = document.getElementById('quote-text');
        const quoteAuthorEl = document.getElementById('quote-author');
        if (quoteTextEl) quoteTextEl.textContent = `"${quoteObj.text}"`;
        if (quoteAuthorEl) quoteAuthorEl.textContent = `— ${quoteObj.author}`;
    },

    // 3. Dynamic Dashboard Engine
    renderDashboard() {
        this.updateDashboardStats();
        this.renderTopPriorityTasks();
        this.renderTodaySchedule();
    },

    // Computes metrics from localStorage
    updateDashboardStats() {
        const tasks = Storage.loadTasks();
        const assignments = Storage.loadData('assignments', []);
        const attendance = Storage.loadData('attendance', []);
        const cgpaData = Storage.loadData('cgpa', { cgpa: '3.88', scale: '4.00', semester: 'Semester 5' });
        const focusData = Storage.loadData('pomodoro_today', { minutes: 90 });

        // Card 1: Pending Tasks & High Priority Count
        const pendingTasks = tasks.filter(t => t.status !== 'completed');
        const highPriorityCount = pendingTasks.filter(t => t.priority === 'high').length;
        
        const pendingCountEl = document.getElementById('stat-pending-tasks');
        const pendingSubEl = document.getElementById('stat-pending-subtitle');
        if (pendingCountEl) pendingCountEl.textContent = pendingTasks.length;
        if (pendingSubEl) pendingSubEl.textContent = `${highPriorityCount} high priority`;

        // Card 2: Upcoming Assignments (Within 7 Days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const dueSoon = assignments.filter(a => {
            if (a.status === 'Completed') return false;
            const dueDate = new Date(a.dueDate);
            return dueDate >= today && dueDate <= nextWeek;
        });

        const upcomingCountEl = document.getElementById('stat-assignments-count');
        const upcomingSubEl = document.getElementById('stat-assignments-subtitle');
        if (upcomingCountEl) upcomingCountEl.textContent = dueSoon.length > 0 ? dueSoon.length : assignments.length;
        if (upcomingSubEl) {
            if (dueSoon.length > 0) {
                upcomingSubEl.textContent = `Next: ${dueSoon[0].title.slice(0, 18)}...`;
            } else {
                upcomingSubEl.textContent = 'No urgent deadlines';
            }
        }

        // Card 3: Attendance Health % & Color-Coded Badge
        let totalAttended = 0;
        let totalClasses = 0;
        attendance.forEach(item => {
            totalAttended += (item.attended || 0);
            totalClasses += (item.total || 0);
        });

        const overallPct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 91;
        const attendanceValueEl = document.getElementById('stat-attendance-pct');
        const attendanceBadgeEl = document.getElementById('stat-attendance-badge');

        if (attendanceValueEl) attendanceValueEl.textContent = `${overallPct}%`;
        if (attendanceBadgeEl) {
            if (overallPct >= 75) {
                attendanceBadgeEl.textContent = 'Safe';
                attendanceBadgeEl.className = 'badge-status safe';
            } else if (overallPct >= 65) {
                attendanceBadgeEl.textContent = 'Warning';
                attendanceBadgeEl.className = 'badge-status warning';
            } else {
                attendanceBadgeEl.textContent = 'Critical';
                attendanceBadgeEl.className = 'badge-status critical';
            }
        }

        // Card 4: CGPA Snapshot
        const cgpaValEl = document.getElementById('stat-cgpa-val');
        const cgpaSubEl = document.getElementById('stat-cgpa-subtitle');
        if (cgpaValEl) cgpaValEl.textContent = cgpaData.cgpa || '3.88';
        if (cgpaSubEl) cgpaSubEl.textContent = cgpaData.semester || 'Semester 5';

        // Card 5: Today's Study Focus Time
        const focusValEl = document.getElementById('stat-focus-time');
        if (focusValEl) {
            const mins = focusData.minutes || 90;
            if (mins >= 60) {
                const hrs = (mins / 60).toFixed(1);
                focusValEl.textContent = `${hrs}h`;
            } else {
                focusValEl.textContent = `${mins}m`;
            }
        }
    },

    // Renders top 3 high-priority uncompleted tasks with quick-toggle checkbox
    renderTopPriorityTasks() {
        const container = document.getElementById('top-priority-tasks-list');
        if (!container) return;

        const tasks = Storage.loadTasks();
        const uncompleted = tasks
            .filter(t => t.status !== 'completed')
            .sort((a, b) => (a.priority === 'high' ? -1 : 1));

        if (uncompleted.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">🎉</span>
                    <p class="empty-state-text">No urgent tasks — all caught up!</p>
                </div>
            `;
            return;
        }

        const top3 = uncompleted.slice(0, 3);
        container.innerHTML = top3.map(task => `
            <div class="dash-task-item searchable-item" data-task-id="${task.id}">
                <div class="dash-task-left">
                    <button class="dash-task-check" onclick="Dashboard.toggleTaskComplete('${task.id}')" aria-label="Mark task as complete"></button>
                    <div class="dash-task-info">
                        <span class="dash-task-title">${task.title}</span>
                        <span class="dash-task-meta">${task.course || 'General'} • Due ${task.dueDate}</span>
                    </div>
                </div>
                <span class="badge badge-priority-${task.priority || 'medium'}">${(task.priority || 'medium').toUpperCase()}</span>
            </div>
        `).join('');
    },

    // Quick completion action directly from the Dashboard
    toggleTaskComplete(taskId) {
        Storage.updateTask(taskId, { status: 'completed' });
        this.renderDashboard();
    },

    // Renders today's schedule preview
    renderTodaySchedule() {
        const container = document.getElementById('today-schedule-list');
        if (!container) return;

        const schedule = [
            { time: '09:00 - 10:30', course: 'CS301 — Operating Systems', room: 'Hall B • Prof. Harrison', status: 'Completed', statusClass: 'completed' },
            { time: '11:00 - 12:30', course: 'MATH204 — Linear Algebra', room: 'Room 302 • Dr. Zhao', status: 'Upcoming', statusClass: 'upcoming' },
            { time: '14:00 - 16:00', course: 'CS405 — Web Engineering Lab', room: 'Lab 4 • Tech Hub', status: 'Later Today', statusClass: 'later' }
        ];

        container.innerHTML = schedule.map(item => `
            <div class="schedule-item searchable-item">
                <span class="schedule-time">${item.time}</span>
                <div class="schedule-info">
                    <div class="schedule-course">${item.course}</div>
                    <div class="schedule-location">${item.room}</div>
                </div>
                <span class="schedule-status ${item.statusClass}">${item.status}</span>
            </div>
        `).join('');
    }
};

window.Dashboard = Dashboard;