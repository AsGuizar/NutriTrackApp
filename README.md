# 🥗 NutriTrack - Sistema de Gestión para Nutricionistas

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
* **Tailwind CSS**
* **Plotly** para gráficos

### Backend (Firebase)

* **Firebase Authentication**
* **Firestore** como base de datos NoSQL
* **Real-time listeners**
* **Reglas de seguridad** configuradas


## 🚀 Instalación y Configuración

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

Antes de ejecutar la aplicación:
Actualiza `src/config/firebase.ts` con tus credenciales

### 4. Ejecutar la Aplicación

```bash
npm start
```

## 🤝 Contribución

1. Haz **fork**
2. Crea rama (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Pull Request

## 🆘 Soporte

* **Error auth** → revisa credenciales
* **Error DB** → verifica reglas de Firestore
* **Error build** → ejecuta `npm install`

**Desarrollado con ❤️ para nutricionistas profesionales**
*Última actualización: Septiembre 2025*
