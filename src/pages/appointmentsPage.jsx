import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/data/appointmentsData";
import { getPatientTable, getParents } from "@/data/patientTable";
import { createPatient, createParent } from "@/data/createPatient";
// Import pricing hook
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option,
  Textarea,
  Tabs,
  TabsHeader,
  Tab,
  Typography,
  Chip,
  Card,
  CardBody,
} from "@material-tailwind/react";
import { 
  Calendar as CalendarIcon, 
  List,
  UserPlus,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import dayjs from 'dayjs';
const AppointmentCalendar = React.lazy(() => import('./dashboard/component/AppointmentCalendar'));
const AppointmentList = React.lazy(() => import("./dashboard/component/appointmentList"));
  
import { useAppointmentPricing } from './dashboard/sitting/AppointmentPricing';

const CustomStepper = ({ activeStep, flowType, setActiveStep }) => {
  const steps = flowType === 'existing' 
    ? [
        { id: 0, label: 'Patient', icon: <User className="h-5 w-5" /> },
        { id: 1, label: 'Rendez-vous', icon: <Clock className="h-5 w-5" /> }
      ]
    : [
        { id: 0, label: 'Parent', icon: <User className="h-5 w-5" /> },
        { id: 1, label: 'Patient', icon: <User className="h-5 w-5" /> },
        { id: 2, label: 'Rendez-vous', icon: <Clock className="h-5 w-5" /> }
      ];

  return (
    <div className="w-full px-24 py-4">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center z-10">
            <button
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${activeStep >= step.id ? 'bg-blue-500 text-white' : 'bg-blue-gray-100 text-blue-gray-500'}
                ${activeStep > step.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              onClick={() => activeStep > step.id && setActiveStep(step.id)}
            >
              {step.icon}
            </button>
            <Typography
              variant="small"
              color={activeStep >= step.id ? "blue" : "blue-gray"}
              className="mt-2 text-center"
            >
              {step.label}
            </Typography>
            {index < steps.length - 1 && (
              <div className={`absolute h-1 w-1/4 top-5 transform -translate-y-1/2 
                ${activeStep > step.id ? 'bg-blue-500' : 'bg-blue-gray-100'}
                ${index === 0 ? 'left-1/4' : index === 1 ? 'left-1/2' : 'left-3/4'}`} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AppointmentsPage = () => {
  const { calculatePrice, getDuration } = useAppointmentPricing(); // Add pricing hook
  
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [activeTab, setActiveTab] = useState('calendar');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [flowType, setFlowType] = useState(null);
  const [parentSelection, setParentSelection] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [newParentForm, setNewParentForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: ''
  });
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: ''
  });
  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    time: '',
    type: 'consultation',
    status: 'confirmed',
    notes: ''
  });
  const [parentErrors, setParentErrors] = useState({});
  const [patientErrors, setPatientErrors] = useState({});
  const [appointmentErrors, setAppointmentErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeConflicts, setTimeConflicts] = useState([]); // Add conflict tracking

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appts, pts, prnts] = await Promise.all([
          getAppointments(),
          getPatientTable(),
          getParents()
        ]);
        setAppointments(appts);
        setPatients(pts);
        setParents(prnts);
      } catch {
        toast.error('Échec du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Enhanced time conflict validation
  const checkTimeConflicts = (date, time, type, excludeAppointmentId = null) => {
    const appointmentDuration = getDuration(type) || 30; // Get duration from localStorage
    const requestedStart = dayjs(`${date} ${time}`);
    const requestedEnd = requestedStart.add(appointmentDuration, 'minute');

    const conflicts = appointments.filter(appointment => {
      if (excludeAppointmentId && appointment._id === excludeAppointmentId) {
        return false; // Don't check conflict with itself when editing
      }

      const appointmentDate = dayjs(appointment.date).format('YYYY-MM-DD');
      if (appointmentDate !== date) {
        return false; // Different date, no conflict
      }

      const existingDuration = getDuration(appointment.type) || appointment.duration || 30;
      const existingStart = dayjs(`${appointmentDate} ${appointment.time}`);
      const existingEnd = existingStart.add(existingDuration, 'minute');

      // Check for overlap
      return (
        (requestedStart.isBefore(existingEnd) && requestedEnd.isAfter(existingStart)) ||
        (existingStart.isBefore(requestedEnd) && existingEnd.isAfter(requestedStart))
      );
    });

    return conflicts;
  };

  const validateParentForm = () => {
    const errors = {};
    if (!newParentForm.fullName.trim()) {
      errors.fullName = 'Le nom complet est requis';
    } else if (newParentForm.fullName.trim().length < 2) {
      errors.fullName = 'Le nom complet doit contenir au moins 2 caractères';
    }
    if (!newParentForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Le numéro de téléphone est requis';
    } else if (!/^[\+]?[\d\s\-\(\)]{8,}$/.test(newParentForm.phoneNumber.trim())) {
      errors.phoneNumber = 'Veuillez saisir un numéro de téléphone valide';
    }
    if (newParentForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newParentForm.email)) {
      errors.email = 'Veuillez saisir une adresse e-mail valide';
    }
    setParentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePatientForm = () => {
    const errors = {};
    if (!newPatientForm.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    } else if (newPatientForm.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }
    if (!newPatientForm.lastName.trim()) {
      errors.lastName = 'Le nom de famille est requis';
    } else if (newPatientForm.lastName.trim().length < 2) {
      errors.lastName = 'Le nom de famille doit contenir au moins 2 caractères';
    }
    if (!newPatientForm.birthDate) {
      errors.birthDate = 'La date de naissance est requise';
    } else {
      const birthDate = new Date(newPatientForm.birthDate);
      const today = new Date();
      if (birthDate > today) {
        errors.birthDate = 'La date de naissance ne peut pas être dans le futur';
      }
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 150) {
        errors.birthDate = 'Veuillez saisir une date de naissance valide';
      }
    }
    if (!newPatientForm.gender) {
      errors.gender = 'Le sexe est requis';
    }
    setPatientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAppointmentForm = () => {
    const errors = {};
    if (!appointmentForm.date) {
      errors.date = 'La date est requise';
    } else {
      const appointmentDate = new Date(appointmentForm.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        errors.date = 'La date du rendez-vous ne peut pas être dans le passé';
      }
    }
    if (!appointmentForm.time) {
      errors.time = 'L\'heure est requise';
    } else if (appointmentForm.date) {
      const appointmentDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
      const now = new Date();
      if (appointmentDateTime < now) {
        errors.time = 'L\'heure du rendez-vous ne peut pas être dans le passé';
      }

      // Check for time conflicts
      const conflicts = checkTimeConflicts(
        appointmentForm.date, 
        appointmentForm.time, 
        appointmentForm.type,
        selectedAppointment?._id
      );
      
      if (conflicts.length > 0) {
        errors.time = `Conflit d'horaire avec un rendez-vous existant à ${conflicts[0].time}`;
        setTimeConflicts(conflicts);
      } else {
        setTimeConflicts([]);
      }
    }
    if (!appointmentForm.type) {
      errors.type = 'Le type de rendez-vous est requis';
    }
    setAppointmentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateParent = async () => {
    if (!validateParentForm()) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    try {
      setIsSubmitting(true);
      const parent = await createParent(newParentForm);
      setParents(prev => [...prev, parent]);
      setSelectedParent(parent._id);
      toast.success('Parent créé avec succès');
      setActiveStep(1);
      setParentErrors({});
    } catch (error) {
      toast.error('Échec de la création du parent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePatient = async () => {
    if (!validatePatientForm()) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    try {
      setIsSubmitting(true);
      const patientData = {
        ...newPatientForm,
        parentId: selectedParent
      };
      const patient = await createPatient(patientData);
      setPatients(prev => [...prev, patient]);
      setSelectedPatient(patient._id);
      toast.success('Patient créé avec succès');
      setActiveStep(2);
      setPatientErrors({});
    } catch (error) {
      toast.error('Échec de la création du patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAppointment = async () => {
    if (!validateAppointmentForm()) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    if (!selectedPatient) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }

    // Final conflict check
    const conflicts = checkTimeConflicts(
      appointmentForm.date, 
      appointmentForm.time, 
      appointmentForm.type,
      selectedAppointment?._id
    );

    if (conflicts.length > 0) {
      toast.error(`Conflit d'horaire détecté ! Un autre rendez-vous existe à ${conflicts[0].time}`);
      return;
    }

    try {
      setIsSubmitting(true);
      const appointmentData = {
        ...appointmentForm,
        patientId: selectedPatient
      };
      
      if (selectedAppointment) {
        const updated = await updateAppointment(selectedAppointment._id, appointmentData);
        setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
        toast.success('Rendez-vous mis à jour avec succès');
      } else {
        const created = await createAppointment(appointmentData);
        setAppointments(prev => [...prev, created]);
        toast.success('Rendez-vous créé avec succès');
      }
      closeAllModals();
    } catch (error) {
      toast.error(`Échec de ${selectedAppointment ? 'la mise à jour' : 'la création'} du rendez-vous`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCalendarTimeSelect = (date, time) => {
    setAppointmentForm({
      ...appointmentForm,
      date: date.format('YYYY-MM-DD'),
      time
    });
    setIsPatientModalOpen(true);
    setActiveStep(0);
    setFlowType(null);
    setSelectedAppointment(null);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentForm({
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes || ''
    });
    const patient = patients.find(p => p._id === appointment.patientId);
    if (patient) {
      setSelectedPatient(patient._id);
    }
    setIsPatientModalOpen(true);
    setFlowType('existing');
    setActiveStep(1);
  };

  const handleDeleteAppointment = (appointmentId) => {
    const appointmentToDelete = appointments.find(a => a._id === appointmentId);
    setSelectedAppointment(appointmentToDelete);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAppointment(selectedAppointment._id);
      setAppointments(prev => prev.filter(a => a._id !== selectedAppointment._id));
      toast.success('Rendez-vous supprimé');
      setIsDeleteModalOpen(false);
    } catch {
      toast.error('Échec de la suppression du rendez-vous');
    }
  };

  const closeAllModals = () => {
    setIsPatientModalOpen(false);
    setIsDeleteModalOpen(false);
    setActiveStep(0);
    setFlowType(null);
    setParentSelection(null);
    setSelectedPatient(null);
    setSelectedParent(null);
    setSelectedAppointment(null);
    setIsSubmitting(false);
    setTimeConflicts([]);
    setNewParentForm({
      fullName: '',
      phoneNumber: '',
      email: '',
      address: ''
    });
    setNewPatientForm({
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: ''
    });
    setAppointmentForm({
      date: '',
      time: '',
      type: 'consultation',
      status: 'confirmed',
      notes: ''
    });
    setParentErrors({});
    setPatientErrors({});
    setAppointmentErrors({});
  };

  const canProceedToNext = () => {
    if (flowType === 'existing') {
      if (activeStep === 0) return selectedPatient;
      if (activeStep === 1) return appointmentForm.date && appointmentForm.time && Object.keys(appointmentErrors).length === 0;
    }
    if (flowType === 'new') {
      if (activeStep === 0) {
        if (parentSelection === 'existing') return selectedParent;
        if (parentSelection === 'new') {
          return newParentForm.fullName && newParentForm.phoneNumber && Object.keys(parentErrors).length === 0;
        }
      }
      if (activeStep === 1) {
        return newPatientForm.firstName && newPatientForm.lastName && 
               newPatientForm.birthDate && newPatientForm.gender && 
               Object.keys(patientErrors).length === 0;
      }
      if (activeStep === 2) {
        return appointmentForm.date && appointmentForm.time && Object.keys(appointmentErrors).length === 0;
      }
    }
    return false;
  };

  const handleParentFormChange = (field, value) => {
    setNewParentForm(prev => ({...prev, [field]: value}));
    if (parentErrors[field]) {
      setParentErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePatientFormChange = (field, value) => {
    setNewPatientForm(prev => ({...prev, [field]: value}));
    if (patientErrors[field]) {
      setPatientErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAppointmentFormChange = (field, value) => {
    setAppointmentForm(prev => ({...prev, [field]: value}));
    if (appointmentErrors[field]) {
      setAppointmentErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Re-validate when time or type changes to check for conflicts
    if (field === 'time' || field === 'type') {
      setTimeout(() => validateAppointmentForm(), 100);
    }
  };

  const handleNext = () => {
    if (flowType === 'existing') {
      if (activeStep === 0 && selectedPatient) {
        setActiveStep(1);
      }
    }
    if (flowType === 'new') {
      if (activeStep === 0) {
        if (parentSelection === 'existing' && selectedParent) {
          setActiveStep(1);
        } else if (parentSelection === 'new' && validateParentForm()) {
          handleCreateParent();
        }
      } else if (activeStep === 1 && validatePatientForm()) {
        handleCreatePatient();
      }
    }
  };

  const handleFieldBlur = (formType, field) => {
    if (formType === 'parent') validateParentForm();
    if (formType === 'patient') validatePatientForm();
    if (formType === 'appointment') validateAppointmentForm();
  };

  // Get current appointment pricing info
  const getCurrentAppointmentPrice = () => {
    if (!appointmentForm.type) return null;
    const price = calculatePrice(appointmentForm.type);
    const duration = getDuration(appointmentForm.type);
    return { price, duration };
  };

  const renderPricingInfo = () => {
    const pricingInfo = getCurrentAppointmentPrice();
    if (!pricingInfo) return null;

    return (
      <Card className="mt-4 bg-blue-50 border border-blue-200">
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Typography variant="h6" color="blue-gray">
          Informations Tarifaires
          </Typography>
        </div>
        <Chip
          value={
          <span>
            {pricingInfo.price} <span className="text-xs">MAD</span>
          </span>
          }
          color="blue"
          size="lg"
        />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <Typography variant="small" color="blue-gray" className="font-medium">
          Durée :
          </Typography>
          <Typography variant="small" color="gray">
          {pricingInfo.duration} minutes
          </Typography>
        </div>
        <div>
          <Typography variant="small" color="blue-gray" className="font-medium">
          Type :
          </Typography>
          <Typography variant="small" color="gray">
          {appointmentForm.type === 'consultation' ? 'Consultation' :
           appointmentForm.type === 'vaccination' ? 'Vaccination' :
           appointmentForm.type === 'follow-up' ? 'Suivi' : appointmentForm.type}
          </Typography>
        </div>
        </div>
      </CardBody>
      </Card>
    );
  };

  const renderConflictWarning = () => {
    if (timeConflicts.length === 0) return null;

    return (
      <Card className="mt-4 bg-red-50 border border-red-200">
        <CardBody className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <Typography variant="h6" color="red">
              Conflit d'Horaire Détecté
            </Typography>
          </div>
          <Typography variant="small" color="red" className="mb-3">
            L'horaire sélectionné entre en conflit avec des rendez-vous existants :
          </Typography>
          {timeConflicts.map((conflict, index) => {
            const patient = patients.find(p => p._id === conflict.patientId);
            const conflictDuration = getDuration(conflict.type) || 30;
            return (
              <div key={index} className="bg-white p-3 rounded border border-red-200 mb-2">
                <Typography variant="small" className="font-medium">
                  {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient Inconnu'}
                </Typography>
                <Typography variant="small" color="gray">
                  {conflict.time} - {conflict.type === 'consultation' ? 'Consultation' :
                                    conflict.type === 'vaccination' ? 'Vaccination' :
                                    conflict.type === 'follow-up' ? 'Suivi' : conflict.type} ({conflictDuration} min)
                </Typography>
              </div>
            );
          })}
        </CardBody>
      </Card>
    );
  };

  const renderFormStep = () => {
    if (flowType === null) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => setFlowType('existing')}
            className="flex flex-col items-center h-24 justify-center"
            variant="outlined"
          >
            <User className="h-6 w-6 mb-2" />
            <Typography variant="h6">Patient Existant</Typography>
          </Button>
          <Button 
            onClick={() => setFlowType('new')}
            className="flex flex-col items-center h-24 justify-center"
            variant="outlined"
          >
            <UserPlus className="h-6 w-6 mb-2" />
            <Typography variant="h6">Nouveau Patient</Typography>
          </Button>
        </div>
      );
    }
    
if (flowType === 'existing') {
  if (activeStep === 0) {
    return (
      <div className="space-y-6">
        <Typography variant="h5" className="text-gray-800 font-semibold mb-6">
          Sélectionner un Patient
        </Typography>
        <div className="space-y-2">
          <Select
            label="Sélectionner un Patient"
            value={selectedPatient}
            onChange={(value) => setSelectedPatient(value)}
            error={!selectedPatient}
            className="w-full"
            menuProps={{
              className: "max-h-36 overflow-y-auto z-50 !absolute !left-0 !top-full !w-full", // 3 items, dropdown under select, full width
              style: { zIndex: 9999 }
            }}
            containerProps={{
              className: "relative"
            }}
          >
            {patients.map(p => (
              <Option key={p._id} value={p._id} className="hover:bg-gray-50 p-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{p.firstName} {p.lastName}</span>
                </div>
              </Option>
            ))}
          </Select>
          {!selectedPatient && (
            <Typography variant="small" color="red" className="mt-2 text-red-600">
              Veuillez sélectionner un patient pour continuer
            </Typography>
          )}
        </div>
      </div>
    );
  }

  if (activeStep === 1) {
    return (
      <div className="space-y-6">
        <Typography variant="h5" className="text-gray-800 font-semibold mb-6">
          Planifier un Rendez-vous
        </Typography>
        
        {/* Date and Time Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input 
              type="date" 
              label="Date du Rendez-vous"
              value={appointmentForm.date}
              onChange={(e) => handleAppointmentFormChange('date', e.target.value)}
              onBlur={() => handleFieldBlur('appointment', 'date')}
              error={!!appointmentErrors.date}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
              required
            />
            {appointmentErrors.date && (
              <Typography variant="small" color="red" className="text-red-600">
                {appointmentErrors.date}
              </Typography>
            )}
          </div>
          
          <div className="space-y-2">
            <Input 
              type="time"
              label="Heure du Rendez-vous"
              value={appointmentForm.time}
              onChange={(e) => handleAppointmentFormChange('time', e.target.value)}
              onBlur={() => handleFieldBlur('appointment', 'time')}
              error={!!appointmentErrors.time}
              className="w-full"
              required
            />
            {appointmentErrors.time && (
              <Typography variant="small" color="red" className="text-red-600">
                {appointmentErrors.time}
              </Typography>
            )}
          </div>
        </div>

        {/* Appointment Type */}
        <div className="space-y-2">
          <Select
            label="Type de Rendez-vous"
            value={appointmentForm.type}
            onChange={(value) => handleAppointmentFormChange('type', value)}
            error={!!appointmentErrors.type}
            className="w-full"
            menuProps={{
              className: "max-h-60 overflow-y-auto z-50",
              style: { zIndex: 9999 }
            }}
            containerProps={{
              className: "relative"
            }}
            required
          >
            <Option value="consultation" className="hover:bg-gray-50 p-2">
              <div className="flex items-center space-x-2">
                <span>🩺</span>
                <span>Consultation</span>
              </div>
            </Option>
            <Option value="vaccination" className="hover:bg-gray-50 p-2">
              <div className="flex items-center space-x-2">
                <span>💉</span>
                <span>Vaccination</span>
              </div>
            </Option>
            <Option value="follow-up" className="hover:bg-gray-50 p-2">
              <div className="flex items-center space-x-2">
                <span>📋</span>
                <span>Suivi</span>
              </div>
            </Option>
          </Select>
          {appointmentErrors.type && (
            <Typography variant="small" color="red" className="text-red-600">
              {appointmentErrors.type}
            </Typography>
          )}
        </div>

        {/* Appointment Status */}
        <div className="space-y-2">
          <Select
            label="Statut du Rendez-vous"
            value={appointmentForm.status}
            onChange={(value) => handleAppointmentFormChange('status', value)}
            className="w-full"
            menuProps={{
              className: "max-h-60 overflow-y-auto z-50",
              style: { zIndex: 9999 }
            }}
            containerProps={{
              className: "relative"
            }}
          >
            <Option value="confirmed" className="hover:bg-gray-50 p-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Confirmé</span>
              </div>
            </Option>
            <Option value="pending" className="hover:bg-gray-50 p-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>En Attente</span>
              </div>
            </Option>
            <Option value="cancelled" className="hover:bg-gray-50 p-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>Annulé</span>
              </div>
            </Option>
            <Option value="completed" className="hover:bg-gray-50 p-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Terminé</span>
              </div>
            </Option>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Textarea
            label="Notes Additionnelles"
            placeholder="Saisir des notes ou instructions spéciales..."
            value={appointmentForm.notes}
            onChange={(e) => handleAppointmentFormChange('notes', e.target.value)}
            className="w-full min-h-[100px]"
            rows={4}
          />
        </div>
        
        {/* Pricing Information */}
        <div className="border-t pt-4">
          {renderPricingInfo()}
        </div>
        
        {/* Conflict Warning */}
        {renderConflictWarning && (
          <div className="border-t pt-4">
            {renderConflictWarning()}
          </div>
        )}
      </div>
    );
  }
}
    
    if (flowType === 'new') {
      if (activeStep === 0) {
        if (parentSelection === null) {
          return (
            <div className="space-y-4">
              <Typography variant="h5" className="mb-4">Sélection du Parent</Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => setParentSelection('existing')}
                  className="flex flex-col items-center h-24 justify-center"
                  variant="outlined"
                >
                  <User className="h-6 w-6 mb-2" />
                  <Typography variant="h6">Parent Existant</Typography>
                </Button>
                <Button 
                  onClick={() => setParentSelection('new')}
                  className="flex flex-col items-center h-24 justify-center"
                  variant="outlined"
                >
                  <UserPlus className="h-6 w-6 mb-2" />
                  <Typography variant="h6">Nouveau Parent</Typography>
                </Button>
              </div>
            </div>
          );
        }
        if (parentSelection === 'existing') {
          return (
            <div className="space-y-4">
              <Typography variant="h5" className="mb-4">Sélectionner un Parent</Typography>
              <Select
                label="Sélectionner un Parent"
                value={selectedParent}
                onChange={(value) => setSelectedParent(value)}
                error={!selectedParent && parentSelection === 'existing'}
              >
                {parents.map(p => (
                  <Option key={p._id} value={p._id}>
                    {p.fullName} - {p.phoneNumber}
                  </Option>
                ))}
              </Select>
              {!selectedParent && parentSelection === 'existing' && (
                <Typography variant="small" color="red" className="mt-1">
                  Veuillez sélectionner un parent
                </Typography>
              )}
            </div>
          );
        }
        if (parentSelection === 'new') {
          return (
            <div className="space-y-4">
              <Typography variant="h5" className="mb-4">Créer un Nouveau Parent</Typography>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Nom Complet *"
                    value={newParentForm.fullName}
                    onChange={(e) => handleParentFormChange('fullName', e.target.value)}
                    onBlur={() => handleFieldBlur('parent', 'fullName')}
                    error={!!parentErrors.fullName}
                  />
                  {parentErrors.fullName && (
                    <Typography variant="small" color="red" className="mt-1">
                      {parentErrors.fullName}
                    </Typography>
                  )}
                </div>
                <div>
                  <Input
                    label="Numéro de Téléphone *"
                    value={newParentForm.phoneNumber}
                    onChange={(e) => handleParentFormChange('phoneNumber', e.target.value)}
                    onBlur={() => handleFieldBlur('parent', 'phoneNumber')}
                    error={!!parentErrors.phoneNumber}
                  />
                  {parentErrors.phoneNumber && (
                    <Typography variant="small" color="red" className="mt-1">
                      {parentErrors.phoneNumber}
                    </Typography>
                  )}
                </div>
              </div>
              <div>
                <Input
                  label="E-mail"
                  type="email"
                  value={newParentForm.email}
                  onChange={(e) => handleParentFormChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('parent', 'email')}
                  error={!!parentErrors.email}
                />
                {parentErrors.email && (
                  <Typography variant="small" color="red" className="mt-1">
                    {parentErrors.email}
                  </Typography>
                )}
              </div>
              <Input
                label="Adresse"
                value={newParentForm.address}
                onChange={(e) => handleParentFormChange('address', e.target.value)}
              />
            </div>
          );
        }
      }
      if (activeStep === 1) {
        return (
          <div className="space-y-4">
            <Typography variant="h5" className="mb-4">Créer un Nouveau Patient</Typography>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Prénom *"
                  value={newPatientForm.firstName}
                  onChange={(e) => handlePatientFormChange('firstName', e.target.value)}
                  onBlur={() => handleFieldBlur('patient', 'firstName')}
                  error={!!patientErrors.firstName}
                />
                {patientErrors.firstName && (
                  <Typography variant="small" color="red" className="mt-1">
                    {patientErrors.firstName}
                  </Typography>
                )}
              </div>
              <div>
                <Input
                  label="Nom de Famille *"
                  value={newPatientForm.lastName}
                  onChange={(e) => handlePatientFormChange('lastName', e.target.value)}
                  onBlur={() => handleFieldBlur('patient', 'lastName')}
                  error={!!patientErrors.lastName}
                />
                {patientErrors.lastName && (
                  <Typography variant="small" color="red" className="mt-1">
                    {patientErrors.lastName}
                  </Typography>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="date"
                  label="Date de Naissance *"
                  value={newPatientForm.birthDate}
                  onChange={(e) => handlePatientFormChange('birthDate', e.target.value)}
                  onBlur={() => handleFieldBlur('patient', 'birthDate')}
                  error={!!patientErrors.birthDate}
                />
                {patientErrors.birthDate && (
                  <Typography variant="small" color="red" className="mt-1">
                    {patientErrors.birthDate}
                  </Typography>
                )}
              </div>
              <div>
                <Select
                  label="Sexe *"
                  value={newPatientForm.gender}
                  onChange={(value) => handlePatientFormChange('gender', value)}
                  error={!!patientErrors.gender}
                >
                  <Option value="male">Masculin</Option>
                  <Option value="female">Féminin</Option>
                </Select>
                {patientErrors.gender && (
                  <Typography variant="small" color="red" className="mt-1">
                    {patientErrors.gender}
                  </Typography>
                )}
              </div>
            </div>
          </div>
        );
      }
      if (activeStep === 2) {
        return (
          <div className="space-y-4">
            <Typography variant="h5" className="mb-4">Planifier un Rendez-vous</Typography>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input 
                  type="date"
                  label="Date *"
                  value={appointmentForm.date}
                  onChange={(e) => handleAppointmentFormChange('date', e.target.value)}
                  onBlur={() => handleFieldBlur('appointment', 'date')}
                  error={!!appointmentErrors.date}
                  min={new Date().toISOString().split('T')[0]}
                />
                {appointmentErrors.date && (
                  <Typography variant="small" color="red" className="mt-1">
                    {appointmentErrors.date}
                  </Typography>
                )}
              </div>
              <div>
                <Input 
                  type="time"
                  label="Heure *"
                  value={appointmentForm.time}
                  onChange={(e) => handleAppointmentFormChange('time', e.target.value)}
                  onBlur={() => handleFieldBlur('appointment', 'time')}
                  error={!!appointmentErrors.time}
                />
                {appointmentErrors.time && (
                  <Typography variant="small" color="red" className="mt-1">
                    {appointmentErrors.time}
                  </Typography>
                )}
              </div>
            </div>
            <div>
              <Select
                label="Type *"
                value={appointmentForm.type}
                onChange={(value) => handleAppointmentFormChange('type', value)}
                error={!!appointmentErrors.type}
              >
                <Option value="consultation">Consultation</Option>
                <Option value="vaccination">Vaccination</Option>
                <Option value="follow-up">Suivi</Option>
              </Select>
              {appointmentErrors.type && (
                <Typography variant="small" color="red" className="mt-1">
                  {appointmentErrors.type}
                </Typography>
              )}
            </div>
            <Select
              label="Statut"
              value={appointmentForm.status}
              onChange={(value) => handleAppointmentFormChange('status', value)}
            >
              <Option value="confirmed">Confirmé</Option>
              <Option value="pending">En Attente</Option>
              <Option value="cancelled">Annulé</Option>
              <Option value="completed">Terminé</Option>
            </Select>
            <Textarea
              label="Notes"
              value={appointmentForm.notes}
              onChange={(e) => handleAppointmentFormChange('notes', e.target.value)}
            />
            
            {/* Pricing Information */}
            {renderPricingInfo()}
            
            {/* Conflict Warning */}
            {renderConflictWarning()}
          </div>
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Typography variant="h5">Chargement des rendez-vous...</Typography>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h3">Rendez-vous</Typography>
        <Button
          className="flex items-center gap-2"
          onClick={() => {
            setIsPatientModalOpen(true);
            setActiveStep(0);
            setFlowType(null);
            setSelectedAppointment(null);
          }}
        >
          <UserPlus size={18} /> Nouveau Rendez-vous
        </Button>
      </div>
      
      <Tabs value={activeTab} className="mb-6">
        <TabsHeader>
          <Tab value="calendar" onClick={() => setActiveTab('calendar')}>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" /> Calendrier
            </div>
          </Tab>
          <Tab value="list" onClick={() => setActiveTab('list')}>
            <div className="flex items-center gap-2">
              <List className="h-5 w-5" /> Vue Liste
            </div>
          </Tab>
        </TabsHeader>
      </Tabs>
      
      {activeTab === 'calendar' && (
        <AppointmentCalendar
          appointments={appointments}
          patients={patients}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onTimeSelect={handleCalendarTimeSelect}
          onEditAppointment={handleEditAppointment}
        />
      )}
      
      {activeTab === 'list' && (
        <AppointmentList
          appointments={appointments}
          patients={patients}
          onEditAppointment={handleEditAppointment}
          onDeleteAppointment={handleDeleteAppointment}
        />
      )}
      
      <Dialog open={isPatientModalOpen} handler={closeAllModals} size="xl">
        <DialogHeader>
          {flowType && (
            <CustomStepper 
              activeStep={activeStep} 
              flowType={flowType}
              setActiveStep={setActiveStep}
            />
          )}
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          {renderFormStep()}
        </DialogBody>
        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {activeStep > 0 && flowType && (
                <Button
                  variant="text"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="mr-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Retour
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="text"
                color="red"
                onClick={closeAllModals}
                className="mr-1"
              >
                Annuler
              </Button>
              {flowType === 'existing' && activeStep === 1 && (
                <Button 
                  color="blue" 
                  onClick={handleSubmitAppointment}
                  disabled={!canProceedToNext() || isSubmitting || timeConflicts.length > 0}
                  loading={isSubmitting}
                >
                  {selectedAppointment ? 'Mettre à Jour le Rendez-vous' : 'Créer le Rendez-vous'}
                </Button>
              )}
              {flowType === 'new' && activeStep === 2 && (
                <Button 
                  color="blue" 
                  onClick={handleSubmitAppointment}
                  disabled={!canProceedToNext() || isSubmitting || timeConflicts.length > 0}
                  loading={isSubmitting}
                >
                  Créer le Rendez-vous
                </Button>
              )}
              {((flowType === 'existing' && activeStep === 0) || 
                (flowType === 'new' && activeStep < 2)) && (
                <Button 
                  color="blue" 
                  onClick={handleNext}
                  disabled={!canProceedToNext() || isSubmitting}
                  loading={isSubmitting && ((flowType === 'new' && activeStep === 0 && parentSelection === 'new') || 
                           (flowType === 'new' && activeStep === 1))}
                >
                  {(flowType === 'new' && activeStep === 0 && parentSelection === 'new') ? 'Créer le Parent' :
                   (flowType === 'new' && activeStep === 1) ? 'Créer le Patient' : 'Suivant'}
                  {!(isSubmitting && ((flowType === 'new' && activeStep === 0 && parentSelection === 'new') || 
                                     (flowType === 'new' && activeStep === 1))) && (
                    <ChevronRight className="h-4 w-4 ml-1" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </Dialog>
      
      <Dialog open={isDeleteModalOpen} handler={() => setIsDeleteModalOpen(false)} size="sm">
        <DialogHeader>Confirmer la Suppression</DialogHeader>
        <DialogBody>
          Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action ne peut pas être annulée.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            onClick={() => setIsDeleteModalOpen(false)}
            className="mr-1"
          >
            Annuler
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Supprimer
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default AppointmentsPage;


// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import {
//   getAppointments,
//   createAppointment,
//   updateAppointment,
//   deleteAppointment,
// } from "@/data/appointmentsData";
// import { getPatientTable, getParents } from "@/data/patientTable";
// import { createPatient, createParent } from "@/data/createPatient";
// import {
//   Button,
//   Dialog,
//   DialogHeader,
//   DialogBody,
//   DialogFooter,
//   Input,
//   Select,
//   Option,
//   Textarea,
//   Tabs,
//   TabsHeader,
//   Tab,
//   Typography,
// } from "@material-tailwind/react";
// import { 
//   Calendar as CalendarIcon, 
//   List,
//   UserPlus,
//   Clock,
//   User,
//   ChevronLeft,
//   ChevronRight
// } from 'lucide-react';
// import dayjs from 'dayjs';
// import AppointmentCalendar from './dashboard/componet/AppointmentCalendar';
// import AppointmentList from './dashboard/componet/AppointmentList';

// const CustomStepper = ({ activeStep, flowType, setActiveStep }) => {
//   const steps = flowType === 'existing' 
//     ? [
//         { id: 0, label: 'Patient', icon: <User className="h-5 w-5" /> },
//         { id: 1, label: 'Rendez-vous', icon: <Clock className="h-5 w-5" /> }
//       ]
//     : [
//         { id: 0, label: 'Parent', icon: <User className="h-5 w-5" /> },
//         { id: 1, label: 'Patient', icon: <User className="h-5 w-5" /> },
//         { id: 2, label: 'Rendez-vous', icon: <Clock className="h-5 w-5" /> }
//       ];

//   return (
//     <div className="w-full px-24 py-4">
//       <div className="flex items-center justify-between relative">
//         {steps.map((step, index) => (
//           <div key={step.id} className="flex flex-col items-center z-10">
//             <button
//               className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
//                 ${activeStep >= step.id ? 'bg-blue-500 text-white' : 'bg-blue-gray-100 text-blue-gray-500'}
//                 ${activeStep > step.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
//               onClick={() => activeStep > step.id && setActiveStep(step.id)}
//             >
//               {step.icon}
//             </button>
//             <Typography
//               variant="small"
//               color={activeStep >= step.id ? "blue" : "blue-gray"}
//               className="mt-2 text-center"
//             >
//               {step.label}
//             </Typography>
//             {index < steps.length - 1 && (
//               <div className={`absolute h-1 w-1/4 top-5 transform -translate-y-1/2 
//                 ${activeStep > step.id ? 'bg-blue-500' : 'bg-blue-gray-100'}
//                 ${index === 0 ? 'left-1/4' : index === 1 ? 'left-1/2' : 'left-3/4'}`} 
//               />
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// const AppointmentsPage = () => {
//   const [appointments, setAppointments] = useState([]);
//   const [patients, setPatients] = useState([]);
//   const [parents, setParents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDate, setCurrentDate] = useState(dayjs());
//   const [activeTab, setActiveTab] = useState('calendar');
//   const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [activeStep, setActiveStep] = useState(0);
//   const [flowType, setFlowType] = useState(null);
//   const [parentSelection, setParentSelection] = useState(null);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [selectedParent, setSelectedParent] = useState(null);
//   const [newParentForm, setNewParentForm] = useState({
//     fullName: '',
//     phoneNumber: '',
//     email: '',
//     address: ''
//   });
//   const [newPatientForm, setNewPatientForm] = useState({
//     firstName: '',
//     lastName: '',
//     birthDate: '',
//     gender: ''
//   });
//   const [appointmentForm, setAppointmentForm] = useState({
//     date: '',
//     time: '',
//     type: 'consultation',
//     status: 'confirmed',
//     notes: ''
//   });
//   const [parentErrors, setParentErrors] = useState({});
//   const [patientErrors, setPatientErrors] = useState({});
//   const [appointmentErrors, setAppointmentErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const [appts, pts, prnts] = await Promise.all([
//           getAppointments(),
//           getPatientTable(),
//           getParents()
//         ]);
//         setAppointments(appts);
//         setPatients(pts);
//         setParents(prnts);
//       } catch {
//         toast.error('Failed to load data');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const validateParentForm = () => {
//     const errors = {};
//     if (!newParentForm.fullName.trim()) {
//       errors.fullName = 'Full name is required';
//     } else if (newParentForm.fullName.trim().length < 2) {
//       errors.fullName = 'Full name must be at least 2 characters';
//     }
//     if (!newParentForm.phoneNumber.trim()) {
//       errors.phoneNumber = 'Phone number is required';
//     } else if (!/^[\+]?[\d\s\-\(\)]{8,}$/.test(newParentForm.phoneNumber.trim())) {
//       errors.phoneNumber = 'Please enter a valid phone number';
//     }
//     if (newParentForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newParentForm.email)) {
//       errors.email = 'Please enter a valid email address';
//     }
//     setParentErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const validatePatientForm = () => {
//     const errors = {};
//     if (!newPatientForm.firstName.trim()) {
//       errors.firstName = 'First name is required';
//     } else if (newPatientForm.firstName.trim().length < 2) {
//       errors.firstName = 'First name must be at least 2 characters';
//     }
//     if (!newPatientForm.lastName.trim()) {
//       errors.lastName = 'Last name is required';
//     } else if (newPatientForm.lastName.trim().length < 2) {
//       errors.lastName = 'Last name must be at least 2 characters';
//     }
//     if (!newPatientForm.birthDate) {
//       errors.birthDate = 'Birth date is required';
//     } else {
//       const birthDate = new Date(newPatientForm.birthDate);
//       const today = new Date();
//       if (birthDate > today) {
//         errors.birthDate = 'Birth date cannot be in the future';
//       }
//       const age = today.getFullYear() - birthDate.getFullYear();
//       if (age > 150) {
//         errors.birthDate = 'Please enter a valid birth date';
//       }
//     }
//     if (!newPatientForm.gender) {
//       errors.gender = 'Gender is required';
//     }
//     setPatientErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const validateAppointmentForm = () => {
//     const errors = {};
//     if (!appointmentForm.date) {
//       errors.date = 'Date is required';
//     } else {
//       const appointmentDate = new Date(appointmentForm.date);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       if (appointmentDate < today) {
//         errors.date = 'Appointment date cannot be in the past';
//       }
//     }
//     if (!appointmentForm.time) {
//       errors.time = 'Time is required';
//     } else if (appointmentForm.date) {
//       const appointmentDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
//       const now = new Date();
//       if (appointmentDateTime < now) {
//         errors.time = 'Appointment time cannot be in the past';
//       }
//     }
//     if (!appointmentForm.type) {
//       errors.type = 'Appointment type is required';
//     }
//     setAppointmentErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleCreateParent = async () => {
//     if (!validateParentForm()) {
//       toast.error('Please fix the validation errors');
//       return;
//     }
//     try {
//       setIsSubmitting(true);
//       const parent = await createParent(newParentForm);
//       setParents(prev => [...prev, parent]);
//       setSelectedParent(parent._id);
//       toast.success('Parent created successfully');
//       setActiveStep(1);
//       setParentErrors({});
//     } catch (error) {
//       toast.error('Failed to create parent');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleCreatePatient = async () => {
//     if (!validatePatientForm()) {
//       toast.error('Please fix the validation errors');
//       return;
//     }
//     try {
//       setIsSubmitting(true);
//       const patientData = {
//         ...newPatientForm,
//         parentId: selectedParent
//       };
//       const patient = await createPatient(patientData);
//       setPatients(prev => [...prev, patient]);
//       setSelectedPatient(patient._id);
//       toast.success('Patient created successfully');
//       setActiveStep(2);
//       setPatientErrors({});
//     } catch (error) {
//       toast.error('Failed to create patient');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSubmitAppointment = async () => {
//     if (!validateAppointmentForm()) {
//       toast.error('Please fix the validation errors');
//       return;
//     }
//     if (!selectedPatient) {
//       toast.error('Please select a patient');
//       return;
//     }
//     try {
//       setIsSubmitting(true);
//       const appointmentData = {
//         ...appointmentForm,
//         patientId: selectedPatient
//       };
//       if (selectedAppointment) {
//         const updated = await updateAppointment(selectedAppointment._id, appointmentData);
//         setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
//         toast.success('Appointment updated successfully');
//       } else {
//         const created = await createAppointment(appointmentData);
//         setAppointments(prev => [...prev, created]);
//         toast.success('Appointment created successfully');
//       }
//       closeAllModals();
//     } catch (error) {
//       toast.error(`Failed to ${selectedAppointment ? 'update' : 'create'} appointment`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleCalendarTimeSelect = (date, time) => {
//     setAppointmentForm({
//       ...appointmentForm,
//       date: date.format('YYYY-MM-DD'),
//       time
//     });
//     setIsPatientModalOpen(true);
//     setActiveStep(0);
//     setFlowType(null);
//     setSelectedAppointment(null);
//   };

//   const handleEditAppointment = (appointment) => {
//     setSelectedAppointment(appointment);
//     setAppointmentForm({
//       date: appointment.date,
//       time: appointment.time,
//       type: appointment.type,
//       status: appointment.status,
//       notes: appointment.notes || ''
//     });
//     const patient = patients.find(p => p._id === appointment.patientId);
//     if (patient) {
//       setSelectedPatient(patient._id);
//     }
//     setIsPatientModalOpen(true);
//     setFlowType('existing');
//     setActiveStep(1);
//   };

//   const handleDeleteAppointment = (appointmentId) => {
//     const appointmentToDelete = appointments.find(a => a._id === appointmentId);
//     setSelectedAppointment(appointmentToDelete);
//     setIsDeleteModalOpen(true);
//   };

//   const confirmDelete = async () => {
//     try {
//       await deleteAppointment(selectedAppointment._id);
//       setAppointments(prev => prev.filter(a => a._id !== selectedAppointment._id));
//       toast.success('Appointment deleted');
//       setIsDeleteModalOpen(false);
//     } catch {
//       toast.error('Failed to delete appointment');
//     }
//   };

//   const closeAllModals = () => {
//     setIsPatientModalOpen(false);
//     setIsDeleteModalOpen(false);
//     setActiveStep(0);
//     setFlowType(null);
//     setParentSelection(null);
//     setSelectedPatient(null);
//     setSelectedParent(null);
//     setSelectedAppointment(null);
//     setIsSubmitting(false);
//     setNewParentForm({
//       fullName: '',
//       phoneNumber: '',
//       email: '',
//       address: ''
//     });
//     setNewPatientForm({
//       firstName: '',
//       lastName: '',
//       birthDate: '',
//       gender: ''
//     });
//     setAppointmentForm({
//       date: '',
//       time: '',
//       type: 'consultation',
//       status: 'confirmed',
//       notes: ''
//     });
//     setParentErrors({});
//     setPatientErrors({});
//     setAppointmentErrors({});
//   };

//   const canProceedToNext = () => {
//     if (flowType === 'existing') {
//       if (activeStep === 0) return selectedPatient;
//       if (activeStep === 1) return appointmentForm.date && appointmentForm.time && Object.keys(appointmentErrors).length === 0;
//     }
//     if (flowType === 'new') {
//       if (activeStep === 0) {
//         if (parentSelection === 'existing') return selectedParent;
//         if (parentSelection === 'new') {
//           return newParentForm.fullName && newParentForm.phoneNumber && Object.keys(parentErrors).length === 0;
//         }
//       }
//       if (activeStep === 1) {
//         return newPatientForm.firstName && newPatientForm.lastName && 
//                newPatientForm.birthDate && newPatientForm.gender && 
//                Object.keys(patientErrors).length === 0;
//       }
//       if (activeStep === 2) {
//         return appointmentForm.date && appointmentForm.time && Object.keys(appointmentErrors).length === 0;
//       }
//     }
//     return false;
//   };

//   const handleParentFormChange = (field, value) => {
//     setNewParentForm(prev => ({...prev, [field]: value}));
//     if (parentErrors[field]) {
//       setParentErrors(prev => {
//         const newErrors = {...prev};
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//   };

//   const handlePatientFormChange = (field, value) => {
//     setNewPatientForm(prev => ({...prev, [field]: value}));
//     if (patientErrors[field]) {
//       setPatientErrors(prev => {
//         const newErrors = {...prev};
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//   };

//   const handleAppointmentFormChange = (field, value) => {
//     setAppointmentForm(prev => ({...prev, [field]: value}));
//     if (appointmentErrors[field]) {
//       setAppointmentErrors(prev => {
//         const newErrors = {...prev};
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//   };

//   const handleNext = () => {
//     if (flowType === 'existing') {
//       if (activeStep === 0 && selectedPatient) {
//         setActiveStep(1);
//       }
//     }
//     if (flowType === 'new') {
//       if (activeStep === 0) {
//         if (parentSelection === 'existing' && selectedParent) {
//           setActiveStep(1);
//         } else if (parentSelection === 'new' && validateParentForm()) {
//           handleCreateParent();
//         }
//       } else if (activeStep === 1 && validatePatientForm()) {
//         handleCreatePatient();
//       }
//     }
//   };

//   const handleFieldBlur = (formType, field) => {
//     if (formType === 'parent') validateParentForm();
//     if (formType === 'patient') validatePatientForm();
//     if (formType === 'appointment') validateAppointmentForm();
//   };

//   const renderFormStep = () => {
//     if (flowType === null) {
//       return (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Button 
//             onClick={() => setFlowType('existing')}
//             className="flex flex-col items-center h-24 justify-center"
//             variant="outlined"
//           >
//             <User className="h-6 w-6 mb-2" />
//             <Typography variant="h6">Existing Patient</Typography>
//           </Button>
//           <Button 
//             onClick={() => setFlowType('new')}
//             className="flex flex-col items-center h-24 justify-center"
//             variant="outlined"
//           >
//             <UserPlus className="h-6 w-6 mb-2" />
//             <Typography variant="h6">New Patient</Typography>
//           </Button>
//         </div>
//       );
//     }
//     if (flowType === 'existing') {
//       if (activeStep === 0) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Select Patient</Typography>
//             <Select 
//               label="Select Patient"
//               value={selectedPatient}
//               onChange={(value) => setSelectedPatient(value)}
//               error={!selectedPatient}
//             >
//               {patients.map(p => (
//                 <Option key={p._id} value={p._id}>
//                   {p.firstName} {p.lastName}
//                 </Option>
//               ))}
//             </Select>
//             {!selectedPatient && (
//               <Typography variant="small" color="red" className="mt-1">
//                 Please select a patient
//               </Typography>
//             )}
//           </div>
//         );
//       }
//       if (activeStep === 1) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Schedule Appointment</Typography>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Input 
//                   type="date" 
//                   label="Date *"
//                   value={appointmentForm.date}
//                   onChange={(e) => handleAppointmentFormChange('date', e.target.value)}
//                   onBlur={() => handleFieldBlur('appointment', 'date')}
//                   error={!!appointmentErrors.date}
//                   min={new Date().toISOString().split('T')[0]}
//                 />
//                 {appointmentErrors.date && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {appointmentErrors.date}
//                   </Typography>
//                 )}
//               </div>
//               <div>
//                 <Input 
//                   type="time"
//                   label="Time *"
//                   value={appointmentForm.time}
//                   onChange={(e) => handleAppointmentFormChange('time', e.target.value)}
//                   onBlur={() => handleFieldBlur('appointment', 'time')}
//                   error={!!appointmentErrors.time}
//                 />
//                 {appointmentErrors.time && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {appointmentErrors.time}
//                   </Typography>
//                 )}
//               </div>
//             </div>
//             <div>
//               <Select
//                 label="Type *"
//                 value={appointmentForm.type}
//                 onChange={(value) => handleAppointmentFormChange('type', value)}
//                 error={!!appointmentErrors.type}
//               >
//                 <Option value="consultation">Consultation</Option>
//                 <Option value="vaccination">Vaccination</Option>
//                 <Option value="follow-up">Surgery</Option>
//               </Select>
//               {appointmentErrors.type && (
//                 <Typography variant="small" color="red" className="mt-1">
//                   {appointmentErrors.type}
//                 </Typography>
//               )}
//             </div>
//             <Select
//               label="Status"
//               value={appointmentForm.status}
//               onChange={(value) => handleAppointmentFormChange('status', value)}
//             >
//               <Option value="confirmed">Confirmed</Option>
//               <Option value="pending">Pending</Option>
//               <Option value="cancelled">Cancelled</Option>
//               <Option value="completed">Completed</Option>
              
//             </Select>
//             <Textarea
//               label="Notes"
//               value={appointmentForm.notes}
//               onChange={(e) => handleAppointmentFormChange('notes', e.target.value)}
//             />
//           </div>
//         );
//       }
//     }
//     if (flowType === 'new') {
//       if (activeStep === 0) {
//         if (parentSelection === null) {
//           return (
//             <div className="space-y-4">
//               <Typography variant="h5" className="mb-4">Parent Selection</Typography>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <Button 
//                   onClick={() => setParentSelection('existing')}
//                   className="flex flex-col items-center h-24 justify-center"
//                   variant="outlined"
//                 >
//                   <User className="h-6 w-6 mb-2" />
//                   <Typography variant="h6">Existing Parent</Typography>
//                 </Button>
//                 <Button 
//                   onClick={() => setParentSelection('new')}
//                   className="flex flex-col items-center h-24 justify-center"
//                   variant="outlined"
//                 >
//                   <UserPlus className="h-6 w-6 mb-2" />
//                   <Typography variant="h6">New Parent</Typography>
//                 </Button>
//               </div>
//             </div>
//           );
//         }
//         if (parentSelection === 'existing') {
//           return (
//             <div className="space-y-4">
//               <Typography variant="h5" className="mb-4">Select Parent</Typography>
//               <Select
//                 label="Select Parent"
//                 value={selectedParent}
//                 onChange={(value) => setSelectedParent(value)}
//                 error={!selectedParent && parentSelection === 'existing'}
//               >
//                 {parents.map(p => (
//                   <Option key={p._id} value={p._id}>
//                     {p.fullName} - {p.phoneNumber}
//                   </Option>
//                 ))}
//               </Select>
//               {!selectedParent && parentSelection === 'existing' && (
//                 <Typography variant="small" color="red" className="mt-1">
//                   Please select a parent
//                 </Typography>
//               )}
//             </div>
//           );
//         }
//         if (parentSelection === 'new') {
//           return (
//             <div className="space-y-4">
//               <Typography variant="h5" className="mb-4">Create New Parent</Typography>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Input
//                     label="Full Name *"
//                     value={newParentForm.fullName}
//                     onChange={(e) => handleParentFormChange('fullName', e.target.value)}
//                     onBlur={() => handleFieldBlur('parent', 'fullName')}
//                     error={!!parentErrors.fullName}
//                   />
//                   {parentErrors.fullName && (
//                     <Typography variant="small" color="red" className="mt-1">
//                       {parentErrors.fullName}
//                     </Typography>
//                   )}
//                 </div>
//                 <div>
//                   <Input
//                     label="Phone Number *"
//                     value={newParentForm.phoneNumber}
//                     onChange={(e) => handleParentFormChange('phoneNumber', e.target.value)}
//                     onBlur={() => handleFieldBlur('parent', 'phoneNumber')}
//                     error={!!parentErrors.phoneNumber}
//                   />
//                   {parentErrors.phoneNumber && (
//                     <Typography variant="small" color="red" className="mt-1">
//                       {parentErrors.phoneNumber}
//                     </Typography>
//                   )}
//                 </div>
//               </div>
//               <div>
//                 <Input
//                   label="Email"
//                   type="email"
//                   value={newParentForm.email}
//                   onChange={(e) => handleParentFormChange('email', e.target.value)}
//                   onBlur={() => handleFieldBlur('parent', 'email')}
//                   error={!!parentErrors.email}
//                 />
//                 {parentErrors.email && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {parentErrors.email}
//                   </Typography>
//                 )}
//               </div>
//               <Input
//                 label="Address"
//                 value={newParentForm.address}
//                 onChange={(e) => handleParentFormChange('address', e.target.value)}
//               />
//             </div>
//           );
//         }
//       }
//       if (activeStep === 1) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Create New Patient</Typography>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Input
//                   label="First Name *"
//                   value={newPatientForm.firstName}
//                   onChange={(e) => handlePatientFormChange('firstName', e.target.value)}
//                   onBlur={() => handleFieldBlur('patient', 'firstName')}
//                   error={!!patientErrors.firstName}
//                 />
//                 {patientErrors.firstName && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {patientErrors.firstName}
//                   </Typography>
//                 )}
//               </div>
//               <div>
//                 <Input
//                   label="Last Name *"
//                   value={newPatientForm.lastName}
//                   onChange={(e) => handlePatientFormChange('lastName', e.target.value)}
//                   onBlur={() => handleFieldBlur('patient', 'lastName')}
//                   error={!!patientErrors.lastName}
//                 />
//                 {patientErrors.lastName && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {patientErrors.lastName}
//                   </Typography>
//                 )}
//               </div>
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Input
//                   type="date"
//                   label="Birth Date *"
//                   value={newPatientForm.birthDate}
//                   onChange={(e) => handlePatientFormChange('birthDate', e.target.value)}
//                   onBlur={() => handleFieldBlur('patient', 'birthDate')}
//                   error={!!patientErrors.birthDate}
//                 />
//                 {patientErrors.birthDate && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {patientErrors.birthDate}
//                   </Typography>
//                 )}
//               </div>
//               <div>
//                 <Select
//                   label="Gender *"
//                   value={newPatientForm.gender}
//                   onChange={(value) => handlePatientFormChange('gender', value)}
//                   error={!!patientErrors.gender}
//                 >
//                   <Option value="male">Male</Option>
//                   <Option value="female">Female</Option>
//                 </Select>
//                 {patientErrors.gender && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {patientErrors.gender}
//                   </Typography>
//                 )}
//               </div>
//             </div>
//           </div>
//         );
//       }
//       if (activeStep === 2) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Schedule Appointment</Typography>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Input 
//                   type="date"
//                   label="Date *"
//                   value={appointmentForm.date}
//                   onChange={(e) => handleAppointmentFormChange('date', e.target.value)}
//                   onBlur={() => handleFieldBlur('appointment', 'date')}
//                   error={!!appointmentErrors.date}
//                   min={new Date().toISOString().split('T')[0]}
//                 />
//                 {appointmentErrors.date && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {appointmentErrors.date}
//                   </Typography>
//                 )}
//               </div>
//               <div>
//                 <Input 
//                   type="time"
//                   label="Time *"
//                   value={appointmentForm.time}
//                   onChange={(e) => handleAppointmentFormChange('time', e.target.value)}
//                   onBlur={() => handleFieldBlur('appointment', 'time')}
//                   error={!!appointmentErrors.time}
//                 />
//                 {appointmentErrors.time && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {appointmentErrors.time}
//                   </Typography>
//                 )}
//               </div>
//             </div>
//             <div>
//               <Select
//                 label="Type *"
//                 value={appointmentForm.type}
//                 onChange={(value) => handleAppointmentFormChange('type', value)}
//                 error={!!appointmentErrors.type}
//               >
//                 <Option value="consultation">Consultation</Option>
//                 <Option value="vaccination">Vaccination</Option>
//                 <Option value="follow-up">Follow-up</Option>
//               </Select>
//               {appointmentErrors.type && (
//                 <Typography variant="small" color="red" className="mt-1">
//                   {appointmentErrors.type}
//                 </Typography>
//               )}
//             </div>
//             <Select
//               label="Status"
//               value={appointmentForm.status}
//               onChange={(value) => handleAppointmentFormChange('status', value)}
//             >
//               <Option value="confirmed">Confirmed</Option>
//               <Option value="pending">Pending</Option>
//               <Option value="cancelled">Cancelled</Option>
//                <Option value="completed">Completed</Option>
//             </Select>
//             <Textarea
//               label="Notes"
//               value={appointmentForm.notes}
//               onChange={(e) => handleAppointmentFormChange('notes', e.target.value)}
//             />
//           </div>
//         );
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <Typography variant="h5">Loading appointments...</Typography>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto px-4 py-6">
//       <div className="flex justify-between items-center mb-6">
//         <Typography variant="h3">Appointments</Typography>
//         <Button
//           className="flex items-center gap-2"
//           onClick={() => {
//             setIsPatientModalOpen(true);
//             setActiveStep(0);
//             setFlowType(null);
//             setSelectedAppointment(null);
//           }}
//         >
//           <UserPlus size={18} /> New Appointment
//         </Button>
//       </div>
//       <Tabs value={activeTab} className="mb-6">
//         <TabsHeader>
//           <Tab value="calendar" onClick={() => setActiveTab('calendar')}>
//             <div className="flex items-center gap-2">
//               <CalendarIcon className="h-5 w-5" /> Calendar
//             </div>
//           </Tab>
//           <Tab value="list" onClick={() => setActiveTab('list')}>
//             <div className="flex items-center gap-2">
//               <List className="h-5 w-5" /> List View
//             </div>
//           </Tab>
//         </TabsHeader>
//       </Tabs>
//       {activeTab === 'calendar' && (
//         <AppointmentCalendar
//           appointments={appointments}
//           patients={patients}
//           currentDate={currentDate}
//           onDateChange={setCurrentDate}
//           onTimeSelect={handleCalendarTimeSelect}
//           onEditAppointment={handleEditAppointment}
//         />
//       )}
//       {activeTab === 'list' && (
//         <AppointmentList
//           appointments={appointments}
//           patients={patients}
//           onEditAppointment={handleEditAppointment}
//           onDeleteAppointment={handleDeleteAppointment}
//         />
//       )}
//       <Dialog open={isPatientModalOpen} handler={closeAllModals} size="xl">
//         <DialogHeader>
//           {flowType && (
//             <CustomStepper 
//               activeStep={activeStep} 
//               flowType={flowType}
//               setActiveStep={setActiveStep}
//             />
//           )}
//         </DialogHeader>
//         <DialogBody>
//           {renderFormStep()}
//         </DialogBody>
//         <DialogFooter>
//           <div className="flex justify-between w-full">
//             <div>
//               {activeStep > 0 && flowType && (
//                 <Button
//                   variant="text"
//                   onClick={() => setActiveStep(activeStep - 1)}
//                   className="mr-1"
//                 >
//                   <ChevronLeft className="h-4 w-4 mr-1" />
//                   Back
//                 </Button>
//               )}
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 variant="text"
//                 color="red"
//                 onClick={closeAllModals}
//                 className="mr-1"
//               >
//                 Cancel
//               </Button>
//               {flowType === 'existing' && activeStep === 1 && (
//                 <Button 
//                   color="blue" 
//                   onClick={handleSubmitAppointment}
//                   disabled={!canProceedToNext() || isSubmitting}
//                   loading={isSubmitting}
//                 >
//                   {selectedAppointment ? 'Update Appointment' : 'Create Appointment'}
//                 </Button>
//               )}
//               {flowType === 'new' && activeStep === 2 && (
//                 <Button 
//                   color="blue" 
//                   onClick={handleSubmitAppointment}
//                   disabled={!canProceedToNext() || isSubmitting}
//                   loading={isSubmitting}
//                 >
//                   Create Appointment
//                 </Button>
//               )}
//               {((flowType === 'existing' && activeStep === 0) || 
//                 (flowType === 'new' && activeStep < 2)) && (
//                 <Button 
//                   color="blue" 
//                   onClick={handleNext}
//                   disabled={!canProceedToNext() || isSubmitting}
//                   loading={isSubmitting && ((flowType === 'new' && activeStep === 0 && parentSelection === 'new') || 
//                            (flowType === 'new' && activeStep === 1))}
//                 >
//                   {(flowType === 'new' && activeStep === 0 && parentSelection === 'new') ? 'Create Parent' :
//                    (flowType === 'new' && activeStep === 1) ? 'Create Patient' : 'Next'}
//                   {!(isSubmitting && ((flowType === 'new' && activeStep === 0 && parentSelection === 'new') || 
//                                      (flowType === 'new' && activeStep === 1))) && (
//                     <ChevronRight className="h-4 w-4 ml-1" />
//                   )}
//                 </Button>
//               )}
//             </div>
//           </div>
//         </DialogFooter>
//       </Dialog>
//       <Dialog open={isDeleteModalOpen} handler={() => setIsDeleteModalOpen(false)} size="sm">
//         <DialogHeader>Confirm Deletion</DialogHeader>
//         <DialogBody>
//           Are you sure you want to delete this appointment? This action cannot be undone.
//         </DialogBody>
//         <DialogFooter>
//           <Button
//             variant="text"
//             onClick={() => setIsDeleteModalOpen(false)}
//             className="mr-1"
//           >
//             Cancel
//           </Button>
//           <Button color="red" onClick={confirmDelete}>
//             Delete
//           </Button>
//         </DialogFooter>
//       </Dialog>
//     </div>
//   );
// };

// export default AppointmentsPage;


// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import {
//   getAppointments,
//   createAppointment,
//   updateAppointment,
//   deleteAppointment,
// } from "@/data/appointmentsData";
// import { getPatientTable, getParents } from "@/data/patientTable";
// import { createPatient, createParent } from "@/data/createPatient";
// // Import pricing hook
// import {
//   Button,
//   Dialog,
//   DialogHeader,
//   DialogBody,
//   DialogFooter,
//   Input,
//   Select,
//   Option,
//   Textarea,
//   Tabs,
//   TabsHeader,
//   Tab,
//   Typography,
//   Chip,
//   Card,
//   CardBody,
// } from "@material-tailwind/react";
// import { 
//   Calendar as CalendarIcon, 
//   List,
//   UserPlus,
//   Clock,
//   User,
//   ChevronLeft,
//   ChevronRight,
//   DollarSign,
//   AlertTriangle
// } from 'lucide-react';
// import dayjs from 'dayjs';
// import AppointmentCalendar from './dashboard/componet/AppointmentCalendar';
// import AppointmentList from './dashboard/componet/AppointmentList';
// import { useAppointmentPricing } from './dashboard/sitting/AppointmentPricing';

// const CustomStepper = ({ activeStep, flowType, setActiveStep }) => {
//   const steps = flowType === 'existing' 
//     ? [
//         { id: 0, label: 'Patient', icon: <User className="h-5 w-5" /> },
//         { id: 1, label: 'Rendez-vous', icon: <Clock className="h-5 w-5" /> }
//       ]
//     : [
//         { id: 0, label: 'Parent', icon: <User className="h-5 w-5" /> },
//         { id: 1, label: 'Patient', icon: <User className="h-5 w-5" /> },
//         { id: 2, label: 'Rendez-vous', icon: <Clock className="h-5 w-5" /> }
//       ];

//   return (
//     <div className="w-full px-24 py-4">
//       <div className="flex items-center justify-between relative">
//         {steps.map((step, index) => (
//           <div key={step.id} className="flex flex-col items-center z-10">
//             <button
//               className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
//                 ${activeStep >= step.id ? 'bg-blue-500 text-white' : 'bg-blue-gray-100 text-blue-gray-500'}
//                 ${activeStep > step.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
//               onClick={() => activeStep > step.id && setActiveStep(step.id)}
//             >
//               {step.icon}
//             </button>
//             <Typography
//               variant="small"
//               color={activeStep >= step.id ? "blue" : "blue-gray"}
//               className="mt-2 text-center"
//             >
//               {step.label}
//             </Typography>
//             {index < steps.length - 1 && (
//               <div className={`absolute h-1 w-1/4 top-5 transform -translate-y-1/2 
//                 ${activeStep > step.id ? 'bg-blue-500' : 'bg-blue-gray-100'}
//                 ${index === 0 ? 'left-1/4' : index === 1 ? 'left-1/2' : 'left-3/4'}`} 
//               />
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// const AppointmentsPage = () => {
//   const { calculatePrice, getDuration } = useAppointmentPricing(); // Add pricing hook
  
//   const [appointments, setAppointments] = useState([]);
//   const [patients, setPatients] = useState([]);
//   const [parents, setParents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDate, setCurrentDate] = useState(dayjs());
//   const [activeTab, setActiveTab] = useState('calendar');
//   const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [activeStep, setActiveStep] = useState(0);
//   const [flowType, setFlowType] = useState(null);
//   const [parentSelection, setParentSelection] = useState(null);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [selectedParent, setSelectedParent] = useState(null);
//   const [newParentForm, setNewParentForm] = useState({
//     fullName: '',
//     phoneNumber: '',
//     email: '',
//     address: ''
//   });
//   const [newPatientForm, setNewPatientForm] = useState({
//     firstName: '',
//     lastName: '',
//     birthDate: '',
//     gender: ''
//   });
//   const [appointmentForm, setAppointmentForm] = useState({
//     date: '',
//     time: '',
//     type: 'consultation',
//     status: 'confirmed',
//     notes: ''
//   });
//   const [parentErrors, setParentErrors] = useState({});
//   const [patientErrors, setPatientErrors] = useState({});
//   const [appointmentErrors, setAppointmentErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [timeConflicts, setTimeConflicts] = useState([]); // Add conflict tracking

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const [appts, pts, prnts] = await Promise.all([
//           getAppointments(),
//           getPatientTable(),
//           getParents()
//         ]);
//         setAppointments(appts);
//         setPatients(pts);
//         setParents(prnts);
//       } catch {
//         toast.error('Failed to load data');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // Enhanced time conflict validation
//   const checkTimeConflicts = (date, time, type, excludeAppointmentId = null) => {
//     const appointmentDuration = getDuration(type) || 30; // Get duration from localStorage
//     const requestedStart = dayjs(`${date} ${time}`);
//     const requestedEnd = requestedStart.add(appointmentDuration, 'minute');

//     const conflicts = appointments.filter(appointment => {
//       if (excludeAppointmentId && appointment._id === excludeAppointmentId) {
//         return false; // Don't check conflict with itself when editing
//       }

//       const appointmentDate = dayjs(appointment.date).format('YYYY-MM-DD');
//       if (appointmentDate !== date) {
//         return false; // Different date, no conflict
//       }

//       const existingDuration = getDuration(appointment.type) || appointment.duration || 30;
//       const existingStart = dayjs(`${appointmentDate} ${appointment.time}`);
//       const existingEnd = existingStart.add(existingDuration, 'minute');

//       // Check for overlap
//       return (
//         (requestedStart.isBefore(existingEnd) && requestedEnd.isAfter(existingStart)) ||
//         (existingStart.isBefore(requestedEnd) && existingEnd.isAfter(requestedStart))
//       );
//     });

//     return conflicts;
//   };

//   const validateParentForm = () => {
//     const errors = {};
//     if (!newParentForm.fullName.trim()) {
//       errors.fullName = 'Full name is required';
//     } else if (newParentForm.fullName.trim().length < 2) {
//       errors.fullName = 'Full name must be at least 2 characters';
//     }
//     if (!newParentForm.phoneNumber.trim()) {
//       errors.phoneNumber = 'Phone number is required';
//     } else if (!/^[\+]?[\d\s\-\(\)]{8,}$/.test(newParentForm.phoneNumber.trim())) {
//       errors.phoneNumber = 'Please enter a valid phone number';
//     }
//     if (newParentForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newParentForm.email)) {
//       errors.email = 'Please enter a valid email address';
//     }
//     setParentErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const validatePatientForm = () => {
//     const errors = {};
//     if (!newPatientForm.firstName.trim()) {
//       errors.firstName = 'First name is required';
//     } else if (newPatientForm.firstName.trim().length < 2) {
//       errors.firstName = 'First name must be at least 2 characters';
//     }
//     if (!newPatientForm.lastName.trim()) {
//       errors.lastName = 'Last name is required';
//     } else if (newPatientForm.lastName.trim().length < 2) {
//       errors.lastName = 'Last name must be at least 2 characters';
//     }
//     if (!newPatientForm.birthDate) {
//       errors.birthDate = 'Birth date is required';
//     } else {
//       const birthDate = new Date(newPatientForm.birthDate);
//       const today = new Date();
//       if (birthDate > today) {
//         errors.birthDate = 'Birth date cannot be in the future';
//       }
//       const age = today.getFullYear() - birthDate.getFullYear();
//       if (age > 150) {
//         errors.birthDate = 'Please enter a valid birth date';
//       }
//     }
//     if (!newPatientForm.gender) {
//       errors.gender = 'Gender is required';
//     }
//     setPatientErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const validateAppointmentForm = () => {
//     const errors = {};
//     if (!appointmentForm.date) {
//       errors.date = 'Date is required';
//     } else {
//       const appointmentDate = new Date(appointmentForm.date);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       if (appointmentDate < today) {
//         errors.date = 'Appointment date cannot be in the past';
//       }
//     }
//     if (!appointmentForm.time) {
//       errors.time = 'Time is required';
//     } else if (appointmentForm.date) {
//       const appointmentDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
//       const now = new Date();
//       if (appointmentDateTime < now) {
//         errors.time = 'Appointment time cannot be in the past';
//       }

//       // Check for time conflicts
//       const conflicts = checkTimeConflicts(
//         appointmentForm.date, 
//         appointmentForm.time, 
//         appointmentForm.type,
//         selectedAppointment?._id
//       );
      
//       if (conflicts.length > 0) {
//         errors.time = `Time conflict with existing appointment at ${conflicts[0].time}`;
//         setTimeConflicts(conflicts);
//       } else {
//         setTimeConflicts([]);
//       }
//     }
//     if (!appointmentForm.type) {
//       errors.type = 'Appointment type is required';
//     }
//     setAppointmentErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleCreateParent = async () => {
//     if (!validateParentForm()) {
//       toast.error('Please fix the validation errors');
//       return;
//     }
//     try {
//       setIsSubmitting(true);
//       const parent = await createParent(newParentForm);
//       setParents(prev => [...prev, parent]);
//       setSelectedParent(parent._id);
//       toast.success('Parent created successfully');
//       setActiveStep(1);
//       setParentErrors({});
//     } catch (error) {
//       toast.error('Failed to create parent');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleCreatePatient = async () => {
//     if (!validatePatientForm()) {
//       toast.error('Please fix the validation errors');
//       return;
//     }
//     try {
//       setIsSubmitting(true);
//       const patientData = {
//         ...newPatientForm,
//         parentId: selectedParent
//       };
//       const patient = await createPatient(patientData);
//       setPatients(prev => [...prev, patient]);
//       setSelectedPatient(patient._id);
//       toast.success('Patient created successfully');
//       setActiveStep(2);
//       setPatientErrors({});
//     } catch (error) {
//       toast.error('Failed to create patient');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSubmitAppointment = async () => {
//     if (!validateAppointmentForm()) {
//       toast.error('Please fix the validation errors');
//       return;
//     }
//     if (!selectedPatient) {
//       toast.error('Please select a patient');
//       return;
//     }

//     // Final conflict check
//     const conflicts = checkTimeConflicts(
//       appointmentForm.date, 
//       appointmentForm.time, 
//       appointmentForm.type,
//       selectedAppointment?._id
//     );

//     if (conflicts.length > 0) {
//       toast.error(`Time conflict detected! Another appointment exists at ${conflicts[0].time}`);
//       return;
//     }

//     try {
//       setIsSubmitting(true);
//       const appointmentData = {
//         ...appointmentForm,
//         patientId: selectedPatient
//       };
      
//       if (selectedAppointment) {
//         const updated = await updateAppointment(selectedAppointment._id, appointmentData);
//         setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
//         toast.success('Appointment updated successfully');
//       } else {
//         const created = await createAppointment(appointmentData);
//         setAppointments(prev => [...prev, created]);
//         toast.success('Appointment created successfully');
//       }
//       closeAllModals();
//     } catch (error) {
//       toast.error(`Failed to ${selectedAppointment ? 'update' : 'create'} appointment`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleCalendarTimeSelect = (date, time) => {
//     setAppointmentForm({
//       ...appointmentForm,
//       date: date.format('YYYY-MM-DD'),
//       time
//     });
//     setIsPatientModalOpen(true);
//     setActiveStep(0);
//     setFlowType(null);
//     setSelectedAppointment(null);
//   };

//   const handleEditAppointment = (appointment) => {
//     setSelectedAppointment(appointment);
//     setAppointmentForm({
//       date: appointment.date,
//       time: appointment.time,
//       type: appointment.type,
//       status: appointment.status,
//       notes: appointment.notes || ''
//     });
//     const patient = patients.find(p => p._id === appointment.patientId);
//     if (patient) {
//       setSelectedPatient(patient._id);
//     }
//     setIsPatientModalOpen(true);
//     setFlowType('existing');
//     setActiveStep(1);
//   };

//   const handleDeleteAppointment = (appointmentId) => {
//     const appointmentToDelete = appointments.find(a => a._id === appointmentId);
//     setSelectedAppointment(appointmentToDelete);
//     setIsDeleteModalOpen(true);
//   };

//   const confirmDelete = async () => {
//     try {
//       await deleteAppointment(selectedAppointment._id);
//       setAppointments(prev => prev.filter(a => a._id !== selectedAppointment._id));
//       toast.success('Appointment deleted');
//       setIsDeleteModalOpen(false);
//     } catch {
//       toast.error('Failed to delete appointment');
//     }
//   };

//   const closeAllModals = () => {
//     setIsPatientModalOpen(false);
//     setIsDeleteModalOpen(false);
//     setActiveStep(0);
//     setFlowType(null);
//     setParentSelection(null);
//     setSelectedPatient(null);
//     setSelectedParent(null);
//     setSelectedAppointment(null);
//     setIsSubmitting(false);
//     setTimeConflicts([]);
//     setNewParentForm({
//       fullName: '',
//       phoneNumber: '',
//       email: '',
//       address: ''
//     });
//     setNewPatientForm({
//       firstName: '',
//       lastName: '',
//       birthDate: '',
//       gender: ''
//     });
//     setAppointmentForm({
//       date: '',
//       time: '',
//       type: 'consultation',
//       status: 'confirmed',
//       notes: ''
//     });
//     setParentErrors({});
//     setPatientErrors({});
//     setAppointmentErrors({});
//   };

//   const canProceedToNext = () => {
//     if (flowType === 'existing') {
//       if (activeStep === 0) return selectedPatient;
//       if (activeStep === 1) return appointmentForm.date && appointmentForm.time && Object.keys(appointmentErrors).length === 0;
//     }
//     if (flowType === 'new') {
//       if (activeStep === 0) {
//         if (parentSelection === 'existing') return selectedParent;
//         if (parentSelection === 'new') {
//           return newParentForm.fullName && newParentForm.phoneNumber && Object.keys(parentErrors).length === 0;
//         }
//       }
//       if (activeStep === 1) {
//         return newPatientForm.firstName && newPatientForm.lastName && 
//                newPatientForm.birthDate && newPatientForm.gender && 
//                Object.keys(patientErrors).length === 0;
//       }
//       if (activeStep === 2) {
//         return appointmentForm.date && appointmentForm.time && Object.keys(appointmentErrors).length === 0;
//       }
//     }
//     return false;
//   };

//   const handleParentFormChange = (field, value) => {
//     setNewParentForm(prev => ({...prev, [field]: value}));
//     if (parentErrors[field]) {
//       setParentErrors(prev => {
//         const newErrors = {...prev};
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//   };

//   const handlePatientFormChange = (field, value) => {
//     setNewPatientForm(prev => ({...prev, [field]: value}));
//     if (patientErrors[field]) {
//       setPatientErrors(prev => {
//         const newErrors = {...prev};
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
//   };

//   const handleAppointmentFormChange = (field, value) => {
//     setAppointmentForm(prev => ({...prev, [field]: value}));
//     if (appointmentErrors[field]) {
//       setAppointmentErrors(prev => {
//         const newErrors = {...prev};
//         delete newErrors[field];
//         return newErrors;
//       });
//     }
    
//     // Re-validate when time or type changes to check for conflicts
//     if (field === 'time' || field === 'type') {
//       setTimeout(() => validateAppointmentForm(), 100);
//     }
//   };

//   const handleNext = () => {
//     if (flowType === 'existing') {
//       if (activeStep === 0 && selectedPatient) {
//         setActiveStep(1);
//       }
//     }
//     if (flowType === 'new') {
//       if (activeStep === 0) {
//         if (parentSelection === 'existing' && selectedParent) {
//           setActiveStep(1);
//         } else if (parentSelection === 'new' && validateParentForm()) {
//           handleCreateParent();
//         }
//       } else if (activeStep === 1 && validatePatientForm()) {
//         handleCreatePatient();
//       }
//     }
//   };

//   const handleFieldBlur = (formType, field) => {
//     if (formType === 'parent') validateParentForm();
//     if (formType === 'patient') validatePatientForm();
//     if (formType === 'appointment') validateAppointmentForm();
//   };

//   // Get current appointment pricing info
//   const getCurrentAppointmentPrice = () => {
//     if (!appointmentForm.type) return null;
//     const price = calculatePrice(appointmentForm.type);
//     const duration = getDuration(appointmentForm.type);
//     return { price, duration };
//   };

//   const renderPricingInfo = () => {
//     const pricingInfo = getCurrentAppointmentPrice();
//     if (!pricingInfo) return null;

//     return (
//       <Card className="mt-4 bg-blue-50 border border-blue-200">
//       <CardBody className="p-4">
//         <div className="flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <Typography variant="h6" color="blue-gray">
//           Pricing Information
//           </Typography>
//         </div>
//         <Chip
//           value={
//           <span>
//             {pricingInfo.price} <span className="text-xs">MAD</span>
//           </span>
//           }
//           color="blue"
//           size="lg"
//         />
//         </div>
//         <div className="mt-3 grid grid-cols-2 gap-4">
//         <div>
//           <Typography variant="small" color="blue-gray" className="font-medium">
//           Duration:
//           </Typography>
//           <Typography variant="small" color="gray">
//           {pricingInfo.duration} minutes
//           </Typography>
//         </div>
//         <div>
//           <Typography variant="small" color="blue-gray" className="font-medium">
//           Type:
//           </Typography>
//           <Typography variant="small" color="gray">
//           {appointmentForm.type}
//           </Typography>
//         </div>
//         </div>
//       </CardBody>
//       </Card>
//     );
//   };

//   const renderConflictWarning = () => {
//     if (timeConflicts.length === 0) return null;

//     return (
//       <Card className="mt-4 bg-red-50 border border-red-200">
//         <CardBody className="p-4">
//           <div className="flex items-center gap-2 mb-2">
//             <AlertTriangle className="h-5 w-5 text-red-600" />
//             <Typography variant="h6" color="red">
//               Time Conflict Detected
//             </Typography>
//           </div>
//           <Typography variant="small" color="red" className="mb-3">
//             The selected time conflicts with existing appointments:
//           </Typography>
//           {timeConflicts.map((conflict, index) => {
//             const patient = patients.find(p => p._id === conflict.patientId);
//             const conflictDuration = getDuration(conflict.type) || 30;
//             return (
//               <div key={index} className="bg-white p-3 rounded border border-red-200 mb-2">
//                 <Typography variant="small" className="font-medium">
//                   {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}
//                 </Typography>
//                 <Typography variant="small" color="gray">
//                   {conflict.time} - {conflict.type} ({conflictDuration} min)
//                 </Typography>
//               </div>
//             );
//           })}
//         </CardBody>
//       </Card>
//     );
//   };

//   const renderFormStep = () => {
//     if (flowType === null) {
//       return (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Button 
//             onClick={() => setFlowType('existing')}
//             className="flex flex-col items-center h-24 justify-center"
//             variant="outlined"
//           >
//             <User className="h-6 w-6 mb-2" />
//             <Typography variant="h6">Existing Patient</Typography>
//           </Button>
//           <Button 
//             onClick={() => setFlowType('new')}
//             className="flex flex-col items-center h-24 justify-center"
//             variant="outlined"
//           >
//             <UserPlus className="h-6 w-6 mb-2" />
//             <Typography variant="h6">New Patient</Typography>
//           </Button>
//         </div>
//       );
//     }
    
// if (flowType === 'existing') {
//   if (activeStep === 0) {
//     return (
//       <div className="space-y-6">
//         <Typography variant="h5" className="text-gray-800 font-semibold mb-6">
//           Select Patient
//         </Typography>
        
//         <div className="space-y-2">
//           <Select 
//             label="Select Patient"
//             value={selectedPatient}
//             onChange={(value) => setSelectedPatient(value)}
//             error={!selectedPatient}
//             className="w-full"
//             menuProps={{
//               className: "max-h-60 overflow-y-auto z-50",
//               style: { zIndex: 9999 }
//             }}
//             containerProps={{
//               className: "relative"
//             }}
//           >
//             {patients.map(p => (
//               <Option key={p._id} value={p._id} className="hover:bg-gray-50 p-2">
//                 <div className="flex items-center space-x-2">
//                   <span className="font-medium">{p.firstName} {p.lastName}</span>
//                 </div>
//               </Option>
//             ))}
//           </Select>
          
//           {!selectedPatient && (
//             <Typography variant="small" color="red" className="mt-2 text-red-600">
//               Please select a patient to continue
//             </Typography>
//           )}
//         </div>
//       </div>
//     );
//   }

//   if (activeStep === 1) {
//     return (
//       <div className="space-y-6">
//         <Typography variant="h5" className="text-gray-800 font-semibold mb-6">
//           Schedule Appointment
//         </Typography>
        
//         {/* Date and Time Row */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Input 
//               type="date" 
//               label="Appointment Date"
//               value={appointmentForm.date}
//               onChange={(e) => handleAppointmentFormChange('date', e.target.value)}
//               onBlur={() => handleFieldBlur('appointment', 'date')}
//               error={!!appointmentErrors.date}
//               min={new Date().toISOString().split('T')[0]}
//               className="w-full"
//               required
//             />
//             {appointmentErrors.date && (
//               <Typography variant="small" color="red" className="text-red-600">
//                 {appointmentErrors.date}
//               </Typography>
//             )}
//           </div>
          
//           <div className="space-y-2">
//             <Input 
//               type="time"
//               label="Appointment Time"
//               value={appointmentForm.time}
//               onChange={(e) => handleAppointmentFormChange('time', e.target.value)}
//               onBlur={() => handleFieldBlur('appointment', 'time')}
//               error={!!appointmentErrors.time}
//               className="w-full"
//               required
//             />
//             {appointmentErrors.time && (
//               <Typography variant="small" color="red" className="text-red-600">
//                 {appointmentErrors.time}
//               </Typography>
//             )}
//           </div>
//         </div>

//         {/* Appointment Type */}
//         <div className="space-y-2">
//           <Select
//             label="Appointment Type"
//             value={appointmentForm.type}
//             onChange={(value) => handleAppointmentFormChange('type', value)}
//             error={!!appointmentErrors.type}
//             className="w-full"
//             menuProps={{
//               className: "max-h-60 overflow-y-auto z-50",
//               style: { zIndex: 9999 }
//             }}
//             containerProps={{
//               className: "relative"
//             }}
//             required
//           >
//             <Option value="consultation" className="hover:bg-gray-50 p-2">
//               <div className="flex items-center space-x-2">
//                 <span>🩺</span>
//                 <span>Consultation</span>
//               </div>
//             </Option>
//             <Option value="vaccination" className="hover:bg-gray-50 p-2">
//               <div className="flex items-center space-x-2">
//                 <span>💉</span>
//                 <span>Vaccination</span>
//               </div>
//             </Option>
//             <Option value="follow-up" className="hover:bg-gray-50 p-2">
//               <div className="flex items-center space-x-2">
//                 <span>📋</span>
//                 <span>Follow-up</span>
//               </div>
//             </Option>
//           </Select>
//           {appointmentErrors.type && (
//             <Typography variant="small" color="red" className="text-red-600">
//               {appointmentErrors.type}
//             </Typography>
//           )}
//         </div>

//         {/* Appointment Status */}
//         <div className="space-y-2">
//           <Select
//             label="Appointment Status"
//             value={appointmentForm.status}
//             onChange={(value) => handleAppointmentFormChange('status', value)}
//             className="w-full"
//             menuProps={{
//               className: "max-h-60 overflow-y-auto z-50",
//               style: { zIndex: 9999 }
//             }}
//             containerProps={{
//               className: "relative"
//             }}
//           >
//             <Option value="confirmed" className="hover:bg-gray-50 p-2">
//               <div className="flex items-center space-x-2">
//                 <span className="w-2 h-2 bg-green-500 rounded-full"></span>
//                 <span>Confirmed</span>
//               </div>
//             </Option>
//             <Option value="pending" className="hover:bg-gray-50 p-2">
//               <div className="flex items-center space-x-2">
//                 <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
//                 <span>Pending</span>
//               </div>
//             </Option>
//             <Option value="cancelled" className="hover:bg-gray-50 p-2">
//               <div className="flex items-center space-x-2">
//                 <span className="w-2 h-2 bg-red-500 rounded-full"></span>
//                 <span>Cancelled</span>
//               </div>
//             </Option>
//             <Option value="completed" className="hover:bg-gray-50 p-2">
//               <div className="flex items-center space-x-2">
//                 <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
//                 <span>Completed</span>
//               </div>
//             </Option>
//           </Select>
//         </div>

//         {/* Notes */}
//         <div className="space-y-2">
//           <Textarea
//             label="Additional Notes"
//             placeholder="Enter any additional notes or special instructions..."
//             value={appointmentForm.notes}
//             onChange={(e) => handleAppointmentFormChange('notes', e.target.value)}
//             className="w-full min-h-[100px]"
//             rows={4}
//           />
//         </div>
        
//         {/* Pricing Information */}
//         <div className="border-t pt-4">
//           {renderPricingInfo()}
//         </div>
        
//         {/* Conflict Warning */}
//         {renderConflictWarning && (
//           <div className="border-t pt-4">
//             {renderConflictWarning()}
//           </div>
//         )}
//       </div>
//     );
//   }
// }
    
//     if (flowType === 'new') {
//       if (activeStep === 0) {
//         if (parentSelection === null) {
//           return (
//             <div className="space-y-4">
//               <Typography variant="h5" className="mb-4">Parent Selection</Typography>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <Button 
//                   onClick={() => setParentSelection('existing')}
//                   className="flex flex-col items-center h-24 justify-center"
//                   variant="outlined"
//                 >
//                   <User className="h-6 w-6 mb-2" />
//                   <Typography variant="h6">Existing Parent</Typography>
//                 </Button>
//                 <Button 
//                   onClick={() => setParentSelection('new')}
//                   className="flex flex-col items-center h-24 justify-center"
//                   variant="outlined"
//                 >
//                   <UserPlus className="h-6 w-6 mb-2" />
//                   <Typography variant="h6">New Parent</Typography>
//                 </Button>
//               </div>
//             </div>
//           );
//         }
//         if (parentSelection === 'existing') {
//           return (
//             <div className="space-y-4">
//               <Typography variant="h5" className="mb-4">Select Parent</Typography>
//               <Select
//                 label="Select Parent"
//                 value={selectedParent}
//                 onChange={(value) => setSelectedParent(value)}
//                 error={!selectedParent && parentSelection === 'existing'}
//               >
//                 {parents.map(p => (
//                   <Option key={p._id} value={p._id}>
//                     {p.fullName} - {p.phoneNumber}
//                   </Option>
//                 ))}
//               </Select>
//               {!selectedParent && parentSelection === 'existing' && (
//                 <Typography variant="small" color="red" className="mt-1">
//                   Please select a parent
//                 </Typography>
//               )}
//             </div>
//           );
//         }
//         if (parentSelection === 'new') {
//           return (
//             <div className="space-y-4">
//               <Typography variant="h5" className="mb-4">Create New Parent</Typography>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Input
//                     label="Full Name *"
//                     value={newParentForm.fullName}
//                     onChange={(e) => handleParentFormChange('fullName', e.target.value)}
//                     onBlur={() => handleFieldBlur('parent', 'fullName')}
//                     error={!!parentErrors.fullName}
//                   />
//                   {parentErrors.fullName && (
//                     <Typography variant="small" color="red" className="mt-1">
//                       {parentErrors.fullName}
//                     </Typography>
//                   )}
//                 </div>
//                 <div>
//                   <Input
//                     label="Phone Number *"
//                     value={newParentForm.phoneNumber}
//                     onChange={(e) => handleParentFormChange('phoneNumber', e.target.value)}
//                     onBlur={() => handleFieldBlur('parent', 'phoneNumber')}
//                     error={!!parentErrors.phoneNumber}
//                   />
//                   {parentErrors.phoneNumber && (
//                     <Typography variant="small" color="red" className="mt-1">
//                       {parentErrors.phoneNumber}
//                     </Typography>
//                   )}
//                 </div>
//               </div>
//               <div>
//                 <Input
//                   label="Email"
//                   type="email"
//                   value={newParentForm.email}
//                   onChange={(e) => handleParentFormChange('email', e.target.value)}
//                   onBlur={() => handleFieldBlur('parent', 'email')}
//                   error={!!parentErrors.email}
//                 />
//                 {parentErrors.email && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {parentErrors.email}
//                   </Typography>
//                 )}
//               </div>
//               <Input
//                 label="Address"
//                 value={newParentForm.address}
//                 onChange={(e) => handleParentFormChange('address', e.target.value)}
//               />
//             </div>
//           );
//         }
//       }
//       if (activeStep === 1) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Create New Patient</Typography>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Input
//                   label="First Name *"
//                   value={newPatientForm.firstName}
//                   onChange={(e) => handlePatientFormChange('firstName', e.target.value)}
//                   onBlur={() => handleFieldBlur('patient', 'firstName')}
//                   error={!!patientErrors.firstName}
//                 />
//                 {patientErrors.firstName && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {patientErrors.firstName}
//                   </Typography>
//                 )}
//               </div>
//               <div>
//                 <Input
//                   label="Last Name *"
//                   value={newPatientForm.lastName}
//                   onChange={(e) => handlePatientFormChange('lastName', e.target.value)}
//                   onBlur={() => handleFieldBlur('patient', 'lastName')}
//                   error={!!patientErrors.lastName}
//                 />
//                 {patientErrors.lastName && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {patientErrors.lastName}
//                   </Typography>
//                 )}
//               </div>
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Input
//                   type="date"
//                   label="Birth Date *"
//                   value={newPatientForm.birthDate}
//                   onChange={(e) => handlePatientFormChange('birthDate', e.target.value)}
//                   onBlur={() => handleFieldBlur('patient', 'birthDate')}
//                   error={!!patientErrors.birthDate}
//                 />
//                 {patientErrors.birthDate && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {patientErrors.birthDate}
//                   </Typography>
//                 )}
//               </div>
//               <div>
//                 <Select
//                   label="Gender *"
//                   value={newPatientForm.gender}
//                   onChange={(value) => handlePatientFormChange('gender', value)}
//                   error={!!patientErrors.gender}
//                 >
//                   <Option value="male">Male</Option>
//                   <Option value="female">Female</Option>
//                 </Select>
//                 {patientErrors.gender && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {patientErrors.gender}
//                   </Typography>
//                 )}
//               </div>
//             </div>
//           </div>
//         );
//       }
//       if (activeStep === 2) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Schedule Appointment</Typography>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <Input 
//                   type="date"
//                   label="Date *"
//                   value={appointmentForm.date}
//                   onChange={(e) => handleAppointmentFormChange('date', e.target.value)}
//                   onBlur={() => handleFieldBlur('appointment', 'date')}
//                   error={!!appointmentErrors.date}
//                   min={new Date().toISOString().split('T')[0]}
//                 />
//                 {appointmentErrors.date && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {appointmentErrors.date}
//                   </Typography>
//                 )}
//               </div>
//               <div>
//                 <Input 
//                   type="time"
//                   label="Time *"
//                   value={appointmentForm.time}
//                   onChange={(e) => handleAppointmentFormChange('time', e.target.value)}
//                   onBlur={() => handleFieldBlur('appointment', 'time')}
//                   error={!!appointmentErrors.time}
//                 />
//                 {appointmentErrors.time && (
//                   <Typography variant="small" color="red" className="mt-1">
//                     {appointmentErrors.time}
//                   </Typography>
//                 )}
//               </div>
//             </div>
//             <div>
//               <Select
//                 label="Type *"
//                 value={appointmentForm.type}
//                 onChange={(value) => handleAppointmentFormChange('type', value)}
//                 error={!!appointmentErrors.type}
//               >
//                 <Option value="consultation">Consultation</Option>
//                 <Option value="vaccination">Vaccination</Option>
//                 <Option value="follow-up">Follow-up</Option>
//               </Select>
//               {appointmentErrors.type && (
//                 <Typography variant="small" color="red" className="mt-1">
//                   {appointmentErrors.type}
//                 </Typography>
//               )}
//             </div>
//             <Select
//               label="Status"
//               value={appointmentForm.status}
//               onChange={(value) => handleAppointmentFormChange('status', value)}
//             >
//               <Option value="confirmed">Confirmed</Option>
//               <Option value="pending">Pending</Option>
//               <Option value="cancelled">Cancelled</Option>
//               <Option value="completed">Completed</Option>
//             </Select>
//             <Textarea
//               label="Notes"
//               value={appointmentForm.notes}
//               onChange={(e) => handleAppointmentFormChange('notes', e.target.value)}
//             />
            
//             {/* Pricing Information */}
//             {renderPricingInfo()}
            
//             {/* Conflict Warning */}
//             {renderConflictWarning()}
//           </div>
//         );
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <Typography variant="h5">Loading appointments...</Typography>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto px-4 py-6">
//       <div className="flex justify-between items-center mb-6">
//         <Typography variant="h3">Appointments</Typography>
//         <Button
//           className="flex items-center gap-2"
//           onClick={() => {
//             setIsPatientModalOpen(true);
//             setActiveStep(0);
//             setFlowType(null);
//             setSelectedAppointment(null);
//           }}
//         >
//           <UserPlus size={18} /> New Appointment
//         </Button>
//       </div>
      
//       <Tabs value={activeTab} className="mb-6">
//         <TabsHeader>
//           <Tab value="calendar" onClick={() => setActiveTab('calendar')}>
//             <div className="flex items-center gap-2">
//               <CalendarIcon className="h-5 w-5" /> Calendar
//             </div>
//           </Tab>
//           <Tab value="list" onClick={() => setActiveTab('list')}>
//             <div className="flex items-center gap-2">
//               <List className="h-5 w-5" /> List View
//             </div>
//           </Tab>
//         </TabsHeader>
//       </Tabs>
      
//       {activeTab === 'calendar' && (
//         <AppointmentCalendar
//           appointments={appointments}
//           patients={patients}
//           currentDate={currentDate}
//           onDateChange={setCurrentDate}
//           onTimeSelect={handleCalendarTimeSelect}
//           onEditAppointment={handleEditAppointment}
//         />
//       )}
      
//       {activeTab === 'list' && (
//         <AppointmentList
//           appointments={appointments}
//           patients={patients}
//           onEditAppointment={handleEditAppointment}
//           onDeleteAppointment={handleDeleteAppointment}
//         />
//       )}
      
//       <Dialog open={isPatientModalOpen} handler={closeAllModals} size="xl">
//         <DialogHeader>
//           {flowType && (
//             <CustomStepper 
//               activeStep={activeStep} 
//               flowType={flowType}
//               setActiveStep={setActiveStep}
//             />
//           )}
//         </DialogHeader>
//         <DialogBody className="max-h-[70vh] overflow-y-auto">
//           {renderFormStep()}
//         </DialogBody>
//         <DialogFooter>
//           <div className="flex justify-between w-full">
//             <div>
//               {activeStep > 0 && flowType && (
//                 <Button
//                   variant="text"
//                   onClick={() => setActiveStep(activeStep - 1)}
//                   className="mr-1"
//                 >
//                   <ChevronLeft className="h-4 w-4 mr-1" />
//                   Back
//                 </Button>
//               )}
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 variant="text"
//                 color="red"
//                 onClick={closeAllModals}
//                 className="mr-1"
//               >
//                 Cancel
//               </Button>
//               {flowType === 'existing' && activeStep === 1 && (
//                 <Button 
//                   color="blue" 
//                   onClick={handleSubmitAppointment}
//                   disabled={!canProceedToNext() || isSubmitting || timeConflicts.length > 0}
//                   loading={isSubmitting}
//                 >
//                   {selectedAppointment ? 'Update Appointment' : 'Create Appointment'}
//                 </Button>
//               )}
//               {flowType === 'new' && activeStep === 2 && (
//                 <Button 
//                   color="blue" 
//                   onClick={handleSubmitAppointment}
//                   disabled={!canProceedToNext() || isSubmitting || timeConflicts.length > 0}
//                   loading={isSubmitting}
//                 >
//                   Create Appointment
//                 </Button>
//               )}
//               {((flowType === 'existing' && activeStep === 0) || 
//                 (flowType === 'new' && activeStep < 2)) && (
//                 <Button 
//                   color="blue" 
//                   onClick={handleNext}
//                   disabled={!canProceedToNext() || isSubmitting}
//                   loading={isSubmitting && ((flowType === 'new' && activeStep === 0 && parentSelection === 'new') || 
//                            (flowType === 'new' && activeStep === 1))}
//                 >
//                   {(flowType === 'new' && activeStep === 0 && parentSelection === 'new') ? 'Create Parent' :
//                    (flowType === 'new' && activeStep === 1) ? 'Create Patient' : 'Next'}
//                   {!(isSubmitting && ((flowType === 'new' && activeStep === 0 && parentSelection === 'new') || 
//                                      (flowType === 'new' && activeStep === 1))) && (
//                     <ChevronRight className="h-4 w-4 ml-1" />
//                   )}
//                 </Button>
//               )}
//             </div>
//           </div>
//         </DialogFooter>
//       </Dialog>
      
//       <Dialog open={isDeleteModalOpen} handler={() => setIsDeleteModalOpen(false)} size="sm">
//         <DialogHeader>Confirm Deletion</DialogHeader>
//         <DialogBody>
//           Are you sure you want to delete this appointment? This action cannot be undone.
//         </DialogBody>
//         <DialogFooter>
//           <Button
//             variant="text"
//             onClick={() => setIsDeleteModalOpen(false)}
//             className="mr-1"
//           >
//             Cancel
//           </Button>
//           <Button color="red" onClick={confirmDelete}>
//             Delete
//           </Button>
//         </DialogFooter>
//       </Dialog>
//     </div>
//   );
// };

// export default AppointmentsPage;


// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import {
//   getAppointments,
//   createAppointment,
//   updateAppointment,
//   deleteAppointment,
// } from "@/data/appointmentsData";
// import { getPatientTable, getParents } from "@/data/patientTable";
// import { createPatient, createParent } from "@/data/createPatient";
// import {
//   Button,
//   Dialog,
//   DialogHeader,
//   DialogBody,
//   DialogFooter,
//   Input,
//   Select,
//   Option,
//   Textarea,
//   Tabs,
//   TabsHeader,
//   Tab,
//   Avatar,
//   Typography,
//   Chip
// } from "@material-tailwind/react";
// import { 
//   Calendar as CalendarIcon, 
//   List,
//   UserPlus,
//   Clock,
//   User,
//   Check,
//   ChevronLeft,
//   ChevronRight
// } from 'lucide-react';
// import dayjs from 'dayjs';
// import AppointmentCalendar from './dashboard/componet/AppointmentCalendar';
// import AppointmentList from './dashboard/componet/AppointmentList';

// const CustomStepper = ({ activeStep, flowType, setActiveStep }) => {
//   const steps = flowType === 'existing' 
//     ? [
//         { id: 0, label: 'Patient', icon: <User className="h-5 w-5" /> },
//         { id: 1, label: 'Rendez-vous', icon: <Clock className="h-5 w-5" /> }
//       ]
//     : [
//         { id: 0, label: 'Parent', icon: <User className="h-5 w-5" /> },
//         { id: 1, label: 'Patient', icon: <User className="h-5 w-5" /> },
//         { id: 2, label: 'Rendez-vous', icon: <Clock className="h-5 w-5" /> }
//       ];

//   return (
//     <div className="w-full px-24 py-4">
//       <div className="flex items-center justify-between relative">
//         {steps.map((step, index) => (
//           <div key={step.id} className="flex flex-col items-center z-10">
//             <button
//               className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
//                 ${activeStep >= step.id ? 'bg-blue-500 text-white' : 'bg-blue-gray-100 text-blue-gray-500'}
//                 ${activeStep > step.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
//               onClick={() => activeStep > step.id && setActiveStep(step.id)}
//             >
//               {step.icon}
//             </button>
//             <Typography
//               variant="small"
//               color={activeStep >= step.id ? "blue" : "blue-gray"}
//               className="mt-2 text-center"
//             >
//               {step.label}
//             </Typography>
//             {index < steps.length - 1 && (
//               <div className={`absolute h-1 w-1/4 top-5 transform -translate-y-1/2 
//                 ${activeStep > step.id ? 'bg-blue-500' : 'bg-blue-gray-100'}
//                 ${index === 0 ? 'left-1/4' : index === 1 ? 'left-1/2' : 'left-3/4'}`} 
//               />
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// const AppointmentsPage = () => {
//   // State management
//   const [appointments, setAppointments] = useState([]);
//   const [patients, setPatients] = useState([]);
//   const [parents, setParents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDate, setCurrentDate] = useState(dayjs());
//   const [activeTab, setActiveTab] = useState('calendar');
  
//   // Modal states
//   const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [activeStep, setActiveStep] = useState(0);
//   const [flowType, setFlowType] = useState(null);
//   const [parentSelection, setParentSelection] = useState(null);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);

//   // Form states
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [selectedParent, setSelectedParent] = useState(null);
//   const [newParentForm, setNewParentForm] = useState({
//     fullName: '',
//     phoneNumber: '',
//     email: '',
//     address: ''
//   });
//   const [newPatientForm, setNewPatientForm] = useState({
//     firstName: '',
//     lastName: '',
//     birthDate: '',
//     gender: ''
//   });
//   const [appointmentForm, setAppointmentForm] = useState({
//     date: '',
//     time: '',
//     type: 'consultation',
//     status: 'confirmed',
//     notes: ''
//   });

//   // Data fetching
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const [appts, pts, prnts] = await Promise.all([
//           getAppointments(),
//           getPatientTable(),
//           getParents()
//         ]);
//         setAppointments(appts);
//         setPatients(pts);
//         setParents(prnts);
//       } catch (error) {
//         toast.error('Failed to load data');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // Handle parent creation
//   const handleCreateParent = async () => {
//     try {
//       const parent = await createParent(newParentForm);
//       setParents(prev => [...prev, parent]);
//       setSelectedParent(parent._id);
//       toast.success('Parent created successfully');
//       setActiveStep(1); // Move to patient creation
//     } catch (error) {
//       toast.error('Failed to create parent');
//     }
//   };

//   // Handle patient creation
//   const handleCreatePatient = async () => {
//     try {
//       const patientData = {
//         ...newPatientForm,
//         parentId: selectedParent
//       };
//       const patient = await createPatient(patientData);
//       setPatients(prev => [...prev, patient]);
//       setSelectedPatient(patient._id);
//       toast.success('Patient created successfully');
//       setActiveStep(2); // Move to appointment
//     } catch (error) {
//       toast.error('Failed to create patient');
//     }
//   };

//   // Handle appointment creation/update
//   const handleSubmitAppointment = async () => {
//     try {
//       const appointmentData = {
//         ...appointmentForm,
//         patientId: selectedPatient
//       };
      
//       if (selectedAppointment) {
//         // Update existing appointment
//         const updated = await updateAppointment(selectedAppointment._id, appointmentData);
//         setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
//         toast.success('Appointment updated');
//       } else {
//         // Create new appointment
//         const created = await createAppointment(appointmentData);
//         setAppointments(prev => [...prev, created]);
//         toast.success('Appointment created');
//       }
//       closeAllModals();
//     } catch (error) {
//       toast.error(`Failed to ${selectedAppointment ? 'update' : 'create'} appointment`);
//     }
//   };

//   // Calendar time select handler
//   const handleCalendarTimeSelect = (date, time) => {
//     setAppointmentForm({
//       ...appointmentForm,
//       date: date.format('YYYY-MM-DD'),
//       time
//     });
//     setIsPatientModalOpen(true);
//     setActiveStep(0);
//     setFlowType(null);
//     setSelectedAppointment(null);
//   };

//   // Edit appointment handler
//   const handleEditAppointment = (appointment) => {
//     setSelectedAppointment(appointment);
//     setAppointmentForm({
//       date: appointment.date,
//       time: appointment.time,
//       type: appointment.type,
//       status: appointment.status,
//       notes: appointment.notes || ''
//     });
    
//     // Find the patient for this appointment
//     const patient = patients.find(p => p._id === appointment.patientId);
//     if (patient) {
//       setSelectedPatient(patient._id);
//     }
    
//     setIsPatientModalOpen(true);
//     setFlowType('existing');
//     setActiveStep(1); // Skip to appointment directly
//   };

//   // Delete appointment handler
//   const handleDeleteAppointment = (appointmentId) => {
//     const appointmentToDelete = appointments.find(a => a._id === appointmentId);
//     setSelectedAppointment(appointmentToDelete);
//     setIsDeleteModalOpen(true);
//   };

//   // Confirm delete
//   const confirmDelete = async () => {
//     try {
//       await deleteAppointment(selectedAppointment._id);
//       setAppointments(prev => prev.filter(a => a._id !== selectedAppointment._id));
//       toast.success('Appointment deleted');
//       setIsDeleteModalOpen(false);
//     } catch (error) {
//       toast.error('Failed to delete appointment');
//     }
//   };

//   // Close all modals
//   const closeAllModals = () => {
//     setIsPatientModalOpen(false);
//     setIsDeleteModalOpen(false);
//     setActiveStep(0);
//     setFlowType(null);
//     setParentSelection(null);
//     setSelectedPatient(null);
//     setSelectedParent(null);
//     setSelectedAppointment(null);
//     // Reset forms
//     setNewParentForm({
//       fullName: '',
//       phoneNumber: '',
//       email: '',
//       address: ''
//     });
//     setNewPatientForm({
//       firstName: '',
//       lastName: '',
//       birthDate: '',
//       gender: ''
//     });
//     setAppointmentForm({
//       date: '',
//       time: '',
//       type: 'consultation',
//       status: 'confirmed',
//       notes: ''
//     });
//   };

//   // Check if current step can proceed
//   const canProceedToNext = () => {
//     if (flowType === 'existing') {
//       if (activeStep === 0) return selectedPatient;
//       if (activeStep === 1) return appointmentForm.date && appointmentForm.time;
//     }
    
//     if (flowType === 'new') {
//       if (activeStep === 0) {
//         if (parentSelection === 'existing') return selectedParent;
//         if (parentSelection === 'new') return newParentForm.fullName && newParentForm.phoneNumber;
//       }
//       if (activeStep === 1) return newPatientForm.firstName && newPatientForm.lastName && newPatientForm.birthDate;
//       if (activeStep === 2) return appointmentForm.date && appointmentForm.time;
//     }
    
//     return false;
//   };

//   // Handle next step
//   const handleNext = () => {
//     if (flowType === 'existing') {
//       if (activeStep === 0 && selectedPatient) {
//         setActiveStep(1);
//       }
//     }
    
//     if (flowType === 'new') {
//       if (activeStep === 0) {
//         if (parentSelection === 'existing' && selectedParent) {
//           setActiveStep(1);
//         } else if (parentSelection === 'new') {
//           handleCreateParent();
//         }
//       } else if (activeStep === 1) {
//         handleCreatePatient();
//       }
//     }
//   };

//   // Render form steps
//   const renderFormStep = () => {
//     // Initial selection
//     if (flowType === null) {
//       return (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Button 
//             onClick={() => setFlowType('existing')}
//             className="flex flex-col items-center h-24 justify-center"
//             variant="outlined"
//           >
//             <User className="h-6 w-6 mb-2" />
//             <Typography variant="h6">Existing Patient</Typography>
//           </Button>
//           <Button 
//             onClick={() => setFlowType('new')}
//             className="flex flex-col items-center h-24 justify-center"
//             variant="outlined"
//           >
//             <UserPlus className="h-6 w-6 mb-2" />
//             <Typography variant="h6">New Patient</Typography>
//           </Button>
//         </div>
//       );
//     }

//     // Existing patient flow
//     if (flowType === 'existing') {
//       if (activeStep === 0) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Select Patient</Typography>
//             <Select 
//               label="Select Patient"
//               value={selectedPatient}
//               onChange={(value) => setSelectedPatient(value)}
//             >
//               {patients.map(p => (
//                 <Option key={p._id} value={p._id}>
//                   {p.firstName} {p.lastName}
//                 </Option>
//               ))}
//             </Select>
//           </div>
//         );
//       }
      
//       if (activeStep === 1) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Schedule Appointment</Typography>
//             <div className="grid grid-cols-2 gap-4">
//               <Input 
//                 type="date" 
//                 label="Date"
//                 value={appointmentForm.date}
//                 onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
//               />
//               <Input 
//                 type="time"
//                 label="Time"
//                 value={appointmentForm.time}
//                 onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
//               />
//             </div>
//             <Select
//               label="Type"
//               value={appointmentForm.type}
//               onChange={(value) => setAppointmentForm({...appointmentForm, type: value})}
//             >
//               <Option value="consultation">Consultation</Option>
//               <Option value="vaccination">Vaccination</Option>
//               <Option value="surgery">Surgery</Option>
//             </Select>
//             <Select
//               label="Status"
//               value={appointmentForm.status}
//               onChange={(value) => setAppointmentForm({...appointmentForm, status: value})}
//             >
//               <Option value="confirmed">Confirmed</Option>
//               <Option value="pending">Pending</Option>
//               <Option value="cancelled">Cancelled</Option>
//             </Select>
//             <Textarea
//               label="Notes"
//               value={appointmentForm.notes}
//               onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
//             />
//           </div>
//         );
//       }
//     }

//     // New patient flow
//     if (flowType === 'new') {
//       // Parent selection step
//       if (activeStep === 0) {
//         if (parentSelection === null) {
//           return (
//             <div className="space-y-4">
//               <Typography variant="h5" className="mb-4">Parent Selection</Typography>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <Button 
//                   onClick={() => setParentSelection('existing')}
//                   className="flex flex-col items-center h-24 justify-center"
//                   variant="outlined"
//                 >
//                   <User className="h-6 w-6 mb-2" />
//                   <Typography variant="h6">Existing Parent</Typography>
//                 </Button>
//                 <Button 
//                   onClick={() => setParentSelection('new')}
//                   className="flex flex-col items-center h-24 justify-center"
//                   variant="outlined"
//                 >
//                   <UserPlus className="h-6 w-6 mb-2" />
//                   <Typography variant="h6">New Parent</Typography>
//                 </Button>
//               </div>
//             </div>
//           );
//         }
        
//         if (parentSelection === 'existing') {
//           return (
//             <div className="space-y-4">
//               <Typography variant="h5" className="mb-4">Select Parent</Typography>
//               <Select
//                 label="Select Parent"
//                 value={selectedParent}
//                 onChange={(value) => setSelectedParent(value)}
//               >
//                 {parents.map(p => (
//                   <Option key={p._id} value={p._id}>
//                     {p.fullName} - {p.phoneNumber}
//                   </Option>
//                 ))}
//               </Select>
//             </div>
//           );
//         }

//         if (parentSelection === 'new') {
//           return (
//             <div className="space-y-4">
//               <Typography variant="h5" className="mb-4">Create New Parent</Typography>
//               <div className="grid grid-cols-2 gap-4">
//                 <Input
//                   label="Full Name"
//                   value={newParentForm.fullName}
//                   onChange={(e) => setNewParentForm({...newParentForm, fullName: e.target.value})}
//                 />
//                 <Input
//                   label="Phone Number"
//                   value={newParentForm.phoneNumber}
//                   onChange={(e) => setNewParentForm({...newParentForm, phoneNumber: e.target.value})}
//                 />
//               </div>
//               <Input
//                 label="Email"
//                 type="email"
//                 value={newParentForm.email}
//                 onChange={(e) => setNewParentForm({...newParentForm, email: e.target.value})}
//               />
//               <Input
//                 label="Address"
//                 value={newParentForm.address}
//                 onChange={(e) => setNewParentForm({...newParentForm, address: e.target.value})}
//               />
//             </div>
//           );
//         }
//       }

//       // Patient creation step
//       if (activeStep === 1) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Create New Patient</Typography>
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="First Name"
//                 value={newPatientForm.firstName}
//                 onChange={(e) => setNewPatientForm({...newPatientForm, firstName: e.target.value})}
//               />
//               <Input
//                 label="Last Name"
//                 value={newPatientForm.lastName}
//                 onChange={(e) => setNewPatientForm({...newPatientForm, lastName: e.target.value})}
//               />
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 type="date"
//                 label="Birth Date"
//                 value={newPatientForm.birthDate}
//                 onChange={(e) => setNewPatientForm({...newPatientForm, birthDate: e.target.value})}
//               />
//               <Select
//                 label="Gender"
//                 value={newPatientForm.gender}
//                 onChange={(value) => setNewPatientForm({...newPatientForm, gender: value})}
//               >
//                 <Option value="male">Male</Option>
//                 <Option value="female">Female</Option>
//               </Select>
//             </div>
//           </div>
//         );
//       }

//       // Appointment step
//       if (activeStep === 2) {
//         return (
//           <div className="space-y-4">
//             <Typography variant="h5" className="mb-4">Schedule Appointment</Typography>
//             <div className="grid grid-cols-2 gap-4">
//               <Input 
//                 type="date"
//                 label="Date"
//                 value={appointmentForm.date}
//                 onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
//               />
//               <Input 
//                 type="time"
//                 label="Time"
//                 value={appointmentForm.time}
//                 onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
//               />
//             </div>
//             <Select
//               label="Type"
//               value={appointmentForm.type}
//               onChange={(value) => setAppointmentForm({...appointmentForm, type: value})}
//             >
//               <Option value="consultation">Consultation</Option>
//               <Option value="vaccination">Vaccination</Option>
//               <Option value="surgery">Surgery</Option>
//             </Select>
//             <Select
//               label="Status"
//               value={appointmentForm.status}
//               onChange={(value) => setAppointmentForm({...appointmentForm, status: value})}
//             >
//               <Option value="confirmed">Confirmed</Option>
//               <Option value="pending">Pending</Option>
//             </Select>
//             <Textarea
//               label="Notes"
//               value={appointmentForm.notes}
//               onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
//             />
//           </div>
//         );
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <Typography variant="h5">Loading appointments...</Typography>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto px-4 py-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <Typography variant="h3">Appointments</Typography>
//         <Button
//           className="flex items-center gap-2"
//           onClick={() => {
//             setIsPatientModalOpen(true);
//             setActiveStep(0);
//             setFlowType(null);
//             setSelectedAppointment(null);
//           }}
//         >
//           <UserPlus size={18} /> New Appointment
//         </Button>
//       </div>

//       {/* View Tabs */}
//       <Tabs value={activeTab} className="mb-6">
//         <TabsHeader>
//           <Tab value="calendar" onClick={() => setActiveTab('calendar')}>
//             <div className="flex items-center gap-2">
//               <CalendarIcon className="h-5 w-5" /> Calendar
//             </div>
//           </Tab>
//           <Tab value="list" onClick={() => setActiveTab('list')}>
//             <div className="flex items-center gap-2">
//               <List className="h-5 w-5" /> List View
//             </div>
//           </Tab>
//         </TabsHeader>
//       </Tabs>

//       {/* Calendar View */}
//       {activeTab === 'calendar' && (
//         <AppointmentCalendar
//           appointments={appointments}
//           patients={patients}
//           currentDate={currentDate}
//           onDateChange={setCurrentDate}
//           onTimeSelect={handleCalendarTimeSelect}
//           onEditAppointment={handleEditAppointment}
//         />
//       )}

//       {/* List View */}
//       {activeTab === 'list' && (
//         <AppointmentList
//           appointments={appointments}
//           patients={patients}
//           onEditAppointment={handleEditAppointment}
//           onDeleteAppointment={handleDeleteAppointment}
//         />
//       )}

//       {/* New Appointment Modal */}
//       <Dialog open={isPatientModalOpen} handler={closeAllModals} size="xl">
//         <DialogHeader>
//           {flowType && (
//             <CustomStepper 
//               activeStep={activeStep} 
//               flowType={flowType}
//               setActiveStep={setActiveStep}
//             />
//           )}
//         </DialogHeader>
//         <DialogBody>
//           {renderFormStep()}
//         </DialogBody>
//         <DialogFooter>
//           <div className="flex justify-between w-full">
//             <div>
//               {activeStep > 0 && flowType && (
//                 <Button
//                   variant="text"
//                   onClick={() => setActiveStep(activeStep - 1)}
//                   className="mr-1"
//                 >
//                   <ChevronLeft className="h-4 w-4 mr-1" />
//                   Back
//                 </Button>
//               )}
//             </div>
//             <div className="flex gap-2">
//               <Button
//                 variant="text"
//                 color="red"
//                 onClick={closeAllModals}
//                 className="mr-1"
//               >
//                 Cancel
//               </Button>
              
//               {/* Show appropriate action button based on current step */}
//               {flowType === 'existing' && activeStep === 1 && (
//                 <Button 
//                   color="blue" 
//                   onClick={handleSubmitAppointment}
//                   disabled={!canProceedToNext()}
//                 >
//                   {selectedAppointment ? 'Update Appointment' : 'Create Appointment'}
//                 </Button>
//               )}
              
//               {flowType === 'new' && activeStep === 2 && (
//                 <Button 
//                   color="blue" 
//                   onClick={handleSubmitAppointment}
//                   disabled={!canProceedToNext()}
//                 >
//                   Create Appointment
//                 </Button>
//               )}
              
//               {/* Next button for other steps */}
//               {((flowType === 'existing' && activeStep === 0) || 
//                 (flowType === 'new' && activeStep < 2)) && (
//                 <Button 
//                   color="blue" 
//                   onClick={handleNext}
//                   disabled={!canProceedToNext()}
//                 >
//                   Next
//                   <ChevronRight className="h-4 w-4 ml-1" />
//                 </Button>
//               )}
//             </div>
//           </div>
//         </DialogFooter>
//       </Dialog>

//       {/* Delete Confirmation Modal */}
//       <Dialog open={isDeleteModalOpen} handler={() => setIsDeleteModalOpen(false)} size="sm">
//         <DialogHeader>Confirm Deletion</DialogHeader>
//         <DialogBody>
//           Are you sure you want to delete this appointment? This action cannot be undone.
//         </DialogBody>
//         <DialogFooter>
//           <Button
//             variant="text"
//             onClick={() => setIsDeleteModalOpen(false)}
//             className="mr-1"
//           >
//             Cancel
//           </Button>
//           <Button color="red" onClick={confirmDelete}>
//             Delete
//           </Button>
//         </DialogFooter>
//       </Dialog>
//     </div>
//   );
// };

// export default AppointmentsPage;





// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import {
//   getAppointments,
//   createAppointment,
//   updateAppointment,
//   deleteAppointment,

// } from "@/data/appointmentsData";

// import { getPatientTable } from "@/data/patientTable";
// import { createPatient } from "@/data/createPatient";
// import {
//   Button,
//   Dialog,
//   DialogHeader,
//   DialogBody,
//   DialogFooter,
//   Input,
//   Select,
//   Option,
//   Textarea,
//   Chip,
//   Tabs,
//   TabsHeader,
//   Tab,
//   Avatar,
//   Stepper,
//   Step,
//   Typography
// } from "@material-tailwind/react";
// import { 
//   Calendar as CalendarIcon, 
//   List,
//   UserPlus,
//   Clock,
//   User,
//   Check
// } from 'lucide-react';
// import dayjs from 'dayjs';
// import AppointmentCalendar from './dashboard/componet/AppointmentCalendar';
// import AppointmentList from './dashboard/componet/appointmentList';

// const AppointmentsPage = () => {
//   // State management
//   const [appointments, setAppointments] = useState([]);
//   const [patients, setPatients] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDate, setCurrentDate] = useState(dayjs());
//   const [activeTab, setActiveTab] = useState('calendar');
  
//   // Modal states
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  
//   // Form states
//   const [activeStep, setActiveStep] = useState(0);
//   const [selectedTime, setSelectedTime] = useState(null);
//   const [selectedDate, setSelectedDate] = useState(null);
  
//   const [parentForm, setParentForm] = useState({
//     fullName: '',
//     email: '',
//     phoneNumber: ''
//   });

//   const [patientForm, setPatientForm] = useState({
//     firstName: '',
//     lastName: '',
//     birthDate: '',
//     gender: ''
//   });

//   const [appointmentForm, setAppointmentForm] = useState({
//     date: '',
//     time: '',
//     type: 'consultation',
//     status: 'confirmed',
//     patientId: '',
//     notes: ''
//   });

//   // Data fetching
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const [appts, pts] = await Promise.all([
//           getAppointments(),
//           getPatientTable()
//         ]);
//         setAppointments(appts);
//         setPatients(pts);
//       } catch (error) {
//         toast.error('Failed to fetch data');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   // Handle parent and patient creation
//   const handleCreatePatient = async () => {
//     try {
//       // First create the parent
//       const parentData = {
//         fullName: parentForm.fullName,
//         email: parentForm.email,
//         phoneNumber: parentForm.phoneNumber,

//         address: parentForm.address, // Optional, can be added later
//         role: 'parent'
//       };

//       // Then create the patient with parent reference
//       const patientData = {
//         ...patientForm,
//         parentId: parent._id, // This should come from parent creation
      
//           fullName: parentForm.fullName,
//           email: parentForm.email,
//           phoneNumber: parentForm.phoneNumber,
//           address: parentForm.address,
//           role: 'parent'
//       };

//       const newPatient = await createPatient(patientData);
//       setPatients(prev => [...prev, newPatient]);
//       toast.success('Patient created successfully');
      
//       // Move to appointment scheduling with the new patient
//       setAppointmentForm(prev => ({
//         ...prev,
//         patientId: newPatient._id
//       }));
//       setActiveStep(2);
//     } catch (error) {
//       toast.error('Failed to create patient');
//       console.error('Error creating patient:', error);
//     }
//   };

//   // Handle appointment creation/update
//   const handleSubmitAppointment = async (e) => {
//     e.preventDefault();
//     try {
//       if (selectedAppointment) {
//         // Update existing appointment
//         const updated = await updateAppointment(selectedAppointment._id, appointmentForm);
//         setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
//         toast.success('Appointment updated');
//       } else {
//         // Create new appointment
//         const created = await createAppointment(appointmentForm);
//         setAppointments(prev => [...prev, created]);
//         toast.success('Appointment created');
//       }
//       closeAllModals();
//     } catch (error) {
//       toast.error(`Failed to ${selectedAppointment ? 'update' : 'create'} appointment`);
//       console.error('Error:', error);
//     }
//   };

//   // Calendar time slot selection
//   const handleCalendarTimeSelect = (date, time) => {
//     setSelectedDate(date);
//     setSelectedTime(time);
//     setAppointmentForm(prev => ({
//       ...prev,
//       date: date.format('YYYY-MM-DD'),
//       time
//     }));
//     setIsPatientModalOpen(true);
//     setActiveStep(0); // Start with parent info
//   };

//   // Edit appointment handler
//   const handleEditAppointment = (appointment) => {
//     setSelectedAppointment(appointment);
//     setAppointmentForm({
//       date: appointment.date,
//       time: appointment.time,
//       type: appointment.type,
//       status: appointment.status,
//       patientId: appointment.patientId,
//       notes: appointment.notes || ''
//     });
//     setIsModalOpen(true);
//   };

//   // Delete appointment handler
//   const handleDelete = async () => {
//     console.log('Deleting appointment:', selectedAppointment);
//     try {
//       await deleteAppointment(selectedAppointment);
//       setAppointments(prev => prev.filter(a => a._id !== selectedAppointment));
//       toast.success('Appointment deleted');
//       setIsDeleteModalOpen(false);
//     } catch (error) {
//       toast.error('Failed to delete appointment');
//     }
//   };

//   // Reset all modal states
//   const closeAllModals = () => {
//     setIsModalOpen(false);
//     setIsPatientModalOpen(false);
//     setIsDeleteModalOpen(false);
//     setActiveStep(0);
//     setSelectedAppointment(null);
//     // Reset forms
//     setParentForm({
//       fullName: '',
//       email: '',
//       phoneNumber: '',
//       address: ''
//     });
//     setPatientForm({
//       firstName: '',
//       lastName: '',
//       birthDate: '',
//       gender: ''
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <Typography variant="h5">Loading appointments...</Typography>
//       </div>
//     );
//   }

//   // Modal form steps
//   const renderFormStep = () => {
//     switch (activeStep) {
//       case 0:
//         return (
//           <>
//             <Typography variant="h5" className="mb-4">Parent Information</Typography>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Input
//                 label="Full Name"
//                 value={parentForm.fullName}
//                 onChange={(e) => setParentForm({...parentForm, fullName: e.target.value})}
//                 required
//               />
//               <Input
//                 type="email"
//                 label="Email"
//                 value={parentForm.email}
//                 onChange={(e) => setParentForm({...parentForm, email: e.target.value})}
//                 required
//               />
//               <Input
//                 label="Phone Number"
//                 type="tel"
//                 value={parentForm.phoneNumber}
//                 onChange={(e) => setParentForm({...parentForm, phoneNumber: e.target.value})}
//                 required
//               />
//               <Input
//                 label="Address"
//                 value={parentForm.address}
//                 onChange={(e) => setParentForm({...parentForm, address: e.target.value})}
//                 required
//               />
//             </div>
//           </>
//         );
//       case 1:
//         return (
//           <>
//             <Typography variant="h5" className="mb-4">Patient Information</Typography>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Input
//                 label="First Name"
//                 value={patientForm.firstName}
//                 onChange={(e) => setPatientForm({...patientForm, firstName: e.target.value})}
//                 required
//               />
//               <Input
//                 label="Last Name"
//                 value={patientForm.lastName}
//                 onChange={(e) => setPatientForm({...patientForm, lastName: e.target.value})}
//                 required
//               />
//               <Input
//                 type="date"
//                 label="Birth Date"
//                 value={patientForm.birthDate}
//                 onChange={(e) => setPatientForm({...patientForm, birthDate: e.target.value})}
//                 required
//               />
//               <Select
//                 label="Gender"
//                 value={patientForm.gender}
//                 onChange={(value) => setPatientForm({...patientForm, gender: value})}
//                 required
//               >
//                 <Option value="male">Male</Option>
//                 <Option value="female">Female</Option>
//                 <Option value="other">Other</Option>
//               </Select>
//             </div>
//           </>
//         );
//       case 2:
//         return (
//           <>
//             <Typography variant="h5" className="mb-4">Schedule Appointment</Typography>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Input
//                 type="date"
//                 label="Date"
//                 value={appointmentForm.date}
//                 onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
//                 required
//               />
//               <Input
//                 type="time"
//                 label="Time"
//                 value={appointmentForm.time}
//                 onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
//                 required
//               />
//               <Select
//                 label="Type"
//                 value={appointmentForm.type}
//                 onChange={(value) => setAppointmentForm({...appointmentForm, type: value})}
//                 required
//               >
//                 <Option value="consultation">Consultation</Option>
//                 <Option value="vaccination">Vaccination</Option>
//                 <Option value="surgery">Surgery</Option>
//               </Select>
//               <Select
//                 label="Status"
//                 value={appointmentForm.status}
//                 onChange={(value) => setAppointmentForm({...appointmentForm, status: value})}
//                 required
//               >
//                 <Option value="confirmed">Confirmed</Option>
//                 <Option value="pending">Pending</Option>
//               </Select>
//             </div>
//             <div className="mt-4">
//               <Typography variant="h6">Patient Details</Typography>
//               <div className="p-4 bg-gray-50 rounded-lg mt-2">
//                 <Typography>
//                   {patientForm.firstName} {patientForm.lastName}
//                 </Typography>
//                 <Typography variant="small">
//                   Parent: {parentForm.fullName}
//                 </Typography>
//               </div>
//             </div>
//             <Textarea
//               label="Notes"
//               value={appointmentForm.notes}
//               onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
//             />
//           </>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="mx-auto px-4 py-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <Typography variant="h3" className="font-bold">Appointments</Typography>
//         <Button
//           className="flex items-center gap-2"
//           onClick={() => {
//             setIsPatientModalOpen(true);
//             setActiveStep(0);
//           }}
//         >
//           <UserPlus size={18} /> New Patient & Appointment
//         </Button>
//       </div>

//       {/* View Tabs */}
//       <Tabs value={activeTab} className="mb-6">
//         <TabsHeader>
//           <Tab value="calendar" onClick={() => setActiveTab('calendar')}>
//             <div className="flex items-center gap-2">
//               <CalendarIcon className="h-5 w-5" /> Calendar
//             </div>
//           </Tab>
//           <Tab value="list" onClick={() => setActiveTab('list')}>
//             <div className="flex items-center gap-2">
//               <List className="h-5 w-5" /> List View
//             </div>
//           </Tab>
//         </TabsHeader>
//       </Tabs>

//       {/* Calendar View */}
//       {activeTab === 'calendar' && (
//         <AppointmentCalendar
//           appointments={appointments}
//           patients={patients}
//           currentDate={currentDate}
//           onDateChange={setCurrentDate}
//           onTimeSelect={handleCalendarTimeSelect}
//           onEditAppointment={handleEditAppointment}
//         />
//       )}
//       {/* List View */}
//      {activeTab === 'list' && (
//   <AppointmentList
//     appointments={appointments}
//     patients={patients}
//     onEditAppointment={handleEditAppointment} 
//     onDeleteAppointment={(appointment) => {
//       setSelectedAppointment(appointment);
//       setIsDeleteModalOpen(true);
//     }}
//   />
// )}

//    {/* Multi-step Patient + Appointment Modal */}

//   <Dialog open={isPatientModalOpen} handler={closeAllModals} size="xxl" className="max-w-xxl container mx-auto">
//           <DialogHeader>
//             <Stepper activeStep={activeStep} className="w-full">
//           <Step onClick={() => setActiveStep(0)}>
//             <User className="h-5 w-5" />
//             <div className="absolute -bottom-[2.5rem] w-max text-center">
//               <Typography variant="h6" color={activeStep === 0 ? "blue" : "gray"}>
//             Parent Info
//               </Typography>
//             </div>
//           </Step>
//           <Step onClick={() => activeStep > 0 && setActiveStep(1)}>
//             <User className="h-5 w-5" />
//             <div className="absolute -bottom-[2.5rem] w-max text-center">
//               <Typography variant="h6" color={activeStep === 1 ? "blue" : "gray"}>
//             Patient Info
//               </Typography>
//             </div>
//           </Step>
//           <Step onClick={() => activeStep > 1 && setActiveStep(2)}>
//             <Clock className="h-5 w-5" />
//             <div className="absolute -bottom-[2.5rem] w-max text-center">
//               <Typography variant="h6" color={activeStep === 2 ? "blue" : "gray"}>
//             Appointment
//               </Typography>
//             </div>
//           </Step>
//             </Stepper>
//           </DialogHeader>

//           <form onSubmit={
//             activeStep < 2 
//           ? (e) => { 
//               e.preventDefault(); 
//               if (activeStep === 1) {
//             handleCreatePatient();
//               } else {
//             setActiveStep(activeStep + 1); 
//               }
//             } 
//           : handleSubmitAppointment
//           }>
//             <DialogBody className="space-y-4">
//           {renderFormStep()}
//             </DialogBody>
//             <DialogFooter>
//           <div className="flex justify-between w-full">
//             {activeStep > 0 ? (
//               <Button
//             variant="text"
//             onClick={() => setActiveStep(activeStep - 1)}
//             className="mr-1"
//               >
//             Back
//               </Button>
//             ) : <div />}
//             <div className="flex gap-2">
//               <Button
//             variant="text"
//             color="red"
//             onClick={closeAllModals}
//             className="mr-1"
//               >
//             Cancel
//               </Button>
//               <Button 
//             type="submit"
//             color="blue"
//             className="flex items-center gap-2"
//               >
//             {activeStep === 0 ? 'Continue' : 
//              activeStep === 1 ? 'Create Patient' : 
//              selectedAppointment ? 'Update' : 'Create'} 
//             <Check size={18} />
//               </Button>
//             </div>
//           </div>
//             </DialogFooter>
//           </form>
//         </Dialog>

//         {/* Edit Appointment Modal */}
//       <Dialog open={isModalOpen} handler={closeAllModals} size="lg">
//         <DialogHeader>
//           <Typography variant="h5">Edit Appointment</Typography>
//         </DialogHeader>
//         <form onSubmit={handleSubmitAppointment}>
//           <DialogBody className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Input
//                 type="date"
//                 label="Date"
//                 value={appointmentForm.date}
//                 onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
//                 required
//               />
              
//               <Input
//                 type="time"
//                 label="Time"
//                 value={appointmentForm.time}
//                 onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
//                 required
//               />
//               <Select
//                 label="Type"
//                 value={appointmentForm.type}
//                 onChange={(value) => setAppointmentForm({...appointmentForm, type: value})}
//                 required
//               >
//                 <Option value="consultation">Consultation</Option>
//                 <Option value="vaccination">Vaccination</Option>
//                 <Option value="surgery">Surgery</Option>
//               </Select>
//               <Select
//                 label="Status"
//                 value={appointmentForm.status}
//                 onChange={(value) => setAppointmentForm({...appointmentForm, status: value})}
//                 required
//               >
//                 <Option value="confirmed">Confirmed</Option>
//                 <Option value="pending">Pending</Option>
//               </Select>
//             </div>
//             <div className="flex items-center gap-3 p-2 bg-blue-gray-50 rounded">
//               <Avatar 
//                 src={patients.find(p => p._id === appointmentForm.patientId)?.img || '/img/team-2.jpeg'} 
//                 size="sm" 
//               />
//               <div>
//                 <Typography>
//                   {patients.find(p => p._id === appointmentForm.patientId)?.firstName || 'Patient'} 
//                   {patients.find(p => p._id === appointmentForm.patientId)?.lastName || ''}
//                 </Typography>
//                 <Typography variant="small">
//                   Parent: {patients.find(p => p._id === appointmentForm.patientId)?.parent?.fullName || ''}
//                 </Typography>
//               </div>
//             </div>
//             <Textarea
//               label="Notes"
//               value={appointmentForm.notes}
//               onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
//             />
//           </DialogBody>
//           <DialogFooter>
//             <Button
//               variant="text"
//               color="red"
//               onClick={closeAllModals}
//               className="mr-1"
//             >
//               Cancel
//             </Button>
//             <Button type="submit" color="blue">
//               Update Appointment
//             </Button>
//           </DialogFooter>
//         </form>
//       </Dialog>

//       {/* Delete Confirmation Modal */}
//       <Dialog open={isDeleteModalOpen} handler={() => setIsDeleteModalOpen(false)} size="sm">
//         <DialogHeader>Confirm Deletion</DialogHeader>
//         <DialogBody>
//           Are you sure you want to delete this appointment? This action cannot be undone.
//         </DialogBody>
//         <DialogFooter>
//           <Button
//             variant="text"
//             color="blue-gray"
//             onClick={() => setIsDeleteModalOpen(false)}
//             className="mr-1"
//           >
//             Cancel
//           </Button>
//           <Button color="red" onClick={handleDelete}>
//             Delete
//           </Button>
//         </DialogFooter>
//       </Dialog>
//     </div>
//   );
// };

// export default AppointmentsPage;


