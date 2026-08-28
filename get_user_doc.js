import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const q = query(collection(db, "users"), where("email", "==", "viciowins@gmail.com"));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data());
  });
  process.exit(0);
}
run().catch(console.error);
