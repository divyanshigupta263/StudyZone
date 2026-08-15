/**
 * StudyZone - Centralized Storage Module (js/storage.js)
 * All localStorage operations pass through this manager with safe JSON parsing and error handling.
 */

const STORAGE_PREFIX = 'studyzone_';

const Storage = {
    // Core generic operations
    saveData(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, serialized);
            return true;
        } catch (error) {
            console.error(`[Storage] Error saving key "${key}":`, error);
            return false;
        }
    },

    loadData(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            if (item === null || item === undefined) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error(`[Storage] Error loading key "${key}":`, error);
            return defaultValue;
        }
    },

    updateData(key, updaterFn) {
        try {
            const currentData = this.loadData(key, null);
            const updatedData = updaterFn(currentData);
            this.saveData(key, updatedData);
            return updatedData;
        } catch (error) {
            console.error(`[Storage] Error updating key "${key}":`, error);
            return null;
        }
    },

    clearAllData() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error(`[Storage] Error clearing storage:`, error);
            return false;
        }
    },

    // Task Item Helper Stubs
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
                    priority: task.priority || 'medium', // high, medium, low
                    status: task.status || 'todo', // todo, in_progress, completed
                    createdAt: new Date().toISOString()
                });
            }
            return list;
        });
    },

    updateTask(taskId, partialData) {
        return this.updateData('tasks', (tasks = []) => {
            return tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, ...partialData, updatedAt: new Date().toISOString() };
                }
                return task;
            });
        });
    },

    deleteTask(taskId) {
        return this.updateData('tasks', (tasks = []) => {
            return tasks.filter(task => task.id !== taskId);
        });
    },

    // Notes Helper Stubs
    loadNotes() {
        return this.loadData('notes', []);
    },

    saveNote(note) {
        return this.updateData('notes', (notes = []) => {
            const list = Array.isArray(notes) ? notes : [];
            const index = list.findIndex(n => n.id === note.id);
            if (index >= 0) {
                list[index] = { ...list[index], ...note, updatedAt: new Date().toISOString() };
            } else {
                list.unshift({
                    id: note.id || 'note_' + Date.now(),
                    title: note.title || 'Untitled Note',
                    category: note.category || 'Lecture Notes',
                    content: note.content || '',
                    tags: note.tags || ['Study'],
                    updatedAt: new Date().toISOString()
                });
            }
            return list;
        });
    },

    // Settings Helper Stub
    loadSettings() {
        return this.loadData('settings', {
            theme: 'dark',
            userName: 'Alex Rivera',
            userRole: 'Computer Science Major',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
            targetGPA: '3.90',
            currentSemester: 'Fall 2026'
        });
    },

    saveSettings(settings) {
        return this.saveData('settings', settings);
    }
};

// Export to window
window.Storage = Storage;