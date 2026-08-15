/**
 * StudyZone - Notes Management Module (js/notes.js)
 * Day 3 - Task 2: Complete Apple Notes / Google Keep style Note Editor & Manager.
 */

document.addEventListener('DOMContentLoaded', () => {
    NotesManager.init();
});

const NotesManager = {
    currentCategory: 'all',
    searchQuery: '',
    editingNoteId: null,

    init() {
        this.bindEvents();
        this.renderNotes();
    },

    bindEvents() {
        // "New Note" Button
        const newNoteBtn = document.getElementById('btn-new-note');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', () => this.openCreateModal());
        }

        // Modal Close buttons
        const closeBtn = document.getElementById('close-note-modal');
        const cancelBtn = document.getElementById('cancel-note-modal');
        const modalBackdrop = document.getElementById('note-modal-backdrop');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (modalBackdrop) modalBackdrop.addEventListener('click', () => this.closeModal());

        // Note Form Submit
        const noteForm = document.getElementById('note-editor-form');
        if (noteForm) {
            noteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveNote();
            });
        }

        // Real-Time Word & Character Counter
        const bodyTextarea = document.getElementById('note-body-input');
        if (bodyTextarea) {
            bodyTextarea.addEventListener('input', () => this.updateCounters());
        }

        // Real-Time Search Filter
        const searchInput = document.getElementById('notes-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderNotes();
            });
        }

        // Category Filter Pills
        const categoryPills = document.querySelectorAll('.note-cat-pill');
        categoryPills.forEach(pill => {
            pill.addEventListener('click', () => {
                categoryPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.currentCategory = pill.getAttribute('data-cat') || 'all';
                this.renderNotes();
            });
        });
    },

    // 1. Word and Character Counter
    updateCounters() {
        const bodyTextarea = document.getElementById('note-body-input');
        const charCounter = document.getElementById('note-char-count');
        const wordCounter = document.getElementById('note-word-count');

        if (!bodyTextarea) return;
        const text = bodyTextarea.value || '';
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;

        if (charCounter) charCounter.textContent = `${chars} chars`;
        if (wordCounter) wordCounter.textContent = `${words} words`;
    },

    // 2. Open Modal for Creation / Editing
    openCreateModal() {
        this.editingNoteId = null;
        document.getElementById('note-modal-title').textContent = 'New Study Note';
        document.getElementById('note-title-input').value = '';
        document.getElementById('note-course-input').value = 'CS301';
        document.getElementById('note-body-input').value = '';
        document.getElementById('note-pin-checkbox').checked = false;

        // Reset color selector to blue
        const defaultColor = document.querySelector('input[name="note-color"][value="blue"]');
        if (defaultColor) defaultColor.checked = true;

        this.updateCounters();
        const modal = document.getElementById('note-edit-modal');
        if (modal) modal.classList.add('active');
    },

    openEditModal(noteId) {
        const notes = Storage.loadNotes();
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        this.editingNoteId = noteId;
        document.getElementById('note-modal-title').textContent = 'Edit Note';
        document.getElementById('note-title-input').value = note.title;
        document.getElementById('note-course-input').value = note.course || 'CS301';
        document.getElementById('note-body-input').value = note.content || '';
        document.getElementById('note-pin-checkbox').checked = !!note.pinned;

        const colorInput = document.querySelector(`input[name="note-color"][value="${note.color || 'blue'}"]`);
        if (colorInput) colorInput.checked = true;

        this.updateCounters();
        const modal = document.getElementById('note-edit-modal');
        if (modal) modal.classList.add('active');
    },

    closeModal() {
        this.editingNoteId = null;
        const modal = document.getElementById('note-edit-modal');
        if (modal) modal.classList.remove('active');
    },

    // 3. Save / Update Note
    handleSaveNote() {
        const title = document.getElementById('note-title-input').value.trim();
        const course = document.getElementById('note-course-input').value;
        const content = document.getElementById('note-body-input').value.trim();
        const pinned = document.getElementById('note-pin-checkbox').checked;

        const colorEl = document.querySelector('input[name="note-color"]:checked');
        const color = colorEl ? colorEl.value : 'blue';

        if (!title) {
            alert('Please enter a note title!');
            return;
        }

        const noteData = {
            id: this.editingNoteId || 'note_' + Date.now(),
            title,
            course,
            content,
            color,
            pinned,
            updatedAt: new Date().toISOString()
        };

        Storage.saveNote(noteData);
        this.closeModal();
        this.renderNotes();
    },

    // 4. Toggle Pin Status
    togglePinNote(noteId) {
        const notes = Storage.loadNotes();
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        Storage.saveNote({ ...note, pinned: !note.pinned });
        this.renderNotes();
    },

    // 5. Delete Note
    deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            const notes = Storage.loadNotes();
            const updated = notes.filter(n => n.id !== noteId);
            Storage.saveData('notes', updated);
            this.renderNotes();
        }
    },

    // 6. Export Note as .txt File
    exportNoteTxt(noteId) {
        const notes = Storage.loadNotes();
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const fileContent = `STUDYZONE NOTE
Title: ${note.title}
Course/Subject: ${note.course || 'General'}
Updated: ${new Date(note.updatedAt).toLocaleString()}
--------------------------------------------------

${note.content || ''}
`;

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    // 7. Render Notes Grid (Pinned & Other)
    renderNotes() {
        const pinnedContainer = document.getElementById('pinned-notes-grid');
        const otherContainer = document.getElementById('other-notes-grid');
        const pinnedSection = document.getElementById('pinned-notes-section');

        if (!pinnedContainer || !otherContainer) return;

        let notes = Storage.loadNotes();

        // Apply Category Filter
        if (this.currentCategory !== 'all') {
            notes = notes.filter(n => (n.course || '').toLowerCase() === this.currentCategory.toLowerCase());
        }

        // Apply Search Filter
        if (this.searchQuery) {
            notes = notes.filter(n => 
                n.title.toLowerCase().includes(this.searchQuery) ||
                (n.content && n.content.toLowerCase().includes(this.searchQuery)) ||
                (n.course && n.course.toLowerCase().includes(this.searchQuery))
            );
        }

        // Sort by most recently updated
        notes.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        const pinnedNotes = notes.filter(n => n.pinned);
        const otherNotes = notes.filter(n => !n.pinned);

        // Toggle Pinned Section Visibility
        if (pinnedSection) {
            pinnedSection.style.display = pinnedNotes.length > 0 ? 'block' : 'none';
        }

        // Render Pinned Grid
        pinnedContainer.innerHTML = pinnedNotes.map(n => this.createNoteCardHTML(n)).join('');

        // Render Other Grid
        if (otherNotes.length === 0 && pinnedNotes.length === 0) {
            otherContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <span class="empty-state-icon">📝</span>
                    <p class="empty-state-text">No notes found. Create your first study note!</p>
                </div>
            `;
        } else {
            otherContainer.innerHTML = otherNotes.map(n => this.createNoteCardHTML(n)).join('');
        }
    },

    createNoteCardHTML(note) {
        const timeAgo = this.formatDate(note.updatedAt);
        const colorClass = `note-color-${note.color || 'blue'}`;

        return `
            <div class="note-card ${colorClass} searchable-item" data-note-id="${note.id}">
                <div class="note-card-header">
                    <span class="badge badge-course">${note.course || 'General'}</span>
                    <button class="btn-pin-note ${note.pinned ? 'active' : ''}" 
                            onclick="NotesManager.togglePinNote('${note.id}')" 
                            title="${note.pinned ? 'Unpin Note' : 'Pin Note'}">
                        📌
                    </button>
                </div>

                <h3 class="note-card-title">${this.escapeHtml(note.title)}</h3>
                <p class="note-card-snippet">${this.escapeHtml(note.content || 'No content...')}</p>

                <div class="note-card-footer">
                    <span class="note-date">${timeAgo}</span>
                    
                    <div class="note-actions">
                        <button class="btn-action-icon" onclick="NotesManager.exportNoteTxt('${note.id}')" title="Export .txt">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                        <button class="btn-action-icon" onclick="NotesManager.openEditModal('${note.id}')" title="Edit Note">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-action-icon delete" onclick="NotesManager.deleteNote('${note.id}')" title="Delete Note">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    formatDate(dateStr) {
        if (!dateStr) return 'Recently';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    escapeHtml(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
};

window.NotesManager = NotesManager;