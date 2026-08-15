/**
 * StudyZone - CGPA & Semester GPA Calculator Module (js/cgpa.js)
 * Day 5 - Task 2: Course SGPA, Cumulative CGPA, Target Planner, & Dashboard Sync.
 */

document.addEventListener('DOMContentLoaded', () => {
    CgpaManager.init();
});

const CgpaManager = {
    activeTab: 'sgpa', // 'sgpa', 'cgpa', 'target'
    GRADE_SCALE: {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'D': 1.0, 'F': 0.0
    },

    init() {
        this.seedDefaultData();
        this.bindEvents();
        this.renderAll();
    },

    seedDefaultData() {
        const existingSemesters = Storage.loadData('cgpa_semesters', null);
        if (!existingSemesters || existingSemesters.length === 0) {
            const defaults = [
                { id: 'sem_1', name: 'Semester 1', gpa: 3.70, credits: 18 },
                { id: 'sem_2', name: 'Semester 2', gpa: 3.85, credits: 18 },
                { id: 'sem_3', name: 'Semester 3', gpa: 3.90, credits: 18 },
                { id: 'sem_4', name: 'Semester 4', gpa: 3.80, credits: 18 },
                { id: 'sem_5', name: 'Semester 5', gpa: 3.95, credits: 18 }
            ];
            Storage.saveData('cgpa_semesters', defaults);
        }

        const existingCourses = Storage.loadData('cgpa_courses', null);
        if (!existingCourses || existingCourses.length === 0) {
            const defaultCourses = [
                { id: 'c_1', name: 'CS301 — Operating Systems', credits: 4, grade: 'A' },
                { id: 'c_2', name: 'MATH204 — Linear Algebra', credits: 3, grade: 'A-' },
                { id: 'c_3', name: 'CS302 — Databases', credits: 4, grade: 'A+' },
                { id: 'c_4', name: 'CS405 — Web Engineering', credits: 3, grade: 'A' }
            ];
            Storage.saveData('cgpa_courses', defaultCourses);
        }
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
            });
        });

        // SGPA Add Course Row
        const addCourseBtn = document.getElementById('btn-add-course-row');
        if (addCourseBtn) addCourseBtn.addEventListener('click', () => this.addCourseRow());

        // CGPA Add Semester Row
        const addSemBtn = document.getElementById('btn-add-sem-row');
        if (addSemBtn) addSemBtn.addEventListener('click', () => this.addSemRow());

        // Target Planner Inputs
        const targetInputs = ['target-cur-gpa', 'target-cur-sems', 'target-total-sems', 'target-desired-gpa'];
        targetInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.calculateTarget());
        });

        // Export Report Button
        const exportBtn = document.getElementById('btn-export-cgpa');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportReport());
    },

    // ==========================================
    // TAB 1: SEMESTER GPA (SGPA)
    // ==========================================
    renderSGPA() {
        const container = document.getElementById('sgpa-courses-list');
        if (!container) return;

        const courses = Storage.loadData('cgpa_courses', []);

        if (courses.length === 0) {
            container.innerHTML = `<div class="empty-state"><p class="empty-state-text">No courses added. Click "+ Add Course" to start.</p></div>`;
            this.calculateSGPA();
            return;
        }

        container.innerHTML = courses.map(c => `
            <div class="cgpa-row" data-id="${c.id}">
                <input type="text" class="form-input-main course-name-input" value="${this.escapeHtml(c.name)}" placeholder="Course Name" onchange="CgpaManager.updateCourse('${c.id}', 'name', this.value)">
                <input type="number" class="form-input-main course-credits-input" value="${c.credits}" min="1" max="10" placeholder="Credits" onchange="CgpaManager.updateCourse('${c.id}', 'credits', parseFloat(this.value))">
                <select class="form-select-sm course-grade-select" onchange="CgpaManager.updateCourse('${c.id}', 'grade', this.value)">
                    ${Object.keys(this.GRADE_SCALE).map(g => `
                        <option value="${g}" ${g === c.grade ? 'selected' : ''}>${g} (${this.GRADE_SCALE[g].toFixed(1)})</option>
                    `).join('')}
                </select>
                <button class="btn-action-icon delete" onclick="CgpaManager.removeCourseRow('${c.id}')" title="Remove">&times;</button>
            </div>
        `).join('');

        this.calculateSGPA();
    },

    addCourseRow() {
        const courses = Storage.loadData('cgpa_courses', []);
        courses.push({
            id: 'c_' + Date.now(),
            name: `New Course ${courses.length + 1}`,
            credits: 3,
            grade: 'A'
        });
        Storage.saveData('cgpa_courses', courses);
        this.renderSGPA();
    },

    updateCourse(id, field, value) {
        const courses = Storage.loadData('cgpa_courses', []);
        const item = courses.find(c => c.id === id);
        if (!item) return;

        item[field] = value;
        Storage.saveData('cgpa_courses', courses);
        this.calculateSGPA();
    },

    removeCourseRow(id) {
        const courses = Storage.loadData('cgpa_courses', []);
        const updated = courses.filter(c => c.id !== id);
        Storage.saveData('cgpa_courses', updated);
        this.renderSGPA();
    },

    calculateSGPA() {
        const courses = Storage.loadData('cgpa_courses', []);
        let totalCredits = 0;
        let totalPoints = 0;

        courses.forEach(c => {
            const credits = parseFloat(c.credits) || 0;
            const points = this.GRADE_SCALE[c.grade] || 0.0;
            totalCredits += credits;
            totalPoints += (credits * points);
        });

        const sgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0.0;

        document.getElementById('sgpa-val-display').textContent = sgpa.toFixed(2);
        document.getElementById('sgpa-credits-display').textContent = totalCredits;
        document.getElementById('sgpa-points-display').textContent = totalPoints.toFixed(1);
    },

    // ==========================================
    // TAB 2: CUMULATIVE CGPA
    // ==========================================
    renderCGPA() {
        const container = document.getElementById('cgpa-sems-list');
        if (!container) return;

        const sems = Storage.loadData('cgpa_semesters', []);

        if (sems.length === 0) {
            container.innerHTML = `<div class="empty-state"><p class="empty-state-text">No semesters added. Click "+ Add Semester" to start.</p></div>`;
            this.calculateCGPA();
            return;
        }

        container.innerHTML = sems.map(s => `
            <div class="cgpa-row" data-id="${s.id}">
                <input type="text" class="form-input-main sem-name-input" value="${this.escapeHtml(s.name)}" placeholder="Semester Name" onchange="CgpaManager.updateSem('${s.id}', 'name', this.value)">
                <input type="number" class="form-input-main sem-gpa-input" value="${s.gpa}" min="0" max="4" step="0.01" placeholder="GPA (0.00-4.00)" onchange="CgpaManager.updateSem('${s.id}', 'gpa', parseFloat(this.value))">
                <input type="number" class="form-input-main sem-credits-input" value="${s.credits}" min="1" max="30" placeholder="Total Credits" onchange="CgpaManager.updateSem('${s.id}', 'credits', parseFloat(this.value))">
                <button class="btn-action-icon delete" onclick="CgpaManager.removeSemRow('${s.id}')" title="Remove">&times;</button>
            </div>
        `).join('');

        this.calculateCGPA();
    },

    addSemRow() {
        const sems = Storage.loadData('cgpa_semesters', []);
        sems.push({
            id: 'sem_' + Date.now(),
            name: `Semester ${sems.length + 1}`,
            gpa: 3.50,
            credits: 18
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
        this.calculateCGPA();
    },

    removeSemRow(id) {
        const sems = Storage.loadData('cgpa_semesters', []);
        const updated = sems.filter(s => s.id !== id);
        Storage.saveData('cgpa_semesters', updated);
        this.renderCGPA();
    },

    calculateCGPA() {
        const sems = Storage.loadData('cgpa_semesters', []);
        let totalCredits = 0;
        let totalPoints = 0;

        sems.forEach(s => {
            const credits = parseFloat(s.credits) || 0;
            const gpa = parseFloat(s.gpa) || 0.0;
            totalCredits += credits;
            totalPoints += (credits * gpa);
        });

        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0.0;

        let standing = 'Good Standing 👍';
        if (cgpa >= 3.7) standing = 'First Class with Distinction 🌟';
        else if (cgpa >= 3.3) standing = 'First Class Honors 🎓';
        else if (cgpa >= 3.0) standing = 'Second Class Upper 📜';
        else if (cgpa < 2.0) standing = 'Academic Probation ⚠️';

        document.getElementById('cgpa-val-display').textContent = cgpa.toFixed(2);
        document.getElementById('cgpa-credits-display').textContent = totalCredits;
        document.getElementById('cgpa-standing-display').textContent = standing;

        // Auto Pre-fill Target Planner
        const curGpaEl = document.getElementById('target-cur-gpa');
        const curSemsEl = document.getElementById('target-cur-sems');
        if (curGpaEl && !curGpaEl.value) curGpaEl.value = cgpa.toFixed(2);
        if (curSemsEl && !curSemsEl.value) curSemsEl.value = sems.length;

        // Sync Dashboard
        this.syncDashboard(cgpa.toFixed(2), sems.length);
    },

    // ==========================================
    // TAB 3: TARGET CGPA PLANNER
    // ==========================================
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

        if (reqAvgGPA > 4.0) {
            resultBox.className = 'target-result-card critical';
            resultBox.innerHTML = `
                <div class="target-res-val" style="color:var(--accent-rose);">Mathematically Impossible</div>
                <p>To reach <strong>${desiredCGPA.toFixed(2)}</strong> CGPA, you would need an average GPA of <strong>${reqAvgGPA.toFixed(2)}</strong> (> 4.00) in your remaining ${remSems} semester(s).</p>
            `;
        } else if (reqAvgGPA <= 0) {
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
                <p>You need to maintain an average GPA of <strong>${reqAvgGPA.toFixed(2)}</strong> over your remaining <strong>${remSems}</strong> semester(s) to achieve a final CGPA of <strong>${desiredCGPA.toFixed(2)}</strong>.</p>
            `;
        }
    },

    // Export GPA Report
    exportReport() {
        const sems = Storage.loadData('cgpa_semesters', []);
        const cgpa = document.getElementById('cgpa-val-display').textContent;
        const standing = document.getElementById('cgpa-standing-display').textContent;

        let content = `STUDYZONE ACADEMIC TRANSCRIPT REPORT\nGenerated: ${new Date().toLocaleString()}\nOverall CGPA: ${cgpa}\nAcademic Standing: ${standing}\n--------------------------------------------------\n\nSEMESTER BREAKDOWN:\n`;

        sems.forEach((s, index) => {
            content += `${index + 1}. ${s.name}: GPA ${s.gpa.toFixed(2)} (${s.credits} Credits)\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `academic_transcript_gpa.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    syncDashboard(cgpaVal, semsCount) {
        const dashboardVal = document.getElementById('stat-cgpa-val');
        const dashboardSub = document.getElementById('stat-cgpa-subtitle');
        if (dashboardVal) dashboardVal.textContent = cgpaVal;
        if (dashboardSub) dashboardSub.textContent = `Semester ${semsCount}`;

        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }
    },

    renderAll() {
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