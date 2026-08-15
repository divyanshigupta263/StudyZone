/**
 * StudyZone - Attendance Tracker & Advice Calculator (js/attendance.js)
 * Day 5 - Task 1: Subject attendance tracking, "+ Present" / "+ Absent" logging, Smart Bunk Advice, & Scratchpad.
 */

document.addEventListener('DOMContentLoaded', () => {
    AttendanceManager.init();
});

const AttendanceManager = {
    editingId: null,
    historyStack: {}, // Stores previous state per subject for Undo action

    init() {
        this.seedDefaultSubjects();
        this.bindEvents();
        this.renderAttendance();
    },

    seedDefaultSubjects() {
        const existing = Storage.loadData('attendance', null);
        if (!existing || existing.length === 0) {
            const defaults = [
                { id: 'att_1', code: 'CS301', name: 'Operating Systems', attended: 22, total: 24, target: 75 },
                { id: 'att_2', code: 'MATH204', name: 'Linear Algebra', attended: 16, total: 20, target: 75 },
                { id: 'att_3', code: 'CS302', name: 'Databases', attended: 12, total: 16, target: 75 },
                { id: 'att_4', code: 'CS405', name: 'Web Engineering', attended: 11, total: 16, target: 75 }
            ];
            Storage.saveData('attendance', defaults);
        }
    },

    bindEvents() {
        // Add Subject Button
        const addBtn = document.getElementById('btn-add-subject');
        if (addBtn) addBtn.addEventListener('click', () => this.openCreateModal());

        // Modal Close triggers
        const closeBtn = document.getElementById('close-att-modal');
        const cancelBtn = document.getElementById('cancel-att-modal');
        const backdrop = document.getElementById('att-modal-backdrop');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (backdrop) backdrop.addEventListener('click', () => this.closeModal());

        // Modal Form Submit
        const form = document.getElementById('att-editor-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveSubject();
            });
        }

        // Quick Scratchpad Calculator Inputs
        const scratchAttended = document.getElementById('scratch-attended');
        const scratchTotal = document.getElementById('scratch-total');
        const scratchTarget = document.getElementById('scratch-target');

        [scratchAttended, scratchTotal, scratchTarget].forEach(input => {
            if (input) input.addEventListener('input', () => this.calculateScratchpad());
        });
    },

    // 1. Modal Dialog Logic
    openCreateModal() {
        this.editingId = null;
        document.getElementById('att-modal-title').textContent = 'Add New Subject';
        document.getElementById('att-code-input').value = '';
        document.getElementById('att-name-input').value = '';
        document.getElementById('att-attended-input').value = '0';
        document.getElementById('att-total-input').value = '0';
        document.getElementById('att-target-input').value = '75';

        const modal = document.getElementById('att-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    openEditModal(id) {
        const subjects = Storage.loadData('attendance', []);
        const item = subjects.find(s => s.id === id);
        if (!item) return;

        this.editingId = id;
        document.getElementById('att-modal-title').textContent = 'Edit Subject Attendance';
        document.getElementById('att-code-input').value = item.code || '';
        document.getElementById('att-name-input').value = item.name || '';
        document.getElementById('att-attended-input').value = item.attended || 0;
        document.getElementById('att-total-input').value = item.total || 0;
        document.getElementById('att-target-input').value = item.target || 75;

        const modal = document.getElementById('att-modal-backdrop');
        if (modal) modal.classList.add('active');
    },

    closeModal() {
        this.editingId = null;
        const modal = document.getElementById('att-modal-backdrop');
        if (modal) modal.classList.remove('active');
    },

    handleSaveSubject() {
        const code = document.getElementById('att-code-input').value.trim().toUpperCase();
        const name = document.getElementById('att-name-input').value.trim();
        const attended = parseInt(document.getElementById('att-attended-input').value, 10) || 0;
        const total = parseInt(document.getElementById('att-total-input').value, 10) || 0;
        const target = parseInt(document.getElementById('att-target-input').value, 10) || 75;

        if (!code || !name) {
            alert('Please fill in Subject Code and Name!');
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
                subjects[index] = { ...subjects[index], code, name, attended, total, target };
            }
        } else {
            subjects.push({
                id: 'att_' + Date.now(),
                code,
                name,
                attended,
                total,
                target
            });
        }

        Storage.saveData('attendance', subjects);
        this.closeModal();
        this.renderAttendance();
        this.syncDashboard();
    },

    deleteSubject(id) {
        if (confirm('Are you sure you want to delete this subject?')) {
            const subjects = Storage.loadData('attendance', []);
            const updated = subjects.filter(s => s.id !== id);
            Storage.saveData('attendance', updated);
            this.renderAttendance();
            this.syncDashboard();
        }
    },

    // 2. Attendance Actions (+ Present, + Absent, Undo)
    markPresent(id) {
        const subjects = Storage.loadData('attendance', []);
        const item = subjects.find(s => s.id === id);
        if (!item) return;

        // Save history for Undo
        this.historyStack[id] = { attended: item.attended, total: item.total };

        item.attended += 1;
        item.total += 1;

        Storage.saveData('attendance', subjects);
        this.renderAttendance();
        this.syncDashboard();
    },

    markAbsent(id) {
        const subjects = Storage.loadData('attendance', []);
        const item = subjects.find(s => s.id === id);
        if (!item) return;

        // Save history for Undo
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

    // 3. Smart Attendance & Bunk Advice Engine
    calculateAdvice(attended, total, targetPct = 75) {
        if (total === 0) return { pct: 100, text: 'No classes held yet', status: 'safe' };

        const pct = (attended / total) * 100;
        const targetDecimal = targetPct / 100;

        let status = 'safe';
        if (pct < 65) status = 'critical';
        else if (pct < targetPct) status = 'warning';

        if (pct < targetPct) {
            // Need to attend 'x' consecutive classes: (attended + x) / (total + x) >= targetDecimal
            const x = Math.ceil((targetDecimal * total - attended) / (1 - targetDecimal));
            return {
                pct,
                status,
                text: `Attend next <strong>${x}</strong> consecutive class${x > 1 ? 'es' : ''} to reach ${targetPct}%`
            };
        } else {
            // Can safely miss 'y' classes: attended / (total + y) >= targetDecimal
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

    // 4. Scratchpad Mini Calculator Logic
    calculateScratchpad() {
        const attended = parseInt(document.getElementById('scratch-attended').value, 10) || 0;
        const total = parseInt(document.getElementById('scratch-total').value, 10) || 0;
        const target = parseInt(document.getElementById('scratch-target').value, 10) || 75;

        const resultEl = document.getElementById('scratch-result-box');
        if (!resultEl) return;

        if (total === 0) {
            resultEl.innerHTML = `<span style="color:var(--text-muted);">Enter class counts to calculate what-if scenarios.</span>`;
            return;
        }

        const advice = this.calculateAdvice(attended, total, target);
        resultEl.innerHTML = `
            <div class="scratch-result-header">
                <span class="scratch-result-pct" style="color: var(--accent-${advice.status === 'safe' ? 'emerald' : advice.status === 'warning' ? 'amber' : 'rose'});">
                    ${advice.pct.toFixed(1)}%
                </span>
                <span class="badge-status ${advice.status}">${advice.status.toUpperCase()}</span>
            </div>
            <div class="scratch-result-advice">${advice.text}</div>
        `;
    },

    // 5. Sync with Dashboard Overview
    syncDashboard() {
        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
    },

    // 6. Main Render Engine
    renderAttendance() {
        const container = document.getElementById('attendance-cards-grid');
        if (!container) return;

        const subjects = Storage.loadData('attendance', []);

        // Calculate Aggregate Total
        let grandAttended = 0;
        let grandTotal = 0;

        subjects.forEach(s => {
            grandAttended += (s.attended || 0);
            grandTotal += (s.total || 0);
        });

        const overallPct = grandTotal > 0 ? ((grandAttended / grandTotal) * 100) : 100;
        
        let overallStatus = 'safe';
        let overallText = 'You are on track!';
        if (overallPct < 65) {
            overallStatus = 'critical';
            overallText = 'Shortage risk! High priority.';
        } else if (overallPct < 75) {
            overallStatus = 'warning';
            overallText = 'Attendance dipping — attend next classes!';
        }

        // Render Top Health Overview Card
        document.getElementById('att-overall-pct').textContent = overallPct.toFixed(1) + '%';
        const badgeEl = document.getElementById('att-overall-badge');
        if (badgeEl) {
            badgeEl.className = `badge-status ${overallStatus}`;
            badgeEl.textContent = overallStatus.toUpperCase();
        }
        document.getElementById('att-overall-text').textContent = overallText;
        
        const progressBar = document.getElementById('att-overall-progress');
        if (progressBar) {
            progressBar.style.width = `${Math.min(overallPct, 100)}%`;
            progressBar.style.backgroundColor = `var(--accent-${overallStatus === 'safe' ? 'emerald' : overallStatus === 'warning' ? 'amber' : 'rose'})`;
        }

        // Render Subject Cards
        if (subjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <span class="empty-state-icon">📊</span>
                    <p class="empty-state-text">No subjects added yet. Click "+ Add Subject" to start tracking!</p>
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
                            <span class="badge badge-course">${s.code}</span>
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
                            <button class="btn-action-icon" onclick="AttendanceManager.openEditModal('${s.id}')" title="Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 2 2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-action-icon delete" onclick="AttendanceManager.deleteSubject('${s.id}')" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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

window.AttendanceManager = AttendanceManager;