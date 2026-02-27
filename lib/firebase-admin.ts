// lib/firebase-admin.ts
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App;
let adminAuth: Auth;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    // Firebase Admin SDK initialization
    // Option 1: Using service account JSON (recommended for local dev)
    // Option 2: Using environment variables (recommended for production)
    
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('⚠️  Firebase credentials not configured - Firebase auth will be disabled');
      console.log('   Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env.local');
      console.log('   Supabase integration will still work normally');
      return { app: null, adminAuth: null };
    }

    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.warn('⚠️  Firebase initialization failed:', error);
      console.log('   Continuing without Firebase - Supabase integration will still work');
      return { app: null, adminAuth: null };
    }
  }

  adminAuth = getAuth(app);
  return { app, adminAuth };
}

// Initialize on module load
const result = initializeFirebaseAdmin();
const auth = result?.adminAuth || null;
const firebaseApp = result?.app || null;

export { auth as adminAuth };
export default firebaseApp;
