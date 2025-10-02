🥗 NutriTrack - Sistema de Gestión para Nutricionistas
Mostrar imagen
Mostrar imagen
Mostrar imagen
Mostrar imagen
🎯 Descripción
NutriTrack es una aplicación web diseñada para nutricionistas profesionales. Permite gestionar pacientes, dar seguimiento a su progreso nutricional, programar citas y visualizar métricas en tiempo real.
📸 Capturas de Pantalla

🔜 Próximamente: Dashboard principal, Perfil de paciente, Calendario de citas

✨ Características Principales
🔐 Autenticación y Seguridad

Sistema de login seguro con Firebase Authentication
Protección de rutas y datos de usuario
Cada nutricionista accede únicamente a sus pacientes

👥 Gestión de Pacientes

Dashboard principal con vista general de pacientes
Alta de pacientes con información completa (nombre, edad, género, altura, peso inicial)
Perfil detallado de cada paciente con pestañas de navegación
Búsqueda y filtrado por nombre o email

📊 Analytics y Seguimiento

Gráficos de progreso de peso con Recharts
Métricas corporales (IMC, % grasa corporal)
Historial completo de métricas
Cálculo automático de progreso hacia objetivos
Sistema de notas del nutricionista

📅 Gestión de Citas

Calendario mensual interactivo
Crear, editar y eliminar citas
Estados de citas (programada, completada, cancelada)
Vinculación con pacientes existentes

🎨 Interfaz de Usuario

Diseño moderno y responsive con Tailwind CSS
Navegación intuitiva entre vistas
Componentes reutilizables y organizados
Experiencia optimizada para profesionales

🛠️ Stack Tecnológico
Frontend

React 18 con TypeScript
Tailwind CSS para estilos
Plotly para gráficos interactivos
Recharts para visualización de datos

Backend (Firebase)

Firebase Authentication - Autenticación segura
Firestore - Base de datos NoSQL en tiempo real
Real-time listeners - Actualizaciones instantáneas
Reglas de seguridad configuradas

📁 Estructura del Proyecto
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
🚀 Instalación y Configuración
🔧 Requisitos Previos

Node.js v18 o superior
npm v9 o superior
Cuenta de Firebase activa

1. Clonar el Repositorio
bashgit clone https://github.com/AsGuizar/NutriTrackApp
cd NutriTrack
2. Instalar Dependencias
bashnpm install
3. Configurar Firebase
Paso a paso:

Crea un proyecto en Firebase Console
Habilita Authentication con método Email/Password
Crea una base de datos Firestore en modo producción
Ve a la configuración del proyecto y copia las credenciales
Crea un archivo .env.local en la raíz del proyecto:

envREACT_APP_FIREBASE_API_KEY=tu_api_key_aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=tu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id

Actualiza src/config/firebase.ts para usar las variables de entorno

Reglas de Firestore Recomendadas:
javascriptrules_version = '2';
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
4. Ejecutar la Aplicación
Modo Desarrollo:
bashnpm start
La aplicación se abrirá en http://localhost:3000
Build para Producción:
bashnpm run build
Ejecutar Tests:
bashnpm test

🌐 Demo en Vivo
  https://nutritrack-d6bd5.web.app

👨‍💻 Autor
AsGuizar

GitHub: @AsGuizar

🙏 Agradecimientos

A todos los nutricionistas que inspiraron este proyecto
La comunidad de React y Firebase por sus excelentes herramientas
Todos los contribuidores que ayudan a mejorar NutriTrack


Desarrollado con ❤️ para nutricionistas profesionales
Última actualización: Octubre 2025
