/**
 * StudyZone - Attendance & Daily Study Hours Goal Tracker (js/attendance.js)
 * Completely separated Class Lecture Attendance (number of classes) and Daily Study Hours Tracker (hours & minutes).
 */

document.addEventListener('DOMContentLoaded', () => {
    AttendanceManager.init();
});

const AttendanceManager = {
    editingId: null,
    editingStudyId: null,
    historyStack: {},
    activeTab: 'lectures',

    init() {
        this.bindEvents();
        this.renderAttendance();
        this.renderStudyTracker();
    },

    bindEvents() {
        // Dynamic "+ Add" button in header
        const addBtn = document.getElementById('btn-add-subject');
        if (addBtn) addBtn.addEventListener('click', () => this.handleTopAddButtonClick());

        // Class Attendance Modal Listeners
        const closeAttBtn = document.getElementById('close-att-modal');
        const cancelAttBtn = document.getElementById('cancel-att-modal');
        const backdropAtt = document.getElementById('att-modal-backdrop');
        if (closeAttBtn) closeAttBtn.addEventListener('click', () => this.closeAttModal());
        if (cancelAttBtn) cancelAttBtn.addEventListener('click', () => this.closeAttModal());
        if (backdropAtt) backdropAtt.addEventListener('click', (e) => {
            if (e.target === backdropAtt) this.closeAttModal();
        });

        const attForm = document.getElementById('att-editor-form');
        if (attForm) {
            attForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveClassSubject();
            });
        }

        // Study Goal Modal Listeners
        const closeStudyBtn = document.getElementById('close-study-modal');
        const cancelStudyBtn = document.getElementById('cancel-study-modal');
        const backdropStudy = document.getElementById('study-modal-backdrop');
        if (closeStudyBtn) closeStudyBtn.addEventListener('click', () => this.closeStudyModal());
        if (cancelStudyBtn) cancelStudyBtn.addEventListener('click', () => this.closeStudyModal());
        if (backdropStudy) backdropStudy.addEventListener('click', (e) => {
            if (e.target === backdropStudy) this.closeStudyModal();
        });

        const studyForm = document.getElementById('study-editor-form');
        if (studyForm) {
            studyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveStudyGoal();
            });
        }

        // Log Time Modal Listeners
        const closeLogBtn = document.getElementById('close-log-modal');
        const cancelLogBtn = document.getElementById('cancel-log-modal');
        const backdropLog = document.getElementById('log-time-modal-backdrop');
        if (closeLogBtn) closeLogBtn.addEventListener('click', () => this.closeLogModal());
        if (cancelLogBtn) cancelLogBtn.addEventListener('click', () => this.closeLogModal());
        if (backdropLog) backdropLog.addEventListener('click', (e) => {
            if (e.target === backdropLog) this.closeLogModal();
        });

        const logForm = document.getElementById('log-time-form');
        if (logForm) {
            logForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveLogTime();
            });
        }
    },

    handleTopAddButtonClick() {
        if (this.activeTab === 'lectures') {
            this.openCreateAttModal();
        } else {
            this.openCreateStudyModal();
        }
    },

    switchTab(tab) {
        this.activeTab = tab;
        const lecturesBtn = document.getElementById('att-tab-lectures');
        const studyBtn = document.getElementById('att-tab-study');
        const lecturesPanel = document.getElementById('att-panel-lectures');
        const studyPanel = document.getElementById('att-panel-study');
        const btnText = document.getElementById('btn-add-subject-text');

        if (tab === 'lectures') {
            if (lecturesBtn) lecturesBtn.classList.add('active');
            if (studyBtn) studyBtn.classList.remove('active');
            if (lecturesPanel) lecturesPanel.style.display = 'block';
            if (studyPanel) studyPanel.style.display = 'none';
            if (btnText) btnText.textContent = 'Add Class Subject';
            this.renderAttendance();
        } else {
            if (lecturesBtn) lecturesBtn.classList.remove('active');
            if (studyBtn) studyBtn.classList.add('active');
            if (lecturesPanel) lecturesPanel.style.display = 'none';
            if (studyPanel) studyPanel.style.display = 'block';
            if (btnText) btnText.textContent = 'Add Study Goal';
            this.renderStudyTracker();
        }
    },

    // ==========================================
    // 1. CLASS LECTURES ATTENDANCE (Number of classes)
    // ==========================================
    openCreateAttModal() {
        if (!Storage.requireAuth()) return;
        this.editingId = null;
        document.getElementById('att-modal-title').textContent = 'Add Class Subject';
        document.getElementById('att-name-input').value = '';
        document.getElementById('att-attended-input').value = '0';
        document.getElementById('att-total-input').value = '0';
        document.getElementById('att-target-input').value = '75';

        const modal = document.getElementById('att-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    openEditAttModal(id) {
        if (!Storage.requireAuth()) return;
        const subjects = Storage.loadData('attendance', []);
        const item = subjects.find(s => s.id === id);
        if (!item) return;

        this.editingId = id;
        document.getElementById('att-modal-title').textContent = 'Edit Class Subject';
        document.getElementById('att-name-input').value = item.name || '';
        document.getElementById('att-attended-input').value = item.attended || 0;
        document.getElementById('att-total-input').value = item.total || 0;
        document.getElementById('att-target-input').value = item.target || 75;

        const modal = document.getElementById('att-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    closeAttModal() {
        this.editingId = null;
        const modal = document.getElementById('att-modal-backdrop');
        if (modal) modal.classList.remove('active');
    },

    handleSaveClassSubject() {
        if (!Storage.requireAuth()) return;

        const name = document.getElementById('att-name-input').value.trim();
        const attended = parseInt(document.getElementById('att-attended-input').value, 10) || 0;
        const total = parseInt(document.getElementById('att-total-input').value, 10) || 0;
        const target = parseInt(document.getElementById('att-target-input').value, 10) || 75;

        if (!name) {
            alert('Please fill in Subject Name!');
            return;
        }

        if (attended > total) {
            alert('Attended classes cannot be greater than total classes!');
            return;
        }

        const subjects = Storage.loadData('attendance', []);

        if (this.editingId) {
            const index = subjects.findIndex(s => s.id === this.editingId);
            if (index >= 0) {
                subjects[index] = { ...subjects[index], name, attended, total, target };
            }
        } else {
            subjects.push({
                id: 'att_' + Date.now(),
                name,
                attended,
                total,
                target
            });
        }

        Storage.saveData('attendance', subjects);
        this.closeAttModal();
        this.renderAttendance();
        this.syncDashboard();
    },

    deleteClassSubject(id) {
        if (!Storage.requireAuth()) return;

        if (confirm('Are you sure you want to delete this class subject?')) {
            const subjects = Storage.loadData('attendance', []);
            const updated = subjects.filter(s => s.id !== id);
            Storage.saveData('attendance', updated);
            this.renderAttendance();
            this.syncDashboard();
        }
    },

    markPresent(id) {
        if (!Storage.requireAuth()) return;
        const subjects = Storage.loadData('attendance', []);
        const item = subjects.find(s => s.id === id);
        if (!item) return;

        this.historyStack[id] = { attended: item.attended, total: item.total };
        item.attended += 1;
        item.total += 1;

        Storage.saveData('attendance', subjects);
        this.renderAttendance();
        this.syncDashboard();
    },

    markAbsent(id) {
        if (!Storage.requireAuth()) return;
        const subjects = Storage.loadData('attendance', []);
        const item = subjects.find(s => s.id === id);
        if (!item) return;

        this.historyStack[id] = { attended: item.attended, total: item.total };
        item.total += 1;

        Storage.saveData('attendance', subjects);
        this.renderAttendance();
        this.syncDashboard();
    },

    undoAction(id) {
        if (!this.historyStack[id]) return;

        const prev = this.historyStack[id];
        const subjects = Storage.loadData('attendance', []);
        const item = subjects.find(s => s.id === id);
        if (!item) return;

        item.attended = prev.attended;
        item.total = prev.total;
        delete this.historyStack[id];

        Storage.saveData('attendance', subjects);
        this.renderAttendance();
        this.syncDashboard();
    },

    calculateAdvice(attended, total, targetPct = 75) {
        if (total === 0) return { pct: 100, text: 'No classes held yet', status: 'safe' };

        const pct = (attended / total) * 100;
        const targetDecimal = targetPct / 100;

        let status = 'safe';
        if (pct < 65) status = 'critical';
        else if (pct < targetPct) status = 'warning';

        if (pct < targetPct) {
            const x = Math.ceil((targetDecimal * total - attended) / (1 - targetDecimal));
            return {
                pct,
                status,
                text: `Attend next <strong>${x}</strong> consecutive class${x > 1 ? 'es' : ''} to reach ${targetPct}%`
            };
        } else {
            const y = Math.floor((attended - targetDecimal * total) / targetDecimal);
            if (y > 0) {
                return {
                    pct,
                    status,
                    text: `You can safely miss next <strong>${y}</strong> class${y > 1 ? 'es' : ''} and stay above ${targetPct}%`
                };
            } else {
                return {
                    pct,
                    status,
                    text: `Right at the boundary! Don't miss your next class.`
                };
            }
        }
    },

    renderAttendance() {
        const container = document.getElementById('attendance-cards-grid');
        if (!container) return;

        const subjects = Storage.loadData('attendance', []);

        let grandAttended = 0;
        let grandTotal = 0;

        subjects.forEach(s => {
            grandAttended += (s.attended || 0);
            grandTotal += (s.total || 0);
        });

        const overallPct = grandTotal > 0 ? ((grandAttended / grandTotal) * 100) : 0;
        
        let overallStatus = 'neutral';
        let overallText = 'No class subjects added yet. Track attendance below.';
        if (grandTotal > 0) {
            if (overallPct < 65) {
                overallStatus = 'critical';
                overallText = 'Shortage risk! High priority.';
            } else if (overallPct < 75) {
                overallStatus = 'warning';
                overallText = 'Attendance dipping — attend next classes!';
            } else {
                overallStatus = 'safe';
                overallText = 'You are on track!';
            }
        }

        document.getElementById('att-overall-pct').textContent = grandTotal > 0 ? overallPct.toFixed(1) + '%' : '0%';
        const badgeEl = document.getElementById('att-overall-badge');
        if (badgeEl) {
            badgeEl.className = `badge-status ${overallStatus}`;
            badgeEl.textContent = grandTotal > 0 ? overallStatus.toUpperCase() : 'NO DATA';
        }
        document.getElementById('att-overall-text').textContent = overallText;
        
        const progressBar = document.getElementById('att-overall-progress');
        if (progressBar) {
            progressBar.style.width = `${Math.min(overallPct, 100)}%`;
        }

        if (subjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <span class="empty-state-icon">📊</span>
                    <p class="empty-state-text">No class subjects added yet. Click "Add Class Subject" to track lecture attendance.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = subjects.map(s => {
            const advice = this.calculateAdvice(s.attended, s.total, s.target || 75);
            const hasHistory = !!this.historyStack[s.id];

            return `
                <div class="attendance-card searchable-item" data-id="${s.id}">
                    <div class="att-card-header">
                        <div>
                            <h3 class="att-card-title">${this.escapeHtml(s.name)}</h3>
                        </div>
                        <div class="att-card-score">
                            <span class="att-card-pct" style="color: var(--accent-${advice.status === 'safe' ? 'emerald' : advice.status === 'warning' ? 'amber' : 'rose'});">
                                ${advice.pct.toFixed(1)}%
                            </span>
                            <span class="badge-status ${advice.status}">${advice.status.toUpperCase()}</span>
                        </div>
                    </div>

                    <div class="att-card-counts">
                        <span>Attended: <strong>${s.attended}</strong> / ${s.total} classes</span>
                        <span class="att-target-label">Target: ${s.target || 75}%</span>
                    </div>

                    <div class="att-progress-bar-bg">
                        <div class="att-progress-bar-fill" style="width:${Math.min(advice.pct, 100)}%; background-color: var(--accent-${advice.status === 'safe' ? 'emerald' : advice.status === 'warning' ? 'amber' : 'rose'});"></div>
                    </div>

                    <div class="att-advice-box ${advice.status}">
                        💡 ${advice.text}
                    </div>

                    <div class="att-card-footer">
                        <div class="att-action-btns">
                            <button class="btn-att-present" onclick="AttendanceManager.markPresent('${s.id}')">+ Present</button>
                            <button class="btn-att-absent" onclick="AttendanceManager.markAbsent('${s.id}')">+ Absent</button>
                            ${hasHistory ? `<button class="btn-att-undo" onclick="AttendanceManager.undoAction('${s.id}')" title="Undo last action">↩ Undo</button>` : ''}
                        </div>

                        <div class="att-edit-actions">
                            <button class="btn-action-icon" onclick="AttendanceManager.openEditAttModal('${s.id}')" title="Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 2 2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-action-icon delete" onclick="AttendanceManager.deleteClassSubject('${s.id}')" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },


    // ==========================================
    // 2. DAILY STUDY HOURS TRACKER (Hours & Minutes)
    // ==========================================
    openCreateStudyModal() {
        if (!Storage.requireAuth()) return;
        this.editingStudyId = null;
        document.getElementById('study-modal-title').textContent = 'Add Study Goal';
        document.getElementById('study-name-input').value = '';
        document.getElementById('study-target-input').value = '2.0';
        document.getElementById('study-logged-input').value = '0';

        const modal = document.getElementById('study-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    openEditStudyModal(id) {
        if (!Storage.requireAuth()) return;
        const goals = Storage.loadData('study_goals', []);
        const item = goals.find(g => g.id === id);
        if (!item) return;

        this.editingStudyId = id;
        document.getElementById('study-modal-title').textContent = 'Edit Study Goal';
        document.getElementById('study-name-input').value = item.name || '';
        document.getElementById('study-target-input').value = item.targetHours || 2.0;
        document.getElementById('study-logged-input').value = item.loggedHoursToday || 0;

        const modal = document.getElementById('study-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    closeStudyModal() {
        this.editingStudyId = null;
        const modal = document.getElementById('study-modal-backdrop');
        if (modal) modal.classList.remove('active');
    },

    handleSaveStudyGoal() {
        if (!Storage.requireAuth()) return;

        const name = document.getElementById('study-name-input').value.trim();
        const targetHours = parseFloat(document.getElementById('study-target-input').value) || 2.0;
        const loggedHoursToday = parseFloat(document.getElementById('study-logged-input').value) || 0;

        if (!name) {
            alert('Please fill in Subject Name!');
            return;
        }

        const goals = Storage.loadData('study_goals', []);
        const todayStr = new Date().toISOString().split('T')[0];

        if (this.editingStudyId) {
            const index = goals.findIndex(g => g.id === this.editingStudyId);
            if (index >= 0) {
                goals[index] = { 
                    ...goals[index], 
                    name, 
                    targetHours: parseFloat(targetHours.toFixed(2)), 
                    loggedHoursToday: parseFloat(loggedHoursToday.toFixed(2)),
                    lastUpdatedDate: todayStr
                };
            }
        } else {
            goals.push({
                id: 'sg_' + Date.now(),
                name,
                targetHours: parseFloat(targetHours.toFixed(2)),
                loggedHoursToday: parseFloat(loggedHoursToday.toFixed(2)),
                lastUpdatedDate: todayStr
            });
        }

        Storage.saveData('study_goals', goals);
        this.closeStudyModal();
        this.renderStudyTracker();
    },

    deleteStudyGoal(id) {
        if (!Storage.requireAuth()) return;

        if (confirm('Are you sure you want to delete this study goal?')) {
            const goals = Storage.loadData('study_goals', []);
            const updated = goals.filter(g => g.id !== id);
            Storage.saveData('study_goals', updated);
            this.renderStudyTracker();
        }
    },

    openLogTimeModal(id) {
        if (!Storage.requireAuth()) return;
        const goals = Storage.loadData('study_goals', []);
        const item = goals.find(g => g.id === id);
        if (!item) return;

        // Pre-fill modal starting from logged time or target goal set during creation
        const valToDisplay = (item.loggedHoursToday && item.loggedHoursToday > 0) 
            ? item.loggedHoursToday 
            : (item.targetHours || 0);

        const hrs = Math.floor(valToDisplay);
        const mins = Math.round((valToDisplay - hrs) * 60);

        document.getElementById('log-study-id').value = id;
        document.getElementById('log-study-subject-name').textContent = item.name;
        document.getElementById('log-hours-input').value = hrs;
        document.getElementById('log-mins-input').value = mins;

        const modal = document.getElementById('log-time-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    closeLogModal() {
        const modal = document.getElementById('log-time-modal-backdrop');
        if (modal) modal.classList.remove('active');
    },

    handleSaveLogTime() {
        if (!Storage.requireAuth()) return;

        const id = document.getElementById('log-study-id').value;
        const hrs = parseInt(document.getElementById('log-hours-input').value, 10) || 0;
        const mins = parseInt(document.getElementById('log-mins-input').value, 10) || 0;

        const newTotalHours = hrs + (mins / 60);

        if (newTotalHours < 0) {
            alert('Please enter a valid study duration!');
            return;
        }

        const goals = Storage.loadData('study_goals', []);
        const item = goals.find(g => g.id === id);
        if (item) {
            const todayStr = new Date().toISOString().split('T')[0];
            item.loggedHoursToday = parseFloat(newTotalHours.toFixed(2));
            item.lastUpdatedDate = todayStr;
            Storage.saveData('study_goals', goals);
        }

        this.closeLogModal();
        this.renderStudyTracker();
    },

    quickLogTime(id, addHours) {
        if (!Storage.requireAuth()) return;
        const goals = Storage.loadData('study_goals', []);
        const item = goals.find(g => g.id === id);
        if (!item) return;

        const todayStr = new Date().toISOString().split('T')[0];
        if (item.lastUpdatedDate !== todayStr) {
            item.loggedHoursToday = 0;
            item.lastUpdatedDate = todayStr;
        }

        item.loggedHoursToday = parseFloat((item.loggedHoursToday + addHours).toFixed(2));
        Storage.saveData('study_goals', goals);
        this.renderStudyTracker();
    },

    resetTodayStudy(id) {
        if (!Storage.requireAuth()) return;
        const goals = Storage.loadData('study_goals', []);
        const item = goals.find(g => g.id === id);
        if (!item) return;

        item.loggedHoursToday = 0;
        Storage.saveData('study_goals', goals);
        this.renderStudyTracker();
    },

    renderStudyTracker() {
        const container = document.getElementById('study-cards-grid');
        if (!container) return;

        const goals = Storage.loadData('study_goals', []);
        const todayStr = new Date().toISOString().split('T')[0];

        let grandLogged = 0;
        let grandGoal = 0;
        let effectiveLoggedSum = 0;

        goals.forEach(g => {
            // Auto reset if new day
            if (g.lastUpdatedDate !== todayStr) {
                g.loggedHoursToday = 0;
                g.lastUpdatedDate = todayStr;
            }
            const logged = g.loggedHoursToday || 0;
            const target = g.targetHours || 1.0;

            grandLogged += logged;
            grandGoal += target;
            effectiveLoggedSum += Math.min(logged, target);
        });

        Storage.saveData('study_goals', goals);

        // Require EVERY single study goal task to reach its target hours
        const allGoalsCompleted = goals.length > 0 && goals.every(g => (g.loggedHoursToday || 0) >= (g.targetHours || 0));
        const overallPct = grandGoal > 0 ? Math.min((effectiveLoggedSum / grandGoal) * 100, 100) : 0;
        
        document.getElementById('study-overall-pct').textContent = grandLogged.toFixed(1) + 'h';
        document.getElementById('study-overall-text').textContent = grandGoal > 0 
            ? `Daily Goal: ${grandLogged.toFixed(1)} / ${grandGoal.toFixed(1)} hours logged today`
            : 'Click "Add Study Goal" to set daily target study hours for your subjects';

        const overallBadge = document.getElementById('study-overall-badge');
        if (overallBadge) {
            if (allGoalsCompleted) {
                overallBadge.className = 'badge-status safe';
                overallBadge.textContent = 'GOAL ACHIEVED 🎉';
            } else {
                overallBadge.className = 'badge-status warning';
                overallBadge.textContent = 'IN PROGRESS';
            }
        }

        const progressBar = document.getElementById('study-overall-progress');
        if (progressBar) {
            progressBar.style.width = `${overallPct}%`;
        }

        if (goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <span class="empty-state-icon">⏱️</span>
                    <p class="empty-state-text">No study goals added yet. Click "Add Study Goal" to track daily study hours.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = goals.map(g => {
            const logged = g.loggedHoursToday || 0;
            const targetGoal = g.targetHours || 1.0;
            const pct = Math.min((logged / targetGoal) * 100, 100);
            const isCompleted = logged >= targetGoal;
            const remaining = Math.max(targetGoal - logged, 0);

            return `
                <div class="attendance-card searchable-item" data-id="${g.id}">
                    <div class="att-card-header">
                        <div>
                            <h3 class="att-card-title">${this.escapeHtml(g.name)}</h3>
                        </div>
                        <div class="att-card-score">
                            <span class="att-card-pct" style="color: ${isCompleted ? 'var(--accent-emerald)' : 'var(--accent-purple)'};">
                                ${logged.toFixed(1)}h
                            </span>
                            <span class="badge-status ${isCompleted ? 'safe' : 'warning'}">
                                ${isCompleted ? 'GOAL MET 🎉' : 'IN PROGRESS'}
                            </span>
                        </div>
                    </div>

                    <div class="att-card-counts">
                        <span>Logged Today: <strong>${logged.toFixed(1)}h</strong></span>
                        <span class="att-target-label">Target Goal: <strong>${targetGoal.toFixed(1)}h</strong></span>
                    </div>

                    <div class="att-progress-bar-bg">
                        <div class="att-progress-bar-fill" style="width:${pct}%; background-color: ${isCompleted ? 'var(--accent-emerald)' : 'var(--accent-purple)'};"></div>
                    </div>

                    <div class="att-advice-box ${isCompleted ? 'safe' : 'warning'}">
                        ${isCompleted 
                            ? `🎉 Great job! You hit your <strong>${targetGoal} hour</strong> daily study goal for ${this.escapeHtml(g.name)}!` 
                            : `⏱️ <strong>${remaining.toFixed(1)} hours</strong> remaining to hit your ${targetGoal}h daily target.`}
                    </div>

                    <div class="att-card-footer">
                        <div class="att-action-btns">
                            <button class="btn-att-present" style="background:rgba(139,92,246,0.15); color:var(--accent-purple); border-color:rgba(139,92,246,0.3);" onclick="AttendanceManager.openLogTimeModal('${g.id}')">+ Log Time</button>
                            <button class="btn-att-present" style="background:rgba(139,92,246,0.25); color:var(--accent-purple); border-color:rgba(139,92,246,0.4);" onclick="AttendanceManager.quickLogTime('${g.id}', 0.25)">+ 15m</button>
                            <button class="btn-att-undo" onclick="AttendanceManager.resetTodayStudy('${g.id}')" title="Reset today's study log">↺ Reset</button>
                        </div>

                        <div class="att-edit-actions">
                            <button class="btn-action-icon" onclick="AttendanceManager.openEditStudyModal('${g.id}')" title="Edit Study Goal">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 2 2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-action-icon delete" onclick="AttendanceManager.deleteStudyGoal('${g.id}')" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    syncDashboard() {
        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
    },

    escapeHtml(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
};

window.AttendanceManager = AttendanceManager;