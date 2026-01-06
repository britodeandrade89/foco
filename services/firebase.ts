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

// Singleton pattern for Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Safely initialize Analytics
 */
export const getSafeAnalytics = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const supported = await isAnalyticsSupported();
    if (supported) return getAnalytics(app);
  } catch (err) {
    // Silencia erros de analytics para não poluir o console do usuário
  }
  return null;
};

/**
 * Safely initialize Messaging
 */
export const getSafeMessaging = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const supported = await isMessagingSupported();
    if (supported) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        console.log('Foreground message:', payload);
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'FOCO', {
            body: payload.notification?.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
          });
        }
      });
      return messaging;
    }
  } catch (err) {
    // Messaging não suportado ou bloqueado
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
            vapidKey: 'BLe-R-p-Lh-8mK3_yQ-uP-B6_tY-Y-Y-Y-Y-Y-Y-Y'
          });
          console.log('FCM Token:', token);
        } catch (tokenErr: any) {
          // Trata especificamente o erro 403 PERMISSION_DENIED da API de Installations
          const isInstallError = tokenErr.message?.includes('403') || 
                                 tokenErr.code?.includes('installations') || 
                                 tokenErr.message?.includes('PERMISSION_DENIED');
                                 
          if (isInstallError) {
            console.warn(
              '⚠️ FOCO: Para ativar as notificações push, você precisa habilitar a "Firebase Installations API" no console do Google Cloud para o projeto: ' + firebaseConfig.projectId + 
              '. Acesse: https://console.developers.google.com/apis/api/firebaseinstallations.googleapis.com/overview?project=' + firebaseConfig.projectId
            );
          } else {
            console.error('FCM Token error:', tokenErr);
          }
        }
      }
      return true;
    }
  } catch (err) {
    console.error('Permission request error:', err);
  }
  return false;
};

export { app };