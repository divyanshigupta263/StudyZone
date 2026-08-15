/**
 * StudyZone - Theme Manager Module (js/theme.js)
 * Day 1 - Task 2: Handles Light/Dark mode transitions & persistent preference storage.
 */

const Theme = {
    init() {
        // Load saved theme preference from Storage, defaulting to 'dark'
        const settings = Storage.loadSettings();
        const initialTheme = settings && settings.theme ? settings.theme : 'dark';
        
        this.applyTheme(initialTheme);

        document.addEventListener('DOMContentLoaded', () => {
            this.bindEvents();
        });
    },

    // Applies data-theme attribute on <html> element & saves preference
    applyTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Save preference safely using Storage helper
        if (window.Storage) {
            Storage.updateSettingKey('theme', themeName);
        } else {
            localStorage.setItem('studyzone_theme', themeName);
        }

        this.updateToggleButton(themeName);
    },

    // Toggles between dark and light themes
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
    },

    // Updates topbar button icon & accessibility labels
    updateToggleButton(themeName) {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (!toggleBtn) return;

        const isDark = themeName === 'dark';
        toggleBtn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        toggleBtn.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        
        // Render Sun icon for Dark mode (clicking turns to light) and Moon icon for Light mode
        toggleBtn.innerHTML = isDark ? `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <span class="theme-btn-label">Light Mode</span>
        ` : `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <span class="theme-btn-label">Dark Mode</span>
        `;
    },

    bindEvents() {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
};

// Initialize theme immediately to prevent screen flashing
Theme.init();
window.Theme = Theme;