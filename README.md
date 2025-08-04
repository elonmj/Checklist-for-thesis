# 🚀 Dashboard de Suivi de Projet v3.0

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)

Ce projet fournit un tableau de bord interactif et personnalisable pour suivre l'avancement de n'importe quel projet de soutenance, mémoire ou projet complexe. Il est conçu pour être facilement adaptable, en se basant sur un simple fichier Markdown pour définir le planning.

![Aperçu du Dashboard](https://user-images.githubusercontent.com/12345/screenshot.png) <!-- Remplacez par une vraie capture d'écran -->

## ✨ Fonctionnalités

- **📊 Dashboard Interactif** : Visualisez la progression par phase, le statut des livrables et une timeline Gantt.
- **📝 Basé sur Markdown** : Définissez tout votre planning dans un fichier `planning.md` simple et lisible.
- **🔥 Intégration Firebase** : Données en temps réel synchronisées avec Firestore.
- **⚙️ Automatisation Complète** : Scripts pour générer, importer et exporter les données.
- **🎨 Personnalisable** : Adaptez facilement le style et la logique à vos besoins.

## 🏗️ Architecture

Le projet est structuré pour une séparation claire des responsabilités :

```
/
├── dashboard/              # Contient l'application web du tableau de bord
│   ├── index.html          # Structure HTML
│   ├── script.js           # Logique du dashboard (connexion Firebase, rendu)
│   └── styles.css          # Styles du dashboard
├── populate_firestore.py   # Script Python pour convertir le Markdown en JSON
├── import_data.js          # Script Node.js pour importer les données dans Firestore
├── export_simple.js        # Script Node.js pour exporter les données
├── delete_old_data.js      # Script Node.js pour nettoyer la base de données
├── planning2.md            # Fichier source pour définir le planning de votre projet
├── serviceAccountKey.json  # Clé de service Firebase (à remplacer)
├── package.json            # Dépendances et scripts Node.js
└── requirements.txt        # Dépendances Python
```

## 🚀 Guide de Démarrage Rapide

Suivez ces étapes pour lancer votre propre dashboard en moins de 10 minutes.

### Étape 1 : Prérequis

- **Node.js** (v16 ou supérieur)
- **Python** (v3.8 ou supérieur)
- Un compte **Google** pour utiliser Firebase

### Étape 2 : Installation

1.  **Clonez le projet :**
    ```bash
    git clone https://github.com/votre-username/votre-repo.git
    cd votre-repo
    ```

2.  **Installez les dépendances Node.js et Python :**
    ```bash
    npm run install-deps
    ```

### Étape 3 : Configuration de Firebase

1.  **Créez un projet Firebase** sur la [console Firebase](https://console.firebase.google.com/).
2.  Dans votre projet, allez dans **Firestore Database** et créez une base de données en mode **Test**.
3.  Dans les paramètres de votre projet (⚙️ -> Paramètres du projet), allez dans l'onglet **Comptes de service**.
4.  Cliquez sur **"Générer une nouvelle clé privée"**. Un fichier `.json` sera téléchargé.
5.  **Renommez ce fichier** en `serviceAccountKey.json` et placez-le à la racine de ce projet.
6.  Toujours dans les paramètres, allez à l'onglet **Général**. Sous "Vos applications", créez une nouvelle **application Web** (icône `</>`).
7.  Copiez l'objet de configuration `firebaseConfig` et collez-le dans le fichier `dashboard/script.js` en remplaçant la configuration existante.

### Étape 4 : Personnalisez votre Planning

1.  Ouvrez le fichier `planning2.md` (qui sera renommé en `planning.md` automatiquement).
2.  Modifiez les phases, les semaines et les livrables pour correspondre à votre propre projet. Le script est conçu pour être flexible et s'adapte au format Markdown structuré.

### Étape 5 : Test et Déploiement

1.  **Générez les données** à partir de votre fichier `planning2.md` :
    ```bash
    npm run generate-data
    ```
    *(Cela exécute `populate_firestore.py` et crée `new_firebase_data.json`)*

2.  **Importez les données** dans Firestore :
    ```bash
    npm run import
    ```
    *(Cela exécute `import_data.js`)*

3.  **Testez en local** :
    Pour lancer un serveur de développement qui se met à jour en direct, utilisez :
    ```bash
    npm run dev
    ```
    Ouvrez l'URL affichée (généralement `http://localhost:5000`).

4.  **Déployez sur le web :**
    Une fois que tout fonctionne en local, déployez votre site sur Firebase Hosting :
    ```bash
    npm run deploy
    ```

> **Note sur Firebase Tools :**
> Les commandes `dev` et `deploy` utilisent l'interface de ligne de commande de Firebase. Si vous ne l'avez jamais utilisée, vous devrez l'installer et vous connecter :
> ```bash
> # Installation globale
> npm install -g firebase-tools
> 
> # Connexion à votre compte Google
> firebase login
> ```

## 🛠️ Scripts Disponibles

- `npm run setup`: Installe les dépendances Node.js.
- `npm run generate-data`: Convertit `planning2.md` en `new_firebase_data.json`.
- `npm run import`: Importe les données JSON dans Firestore.
- `npm run export`: Exporte les données de Firestore vers un fichier JSON.
- `npm run clean`: Supprime toutes les données des collections dans Firestore.
- `npm run dev`: Lance un serveur local pour le développement.
- `npm run deploy`: Déploie le dashboard sur Firebase Hosting.

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

**Développé avec ❤️ pour la communauté étudiante**
