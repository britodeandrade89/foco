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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let analyticsInstance: any = null;
let messagingInstance: any = null;

export const getSafeAnalytics = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const supported = await isAnalyticsSupported();
    if (supported) {
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch (err) {
    console.warn("Analytics not supported:", err);
  }
  return null;
};

export const getSafeMessaging = async () => {
  if (typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;
  
  try {
    const supported = await isMessagingSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      
      // Setup foreground messaging immediately upon safe acquisition
      onMessage(messagingInstance, (payload) => {
        console.log('Message received in foreground: ', payload);
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'FOCO', {
            body: payload.notification?.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
          });
        }
      });
      
      return messagingInstance;
    } else {
      return null;
    }
  } catch (err) {
    console.warn("Messaging not supported or failed to init:", err);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = await getSafeMessaging();
      if (messaging) {
        // VAPID Key: Substitua pela chave real do seu console Firebase Cloud Messaging se necessário.
        try {
          const token = await getToken(messaging, {
            vapidKey: 'BCS_8X5Y3X_jW_X_X_X_X_X_X_X_X_X_X_X_X_X' 
          });
          console.log('Push Token gerado:', token);
        } catch (tokenErr) {
          console.warn('Erro ao obter token Push (possível VAPID inválida):', tokenErr);
        }
      }
    }
    return permission === 'granted';
  } catch (err) {
    console.error('Permission request failed:', err);
    return false;
  }
};

export { app };