import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('mail').orderBy('delivery.startTime', 'desc').limit(5).get();
  console.log("Found recent:", snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data().to, doc.data().bcc, doc.data().delivery?.startTime?.toDate(), doc.data().message?.subject);
  });
}

check().catch(console.error);
