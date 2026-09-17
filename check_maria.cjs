const admin = require('firebase-admin');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.projectId, 
    });
}

async function run() {
    const db = admin.firestore();
    const users = await db.collection('users').get();
    users.forEach(doc => {
        if (doc.data().name.includes('Maria')) {
            console.log(doc.id, '=>', doc.data());
        }
    });
}
run();
