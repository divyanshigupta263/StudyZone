/**
 * StudyZone - Academic Marks & 10.0 Scale GPA Calculator Module (js/cgpa.js)
 * Semester-wise Subject Marks & SGPA, Automatic Cumulative CGPA Accumulation, and Target Planner.
 */

document.addEventListener('DOMContentLoaded', () => {
    CgpaManager.init();
});

const CgpaManager = {
    activeTab: 'sgpa', // 'sgpa', 'cgpa', 'target'
    activeSem: 'Sem 1',

    init() {
        if (window.Storage && typeof window.Storage.initCleanState === 'function') {
            window.Storage.initCleanState();
        }
        this.bindEvents();
        this.renderAll();
    },

    bindEvents() {
        // Tab Switching
        const tabBtns = document.querySelectorAll('.cgpa-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.activeTab = btn.getAttribute('data-tab') || 'sgpa';
                document.querySelectorAll('.cgpa-panel').forEach(p => p.classList.remove('active'));
                const targetPanel = document.getElementById(`panel-${this.activeTab}`);
                if (targetPanel) targetPanel.classList.add('active');

                if (this.activeTab === 'cgpa') {
                    this.renderCGPA();
                }
            });
        });

        // Semester Selector in SGPA
        const semSelector = document.getElementById('sgpa-sem-selector');
        if (semSelector) {
            semSelector.addEventListener('change', (e) => {
                this.activeSem = e.target.value || 'Sem 1';
                this.updateSGPATitles();
                this.renderSGPA();
            });
        }

        // SGPA Add Subject Row
        const addCourseBtn = document.getElementById('btn-add-course-row');
        if (addCourseBtn) addCourseBtn.addEventListener('click', () => this.addCourseRow());

        // CGPA Add Custom Semester Row
        const addSemBtn = document.getElementById('btn-add-sem-row');
        if (addSemBtn) addSemBtn.addEventListener('click', () => this.addSemRow());

        // Target Planner Inputs
        const targetInputs = ['target-cur-gpa', 'target-cur-sems', 'target-total-sems', 'target-desired-gpa'];
        targetInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.calculateTarget());
        });
    },

    updateSGPATitles() {
        const cardTitle = document.getElementById('sgpa-card-title');
        const breakdownTitle = document.getElementById('sgpa-breakdown-title');
        if (cardTitle) cardTitle.textContent = `${this.activeSem} GPA (out of 10)`;
        if (breakdownTitle) breakdownTitle.textContent = `${this.activeSem} Subject Marks Breakdown`;
    },

    // Helper: Load courses map { 'Sem 1': [...], 'Sem 2': [...] }
    loadCoursesMap() {
        const data = Storage.loadData('cgpa_courses_v2', null);
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            return data;
        }
        return {};
    },

    saveCoursesMap(map) {
        Storage.saveData('cgpa_courses_v2', map);
    },

    // ==========================================
    // TAB 1: SEMESTER GPA (SEMESTER WISE)
    // ==========================================
    renderSGPA() {
        const container = document.getElementById('sgpa-courses-list');
        if (!container) return;

        const coursesMap = this.loadCoursesMap();
        const courses = coursesMap[this.activeSem] || [];

        if (courses.length === 0) {
            container.innerHTML = `<div class="empty-state"><p class="empty-state-text">No subjects added for ${this.escapeHtml(this.activeSem)}. Click "+ Add Subject" to start entering marks.</p></div>`;
            this.calculateSGPA();
            return;
        }

        container.innerHTML = courses.map(c => `
            <div class="cgpa-row" data-id="${c.id}">
                <input type="text" class="form-input-main course-name-input" value="${this.escapeHtml(c.name || '')}" placeholder="Subject Name (e.g. Operating Systems)" onchange="CgpaManager.updateCourse('${c.id}', 'name', this.value)">
                <input type="number" class="form-input-main course-marks-input" value="${c.marks !== undefined && c.marks !== '' ? c.marks : ''}" min="0" placeholder="Marks Obtained" onchange="CgpaManager.updateCourse('${c.id}', 'marks', parseFloat(this.value))">
                <input type="number" class="form-input-main course-total-input" value="${c.totalMarks !== undefined && c.totalMarks !== '' ? c.totalMarks : ''}" min="1" placeholder="Total Marks (e.g. 100)" onchange="CgpaManager.updateCourse('${c.id}', 'totalMarks', parseFloat(this.value))">
                <button class="btn-action-icon delete" onclick="CgpaManager.removeCourseRow('${c.id}')" title="Remove">&times;</button>
            </div>
        `).join('');

        this.calculateSGPA();
    },

    addCourseRow() {
        if (!Storage.requireAuth()) return;

        const coursesMap = this.loadCoursesMap();
        if (!coursesMap[this.activeSem]) {
            coursesMap[this.activeSem] = [];
        }

        coursesMap[this.activeSem].push({
            id: 'c_' + Date.now(),
            name: '',
            marks: '',
            totalMarks: 100
        });

        this.saveCoursesMap(coursesMap);
        this.renderSGPA();
    },

    updateCourse(id, field, value) {
        const coursesMap = this.loadCoursesMap();
        const list = coursesMap[this.activeSem] || [];
        const item = list.find(c => c.id === id);
        if (!item) return;

        item[field] = value;
        coursesMap[this.activeSem] = list;
        this.saveCoursesMap(coursesMap);
        this.calculateSGPA();
    },

    removeCourseRow(id) {
        const coursesMap = this.loadCoursesMap();
        if (coursesMap[this.activeSem]) {
            coursesMap[this.activeSem] = coursesMap[this.activeSem].filter(c => c.id !== id);
            this.saveCoursesMap(coursesMap);
        }
        this.renderSGPA();
    },

    calculateSGPA() {
        const coursesMap = this.loadCoursesMap();
        const courses = coursesMap[this.activeSem] || [];
        let totalObtained = 0;
        let grandTotalMarks = 0;

        courses.forEach(c => {
            const m = parseFloat(c.marks);
            const t = parseFloat(c.totalMarks);
            if (!isNaN(m) && !isNaN(t) && t > 0) {
                totalObtained += m;
                grandTotalMarks += t;
            }
        });

        const gpa10 = grandTotalMarks > 0 ? ((totalObtained / grandTotalMarks) * 10) : 0.0;

        const valEl = document.getElementById('sgpa-val-display');
        const obtainedEl = document.getElementById('sgpa-obtained-display');
        const totalEl = document.getElementById('sgpa-total-display');

        if (valEl) valEl.textContent = grandTotalMarks > 0 ? gpa10.toFixed(2) : '0.00';
        if (obtainedEl) obtainedEl.textContent = totalObtained;
        if (totalEl) totalEl.textContent = grandTotalMarks;

        // Recalculate Cumulative CGPA immediately
        this.calculateCGPA();
    },

    // ==========================================
    // TAB 2: CUMULATIVE CGPA (AUTO-ACCUMULATED FROM SGPA)
    // ==========================================
    renderCGPA() {
        const container = document.getElementById('cgpa-sems-list');
        if (!container) return;

        const coursesMap = this.loadCoursesMap();
        const customSems = Storage.loadData('cgpa_semesters', []);

        const semList = [];

        // 1. Gather all semesters entered under SGPA tab
        Object.keys(coursesMap).forEach(semName => {
            const courses = coursesMap[semName] || [];
            let m = 0;
            let t = 0;
            courses.forEach(c => {
                const cm = parseFloat(c.marks);
                const ct = parseFloat(c.totalMarks);
                if (!isNaN(cm) && !isNaN(ct) && ct > 0) {
                    m += cm;
                    t += ct;
                }
            });
            if (t > 0) {
                semList.push({
                    id: 'sgpa_' + semName,
                    name: semName,
                    marks: m,
                    totalMarks: t,
                    isFromSGPA: true
                });
            }
        });

        // 2. Append any extra custom semester rows added directly in CGPA tab
        customSems.forEach(cs => {
            if (!semList.some(s => s.name === cs.name)) {
                semList.push(cs);
            }
        });

        if (semList.length === 0) {
            container.innerHTML = `<div class="empty-state"><p class="empty-state-text">No semesters recorded yet. Select a semester in the "Semester GPA" tab and enter subject marks to automatically calculate CGPA.</p></div>`;
            this.calculateCGPA(semList);
            return;
        }

        container.innerHTML = semList.map(s => {
            const m = parseFloat(s.marks);
            const t = parseFloat(s.totalMarks);
            const semGpa = (!isNaN(m) && !isNaN(t) && t > 0) ? ((m / t) * 10).toFixed(2) : '--';

            if (s.isFromSGPA) {
                return `
                    <div class="cgpa-row" data-id="${s.id}" style="align-items:center;">
                        <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem; flex:1;">
                            ${this.escapeHtml(s.name)} 
                            <span style="font-size:0.75rem; color:var(--accent-blue); font-weight:600; margin-left:6px; background:rgba(59,130,246,0.1); padding:2px 8px; border-radius:12px;">Auto-synced from SGPA</span>
                        </div>
                        <div style="font-size:0.86rem; font-weight:600; color:var(--text-secondary); margin-right:12px;">${s.marks} / ${s.totalMarks} Marks</div>
                        <div class="sem-gpa-badge" style="font-size:0.84rem; font-weight:700; color:var(--accent-blue); background:var(--bg-card-hover); padding:6px 14px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); white-space:nowrap;">
                            GPA: ${semGpa}
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="cgpa-row" data-id="${s.id}">
                        <input type="text" class="form-input-main sem-name-input" value="${this.escapeHtml(s.name || '')}" placeholder="Semester Name" onchange="CgpaManager.updateSem('${s.id}', 'name', this.value)">
                        <input type="number" class="form-input-main sem-marks-input" value="${s.marks !== undefined && s.marks !== '' ? s.marks : ''}" min="0" placeholder="Marks Obtained" onchange="CgpaManager.updateSem('${s.id}', 'marks', parseFloat(this.value))">
                        <input type="number" class="form-input-main sem-total-input" value="${s.totalMarks !== undefined && s.totalMarks !== '' ? s.totalMarks : ''}" min="1" placeholder="Total Marks" onchange="CgpaManager.updateSem('${s.id}', 'totalMarks', parseFloat(this.value))">
                        <div class="sem-gpa-badge" style="font-size:0.84rem; font-weight:700; color:var(--accent-blue); background:var(--bg-card-hover); padding:6px 12px; border-radius:var(--radius-md); border:1px solid var(--border-subtle); white-space:nowrap;">
                            GPA: ${semGpa}
                        </div>
                        <button class="btn-action-icon delete" onclick="CgpaManager.removeSemRow('${s.id}')" title="Remove">&times;</button>
                    </div>
                `;
            }
        }).join('');

        this.calculateCGPA(semList);
    },

    addSemRow() {
        if (!Storage.requireAuth()) return;

        const sems = Storage.loadData('cgpa_semesters', []);
        sems.push({
            id: 'sem_' + Date.now(),
            name: `Custom Sem ${sems.length + 1}`,
            marks: '',
            totalMarks: 500
        });
        Storage.saveData('cgpa_semesters', sems);
        this.renderCGPA();
    },

    updateSem(id, field, value) {
        const sems = Storage.loadData('cgpa_semesters', []);
        const item = sems.find(s => s.id === id);
        if (!item) return;

        item[field] = value;
        Storage.saveData('cgpa_semesters', sems);
        this.renderCGPA();
    },

    removeSemRow(id) {
        const sems = Storage.loadData('cgpa_semesters', []);
        const updated = sems.filter(s => s.id !== id);
        Storage.saveData('cgpa_semesters', updated);
        this.renderCGPA();
    },

    calculateCGPA(providedSemList) {
        let semList = providedSemList;

        if (!semList) {
            const coursesMap = this.loadCoursesMap();
            const customSems = Storage.loadData('cgpa_semesters', []);
            semList = [];
            Object.keys(coursesMap).forEach(semName => {
                const courses = coursesMap[semName] || [];
                let m = 0, t = 0;
                courses.forEach(c => {
                    const cm = parseFloat(c.marks);
                    const ct = parseFloat(c.totalMarks);
                    if (!isNaN(cm) && !isNaN(ct) && ct > 0) {
                        m += cm;
                        t += ct;
                    }
                });
                if (t > 0) {
                    semList.push({ name: semName, marks: m, totalMarks: t });
                }
            });
            customSems.forEach(cs => {
                if (!semList.some(s => s.name === cs.name)) {
                    semList.push(cs);
                }
            });
        }

        let totalObtained = 0;
        let grandTotalMarks = 0;
        let validSemestersCount = 0;

        semList.forEach(s => {
            const m = parseFloat(s.marks);
            const t = parseFloat(s.totalMarks);
            if (!isNaN(m) && !isNaN(t) && t > 0) {
                totalObtained += m;
                grandTotalMarks += t;
                validSemestersCount++;
            }
        });

        // Calculate Overall CGPA out of 10
        const cgpa10 = grandTotalMarks > 0 ? ((totalObtained / grandTotalMarks) * 10) : 0.0;

        let standing = validSemestersCount > 0 ? 'Good Standing 👍' : 'No semesters calculated';
        if (cgpa10 >= 8.5) standing = 'First Class with Distinction 🌟';
        else if (cgpa10 >= 7.5) standing = 'First Class Honors 🎓';
        else if (cgpa10 >= 6.0) standing = 'Second Class Division 📜';
        else if (cgpa10 > 0 && cgpa10 < 4.0) standing = 'Needs Improvement ⚠️';

        const valEl = document.getElementById('cgpa-val-display');
        const semsCountEl = document.getElementById('cgpa-sems-count-display');
        const totalEl = document.getElementById('cgpa-total-display');
        const standingEl = document.getElementById('cgpa-standing-display');

        if (valEl) valEl.textContent = grandTotalMarks > 0 ? cgpa10.toFixed(2) : '0.00';
        if (semsCountEl) semsCountEl.textContent = validSemestersCount;
        if (totalEl) totalEl.textContent = grandTotalMarks;
        if (standingEl) standingEl.textContent = standing;

        this.syncDashboard(grandTotalMarks > 0 ? cgpa10.toFixed(2) : '0.00', validSemestersCount);
    },

    calculateTarget() {
        const curGPA = parseFloat(document.getElementById('target-cur-gpa').value) || 0;
        const curSems = parseInt(document.getElementById('target-cur-sems').value, 10) || 0;
        const totalSems = parseInt(document.getElementById('target-total-sems').value, 10) || 8;
        const desiredCGPA = parseFloat(document.getElementById('target-desired-gpa').value) || 0;

        const resultBox = document.getElementById('target-result-box');
        if (!resultBox) return;

        const remSems = totalSems - curSems;

        if (remSems <= 0) {
            resultBox.className = 'target-result-card warning';
            resultBox.innerHTML = `⚠️ All degree semesters are completed! Cannot plan future target.`;
            return;
        }

        const requiredTotalPoints = desiredCGPA * totalSems;
        const currentPoints = curGPA * curSems;
        const requiredFuturePoints = requiredTotalPoints - currentPoints;
        const reqAvgGPA = requiredFuturePoints / remSems;

        if (reqAvgGPA > 10.0) {
            resultBox.className = 'target-result-card critical';
            resultBox.innerHTML = `
                <div class="target-res-val" style="color:var(--accent-rose);">Mathematically Impossible</div>
                <p>To reach <strong>${desiredCGPA.toFixed(2)}</strong> CGPA, you would need an average GPA of <strong>${reqAvgGPA.toFixed(2)}</strong> (> 10.00) in your remaining ${remSems} semester(s).</p>
            `;
        } else if (reqAvgGPA <= 0 && curGPA > 0) {
            resultBox.className = 'target-result-card safe';
            resultBox.innerHTML = `
                <div class="target-res-val" style="color:var(--accent-emerald);">Target Already Achieved! 🎉</div>
                <p>Your current CGPA already exceeds the desired target of ${desiredCGPA.toFixed(2)}.</p>
            `;
        } else {
            resultBox.className = 'target-result-card safe';
            resultBox.innerHTML = `
                <div class="target-res-header">Required Future Average GPA</div>
                <div class="target-res-val" style="color:var(--accent-blue);">${reqAvgGPA.toFixed(2)}</div>
                <p>You need to maintain an average GPA of <strong>${reqAvgGPA.toFixed(2)}</strong> over your remaining <strong>${remSems}</strong> semester(s) to achieve your target CGPA of <strong>${desiredCGPA.toFixed(2)}</strong>.</p>
            `;
        }
    },

    syncDashboard(cgpaVal, semsCount) {
        const dashboardVal = document.getElementById('stat-cgpa-val');
        const dashboardSub = document.getElementById('stat-cgpa-subtitle');
        if (dashboardVal) dashboardVal.textContent = cgpaVal;
        if (dashboardSub) dashboardSub.textContent = semsCount > 0 ? `Semester ${semsCount}` : 'No Semesters';

        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
    },

    renderAll() {
        this.updateSGPATitles();
        this.renderSGPA();
        this.renderCGPA();
        this.calculateTarget();
    },

    escapeHtml(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
};

window.CgpaManager = CgpaManager;