// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBN8ljkIhZ9hRRF1C0_3jsTR3XiooTkbTM",
  authDomain: "contabilidad-22a49.firebaseapp.com",
  projectId: "contabilidad-22a49",
  storageBucket: "contabilidad-22a49.firebasestorage.app",
  messagingSenderId: "305798624345",
  appId: "1:305798624345:web:e14045229b244190c46d48"
};

// Inicializar Firebase - ESTO ES OBLIGATORIO
firebase.initializeApp(firebaseConfig);

// Crear referencias
const auth = firebase.auth();
const db = firebase.firestore();

// Verificar que se inicializó correctamente (para debug)
console.log('✅ Firebase inicializado correctamente');
console.log('Auth:', auth);
console.log('DB:', db);