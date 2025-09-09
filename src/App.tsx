import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import NewPatient from './components/NewPatient';
import PatientProfile from './components/PatientProfile';
import AppointmentCalendar from './components/AppointmentCalendar';

// Componente principal de la aplicación
const AppContent: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'newPatient' | 'patientProfile' | 'appointments'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando NutriTrack...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar login
  if (!currentUser) {
    return <Login />;
  }

  // Función para manejar la navegación
  const handleViewChange = (view: 'dashboard' | 'newPatient' | 'patientProfile' | 'appointments') => {
    setCurrentView(view);
    if (view !== 'patientProfile') {
      setSelectedPatientId(null);
    }
  };

  const handlePatientClick = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentView('patientProfile');
  };

  const handlePatientCreated = () => {
    setCurrentView('dashboard');
  };

  // Renderizar la vista correspondiente
  const renderCurrentView = () => {
    switch (currentView) {
      case 'newPatient':
        return (
          <NewPatient
            onBack={() => handleViewChange('dashboard')}
            onPatientCreated={handlePatientCreated}
          />
        );
              case 'patientProfile':
          return selectedPatientId ? (
            <PatientProfile
              patientId={selectedPatientId}
              onBack={() => handleViewChange('dashboard')}
            />
          ) : (
            <div className="text-center py-12">
              <p>Error: ID de paciente no encontrado</p>
              <button onClick={() => handleViewChange('dashboard')} className="btn-primary mt-4">
                Volver al Dashboard
              </button>
            </div>
          );
        case 'appointments':
          return (
            <AppointmentCalendar
              onBack={() => handleViewChange('dashboard')}
            />
          );
      case 'dashboard':
      default:
        return (
          <Dashboard
            onAddPatient={() => handleViewChange('newPatient')}
            onPatientClick={handlePatientClick}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">NutriTrack</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleViewChange('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              
              <button
                onClick={() => handleViewChange('newPatient')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'newPatient'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Nuevo Paciente
              </button>
              
              <button
                onClick={() => handleViewChange('appointments')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'appointments'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                📅 Citas
              </button>
              
              {selectedPatientId && (
                <button
                  onClick={() => handleViewChange('patientProfile')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'patientProfile'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Perfil del Paciente
                </button>
              )}
              
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main>
        {renderCurrentView()}
      </main>
    </div>
  );
};

// Componente raíz con providers
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
