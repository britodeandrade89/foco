import { initializeApp, getApp, getApps } from "firebase/app";

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
// Se falhar (erro 403, config inválida), app permanece null e o resto do sistema ignora o Firebase
let app: any = null;
try {
  if (typeof window !== 'undefined') {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
} catch (e) {
  console.warn("Firebase Init Failed (Ignored):", e);
  app = null;
}

// Funções de exportação seguras que retornam null imediatamente
// Isso resolve o erro "Installations: Create Installation request failed with error 403"
export const getSafeAnalytics = async () => {
  return null;
};

export const getSafeMessaging = async () => {
  return null;
};

export const requestNotificationPermission = async () => {
  return false;
};

export { app };