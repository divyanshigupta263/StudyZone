/**
 * StudyZone - Centralized Storage Manager (js/storage.js)
 * Day 1 - Task 2: Synchronizes theme preferences, settings, and workspace data safely.
 */

const STORAGE_PREFIX = 'studyzone_';

const Storage = {
    // 1. Generic Save to localStorage with error handling
    saveData(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, serialized);
            return true;
        } catch (error) {
            console.error(`[Storage Error] Could not save key "${key}":`, error);
            return false;
        }
    },

    // 2. Generic Load from localStorage with default fallback
    loadData(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            if (item === null || item === undefined) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error(`[Storage Error] Could not load key "${key}":`, error);
            return defaultValue;
        }
    },

    // 3. Generic Update function
    updateData(key, updaterFn) {
        try {
            const currentData = this.loadData(key, null);
            const updatedData = updaterFn(currentData);
            this.saveData(key, updatedData);
            return updatedData;
        } catch (error) {
            console.error(`[Storage Error] Could not update key "${key}":`, error);
            return null;
        }
    },

    // 4. Clear all StudyZone storage
    clearAllData() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error(`[Storage Error] Could not clear storage:`, error);
            return false;
        }
    },

    // --- Entity Specific Helpers ---

    // Tasks Helpers
    loadTasks() {
        return this.loadData('tasks', []);
    },

    saveTask(task) {
        return this.updateData('tasks', (tasks = []) => {
            const list = Array.isArray(tasks) ? tasks : [];
            const index = list.findIndex(t => t.id === task.id);
            if (index >= 0) {
                list[index] = { ...list[index], ...task, updatedAt: new Date().toISOString() };
            } else {
                list.unshift({
                    id: task.id || 'task_' + Date.now(),
                    title: task.title || 'Untitled Task',
                    course: task.course || 'General',
                    dueDate: task.dueDate || new Date().toISOString().split('T')[0],
                    priority: task.priority || 'medium',
                    status: task.status || 'todo',
                    createdAt: new Date().toISOString()
                });
            }
            return list;
        });
    },

    deleteTask(taskId) {
        return this.updateData('tasks', (tasks = []) => {
            return tasks.filter(task => task.id !== taskId);
        });
    },

    // Workspace Settings & Theme Persistence Helper
    loadSettings() {
        return this.loadData('settings', {
            theme: 'dark',
            userName: 'Alex Rivera',
            userRole: 'CS Major',
            userStatus: 'Active Student',
            targetGPA: '3.88'
        });
    },

    saveSettings(settings) {
        return this.saveData('settings', settings);
    },

    updateSettingKey(key, value) {
        return this.updateData('settings', (settings = {}) => {
            return { ...settings, [key]: value };
        });
    }
};

// Export to Global Window scope
window.Storage = Storage;