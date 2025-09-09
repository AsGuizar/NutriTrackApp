import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, COLLECTIONS, Patient } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface NewPatientProps {
  onPatientCreated: () => void;
  onBack: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  height: string;
  initialWeight: string;
  targetWeight: string;
  targetBodyFat: string;
}

const NewPatient: React.FC<NewPatientProps> = ({ onPatientCreated, onBack }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'male',
    height: '',
    initialWeight: '',
    targetWeight: '',
    targetBodyFat: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      setError('La edad debe ser un número válido mayor a 0');
      return;
    }

    if (isNaN(Number(formData.height)) || Number(formData.height) <= 0) {
      setError('La altura debe ser un número válido mayor a 0');
      return;
    }

    if (isNaN(Number(formData.initialWeight)) || Number(formData.initialWeight) <= 0) {
      setError('El peso inicial debe ser un número válido mayor a 0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Crear objeto del paciente con todos los campos requeridos
      const newPatient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone || '',
        age: Number(formData.age),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.initialWeight),
        goals: {
          targetWeight: formData.targetWeight ? Number(formData.targetWeight) : 0,
          targetBodyFat: formData.targetBodyFat ? Number(formData.targetBodyFat) : 0
        },
        notes: [],
        weightHistory: [{
          date: new Date(),
          weight: Number(formData.initialWeight)
        }],
        bodyMetrics: []
      };

      // Agregar paciente a Firestore
      await addDoc(
        collection(db, COLLECTIONS.USERS, currentUser!.uid, COLLECTIONS.PATIENTS),
        {
          ...newPatient,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      );

      // Limpiar formulario y redirigir
      setFormData({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: 'male',
        height: '',
        initialWeight: '',
        targetWeight: '',
        targetBodyFat: ''
      });
      
      onPatientCreated();
    } catch (error: any) {
      console.error('Error creando paciente:', error);
      setError('Error al crear el paciente. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Agregar Nuevo Paciente</h1>
          <p className="text-gray-600 mt-2">
            Completa la información del paciente para comenzar el seguimiento nutricional
          </p>
        </div>

        {/* Formulario */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    placeholder="Nombre y apellidos"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                      Edad *
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      required
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="input-field mt-1"
                      placeholder="25"
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      Género *
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      required
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="input-field mt-1"
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Medidas corporales */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medidas Corporales</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                    Altura (cm) *
                  </label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    required
                    min="100"
                    max="250"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    placeholder="170"
                  />
                </div>

                <div>
                  <label htmlFor="initialWeight" className="block text-sm font-medium text-gray-700">
                    Peso inicial (kg) *
                  </label>
                  <input
                    type="number"
                    id="initialWeight"
                    name="initialWeight"
                    required
                    step="0.1"
                    min="30"
                    max="300"
                    value={formData.initialWeight}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    placeholder="70.5"
                  />
                </div>
              </div>
            </div>

            {/* Objetivos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Objetivos del Paciente</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="targetWeight" className="block text-sm font-medium text-gray-700">
                    Peso objetivo (kg)
                  </label>
                  <input
                    type="number"
                    id="targetWeight"
                    name="targetWeight"
                    step="0.1"
                    min="30"
                    max="300"
                    value={formData.targetWeight}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    placeholder="65.0"
                  />
                </div>

                <div>
                  <label htmlFor="targetBodyFat" className="block text-sm font-medium text-gray-700">
                    % Grasa corporal objetivo
                  </label>
                  <input
                    type="number"
                    id="targetBodyFat"
                    name="targetBodyFat"
                    step="0.1"
                    min="5"
                    max="50"
                    value={formData.targetBodyFat}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    placeholder="18.5"
                  />
                </div>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onBack}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creando...' : 'Crear Paciente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPatient;