import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const qSOS = query(collection(db, 'emergencyAlerts'), where('status', '==', 'active'));
    const sosSnap = await getDocs(qSOS);
    console.log('emergencyAlerts active count:', sosSnap.size);
  } catch (e) {
    console.error(e);
  }
}
test();
