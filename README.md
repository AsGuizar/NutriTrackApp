# 🥗 NutriTrack - Sistema de Gestión para Nutricionistas

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-ffca28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38bdf8?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🎯 Descripción

**NutriTrack** es una aplicación web diseñada para nutricionistas profesionales. Permite gestionar pacientes, dar seguimiento a su progreso nutricional, programar citas y visualizar métricas en tiempo real.

## ✨ Características Principales

### 🔐 Autenticación y Seguridad
* Sistema de login seguro con Firebase Authentication
* Protección de rutas y datos de usuario
* Cada nutricionista accede únicamente a sus pacientes

### 👥 Gestión de Pacientes
* **Dashboard principal** con vista general de pacientes
* **Alta de pacientes** con información completa (nombre, edad, género, altura, peso inicial)
* **Perfil detallado** de cada paciente con pestañas de navegación
* **Búsqueda y filtrado** por nombre o email

### 📊 Analytics y Seguimiento
* **Gráficos de progreso** de peso con Recharts
* **Métricas corporales** (IMC, % grasa corporal)
* **Historial completo** de métricas
* **Cálculo automático** de progreso hacia objetivos
* **Sistema de notas** del nutricionista

### 📅 Gestión de Citas
* **Calendario mensual** interactivo
* **Crear, editar y eliminar** citas
* **Estados de citas** (programada, completada, cancelada)
* **Vinculación** con pacientes existentes

### 🎨 Interfaz de Usuario
* **Diseño moderno y responsive** con Tailwind CSS
* **Navegación intuitiva** entre vistas
* **Componentes reutilizables** y organizados
* **Experiencia optimizada** para profesionales

## 🛠️ Stack Tecnológico

### Frontend
* **React 18** con TypeScript
* **Tailwind CSS** para estilos
* **Plotly** para gráficos interactivos

### Backend (Firebase)
* **Firebase Authentication** - Autenticación segura
* **Firestore** - Base de datos NoSQL en tiempo real
* **Real-time listeners** - Actualizaciones instantáneas
* **Reglas de seguridad** configuradas

## 📁 Estructura del Proyecto

```
nutritrack/
├── public/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/           # Vistas principales
│   ├── config/          # Configuración Firebase
│   ├── hooks/           # Custom hooks
│   ├── types/           # TypeScript types
│   ├── utils/           # Funciones auxiliares
│   └── App.tsx
├── .env.local           # Variables de entorno (no incluir en git)
├── package.json
└── README.md
```

## 🚀 Instalación y Configuración

### 🔧 Requisitos Previos

* Node.js v18 o superior
* npm v9 o superior
* Cuenta de Firebase activa

### 1. Clonar el Repositorio

```bash
git clone https://github.com/AsGuizar/NutriTrackApp
cd NutriTrack
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Firebase

#### Paso a paso:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita **Authentication** con método Email/Password
3. Crea una base de datos **Firestore** en modo producción
4. Ve a la configuración del proyecto y copia las credenciales
5. Crea un archivo `.env.local` en la raíz del proyecto:

```env
REACT_APP_FIREBASE_API_KEY=tu_api_key_aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=tu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
```

6. Actualiza `src/config/firebase.ts` para usar las variables de entorno

#### Reglas de Firestore Recomendadas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /patients/{patientId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.nutritionistId;
    }
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.nutritionistId;
    }
  }
}
```

### 4. Ejecutar la Aplicación

#### Modo Desarrollo:
```bash
npm start
```
La aplicación se abrirá en [http://localhost:3000](http://localhost:3000)

#### Build para Producción:
```bash
npm run build
```

#### Ejecutar Tests:
```bash
npm test
```

## 🌐 Demo en Vivo

>  https://nutritrack-d6bd5.web.app

## 👨‍💻 Autor

**AsGuizar**
* GitHub: [@AsGuizar](https://github.com/AsGuizar)

## 🙏 Agradecimientos

* A todos los nutricionistas que inspiraron este proyecto
* La comunidad de React y Firebase por sus excelentes herramientas
* Todos los contribuidores que ayudan a mejorar NutriTrack

---

**Desarrollado con ❤️ para nutricionistas profesionales**

*Última actualización: Octubre 2025*
