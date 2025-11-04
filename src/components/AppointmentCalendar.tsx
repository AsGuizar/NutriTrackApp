import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, COLLECTIONS, Appointment, Patient } from '../config/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

interface AppointmentCalendarProps {
  onBack: () => void;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [newAppointment, setNewAppointment] = useState<{
    patientId: string;
    time: string;
    notes: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  }>({
    patientId: '',
    time: '',
    notes: '',
    status: 'scheduled'
  });

  // NEW: Effect to populate form when editing an appointment
  useEffect(() => {
    if (selectedAppointment) {
      setNewAppointment({
        patientId: selectedAppointment.patientId,
        time: selectedAppointment.time,
        notes: selectedAppointment.notes || '',
        status: selectedAppointment.status
      });
      setSelectedDate(new Date(selectedAppointment.date));
    }
  }, [selectedAppointment]);

  useEffect(() => {
    if (!currentUser) return;

    // Obtener citas
    const appointmentsQuery = query(
      collection(db, COLLECTIONS.USERS, currentUser.uid, COLLECTIONS.APPOINTMENTS),
      orderBy('date', 'asc')
    );

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const appointmentsData: Appointment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        appointmentsData.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Appointment);
      });
      setAppointments(appointmentsData);
      setLoading(false);
    });

    // Obtener pacientes
    const patientsQuery = query(
      collection(db, COLLECTIONS.USERS, currentUser.uid, COLLECTIONS.PATIENTS),
      orderBy('name', 'asc')
    );

    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
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
    });

    return () => {
      unsubscribeAppointments();
      unsubscribePatients();
    };
  }, [currentUser]);

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getDate() === date.getDate() &&
               aptDate.getMonth() === date.getMonth() &&
               aptDate.getFullYear() === date.getFullYear();
      });

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        appointments: dayAppointments
      });
    }
    
    return days;
  };

  const handleAddAppointment = async () => {
    if (!newAppointment.patientId || !newAppointment.time || !selectedDate) return;

    try {
      const appointmentData = {
        ...newAppointment,
        date: selectedDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(
        collection(db, COLLECTIONS.USERS, currentUser!.uid, COLLECTIONS.APPOINTMENTS),
        appointmentData
      );

      setNewAppointment({ patientId: '', time: '', notes: '', status: 'scheduled' });
      setSelectedDate(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creando cita:', error);
    }
  };

  const handleUpdateAppointment = async (appointmentId: string, updates: Partial<Appointment>) => {
    try {
      const appointmentRef = doc(db, COLLECTIONS.USERS, currentUser!.uid, COLLECTIONS.APPOINTMENTS, appointmentId);
      await updateDoc(appointmentRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error actualizando cita:', error);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) return;

    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, currentUser!.uid, COLLECTIONS.APPOINTMENTS, appointmentId));
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error eliminando cita:', error);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Paciente no encontrado';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendario de Citas</h1>
                <p className="text-gray-600">Gestiona tu agenda de pacientes</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Cita
            </button>
          </div>
        </div>
      </div>

      {/* Navegación del calendario */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn-secondary"
            >
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {getCalendarDays().map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] bg-white p-2 ${
                  !day.isCurrentMonth ? 'bg-gray-50' : ''
                } ${day.isToday ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className={`text-sm font-medium ${
                  !day.isCurrentMonth ? 'text-gray-400' : 
                  day.isToday ? 'text-primary-600' : 'text-gray-900'
                }`}>
                  {day.day}
                </div>
                
                {/* Citas del día */}
                <div className="mt-1 space-y-1">
                  {day.appointments.slice(0, 2).map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={() => setSelectedAppointment(appointment)}
                      className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100 truncate"
                      style={{ backgroundColor: appointment.status === 'scheduled' ? '#dbeafe' : 
                              appointment.status === 'completed' ? '#dcfce7' : '#fee2e2' }}
                    >
                      <div className="font-medium text-gray-900">
                        {appointment.time} - {getPatientName(appointment.patientId)}
                      </div>
                      <div className={`inline-block px-1 py-0.5 rounded text-xs ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </div>
                    </div>
                  ))}
                  
                  {day.appointments.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{day.appointments.length - 2} más
                    </div>
                  )}
                </div>
                
                {/* Botón para agregar cita */}
                {day.isCurrentMonth && (
                  <button
                    onClick={() => {
                      setSelectedDate(day.date);
                      setShowAddForm(true);
                    }}
                    className="mt-2 w-full text-xs text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded p-1"
                  >
                    + Agregar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para agregar/editar cita */}
      {(showAddForm || selectedAppointment) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedAppointment ? 'Editar Cita' : 'Nueva Cita'}
              </h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedAppointment) {
                  handleUpdateAppointment(selectedAppointment.id, {
                    ...newAppointment,
                    date: selectedDate || selectedAppointment.date
                  });
                } else {
                  handleAddAppointment();
                }
              }} className="space-y-4">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                    className="input-field"
                    required
                  />
                </div>

                {/* Hora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                {/* Paciente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paciente
                  </label>
                  <select
                    value={newAppointment.patientId}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, patientId: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Seleccionar paciente</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={newAppointment.status}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, status: e.target.value as any }))}
                    className="input-field"
                  >
                    <option value="scheduled">Programada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                    className="input-field min-h-[80px] resize-none"
                    placeholder="Notas adicionales sobre la cita..."
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedAppointment(null);
                      setNewAppointment({ patientId: '', time: '', notes: '', status: 'scheduled' });
                      setSelectedDate(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  
                  {selectedAppointment && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                    >
                      Eliminar
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {selectedAppointment ? 'Actualizar' : 'Crear'} Cita
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;