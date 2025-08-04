#!/bin/bash

# Script d'initialisation Git pour le projet Dashboard de Suivi
# Ce script configure proprement le dépôt Git avec des commits structurés

echo "🚀 Initialisation du dépôt Git pour le projet Dashboard de Suivi..."

# 1. Initialiser le dépôt Git
echo "📁 Initialisation du dépôt Git..."
git init

# 2. Ajouter la remote origin (remplacez par votre URL)
echo "🔗 Configuration de la remote origin..."
read -p "Entrez l'URL de votre dépôt GitHub (ex: https://github.com/username/repo.git): " REPO_URL
git remote add origin "$REPO_URL"

# 3. Configurer la branche principale
echo "🌿 Configuration de la branche principale..."
git branch -M main

# 4. Commits structurés
echo "📝 Ajout des fichiers et création des commits..."

# Commit 1: Documentation
git add README.md requirements.txt .gitignore
git commit -m "📚 docs: Add comprehensive README and project documentation

- Add detailed setup guide with step-by-step instructions
- Include Firebase configuration guide
- Document all npm scripts and their usage
- Add requirements.txt for Python dependencies
- Configure .gitignore for Firebase and Node.js projects"

# Commit 2: Configuration et scripts de build
git add package.json firebase.json .firebaserc
git commit -m "⚙️ config: Add project configuration and build setup

- Configure package.json with all necessary scripts
- Set up Firebase hosting configuration
- Add Firebase project configuration
- Include scripts for data generation, import, export, and deployment"

# Commit 3: Scripts Python pour traitement des données
git add populate_firestore.py import_data.js export_simple.js delete_old_data.js
git commit -m "🐍 feat: Add data processing and Firebase integration scripts

- Add populate_firestore.py for Markdown to JSON conversion
- Implement import_data.js for Firestore data import with batching
- Create export_simple.js for data export from Firestore
- Add delete_old_data.js for database cleanup
- Support for phases, weeks, deliverables, and chapters collections"

# Commit 4: Planning et données sources
git add planning2.md plan2.md new_firebase_data.json
git commit -m "📅 feat: Add project planning and structured data

- Add comprehensive project timeline in planning2.md
- Include detailed thesis plan in plan2.md  
- Provide generated JSON data structure
- Support for 3 phases, 10 weeks, 20 deliverables, 8 chapters"

# Commit 5: Interface utilisateur Dashboard
git add dashboard/
git commit -m "🎨 feat: Add interactive dashboard interface

- Create modern responsive dashboard with Chart.js integration
- Implement real-time Firebase connection for live updates
- Add 4 main views: Overview, Planning, Deliverables, Gantt
- Support for automatic status calculation based on dates
- Include interactive deliverable completion tracking
- Modern CSS design with CSS variables and professional styling"

# Commit 6: Améliorations et corrections
if [ -f "firebase_data_export.json" ]; then
    git add firebase_data_export.json
fi
git add -A  # Ajouter tous les autres fichiers modifiés
git commit -m "🔧 fix: Various improvements and bug fixes

- Fix date parsing for French date formats in Gantt chart
- Update current date handling for accurate status calculation
- Improve error handling and logging
- Add comprehensive testing of all npm scripts
- Update documentation with corrected file references"

echo "✅ Dépôt Git initialisé avec succès !"
echo "📤 Pour pousser vers GitHub, exécutez:"
echo "git push -u origin main"
