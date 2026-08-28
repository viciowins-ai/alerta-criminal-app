const fs = require('fs');
const file = 'src/pages/AccountSettingsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';",
  "import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';"
);

const oldEffect = `  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || user.displayName || '');
          setPhone(data.phone || '');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users');
      }
    };
    fetchProfile();
  }, [user]);`;

const newEffect = `  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Only update state from DB if we are NOT currently editing, 
        // to prevent overwriting user input while they type.
        // Or better yet, we can update it if it's not editing.
        setName(prev => isEditing ? prev : (data.name || user.displayName || ''));
        setPhone(prev => isEditing ? prev : (data.phone || ''));
      }
    }, (err) => {
      console.error("Erro no onSnapshot:", err);
    });
    
    return () => unsubscribe();
  }, [user, isEditing]);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync(file, code);
