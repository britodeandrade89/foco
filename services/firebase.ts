
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Configuração do Firebase atualizada com a nova chave API
const firebaseConfig = {
  apiKey: "AIzaSyCJ9K6sovkNzeO_fuQbSPD9LnIUG0p8Da4",
  authDomain: "chaveunica-225e0.firebaseapp.com",
  projectId: "chaveunica-225e0",
  storageBucket: "chaveunica-225e0.firebasestorage.app",
  messagingSenderId: "324211037832",
  appId: "1:324211037832:web:362a46e6446ea37b85b13d",
  measurementId: "G-MRBDJC3QXZ"
};

// Inicializa o Firebase Core
const app = initializeApp(firebaseConfig);

// Inicializa o Analytics de forma segura e assíncrona
// Exportamos uma promessa para o analytics caso outros componentes precisem esperar
export const analyticsPromise = isSupported().then(supported => {
  if (supported && typeof window !== 'undefined') {
    return getAnalytics(app);
  }
  return null;
}).catch(err => {
  console.error("Firebase Analytics não suportado neste ambiente:", err);
  return null;
});

export { app };
