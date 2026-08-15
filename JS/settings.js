/**
 * StudyZone - Settings & Data Management Module (js/settings.js)
 * Day 6 - Task 2: Profile settings, theme accent palette, JSON export/import, & Factory Reset.
 */

document.addEventListener('DOMContentLoaded', () => {
    SettingsManager.init();
});

const SettingsManager = {
    init() {
        this.loadFormValues();
        this.bindEvents();
    },

    loadFormValues() {
        const settings = Storage.loadSettings();

        // Profile Inputs
        const nameInput = document.getElementById('setting-user-name');
        const roleInput = document.getElementById('setting-user-role');
        if (nameInput) nameInput.value = settings.userName || 'Alex Rivera';
        if (roleInput) roleInput.value = settings.userRole || 'CS Major, 3rd Year';

        // Attendance Threshold
        const attInput = document.getElementById('setting-att-target');
        if (attInput) attInput.value = settings.attendanceTarget || 75;

        // Accent Selection
        const activeAccent = settings.accentColor || '#3B82F6';
        document.querySelectorAll('.accent-circle').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-color') === activeAccent);
        });
        this.applyAccentColor(activeAccent);
    },

    bindEvents() {
        // Save Profile Form
        const profileForm = document.getElementById('setting-profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Accent Color Buttons
        const accentBtns = document.querySelectorAll('.accent-circle');
        accentBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.getAttribute('data-color');
                accentBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.saveAccentColor(color);
            });
        });

        // Save Attendance Threshold
        const attInput = document.getElementById('setting-att-target');
        if (attInput) {
            attInput.addEventListener('change', () => {
                const val = parseInt(attInput.value, 10) || 75;
                Storage.updateSettingKey('attendanceTarget', val);
                if (window.AttendanceManager && typeof window.AttendanceManager.renderAttendance === 'function') {
                    window.AttendanceManager.renderAttendance();
                }
            });
        }

        // JSON Data Export & Import
        const exportJsonBtn = document.getElementById('btn-export-json');
        const importJsonInput = document.getElementById('input-import-json');
        const exportNotesTxtBtn = document.getElementById('btn-export-all-notes');

        if (exportJsonBtn) exportJsonBtn.addEventListener('click', () => this.exportAllDataJSON());
        if (importJsonInput) importJsonInput.addEventListener('change', (e) => this.importDataJSON(e));
        if (exportNotesTxtBtn) exportNotesTxtBtn.addEventListener('click', () => this.exportAllNotesTxt());

        // Danger Zone: Reset Data Modal
        const resetBtn = document.getElementById('btn-factory-reset');
        const resetModal = document.getElementById('reset-modal-backdrop');
        const closeResetModal = document.getElementById('close-reset-modal');
        const cancelResetModal = document.getElementById('cancel-reset-modal');
        const confirmResetBtn = document.getElementById('confirm-factory-reset');

        if (resetBtn) resetBtn.addEventListener('click', () => resetModal?.classList.add('active'));
        if (closeResetModal) closeResetModal.addEventListener('click', () => resetModal?.classList.remove('active'));
        if (cancelResetModal) cancelResetModal.addEventListener('click', () => resetModal?.classList.remove('active'));

        if (confirmResetBtn) {
            confirmResetBtn.addEventListener('click', () => {
                const confirmInput = document.getElementById('reset-confirm-text').value.trim();
                if (confirmInput === 'RESET') {
                    this.factoryReset();
                } else {
                    alert('Please type "RESET" exactly to confirm data reset.');
                }
            });
        }
    },

    // 1. Save Profile Settings
    saveProfile() {
        const userName = document.getElementById('setting-user-name').value.trim() || 'Alex Rivera';
        const userRole = document.getElementById('setting-user-role').value.trim() || 'Active Student';

        Storage.updateSettingKey('userName', userName);
        Storage.updateSettingKey('userRole', userRole);

        // Update UI Badges across app
        const sidebarName = document.querySelector('.user-name');
        const sidebarRole = document.querySelector('.user-status-badge');
        if (sidebarName) sidebarName.textContent = userName;
        if (sidebarRole) sidebarRole.textContent = userRole;

        // Re-render Dashboard greeting
        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') {
            window.Dashboard.renderDashboard();
        }

        alert('Profile preferences saved successfully!');
    },

    // 2. Dynamic Accent Color Palette
    saveAccentColor(colorHex) {
        Storage.updateSettingKey('accentColor', colorHex);
        this.applyAccentColor(colorHex);
    },

    applyAccentColor(colorHex) {
        document.documentElement.style.setProperty('--accent-blue', colorHex);
    },

    // 3. Export All Workspace Data (JSON)
    exportAllDataJSON() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('studyzone_')) {
                try {
                    data[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    data[key] = localStorage.getItem(key);
                }
            }
        }

        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `studyzone_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    // 4. Import Workspace Data (JSON)
    importDataJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                let count = 0;

                for (const key in importedData) {
                    if (key.startsWith('studyzone_')) {
                        localStorage.setItem(key, JSON.stringify(importedData[key]));
                        count++;
                    }
                }

                alert(`Successfully imported ${count} modules! Reloading workspace...`);
                window.location.reload();
            } catch (err) {
                alert('Invalid JSON backup file. Please select a valid StudyZone backup file.');
            }
        };
        reader.readAsText(file);
    },

    // 5. Export All Notes as .txt
    exportAllNotesTxt() {
        const notes = Storage.loadNotes();
        if (notes.length === 0) {
            alert('No study notes available to export!');
            return;
        }

        let report = `STUDYZONE — ALL ACADEMIC NOTES\nExported: ${new Date().toLocaleString()}\nTotal Notes: ${notes.length}\n==================================================\n\n`;

        notes.forEach((n, idx) => {
            report += `[NOTE ${idx + 1}] ${n.title}\nCourse: ${n.course || 'General'}\nUpdated: ${new Date(n.updatedAt).toLocaleString()}\n--------------------------------------------------\n${n.content || ''}\n\n==================================================\n\n`;
        });

        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `all_study_notes_${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    // 6. Danger Zone Factory Reset
    factoryReset() {
        Storage.clearAllData();
        alert('All custom data cleared! Reloading workspace with clean starter defaults...');
        window.location.reload();
    }
};

window.SettingsManager = SettingsManager;