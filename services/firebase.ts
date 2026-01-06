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

// Inicialização segura do app
let app: any;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn("Falha ao inicializar Firebase App (Ignorando):", e);
}

let analyticsInstance: any = null;
let messagingInstance: any = null;

export const getSafeAnalytics = async () => {
  if (typeof window === 'undefined' || !app) return null;
  try {
    const supported = await isAnalyticsSupported();
    if (supported) {
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch (err) {
    // Silencia erros de permissão/configuração para não poluir o console ou travar o app
    console.debug("Analytics ignorado (possível bloqueio de API ou AdBlock):", err);
  }
  return null;
};

export const getSafeMessaging = async () => {
  if (typeof window === 'undefined' || !app) return null;
  if (messagingInstance) return messagingInstance;
  
  try {
    const supported = await isMessagingSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      
      onMessage(messagingInstance, (payload) => {
        console.log('Message received:', payload);
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
    console.debug("Messaging ignorado (possível erro de API ou suporte):", err);
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = await getSafeMessaging();
      if (messaging) {
        try {
          // Tenta pegar o token, mas silencia falhas de API (403)
          const token = await getToken(messaging, {
            vapidKey: 'BCS_8X5Y3X_jW_X_X_X_X_X_X_X_X_X_X_X_X_X' 
          });
          console.log('Push Token:', token);
        } catch (tokenErr) {
          // Erro esperado se a API não estiver habilitada no console
          console.debug('Push Token não gerado (API desabilitada ou erro de rede):', tokenErr);
        }
      }
    }
    return permission === 'granted';
  } catch (err) {
    console.debug('Erro na solicitação de permissão:', err);
    return false;
  }
};

export { app };