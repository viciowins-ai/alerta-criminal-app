import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const reports = await db.collection('reports').orderBy('createdAt', 'desc').limit(5).get();
  reports.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}
run();
