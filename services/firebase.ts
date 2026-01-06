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

// Inicialização segura e silenciosa do app
let app: any = null;
try {
  if (typeof window !== 'undefined') {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
} catch (e) {
  // Catch silencioso para não quebrar o app
}

let analyticsInstance: any = null;
let messagingInstance: any = null;

export const getSafeAnalytics = async () => {
  if (!app || typeof window === 'undefined') return null;
  
  try {
    const supported = await isAnalyticsSupported().catch(() => false);
    if (supported) {
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch (err) {
    // Retorna null silenciosamente se falhar
    return null;
  }
  return null;
};

export const getSafeMessaging = async () => {
  if (!app || typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;
  
  try {
    const supported = await isMessagingSupported().catch(() => false);
    if (supported) {
      messagingInstance = getMessaging(app);
      
      onMessage(messagingInstance, (payload) => {
        console.log('Message:', payload);
        if (Notification.permission === 'granted') {
          try {
            new Notification(payload.notification?.title || 'FOCO', {
              body: payload.notification?.body,
              icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
            });
          } catch (e) {}
        }
      });
      
      return messagingInstance;
    }
  } catch (err) {
    return null;
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
        try {
          const token = await getToken(messaging, {
            vapidKey: 'BCS_8X5Y3X_jW_X_X_X_X_X_X_X_X_X_X_X_X_X' 
          });
          if (token) console.log('Token OK');
        } catch (tokenErr) {
          // Token falhou (normal se não configurado)
        }
      }
    }
    return permission === 'granted';
  } catch (err) {
    return false;
  }
};

export { app };