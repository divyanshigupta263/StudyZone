/**
 * StudyZone - SPA Router & Controller (js/app.js)
 * Clean slate zero data, interactive streak tracking, password eye toggle, & SPA router.
 */

document.addEventListener('DOMContentLoaded', () => {
    AppRouter.init();
});

const AppRouter = {
    init() {
        this.disableAllAutofillSuggestions();
        this.applySavedAccent();
        this.checkAuthStatus();
        this.updateStreakUI();
        this.bindAuthEvents();
        this.bindProfileEvents();
        this.bindNavigation();
        this.bindMobileDrawer();
        this.bindGlobalSearch();
        this.restoreActiveView();
    },

    disableAllAutofillSuggestions() {
        const disableOnElements = () => {
            document.querySelectorAll('form').forEach(form => {
                form.setAttribute('autocomplete', 'off');
            });
            document.querySelectorAll('input, textarea').forEach(input => {
                input.setAttribute('autocomplete', 'off');
                input.setAttribute('autocorrect', 'off');
                input.setAttribute('autocapitalize', 'off');
                input.setAttribute('spellcheck', 'false');
            });
        };
        disableOnElements();
        const observer = new MutationObserver(() => disableOnElements());
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    },

    applySavedAccent() {
        const settings = Storage.loadSettings();
        const colorHex = settings.accentColor || '#3B82F6';
        document.documentElement.style.setProperty('--accent-blue', colorHex);
        document.documentElement.style.setProperty('--accent-primary', colorHex);
        document.documentElement.style.setProperty('--accent-glow', `${colorHex}40`);
    },

    // 1. Authentication Status Check
    checkAuthStatus() {
        const activeUser = Storage.getActiveUser();
        const topbarAuthBtn = document.getElementById('topbar-auth-btn');
        const authModal = document.getElementById('auth-modal');

        if (!activeUser) {
            if (topbarAuthBtn) topbarAuthBtn.style.display = 'inline-flex';
            this.updateUserProfileUI(null);
        } else {
            if (topbarAuthBtn) topbarAuthBtn.style.display = 'none';
            if (authModal) authModal.classList.remove('active');
            this.updateUserProfileUI(activeUser);
        }
    },

    // 2. Interactive Streak Tracker Engine
    updateStreakUI() {
        const todayStr = new Date().toISOString().split('T')[0];
        const streakData = Storage.loadData('user_streak', { count: 0, lastDate: null });
        
        if (streakData.lastDate) {
            const lastDate = new Date(streakData.lastDate);
            const today = new Date(todayStr);
            const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
                streakData.count = 0;
                Storage.saveData('user_streak', streakData);
            }
        }
        
        const countEl = document.getElementById('streak-count-val');
        if (countEl) countEl.textContent = streakData.count;
    },

    recordActivityForStreak() {
        const todayStr = new Date().toISOString().split('T')[0];
        const streakData = Storage.loadData('user_streak', { count: 0, lastDate: null });
        
        if (streakData.lastDate === todayStr) return;
        
        if (!streakData.lastDate) {
            streakData.count = 1;
        } else {
            const lastDate = new Date(streakData.lastDate);
            const today = new Date(todayStr);
            const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                streakData.count += 1;
            } else {
                streakData.count = 1;
            }
        }
        
        streakData.lastDate = todayStr;
        Storage.saveData('user_streak', streakData);
        this.updateStreakUI();
    },

    bindAuthEvents() {
        const topbarAuthBtn = document.getElementById('topbar-auth-btn');
        const authModal = document.getElementById('auth-modal');
        const closeAuthModalBtn = document.getElementById('close-auth-modal');

        if (topbarAuthBtn) {
            topbarAuthBtn.addEventListener('click', () => {
                this.resetAuthForms();
                if (authModal) authModal.classList.add('active');
            });
        }

        if (closeAuthModalBtn) {
            closeAuthModalBtn.addEventListener('click', () => {
                if (authModal) authModal.classList.remove('active');
            });
        }

        // Eye Icon Password Toggle
        document.querySelectorAll('.btn-toggle-eye').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                if (targetInput) {
                    const isPass = targetInput.type === 'password';
                    targetInput.type = isPass ? 'text' : 'password';
                    btn.textContent = isPass ? '🙈' : '👁️';
                }
            });
        });

        // Tab switching (Sign In vs Create Account)
        const tabBtns = document.querySelectorAll('.auth-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const mode = btn.getAttribute('data-auth-tab');
                const signinForm = document.getElementById('form-signin');
                const signupForm = document.getElementById('form-signup');
                if (signinForm) signinForm.style.display = mode === 'signin' ? 'block' : 'none';
                if (signupForm) signupForm.style.display = mode === 'signup' ? 'block' : 'none';
            });
        });

        // Sign In Form Submit
        const signinForm = document.getElementById('form-signin');
        if (signinForm) {
            signinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-signin-email').value.trim();
                const pass = document.getElementById('auth-signin-password').value;

                if (!email || !pass) {
                    alert('Please enter your email/ID and password!');
                    return;
                }

                const res = Storage.loginUser(email, pass);
                if (res.success) {
                    if (authModal) authModal.classList.remove('active');
                    this.checkAuthStatus();
                    this.switchView('dashboard');
                    this.refreshAllModules();
                } else {
                    alert(res.message);
                }
            });
        }

        // Create Account Form Submit
        const signupForm = document.getElementById('form-signup');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('auth-signup-name').value.trim();
                const email = document.getElementById('auth-signup-email').value.trim();
                const role = document.getElementById('auth-signup-role').value.trim();
                const pass = document.getElementById('auth-signup-password').value;
                const confirmPass = document.getElementById('auth-signup-confirm').value;

                if (!name || !email || !pass) {
                    alert('Please fill in your Name, Email/ID, and Password!');
                    return;
                }

                if (pass !== confirmPass) {
                    alert('Passwords do not match! Please check and try again.');
                    return;
                }

                const res = Storage.createAccount(name, email, role, pass);
                if (res.success) {
                    if (authModal) authModal.classList.remove('active');
                    this.checkAuthStatus();
                    this.switchView('dashboard');
                    this.refreshAllModules();
                    alert(`Welcome to StudyZone, ${name}! Your account has been created.`);
                } else {
                    alert(res.message);
                }
            });
        }
    },

    resetAuthForms() {
        const fields = ['auth-signin-email', 'auth-signin-password', 'auth-signup-name', 'auth-signup-email', 'auth-signup-role', 'auth-signup-password', 'auth-signup-confirm'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                if (el.type === 'text' && (id.includes('password') || id.includes('confirm'))) {
                    el.type = 'password';
                }
            }
        });
        document.querySelectorAll('.btn-toggle-eye').forEach(btn => btn.textContent = '👁️');
    },

    bindProfileEvents() {
        const profileCard = document.querySelector('.user-profile-card');
        const profileModal = document.getElementById('profile-modal');
        const closeProfileBtn = document.getElementById('close-profile-modal');
        const logoutBtn = document.getElementById('btn-logout');
        const authModal = document.getElementById('auth-modal');

        if (profileCard) {
            profileCard.style.cursor = 'pointer';
            profileCard.addEventListener('click', () => {
                const activeUser = Storage.getActiveUser();
                if (activeUser) {
                    document.getElementById('modal-prof-name').textContent = activeUser.name;
                    document.getElementById('modal-prof-email').textContent = activeUser.email;
                    document.getElementById('modal-prof-role').textContent = activeUser.role || 'Student';
                    document.getElementById('modal-prof-joined').textContent = `Member since ${activeUser.joinedAt || '2026'}`;
                    
                    const settings = Storage.loadSettings();
                    const currentEmoji = settings.userEmoji || '🌸';
                    const modalAvatar = document.getElementById('modal-user-avatar');
                    if (modalAvatar) modalAvatar.textContent = currentEmoji;

                    if (profileModal) profileModal.classList.add('active');
                } else {
                    this.resetAuthForms();
                    if (authModal) authModal.classList.add('active');
                }
            });
        }

        // Emoji Picker buttons
        document.querySelectorAll('.avatar-emoji-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.getAttribute('data-emoji') || '🌸';
                Storage.updateSettingKey('userEmoji', emoji);
                
                const sidebarAvatar = document.getElementById('sidebar-user-avatar');
                const modalAvatar = document.getElementById('modal-user-avatar');
                if (sidebarAvatar) sidebarAvatar.textContent = emoji;
                if (modalAvatar) modalAvatar.textContent = emoji;
            });
        });

        if (closeProfileBtn) closeProfileBtn.addEventListener('click', () => profileModal?.classList.remove('active'));

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to log out?')) {
                    Storage.logoutUser();
                    profileModal?.classList.remove('active');
                    this.checkAuthStatus();
                    this.switchView('dashboard');
                    this.refreshAllModules();
                }
            });
        }
    },

    updateUserProfileUI(user) {
        const userNameEl = document.querySelector('.user-name');
        const userRoleEl = document.querySelector('.user-status-badge');
        const greetingEl = document.getElementById('dashboard-greeting');

        const settings = Storage.loadSettings();
        const emoji = settings.userEmoji || '🌸';

        const sidebarAvatar = document.getElementById('sidebar-user-avatar');
        const modalAvatar = document.getElementById('modal-user-avatar');
        if (sidebarAvatar) sidebarAvatar.textContent = emoji;
        if (modalAvatar) modalAvatar.textContent = emoji;

        const hours = new Date().getHours();
        let timeGreeting = 'Good morning';
        if (hours >= 12 && hours < 17) timeGreeting = 'Good afternoon';
        else if (hours >= 17 || hours < 5) timeGreeting = 'Good evening';

        if (user && user.name) {
            if (userNameEl) userNameEl.textContent = user.name;
            if (userRoleEl) userRoleEl.textContent = user.role || 'Active Student';
            if (greetingEl) greetingEl.textContent = `${timeGreeting}, ${user.name} ☀️`;
        } else {
            if (userNameEl) userNameEl.textContent = 'Guest User';
            if (userRoleEl) userRoleEl.textContent = 'Not Signed In';
            if (greetingEl) greetingEl.textContent = `${timeGreeting} ☀️`;
        }
    },

    refreshAllModules() {
        if (window.Dashboard && typeof window.Dashboard.renderDashboard === 'function') window.Dashboard.renderDashboard();
        if (window.TodoManager && typeof window.TodoManager.renderTasks === 'function') window.TodoManager.renderTasks();
        if (window.NotesManager && typeof window.NotesManager.renderNotes === 'function') window.NotesManager.renderNotes();
        if (window.AssignmentManager && typeof window.AssignmentManager.renderAssignments === 'function') window.AssignmentManager.renderAssignments();
        if (window.TimetableManager && typeof window.TimetableManager.renderTimetable === 'function') window.TimetableManager.renderTimetable();
        if (window.AttendanceManager && typeof window.AttendanceManager.renderAttendance === 'function') window.AttendanceManager.renderAttendance();
        if (window.CgpaManager && typeof window.CgpaManager.renderAll === 'function') window.CgpaManager.renderAll();
    },

    bindNavigation() {
        const navLinks = document.querySelectorAll('.nav-link, [data-switch-view]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetView = link.getAttribute('data-view') || link.getAttribute('data-switch-view');
                if (targetView) {
                    e.preventDefault();
                    this.switchView(targetView);
                    this.closeMobileDrawer();
                }
            });
        });

        const bottomNavItems = document.querySelectorAll('.mobile-nav-item');
        bottomNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetView = item.getAttribute('data-view');
                if (targetView) {
                    e.preventDefault();
                    bottomNavItems.forEach(b => b.classList.remove('active'));
                    item.classList.add('active');
                    this.switchView(targetView);
                }
            });
        });
    },

    switchView(viewName) {
        const sections = document.querySelectorAll('.view-section');
        sections.forEach(sec => sec.classList.remove('active'));

        const targetSec = document.getElementById(`view-${viewName}`);
        if (targetSec) targetSec.classList.add('active');

        const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('data-view') === viewName));

        const breadcrumbEl = document.getElementById('breadcrumb-active');
        if (breadcrumbEl) {
            let label = viewName.charAt(0).toUpperCase() + viewName.slice(1);
            if (viewName === 'pomodoro') label = 'Focus Timer';
            if (viewName === 'cgpa') label = 'GPA Calculator';
            breadcrumbEl.textContent = label;
        }

        Storage.updateSettingKey('activeView', viewName);
    },

    restoreActiveView() {
        this.switchView('dashboard');
    },

    bindMobileDrawer() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('app-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');

        if (toggleBtn && sidebar && backdrop) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                backdrop.classList.toggle('active');
            });
            backdrop.addEventListener('click', () => this.closeMobileDrawer());
        }
    },

    closeMobileDrawer() {
        document.getElementById('app-sidebar')?.classList.remove('open');
        document.getElementById('sidebar-backdrop')?.classList.remove('active');
    },

    bindGlobalSearch() {
        const searchInput = document.getElementById('global-search-input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            document.querySelectorAll('.searchable-item').forEach(item => {
                item.style.display = item.textContent.toLowerCase().includes(query) ? '' : 'none';
            });
        });
    },

    showToast(message, icon = '✨') {
        let toastBox = document.getElementById('app-toast-container');
        if (!toastBox) {
            toastBox = document.createElement('div');
            toastBox.id = 'app-toast-container';
            toastBox.style.cssText = 'position:fixed; bottom:28px; right:28px; z-index:99999; display:flex; flex-direction:column; gap:8px; pointer-events:none;';
            document.body.appendChild(toastBox);
        }

        const toast = document.createElement('div');
        toast.style.cssText = 'background:var(--bg-card); color:var(--text-primary); border:1px solid var(--accent-blue); padding:10px 18px; border-radius:12px; font-size:0.85rem; font-weight:600; box-shadow:0 10px 30px rgba(0,0,0,0.35); display:flex; align-items:center; gap:10px; animation: slideInUp 0.3s ease; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);';
        toast.innerHTML = `<span style="font-size:1.15rem;">${icon}</span> <span>${message}</span>`;
        
        toastBox.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2600);
    }
};

window.AppRouter = AppRouter;