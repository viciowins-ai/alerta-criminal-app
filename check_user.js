import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  try {
    const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', 'viciowins@gmail.com')));
    console.log(`Found ${usersSnap.size} users.`);
    usersSnap.forEach(doc => {
      console.log('User:', doc.id);
      console.log('Data:', doc.data());
    });
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
check();
