/**
 * StudyZone - Centralized Storage Manager (js/storage.js)
 * Clean slate data persistence for tasks, notes, assignments, timetable, & accounts.
 */

const STORAGE_PREFIX = 'studyzone_';

const Storage = {
    // Auth Guard Helper (Opens Sign In / Create Account modal directly without browser pop-ups)
    requireAuth() {
        const activeUser = this.getActiveUser();
        if (!activeUser) {
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                if (window.AppRouter && typeof window.AppRouter.resetAuthForms === 'function') {
                    window.AppRouter.resetAuthForms();
                }
                authModal.classList.add('active');
            }
            return false;
        }
        return true;
    },

    // Auto-wipe legacy cached sample data from user's browser localStorage
    initCleanState() {
        if (!localStorage.getItem(`${STORAGE_PREFIX}clean_v4`)) {
            const keysToClear = ['cgpa_courses', 'cgpa_semesters', 'attendance', 'study_goals'];
            keysToClear.forEach(k => {
                localStorage.removeItem(`${STORAGE_PREFIX}${k}`);
                Object.keys(localStorage).forEach(lk => {
                    if (lk.includes(`_${k}`)) {
                        localStorage.removeItem(lk);
                    }
                });
            });
            localStorage.setItem(`${STORAGE_PREFIX}clean_v4`, 'true');
        }
    },

    // 1. Generic Save to localStorage
    saveData(key, value) {
        this.initCleanState();
        try {
            const activeUser = this.getActiveUser();
            const userKey = activeUser ? `${activeUser.id}_${key}` : key;
            localStorage.setItem(`${STORAGE_PREFIX}${userKey}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`[Storage Error] Could not save key "${key}":`, error);
            return false;
        }
    },

    // 2. Generic Load from localStorage
    loadData(key, defaultValue = null) {
        this.initCleanState();
        try {
            const activeUser = this.getActiveUser();
            const userKey = activeUser ? `${activeUser.id}_${key}` : key;
            const item = localStorage.getItem(`${STORAGE_PREFIX}${userKey}`);
            if (item === null || item === undefined) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.error(`[Storage Error] Could not load key "${key}":`, error);
            return defaultValue;
        }
    },

    // 3. Clear storage
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

    // --- Authentication & User Accounts ---
    getAccounts() {
        try {
            const raw = localStorage.getItem(`${STORAGE_PREFIX}accounts`);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    getActiveUser() {
        try {
            const raw = localStorage.getItem(`${STORAGE_PREFIX}active_user`);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    createAccount(userName, userEmail, userRole, password) {
        const accounts = this.getAccounts();
        const existing = accounts.find(a => a.email.toLowerCase() === userEmail.toLowerCase());
        
        if (existing) {
            return { success: false, message: 'An account with this email address or Student ID already exists! Please click "Sign In" instead.' };
        }

        const newUser = {
            id: 'usr_' + Date.now(),
            name: userName,
            email: userEmail,
            role: userRole || 'Student',
            password: password,
            joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };

        // Migrate any tasks/notes/timetable created while browsing in Guest Mode
        const keysToMigrate = ['tasks', 'notes', 'assignments', 'timetable', 'attendance', 'cgpa_semesters', 'cgpa_courses', 'user_streak', 'settings'];
        keysToMigrate.forEach(k => {
            const guestItem = localStorage.getItem(`${STORAGE_PREFIX}${k}`);
            if (guestItem !== null) {
                localStorage.setItem(`${STORAGE_PREFIX}${newUser.id}_${k}`, guestItem);
            }
        });

        accounts.push(newUser);
        localStorage.setItem(`${STORAGE_PREFIX}accounts`, JSON.stringify(accounts));
        localStorage.setItem(`${STORAGE_PREFIX}active_user`, JSON.stringify(newUser));
        return { success: true, user: newUser };
    },

    loginUser(userEmail, password) {
        const accounts = this.getAccounts();
        const user = accounts.find(a => a.email.toLowerCase() === userEmail.toLowerCase() && a.password === password);
        
        if (!user) {
            return { success: false, message: 'Invalid email/ID or password!' };
        }

        localStorage.setItem(`${STORAGE_PREFIX}active_user`, JSON.stringify(user));
        return { success: true, user: user };
    },

    logoutUser() {
        localStorage.removeItem(`${STORAGE_PREFIX}active_user`);
    },

    // --- Entity Specific Helpers (Zero Dummy/Sample Data) ---
    loadTasks() { 
        return this.loadData('tasks', []);
    },
    saveTask(task) {
        const tasks = this.loadTasks();
        const index = tasks.findIndex(t => t.id === task.id);
        if (index >= 0) {
            tasks[index] = { ...tasks[index], ...task, updatedAt: new Date().toISOString() };
        } else {
            tasks.unshift({
                id: task.id || 'task_' + Date.now(),
                title: task.title || 'Untitled Task',
                course: task.course || 'General',
                dueDate: task.dueDate || new Date().toISOString().split('T')[0],
                priority: task.priority || 'medium',
                status: task.status || 'todo',
                createdAt: new Date().toISOString()
            });
        }
        return this.saveData('tasks', tasks);
    },
    updateTask(taskId, updates) {
        const tasks = this.loadTasks();
        const updated = tasks.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
        return this.saveData('tasks', updated);
    },
    deleteTask(taskId) {
        return this.saveData('tasks', this.loadTasks().filter(t => t.id !== taskId));
    },

    loadNotes() {
        return this.loadData('notes', []);
    },
    saveNote(note) {
        const notes = this.loadNotes();
        const index = notes.findIndex(n => n.id === note.id);
        if (index >= 0) {
            notes[index] = { ...notes[index], ...note, updatedAt: new Date().toISOString() };
        } else {
            notes.unshift({
                id: note.id || 'note_' + Date.now(),
                title: note.title || 'Untitled Note',
                course: note.course || 'General',
                content: note.content || '',
                color: note.color || 'blue',
                pinned: !!note.pinned,
                updatedAt: new Date().toISOString()
            });
        }
        return this.saveData('notes', notes);
    },
    deleteNote(noteId) {
        return this.saveData('notes', this.loadNotes().filter(n => n.id !== noteId));
    },

    loadAssignments() {
        return this.loadData('assignments', []);
    },
    saveAssignment(assignment) {
        const assignments = this.loadAssignments();
        const index = assignments.findIndex(a => a.id === assignment.id);
        if (index >= 0) {
            assignments[index] = { ...assignments[index], ...assignment, updatedAt: new Date().toISOString() };
        } else {
            assignments.unshift({
                id: assignment.id || 'assign_' + Date.now(),
                title: assignment.title || 'Untitled Assignment',
                course: assignment.course || 'General',
                dueDate: assignment.dueDate || new Date().toISOString().split('T')[0],
                priority: assignment.priority || 'medium',
                status: assignment.status || 'Not Started',
                marks: assignment.marks || '',
                createdAt: new Date().toISOString()
            });
        }
        return this.saveData('assignments', assignments);
    },
    deleteAssignment(assignmentId) {
        return this.saveData('assignments', this.loadAssignments().filter(a => a.id !== assignmentId));
    },

    loadSettings() {
        return this.loadData('settings', { theme: 'dark', attendanceTarget: 75, accentColor: '#3B82F6' });
    },
    updateSettingKey(key, value) {
        const settings = this.loadSettings();
        settings[key] = value;
        return this.saveData('settings', settings);
    }
};

window.Storage = Storage;