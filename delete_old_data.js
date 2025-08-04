
const admin = require('firebase-admin');
const path = require('path');

// --- Configuration ---
const SERVICE_ACCOUNT_KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');
const COLLECTION_TO_DELETE = 'project_data';

// --- Initialize Firebase Admin SDK ---
try {
    const serviceAccount = require(SERVICE_ACCOUNT_KEY_PATH);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔑 Firebase Admin SDK initialisé.");
} catch (error) {
    console.error("❌ Erreur: Impossible d'initialiser le SDK Firebase Admin.");
    console.error(`   Vérifiez que le fichier '${path.basename(SERVICE_ACCOUNT_KEY_PATH)}' existe.`);
    process.exit(1);
}

const db = admin.firestore();

/**
 * Supprime tous les documents d'une collection donnée par lots.
 * @param {string} collectionPath - Le chemin de la collection à vider.
 */
async function deleteCollection(collectionPath) {
    const collectionRef = db.collection(collectionPath);
    const batchSize = 250;

    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve, reject);
    });
}

async function deleteQueryBatch(query, resolve, reject) {
    try {
        const snapshot = await query.get();

        if (snapshot.size === 0) {
            return resolve(); // Fin de la suppression
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Répéter pour le lot suivant
        process.nextTick(() => {
            deleteQueryBatch(query, resolve, reject);
        });
    } catch (error) {
        reject(error);
    }
}

/**
 * Fonction principale pour lancer la suppression.
 */
async function runDelete() {
    try {
        console.log(`
🗑️  Vérification de l'ancienne collection : '${COLLECTION_TO_DELETE}'...`);
        const collectionRef = db.collection(COLLECTION_TO_DELETE);
        const docs = await collectionRef.limit(1).get();

        if (docs.empty) {
            console.log(`👍 La collection '${COLLECTION_TO_DELETE}' est déjà vide ou n'existe pas.`);
            return;
        }

        console.log(`   Ancienne collection trouvée. Lancement de la suppression...`);
        await deleteCollection(COLLECTION_TO_DELETE);
        console.log(`✅ L'ancienne collection '${COLLECTION_TO_DELETE}' a été supprimée avec succès.`);

    } catch (error) {
        console.error(`
❌ Une erreur est survenue lors de la suppression :`, error);
    }
}

runDelete();
