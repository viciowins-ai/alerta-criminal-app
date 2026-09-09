import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./firebase-blueprint.json', 'utf8'));
const app = initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore(app);

async function test() {
  const users = await db.collection('users').get();
  console.log('Users:', users.size);
}
test();
