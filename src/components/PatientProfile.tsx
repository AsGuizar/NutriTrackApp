import React, { useState, useEffect, useMemo, ErrorInfo, Component } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, COLLECTIONS, Patient } from '../config/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
// @ts-ignore
import Plotly from 'plotly.js-dist';
import { Activity, Scale, Heart, Target, User, Edit, Save, X, Mail, Phone, Calendar, Ruler, Plus } from 'lucide-react';

interface PatientProfileProps {
  patientId: string;
  onBack: () => void;
}

type TabType = 'info' | 'analytics' | 'goals' | 'notes';

// Error Boundary Component for Charts
class ChartErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-300 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Error al cargar el gráfico</p>
            <p className="text-xs text-gray-400 mt-1">Intenta recargar la página</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Spinner Component for Charts
const ChartLoader: React.FC = () => (
  <div className="h-64 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-3 text-sm text-gray-600">Cargando gráfico...</p>
    </div>
  </div>
);

// Enhanced Plotly Chart Components
const WeightChart: React.FC<{ 
  data: any[], 
  targetWeight?: number,
  loading: boolean 
}> = ({ data, targetWeight, loading }) => {
  const chartRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentChartRef = chartRef.current;
    if (!currentChartRef || loading || data.length === 0) return;

    const traces: any[] = [
      {
        x: data.map(d => d.date),
        y: data.map(d => d.weight),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Peso Actual',
        line: { 
          color: '#0ea5e9', 
          width: 4,
          shape: 'spline',
          smoothing: 0.3
        },
        marker: { 
          color: '#0ea5e9', 
          size: 10,
          line: { color: '#ffffff', width: 3 },
          symbol: 'circle'
        },
        fill: 'tonexty',
        fillcolor: 'rgba(14, 165, 233, 0.1)',
        hovertemplate: '<b>%{x}</b><br>Peso: <b>%{y:.1f} kg</b><extra></extra>'
      }
    ];

    if (targetWeight && targetWeight > 0) {
      traces.push({
        x: data.map(d => d.date),
        y: Array(data.length).fill(targetWeight),
        type: 'scatter',
        mode: 'lines',
        name: 'Objetivo',
        line: { 
          color: '#ef4444', 
          width: 3, 
          dash: 'dashdot'
        },
        hovertemplate: '<b>Objetivo:</b> %{y:.1f} kg<extra></extra>'
      });
    }

    const layout = {
      title: {
        text: '',
        font: { size: 18, family: 'Inter, sans-serif' }
      },
      xaxis: {
        title: { text: 'Fecha', font: { size: 14, color: '#6b7280' } },
        gridcolor: '#f3f4f6',
        showgrid: true,
        zeroline: false,
        tickfont: { size: 12, color: '#6b7280' }
      },
      yaxis: {
        title: { text: 'Peso (kg)', font: { size: 14, color: '#6b7280' } },
        gridcolor: '#f3f4f6',
        showgrid: true,
        zeroline: false,
        tickformat: '.1f',
        tickfont: { size: 12, color: '#6b7280' }
      },
      plot_bgcolor: 'rgba(248, 250, 252, 0.5)',
      paper_bgcolor: 'transparent',
      margin: { l: 70, r: 30, t: 30, b: 70 },
      showlegend: true,
      legend: {
        x: 0,
        y: 1.1,
        orientation: 'h',
        bgcolor: 'rgba(255,255,255,0.9)',
        bordercolor: 'rgba(0,0,0,0.1)',
        borderwidth: 1,
        font: { size: 12, color: '#374151' }
      },
      hovermode: 'x unified',
      font: { family: 'Inter, sans-serif' }
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
      displaylogo: false,
      toImageButtonOptions: {
        format: 'png',
        filename: 'peso_paciente',
        height: 500,
        width: 900,
        scale: 2
      }
    };

    Plotly.newPlot(currentChartRef, traces, layout, config);

    return () => {
      if (currentChartRef) {
        Plotly.purge(currentChartRef);
      }
    };
  }, [data, targetWeight, loading]);

  if (loading) return (
    <div className="h-80 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.1s' }}></div>
        </div>
        <p className="mt-4 text-sm font-medium text-blue-700">Cargando gráfico...</p>
      </div>
    </div>
  );
  
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center max-w-md">
          <div className="mx-auto h-20 w-20 text-gray-400 mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos suficientes</h3>
          <p className="text-gray-600 mb-4">Se necesitan al menos 2 registros de peso para mostrar el gráfico</p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Registra el peso del paciente para comenzar
          </div>
        </div>
      </div>
    );
  }

  return <div ref={chartRef} className="h-80 bg-white rounded-lg p-2" />;
};

const IMCChart: React.FC<{ data: any[], loading: boolean }> = ({ data, loading }) => {
  const chartRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentChartRef = chartRef.current;
    if (!currentChartRef || loading || data.length === 0) return;

    const traces = [
      {
        x: data.map(d => d.date),
        y: data.map(d => d.imc),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'IMC',
        line: { color: '#10b981', width: 3 },
        marker: { 
          color: '#10b981', 
          size: 8,
          line: { color: '#ffffff', width: 2 }
        },
        hovertemplate: '<b>Fecha:</b> %{x}<br><b>IMC:</b> %{y:.1f}<extra></extra>'
      }
    ];

    // Add IMC category reference lines
    const categoryLines = [
      { value: 18.5, name: 'Bajo peso', color: '#3b82f6' },
      { value: 25, name: 'Normal', color: '#10b981' },
      { value: 30, name: 'Sobrepeso', color: '#f59e0b' }
    ];

      categoryLines.forEach(line => {
      traces.push({
        x: data.map(d => d.date),
        y: Array(data.length).fill(line.value),
        type: 'scatter',
        mode: 'lines',
        name: line.name,
        line: { 
          color: line.color, 
          width: 1,
          dash: 'dot'
        },
        showlegend: false,
        hovertemplate: `<b>${line.name}:</b> %{y}<extra></extra>`
      } as any);
    });

    const layout = {
      title: {
        text: '',
        font: { size: 16 }
      },
      xaxis: {
        title: 'Fecha',
        gridcolor: '#f3f4f6',
        showgrid: true,
        zeroline: false
      },
      yaxis: {
        title: 'IMC',
        gridcolor: '#f3f4f6',
        showgrid: true,
        zeroline: false,
        tickformat: '.1f'
      },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      margin: { l: 60, r: 30, t: 30, b: 60 },
      showlegend: true,
      legend: {
        x: 0,
        y: 1,
        bgcolor: 'rgba(255,255,255,0.8)'
      },
      hovermode: 'closest'
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      displaylogo: false,
      toImageButtonOptions: {
        format: 'png',
        filename: 'imc_paciente',
        height: 400,
        width: 800,
        scale: 1
      }
    };

    Plotly.newPlot(currentChartRef, traces, layout, config);

    return () => {
      if (currentChartRef) {
        Plotly.purge(currentChartRef);
      }
    };
  }, [data, loading]);

  if (loading) return <ChartLoader />;
  if (data.length === 0) return null;

  return <div ref={chartRef} className="h-64" />;
};

const BodyFatChart: React.FC<{ data: any[], loading: boolean }> = ({ data, loading }) => {
  const chartRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentChartRef = chartRef.current;
    if (!currentChartRef || loading || data.length === 0) return;

    const traces = [
      {
        x: data.map(d => d.date),
        y: data.map(d => d.bodyFat),
        type: 'scatter',
        mode: 'lines+markers',
        name: '% Grasa Corporal',
        line: { color: '#f59e0b', width: 3 },
        marker: { 
          color: '#f59e0b', 
          size: 8,
          line: { color: '#ffffff', width: 2 }
        },
        hovertemplate: '<b>Fecha:</b> %{x}<br><b>% Grasa Corporal:</b> %{y:.1f}%<extra></extra>'
      }
    ];

    const layout = {
      title: {
        text: '',
        font: { size: 16 }
      },
      xaxis: {
        title: 'Fecha',
        gridcolor: '#f3f4f6',
        showgrid: true,
        zeroline: false
      },
      yaxis: {
        title: '% Grasa Corporal',
        gridcolor: '#f3f4f6',
        showgrid: true,
        zeroline: false,
        tickformat: '.1f',
        ticksuffix: '%'
      },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      margin: { l: 60, r: 30, t: 30, b: 60 },
      showlegend: true,
      legend: {
        x: 0,
        y: 1,
        bgcolor: 'rgba(255,255,255,0.8)'
      },
      hovermode: 'closest'
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      displaylogo: false,
      toImageButtonOptions: {
        format: 'png',
        filename: 'grasa_corporal_paciente',
        height: 400,
        width: 800,
        scale: 1
      }
    };

    Plotly.newPlot(currentChartRef, traces, layout, config);

    return () => {
      if (currentChartRef) {
        Plotly.purge(currentChartRef);
      }
    };
  }, [data, loading]);

  if (loading) return <ChartLoader />;
  if (data.length === 0) return null;

  return <div ref={chartRef} className="h-64" />;
};

// Improved data validation utilities
const validateWeightData = (weightHistory: any[]): boolean => {
  if (!Array.isArray(weightHistory) || weightHistory.length === 0) return false;
  
  return weightHistory.every(entry => 
    entry && 
    typeof entry.weight === 'number' && 
    !isNaN(entry.weight) &&
    entry.weight > 0 && 
    entry.weight < 1000 && // Reasonable upper limit
    entry.date instanceof Date &&
    !isNaN(entry.date.getTime())
  );
};

const validateBodyMetrics = (bodyMetrics: any[], field: 'imc' | 'bmi' | 'bodyFat'): boolean => {
  if (!Array.isArray(bodyMetrics) || bodyMetrics.length === 0) return false;
  
  return bodyMetrics.some(entry => {
    if (!entry || !entry.date || !(entry.date instanceof Date)) return false;
    
    if (field === 'bodyFat') {
      return typeof entry.bodyFat === 'number' && 
            !isNaN(entry.bodyFat) && 
            entry.bodyFat > 0 && 
            entry.bodyFat <= 100;
    } else {
      const value = entry[field] || entry[field === 'imc' ? 'bmi' : 'imc'];
      return typeof value === 'number' && 
            !isNaN(value) && 
            value > 0 && 
            value <= 100;
    }
  });
};

const PatientProfile: React.FC<PatientProfileProps> = ({ patientId, onBack }) => {
  const { currentUser } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [newNote, setNewNote] = useState('');
  
  // Estados combinados para registro de métricas
  const [newWeight, setNewWeight] = useState('');
  const [newIMC, setNewIMC] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [autoCalculateIMC, setAutoCalculateIMC] = useState(true);
  
  const [editingGoals, setEditingGoals] = useState(false);
  const [tempGoals, setTempGoals] = useState({ targetWeight: 0, targetBodyFat: 0 });
  const [submittingMetrics, setSubmittingMetrics] = useState(false);
  
  // Estados para edición de información del paciente
  const [editingInfo, setEditingInfo] = useState(false);
  const [tempInfo, setTempInfo] = useState({
    name: '',
    email: '',
    phone: '',
    age: 0,
    gender: 'male' as 'male' | 'female' | 'other',
    height: 0
  });
  const [submittingInfo, setSubmittingInfo] = useState(false);

  // Chart loading states
  const [chartLoading, setChartLoading] = useState({
    weight: true,
    imc: true,
    bodyFat: true
  });

  // Fixed memoized data calculations with better precision handling
  const weightProgress = useMemo(() => {
    if (!patient || !validateWeightData(patient.weightHistory)) {
      return [];
    }

    if (patient.weightHistory.length < 2) {
      return [];
    }
    
    const data = patient.weightHistory
      .slice(-30)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((entry) => ({
        date: entry.date.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit',
          year: '2-digit'
        }),
        weight: parseFloat(entry.weight.toFixed(1)), // Keep original precision
        originalDate: entry.date.getTime()
      }));

    return data;
  }, [patient]);

  const imcProgress = useMemo(() => {
    if (!patient || !validateBodyMetrics(patient.bodyMetrics, 'imc')) {
      return [];
    }
    
    const data = patient.bodyMetrics
      .filter(entry => {
        const value = (entry as any).imc || (entry as any).bmi;
        return value && typeof value === 'number' && !isNaN(value) && value > 0;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-10)
      .map(entry => {
        const value = (entry as any).imc || (entry as any).bmi;
        return {
          date: entry.date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit'
          }),
          imc: parseFloat(value.toFixed(1)), // Keep original precision
          originalDate: entry.date.getTime()
        };
      });

    return data;
  }, [patient]);

  const bodyFatProgress = useMemo(() => {
    if (!patient || !validateBodyMetrics(patient.bodyMetrics, 'bodyFat')) {
      return [];
    }
    
    const data = patient.bodyMetrics
      .filter(entry => {
        return entry.bodyFat && 
               typeof entry.bodyFat === 'number' && 
               !isNaN(entry.bodyFat) && 
               entry.bodyFat > 0;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-10)
      .map(entry => ({
        date: entry.date.toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit',
          year: '2-digit'
        }),
        bodyFat: parseFloat(entry.bodyFat!.toFixed(1)), // Keep original precision
        originalDate: entry.date.getTime()
      }));

    return data;
  }, [patient]);

  // Reset chart loading states when patient data is ready
  useEffect(() => {
    if (patient) {
      // Small delay to allow memoized calculations to complete
      const timer = setTimeout(() => {
        setChartLoading({ weight: false, imc: false, bodyFat: false });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [patient]);

  // Calcular IMC automáticamente cuando cambie el peso
  useEffect(() => {
    if (autoCalculateIMC && newWeight && patient) {
      const weight = parseFloat(newWeight);
      const height = patient.height / 100; // convertir cm a metros
      if (weight > 0 && height > 0) {
        const imc = weight / (height * height);
        setNewIMC(imc.toFixed(1));
      }
    }
  }, [newWeight, autoCalculateIMC, patient]);

  useEffect(() => {
    if (!currentUser || !patientId) return;

    const patientDocRef = doc(db, COLLECTIONS.USERS, currentUser.uid, COLLECTIONS.PATIENTS, patientId);
    
    const unsubscribe = onSnapshot(patientDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('Datos del paciente recibidos:', data);
        
        const patientData: Patient = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          weightHistory: data.weightHistory?.map((wh: any) => ({
            ...wh,
            date: wh.date?.toDate() || new Date(),
            weight: parseFloat(wh.weight) // Ensure proper number conversion
          })) || [],
          bodyMetrics: data.bodyMetrics?.map((bm: any) => ({
            ...bm,
            date: bm.date?.toDate() || new Date(),
            imc: bm.imc ? parseFloat(bm.imc) : undefined,
            bmi: bm.bmi ? parseFloat(bm.bmi) : undefined,
            bodyFat: bm.bodyFat ? parseFloat(bm.bodyFat) : undefined
          })) || [],
          notes: data.notes?.map((note: any) => ({
            ...note,
            date: note.date?.toDate() || new Date()
          })) || []
        } as Patient;
        
        console.log('Paciente procesado:', patientData);
        setPatient(patientData);
        setTempGoals(patientData.goals || { targetWeight: 0, targetBodyFat: 0 });
        setTempInfo({
          name: patientData.name || '',
          email: patientData.email || '',
          phone: patientData.phone || '',
          age: patientData.age || 0,
          gender: patientData.gender || 'male',
          height: patientData.height || 0
        });
        setLoading(false);
      }
    }, (error) => {
      console.error('Error obteniendo paciente:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, patientId]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !patient) return;

    try {
      const patientDocRef = doc(db, COLLECTIONS.USERS, currentUser!.uid, COLLECTIONS.PATIENTS, patientId);
      await updateDoc(patientDocRef, {
        notes: arrayUnion({
          date: new Date(),
          text: newNote.trim()
        }),
        updatedAt: serverTimestamp()
      });
      setNewNote('');
      console.log('Nota agregada exitosamente');
    } catch (error) {
      console.error('Error agregando nota:', error);
      alert('Error al agregar la nota. Por favor intenta de nuevo.');
    }
  };

  const handleAddCompleteMetrics = async () => {
    if (!newWeight || !patient) return;

    const weight = parseFloat(newWeight);
    
    if (weight <= 0 || weight > 500) {
      alert('El peso debe estar entre 0.1 y 500 kg');
      return;
    }

    if (newIMC && (parseFloat(newIMC) <= 0 || parseFloat(newIMC) > 100)) {
      alert('El IMC debe estar entre 0.1 y 100');
      return;
    }

    if (newBodyFat && (parseFloat(newBodyFat) <= 0 || parseFloat(newBodyFat) > 100)) {
      alert('El % de grasa corporal debe estar entre 0.1 y 100%');
      return;
    }

    try {
      setSubmittingMetrics(true);
      const patientDocRef = doc(db, COLLECTIONS.USERS, currentUser!.uid, COLLECTIONS.PATIENTS, patientId);
      const currentDate = new Date();
      
      const updates: any = {
        updatedAt: serverTimestamp()
      };

      updates.weightHistory = arrayUnion({
        date: currentDate,
        weight: weight // Store as number, not string
      });

      if (newIMC || newBodyFat) {
        const bodyMetrics: any = {
          date: currentDate
        };
        
        if (newIMC) bodyMetrics.imc = parseFloat(newIMC);
        if (newBodyFat) bodyMetrics.bodyFat = parseFloat(newBodyFat);
        
        updates.bodyMetrics = arrayUnion(bodyMetrics);
      }

      await updateDoc(patientDocRef, updates);
      
      setNewWeight('');
      setNewIMC('');
      setNewBodyFat('');
      
      console.log('Métricas completas agregadas exitosamente');
    } catch (error) {
      console.error('Error agregando métricas:', error);
      alert('Error al agregar las métricas. Por favor intenta de nuevo.');
    } finally {
      setSubmittingMetrics(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!patient) return;

    try {
      const patientDocRef = doc(db, COLLECTIONS.USERS, currentUser!.uid, COLLECTIONS.PATIENTS, patientId);
      await updateDoc(patientDocRef, {
        goals: tempGoals,
        updatedAt: serverTimestamp()
      });
      setEditingGoals(false);
      console.log('Objetivos guardados exitosamente');
    } catch (error) {
      console.error('Error guardando objetivos:', error);
      alert('Error al guardar los objetivos. Por favor intenta de nuevo.');
    }
  };

  const handleSaveInfo = async () => {
    if (!patient) return;

    // Validaciones
    if (!tempInfo.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    if (tempInfo.age <= 0 || tempInfo.age > 120) {
      alert('La edad debe estar entre 1 y 120 años');
      return;
    }

    if (tempInfo.height <= 0 || tempInfo.height > 250) {
      alert('La altura debe estar entre 1 y 250 cm');
      return;
    }

    try {
      setSubmittingInfo(true);
      const patientDocRef = doc(db, COLLECTIONS.USERS, currentUser!.uid, COLLECTIONS.PATIENTS, patientId);
      await updateDoc(patientDocRef, {
        name: tempInfo.name.trim(),
        email: tempInfo.email.trim(),
        phone: tempInfo.phone.trim(),
        age: tempInfo.age,
        gender: tempInfo.gender,
        height: tempInfo.height,
        updatedAt: serverTimestamp()
      });
      setEditingInfo(false);
      console.log('Información del paciente guardada exitosamente');
    } catch (error) {
      console.error('Error guardando información:', error);
      alert('Error al guardar la información. Por favor intenta de nuevo.');
    } finally {
      setSubmittingInfo(false);
    }
  };

  const getGoalProgress = () => {
    if (!patient || patient.weightHistory.length === 0 || !patient.goals?.targetWeight) return 0;
    
    const currentWeight = patient.weightHistory[patient.weightHistory.length - 1].weight;
    const targetWeight = patient.goals.targetWeight;
    const initialWeight = patient.weightHistory[0].weight;
    
    const isLosingWeight = targetWeight < initialWeight;
    
    if (isLosingWeight) {
      const totalToLose = initialWeight - targetWeight;
      const currentlyLost = initialWeight - currentWeight;
      
      if (totalToLose === 0) return 100;
      return Math.max(0, Math.min(100, (currentlyLost / totalToLose) * 100));
    } else {
      const totalToGain = targetWeight - initialWeight;
      const currentlyGained = currentWeight - initialWeight;
      
      if (totalToGain === 0) return 100;
      return Math.max(0, Math.min(100, (currentlyGained / totalToGain) * 100));
    }
  };

  const getCurrentIMC = () => {
    if (!patient || patient.weightHistory.length === 0 || patient.height <= 0) return 0;
    
    const currentWeight = patient.weightHistory[patient.weightHistory.length - 1].weight;
    const height = patient.height / 100;
    
    if (height > 0 && currentWeight > 0) {
      const imc = currentWeight / (height * height);
      return parseFloat(imc.toFixed(1));
    }
    return 0;
  };

  const getIMCCategory = (imc: number) => {
    if (imc <= 0) return { category: 'No disponible', color: 'text-gray-500' };
    if (imc < 18.5) return { category: 'Bajo peso', color: 'text-blue-600' };
    if (imc < 25) return { category: 'Normal', color: 'text-green-600' };
    if (imc < 30) return { category: 'Sobrepeso', color: 'text-yellow-600' };
    return { category: 'Obesidad', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil del paciente...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Paciente no encontrado</h3>
        <button onClick={onBack} className="btn-primary mt-4">Volver al Dashboard</button>
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
                <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                <p className="text-gray-600">Perfil del paciente</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Progreso del objetivo</div>
              <div className="text-2xl font-bold text-primary-600">
                {getGoalProgress().toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'info', label: 'Información', icon: '👤' },
              { id: 'analytics', label: 'Análisis', icon: '📊' },
              { id: 'goals', label: 'Objetivos', icon: '🎯' },
              { id: 'notes', label: 'Notas', icon: '📝' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {activeTab === 'info' && (
  <div className="space-y-8">
    {/* Enhanced Key Metrics Section */}
    <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/20 to-blue-200/20 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
          <div className="p-2 bg-blue-500 rounded-lg mr-3">
            <Activity className="w-6 h-6 text-white" />
          </div>
          Métricas Clave
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weight Card */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-white/50 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {patient.weightHistory[patient.weightHistory.length - 1]?.weight || 0}
                </div>
                <div className="text-sm font-medium text-gray-500">kg</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Peso Actual</div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (patient.weightHistory[patient.weightHistory.length - 1]?.weight / (patient.goals?.targetWeight || 100)) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* BMI Card */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-white/50 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {getCurrentIMC()}
                </div>
                <div className="text-sm font-medium text-gray-500">IMC</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-2">IMC Actual</div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              getIMCCategory(getCurrentIMC()).category === 'Normal' ? 'bg-green-100 text-green-800' :
              getIMCCategory(getCurrentIMC()).category === 'Sobrepeso' ? 'bg-yellow-100 text-yellow-800' :
              getIMCCategory(getCurrentIMC()).category === 'Obesidad' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {getIMCCategory(getCurrentIMC()).category}
            </div>
          </div>

          {/* Progress Card with Circular Progress */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-white/50 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="relative w-16 h-16">
                {/* Circular Progress */}
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(getGoalProgress() / 100) * 175.9} 175.9`}
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">{getGoalProgress().toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Progreso del Objetivo</div>
            <div className="text-xs text-gray-500">
              {patient.goals?.targetWeight ? `Meta: ${patient.goals.targetWeight} kg` : 'Sin objetivo definido'}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Enhanced Patient Information Section */}
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-xl mr-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Información Personal</h3>
              <p className="text-sm text-gray-600">Datos del paciente y contacto</p>
            </div>
          </div>
          {!editingInfo ? (
            <button
              onClick={() => setEditingInfo(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleSaveInfo}
                disabled={submittingInfo}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {submittingInfo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setEditingInfo(false);
                  setTempInfo({
                    name: patient?.name || '',
                    email: patient?.email || '',
                    phone: patient?.phone || '',
                    age: patient?.age || 0,
                    gender: patient?.gender || 'male',
                    height: patient?.height || 0
                  });
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all duration-200"
                disabled={submittingInfo}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {editingInfo ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
                  Información Básica
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={tempInfo.name}
                    onChange={(e) => setTempInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre y apellidos"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={tempInfo.age}
                    onChange={(e) => setTempInfo(prev => ({ ...prev, age: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="25"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Género *
                  </label>
                  <select
                    value={tempInfo.gender}
                    onChange={(e) => setTempInfo(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
                  Información de Contacto
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={tempInfo.email}
                    onChange={(e) => setTempInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={tempInfo.phone}
                    onChange={(e) => setTempInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura (cm) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={tempInfo.height}
                    onChange={(e) => setTempInfo(prev => ({ ...prev, height: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="170"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Información importante:</strong> Los campos marcados con * son obligatorios. 
                    La altura se utiliza para calcular automáticamente el IMC.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced info display cards */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 border-l-4 border-blue-500 pl-4">
                Información Personal
              </h4>
              
              {[
                { icon: User, label: 'Nombre completo', value: patient?.name || 'No especificado', color: 'blue' },
                { icon: Calendar, label: 'Edad', value: patient?.age ? `${patient.age} años` : 'No especificado', color: 'green' },
                { icon: User, label: 'Género', value: patient?.gender === 'male' ? 'Masculino' : patient?.gender === 'female' ? 'Femenino' : patient?.gender === 'other' ? 'Otro' : 'No especificado', color: 'purple' },
                { icon: Ruler, label: 'Altura', value: patient?.height ? `${patient.height} cm` : 'No especificado', color: 'amber' }
              ].map((item, index) => (
                <div key={index} className="group flex items-center p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200">
                  <div className={`p-3 bg-${item.color}-100 rounded-lg mr-4 group-hover:bg-${item.color}-200 transition-colors`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500 mb-1">{item.label}</div>
                    <div className="text-lg font-semibold text-gray-900">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Information Column with similar styling */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 border-l-4 border-green-500 pl-4">
                Información de Contacto
              </h4>
              
              {[
                { icon: Mail, label: 'Email', value: patient?.email || 'No especificado', color: 'blue' },
                { icon: Phone, label: 'Teléfono', value: patient?.phone || 'No especificado', color: 'green' }
              ].map((item, index) => (
                <div key={index} className="group flex items-center p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200">
                  <div className={`p-3 bg-${item.color}-100 rounded-lg mr-4 group-hover:bg-${item.color}-200 transition-colors`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500 mb-1">{item.label}</div>
                    <div className="text-lg font-semibold text-gray-900">{item.value}</div>
                  </div>
                </div>
              ))}

              {/* Additional Information */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 border-l-4 border-purple-500 pl-4 mb-4">
                  Información Adicional
                </h4>
                
                {[
                  { icon: Scale, label: 'Peso inicial', value: patient?.weightHistory[0]?.weight ? `${patient.weightHistory[0].weight} kg` : 'No registrado', color: 'blue' },
                  { icon: Calendar, label: 'Paciente desde', value: patient?.createdAt ? patient.createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No disponible', color: 'green' }
                ].map((item, index) => (
                  <div key={index} className="group flex items-center p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 mb-4">
                    <div className={`p-3 bg-${item.color}-100 rounded-lg mr-4 group-hover:bg-${item.color}-200 transition-colors`}>
                      <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-500 mb-1">{item.label}</div>
                      <div className="text-lg font-semibold text-gray-900">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Enhanced Analytics Metrics Section */}
            <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-8 border border-green-100 overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-teal-200/20 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-200/20 to-green-200/20 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="p-2 bg-green-500 rounded-lg mr-3">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  Resumen de Análisis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Weight Card */}
                  <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-white/50 hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                        <Scale className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {patient.weightHistory[patient.weightHistory.length - 1]?.weight || 0}
                        </div>
                        <div className="text-sm font-medium text-gray-500">kg</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Peso Actual</div>
                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (patient.weightHistory[patient.weightHistory.length - 1]?.weight / (patient.goals?.targetWeight || 100)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* BMI Card */}
                  <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-white/50 hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                        <Heart className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {getCurrentIMC()}
                        </div>
                        <div className="text-sm font-medium text-gray-500">IMC</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">IMC Actual</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      getIMCCategory(getCurrentIMC()).category === 'Normal' ? 'bg-green-100 text-green-800' :
                      getIMCCategory(getCurrentIMC()).category === 'Sobrepeso' ? 'bg-yellow-100 text-yellow-800' :
                      getIMCCategory(getCurrentIMC()).category === 'Obesidad' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {getIMCCategory(getCurrentIMC()).category}
                    </div>
                  </div>

                  {/* Progress Card with Circular Progress */}
                  <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-white/50 hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                        <Target className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="relative w-16 h-16">
                        {/* Circular Progress */}
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="4"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="url(#analyticsProgressGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${(getGoalProgress() / 100) * 175.9} 175.9`}
                            className="transition-all duration-700 ease-out"
                          />
                          <defs>
                            <linearGradient id="analyticsProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-600">{getGoalProgress().toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Progreso del Objetivo</div>
                    <div className="text-xs text-gray-500">
                      {patient.goals?.targetWeight ? `Meta: ${patient.goals.targetWeight} kg` : 'Sin objetivo definido'}
                    </div>
                  </div>

                  {/* Metrics Count Card */}
                  <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-white/50 hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                        <Activity className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-indigo-600 mb-1">
                          {patient.bodyMetrics.length}
                        </div>
                        <div className="text-sm font-medium text-gray-500">registros</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Métricas Registradas</div>
                    <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (patient.bodyMetrics.length / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de peso mejorado con Plotly */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Progreso de Peso
                {patient.goals?.targetWeight && patient.goals.targetWeight > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    vs Objetivo ({patient.goals.targetWeight} kg)
                  </span>
                )}
              </h3>
              
              <ChartErrorBoundary>
                <WeightChart 
                  data={weightProgress}
                  targetWeight={patient.goals?.targetWeight}
                  loading={chartLoading.weight}
                />
              </ChartErrorBoundary>
            </div>

            {/* Gráfico de IMC con Plotly */}
            {imcProgress.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Evolución del IMC</h3>
                <ChartErrorBoundary>
                  <IMCChart 
                    data={imcProgress}
                    loading={chartLoading.imc}
                  />
                </ChartErrorBoundary>
              </div>
            )}

            {/* Gráfico de Grasa Corporal con Plotly */}
            {bodyFatProgress.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Evolución de % Grasa Corporal</h3>
                <ChartErrorBoundary>
                  <BodyFatChart 
                    data={bodyFatProgress}
                    loading={chartLoading.bodyFat}
                  />
                </ChartErrorBoundary>
              </div>
            )}
            
            {/* Formulario combinado para registrar métricas */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Nuevas Métricas</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IMC
                    {autoCalculateIMC && (
                      <span className="text-green-600 text-xs ml-1">(Auto)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="22.5"
                    value={newIMC}
                    onChange={(e) => {
                      setNewIMC(e.target.value);
                      if (e.target.value) setAutoCalculateIMC(false);
                    }}
                    className="input-field"
                    disabled={autoCalculateIMC}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    % Grasa Corporal
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="18.5"
                    value={newBodyFat}
                    onChange={(e) => setNewBodyFat(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleAddCompleteMetrics}
                    disabled={!newWeight || submittingMetrics}
                    className="btn-primary w-full"
                  >
                    {submittingMetrics ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registrando...
                      </div>
                    ) : (
                      'Registrar Métricas'
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  id="autoIMC"
                  checked={autoCalculateIMC}
                  onChange={(e) => setAutoCalculateIMC(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoIMC">
                  Calcular IMC automáticamente (altura: {patient.height} cm)
                </label>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                * Campo requerido. El IMC se calcula automáticamente basado en la altura del paciente.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Objetivos del Paciente</h3>
              {!editingGoals ? (
                <button
                  onClick={() => setEditingGoals(true)}
                  className="btn-secondary"
                >
                  Editar Objetivos
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={handleSaveGoals}
                    className="btn-primary"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingGoals(false);
                      setTempGoals(patient.goals || { targetWeight: 0, targetBodyFat: 0 });
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {editingGoals ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso objetivo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempGoals.targetWeight}
                    onChange={(e) => setTempGoals(prev => ({ ...prev, targetWeight: Number(e.target.value) }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    % Grasa corporal objetivo
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempGoals.targetBodyFat}
                    onChange={(e) => setTempGoals(prev => ({ ...prev, targetBodyFat: Number(e.target.value) }))}
                    className="input-field"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-gray-50">
                  <div className="text-2xl font-bold text-primary-600">
                    {patient.goals?.targetWeight || 0} kg
                  </div>
                  <div className="text-sm text-gray-500">Peso objetivo</div>
                </div>
                <div className="card bg-gray-50">
                  <div className="text-2xl font-bold text-primary-600">
                    {patient.goals?.targetBodyFat || 0}%
                  </div>
                  <div className="text-sm text-gray-500">% Grasa corporal objetivo</div>
                </div>
              </div>
            )}

            {/* Barra de progreso */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso hacia el objetivo</span>
                <span>{getGoalProgress().toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getGoalProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Agregar nueva nota */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Nueva Nota</h3>
              <div className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escribe una nota sobre el paciente..."
                  className="input-field min-h-[100px] resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="btn-primary"
                  >
                    Agregar Nota
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de notas */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notas del Paciente</h3>
              {patient.notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay notas aún. Agrega la primera nota para comenzar el seguimiento.
                </div>
              ) : (
                <div className="space-y-4">
                  {patient.notes
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((note, index) => (
                      <div key={index} className="border-l-4 border-primary-200 pl-4 py-3">
                        <div className="text-sm text-gray-500 mb-1">
                          {note.date.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-gray-900">{note.text}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;