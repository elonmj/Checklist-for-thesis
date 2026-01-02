/**
 * ALIBI - Habit Tracker
 * Transforme tes intentions en habitudes
 * 
 * Features:
 * - Ultra-simple habit creation (just a name, everything else optional)
 * - Visual week calendar with streak tracking
 * - Browser notifications for reminders
 * - Gamification with confetti celebrations
 * - Firebase Firestore for real-time sync
 */

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBBFmcfTKFrDdNa-KOMwQqL8uG_SRpK7Jk",
    authDomain: "memoire-20adc.firebaseapp.com",
    projectId: "memoire-20adc",
    storageBucket: "memoire-20adc.firebasestorage.app",
    messagingSenderId: "829442058077",
    appId: "1:829442058077:web:8e27ff7c6fb83b3bd3f3dc"
};

// ============================================
// ALIBI APP CLASS
// ============================================
class AlibiApp {
    constructor() {
        this.db = null;
        this.habits = [];
        this.completions = [];
        this.currentWeekStart = this.getWeekStart(new Date());
        this.selectedDate = new Date();
        this.isFirstVisit = !localStorage.getItem('alibi_visited');

        // Emoji suggestions based on common habits
        this.emojiSuggestions = {
            'sport': '🏃', 'course': '🏃', 'run': '🏃', 'jogging': '🏃',
            'méditation': '🧘', 'meditation': '🧘', 'méditer': '🧘',
            'lecture': '📚', 'lire': '📚', 'book': '📚', 'read': '📚',
            'eau': '💧', 'water': '💧', 'boire': '💧', 'hydrat': '💧',
            'anglais': '🇬🇧', 'english': '🇬🇧', 'langue': '🗣️',
            'prière': '🤲', 'prayer': '🤲', 'prier': '🤲',
            'code': '💻', 'coding': '💻', 'program': '💻', 'dev': '💻',
            'power bi': '📊', 'excel': '📊', 'data': '📊',
            'tedx': '🎬', 'video': '🎬', 'youtube': '🎬',
            'sleep': '😴', 'sommeil': '😴', 'dormir': '😴',
            'gym': '💪', 'musculation': '💪', 'workout': '💪',
            'yoga': '🧘', 'stretch': '🤸',
            'journal': '📝', 'écrire': '✍️', 'write': '✍️',
            'marche': '🚶', 'walk': '🚶', 'steps': '👟',
            'vitamines': '💊', 'vitamin': '💊', 'pill': '💊',
            'fruit': '🍎', 'légume': '🥬', 'vegetable': '🥬',
            'musique': '🎵', 'music': '🎵', 'piano': '🎹', 'guitare': '🎸'
        };

        // Default colors
        this.defaultColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    async init() {
        console.log('🎯 ALIBI - Initializing...');

        try {
            this.initFirebase();
            this.bindEvents();

            if (this.isFirstVisit) {
                this.showOnboarding();
            } else {
                this.showApp();
            }

            await this.loadData();
            this.render();
            this.requestNotificationPermission();
            this.scheduleReminders();

            console.log('✅ ALIBI ready!');
        } catch (error) {
            console.error('❌ ALIBI init error:', error);
            this.showToast('Erreur de chargement', 'error');
        }
    }

    initFirebase() {
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        this.db = firebase.firestore();
    }

    // ============================================
    // DATA OPERATIONS
    // ============================================
    async loadData() {
        try {
            // Load habits
            const habitsSnap = await this.db.collection('habits').orderBy('createdAt', 'desc').get();
            this.habits = habitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Load completions for the current week + previous week (for streak calculation)
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            const completionsSnap = await this.db.collection('completions')
                .where('date', '>=', this.formatDate(twoWeeksAgo))
                .get();
            this.completions = completionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            console.log(`📊 Loaded ${this.habits.length} habits, ${this.completions.length} completions`);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    async addHabit(habitData) {
        try {
            const habit = {
                name: habitData.name,
                emoji: habitData.emoji || this.suggestEmoji(habitData.name),
                color: habitData.color || this.defaultColors[this.habits.length % this.defaultColors.length],
                frequency: habitData.frequency || 'daily',
                customDays: habitData.customDays || [],
                reminder: habitData.reminder || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                streak: 0,
                bestStreak: 0
            };

            const docRef = await this.db.collection('habits').add(habit);
            habit.id = docRef.id;
            this.habits.unshift(habit);

            this.showToast(`"${habit.name}" ajoutée ! 🎉`, 'success');
            this.triggerConfetti('small');
            this.render();

            return habit;
        } catch (error) {
            console.error('Error adding habit:', error);
            this.showToast('Erreur lors de l\'ajout', 'error');
        }
    }

    async updateHabit(habitId, updates) {
        try {
            await this.db.collection('habits').doc(habitId).update(updates);
            const index = this.habits.findIndex(h => h.id === habitId);
            if (index !== -1) {
                this.habits[index] = { ...this.habits[index], ...updates };
            }
            this.showToast('Habitude mise à jour ✨', 'success');
            this.render();
        } catch (error) {
            console.error('Error updating habit:', error);
            this.showToast('Erreur lors de la mise à jour', 'error');
        }
    }

    async deleteHabit(habitId) {
        try {
            await this.db.collection('habits').doc(habitId).delete();
            // Also delete all completions for this habit
            const completionsSnap = await this.db.collection('completions')
                .where('habitId', '==', habitId)
                .get();
            const batch = this.db.batch();
            completionsSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            this.habits = this.habits.filter(h => h.id !== habitId);
            this.completions = this.completions.filter(c => c.habitId !== habitId);

            this.showToast('Habitude supprimée', 'success');
            this.render();
        } catch (error) {
            console.error('Error deleting habit:', error);
            this.showToast('Erreur lors de la suppression', 'error');
        }
    }

    async toggleCompletion(habitId, date = null) {
        const dateStr = date || this.formatDate(this.selectedDate);
        const existingCompletion = this.completions.find(
            c => c.habitId === habitId && c.date === dateStr
        );

        try {
            if (existingCompletion) {
                // Remove completion
                await this.db.collection('completions').doc(existingCompletion.id).delete();
                this.completions = this.completions.filter(c => c.id !== existingCompletion.id);
            } else {
                // Add completion
                const completion = {
                    habitId,
                    date: dateStr,
                    completedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                const docRef = await this.db.collection('completions').add(completion);
                completion.id = docRef.id;
                this.completions.push(completion);

                // Check if all habits are completed today
                const todayHabits = this.getHabitsForDate(this.selectedDate);
                const completedToday = todayHabits.filter(h => this.isHabitCompletedOnDate(h.id, dateStr));

                if (completedToday.length === todayHabits.length && todayHabits.length > 0) {
                    this.triggerConfetti('big');
                    this.showToast('Journée parfaite ! 🏆', 'success');
                } else {
                    this.triggerConfetti('small');
                }
            }

            // Update streak
            await this.updateStreak(habitId);
            this.render();
        } catch (error) {
            console.error('Error toggling completion:', error);
            this.showToast('Erreur', 'error');
        }
    }

    async updateStreak(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        let streak = 0;
        let date = new Date();

        // Count consecutive days
        while (true) {
            const dateStr = this.formatDate(date);
            if (this.isHabitCompletedOnDate(habitId, dateStr)) {
                streak++;
                date.setDate(date.getDate() - 1);
            } else if (this.formatDate(date) === this.formatDate(new Date())) {
                // Today not completed yet, check yesterday
                date.setDate(date.getDate() - 1);
            } else {
                break;
            }

            // Safety limit
            if (streak > 365) break;
        }

        const bestStreak = Math.max(streak, habit.bestStreak || 0);

        await this.db.collection('habits').doc(habitId).update({
            streak,
            bestStreak
        });

        habit.streak = streak;
        habit.bestStreak = bestStreak;
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
        return new Date(d.setDate(diff));
    }

    isToday(date) {
        return this.formatDate(date) === this.formatDate(new Date());
    }

    isHabitCompletedOnDate(habitId, dateStr) {
        return this.completions.some(c => c.habitId === habitId && c.date === dateStr);
    }

    getHabitsForDate(date) {
        const dayOfWeek = date.getDay();
        return this.habits.filter(habit => {
            if (habit.frequency === 'daily') return true;
            if (habit.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
            if (habit.frequency === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
            if (habit.frequency === 'custom') return habit.customDays?.includes(dayOfWeek);
            return true;
        });
    }

    suggestEmoji(habitName) {
        const nameLower = habitName.toLowerCase();
        for (const [keyword, emoji] of Object.entries(this.emojiSuggestions)) {
            if (nameLower.includes(keyword)) {
                return emoji;
            }
        }
        return '✨';
    }

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bonjour ! ☀️';
        if (hour < 18) return 'Bon après-midi ! 🌤️';
        return 'Bonsoir ! 🌙';
    }

    getTotalStreak() {
        return this.habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    }

    // ============================================
    // UI RENDERING
    // ============================================
    render() {
        this.renderHeader();
        this.renderWeekView();
        this.renderTodayHabits();
        this.renderStats();
        this.renderAllHabits();
    }

    renderHeader() {
        document.getElementById('greeting').textContent = this.getGreeting();
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        document.getElementById('streak-count').textContent = this.getTotalStreak();
    }

    renderWeekView() {
        const container = document.getElementById('week-days');
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const today = new Date();

        let html = '';
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + i);
            const dateStr = this.formatDate(date);

            const habitsForDay = this.getHabitsForDate(date);
            const completedCount = habitsForDay.filter(h => this.isHabitCompletedOnDate(h.id, dateStr)).length;
            const hasCompletions = completedCount > 0 && completedCount === habitsForDay.length;

            const isToday = this.isToday(date);
            const isSelected = this.formatDate(date) === this.formatDate(this.selectedDate);

            html += `
                <div class="day-card ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasCompletions ? 'has-completions' : ''}"
                     data-date="${dateStr}">
                    <div class="day-name">${days[date.getDay()]}</div>
                    <div class="day-number">${date.getDate()}</div>
                </div>
            `;
        }
        container.innerHTML = html;

        // Update week title
        const weekStart = this.currentWeekStart;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const isCurrentWeek = this.formatDate(this.getWeekStart(new Date())) === this.formatDate(this.currentWeekStart);
        document.getElementById('week-title').textContent = isCurrentWeek ? 'Cette semaine' :
            `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('fr-FR', { month: 'short' })}`;
    }

    renderTodayHabits() {
        const container = document.getElementById('habits-list');
        const emptyState = document.getElementById('empty-state');
        const dateStr = this.formatDate(this.selectedDate);
        const habitsForDay = this.getHabitsForDate(this.selectedDate);

        if (habitsForDay.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            this.updateProgressRing(0);
            return;
        }

        emptyState.classList.add('hidden');

        const completedCount = habitsForDay.filter(h => this.isHabitCompletedOnDate(h.id, dateStr)).length;
        const progress = Math.round((completedCount / habitsForDay.length) * 100);
        this.updateProgressRing(progress);

        container.innerHTML = habitsForDay.map(habit => {
            const isCompleted = this.isHabitCompletedOnDate(habit.id, dateStr);
            return `
                <div class="habit-item ${isCompleted ? 'completed' : ''}" data-id="${habit.id}">
                    <div class="habit-checkbox ${isCompleted ? 'checked' : ''}" data-habit-id="${habit.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <div class="habit-emoji" style="background: ${habit.color}20;">
                        ${habit.emoji}
                    </div>
                    <div class="habit-info">
                        <div class="habit-name">${habit.name}</div>
                        <div class="habit-meta">
                            ${habit.streak > 0 ? `<span class="habit-streak">🔥 ${habit.streak}j</span>` : ''}
                            ${habit.reminder ? `<span>⏰ ${habit.reminder}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateProgressRing(percent) {
        const ring = document.getElementById('progress-ring');
        const text = document.getElementById('progress-text');
        const circumference = 2 * Math.PI * 20; // radius = 20
        const offset = circumference - (percent / 100) * circumference;
        ring.style.strokeDashoffset = offset;
        text.textContent = `${percent}%`;
    }

    renderStats() {
        const totalCompleted = this.completions.length;
        const bestStreak = this.habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);
        const totalHabits = this.habits.length;

        // Calculate success rate for last 7 days
        let possibleCompletions = 0;
        let actualCompletions = 0;
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            const habitsForDay = this.getHabitsForDate(date);
            possibleCompletions += habitsForDay.length;
            actualCompletions += habitsForDay.filter(h => this.isHabitCompletedOnDate(h.id, dateStr)).length;
        }
        const successRate = possibleCompletions > 0 ? Math.round((actualCompletions / possibleCompletions) * 100) : 0;

        document.getElementById('stat-streak').textContent = bestStreak;
        document.getElementById('stat-completed').textContent = totalCompleted;
        document.getElementById('stat-habits').textContent = totalHabits;
        document.getElementById('stat-rate').textContent = `${successRate}%`;
    }

    renderAllHabits() {
        const container = document.getElementById('all-habits-list');

        if (this.habits.length === 0) {
            container.innerHTML = '<p class="empty-hint" style="text-align: center; padding: 20px;">Aucune habitude créée</p>';
            return;
        }

        container.innerHTML = this.habits.map(habit => `
            <div class="all-habit-item" data-id="${habit.id}">
                <div class="habit-color" style="background: ${habit.color}"></div>
                <div class="habit-emoji">${habit.emoji}</div>
                <div class="habit-info">
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-meta">
                        ${habit.frequency === 'daily' ? 'Quotidien' :
                habit.frequency === 'weekdays' ? 'Semaine' :
                    habit.frequency === 'weekends' ? 'Week-end' : 'Personnalisé'}
                        ${habit.bestStreak > 0 ? ` • Record: 🔥 ${habit.bestStreak}j` : ''}
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="btn-icon edit-habit" data-id="${habit.id}" aria-label="Modifier">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ============================================
    // EVENTS
    // ============================================
    bindEvents() {
        // Start button (onboarding)
        document.getElementById('start-btn')?.addEventListener('click', () => {
            localStorage.setItem('alibi_visited', 'true');
            this.showApp();
        });

        // Quick add form
        document.getElementById('quick-add-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('habit-input');
            const name = input.value.trim();
            if (!name) return;

            const habitData = {
                name,
                color: document.getElementById('habit-color').value,
                frequency: document.getElementById('habit-frequency').value,
                reminder: document.getElementById('habit-reminder').value || null,
                emoji: document.getElementById('habit-emoji').value || null
            };

            // Get custom days if frequency is custom
            if (habitData.frequency === 'custom') {
                habitData.customDays = Array.from(document.querySelectorAll('.day-btn.active'))
                    .map(btn => parseInt(btn.dataset.day));
            }

            this.addHabit(habitData);
            input.value = '';
            document.getElementById('habit-emoji').value = '';
            document.getElementById('habit-details').classList.add('hidden');
            document.getElementById('toggle-details').classList.remove('open');
        });

        // Toggle details
        document.getElementById('toggle-details').addEventListener('click', () => {
            const details = document.getElementById('habit-details');
            const toggle = document.getElementById('toggle-details');
            details.classList.toggle('hidden');
            toggle.classList.toggle('open');
        });

        // Frequency change
        document.getElementById('habit-frequency').addEventListener('change', (e) => {
            const customDays = document.getElementById('custom-days');
            customDays.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        // Custom day buttons
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', () => btn.classList.toggle('active'));
        });

        // Week navigation
        document.getElementById('prev-week').addEventListener('click', () => {
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
            this.renderWeekView();
        });

        document.getElementById('next-week').addEventListener('click', () => {
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
            this.renderWeekView();
        });

        // Day selection
        document.getElementById('week-days').addEventListener('click', (e) => {
            const dayCard = e.target.closest('.day-card');
            if (dayCard) {
                this.selectedDate = new Date(dayCard.dataset.date);
                this.renderWeekView();
                this.renderTodayHabits();
            }
        });

        // Habit checkbox
        document.getElementById('habits-list').addEventListener('click', (e) => {
            const checkbox = e.target.closest('.habit-checkbox');
            if (checkbox) {
                e.stopPropagation();
                this.toggleCompletion(checkbox.dataset.habitId);
            }
        });

        // Edit habit button
        document.getElementById('all-habits-list').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-habit');
            if (editBtn) {
                this.openEditModal(editBtn.dataset.id);
            }
        });

        // Modal events
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeEditModal());
        document.querySelector('.modal-close')?.addEventListener('click', () => this.closeEditModal());

        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            const updates = {
                name: document.getElementById('edit-name').value,
                emoji: document.getElementById('edit-emoji').value || '✨',
                reminder: document.getElementById('edit-reminder').value || null
            };

            const selectedColor = document.querySelector('.color-option.selected');
            if (selectedColor) {
                updates.color = selectedColor.dataset.color;
            }

            this.updateHabit(id, updates);
            this.closeEditModal();
        });

        document.getElementById('delete-habit').addEventListener('click', () => {
            const id = document.getElementById('edit-id').value;
            if (confirm('Supprimer cette habitude ?')) {
                this.deleteHabit(id);
                this.closeEditModal();
            }
        });

        // Color picker
        document.getElementById('edit-color-picker').addEventListener('click', (e) => {
            const colorOption = e.target.closest('.color-option');
            if (colorOption) {
                document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
                colorOption.classList.add('selected');
            }
        });
    }

    openEditModal(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        document.getElementById('edit-id').value = habit.id;
        document.getElementById('edit-name').value = habit.name;
        document.getElementById('edit-emoji').value = habit.emoji || '';
        document.getElementById('edit-reminder').value = habit.reminder || '';

        // Set color
        document.querySelectorAll('.color-option').forEach(c => {
            c.classList.toggle('selected', c.dataset.color === habit.color);
        });

        document.getElementById('edit-modal').classList.remove('hidden');
    }

    closeEditModal() {
        document.getElementById('edit-modal').classList.add('hidden');
    }

    // ============================================
    // NOTIFICATIONS
    // ============================================
    async requestNotificationPermission() {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
        }
    }

    scheduleReminders() {
        // Check every minute for habits that need reminders
        setInterval(() => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            this.habits.forEach(habit => {
                if (habit.reminder === currentTime) {
                    const dateStr = this.formatDate(now);
                    if (!this.isHabitCompletedOnDate(habit.id, dateStr)) {
                        this.sendNotification(habit);
                    }
                }
            });
        }, 60000);
    }

    sendNotification(habit) {
        if (Notification.permission !== 'granted') return;

        new Notification(`${habit.emoji} ${habit.name}`, {
            body: `C'est l'heure ! 🔥 Streak actuel: ${habit.streak || 0} jours`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎯</text></svg>',
            tag: habit.id,
            requireInteraction: true
        });
    }

    // ============================================
    // GAMIFICATION
    // ============================================
    triggerConfetti(size = 'small') {
        if (typeof confetti !== 'function') return;

        if (size === 'big') {
            // Big celebration for completing all habits
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#6366f1', '#10b981', '#f59e0b']
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#6366f1', '#10b981', '#f59e0b']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        } else {
            // Small celebration for single habit
            confetti({
                particleCount: 30,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#6366f1', '#10b981', '#f59e0b']
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
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    // ============================================
    // SCREENS
    // ============================================
    showOnboarding() {
        document.getElementById('onboarding').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }

    showApp() {
        document.getElementById('onboarding').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }
}

// ============================================
// BOOTSTRAP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const app = new AlibiApp();
    app.init();
});
