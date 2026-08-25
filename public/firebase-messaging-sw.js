importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "gen-lang-client-0610431562",
  appId: "1:555679265362:web:0fc6c5eb216742df31a58b",
  apiKey: "AIzaSyD9yQNXpvcc0W6oDCP2WU0y0E4D0WwYX0g",
  authDomain: "gen-lang-client-0610431562.firebaseapp.com",
  storageBucket: "gen-lang-client-0610431562.firebasestorage.app",
  messagingSenderId: "555679265362"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Alerta Criminal';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova notificação.',
    icon: '/icon-192-v2.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
