/**
 * StudyZone - Focus Timer Module (js/timer.js)
 * Focus Countdown, SVG Ring Animation, Actual Time Studied Logger & Interactive Session Modals.
 */

document.addEventListener('DOMContentLoaded', () => {
    FocusTimer.init();
});

const FocusTimer = {
    mode: 'focus', // 'focus', 'shortBreak', 'longBreak'
    durationMap: {
        focus: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
    },
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    sessionActualSeconds: 0, // Actual time studied in current session
    isRunning: false,
    timerInterval: null,
    completedSessions: 0,

    init() {
        this.loadSettings();
        this.bindEvents();
        this.populateTaskDropdown();
        this.updateDisplay();
    },

    loadSettings() {
        const savedCustom = Storage.loadData('pomodoro_custom_durations', null);
        if (savedCustom) {
            this.durationMap = savedCustom;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const todayLog = Storage.loadData('pomodoro_today', null);

        if (!todayLog || todayLog.date !== todayStr) {
            Storage.saveData('pomodoro_today', {
                date: todayStr,
                totalSeconds: 0,
                totalMinutes: 0,
                minutes: 0,
                completedCount: 0
            });
            Storage.saveData('pomodoro_sessions_log', []);
        }

        const currentLog = Storage.loadData('pomodoro_today', { totalMinutes: 0, completedCount: 0 });
        this.completedSessions = currentLog.completedCount || 0;

        this.updateModePillLabels();
        this.setMode('focus');
    },

    bindEvents() {
        // Mode Pills
        const modeBtns = document.querySelectorAll('.timer-mode-pill');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetMode = btn.getAttribute('data-mode');
                this.setMode(targetMode);
            });
        });

        // Main Controls
        const startBtn = document.getElementById('btn-timer-toggle');
        const resetBtn = document.getElementById('btn-timer-reset');
        const skipBtn = document.getElementById('btn-timer-skip');
        const settingsBtn = document.getElementById('btn-timer-settings');

        if (startBtn) startBtn.addEventListener('click', () => this.toggleTimer());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetTimer());
        if (skipBtn) skipBtn.addEventListener('click', () => this.skipMode());
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.openSettingsModal());

        // Settings Modal Close
        const closeBtn = document.getElementById('close-timer-modal');
        const cancelBtn = document.getElementById('cancel-timer-modal');
        const backdrop = document.getElementById('timer-modal-backdrop');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeSettingsModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeSettingsModal());
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) this.closeSettingsModal();
            });
        }

        // Completion Modal Events
        const completeContinueBtn = document.getElementById('btn-timer-complete-continue');
        const completeBackdrop = document.getElementById('timer-complete-modal-backdrop');
        if (completeContinueBtn) {
            completeContinueBtn.addEventListener('click', () => {
                this.closeCompletionModal();
                if (this.pendingNextMode) {
                    this.setMode(this.pendingNextMode);
                    this.pendingNextMode = null;
                }
            });
        }
        if (completeBackdrop) {
            completeBackdrop.addEventListener('click', (e) => {
                if (e.target === completeBackdrop) {
                    this.closeCompletionModal();
                    if (this.pendingNextMode) {
                        this.setMode(this.pendingNextMode);
                        this.pendingNextMode = null;
                    }
                }
            });
        }

        // Session Detail Modal Events
        const closeSessionModalBtn = document.getElementById('close-session-info-modal');
        const closeSessionBtn = document.getElementById('close-session-info-btn');
        const sessionBackdrop = document.getElementById('timer-session-info-modal-backdrop');

        if (closeSessionModalBtn) closeSessionModalBtn.addEventListener('click', () => this.closeSessionInfoModal());
        if (closeSessionBtn) closeSessionBtn.addEventListener('click', () => this.closeSessionInfoModal());
        if (sessionBackdrop) {
            sessionBackdrop.addEventListener('click', (e) => {
                if (e.target === sessionBackdrop) this.closeSessionInfoModal();
            });
        }

        // Settings Form Submit
        const form = document.getElementById('timer-settings-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveSettings();
            });
        }
    },

    updateModePillLabels() {
        const focusMin = Math.round((this.durationMap.focus || 1500) / 60);
        const shortMin = Math.round((this.durationMap.shortBreak || 300) / 60);
        const longMin = Math.round((this.durationMap.longBreak || 900) / 60);

        document.querySelectorAll('.timer-mode-pill').forEach(btn => {
            const m = btn.getAttribute('data-mode');
            if (m === 'focus') btn.textContent = `Focus (${focusMin}m)`;
            if (m === 'shortBreak') btn.textContent = `Short Break (${shortMin}m)`;
            if (m === 'longBreak') btn.textContent = `Long Break (${longMin}m)`;
        });
    },

    // 1. Set Timer Mode
    setMode(newMode) {
        this.pauseTimer();
        this.mode = newMode;
        this.sessionActualSeconds = 0;

        document.querySelectorAll('.timer-mode-pill').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-mode') === newMode);
        });

        this.totalSeconds = this.durationMap[newMode] || (25 * 60);
        this.remainingSeconds = this.totalSeconds;

        this.updateDisplay();
    },

    // 2. Start / Pause Toggle
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    },

    startTimer() {
        if (this.isRunning) return;
        this.isRunning = true;

        const toggleBtn = document.getElementById('btn-timer-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                <span>Pause</span>
            `;
            toggleBtn.classList.add('running');
        }

        this.timerInterval = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                
                if (this.mode === 'focus') {
                    this.sessionActualSeconds++;
                    this.accrueStudySecond(1);
                }

                this.updateDisplay();
            } else {
                this.handleTimerComplete();
            }
        }, 1000);
    },

    pauseTimer() {
        this.isRunning = false;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const toggleBtn = document.getElementById('btn-timer-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>Start Focus</span>
            `;
            toggleBtn.classList.remove('running');
        }
    },

    accrueStudySecond(secs = 1) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLog = Storage.loadData('pomodoro_today', { date: todayStr, totalSeconds: 0, totalMinutes: 0, minutes: 0, completedCount: 0 });

        todayLog.date = todayStr;
        todayLog.totalSeconds = (todayLog.totalSeconds || 0) + secs;
        todayLog.totalMinutes = Math.floor(todayLog.totalSeconds / 60);
        todayLog.minutes = todayLog.totalMinutes;

        Storage.saveData('pomodoro_today', todayLog);

        if (window.AppRouter && typeof window.AppRouter.recordActivityForStreak === 'function') {
            window.AppRouter.recordActivityForStreak();
        }

        // Sync with selected Study Goal subject
        const selectEl = document.getElementById('timer-task-select');
        if (selectEl && selectEl.value) {
            const val = selectEl.value;
            if (val.startsWith('sg_')) {
                const sgId = val.replace('sg_', '');
                if (window.AttendanceManager && typeof window.AttendanceManager.quickLogTime === 'function') {
                    window.AttendanceManager.quickLogTime(sgId, secs / 3600);
                }
            }
        }

        this.syncDashboard();
    },

    resetTimer() {
        this.pauseTimer();
        this.sessionActualSeconds = 0;
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
    },

    skipMode() {
        if (this.mode === 'focus') {
            this.setMode('shortBreak');
        } else {
            this.setMode('focus');
        }
    },

    getSelectedTaskTitle() {
        const selectEl = document.getElementById('timer-task-select');
        if (selectEl && selectEl.options && selectEl.selectedIndex >= 0) {
            const selectedOpt = selectEl.options[selectEl.selectedIndex];
            if (selectedOpt && selectedOpt.text && !selectedOpt.text.includes('General Study')) {
                return selectedOpt.text.replace(/^[📋📚⏱️]\s*/, '');
            }
        }
        return 'General Study Session';
    },

    // 3. Custom In-App Completion Popup (Replaces Browser Alert)
    handleTimerComplete() {
        this.pauseTimer();
        this.playAudioChime();

        const topicStr = this.getSelectedTaskTitle();
        const actualSecs = this.sessionActualSeconds > 0 ? this.sessionActualSeconds : (this.totalSeconds - this.remainingSeconds);
        const actualDurationText = this.formatStudyTime(actualSecs);
        const setTargetText = Math.round(this.totalSeconds / 60) + 'm';
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const todayStr = new Date().toISOString().split('T')[0];

        if (this.mode === 'focus') {
            this.completedSessions++;
            const todayLog = Storage.loadData('pomodoro_today', { totalMinutes: 0 });
            todayLog.completedCount = this.completedSessions;
            Storage.saveData('pomodoro_today', todayLog);

            // Save actual studied duration into session log
            const sessionLogs = Storage.loadData('pomodoro_sessions_log', []);
            sessionLogs.push({
                id: 'sess_' + Date.now(),
                date: todayStr,
                topic: topicStr,
                duration: actualDurationText,
                setTarget: setTargetText,
                actualSeconds: actualSecs,
                timeStr: timeStr,
                sessionNum: this.completedSessions
            });
            Storage.saveData('pomodoro_sessions_log', sessionLogs);

            this.syncDashboard();

            // Set up custom in-app popup content with actual studied duration
            document.getElementById('timer-complete-emoji').textContent = '🎉';
            document.getElementById('timer-complete-title').textContent = 'Focus Session Complete!';
            document.getElementById('timer-complete-desc').textContent = 'Great job completing your focus session! Time to take a well-deserved break.';
            document.getElementById('timer-complete-topic').textContent = topicStr;
            document.getElementById('timer-complete-meta').textContent = `Actual Studied: ${actualDurationText} (Target: ${setTargetText}) • Session #${this.completedSessions}`;
            document.getElementById('btn-timer-complete-continue').textContent = 'Start Short Break ☕';

            this.pendingNextMode = 'shortBreak';
            this.openCompletionModal();
        } else {
            document.getElementById('timer-complete-emoji').textContent = '⚡';
            document.getElementById('timer-complete-title').textContent = 'Break Time Finished!';
            document.getElementById('timer-complete-desc').textContent = 'Break is over! Ready to dive into your next focus session?';
            document.getElementById('timer-complete-topic').textContent = topicStr;
            document.getElementById('timer-complete-meta').textContent = `Ready for next focus goal`;
            document.getElementById('btn-timer-complete-continue').textContent = 'Start Focus Session 🎯';

            this.pendingNextMode = 'focus';
            this.openCompletionModal();
        }
    },

    openCompletionModal() {
        const modal = document.getElementById('timer-complete-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    closeCompletionModal() {
        const modal = document.getElementById('timer-complete-modal-backdrop');
        if (modal) modal.classList.remove('active');
    },

    // 4. Clickable Session Info Detail Modal (Shows Actual Studied Duration vs Set Target)
    openSessionInfoModal(index) {
        const sessionLogs = Storage.loadData('pomodoro_sessions_log', []);
        const item = sessionLogs[index];

        const topicEl = document.getElementById('session-detail-topic');
        const durEl = document.getElementById('session-detail-duration');
        const timeEl = document.getElementById('session-detail-time');
        const titleEl = document.getElementById('session-info-modal-title');

        if (item) {
            if (titleEl) titleEl.textContent = `Session #${item.sessionNum || (index + 1)} Details`;
            if (topicEl) topicEl.textContent = item.topic || 'General Study';
            if (durEl) durEl.textContent = `${item.duration} (Target: ${item.setTarget || '25m'})`;
            if (timeEl) timeEl.textContent = item.timeStr || 'Today';
        } else {
            // Live details for session currently running or pending
            const currentActual = this.sessionActualSeconds > 0 ? this.formatStudyTime(this.sessionActualSeconds) : '0m';
            const setTarget = Math.round(this.totalSeconds / 60) + 'm';
            if (titleEl) titleEl.textContent = `Session #${index + 1} Details`;
            if (topicEl) topicEl.textContent = this.getSelectedTaskTitle();
            if (durEl) durEl.textContent = `${currentActual} (Target: ${setTarget})`;
            if (timeEl) timeEl.textContent = this.isRunning ? 'In Progress ⏱️' : 'Not started yet';
        }

        const modal = document.getElementById('timer-session-info-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    closeSessionInfoModal() {
        const modal = document.getElementById('timer-session-info-modal-backdrop');
        if (modal) modal.classList.remove('active');
    },

    playAudioChime() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.3);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.6);
        } catch (e) {
            console.warn('Audio chime unavailable:', e);
        }
    },

    formatStudyTime(totalSecs) {
        if (!totalSecs || totalSecs <= 0) return '0m';
        if (totalSecs < 60) return `${totalSecs}s`;
        const mins = Math.floor(totalSecs / 60);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
    },

    // 5. Update Display, SVG Ring, & Session Dots
    updateDisplay() {
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const timeDisplay = document.getElementById('timer-time-display');
        if (timeDisplay) timeDisplay.textContent = formatted;

        // Dynamic Document Tab Title
        const modeLabel = this.mode === 'focus' ? 'Focus' : 'Break';
        document.title = `(${formatted}) ${modeLabel} — StudyZone`;

        // SVG Circle Progress Ring
        const ringFill = document.getElementById('timer-ring-fill');
        if (ringFill) {
            const circumference = 2 * Math.PI * 140; // r=140 => 879.64
            const offset = circumference * (1 - this.remainingSeconds / this.totalSeconds);
            ringFill.style.strokeDashoffset = offset;
        }

        // Update Session Dots & Today's Study Time Stats
        this.renderStats();
    },

    renderStats() {
        const dotsContainer = document.getElementById('timer-session-dots');
        if (dotsContainer) {
            const activeDots = this.completedSessions % 4;
            const sessionLogs = Storage.loadData('pomodoro_sessions_log', []);

            dotsContainer.innerHTML = [1, 2, 3, 4].map((num, idx) => {
                const isActive = num <= activeDots;
                const logItem = sessionLogs[idx];
                const tooltipText = logItem 
                    ? `Session #${num}: ${this.escapeHtml(logItem.topic)} (${logItem.duration})` 
                    : `Session #${num}: Click for details`;

                return `
                    <div class="session-dot ${isActive ? 'active' : ''}" 
                         style="cursor:pointer; transition:transform 0.2s ease;" 
                         onclick="FocusTimer.openSessionInfoModal(${idx})" 
                         title="${tooltipText}"></div>
                `;
            }).join('');
        }

        const todayLog = Storage.loadData('pomodoro_today', { totalSeconds: 0, totalMinutes: 0 });
        const totalSecs = todayLog.totalSeconds || ((todayLog.totalMinutes || todayLog.minutes || 0) * 60);

        const hoursEl = document.getElementById('timer-total-hours');
        if (hoursEl) hoursEl.textContent = this.formatStudyTime(totalSecs);
    },

    // 6. Populate Active Task & Study Goals Dropdown
    populateTaskDropdown() {
        const select = document.getElementById('timer-task-select');
        if (!select) return;

        const studyGoals = Storage.loadData('study_goals', []);
        const tasks = Storage.loadTasks().filter(t => t.status !== 'completed');
        const assignments = Storage.loadData('assignments', []).filter(a => a.status !== 'Submitted');

        select.innerHTML = `<option value="">General Study / No specific task</option>`;

        if (studyGoals.length > 0) {
            select.innerHTML += `<optgroup label="Daily Study Goals / Subjects">` + studyGoals.map(sg => `<option value="sg_${sg.id}">⏱️ ${this.escapeHtml(sg.name)}</option>`).join('') + `</optgroup>`;
        }

        if (tasks.length > 0) {
            select.innerHTML += `<optgroup label="Tasks">` + tasks.map(t => `<option value="task_${t.id}">📋 ${this.escapeHtml(t.title)}</option>`).join('') + `</optgroup>`;
        }

        if (assignments.length > 0) {
            select.innerHTML += `<optgroup label="Assignments">` + assignments.map(a => `<option value="assign_${a.id}">📚 ${this.escapeHtml(a.title)}</option>`).join('') + `</optgroup>`;
        }
    },

    // 7. Custom Timer Settings Modal
    openSettingsModal() {
        const fInput = document.getElementById('custom-focus-min');
        const sInput = document.getElementById('custom-short-min');
        const lInput = document.getElementById('custom-long-min');

        if (fInput) fInput.value = Math.round((this.durationMap.focus || 1500) / 60);
        if (sInput) sInput.value = Math.round((this.durationMap.shortBreak || 300) / 60);
        if (lInput) lInput.value = Math.round((this.durationMap.longBreak || 900) / 60);

        const modal = document.getElementById('timer-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    closeSettingsModal() {
        const modal = document.getElementById('timer-modal-backdrop');
        if (modal) modal.classList.remove('active');
    },

    handleSaveSettings() {
        const fMin = parseInt(document.getElementById('custom-focus-min').value, 10) || 25;
        const sMin = parseInt(document.getElementById('custom-short-min').value, 10) || 5;
        const lMin = parseInt(document.getElementById('custom-long-min').value, 10) || 15;

        this.durationMap = {
            focus: fMin * 60,
            shortBreak: sMin * 60,
            longBreak: lMin * 60
        };

        Storage.saveData('pomodoro_custom_durations', this.durationMap);
        this.updateModePillLabels();
        this.closeSettingsModal();
        this.setMode(this.mode);
    },

    syncDashboard() {
        const todayLog = Storage.loadData('pomodoro_today', { totalSeconds: 0, totalMinutes: 0 });
        const totalSecs = todayLog.totalSeconds || ((todayLog.totalMinutes || todayLog.minutes || 0) * 60);
        const formattedStr = this.formatStudyTime(totalSecs);

        const dashEl = document.getElementById('stat-focus-time');
        if (dashEl) dashEl.textContent = formattedStr;

        const hoursEl = document.getElementById('timer-total-hours');
        if (hoursEl) hoursEl.textContent = formattedStr;

        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
        if (window.AttendanceManager && typeof window.AttendanceManager.renderStudyTracker === 'function') {
            window.AttendanceManager.renderStudyTracker();
        }
    },

    escapeHtml(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
};

window.FocusTimer = FocusTimer;
window.PomodoroTimer = FocusTimer;