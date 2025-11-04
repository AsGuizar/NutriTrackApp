import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, COLLECTIONS, Patient } from '../config/firebase';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

interface DashboardProps {
  onAddPatient: () => void;
  onPatientClick: (patientId: string) => void;
}

/**
 * Componente Dashboard principal de la aplicación Nutri-App
 * Muestra una vista general de todos los pacientes con métricas clave
 */
const Dashboard: React.FC<DashboardProps> = ({ onAddPatient, onPatientClick }) => {
  const { currentUser, } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    // Configurar listener en tiempo real para pacientes del usuario actual
    const patientsQuery = query(
      collection(db, COLLECTIONS.USERS, currentUser.uid, COLLECTIONS.PATIENTS),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
      const patientsData: Patient[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        patientsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          weightHistory: data.weightHistory?.map((wh: any) => ({
            ...wh,
            date: wh.date?.toDate() || new Date()
          })) || [],
          bodyMetrics: data.bodyMetrics?.map((bm: any) => ({
            ...bm,
            date: bm.date?.toDate() || new Date()
          })) || [],
          notes: data.notes?.map((note: any) => ({
            ...note,
            date: note.date?.toDate() || new Date()
          })) || []
        } as Patient);
      });
      
      setPatients(patientsData);
      setLoading(false);
    }, (error) => {
      console.error('Error obteniendo pacientes:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  /**
   * Elimina un paciente de la base de datos
   */
  const handleDeletePatient = async (patientId: string, patientName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${patientName}? Esta acción no se puede deshacer.`)) {
      try {
        if (!currentUser) return;
        
        const patientRef = doc(db, COLLECTIONS.USERS, currentUser.uid, COLLECTIONS.PATIENTS, patientId);
        await deleteDoc(patientRef);
        
        toast.success(`¡${patientName} ha sido eliminado!`);
      } catch (error) {
        console.error("Error eliminando paciente:", error);
        toast.error("Error al eliminar el paciente. Inténtalo de nuevo.");
      }
    }
  };

  /**
   * Calcula la fecha del último check-in del paciente
   */
  const getLastCheckIn = (patient: Patient): string => {
    if (patient.weightHistory.length === 0) return 'Sin registros';
    
    const lastEntry = patient.weightHistory[patient.weightHistory.length - 1];
    const daysDiff = Math.floor((Date.now() - lastEntry.date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return 'Ayer';
    if (daysDiff < 7) return `Hace ${daysDiff} días`;
    if (daysDiff < 30) return `Hace ${Math.floor(daysDiff / 7)} semanas`;
    return `Hace ${Math.floor(daysDiff / 30)} meses`;
  };

  /**
   * Genera datos para el gráfico mini de progreso de peso
   */
  const getWeightProgress = (patient: Patient) => {
    if (patient.weightHistory.length < 2) return [];
    
    return patient.weightHistory
      .slice(-7) // Últimos 7 registros
      .map(entry => ({
        date: entry.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        weight: entry.weight
      }));
  };

  /**
   * Calcula el progreso hacia el objetivo de peso
   */
  const getGoalProgress = (patient: Patient): number => {
    if (patient.weightHistory.length === 0 || !patient.goals.targetWeight) return 0;
    
    const currentWeight = patient.weightHistory[patient.weightHistory.length - 1].weight;
    const targetWeight = patient.goals.targetWeight;
    const initialWeight = patient.weightHistory[0].weight;
    
    const totalChange = Math.abs(targetWeight - initialWeight);
    const currentChange = Math.abs(targetWeight - currentWeight);
    
    if (totalChange === 0) return 100;
    
    return Math.max(0, Math.min(100, ((totalChange - currentChange) / totalChange) * 100));
  };

  /**
   * Filtra pacientes basado en el término de búsqueda
   */
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      {/* Header del Dashboard */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                {patients.length} paciente{patients.length !== 1 ? 's' : ''} en tu lista
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar pacientes por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron pacientes</h3>
                <p className="text-gray-500">Intenta con otros términos de búsqueda</p>
              </>
            ) : (
              <>
                <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pacientes aún</h3>
                <p className="text-gray-500 mb-6">Comienza agregando tu primer paciente</p>
                <button onClick={onAddPatient} className="btn-primary">
                  Agregar Primer Paciente
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="card cursor-pointer hover:shadow-lg transition-shadow duration-200"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3" onClick={() => onPatientClick(patient.id)}>
                    <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-500">{patient.age} años • {patient.gender}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right" onClick={() => onPatientClick(patient.id)}>
                      <div className="text-sm text-gray-500">Progreso</div>
                      <div className="text-lg font-bold text-primary-600">
                        {getGoalProgress(patient).toFixed(0)}%
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePatient(patient.id, patient.name)}
                      className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar paciente"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m-3 0h14" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Información del paciente */}
                <div className="space-y-3 mb-4" onClick={() => onPatientClick(patient.id)}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Altura:</span>
                    <span className="font-medium">{patient.height} cm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Peso actual:</span>
                    <span className="font-medium">
                      {patient.weightHistory.length > 0 
                        ? `${patient.weightHistory[patient.weightHistory.length - 1].weight} kg`
                        : 'No registrado'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Último check-in:</span>
                    <span className="font-medium">{getLastCheckIn(patient)}</span>
                  </div>
                </div>

                {/* Gráfico mini de progreso */}
                {patient.weightHistory.length > 1 && (
                  <div className="h-24 mb-3" onClick={() => onPatientClick(patient.id)}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getWeightProgress(patient)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          domain={['dataMin - 2', 'dataMax + 2']}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#0ea5e9" 
                          strokeWidth={2}
                          dot={{ fill: '#0ea5e9', strokeWidth: 1, r: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Footer de la tarjeta */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{patient.notes.length} nota{patient.notes.length !== 1 ? 's' : ''}</span>
                  <span>{patient.weightHistory.length} registro{patient.weightHistory.length !== 1 ? 's' : ''} de peso</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;