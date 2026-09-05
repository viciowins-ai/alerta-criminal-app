import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addGroup() {
    try {
        await addDoc(collection(db, 'groups'), {
            name: "test",
            inviteCode: "test",
            createdBy: "test",
            members: ["test"],
            createdAt: new Date()
        });
        console.log("Success");
    } catch(e) {
        console.log(e);
    }
}
addGroup();
