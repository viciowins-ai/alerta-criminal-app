import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./firebase-blueprint.json', 'utf8'));
// We can't use firebase-blueprint directly, it doesn't have credentials.
