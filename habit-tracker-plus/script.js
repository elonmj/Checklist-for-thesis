/**
 * ALIBI Pro - Habit Tracker
 * Transforme tes intentions en habitudes - Version Pro
 * 
 * Features:
 * - Variable frequency support (daily, X times/week, every X days, specific days, monthly)
 * - Options/choices for habits
 * - Categories
 * - Tabbed navigation with tracking-first approach
 * - Smart completion with option selection modal
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBBFmcfTKFrDdNa-KOMwQqL8uG_SRpK7Jk",
    authDomain: "memoire-20adc.firebaseapp.com",
    projectId: "memoire-20adc",
    storageBucket: "memoire-20adc.firebasestorage.app",
    messagingSenderId: "829442058077",
    appId: "1:829442058077:web:8e27ff7c6fb83b3bd3f3dc"
};

// Category definitions
const CATEGORIES = {
    spiritual: { name: 'Spirituel', emoji: '🙏', color: '#a855f7' },
    health: { name: 'Santé', emoji: '💪', color: '#22c55e' },
    learning: { name: 'Apprentissage', emoji: '📚', color: '#6366f1' },
    chores: { name: 'Tâches', emoji: '🧹', color: '#f97316' },
    work: { name: 'Travail', emoji: '💼', color: '#3b82f6' },
    projects: { name: 'Projets', emoji: '🚀', color: '#ec4899' },
    leisure: { name: 'Loisirs', emoji: '🎮', color: '#eab308' }
};

// Frequency type labels
const FREQUENCY_LABELS = {
    daily: 'Tous les jours',
    times_per_week: 'fois par semaine',
    specific_days: 'Jours spécifiques',
    every_x_days: 'jours',
    every_x_weeks: 'semaines',
    monthly: 'Mensuel'
};

// ============================================
// ALIBI PRO APP CLASS
// ============================================
class AlibiProApp {
    constructor() {
        this.db = null;
        this.habits = [];
        this.completions = [];
        this.currentTab = 'today';
        this.currentFilter = 'all';
        this.selectedColor = '#6366f1';
        this.selectedDays = [];
        this.habitOptions = [];
        this.pendingCompletion = null;
        this.selectedOption = null;

        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    async init() {
        try {
            this.initFirebase();
            await this.loadData();
        } catch (error) {
            console.error('Init error:', error);
            // Continue anyway with empty data
            this.habits = [];
            this.completions = [];
        }

        // Always bind events and show app
        this.bindEvents();
        this.render();
        this.showApp();
        this.registerSW();
    }

    initFirebase() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        this.db = firebase.firestore();
    }

    async registerSW() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./sw.js');
            } catch (e) {
                console.log('SW registration failed:', e);
            }
        }
    }

    // ============================================
    // DATA OPERATIONS
    // ============================================
    async loadData() {
        try {
            // Load habits
            const habitsSnap = await this.db.collection('habits_pro').orderBy('createdAt', 'desc').get();
            this.habits = habitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Load completions for current month (for performance)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const completionsSnap = await this.db.collection('completions_pro')
                .where('completedAt', '>=', startOfMonth)
                .get();
            this.completions = completionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Load data error:', error);
            throw error;
        }
    }

    async addHabit(habitData) {
        try {
            const habit = {
                name: habitData.name,
                emoji: habitData.emoji || this.suggestEmoji(habitData.name),
                color: habitData.color || '#6366f1',
                category: habitData.category || 'learning',
                frequency: habitData.frequency || { type: 'daily' },
                hasOptions: habitData.hasOptions || false,
                options: habitData.options || [],
                allowNewOptions: true,
                currentStreak: 0,
                bestStreak: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await this.db.collection('habits_pro').add(habit);
            this.habits.unshift({ id: docRef.id, ...habit, createdAt: new Date() });

            this.showToast('Habitude créée ! ✨');
            this.triggerConfetti('small');
            this.render();

            // Switch to today tab
            this.switchTab('today');

            return docRef.id;
        } catch (error) {
            console.error('Add habit error:', error);
            this.showToast('Erreur lors de la création', 'error');
        }
    }

    async updateHabit(habitId, updates) {
        try {
            await this.db.collection('habits_pro').doc(habitId).update(updates);
            const index = this.habits.findIndex(h => h.id === habitId);
            if (index !== -1) {
                this.habits[index] = { ...this.habits[index], ...updates };
            }
            this.render();
            this.showToast('Habitude mise à jour');
        } catch (error) {
            console.error('Update habit error:', error);
            this.showToast('Erreur lors de la mise à jour', 'error');
        }
    }

    async deleteHabit(habitId) {
        try {
            await this.db.collection('habits_pro').doc(habitId).delete();
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.render();
            this.showToast('Habitude supprimée');
            this.closeEditModal();
        } catch (error) {
            console.error('Delete habit error:', error);
            this.showToast('Erreur lors de la suppression', 'error');
        }
    }

    async toggleCompletion(habitId, optionId = null, optionName = null) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const today = this.formatDate(new Date());
        const existingCompletion = this.completions.find(
            c => c.habitId === habitId && c.date === today
        );

        try {
            if (existingCompletion) {
                // Remove completion
                await this.db.collection('completions_pro').doc(existingCompletion.id).delete();
                this.completions = this.completions.filter(c => c.id !== existingCompletion.id);
                this.showToast('Habitude décochée');
            } else {
                // Add completion
                const completion = {
                    habitId,
                    date: today,
                    completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    optionId: optionId || null,
                    optionName: optionName || null
                };
                const docRef = await this.db.collection('completions_pro').add(completion);
                this.completions.push({ id: docRef.id, ...completion, completedAt: new Date() });

                this.showToast('Bravo ! 🎉');
                this.triggerConfetti('small');

                // Update streak
                await this.updateStreak(habitId);
            }

            this.render();
        } catch (error) {
            console.error('Toggle completion error:', error);
            this.showToast('Erreur', 'error');
        }
    }

    async addOptionToHabit(habitId, optionName) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return null;

        const newOption = {
            id: `opt_${Date.now()}`,
            name: optionName
        };

        const updatedOptions = [...(habit.options || []), newOption];
        await this.updateHabit(habitId, { options: updatedOptions });

        return newOption;
    }

    async updateStreak(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        let streak = 0;
        let date = new Date();

        // Count consecutive completions going backwards
        while (true) {
            const dateStr = this.formatDate(date);
            const hasCompletion = this.completions.some(
                c => c.habitId === habitId && c.date === dateStr
            );

            if (hasCompletion) {
                streak++;
                date.setDate(date.getDate() - 1);
            } else if (this.isHabitDueOnDate(habit, date)) {
                // Habit was due but not completed - break streak
                break;
            } else {
                // Habit wasn't due this day - continue checking
                date.setDate(date.getDate() - 1);
                // Safety limit
                if (streak > 365) break;
            }
        }

        const bestStreak = Math.max(habit.bestStreak || 0, streak);
        await this.db.collection('habits_pro').doc(habitId).update({
            currentStreak: streak,
            bestStreak
        });

        habit.currentStreak = streak;
        habit.bestStreak = bestStreak;
    }

    // ============================================
    // FREQUENCY & SCHEDULING HELPERS
    // ============================================
    isHabitDueOnDate(habit, date) {
        const freq = habit.frequency || { type: 'daily' };
        const dayOfWeek = date.getDay();

        switch (freq.type) {
            case 'daily':
                return true;

            case 'specific_days':
                return (freq.days || []).includes(dayOfWeek);

            case 'times_per_week':
                // For X times per week, we show it every day but track weekly progress
                return true;

            case 'every_x_days':
                if (!habit.createdAt) return true;
                const createdDate = habit.createdAt.toDate ? habit.createdAt.toDate() : new Date(habit.createdAt);
                const daysDiff = Math.floor((date - createdDate) / (1000 * 60 * 60 * 24));
                return daysDiff % (freq.interval || 2) === 0;

            case 'every_x_weeks':
                if (!habit.createdAt) return true;
                const created = habit.createdAt.toDate ? habit.createdAt.toDate() : new Date(habit.createdAt);
                const weeksDiff = Math.floor((date - created) / (1000 * 60 * 60 * 24 * 7));
                return weeksDiff % (freq.interval || 2) === 0 && dayOfWeek === created.getDay();

            case 'monthly':
                if (!habit.createdAt) return date.getDate() === 1;
                const createdD = habit.createdAt.toDate ? habit.createdAt.toDate() : new Date(habit.createdAt);
                return date.getDate() === createdD.getDate();

            default:
                return true;
        }
    }

    getHabitsForToday() {
        const today = new Date();
        return this.habits.filter(habit => this.isHabitDueOnDate(habit, today));
    }

    getWeeklyProgress(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit || habit.frequency?.type !== 'times_per_week') return null;

        const weekStart = this.getWeekStart(new Date());
        let count = 0;

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateStr = this.formatDate(date);
            if (this.completions.some(c => c.habitId === habitId && c.date === dateStr)) {
                count++;
            }
        }

        return {
            done: count,
            target: habit.frequency.value || 3
        };
    }

    getFrequencyLabel(habit) {
        const freq = habit.frequency || { type: 'daily' };

        switch (freq.type) {
            case 'daily':
                return 'Tous les jours';
            case 'times_per_week':
                return `${freq.value || 3}x par semaine`;
            case 'specific_days':
                const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
                return (freq.days || []).map(d => days[d]).join(', ');
            case 'every_x_days':
                return `Tous les ${freq.interval || 2} jours`;
            case 'every_x_weeks':
                return `Toutes les ${freq.interval || 2} semaines`;
            case 'monthly':
                return 'Mensuel';
            default:
                return '';
        }
    }

    // ============================================
    // HELPERS
    // ============================================
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    isHabitCompletedToday(habitId) {
        const today = this.formatDate(new Date());
        return this.completions.some(c => c.habitId === habitId && c.date === today);
    }

    getTodayCompletion(habitId) {
        const today = this.formatDate(new Date());
        return this.completions.find(c => c.habitId === habitId && c.date === today);
    }

    suggestEmoji(habitName) {
        const name = habitName.toLowerCase();
        const emojiMap = {
            'lire': '📖', 'livre': '📚', 'lecture': '📖',
            'sport': '🏃', 'course': '🏃', 'courir': '🏃', 'foot': '⚽', 'marche': '🚶',
            'méditation': '🧘', 'méditer': '🧘', 'yoga': '🧘',
            'eau': '💧', 'boire': '💧',
            'dormir': '😴', 'sommeil': '💤',
            'écrire': '✍️', 'journal': '📝',
            'musique': '🎵', 'piano': '🎹', 'guitare': '🎸',
            'code': '💻', 'programmer': '👨‍💻', 'site': '🌐',
            'apprendre': '🎓', 'étudier': '📚', 'cours': '📖',
            'prière': '🙏', 'chapelet': '📿', 'bible': '✝️', 'spirituel': '🕊️',
            'ménage': '🧹', 'laver': '🧼', 'nettoyer': '🧽', 'douche': '🚿', 'assiette': '🍽️',
            'scrabble': '🔤', 'mots': '📝', 'jouer': '🎮',
            'anime': '📺', 'série': '📺', 'film': '🎬', 'cinéma': '🎬',
            'news': '📰', 'actualité': '📰', 'ia': '🤖'
        };

        for (const [key, emoji] of Object.entries(emojiMap)) {
            if (name.includes(key)) return emoji;
        }
        return '✨';
    }

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bonjour !';
        if (hour < 18) return 'Bon après-midi !';
        return 'Bonsoir !';
    }

    // ============================================
    // UI RENDERING
    // ============================================
    render() {
        this.renderHeader();
        this.renderTodayTab();
        this.renderHabitsTab();
        this.renderStatsTab();
    }

    renderHeader() {
        document.getElementById('greeting').textContent = this.getGreeting();

        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        document.getElementById('current-date').textContent =
            new Date().toLocaleDateString('fr-FR', options);

        // Total streak
        const totalStreak = this.habits.reduce((sum, h) => sum + (h.currentStreak || 0), 0);
        document.querySelector('.streak-count').textContent = totalStreak;
    }

    renderTodayTab() {
        const todayHabits = this.getHabitsForToday();
        const container = document.getElementById('today-habits');
        const emptyState = document.getElementById('empty-today');

        if (todayHabits.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            this.updateProgress(0, 0);
            return;
        }

        emptyState.classList.add('hidden');

        // Group by category
        const grouped = {};
        todayHabits.forEach(habit => {
            const cat = habit.category || 'learning';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(habit);
        });

        let html = '';
        let completedCount = 0;

        for (const [category, habits] of Object.entries(grouped)) {
            const catInfo = CATEGORIES[category] || CATEGORIES.learning;

            html += `
                <div class="category-group">
                    <div class="category-header">
                        <div class="category-dot" style="background: ${catInfo.color}"></div>
                        <span class="category-name">${catInfo.name}</span>
                    </div>
            `;

            habits.forEach(habit => {
                const isCompleted = this.isHabitCompletedToday(habit.id);
                if (isCompleted) completedCount++;

                const completion = this.getTodayCompletion(habit.id);
                const weeklyProgress = this.getWeeklyProgress(habit.id);

                let metaHtml = '';
                if (weeklyProgress) {
                    metaHtml = `<span class="habit-meta">${weeklyProgress.done}/${weeklyProgress.target} cette semaine</span>`;
                }

                let optionHtml = '';
                if (habit.hasOptions) {
                    if (isCompleted && completion?.optionName) {
                        optionHtml = `<div class="option-chosen">→ ${completion.optionName}</div>`;
                    } else if (!isCompleted) {
                        optionHtml = `<span class="has-options-badge">Au choix</span>`;
                    }
                }

                html += `
                    <div class="habit-card ${isCompleted ? 'completed' : ''}" 
                         data-habit-id="${habit.id}" 
                         data-has-options="${habit.hasOptions}">
                        <div class="habit-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div class="habit-info">
                            <div class="habit-name">
                                <span class="emoji">${habit.emoji || '✨'}</span>
                                ${habit.name}
                                ${optionHtml && !isCompleted ? optionHtml : ''}
                            </div>
                            ${metaHtml}
                            ${optionHtml && isCompleted ? optionHtml : ''}
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        }

        container.innerHTML = html;
        this.updateProgress(completedCount, todayHabits.length);
    }

    updateProgress(done, total) {
        document.getElementById('progress-done').textContent = done;
        document.getElementById('progress-total').textContent = total;

        const percent = total > 0 ? (done / total) * 100 : 0;
        document.getElementById('progress-circle-path').setAttribute(
            'stroke-dasharray',
            `${percent}, 100`
        );
    }

    renderHabitsTab() {
        const container = document.getElementById('all-habits-list');
        const emptyState = document.getElementById('empty-habits');

        document.getElementById('habits-count').textContent = this.habits.length;

        const filteredHabits = this.currentFilter === 'all'
            ? this.habits
            : this.habits.filter(h => h.category === this.currentFilter);

        if (filteredHabits.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        container.innerHTML = filteredHabits.map(habit => {
            const catInfo = CATEGORIES[habit.category] || CATEGORIES.learning;
            const freqLabel = this.getFrequencyLabel(habit);

            return `
                <div class="habit-card" data-habit-id="${habit.id}">
                    <div class="category-dot" style="background: ${catInfo.color}"></div>
                    <div class="habit-info">
                        <div class="habit-name">
                            <span class="emoji">${habit.emoji || '✨'}</span>
                            ${habit.name}
                        </div>
                        <div class="habit-frequency">${freqLabel}</div>
                        ${habit.hasOptions ? `<div class="habit-meta">${habit.options?.length || 0} options</div>` : ''}
                    </div>
                    <button class="edit-btn" data-habit-id="${habit.id}">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }

    renderStatsTab() {
        // Best streak
        const bestStreak = Math.max(...this.habits.map(h => h.bestStreak || 0), 0);
        document.getElementById('stat-streak').textContent = bestStreak;

        // Total completions
        document.getElementById('stat-total').textContent = this.completions.length;

        // Active habits
        document.getElementById('stat-habits').textContent = this.habits.length;

        // Success rate (this week)
        const weekStart = this.getWeekStart(new Date());
        let dueCount = 0;
        let doneCount = 0;

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            if (date > new Date()) break;

            const dateStr = this.formatDate(date);

            this.habits.forEach(habit => {
                if (this.isHabitDueOnDate(habit, date)) {
                    dueCount++;
                    if (this.completions.some(c => c.habitId === habit.id && c.date === dateStr)) {
                        doneCount++;
                    }
                }
            });
        }

        const rate = dueCount > 0 ? Math.round((doneCount / dueCount) * 100) : 0;
        document.getElementById('stat-rate').textContent = `${rate}%`;

        // Week stats
        this.renderWeekStats();

        // Category stats
        this.renderCategoryStats();
    }

    renderWeekStats() {
        const container = document.getElementById('week-stats');
        const weekStart = this.getWeekStart(new Date());
        const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const today = this.formatDate(new Date());

        let html = '';

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateStr = this.formatDate(date);
            const dayOfWeek = date.getDay();
            const isToday = dateStr === today;

            const completionsForDay = this.completions.filter(c => c.date === dateStr).length;

            html += `
                <div class="week-day ${isToday ? 'today' : ''}">
                    <div class="week-day-name">${dayNames[dayOfWeek]}</div>
                    <div class="week-day-value">${completionsForDay}</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    renderCategoryStats() {
        const container = document.getElementById('category-stats');

        // Count habits per category
        const catCounts = {};
        this.habits.forEach(h => {
            const cat = h.category || 'learning';
            catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(catCounts), 1);

        let html = '';
        for (const [cat, info] of Object.entries(CATEGORIES)) {
            const count = catCounts[cat] || 0;
            const percent = (count / maxCount) * 100;

            html += `
                <div class="category-stat-row">
                    <div class="category-stat-label">${info.emoji} ${info.name}</div>
                    <div class="category-stat-bar">
                        <div class="category-stat-fill" style="width: ${percent}%; background: ${info.color}"></div>
                    </div>
                    <div class="category-stat-value">${count}</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // ============================================
    // EVENTS
    // ============================================
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Today habits click
        document.getElementById('today-habits').addEventListener('click', (e) => {
            const card = e.target.closest('.habit-card');
            if (!card) return;

            const habitId = card.dataset.habitId;
            const hasOptions = card.dataset.hasOptions === 'true';
            const isCompleted = card.classList.contains('completed');

            if (hasOptions && !isCompleted) {
                this.openOptionModal(habitId);
            } else {
                this.toggleCompletion(habitId);
            }
        });

        // All habits - edit button
        document.getElementById('all-habits-list').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            if (editBtn) {
                e.stopPropagation();
                this.openEditModal(editBtn.dataset.habitId);
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderHabitsTab();
            });
        });

        // Add habit form
        this.bindAddForm();

        // Option modal
        this.bindOptionModal();

        // Edit modal
        this.bindEditModal();
    }

    bindAddForm() {
        const form = document.getElementById('add-habit-form');
        const frequencySelect = document.getElementById('habit-frequency');
        const hasOptionsCheckbox = document.getElementById('has-options');
        const optionsContainer = document.getElementById('options-container');
        const addOptionBtn = document.getElementById('add-option-btn');

        // Frequency change
        frequencySelect.addEventListener('change', () => {
            this.updateFrequencyUI(frequencySelect.value);
        });

        // Has options toggle
        hasOptionsCheckbox.addEventListener('change', () => {
            optionsContainer.classList.toggle('hidden', !hasOptionsCheckbox.checked);
            if (hasOptionsCheckbox.checked && this.habitOptions.length === 0) {
                this.addOptionInput();
            }
        });

        // Add option button
        addOptionBtn.addEventListener('click', () => {
            this.addOptionInput();
        });

        // Color picker
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedColor = btn.dataset.color;
            });
        });

        // Day selector
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                const day = parseInt(btn.dataset.day);
                if (this.selectedDays.includes(day)) {
                    this.selectedDays = this.selectedDays.filter(d => d !== day);
                } else {
                    this.selectedDays.push(day);
                }
            });
        });

        // Form submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('habit-name').value.trim();
            if (!name) return;

            const frequency = this.getFrequencyFromForm();
            const options = this.getOptionsFromForm();

            await this.addHabit({
                name,
                emoji: document.getElementById('habit-emoji').value || null,
                color: this.selectedColor,
                category: document.getElementById('habit-category').value,
                frequency,
                hasOptions: hasOptionsCheckbox.checked,
                options
            });

            // Reset form
            form.reset();
            this.habitOptions = [];
            document.getElementById('options-list').innerHTML = '';
            optionsContainer.classList.add('hidden');
            this.selectedDays = [];
            document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.color-btn').classList.add('active');
            this.selectedColor = '#6366f1';
            this.updateFrequencyUI('daily');
        });
    }

    updateFrequencyUI(type) {
        const detailsContainer = document.getElementById('frequency-details');
        const options = ['freq-times-week', 'freq-specific-days', 'freq-every-x-days', 'freq-every-x-weeks'];

        // Hide all
        options.forEach(id => document.getElementById(id)?.classList.add('hidden'));

        if (type === 'daily' || type === 'monthly') {
            detailsContainer.classList.add('hidden');
            return;
        }

        detailsContainer.classList.remove('hidden');

        const mapping = {
            'times_per_week': 'freq-times-week',
            'specific_days': 'freq-specific-days',
            'every_x_days': 'freq-every-x-days',
            'every_x_weeks': 'freq-every-x-weeks'
        };

        if (mapping[type]) {
            document.getElementById(mapping[type])?.classList.remove('hidden');
        }
    }

    getFrequencyFromForm() {
        const type = document.getElementById('habit-frequency').value;

        switch (type) {
            case 'times_per_week':
                return { type, value: parseInt(document.getElementById('times-per-week').value) || 3 };
            case 'specific_days':
                return { type, days: [...this.selectedDays].sort() };
            case 'every_x_days':
                return { type, interval: parseInt(document.getElementById('every-x-days').value) || 2 };
            case 'every_x_weeks':
                return { type, interval: parseInt(document.getElementById('every-x-weeks').value) || 2 };
            default:
                return { type };
        }
    }

    addOptionInput() {
        const list = document.getElementById('options-list');
        const index = this.habitOptions.length;
        this.habitOptions.push('');

        const div = document.createElement('div');
        div.className = 'option-input-row';
        div.innerHTML = `
            <input type="text" placeholder="Option ${index + 1}" data-option-index="${index}">
            <button type="button" class="remove-option" data-option-index="${index}">×</button>
        `;

        div.querySelector('input').addEventListener('input', (e) => {
            this.habitOptions[index] = e.target.value;
        });

        div.querySelector('.remove-option').addEventListener('click', () => {
            div.remove();
            this.habitOptions[index] = null;
        });

        list.appendChild(div);
    }

    getOptionsFromForm() {
        return this.habitOptions
            .filter(opt => opt && opt.trim())
            .map((name, i) => ({ id: `opt_${i}`, name: name.trim() }));
    }

    // Option Modal
    bindOptionModal() {
        const modal = document.getElementById('option-modal');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeOptionModal();
        });

        cancelBtn.addEventListener('click', () => {
            this.closeOptionModal();
        });

        confirmBtn.addEventListener('click', async () => {
            if (!this.pendingCompletion) return;

            const habitId = this.pendingCompletion;
            let optionId = this.selectedOption;
            let optionName = null;

            if (optionId === 'new') {
                const newOptionInput = document.getElementById('new-option-input');
                const newName = newOptionInput.value.trim();
                if (!newName) {
                    this.showToast('Entre le nom de l\'option', 'error');
                    return;
                }
                const newOpt = await this.addOptionToHabit(habitId, newName);
                if (newOpt) {
                    optionId = newOpt.id;
                    optionName = newOpt.name;
                }
            } else if (optionId) {
                const habit = this.habits.find(h => h.id === habitId);
                const opt = habit?.options?.find(o => o.id === optionId);
                optionName = opt?.name || null;
            }

            await this.toggleCompletion(habitId, optionId, optionName);
            this.closeOptionModal();
        });
    }

    openOptionModal(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        this.pendingCompletion = habitId;
        this.selectedOption = null;

        document.getElementById('modal-habit-emoji').textContent = habit.emoji || '✨';
        document.getElementById('modal-habit-name').textContent = habit.name;

        const optionsContainer = document.getElementById('modal-options');
        let html = '';

        (habit.options || []).forEach(opt => {
            html += `
                <div class="modal-option" data-option-id="${opt.id}">
                    <div class="option-radio"></div>
                    <span>${opt.name}</span>
                </div>
            `;
        });

        html += `
            <div class="modal-option new-option" data-option-id="new">
                <div class="option-radio"></div>
                <span>+ Nouvelle option</span>
            </div>
        `;

        optionsContainer.innerHTML = html;

        // Bind option selection
        optionsContainer.querySelectorAll('.modal-option').forEach(opt => {
            opt.addEventListener('click', () => {
                optionsContainer.querySelectorAll('.modal-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                this.selectedOption = opt.dataset.optionId;

                const newOptionContainer = document.getElementById('new-option-container');
                if (this.selectedOption === 'new') {
                    newOptionContainer.classList.remove('hidden');
                    document.getElementById('new-option-input').focus();
                } else {
                    newOptionContainer.classList.add('hidden');
                }
            });
        });

        document.getElementById('new-option-container').classList.add('hidden');
        document.getElementById('new-option-input').value = '';
        document.getElementById('option-modal').classList.remove('hidden');
    }

    closeOptionModal() {
        document.getElementById('option-modal').classList.add('hidden');
        this.pendingCompletion = null;
        this.selectedOption = null;
    }

    // Edit Modal
    bindEditModal() {
        const modal = document.getElementById('edit-modal');
        const form = document.getElementById('edit-habit-form');
        const closeBtn = document.getElementById('edit-close');
        const deleteBtn = document.getElementById('delete-habit-btn');

        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeEditModal();
        });

        closeBtn.addEventListener('click', () => {
            this.closeEditModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const habitId = document.getElementById('edit-habit-id').value;

            await this.updateHabit(habitId, {
                name: document.getElementById('edit-habit-name').value,
                emoji: document.getElementById('edit-habit-emoji').value,
                category: document.getElementById('edit-habit-category').value
            });

            this.closeEditModal();
        });

        deleteBtn.addEventListener('click', () => {
            const habitId = document.getElementById('edit-habit-id').value;
            if (confirm('Supprimer cette habitude ?')) {
                this.deleteHabit(habitId);
            }
        });
    }

    openEditModal(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        document.getElementById('edit-habit-id').value = habitId;
        document.getElementById('edit-habit-name').value = habit.name;
        document.getElementById('edit-habit-emoji').value = habit.emoji || '';
        document.getElementById('edit-habit-category').value = habit.category || 'learning';

        document.getElementById('edit-modal').classList.remove('hidden');
    }

    closeEditModal() {
        document.getElementById('edit-modal').classList.add('hidden');
    }

    // Tab switching
    switchTab(tab) {
        this.currentTab = tab;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tab}`);
        });
    }

    // ============================================
    // GAMIFICATION
    // ============================================
    triggerConfetti(size = 'small') {
        if (typeof confetti !== 'function') return;

        const defaults = {
            origin: { y: 0.7 },
            zIndex: 9999
        };

        if (size === 'small') {
            confetti({
                ...defaults,
                particleCount: 30,
                spread: 50,
                startVelocity: 20
            });
        } else {
            confetti({
                ...defaults,
                particleCount: 100,
                spread: 70,
                startVelocity: 30
            });
        }
    }

    // ============================================
    // TOASTS
    // ============================================
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `${type === 'success' ? '✓' : '✕'} ${message}`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // ============================================
    // APP DISPLAY
    // ============================================
    showApp() {
        const loading = document.getElementById('loading-screen');
        const app = document.getElementById('app');

        loading.classList.add('fade-out');
        setTimeout(() => {
            loading.style.display = 'none';
            app.classList.remove('hidden');
        }, 300);
    }
}

// ============================================
// INITIALIZE APP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.alibiPro = new AlibiProApp();
});
