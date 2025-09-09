import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase - Variables de entorno
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener servicios
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configuración de la aplicación
export const APP_ID = "nutri-app";

// Estructura de datos de Firestore - CORREGIDA
export const COLLECTIONS = {
  USERS: 'users',           // Cambiado de 'artifacts' a 'users'
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments'
} as const;

// Tipos de datos para TypeScript
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  goals: {
    targetWeight: number;
    targetBodyFat: number;
  };
  notes: Array<{
    date: Date;
    text: string;
  }>;
  weightHistory: Array<{
    date: Date;
    weight: number;
  }>;
  bodyMetrics: Array<{
    date: Date;
    bmi?: number; // Mantener para compatibilidad con datos antiguos
    imc?: number; // Nuevo campo IMC en español
    bodyFat?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: Date;
  time: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
