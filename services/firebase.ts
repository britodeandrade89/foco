
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCJ9K6sovkNzeO_fuQbSPD9LnIUG0p8Da4",
  authDomain: "chaveunica-225e0.firebaseapp.com",
  projectId: "chaveunica-225e0",
  storageBucket: "chaveunica-225e0.firebasestorage.app",
  messagingSenderId: "324211037832",
  appId: "1:324211037832:web:362a46e6446ea37b85b13d",
  measurementId: "G-MRBDJC3QXZ"
};

const app = initializeApp(firebaseConfig);

let analytics = null;
let messaging = null;

if (typeof window !== 'undefined') {
  // Analytics
  isAnalyticsSupported().then(supported => {
    if (supported) analytics = getAnalytics(app);
  });

  // Messaging
  isMessagingSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app);
      
      // Lidar com mensagens em primeiro plano
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'FOCO', {
            body: payload.notification?.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
          });
        }
      });
    }
  });
}

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted' && messaging) {
    try {
      const token = await getToken(messaging, {
        vapidKey: 'BLe-R-p-Lh-8mK3_yQ-uP-B6_tY-Y-Y-Y-Y-Y-Y-Y' // Placeholder VAPID, idealmente gerado no Firebase Console
      });
      console.log('FCM Token:', token);
      return true;
    } catch (err) {
      console.error('Erro ao obter token FCM:', err);
      return true; // Permissão dada, falha apenas no token
    }
  }
  return permission === 'granted';
};

export { app, analytics, messaging };
