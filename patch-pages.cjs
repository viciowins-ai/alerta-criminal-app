const fs = require('fs');

function patchFile(file, regex, replaceStr) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(regex, replaceStr);
    fs.writeFileSync(file, code);
  }
}

// TrustedContacts
patchFile(
  'src/pages/TrustedContactsPage.tsx',
  /await updateDoc\(docRef, { trustedContacts: updatedContacts }\);/g,
  "updateDoc(docRef, { trustedContacts: updatedContacts }).catch(e => console.error(e));"
);

patchFile(
  'src/pages/TrustedContactsPage.tsx',
  /await updateDoc\(docRef, { trustedContacts: updatedContacts }\);/g,
  "updateDoc(docRef, { trustedContacts: updatedContacts }).catch(e => console.error(e));"
);

// PrivacySettings
patchFile(
  'src/pages/PrivacySettingsPage.tsx',
  /await updateDoc\(docRef, { privacySettings: newSettings }\);/g,
  "updateDoc(docRef, { privacySettings: newSettings }).catch(e => console.error(e));"
);

// NotificationSettings
patchFile(
  'src/pages/NotificationSettingsPage.tsx',
  /await updateDoc\(docRef, { notificationSettings: newSettings }\);/g,
  "updateDoc(docRef, { notificationSettings: newSettings }).catch(e => console.error(e));"
);

