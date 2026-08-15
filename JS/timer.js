/**
 * StudyZone - Pomodoro Focus Timer Module (js/timer.js)
 * Day 6 - Task 1: Focus Countdown, SVG Ring Animation, Web Audio Chime, & Dashboard Study Time Sync.
 */

document.addEventListener('DOMContentLoaded', () => {
    PomodoroTimer.init();
});

const PomodoroTimer = {
    mode: 'focus', // 'focus', 'shortBreak', 'longBreak'
    durationMap: {
        focus: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
    },
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
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

        const todayLog = Storage.loadData('pomodoro_today', null);
        if (!todayLog || todayLog.date !== new Date().toISOString().split('T')[0]) {
            Storage.saveData('pomodoro_today', {
                date: new Date().toISOString().split('T')[0],
                totalMinutes: 90, // Default 1.5h sample
                completedCount: 3
            });
        }

        const currentLog = Storage.loadData('pomodoro_today', { totalMinutes: 90, completedCount: 3 });
        this.completedSessions = currentLog.completedCount || 0;

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

        // Modal Close
        const closeBtn = document.getElementById('close-timer-modal');
        const cancelBtn = document.getElementById('cancel-timer-modal');
        const backdrop = document.getElementById('timer-modal-backdrop');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeSettingsModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeSettingsModal());
        if (backdrop) backdrop.addEventListener('click', () => this.closeSettingsModal());

        // Settings Form Submit
        const form = document.getElementById('timer-settings-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveSettings();
            });
        }
    },

    // 1. Set Timer Mode
    setMode(newMode) {
        this.pauseTimer();
        this.mode = newMode;

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

    resetTimer() {
        this.pauseTimer();
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

    // 3. Timer Completion & Web Audio Chime Synthesizer
    handleTimerComplete() {
        this.pauseTimer();
        this.playAudioChime();

        if (this.mode === 'focus') {
            this.completedSessions++;
            const loggedMinutes = Math.round(this.totalSeconds / 60);

            // Update Today's Focus Log
            const todayLog = Storage.loadData('pomodoro_today', { totalMinutes: 0, completedCount: 0 });
            todayLog.totalMinutes += loggedMinutes;
            todayLog.completedCount = this.completedSessions;
            Storage.saveData('pomodoro_today', todayLog);

            this.syncDashboard();

            alert(`🎉 Great job! You completed a ${loggedMinutes}-minute focus session.`);
            this.setMode('shortBreak');
        } else {
            alert(`⚡ Break time is over! Ready for the next focus session?`);
            this.setMode('focus');
        }
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
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5

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

    // 4. Update Display, SVG Ring, & Document Tab Title
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
            dotsContainer.innerHTML = [1, 2, 3, 4].map(num => `
                <div class="session-dot ${num <= activeDots ? 'active' : ''}"></div>
            `).join('');
        }

        const todayLog = Storage.loadData('pomodoro_today', { totalMinutes: 90 });
        const hours = (todayLog.totalMinutes / 60).toFixed(1);

        const hoursEl = document.getElementById('timer-total-hours');
        if (hoursEl) hoursEl.textContent = `${hours}h`;
    },

    // 5. Populate Active Task Association Dropdown
    populateTaskDropdown() {
        const select = document.getElementById('timer-task-select');
        if (!select) return;

        const tasks = Storage.loadTasks().filter(t => t.status !== 'completed');
        const assignments = Storage.loadData('assignments', []).filter(a => a.status !== 'Submitted');

        select.innerHTML = `<option value="">General Study / No specific task</option>`;

        if (tasks.length > 0) {
            select.innerHTML += `<optgroup label="Tasks">` + tasks.map(t => `<option value="task_${t.id}">📋 ${this.escapeHtml(t.title)}</option>`).join('') + `</optgroup>`;
        }

        if (assignments.length > 0) {
            select.innerHTML += `<optgroup label="Assignments">` + assignments.map(a => `<option value="assign_${a.id}">📚 ${this.escapeHtml(a.title)}</option>`).join('') + `</optgroup>`;
        }
    },

    // 6. Custom Timer Settings Modal
    openSettingsModal() {
        document.getElementById('custom-focus-min').value = Math.round((this.durationMap.focus || 1500) / 60);
        document.getElementById('custom-short-min').value = Math.round((this.durationMap.shortBreak || 300) / 60);
        document.getElementById('custom-long-min').value = Math.round((this.durationMap.longBreak || 900) / 60);

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
        this.closeSettingsModal();
        this.setMode(this.mode);
    },

    syncDashboard() {
        const todayLog = Storage.loadData('pomodoro_today', { totalMinutes: 90 });
        const hoursStr = (todayLog.totalMinutes / 60).toFixed(1) + 'h';

        const dashEl = document.getElementById('stat-focus-time');
        if (dashEl) dashEl.textContent = hoursStr;

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

window.PomodoroTimer = PomodoroTimer;