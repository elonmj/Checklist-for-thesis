@echo off
REM Script d'initialisation Git pour le projet Dashboard de Suivi
REM Ce script configure proprement le dépôt Git avec des commits structurés

echo 🚀 Initialisation du dépôt Git pour le projet Dashboard de Suivi...

REM 1. Initialiser le dépôt Git
echo 📁 Initialisation du dépôt Git...
git init

REM 2. Ajouter la remote origin
echo 🔗 Configuration de la remote origin...
REM set /p REPO_URL="Entrez l'URL de votre dépôt GitHub (ex: https://github.com/username/repo.git): "
set REPO_URL=https://github.com/elonmj/Checklist-for-thesis.git
git remote add origin "%REPO_URL%"

REM 3. Configurer la branche principale
echo 🌿 Configuration de la branche principale...
git branch -M main

REM 4. Commits structurés
echo 📝 Ajout des fichiers et création des commits...

REM Commit 1: Documentation
git add README.md requirements.txt .gitignore
git commit -m "📚 docs: Add comprehensive README and project documentation" -m "" -m "- Add detailed setup guide with step-by-step instructions" -m "- Include Firebase configuration guide" -m "- Document all npm scripts and their usage" -m "- Add requirements.txt for Python dependencies" -m "- Configure .gitignore for Firebase and Node.js projects"

REM Commit 2: Configuration et scripts de build
git add package.json firebase.json .firebaserc
git commit -m "⚙️ config: Add project configuration and build setup" -m "" -m "- Configure package.json with all necessary scripts" -m "- Set up Firebase hosting configuration" -m "- Add Firebase project configuration" -m "- Include scripts for data generation, import, export, and deployment"

REM Commit 3: Scripts Python pour traitement des données
git add populate_firestore.py import_data.js export_simple.js delete_old_data.js
git commit -m "🐍 feat: Add data processing and Firebase integration scripts" -m "" -m "- Add populate_firestore.py for Markdown to JSON conversion" -m "- Implement import_data.js for Firestore data import with batching" -m "- Create export_simple.js for data export from Firestore" -m "- Add delete_old_data.js for database cleanup" -m "- Support for phases, weeks, deliverables, and chapters collections"

REM Commit 4: Planning et données sources
git add planning2.md plan2.md new_firebase_data.json
git commit -m "📅 feat: Add project planning and structured data" -m "" -m "- Add comprehensive project timeline in planning2.md" -m "- Include detailed thesis plan in plan2.md" -m "- Provide generated JSON data structure" -m "- Support for 3 phases, 10 weeks, 20 deliverables, 8 chapters"

REM Commit 5: Interface utilisateur Dashboard
git add dashboard/
git commit -m "🎨 feat: Add interactive dashboard interface" -m "" -m "- Create modern responsive dashboard with Chart.js integration" -m "- Implement real-time Firebase connection for live updates" -m "- Add 4 main views: Overview, Planning, Deliverables, Gantt" -m "- Support for automatic status calculation based on dates" -m "- Include interactive deliverable completion tracking" -m "- Modern CSS design with CSS variables and professional styling"

REM Commit 6: Améliorations et corrections
if exist "firebase_data_export.json" git add firebase_data_export.json
git add -A
git commit -m "🔧 fix: Various improvements and bug fixes" -m "" -m "- Fix date parsing for French date formats in Gantt chart" -m "- Update current date handling for accurate status calculation" -m "- Improve error handling and logging" -m "- Add comprehensive testing of all npm scripts" -m "- Update documentation with corrected file references"

echo ✅ Dépôt Git initialisé avec succès !
echo 📤 Pour pousser vers GitHub, exécutez:
echo git push -u origin main

pause
