# 🎯 ALIBI - Habit Tracker & Dashboard de Suivi de Projet

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)

---

## 🚀 Application Déployée

| Application | Description | Lien |
|-------------|-------------|------|
| **🎯 ALIBI Pro** | Habit Tracker avancé avec catégories, fréquences flexibles et options | [memoire-20adc.web.app](https://memoire-20adc.web.app) |

> **Note:** ALIBI Pro est maintenant l'application principale. Les versions antérieures (habit-tracker simple et dashboard) sont disponibles en local dans leurs dossiers respectifs.

---

## 🎯 ALIBI - Habit Tracker (Version Simple)

> **Transforme tes intentions en habitudes. Ultra-simple, ultra-puissant.**

### 📁 Disponible en local dans `/habit-tracker`

### ✨ Fonctionnalités

- **⚡ Ultra-rapide** : Ajoute une habitude en 2 secondes (juste le nom, tout le reste est optionnel)
- **📅 Vue Calendrier** : Visualise ta semaine d'un coup d'œil
- **🔥 Streaks** : Suis tes séries de jours consécutifs
- **🔔 Rappels intelligents** : Notifications navigateur pour ne jamais oublier
- **🎉 Gamification** : Confettis et célébrations quand tu complètes tes habitudes
- **📊 Statistiques** : Taux de succès, meilleurs streaks, progression
- **📱 PWA** : Installable sur mobile comme une vraie app
- **🌙 Mode sombre** : Design moderne et élégant

### 🚀 Comment utiliser

1. **Ouvre** [https://memoire-20adc.web.app](https://memoire-20adc.web.app) (ALIBI Pro)
2. **Ajoute** tes habitudes avec catégories et fréquences personnalisées
3. **Coche** chaque jour quand c'est fait
4. **Célèbre** tes streaks ! 🎊

---

## 🎯 ALIBI Pro - Habit Tracker Avancé

> **Pour ceux qui veulent un suivi complet et personnalisé. Transforme tes intentions en habitudes.**

### 🌐 [Accéder à ALIBI Pro →](https://memoire-20adc.web.app)

### ✨ Nouvelles Fonctionnalités

- **📂 Catégories** : Organise tes habitudes (Spirituel, Santé, Apprentissage, Tâches, Travail, Projets, Loisirs)
- **🔄 Fréquences Flexibles** :
  - Tous les jours
  - X fois par semaine (ex: 3x/semaine)
  - Jours spécifiques (ex: Lundi, Mercredi, Vendredi)
  - Tous les X jours (ex: tous les 2 jours)
  - Toutes les X semaines (ex: toutes les 2 semaines)
  - Mensuel
- **🎯 Options au Choix** : Pour les habitudes avec plusieurs alternatives
  - Ex: "Lire un livre" → Choix entre "La confiance en soi" ou "Believe it to achieve it"
  - Possibilité d'ajouter de nouvelles options à la volée
- **📊 Navigation par Onglets** :
  - **Aujourd'hui** : Vue principale de suivi quotidien
  - **Habitudes** : Gestion complète de toutes tes habitudes
  - **Stats** : Statistiques détaillées par catégorie et par semaine
  - **Ajouter** : Formulaire de création enrichi

### 🎨 Workflow de Complétion

Quand tu complètes une habitude avec options :
1. Clique sur l'habitude
2. Un modal s'affiche avec les options disponibles
3. Sélectionne l'option choisie (ou crée une nouvelle)
4. Valide et célèbre ! 🎉

---

## 📊 Dashboard de Suivi de Projet v3.0

Ce projet fournit un tableau de bord interactif et personnalisable pour suivre l'avancement de n'importe quel projet de soutenance, mémoire ou projet complexe.

### 📁 Disponible en local dans `/dashboard`

### ✨ Fonctionnalités

- **📊 Dashboard Interactif** : Visualisez la progression par phase, le statut des livrables et une timeline Gantt.
- **📝 Basé sur Markdown** : Définissez tout votre planning dans un fichier `planning.md` simple et lisible.
- **🔥 Intégration Firebase** : Données en temps réel synchronisées avec Firestore.
- **⚙️ Automatisation Complète** : Scripts pour générer, importer et exporter les données.
- **🎨 Personnalisable** : Adaptez facilement le style et la logique à vos besoins.

---

## 🏗️ Architecture

```
/
├── habit-tracker/          # 🎯 ALIBI - Application simple
│   ├── index.html          # Interface utilisateur
│   ├── script.js           # Logique (Firebase, streaks, notifications)
│   ├── styles.css          # Design dark mode
│   ├── sw.js               # Service Worker (PWA)
│   └── manifest.json       # Configuration PWA
│
├── habit-tracker-plus/     # 🎯 ALIBI Pro - Version avancée
│   ├── index.html          # Interface avec onglets
│   ├── script.js           # Logique avancée (fréquences, options, catégories)
│   ├── styles.css          # Design Pro
│   ├── sw.js               # Service Worker
│   └── manifest.json       # Configuration PWA
│
├── dashboard/              # 📊 Dashboard de suivi de projet
│   ├── index.html          # Structure HTML
│   ├── script.js           # Logique du dashboard
│   └── styles.css          # Styles
│
├── populate_firestore.py   # Script Python pour convertir Markdown → JSON
├── import_data.js          # Script Node.js pour importer dans Firestore
├── export_simple.js        # Script pour exporter les données
├── delete_old_data.js      # Script pour nettoyer la base
├── firebase.json           # Configuration Firebase Hosting
├── package.json            # Dépendances Node.js
└── requirements.txt        # Dépendances Python
```

---

## 🚀 Guide de Démarrage Rapide

### Étape 1 : Prérequis

- **Node.js** (v16 ou supérieur)
- **Python** (v3.8 ou supérieur)
- Un compte **Google** pour utiliser Firebase

### Étape 2 : Installation

1. **Clonez le projet :**
   ```bash
   git clone https://github.com/votre-username/votre-repo.git
   cd votre-repo
   ```

2. **Installez les dépendances :**
   ```bash
   npm run install-deps
   ```

### Étape 3 : Configuration de Firebase

1. Créez un projet Firebase sur la [console Firebase](https://console.firebase.google.com/).
2. Créez une base Firestore en mode **Test**.
3. Générez une clé de service et renommez-la `serviceAccountKey.json`.
4. Copiez la configuration Firebase dans les fichiers `script.js`.

### Étape 4 : Test et Déploiement

```bash
# Test local
npm run dev

# Déploiement
npm run deploy
```

---

## 🛠️ Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run setup` | Installe les dépendances Node.js |
| `npm run generate-data` | Convertit `planning2.md` en JSON |
| `npm run import` | Importe les données dans Firestore |
| `npm run export` | Exporte les données Firestore |
| `npm run clean` | Supprime les données Firestore |
| `npm run dev` | Lance le serveur local |
| `npm run deploy` | Déploie sur Firebase Hosting |

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir des issues pour signaler des bugs ou proposer des améliorations
- Soumettre des pull requests
- Partager vos adaptations du projet

## 🙏 Remerciements

- **Firebase** pour l'infrastructure backend
- **Chart.js** pour les visualisations
- **La communauté open source** pour l'inspiration

---

**Développé avec ❤️ pour la communauté**
