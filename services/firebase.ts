
import { initializeApp, getApp, getApps } from "firebase/app";
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

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Messaging setup as a lazy-load function to prevent "not registered" errors on startup
export const initFirebaseMessaging = async () => {
  if (typeof window === 'undefined') return null;
  
  const supported = await isMessagingSupported();
  if (supported) {
    const messaging = getMessaging(app);
    // Setup foreground message listener
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'FOCO', {
          body: payload.notification?.body,
          icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
        });
      }
    });
    return messaging;
  }
  return null;
};

// Analytics setup
export const initAnalytics = async () => {
  if (typeof window === 'undefined') return null;
  const supported = await isAnalyticsSupported();
  if (supported) {
    return getAnalytics(app);
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const supported = await isMessagingSupported();
    if (supported) {
      const messaging = getMessaging(app);
      try {
        const token = await getToken(messaging, {
          vapidKey: 'BLe-R-p-Lh-8mK3_yQ-uP-B6_tY-Y-Y-Y-Y-Y-Y-Y' // Placeholder VAPID
        });
        console.log('FCM Token:', token);
        return true;
      } catch (err) {
        console.error('Erro ao obter token FCM:', err);
        return true; 
      }
    }
  }
  return permission === 'granted';
};

export { app };
