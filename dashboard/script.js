/**
 * Dashboard v3.0 - Script principal (Adapté à la nouvelle structure de données)
 * Author: Roo (AI Assistant)
 * Description: Gère l'affichage et l'interactivité du tableau de bord, avec un routage par URL,
 *              une connexion à Firestore et une date de simulation fixe pour une démo correcte.
 *              Adapté pour fonctionner avec la nouvelle structure de données (collections séparées).
 */
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new ProjectDashboard();
    dashboard.init();
});

// --- CONFIGURATION ---
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBBFmcfTKFrDdNa-KOMwQqL8uG_SRpK7Jk",
    authDomain: "memoire-20adc.firebaseapp.com",
    projectId: "memoire-20adc",
    storageBucket: "memoire-20adc.firebasestorage.app",
    messagingSenderId: "829442058077",
    appId: "1:829442058077:web:8e27ff7c6fb83b3bd3f3dc"
};

// CORRECTION: Utiliser la date actuelle pour un suivi en temps réel
const SIMULATED_CURRENT_DATE = new Date(); // Date actuelle

// --- CLASSE PRINCIPALE DU DASHBOARD ---
class ProjectDashboard {
    constructor() {
        this.db = null;
        // Adapter la structure de données pour refléter la nouvelle organisation
        this.data = { deliverables: [], phases: [], weeks: [], chapters: [] };
        this.charts = { phasesBar: null, statusPie: null, gantt: null };
    }

    async init() {
        console.log("🚀 Initialisation du Dashboard v3.0 (Date simulée)...");
        try {
            this.initFirebase();
            const rawData = await this.loadDataFromFirestore();
            this.data = this.processData(rawData);
            this.setupEventListeners();
            this.render();
            this.handleRouting();
            console.log("✅ Dashboard prêt.");
        } catch (error) {
            console.error("❌ Erreur critique:", error);
            this.showError("Impossible de charger les données.");
        }
    }

    initFirebase() {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        this.db = firebase.firestore();
    }

    /**
     * Charge les données depuis les collections Firestore séparées.
     */
    async loadDataFromFirestore() {
        console.log("⏳ Chargement des données depuis Firestore...");
        try {
            const [phasesSnapshot, weeksSnapshot, deliverablesSnapshot, chaptersSnapshot] = await Promise.all([
                this.db.collection('phases').get(),
                this.db.collection('weeks').get(),
                this.db.collection('deliverables').get(),
                this.db.collection('chapters').get()
            ]);

            const data = {
                phases: phasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                weeks: weeksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                deliverables: deliverablesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                chapters: chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            };

            console.log("✅ Données chargées depuis Firestore.");
            return data;
        } catch (error) {
            console.error("❌ Erreur lors du chargement depuis Firestore:", error);
            throw error;
        }
    }

    /**
     * Traite les données brutes pour les préparer à l'affichage.
     * Lie les données entre elles (ex: livrables -> semaines -> dates) et calcule les statuts.
     */
    processData(rawData) {
        console.log("🔄 Traitement des données brutes...");
        const data = { ...rawData };

        // Créer un index pour un accès rapide aux semaines par leur ID
        const weekIndex = {};
        if (data.weeks) {
            data.weeks.forEach(week => {
                weekIndex[week.id] = week;
            });
        }

        // Enrichir les livrables avec les informations de leur semaine associée
        if (data.deliverables) {
            data.deliverables = data.deliverables.map(d => {
                const enriched = { ...d };
                const week = weekIndex[d.week_id];
                if (week) {
                    // Extraire et convertir les dates de la semaine
                    console.log(`🔍 Traitement livrable ${d.id}, semaine: ${week.date_range}`);
                    const dateRange = week.date_range.split(' - ');
                    enriched.start = this.parseFrenchDate(dateRange[0]);
                    enriched.end = this.parseFrenchDate(dateRange[1]);
                    console.log(`📅 Dates converties: ${enriched.start} → ${enriched.end}`);
                } else {
                    console.warn(`⚠️ Semaine non trouvée pour livrable ${d.id} (week_id: ${d.week_id})`);
                }
                // Calculer le statut automatique
                enriched.status = this.calculateAutomaticStatus(enriched);
                return enriched;
            });
        }

        console.log("✅ Données traitées.");
        return data;
    }

    /**
     * Convertit une date au format français en format ISO (YYYY-MM-DD)
     * @param {string} frenchDate - Date au format "28 Juillet" ou "28 juil."
     * @returns {string} Date au format ISO
     */
    parseFrenchDate(frenchDate) {
        if (!frenchDate) return null;

        const monthMap = {
            // Mois complets
            'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
            'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
            'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12',
            // Variants et abréviations
            'jan': '01', 'jan.': '01', 'janvier.': '01',
            'fév': '02', 'fév.': '02', 'fevrier': '02', 'feb': '02',
            'mar': '03', 'mar.': '03', 'mars.': '03',
            'avr': '04', 'avr.': '04', 'avril.': '04',
            'mai.': '05',
            'jun': '06', 'jun.': '06', 'juin.': '06',
            'juil': '07', 'juil.': '07', 'juillet.': '07', 'jul': '07',
            'aou': '08', 'aou.': '08', 'aout': '08', 'aoû': '08', 'août.': '08',
            'sep': '09', 'sep.': '09', 'sept': '09', 'sept.': '09', 'septembre.': '09',
            'oct': '10', 'oct.': '10', 'octobre.': '10',
            'nov': '11', 'nov.': '11', 'novembre.': '11',
            'déc': '12', 'déc.': '12', 'dec': '12', 'dec.': '12', 'decembre': '12', 'décembre.': '12'
        };

        // Nettoyer la date et la diviser
        const cleanDate = frenchDate.toLowerCase().trim();
        const parts = cleanDate.split(/\s+/); // Split sur tout espace
        if (parts.length < 2) {
            console.warn(`Format de date invalide: "${frenchDate}"`);
            return null;
        }

        const day = parts[0].padStart(2, '0');
        const monthName = parts[1];
        const month = monthMap[monthName];

        if (!month) {
            console.warn(`Mois non reconnu: "${monthName}" dans "${frenchDate}"`);
            // Essayer sans point final
            const monthWithoutDot = monthName.replace('.', '');
            const monthFallback = monthMap[monthWithoutDot];
            if (monthFallback) {
                console.log(`✅ Mois trouvé après suppression du point: "${monthWithoutDot}"`);
                return `2025-${monthFallback}-${day}`;
            }
            return null;
        }

        // Assumer l'année 2025 par défaut
        const year = '2025';
        const result = `${year}-${month}-${day}`;
        console.log(`✅ Date parsée: "${frenchDate}" → "${result}"`);

        return result;
    }

    /**
     * Calcule le statut automatique d'un élément en fonction de la date simulée.
     * @param {Object} d - L'élément (livrable) à évaluer.
     * @returns {string} Le statut calculé ('terminé', 'en-retard', 'en-cours', 'non-commencé').
     */
    calculateAutomaticStatus(d) {
        if (d.manuallyCompleted) return 'terminé';
        const now = SIMULATED_CURRENT_DATE;
        const endDate = d.end ? new Date(d.end) : null;
        if (endDate) endDate.setHours(23, 59, 59, 999);
        if (endDate && now > endDate) return 'en-retard';
        const startDate = d.start ? new Date(d.start) : null;
        if (startDate && now >= startDate && now <= endDate) return 'en-cours';
        return 'non-commencé';
    }

    setupEventListeners() {
        document.getElementById('deliverables-container')?.addEventListener('change', e => {
            if (e.target.classList.contains('completion-toggle')) {
                this.handleDeliverableToggle(e.target.dataset.id, e.target.checked);
            }
        });
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', e => { window.location.hash = e.target.dataset.tab; });
        });
        window.addEventListener('hashchange', () => this.handleRouting());
    }

    handleRouting() {
        const hash = window.location.hash.substring(1);
        const validTabs = ['overview', 'planning', 'deliverables', 'gantt'];
        const defaultTab = 'overview';
        const tabId = validTabs.includes(hash) ? hash : defaultTab;
        if (hash !== tabId) {
            history.replaceState(null, '', `#${tabId}`);
        }
        this.switchTab(tabId);
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.getElementById(tabId)?.classList.add('active');
        document.querySelector(`.tab-button[data-tab="${tabId}"]`)?.classList.add('active');
    }

    async handleDeliverableToggle(id, isCompleted) {
        const deliverable = this.data.deliverables.find(d => d.id === id);
        if (!deliverable) return;
        const oldState = deliverable.manuallyCompleted;
        deliverable.manuallyCompleted = isCompleted;
        deliverable.status = this.calculateAutomaticStatus(deliverable);
        this.renderSingleDeliverable(id);
        this.renderAllCharts();
        this.renderPlanning();
        try {
            // Mettre à jour uniquement le champ 'manuallyCompleted' du livrable spécifique
            await this.db.collection('deliverables').doc(id).update({ manuallyCompleted: isCompleted });
            console.log(`✅ Statut du livrable ${id} sauvegardé.`);
        } catch (error) {
            console.error(`❌ Erreur de sauvegarde pour ${id}:`, error);
            this.showError("La sauvegarde a échoué.");
            deliverable.manuallyCompleted = oldState;
            // Re-rendre pour refléter l'état précédent en cas d'erreur
            this.renderSingleDeliverable(id);
            this.renderAllCharts();
            this.renderPlanning();
        }
    }

    render() {
        this.renderPlanning();
        this.renderDeliverables();
        this.renderAllCharts();
    }

    renderPlanning() {
        const container = document.getElementById('planning-container');
        if (!container || !this.data.phases || !this.data.weeks || !this.data.deliverables) return;

        // Créer un index pour un accès rapide aux semaines par phase_id
        const weeksByPhaseId = {};
        this.data.weeks.forEach(week => {
            if (!weeksByPhaseId[week.phase_id]) {
                weeksByPhaseId[week.phase_id] = [];
            }
            weeksByPhaseId[week.phase_id].push(week);
        });

        // Créer un index pour un accès rapide aux livrables par week_id
        const deliverablesByWeekId = {};
        this.data.deliverables.forEach(deliverable => {
            if (!deliverablesByWeekId[deliverable.week_id]) {
                deliverablesByWeekId[deliverable.week_id] = [];
            }
            deliverablesByWeekId[deliverable.week_id].push(deliverable);
        });

        container.innerHTML = this.data.phases.map(phase => {
            // Récupérer les semaines associées à cette phase
            const phaseWeeks = weeksByPhaseId[phase.id] || [];

            // Récupérer tous les livrables associés aux semaines de cette phase
            const phaseDeliverables = phaseWeeks.flatMap(week => deliverablesByWeekId[week.id] || []);

            return `
                <div class="phase-card">
                    <h3>${phase.title}</h3>
                    <p class="phase-objective">${phase.objective}</p>
                    <h4>Livrables Clés :</h4>
                    <ul class="phase-deliverables-list">
                        ${phaseDeliverables.length > 0 ? phaseDeliverables.map(d => `<li class="status-${d.status}">${d.description}</li>`).join('') : '<li>Aucun livrable trouvé pour cette phase.</li>'}
                    </ul>
                </div>
            `;
        }).join('');
    }

    renderDeliverables() {
        const container = document.getElementById('deliverables-container');
        if (!container) return;
        container.innerHTML = this.data.deliverables.map(item => this.getDeliverableHtml(item)).join('');
    }

    renderSingleDeliverable(id) {
        const item = this.data.deliverables.find(d => d.id === id);
        const element = document.querySelector(`.deliverable-item[data-id="${id}"]`);
        if (item && element) element.outerHTML = this.getDeliverableHtml(item);
    }

    getDeliverableHtml(item) {
        return `
            <div class="deliverable-item status-${item.status}" data-id="${item.id}">
                <div class="deliverable-info">
                    <h4>${item.id} - ${item.description}</h4>
                    ${item.details ? `<p class="deliverable-details">${item.details}</p>` : ''}
                </div>
                <div class="deliverable-actions">
                    <input type="checkbox" class="completion-toggle" data-id="${item.id}" ${item.manuallyCompleted ? 'checked' : ''} title="Marquer comme terminé">
                </div>
            </div>
        `;
    }

    renderAllCharts() {
        this.renderMetricsCharts();
        this.renderGanttChart();
    }

    renderMetricsCharts() {
        const phasesCtx = document.getElementById('phases-bar-chart')?.getContext('2d');
        const statusCtx = document.getElementById('status-pie-chart')?.getContext('2d');
        if (!phasesCtx || !statusCtx) return;

        // Créer un index pour un accès rapide aux semaines par leur ID
        const weekIndex = {};
        if (this.data.weeks) {
            this.data.weeks.forEach(week => {
                weekIndex[week.id] = week;
            });
        }

        const phaseProgress = this.data.phases.map(phase => {
            // Trouver tous les livrables associés à cette phase via les semaines
            const phaseDeliverables = this.data.deliverables.filter(d => {
                const week = weekIndex[d.week_id];
                return week && week.phase_id === phase.id;
            });
            const completed = phaseDeliverables.filter(d => d.status === 'terminé').length;
            return {
                name: phase.title,
                progress: phaseDeliverables.length > 0 ? (completed / phaseDeliverables.length) * 100 : 0
            };
        });

        const statusCounts = this.data.deliverables.reduce((acc, d) => {
            acc[d.status] = (acc[d.status] || 0) + 1;
            return acc;
        }, { 'non-commencé': 0, 'en-cours': 0, 'en-retard': 0, 'terminé': 0 });

        if (this.charts.phasesBar) this.charts.phasesBar.destroy();
        this.charts.phasesBar = new Chart(phasesCtx, {
            type: 'bar',
            data: {
                labels: phaseProgress.map(p => p.name),
                datasets: [{
                    label: 'Progression (%)',
                    data: phaseProgress.map(p => p.progress),
                    backgroundColor: 'rgba(37, 99, 235, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });

        if (this.charts.statusPie) this.charts.statusPie.destroy();
        this.charts.statusPie = new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#6c757d', '#007bff', '#dc3545', '#28a745']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    renderGanttChart() {
        const ganttCtx = document.getElementById('gantt-chart')?.getContext('2d');
        if (!ganttCtx) return;

        const statusColors = {
            'terminé': 'rgba(40, 167, 69, 0.7)',
            'en-retard': 'rgba(220, 53, 69, 0.7)',
            'en-cours': 'rgba(0, 123, 255, 0.7)',
            'non-commencé': 'rgba(108, 117, 125, 0.7)'
        };

        // Filtrer seulement les livrables avec des dates valides
        const validDeliverables = this.data.deliverables.filter(d => d.start && d.end);

        console.log("Livrables valides pour Gantt:", validDeliverables.length, "sur", this.data.deliverables.length);

        if (validDeliverables.length === 0) {
            console.warn("Aucun livrable avec dates valides pour le Gantt");
            return;
        }

        const ganttData = {
            labels: validDeliverables.map(d => `${d.id} - ${d.description}`),
            datasets: [{
                label: 'Planning',
                data: validDeliverables.map(d => ({
                    x: [d.start, d.end],
                    y: `${d.id} - ${d.description}`
                })),
                backgroundColor: validDeliverables.map(d => statusColors[d.status] || statusColors['non-commencé']),
            }]
        };

        if (this.charts.gantt) this.charts.gantt.destroy();

        this.charts.gantt = new Chart(ganttCtx, {
            type: 'bar',
            data: ganttData,
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'week' },
                        min: '2025-07-01',
                        max: '2025-12-31'
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: c => {
                                const start = new Date(c.raw.x[0]).toLocaleDateString('fr-FR');
                                const end = new Date(c.raw.x[1]).toLocaleDateString('fr-FR');
                                return `${c.label}: ${start} - ${end}`;
                            }
                        }
                    }
                }
            }
        });
    }

    showError(message) {
        const status = document.getElementById('project-status');
        if (status) {
            status.textContent = `❌ ${message}`;
            status.style.color = 'var(--danger-color)';
        }
    }
}