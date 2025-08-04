// Script mis à jour pour exporter les données depuis la nouvelle structure Firestore multi-collection.
const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'memoire-20adc';
const COLLECTIONS = ['phases', 'weeks', 'deliverables', 'chapters'];

/**
 * Effectue une requête GET vers l'API REST de Firestore.
 * @param {string} url - L'URL à appeler.
 * @returns {Promise<object>} - La réponse JSON de l'API.
 */
function makeFirestoreRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Échec de la requête, statut: ${res.statusCode}`));
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error(`Erreur de parsing JSON: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`Erreur réseau: ${error.message}`));
        });
    });
}

/**
 * Convertit une valeur Firestore (ex: { stringValue: 'hello' }) en valeur JS native.
 * @param {object} firestoreValue - L'objet valeur de Firestore.
 * @returns {any} - La valeur JavaScript native.
 */
function processFirestoreValue(firestoreValue) {
    if (!firestoreValue) return null;
    if (firestoreValue.stringValue !== undefined) return firestoreValue.stringValue;
    if (firestoreValue.integerValue !== undefined) return parseInt(firestoreValue.integerValue, 10);
    if (firestoreValue.doubleValue !== undefined) return parseFloat(firestoreValue.doubleValue);
    if (firestoreValue.booleanValue !== undefined) return firestoreValue.booleanValue;
    if (firestoreValue.nullValue !== undefined) return null;
    if (firestoreValue.mapValue && firestoreValue.mapValue.fields) {
        const obj = {};
        for (const [key, val] of Object.entries(firestoreValue.mapValue.fields)) {
            obj[key] = processFirestoreValue(val);
        }
        return obj;
    }
    if (firestoreValue.arrayValue && firestoreValue.arrayValue.values) {
        return firestoreValue.arrayValue.values.map(item => processFirestoreValue(item));
    }
    return firestoreValue; // Fallback pour les types non gérés
}

/**
 * Convertit un document Firestore complet en un objet JavaScript simple.
 * @param {object} doc - Le document Firestore.
 * @returns {object} - L'objet JavaScript simplifié.
 */
function processFirestoreDoc(doc) {
    if (!doc || !doc.fields) return null;
    const processed = { id: doc.name.split('/').pop() };
    for (const [fieldName, fieldValue] of Object.entries(doc.fields)) {
        processed[fieldName] = processFirestoreValue(fieldValue);
    }
    return processed;
}

/**
 * Fonction principale pour exporter toutes les données du projet.
 */
async function exportProjectData() {
    try {
        console.log(`🚀 Démarrage de l'export pour les collections : ${COLLECTIONS.join(', ')}...`);

        const promises = COLLECTIONS.map(collectionName => {
            const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}`;
            console.log(`🔗 Préparation de la requête pour : ${url}`);
            return makeFirestoreRequest(url);
        });

        const responses = await Promise.all(promises);
        console.log("\n📥 Toutes les réponses ont été reçues de Firestore. Traitement en cours...");

        const processedData = {};
        responses.forEach((response, index) => {
            const collectionName = COLLECTIONS[index];
            if (response.documents) {
                processedData[collectionName] = response.documents.map(processFirestoreDoc).filter(d => d);
                console.log(`   ✅ ${processedData[collectionName].length} documents traités pour la collection '${collectionName}'`);
            } else {
                processedData[collectionName] = [];
                console.log(`   ⚠️ Aucun document trouvé pour la collection '${collectionName}'`);
            }
        });

        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                source: 'Firestore REST API',
                projectId: PROJECT_ID,
                schema: 'multi-collection'
            },
            data: processedData
        };

        const outputFile = path.join(__dirname, 'firebase_data_export.json');
        fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2), 'utf8');

        console.log(`\n✅ Export terminé ! Données sauvegardées dans : ${outputFile}`);
        console.log("\n📊 Résumé de l'export :");
        for (const collectionName of COLLECTIONS) {
            const count = processedData[collectionName] ? processedData[collectionName].length : 0;
            console.log(`   - ${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}: ${count}`);
        }

    } catch (error) {
        console.error("\n❌ Erreur critique lors de l'export :", error.message);
        if (error.message.includes('403') || error.message.includes('401')) {
            console.error("💡 Conseil : Problème d'autorisation. Vérifiez les règles de sécurité de votre base de données Firestore. Pour l'API REST, elles doivent autoriser la lecture publique ou vous devez utiliser une clé d'API authentifiée.");
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
            console.error("💡 Conseil : Problème de réseau. Vérifiez votre connexion internet et que le nom du projet Firestore est correct.");
        }
    }
}

// Lancer l'export
exportProjectData();