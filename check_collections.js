import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    const postsSnap = await getDocs(collection(db, 'posts'));
    console.log(`Found ${postsSnap.size} posts in 'posts' collection.`);
    postsSnap.forEach(doc => console.log(' - Post:', doc.id));

    const reportsSnap = await getDocs(collection(db, 'reports'));
    console.log(`Found ${reportsSnap.size} reports in 'reports' collection.`);
    reportsSnap.forEach(doc => console.log(' - Report:', doc.id));
  } catch (err) {
    console.error("Error querying collections:", err);
  }
  process.exit(0);
}
check();
