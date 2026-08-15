/**
 * StudyZone - Main Application Controller (js/app.js)
 * Manages view routing, initial sample data population, search filters, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    currentView: 'dashboard',

    init() {
        this.seedInitialData();
        this.setupNavigation();
        this.setupSearch();
        this.setupMobileMenu();
        this.switchView(this.currentView);
    },

    // Seed realistic sample data if storage is empty
    seedInitialData() {
        if (!Storage.loadData('tasks')) {
            Storage.saveData('tasks', [
                { id: 't1', title: 'Complete Operating Systems Lab Assignment 4', course: 'CS301 - Operating Systems', dueDate: '2026-08-10', priority: 'high', status: 'in_progress' },
                { id: 't2', title: 'Review Linear Algebra Chapter 5 Eigenvalues', course: 'MATH204 - Linear Algebra', dueDate: '2026-08-11', priority: 'medium', status: 'todo' },
                { id: 't3', title: 'Prepare presentation slides for Web Architecture', course: 'CS405 - Web Engineering', dueDate: '2026-08-14', priority: 'high', status: 'todo' },
                { id: 't4', title: 'Submit Database System SQL Schema Report', course: 'CS302 - Databases', dueDate: '2026-08-07', priority: 'low', status: 'completed' }
            ]);
        }

        if (!Storage.loadData('notes')) {
            Storage.saveData('notes', [
                { id: 'n1', title: 'Process Scheduling Algorithms (Round Robin vs Priority)', category: 'Lecture Notes', tags: ['CS301', 'OS', 'Exam Prep'], updatedAt: '2026-08-08T10:30:00Z', content: 'Preemptive vs Non-preemptive scheduling strategies...' },
                { id: 'n2', title: 'Database Normalization 1NF to 3NF Cheatsheet', category: 'Cheatsheet', tags: ['CS302', 'SQL', 'DBMS'], updatedAt: '2026-08-07T16:45:00Z', content: '1NF: Atomic values, 2NF: Remove partial dependency...' },
                { id: 'n3', title: 'Vector Spaces & Subspaces Proof Techniques', category: 'Study Guide', tags: ['MATH204', 'Linear Algebra'], updatedAt: '2026-08-05T14:15:00Z', content: 'Testing zero vector, closure under addition and multiplication...' }
            ]);
        }

        if (!Storage.loadData('assignments')) {
            Storage.saveData('assignments', [
                { id: 'a1', title: 'OS Kernel Scheduler Simulator', course: 'CS301', dueDate: '2026-08-12', weight: '15%', status: 'In Review' },
                { id: 'a2', title: 'Linear Systems Problem Set 3', course: 'MATH204', dueDate: '2026-08-15', weight: '10%', status: 'Pending' },
                { id: 'a3', title: 'Fullstack REST API Project', course: 'CS405', dueDate: '2026-08-20', weight: '25%', status: 'In Progress' }
            ]);
        }

        if (!Storage.loadData('attendance')) {
            Storage.saveData('attendance', [
                { id: 'att1', course: 'CS301 - Operating Systems', attended: 26, total: 28, minRequired: 75 },
                { id: 'att2', course: 'MATH204 - Linear Algebra', attended: 22, total: 24, minRequired: 75 },
                { id: 'att3', course: 'CS302 - Databases', attended: 25, total: 30, minRequired: 75 },
                { id: 'att4', course: 'CS405 - Web Engineering', attended: 18, total: 20, minRequired: 75 }
            ]);
        }
    },

    // Set up sidebar menu click listeners
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewId = link.getAttribute('data-view');
                if (viewId) {
                    this.switchView(viewId);
                }
            });
        });

        // Delegate clicks on quick navigation cards/buttons
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-switch-view]');
            if (target) {
                const targetView = target.getAttribute('data-switch-view');
                if (targetView) {
                    this.switchView(targetView);
                }
            }
        });
    },

    // Switch visible view section
    switchView(viewId) {
        this.currentView = viewId;

        // Highlight active nav item
        document.querySelectorAll('.nav-link').forEach(link => {
            const isActive = link.getAttribute('data-view') === viewId;
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });

        // Toggle section visibility
        document.querySelectorAll('.view-section').forEach(section => {
            const matches = section.id === `view-${viewId}`;
            section.classList.toggle('active', matches);
        });

        // Update Topbar View Title & Breadcrumb
        const titleMap = {
            dashboard: 'Workspace Overview',
            tasks: 'Task & Todo Manager',
            notes: 'Academic Notes Hub',
            assignments: 'Assignments & Deadlines',
            timetable: 'Weekly Class Timetable',
            attendance: 'Attendance Tracker',
            cgpa: 'CGPA & Grade Calculator',
            pomodoro: 'Pomodoro Focus Timer',
            settings: 'Workspace Settings'
        };

        const viewTitleEl = document.getElementById('current-view-title');
        if (viewTitleEl) {
            viewTitleEl.textContent = titleMap[viewId] || 'Workspace';
        }

        const breadcrumbEl = document.getElementById('breadcrumb-active');
        if (breadcrumbEl) {
            breadcrumbEl.textContent = (viewId.charAt(0).toUpperCase() + viewId.slice(1));
        }

        // Close mobile drawer if open
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
        }
    },

    // Set up search bar & Ctrl+K shortcut
    setupSearch() {
        const searchInput = document.getElementById('global-search-input');
        if (!searchInput) return;

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            this.handleGlobalSearch(query);
        });
    },

    handleGlobalSearch(query) {
        if (!query) {
            document.querySelectorAll('.searchable-item').forEach(el => el.style.display = '');
            return;
        }

        document.querySelectorAll('.searchable-item').forEach(el => {
            const text = el.textContent.toLowerCase();
            if (text.includes(query)) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
    },

    setupMobileMenu() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.getElementById('sidebar-backdrop');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
                if (overlay) overlay.classList.toggle('active');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                if (sidebar) sidebar.classList.remove('mobile-open');
                overlay.classList.remove('active');
            });
        }
    }
};

window.App = App;