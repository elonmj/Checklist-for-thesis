

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');
const DATA_TO_IMPORT_PATH = path.join(__dirname, 'new_firebase_data.json');

// --- Initialize Firebase Admin SDK ---
try {
    const serviceAccount = require(SERVICE_ACCOUNT_KEY_PATH);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔑 Firebase Admin SDK initialisé avec succès.");
} catch (error) {
    console.error("❌ Erreur critique: Impossible d'initialiser le SDK Firebase Admin.");
    console.error(`   Vérifiez que le fichier '${path.basename(SERVICE_ACCOUNT_KEY_PATH)}' existe et est correct.`);
    console.error(`   Erreur d'origine: ${error.message}`);
    process.exit(1); // Arrêter le script si l'initialisation échoue
}

const db = admin.firestore();

/**
 * Importe les données dans une collection Firestore en utilisant des batchs.
 * @param {string} collectionName - Le nom de la collection cible.
 * @param {Array<object>} data - Le tableau d'objets à importer.
 */
async function importCollection(collectionName, data) {
    if (!data || data.length === 0) {
        console.log(`⚪️ Aucune donnée à importer pour la collection '${collectionName}'.`);
        return;
    }

    console.log(`⏳ Démarrage de l'importation pour la collection '${collectionName}' (${data.length} documents)...`);
    const batchSize = 250; // Firestore limite les batchs à 500 opérations
    let batch = db.batch();
    let count = 0;

    for (const item of data) {
        // Utiliser l'ID spécifié dans le JSON comme ID de document
        const docId = item.id;
        if (!docId) {
            console.warn(`   ⚠️ Document ignoré dans '${collectionName}' car il n'a pas de champ 'id'.`);
            continue;
        }
        const docRef = db.collection(collectionName).doc(docId);
        batch.set(docRef, item);
        count++;

        if (count % batchSize === 0) {
            await batch.commit();
            console.log(`   ... ${count} documents importés.`);
            batch = db.batch(); // Démarrer un nouveau batch
        }
    }

    // Commit le dernier batch s'il reste des opérations
    if (count % batchSize !== 0) {
        await batch.commit();
    }

    console.log(`✅ Importation terminée pour la collection '${collectionName}'. ${count} documents ajoutés.`);
}

/**
 * Fonction principale pour lire le fichier JSON et lancer l'importation.
 */
async function runImport() {
    try {
        // 1. Lire et parser le fichier de données
        console.log(`
📖 Lecture du fichier de données : ${path.basename(DATA_TO_IMPORT_PATH)}`);
        const dataFile = fs.readFileSync(DATA_TO_IMPORT_PATH, 'utf8');
        const dataToImport = JSON.parse(dataFile);

        // 2. Lancer l'importation pour chaque collection définie dans le fichier
        for (const collectionName in dataToImport) {
            if (Object.prototype.hasOwnProperty.call(dataToImport, collectionName)) {
                await importCollection(collectionName, dataToImport[collectionName]);
            }
        }

        console.log("\n🎉 Toutes les données ont été importées avec succès !");

    } catch (error) {
        console.error("\n❌ Une erreur est survenue lors du processus d'importation :", error);
        if (error.code === 'ENOENT') {
            console.error(`   💡 Assurez-vous que le fichier '${path.basename(DATA_TO_IMPORT_PATH)}' existe.`);
        }
    }
}

// Lancer le script
runImport();

