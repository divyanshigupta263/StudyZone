/**
 * StudyZone - Main Router & Navigation Controller (js/app.js)
 * Day 1 - Task 2: SPA View Switching, keyboard shortcuts, mobile menu, search.
 */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    currentView: 'dashboard',

    init() {
        this.seedSampleData();
        this.setupNavigation();
        this.setupKeyboardShortcuts();
        this.setupSearch();
        this.setupMobileMenu();
        this.switchView(this.currentView);
    },

    // Seed default academic sample data
    seedSampleData() {
        if (!Storage.loadData('tasks')) {
            Storage.saveData('tasks', [
                { id: 't1', title: 'Complete Operating Systems Lab Assignment 4', course: 'CS301', dueDate: '2026-08-18', priority: 'high', status: 'in_progress' },
                { id: 't2', title: 'Review Linear Algebra Chapter 5 Eigenvalues', course: 'MATH204', dueDate: '2026-08-20', priority: 'medium', status: 'todo' },
                { id: 't3', title: 'Prepare presentation slides for Web Architecture', course: 'CS405', dueDate: '2026-08-22', priority: 'high', status: 'todo' },
                { id: 't4', title: 'Submit Database SQL Schema Report', course: 'CS302', dueDate: '2026-08-14', priority: 'low', status: 'completed' }
            ]);
        }

        if (!Storage.loadData('notes')) {
            Storage.saveData('notes', [
                { id: 'n1', title: 'Process Scheduling Algorithms (Round Robin vs Priority)', category: 'Lecture Notes', tags: ['CS301', 'OS'], updatedAt: '2026-08-15T10:30:00Z', content: 'Preemptive vs Non-preemptive scheduling strategies in kernel architectures...' },
                { id: 'n2', title: 'Database Normalization 1NF to 3NF Cheatsheet', category: 'Cheatsheet', tags: ['CS302', 'SQL'], updatedAt: '2026-08-14T16:45:00Z', content: '1NF: Atomic values, 2NF: Remove partial dependencies, 3NF: Transitive dependency removal...' },
                { id: 'n3', title: 'Vector Spaces & Subspaces Proof Techniques', category: 'Study Guide', tags: ['MATH204'], updatedAt: '2026-08-12T14:15:00Z', content: 'Testing zero vector, closure under addition and scalar multiplication...' }
            ]);
        }

        if (!Storage.loadData('assignments')) {
            Storage.saveData('assignments', [
                { id: 'a1', title: 'OS Kernel Scheduler Simulator', course: 'CS301', dueDate: '2026-08-25', weight: '15%', status: 'In Progress' },
                { id: 'a2', title: 'Linear Systems Problem Set 3', course: 'MATH204', dueDate: '2026-08-28', weight: '10%', status: 'Pending' }
            ]);
        }
    },

    // Setup sidebar & link navigation
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

        // Delegate clicks for quick action cards with data-switch-view
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

    // Switch View function (SPA Logic)
    switchView(viewId) {
        this.currentView = viewId;

        // 1. Update Active state on Sidebar Links
        document.querySelectorAll('.nav-link').forEach(link => {
            const isActive = link.getAttribute('data-view') === viewId;
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : 'false');
        });

        // 2. Hide all view section containers, show selected active container
        document.querySelectorAll('.view-section').forEach(section => {
            const matches = section.id === `view-${viewId}`;
            section.classList.toggle('active', matches);
        });

        // 3. Update Navbar View Title & Breadcrumbs
        const titleMap = {
            dashboard: 'Workspace Overview',
            tasks: 'Task & Todo Manager',
            notes: 'Academic Notes Hub',
            assignments: 'Assignments & Project Deadlines',
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
            const formattedName = viewId.charAt(0).toUpperCase() + viewId.slice(1);
            breadcrumbEl.textContent = formattedName === 'Cgpa' ? 'CGPA Calculator' : formattedName;
        }

        // 4. Close mobile drawer sidebar if open
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.getElementById('sidebar-backdrop');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
        }
    },

    // Keyboard Shortcuts (Ctrl/Cmd + K for search focus)
    setupKeyboardShortcuts() {
        const searchInput = document.getElementById('global-search-input');
        if (!searchInput) return;

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    },

    // Global Search filter logic
    setupSearch() {
        const searchInput = document.getElementById('global-search-input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            this.handleSearch(query);
        });
    },

    handleSearch(query) {
        const items = document.querySelectorAll('.searchable-item');
        items.forEach(el => {
            const text = el.textContent.toLowerCase();
            el.style.display = (!query || text.includes(query)) ? '' : 'none';
        });
    },

    // Mobile Sidebar Drawer Toggle
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