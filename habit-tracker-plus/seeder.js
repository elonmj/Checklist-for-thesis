/**
 * Seeder Script for ALIBI Pro
 * Run this in the browser console while the app is open.
 */

const HABITS_DATA = [
    // 1. Ted X video
    {
        name: "Lire une vidéo Ted X",
        category: "learning",
        emoji: "🎥",
        frequency: { type: "times_per_week", value: 1 },
        hasOptions: true,
        options: [
            { id: "opt1", name: "Mental Health" },
            { id: "opt2", name: "Active Learning" },
            { id: "opt3", name: "Le Cerveau" },
            { id: "opt4", name: "Volonté" },
            { id: "opt5", name: "Motivation" },
            { id: "opt6", name: "Développement Personnel" }
        ],
        description: "Regarder une vidéo Ted X sur des sujets variés : santé mentale, apprentissage actif, neurosciences, volonté ou développement personnel.",
        color: "#6366f1"
    },
    // 2. Chapelet
    {
        name: "Faire le chapelet",
        category: "spiritual",
        emoji: "📿",
        frequency: { type: "times_per_week", value: 3 },
        description: "Faire le chapelet une fois par jour, au moins 3 jours par semaine.",
        color: "#a855f7"
    },
    // 3. 1000 pas
    {
        name: "Faire 1000 pas",
        category: "health",
        emoji: "🚶",
        frequency: { type: "times_per_week", value: 4 },
        description: "Faire 1000 pas de marche à compter avec l'application podomètre de mon téléphone au moins 4 jours sur 7.",
        color: "#22c55e"
    },
    // 4. Livre audio
    {
        name: "Écouter livre audio",
        category: "learning",
        emoji: "🎧",
        frequency: { type: "times_per_week", value: 2 },
        hasOptions: true,
        options: [
            { id: "opt1", name: "Les quatre accords toltèques" },
            { id: "opt2", name: "Le moine qui vendit sa Ferrari" }
        ],
        description: "Lire (écouter) le livre audio 'Les quatre accords toltèques' ou 'Le moine qui vendit sa Ferrari' au moins deux fois par semaine.",
        color: "#f97316"
    },
    // 5. Cours Power BI
    {
        name: "Suivre cours Power BI",
        category: "work",
        emoji: "📊",
        frequency: { type: "specific_days", days: [1, 2, 3, 4, 5] }, // Mon-Fri
        description: "Suivre mon cours Power BI au boulot du lundi au vendredi.",
        color: "#3b82f6"
    },
    // 6. Méditation biblique
    {
        name: "Méditation biblique",
        category: "spiritual",
        emoji: "📖",
        frequency: { type: "specific_days", days: [6] }, // Saturday
        description: "Faire des exercices de méditation d'un passage biblique pris au hasard chaque samedi.",
        color: "#a855f7"
    },
    // 7. Finir un livre de la bible
    {
        name: "Finir un livre Bible",
        category: "spiritual",
        emoji: "✝️",
        frequency: { type: "monthly" },
        description: "Finir un livre de la bible le mois qui vient.",
        color: "#a855f7"
    },
    // 8. Laver douche
    {
        name: "Laver la douche",
        category: "chores",
        emoji: "🚿",
        frequency: { type: "every_x_weeks", interval: 2 },
        description: "Laver ma douche toutes les deux semaines.",
        color: "#f43f5e"
    },
    // 9. Laver habits
    {
        name: "Laver mes habits",
        category: "chores",
        emoji: "🧺",
        frequency: { type: "every_x_weeks", interval: 3 },
        description: "Laver mes habits toutes les trois semaines. Note: L'alerte peut venir 1 semaine avant, puis 3 jours avant.",
        color: "#f43f5e"
    },
    // 10. Site en dév
    {
        name: "Site en dév",
        category: "projects",
        emoji: "💻",
        frequency: { type: "times_per_week", value: 2 },
        description: "Travailler sur le site en cours de développement deux jours au moins dans la semaine.",
        color: "#ec4899"
    },
    // 11. Mots de scrabble
    {
        name: "Mots de scrabble",
        category: "leisure",
        emoji: "🔤",
        frequency: { type: "every_x_days", interval: 2 },
        description: "Apprendre des mots de scrabble chaque 2 jours. Objectif : 38 nouveaux mots chaque semaine + révision des anciens.",
        color: "#eab308"
    },
    // 12. Jouer sur ISC
    {
        name: "Jouer sur ISC",
        category: "leisure",
        emoji: "🎮",
        frequency: { type: "every_x_days", interval: 2 },
        description: "Jouer sur ISC chaque 2 jours.",
        color: "#eab308"
    },
    // 13. Lire livre physique
    {
        name: "Lire livre physique",
        category: "learning",
        emoji: "📚",
        frequency: { type: "times_per_week", value: 3 },
        hasOptions: true,
        options: [
            { id: "opt1", name: "La confiance en soi" },
            { id: "opt2", name: "Believe it to achieve it" }
        ],
        description: "Lire mon livre physique (au choix) : 'La confiance en soi' ou 'Believe it to achieve it'.",
        color: "#6366f1"
    },
    // 14. Regarder animé/série
    {
        name: "Regarder animé/série",
        category: "leisure",
        emoji: "📺",
        frequency: { type: "every_x_weeks", interval: 2 },
        hasOptions: true,
        options: [
            { id: "opt1", name: "Dr Stone" },
            { id: "opt2", name: "Autre série" }
        ],
        description: "Regarder un animé ou une série (ex: Dr Stone) chaque 2 semaines au moins une fois.",
        color: "#eab308"
    },
    // 15. News Tech/IA
    {
        name: "News Tech/IA",
        category: "learning",
        emoji: "🤖",
        frequency: { type: "times_per_week", value: 2 },
        hasOptions: true,
        options: [
            { id: "opt1", name: "TechCrunch" },
            { id: "opt2", name: "YouTube" }
        ],
        description: "Lire les news sur l'IA soit sur TechCrunch soit en vidéo sur YouTube 2 fois la semaine.",
        color: "#3b82f6"
    },
    // 16. Courir / Foot
    {
        name: "Courir / Foot",
        category: "health",
        emoji: "⚽",
        frequency: { type: "monthly" },
        description: "Courir ou jouer au foot une fois le mois.",
        color: "#22c55e"
    },
    // 17. Cinéma Wologuede
    {
        name: "Cinéma Wologuede",
        category: "leisure",
        emoji: "🎬",
        frequency: { type: "every_x_months", interval: 2 },
        description: "Aller au cinéma Wologuede accompagné une fois les deux mois.",
        color: "#eab308"
    },
    // 18. Prière Saint Sacrement
    {
        name: "Prière St Sacrement",
        category: "spiritual",
        emoji: "⛪",
        frequency: { type: "specific_days", days: [2] }, // Tuesday
        description: "Prière personnelle au saint sacrement tous les mardis.",
        color: "#a855f7"
    },
    // 19. Laver assiettes
    {
        name: "Laver les assiettes",
        category: "chores",
        emoji: "🍽️",
        frequency: { type: "every_x_days", interval: 3 },
        description: "Laver les assiettes chaque 3 jours.",
        color: "#f43f5e"
    },
    // 20. Piano
    {
        name: "Piano",
        category: "leisure",
        emoji: "🎹",
        frequency: { type: "specific_days", days: [2, 4, 0] }, // Tue, Thu, Sun
        description: "Jouer au piano chaque jeudi soir et dimanche soir, si possible mardi aussi.",
        color: "#eab308"
    },
    // 21. Épreuve Série Temp
    {
        name: "Épreuve Série Temp",
        category: "learning",
        emoji: "📈",
        frequency: { type: "every_x_weeks", interval: 4 },
        description: "Traiter une épreuve du cours de série temp (son second) sur le site chaque 4 semaines.",
        color: "#3b82f6"
    },
    // 22. Projet Kyfax
    {
        name: "Projet Kyfax",
        category: "projects",
        emoji: "🚀",
        frequency: { type: "every_x_weeks", interval: 2 },
        description: "Taffer sur un projet de Kyfax (multiples choix) chaque 2 semaines.",
        color: "#ec4899"
    },
    // 23. Écrire à quelqu'un
    {
        name: "Écrire à quelqu'un",
        category: "leisure",
        emoji: "✉️",
        frequency: { type: "every_x_weeks", interval: 2 },
        hasOptions: true,
        options: [
            { id: "opt1", name: "Hortice" },
            { id: "opt2", name: "Kérane" },
            { id: "opt3", name: "Renaud" },
            { id: "opt4", name: "Géraldo" },
            { id: "opt5", name: "Tante Béatrice" },
            { id: "opt6", name: "Tante Perpétue" },
            { id: "opt7", name: "Colombe" }
        ],
        description: "Écrire à quelqu'un d'inhabituel chaque deux semaines (Hortice, Kérane, Renaud, Géraldo, Tante Béatrice, Tante Perpétue, Colombe).",
        color: "#eab308"
    },
    // 24. Neuvaine
    {
        name: "Neuvaine",
        category: "spiritual",
        emoji: "🕯️",
        frequency: { type: "novena_end_month" },
        hasOptions: true,
        options: [
            { id: "opt1", name: "Abandon" },
            { id: "opt2", name: "Sacré Coeur" },
            { id: "opt3", name: "Âmes du purgatoire" }
        ],
        description: "Chaque neuf derniers jours du mois, faire une neuvaine sur l'application Hosanna (la tâche est pour le neuvième avant dernier jour).",
        color: "#a855f7"
    },
    // 25. Coiffeur / Barbe
    {
        name: "Coiffeur / Barbe",
        category: "health",
        emoji: "💇‍♂️",
        frequency: { type: "every_x_weeks", interval: 3 },
        description: "Se coiffer / arranger la barbe chaque trois semaines.",
        color: "#22c55e"
    },
    // 26. Journal
    {
        name: "Journal",
        category: "health",
        emoji: "✍️",
        frequency: { type: "times_per_week", value: 2 },
        description: "Écrire dans mon journal deux fois par semaine.",
        color: "#22c55e"
    },
    // 27. Télécharger TikTok
    {
        name: "Télécharger TikTok",
        category: "leisure",
        emoji: "🎵",
        frequency: { type: "every_x_weeks", interval: 2 },
        description: "Chaque deux semaines trouver une vidéo TikTok (extrait de son, poème, autre) à télécharger.",
        color: "#eab308"
    },
    // 28. Partager statut
    {
        name: "Partager statut",
        category: "leisure",
        emoji: "📱",
        frequency: { type: "every_x_weeks", interval: 3 },
        description: "Partager sur statut chaque trois semaines au moins une vidéo.",
        color: "#eab308"
    },
    // 29. Scrabble physique
    {
        name: "Scrabble physique",
        category: "leisure",
        emoji: "♟️",
        frequency: { type: "monthly" },
        hasOptions: true,
        options: [
            { id: "opt1", name: "Chez Divin William" },
            { id: "opt2", name: "Chez Léonel" },
            { id: "opt3", name: "Chez Joaïda" }
        ],
        description: "Jouer en physique au Scrabble une fois tous les mois chez quelqu'un (Divin William, Léonel, Joaïda).",
        color: "#eab308"
    }
];

async function seedHabits() {
    console.log("Starting smart seed...");
    let added = 0;
    let updated = 0;

    const app = window.alibiPro;
    if (!app || !app.habits) {
        console.error("App not ready");
        return;
    }

    for (const habitData of HABITS_DATA) {
        // Check if habit exists by name
        const existingHabit = app.habits.find(h => h.name === habitData.name);

        if (existingHabit) {
            console.log(`Updating: ${habitData.name}`);
            try {
                // Update description and other fields
                await app.updateHabit(existingHabit.id, {
                    description: habitData.description,
                    // data updates if any changed in list
                    category: habitData.category,
                    emoji: habitData.emoji,
                    color: habitData.color,
                    frequency: habitData.frequency,
                    options: habitData.options || [],
                    hasOptions: habitData.hasOptions || false
                });
                updated++;
                // Small delay
                await new Promise(r => setTimeout(r, 50));
            } catch (e) {
                console.error(`Failed to update ${habitData.name}`, e);
            }
        } else {
            console.log(`Adding: ${habitData.name}`);
            try {
                await app.addHabit(habitData);
                added++;
                await new Promise(r => setTimeout(r, 100));
            } catch (e) {
                console.error(`Failed to add ${habitData.name}`, e);
            }
        }
    }

    console.log(`Finished! Added ${added}, Updated ${updated}.`);
    // alert(`Terminé ! ${added} ajoutées, ${updated} mises à jour.`);
    app.showToast(`Base de données mise à jour : ${added} + / ${updated} ↻`);
}

// Wait for app to initialize
window.addEventListener('load', () => {
    console.log("Page loaded, waiting for app initialization...");
    setTimeout(() => {
        if (window.alibiPro) {
            seedHabits();
        } else {
            console.error("ALIBI Pro app not found on window object!");
        }
    }, 2000); // 2 seconds delay to be nice and safe
});
