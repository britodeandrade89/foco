
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
  if (analyticsInstance) return analyticsInstance;
  
  try {
    const supported = await isAnalyticsSupported();
    if (supported) {
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch (err) {
    console.warn("Analytics failed to init:", err);
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
      
      onMessage(messagingInstance, (payload) => {
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'FOCO', {
            body: payload.notification?.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
          });
        }
      });
      
      return messagingInstance;
    }
  } catch (err) {
    console.warn("Messaging not supported:", err);
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = await getSafeMessaging();
      if (messaging) {
        await getToken(messaging, {
          vapidKey: 'BLe-R-p-Lh-8mK3_yQ-uP-B6_tY-Y-Y-Y-Y-Y-Y-Y'
        });
      }
    }
    return permission === 'granted';
  } catch (err) {
    console.error('Permission request failed:', err);
    return false;
  }
};

export { app };
