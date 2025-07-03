import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Avatar,
  Chip,
  IconButton,
  CardFooter,
} from "@material-tailwind/react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Input,
  Textarea
} from "@material-tailwind/react";
import UpdatePatientModal from './component/UpdatePatientModal'; 

import { useEffect, useState } from "react";
import { useForm, Controller, set } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getPatientTable } from "@/data/patientTable";
import { createPatient } from '/src/data/createPatient.js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { createAppointment, getAppointments } from "@/data/appointmentsData";
import axios from "axios";
import axiosInstance from "@/api/axiosInstance";
import PatientDetailsModal from "./component/PatientDetailsModal";
import { useNavigate } from "react-router-dom";
import { getVaccinationRecords } from "@/data/getVaccinationRecords";
import { Icon } from "lucide-react";
import dayjs from "dayjs";


// Validation schemas - Messages en français
const parentInfoSchema = Yup.object().shape({
  fullName: Yup.string()
    .required('Le nom complet est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères')
    .matches(/^[a-zA-Z\s'-]+$/, 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes')
    .trim(),
  email: Yup.string()
    .required('L\'email est requis')
    .email('Veuillez entrer une adresse email valide')
    .max(254, 'L\'email ne doit pas dépasser 254 caractères')
    .lowercase()
    .trim(),
  phoneNumber: Yup.string()
    .required('Le numéro de téléphone est requis')
    .matches(/^[\d\s\-\+\(\)]+$/, 'Veuillez entrer un numéro de téléphone valide')
    .min(10, 'Le numéro de téléphone doit contenir au moins 10 chiffres')
    .max(20, 'Le numéro de téléphone ne doit pas dépasser 20 caractères')
    .trim()
});

const patientInfoSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne doit pas dépasser 50 caractères')
    .matches(/^[a-zA-Z\s'-]+$/, 'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes')
    .trim(),
  lastName: Yup.string()
    .required('Le nom de famille est requis')
    .min(2, 'Le nom de famille doit contenir au moins 2 caractères')
    .max(50, 'Le nom de famille ne doit pas dépasser 50 caractères')
    .matches(/^[a-zA-Z\s'-]+$/, 'Le nom de famille ne peut contenir que des lettres, espaces, tirets et apostrophes')
    .trim(),
  birthDate: Yup.date()
    .required('La date de naissance est requise')
    .max(new Date(), 'La date de naissance ne peut pas être dans le futur')
    .min(new Date('1900-01-01'), 'La date de naissance ne peut pas être antérieure à 1900'),
  gender: Yup.string()
    .required('Le sexe est requis')
    .oneOf(['male', 'female'], 'Veuillez sélectionner un sexe valide'),
});

const appointmentSchema = Yup.object().shape({
  date: Yup.date()
    .required('La date est requise')
    .min(new Date(), 'La date du rendez-vous ne peut pas être dans le passé'),
  time: Yup.string()
    .required('L\'heure est requise')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Veuillez entrer une heure valide'),
  reason: Yup.string()
    .required('Le motif de la visite est requis')
    .min(5, 'Le motif doit contenir au moins 5 caractères')
    .max(500, 'Le motif ne doit pas dépasser 500 caractères')
    .trim()
});

// Utility function to sanitize input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
};

// Time slots available for booking
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00"
];




export function Patient() {
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [patients, setPatients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [patientsLength, setPatientsLength] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(5); // Adjust as needed



// Filter patients based on search term and status
const filteredPatients = patients.filter(patient => {
  const matchesSearch = 
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.parent?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.parent?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  
  const matchesStatus = 
    filterStatus === 'all' || 
    (filterStatus === 'withAppointments' && patient.appointments?.length > 0) ||
    (filterStatus === 'withoutAppointments' && (!patient.appointments || patient.appointments.length === 0));
  
  return matchesSearch && matchesStatus;
});

// Get current patients for pagination
const indexOfLastPatient = currentPage * patientsPerPage;
const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

// Change page
const paginate = (pageNumber) => setCurrentPage(pageNumber);

const navigate = useNavigate();

const handleViewDetails = async (patient) => {
  console.log('Navigating to:', `/patients/details/${patient._id}`);
  const vaccinations = await getVaccinationRecords(patient._id);
  navigate(`/dashboard/patients/details/${patient._id}`, {
    state: {
      patient,
      vaccinations, 
      appointments: patient.appointments || []
    }
  });
};

const [detailsModalOpen, setDetailsModalOpen] = useState(false);
const [patientToView, setPatientToView] = useState(null);

// Add these handler functions (around line 125)
const handleViewDetailsOpen = (patient) => {
  setPatientToView(patient);
  setDetailsModalOpen(true);
};

const handleViewDetailsClose = () => {
  setDetailsModalOpen(false);
  setPatientToView(null);
};


  // Add these state variables in your Patient component
const [updateModalOpen, setUpdateModalOpen] = useState(false);
const [patientToUpdate, setPatientToUpdate] = useState(null);

// Add these handler functions in your Patient component
const handleUpdateModalOpen = (patient) => {
  setPatientToUpdate(patient);
  setUpdateModalOpen(true);
};

const handleUpdateModalClose = () => {
  setUpdateModalOpen(false);
  setPatientToUpdate(null);
};

const handlePatientUpdated = async () => {
  try {
    const updatedPatients = await getPatientTable();
    setPatients(updatedPatients);
    toast.success('Liste des patients actualisée');
  } catch (error) {
    console.error('Error refreshing patient list:', error);
    toast.error('Échec de l\'actualisation de la liste des patients');
  }
};

  // React Hook Form setup for parent info
  const parentForm = useForm({
    resolver: yupResolver(parentInfoSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: ''
    },
    mode: 'onBlur'
  });

  // React Hook Form setup for patient info
  const patientForm = useForm({
    resolver: yupResolver(patientInfoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: '',
    },
    mode: 'onBlur'
  });

  // React Hook Form setup for appointment
  const appointmentForm = useForm({
    resolver: yupResolver(appointmentSchema),
    defaultValues: {
      date: '',
      time: '',
      reason: ''
    },
    mode: 'onBlur'
  });


  
  const handleOpen = async (patient) => {
    setSelectedPatient(patient);

    console.log('Selected patient:', patient);
    setOpen(true);
    appointmentForm.reset();
    setSelectedDate(null);
    setSelectedTime(null);

    try {
      const appointmentsData = await getAppointments();
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Échec du chargement des données de rendez-vous');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPatient(null);
    appointmentForm.reset();
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleCreateModalOpen = () => {
    setCreateModalOpen(true);
    setCurrentStep(1);
    parentForm.reset();
    patientForm.reset();
  };

  const handleCreateModalClose = () => {
    setCreateModalOpen(false);
    setCurrentStep(1);
    parentForm.reset();
    patientForm.reset();
  };

  const handleNextStep = async () => {
    try {
      const isValid = await parentForm.trigger();
      if (!isValid) {
        toast.error('Veuillez corriger les erreurs dans le formulaire des informations du parent');
        return;
      }
      setCurrentStep(2);
      toast.success('Informations du parent validées avec succès');
    } catch (error) {
      toast.error('Erreur de validation');
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleCreatePatient = async (patientData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const parentData = parentForm.getValues();

      const sanitizedData = {
        fullName: sanitizeInput(parentData.fullName),
        email: sanitizeInput(parentData.email.toLowerCase()),
        phoneNumber: sanitizeInput(parentData.phoneNumber),
        firstName: sanitizeInput(patientData.firstName),
        lastName: sanitizeInput(patientData.lastName),
        birthDate: patientData.birthDate,
        gender: patientData.gender,
        role: "parent",
        address: 'swirate rhamna'
      };

      const response = await createPatient(sanitizedData);

      if (!response) {
        throw new Error('Échec de la création du patient');
      }
      setPatientsLength(patientsLength + 1);

      toast.success('Patient créé avec succès !', {
        position: "top-right",
        autoClose: 3000,
      });

      handleCreateModalClose();

      // const updatedPatients = await getPatientTable();
      setPatients(updatedPatients);

    } catch (error) {
      console.error('Error creating patient:', error);
      // toast.error(`Erreur lors de la création du patient: ${error.message}`, {
      //   position: "top-right",
      //   autoClose: 5000,
      // });
    } finally {
      setIsSubmitting(false);
    }
  };


const handleAppointmentSubmit = async (appointmentData) => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    if (!selectedPatient || !selectedPatient.patientId) {
      throw new Error('Aucun patient sélectionné ou ID patient manquant');
    }

    if (!selectedDate) {
      throw new Error('Veuillez sélectionner une date');
    }

    if (!selectedTime) {
      throw new Error('Veuillez sélectionner une heure');
    }

    // Properly format the date as YYYY-MM-DD
    const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');

    const sanitizedAppointmentData = {
      patientId: selectedPatient.patientId,
      date: formattedDate,
      time: selectedTime,
      type: 'consultation',
      notes: appointmentData.reason || '' // Use empty string if reason is undefined
    };

    console.log('Sending appointment data:', sanitizedAppointmentData);

    const res = await createAppointment(sanitizedAppointmentData);

    if (res && res.error) {
      throw new Error(res.error || 'Échec de la création du rendez-vous');
    }
  
    toast.success('Rendez-vous réservé avec succès !', {
      position: "top-right",
      autoClose: 3000,
    });

    handleClose();

    const updatedAppointments = await getAppointments();
    setAppointments(updatedAppointments);

  } catch (error) {
    console.error('Error booking appointment:', error);
    toast.error(`Erreur lors de la réservation du rendez-vous: ${error.message}`, {
      position: "top-right",
      autoClose: 5000,
    });
  } finally {
    setIsSubmitting(false);
  }
};
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    appointmentForm.setValue('time', time);
  };

  const isTimeSlotBooked = (time) => {
    if (!selectedDate) return false;

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return appointments.some(appt => {
      const apptDate = new Date(appt.date).toISOString().split('T')[0];
      return apptDate === selectedDateStr && appt.time === time;
    });
  };

  const tileDisabled = ({ date, view }) => {
    // Disable dates in the past
    if (view === 'month') {
      return date < new Date(new Date().setHours(0, 0, 0, 0));
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const hasAppointments = appointments.some(appt => {
        const apptDate = new Date(appt.date).toISOString().split('T')[0];
        return apptDate === dateStr;
      });

      if (hasAppointments) {
        return 'has-appointments';
      }
    }
  };

 useEffect(() => {
  const fetchPatients = async () => {
    try {
      const patientsData = await getPatientTable();
      setPatients(patientsData);
      console.log('Patients data fetched:', patientsData);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  fetchPatients();
}, [patientsLength]);


  const handleDelete = async (patientId) => {

    console.log('Deleting patient with ID:', patientId);
    if (!patientId) {
      toast.error('ID du patient manquant');
      return;
    }

    try {
      const response = await axiosInstance.delete(`patients/${patientId}`);

      toast.success('Patient supprimé avec succès !', {
        position: "top-right",
        autoClose: 3000,
      });

      // Refresh the patients list
      const updatedPatients = await getPatientTable();
      setPatients(updatedPatients);

    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error(`Erreur lors de la suppression du patient: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  }

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <ToastContainer />

      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Typography variant="h6" color="white" className="w-full md:w-auto">
              Patients
            </Typography>
            <div className="flex gap-2 w-full md:w-auto justify-end">
              {/* Search Icon Input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <Input
                  placeholder="Rechercher des patients..."
                  color="white"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-3 py-2 text-white bg-white bg-opacity-10 border border-white border-opacity-20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  style={{ minWidth: 200 }}
                />
              </div>
              {/* Filter Icon Dropdown */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  style={{ minWidth: 180 }}
                >
                  <option value="all">Tous les Patients</option>
                  <option value="withAppointments">Avec Rendez-vous</option>
                  <option value="withoutAppointments">Sans Rendez-vous</option>
                </select>
              </div>
              <Button
                size="sm"
                color="white"
                variant="filled"
                onClick={handleCreateModalOpen}
                className="ml-2"
              >
                Ajouter un Nouveau Patient
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["patient", "parents", "statut des rendez-vous", "Date", "Prendre Rendez-vous", "Actions"].map((el) => (
                  <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                    <Typography
                      variant="small"
                      className="text-[11px] font-bold uppercase text-blue-gray-400"
                    >
                      {el}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPatients.map((patient, key) => {
                const className = `py-3 px-5 ${key === patients.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                return (
                  <tr key={patient._id || key}>
                    {/* Patient Column */}
                    <td className={className}>
                      <div className="flex items-center gap-4">
                        <Avatar src={patient.img} alt={patient.firstName} size="sm" variant="rounded" />
                        <div>
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            <span className="text-xs font-normal">prénom :</span> {patient.firstName} <span className="text-xs font-normal">nom :</span> {patient.lastName}
                          </Typography>
                          <Typography className="text-xs font-normal text-blue-gray-500">
                            Sexe: {patient.gender === 'male' ? 'Masculin' : patient.gender === 'female' ? 'Féminin' : 'Non spécifié'}
                          </Typography>
                        </div>
                      </div>
                    </td>
                    {/* Parents Column */}
                    <td className={className}>
                      <div className="flex items-center gap-4">
                        <div>
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            {patient.parent?.fullName || 'Non spécifié'}
                          </Typography>
                          <Typography className="text-xs font-normal text-blue-gray-500">
                            {patient.parent?.email || patient.email || 'Pas d\'email'}
                          </Typography>
                        </div>
                      </div>
                    </td>
                    {/* Appointment Status Column */}
                    <td className={className}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {patient.job && patient.job[0] ? patient.job[0] : 'Non spécifié'}
                      </Typography>
                      <Typography className="text-xs font-normal text-blue-gray-500">
                        Statut: {patient.appointments?.length > 0 ? 'A des rendez-vous' : 'Pas de rendez-vous'}
                      </Typography>
                    </td>
                    {/* Date Column */}
                    <td className={className}>
                      {patient.appointments && patient.appointments.length > 0 ? (
                        <>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {patient.appointments[0].date}
                          </Typography>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            à: {patient.appointments[0].time}
                          </Typography>
                        </>
                      ) : (
                        <Typography className="text-xs font-normal text-blue-gray-400">
                          Pas de rendez-vous
                        </Typography>
                      )}
                    </td>
                    {/* Take Appointment */}
                    <td className={className}>
                      <button
                        onClick={() => handleOpen(patient)}
                        className="text-xs font-normal text-blue-gray-500 underline ml-2 hover:text-blue-gray-700"
                      >
                        Prendre Rendez-vous
                      </button>
                    </td>
                    {/* Actions Column */}
                    <td className={className}>
                      <div className="flex gap-2">
                        <IconButton
                          variant="text"
                          color="blue"
                          size="sm"
                          onClick={() => handleUpdateModalOpen(patient)}
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6l11.293-11.293a1 1 0 000-1.414l-4.586-4.586a1 1 0 00-1.414 0L3 15v6z" />
                          </svg>
                        </IconButton>
                        <IconButton
                          variant="text"
                          color="red"
                          size="sm"
                          onClick={() => handleDelete(patient._id)}
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </IconButton>
                        <IconButton
                          variant="text"
                          color="green"
                          size="sm"
                          onClick={() => handleViewDetails(patient)}
                          title="Voir les Détails"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="4" />
                          </svg>
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
        <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
          <Typography variant="small" color="blue-gray" className="font-normal">
            Affichage de {indexOfFirstPatient + 1} à {Math.min(indexOfLastPatient, filteredPatients.length)} sur {filteredPatients.length} entrées
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
            >
              Précédent
            </Button>
            {Array.from({ length: Math.ceil(filteredPatients.length / patientsPerPage) }).map((_, index) => (
              <IconButton
                key={index}
                variant={currentPage === index + 1 ? "filled" : "text"}
                size="sm"
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </IconButton>
            ))}
            <Button
              variant="outlined"
              size="sm"
              disabled={currentPage === Math.ceil(filteredPatients.length / patientsPerPage)}
              onClick={() => paginate(currentPage + 1)}
            >
              Suivant
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Update Patient Modal */}
      <UpdatePatientModal
        open={updateModalOpen}
        onClose={handleUpdateModalClose}
        patient={patientToUpdate}
        onPatientUpdated={handlePatientUpdated}
      />

      {/* Appointment Modal */}
      <Dialog open={open} handler={handleClose} size="xl" className="h-screen overflow-auto">
        <DialogHeader>Réserver un Rendez-vous</DialogHeader>
        <form onSubmit={appointmentForm.handleSubmit(handleAppointmentSubmit)}>
          <DialogBody className="flex flex-col gap-4">
            {selectedPatient && (
              <>
                <Typography variant="h6">Patient: {selectedPatient.name}</Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography variant="h6" className="mb-2">Sélectionner la Date</Typography>
                    <Calendar
                      onChange={handleDateChange}
                      value={selectedDate}
                      minDate={new Date()}
                      tileDisabled={tileDisabled}
                      tileClassName={tileClassName}
                      className="border rounded-lg p-2 w-full"
                    />
                  </div>
                  <div>
                    <Typography variant="h6" className="mb-2">Créneaux Horaires Disponibles</Typography>
                    {selectedDate ? (
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map(time => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "filled" : "outlined"}
                            color={isTimeSlotBooked(time) ? "red" : selectedTime === time ? "blue" : "gray"}
                            onClick={() => !isTimeSlotBooked(time) && handleTimeSelect(time)}
                            disabled={isTimeSlotBooked(time)}
                            className="p-2 text-sm"
                          >
                            {time}
                            {isTimeSlotBooked(time) && (
                              <span className="ml-1 text-xs">(Réservé)</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Typography variant="small" color="gray">
                        Veuillez d'abord sélectionner une date
                      </Typography>
                    )}
                  </div>
                </div>
                <div>
                  <Controller
                    name="reason"
                    control={appointmentForm.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Textarea
                          {...field}
                          label="Motif de la Visite *"
                          error={!!fieldState.error}
                        />
                        <FieldError error={fieldState.error} />
                      </>
                    )}
                  />
                </div>
              </>
            )}
          </DialogBody>
          <DialogFooter className="flex justify-between">
            <Button variant="outlined" color="red" onClick={handleClose} type="button">
              Annuler
            </Button>
            <Button
              variant="gradient"
              color="green"
              type="submit"
              disabled={isSubmitting || !selectedDate || !selectedTime}
              onClick={handleAppointmentSubmit}
            >
              {isSubmitting ? 'Réservation...' : 'Réserver le Rendez-vous'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Create Patient Modal */}
      <Dialog open={createModalOpen} handler={handleCreateModalClose} size="xl" className="max-h-screen overflow-auto">
        <DialogHeader className="flex justify-between items-center">
          <div>
            <Typography variant="h5">
              {currentStep === 1 ? 'Informations du Parent' : 'Informations du Patient'}
            </Typography>
            <Typography variant="small" color="gray" className="font-normal">
              Étape {currentStep} sur 2
            </Typography>
          </div>
          <div className="flex gap-2">
            <div className={`w-8 h-2 rounded-full ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div className={`w-8 h-2 rounded-full ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          </div>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4 max-h-96 overflow-y-auto">
          {currentStep === 1 ? (
            // Parent Information Step
            <>
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Détails du Parent/Tuteur
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Controller
                    name="fullName"
                    control={parentForm.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          label="Nom Complet *"
                          error={!!fieldState.error}
                        />
                        <FieldError error={fieldState.error} />
                      </>
                    )}
                  />
                </div>
                <div>
                  <Controller
                    name="email"
                    control={parentForm.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          label="Adresse Email *"
                          type="email"
                          error={!!fieldState.error}
                        />
                        <FieldError error={fieldState.error} />
                      </>
                    )}
                  />
                </div>
              </div>
              <div>
                <Controller
                  name="phoneNumber"
                  control={parentForm.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        label="Numéro de Téléphone *"
                        error={!!fieldState.error}
                      />
                      <FieldError error={fieldState.error} />
                    </>
                  )}
                />
              </div>
            </>
          ) : (
            // Patient Information Step
            <form onSubmit={patientForm.handleSubmit(handleCreatePatient)}>
              <Typography variant="h6" color="blue-gray" className="mb-4">
                Détails du Patient
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Controller
                    name="firstName"
                    control={patientForm.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          label="Prénom *"
                          error={!!fieldState.error}
                        />
                        <FieldError error={fieldState.error} />
                      </>
                    )}
                  />
                </div>
                <div>
                  <Controller
                    name="lastName"
                    control={patientForm.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          label="Nom de Famille *"
                          error={!!fieldState.error}
                        />
                        <FieldError error={fieldState.error} />
                      </>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Controller
                    name="birthDate"
                    control={patientForm.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          label="Date de Naissance *"
                          type="date"
                          error={!!fieldState.error}
                        />
                        <FieldError error={fieldState.error} />
                      </>
                    )}
                  />
                </div>
                <div>
                  <Controller
                    name="gender"
                    control={patientForm.control}
                    render={({ field, fieldState }) => (
                      <>
                        <select
                          {...field}
                          className={`w-full p-3 border rounded-md focus:outline-none ${fieldState.error
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                            }`}
                        >
                          <option value="">Sélectionner le Sexe *</option>
                          <option value="male">Masculin</option>
                          <option value="female">Féminin</option>
                        </select>
                        <FieldError error={fieldState.error} />
                      </>
                    )}
                  />
                </div>
              </div>
              {/* Summary of Parent Info */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <Typography variant="small" color="gray" className="font-semibold mb-2">
                  Résumé des Informations du Parent :
                </Typography>
                <Typography variant="small" color="gray">
                  <strong>Nom :</strong> {parentForm.watch('fullName')}<br />
                  <strong>Email :</strong> {parentForm.watch('email')}<br />
                  <strong>Téléphone :</strong> {parentForm.watch('phoneNumber')}
                </Typography>
              </div>
            </form>
          )}
        </DialogBody>
        <DialogFooter className="flex justify-between">
          <Button
            variant="outlined"
            color="red"
            onClick={handleCreateModalClose}
            type="button"
          >
            Annuler
          </Button>
          <div className="flex gap-2">
            {currentStep === 2 && (
              <Button
                variant="outlined"
                color="gray"
                onClick={handlePreviousStep}
                type="button"
              >
                Précédent
              </Button>
            )}
            {currentStep === 1 ? (
              <Button
                variant="gradient"
                color="blue"
                onClick={handleNextStep}
                type="button"
              >
                Suivant
              </Button>
            ) : (
              <Button
                variant="gradient"
                color="green"
                onClick={patientForm.handleSubmit(handleCreatePatient)}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? 'Création...' : 'Créer le Patient'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default Patient;




// english
// import {
//   Card,
//   CardHeader,
//   CardBody,
//   Typography,
//   Avatar,
//   Chip,
//   IconButton,
//   CardFooter,
// } from "@material-tailwind/react";
// import {
//   Dialog,
//   DialogHeader,
//   DialogBody,
//   DialogFooter,
//   Button,
//   Input,
//   Textarea
// } from "@material-tailwind/react";
// import UpdatePatientModal from './componet/UpdatePatientModal'; 

// import { useEffect, useState } from "react";
// import { useForm, Controller, set } from "react-hook-form";
// import { yupResolver } from "@hookform/resolvers/yup";
// import * as Yup from "yup";
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { getPatientTable } from "@/data/patientTable";
// import { createPatient } from '/src/data/createPatient.js';
// import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';
// import { createAppointment, getAppointments } from "@/data/appointmentsData";
// import axios from "axios";
// import axiosInstance from "@/api/axiosInstance";
// import PatientDetailsModal from "./componet/PatientDetailsModal";
// import { useNavigate } from "react-router-dom";
// import { getVaccinationRecords } from "@/data/getVaccinationRecords";
// import { Icon } from "lucide-react";
// import dayjs from "dayjs";


// // Validation schemas
// const parentInfoSchema = Yup.object().shape({
//   fullName: Yup.string()
//     .required('Full name is required')
//     .min(2, 'Name must be at least 2 characters')
//     .max(100, 'Name must not exceed 100 characters')
//     .matches(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
//     .trim(),
//   email: Yup.string()
//     .required('Email is required')
//     .email('Please enter a valid email address')
//     .max(254, 'Email must not exceed 254 characters')
//     .lowercase()
//     .trim(),
//   phoneNumber: Yup.string()
//     .required('Phone number is required')
//     .matches(/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number')
//     .min(10, 'Phone number must be at least 10 digits')
//     .max(20, 'Phone number must not exceed 20 characters')
//     .trim()
// });

// const patientInfoSchema = Yup.object().shape({
//   firstName: Yup.string()
//     .required('First name is required')
//     .min(2, 'First name must be at least 2 characters')
//     .max(50, 'First name must not exceed 50 characters')
//     .matches(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
//     .trim(),
//   lastName: Yup.string()
//     .required('Last name is required')
//     .min(2, 'Last name must be at least 2 characters')
//     .max(50, 'Last name must not exceed 50 characters')
//     .matches(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
//     .trim(),
//   birthDate: Yup.date()
//     .required('Birth date is required')
//     .max(new Date(), 'Birth date cannot be in the future')
//     .min(new Date('1900-01-01'), 'Birth date cannot be before 1900'),
//   gender: Yup.string()
//     .required('Gender is required')
//     .oneOf(['male', 'female'], 'Please select a valid gender'),
// });

// const appointmentSchema = Yup.object().shape({
//   date: Yup.date()
//     .required('Date is required')
//     .min(new Date(), 'Appointment date cannot be in the past'),
//   time: Yup.string()
//     .required('Time is required')
//     .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time'),
//   reason: Yup.string()
//     .required('Reason for visit is required')
//     .min(5, 'Reason must be at least 5 characters')
//     .max(500, 'Reason must not exceed 500 characters')
//     .trim()
// });

// // Utility function to sanitize input
// const sanitizeInput = (input) => {
//   if (typeof input !== 'string') return input;
//   return input
//     .replace(/[<>]/g, '') // Remove potential HTML tags
//     .trim();
// };

// // Time slots available for booking
// const TIME_SLOTS = [
//   "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
//   "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
//   "15:00", "15:30", "16:00", "16:30", "17:00"
// ];




// export function Patient() {
//   const [open, setOpen] = useState(false);
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [createModalOpen, setCreateModalOpen] = useState(false);
//   const [currentStep, setCurrentStep] = useState(1);
//   const [patients, setPatients] = useState([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [appointments, setAppointments] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [selectedTime, setSelectedTime] = useState(null);

//   const [patientsLength, setPatientsLength] = useState(0);



//   const [searchTerm, setSearchTerm] = useState('');
// const [filterStatus, setFilterStatus] = useState('all');
// const [currentPage, setCurrentPage] = useState(1);
// const [patientsPerPage] = useState(5); // Adjust as needed



// // Filter patients based on search term and status
// const filteredPatients = patients.filter(patient => {
//   const matchesSearch = 
//     patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     patient.parent?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     patient.parent?.email?.toLowerCase().includes(searchTerm.toLowerCase());
  
//   const matchesStatus = 
//     filterStatus === 'all' || 
//     (filterStatus === 'withAppointments' && patient.appointments?.length > 0) ||
//     (filterStatus === 'withoutAppointments' && (!patient.appointments || patient.appointments.length === 0));
  
//   return matchesSearch && matchesStatus;
// });

// // Get current patients for pagination
// const indexOfLastPatient = currentPage * patientsPerPage;
// const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
// const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

// // Change page
// const paginate = (pageNumber) => setCurrentPage(pageNumber);

// const navigate = useNavigate();

// const handleViewDetails = async (patient) => {
//   console.log('Navigating to:', `/patients/details/${patient._id}`);
//   const vaccinations = await getVaccinationRecords(patient._id);
//   navigate(`/dashboard/patients/details/${patient._id}`, {
//     state: {
//       patient,
//       vaccinations, 
//       appointments: patient.appointments || []
//     }
//   });
// };

// const [detailsModalOpen, setDetailsModalOpen] = useState(false);
// const [patientToView, setPatientToView] = useState(null);

// // Add these handler functions (around line 125)
// const handleViewDetailsOpen = (patient) => {
//   setPatientToView(patient);
//   setDetailsModalOpen(true);
// };

// const handleViewDetailsClose = () => {
//   setDetailsModalOpen(false);
//   setPatientToView(null);
// };


//   // Add these state variables in your Patient component
// const [updateModalOpen, setUpdateModalOpen] = useState(false);
// const [patientToUpdate, setPatientToUpdate] = useState(null);

// // Add these handler functions in your Patient component
// const handleUpdateModalOpen = (patient) => {
//   setPatientToUpdate(patient);
//   setUpdateModalOpen(true);
// };

// const handleUpdateModalClose = () => {
//   setUpdateModalOpen(false);
//   setPatientToUpdate(null);
// };

// const handlePatientUpdated = async () => {
//   try {
//     const updatedPatients = await getPatientTable();
//     setPatients(updatedPatients);
//     toast.success('Patient list refreshed');
//   } catch (error) {
//     console.error('Error refreshing patient list:', error);
//     toast.error('Failed to refresh patient list');
//   }
// };

//   // React Hook Form setup for parent info
//   const parentForm = useForm({
//     resolver: yupResolver(parentInfoSchema),
//     defaultValues: {
//       fullName: '',
//       email: '',
//       phoneNumber: ''
//     },
//     mode: 'onBlur'
//   });

//   // React Hook Form setup for patient info
//   const patientForm = useForm({
//     resolver: yupResolver(patientInfoSchema),
//     defaultValues: {
//       firstName: '',
//       lastName: '',
//       birthDate: '',
//       gender: '',
//     },
//     mode: 'onBlur'
//   });

//   // React Hook Form setup for appointment
//   const appointmentForm = useForm({
//     resolver: yupResolver(appointmentSchema),
//     defaultValues: {
//       date: '',
//       time: '',
//       reason: ''
//     },
//     mode: 'onBlur'
//   });


  
//   const handleOpen = async (patient) => {
//     setSelectedPatient(patient);

//     console.log('Selected patient:', patient);
//     setOpen(true);
//     appointmentForm.reset();
//     setSelectedDate(null);
//     setSelectedTime(null);

//     try {
//       const appointmentsData = await getAppointments();
//       setAppointments(appointmentsData);
//     } catch (error) {
//       console.error('Error fetching appointments:', error);
//       toast.error('Failed to load appointment data');
//     }
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setSelectedPatient(null);
//     appointmentForm.reset();
//     setSelectedDate(null);
//     setSelectedTime(null);
//   };

//   const handleCreateModalOpen = () => {
//     setCreateModalOpen(true);
//     setCurrentStep(1);
//     parentForm.reset();
//     patientForm.reset();
//   };

//   const handleCreateModalClose = () => {
//     setCreateModalOpen(false);
//     setCurrentStep(1);
//     parentForm.reset();
//     patientForm.reset();
//   };

//   const handleNextStep = async () => {
//     try {
//       const isValid = await parentForm.trigger();
//       if (!isValid) {
//         toast.error('Please fix the errors in the parent information form');
//         return;
//       }
//       setCurrentStep(2);
//       toast.success('Parent information validated successfully');
//     } catch (error) {
//       toast.error('Validation error occurred');
//     }
//   };

//   const handlePreviousStep = () => {
//     setCurrentStep(1);
//   };

//   const handleCreatePatient = async (patientData) => {
//     if (isSubmitting) return;

//     setIsSubmitting(true);

//     try {
//       const parentData = parentForm.getValues();

//       const sanitizedData = {
//         fullName: sanitizeInput(parentData.fullName),
//         email: sanitizeInput(parentData.email.toLowerCase()),
//         phoneNumber: sanitizeInput(parentData.phoneNumber),
//         firstName: sanitizeInput(patientData.firstName),
//         lastName: sanitizeInput(patientData.lastName),
//         birthDate: patientData.birthDate,
//         gender: patientData.gender,
//         role: "parent",
//         address: 'swirate rhamna'
//       };

//       const response = await createPatient(sanitizedData);

//       if (!response) {
//         throw new Error('Failed to create patient');
//       }
//       setPatientsLength(patientsLength + 1);

//       toast.success('Patient created successfully!', {
//         position: "top-right",
//         autoClose: 3000,
//       });

//       handleCreateModalClose();

//       // const updatedPatients = await getPatientTable();
//       setPatients(updatedPatients);

//     } catch (error) {
//       console.error('Error creating patient:', error);
//       // toast.error(`Error creating patient: ${error.message}`, {
//       //   position: "top-right",
//       //   autoClose: 5000,
//       // });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };


// const handleAppointmentSubmit = async (appointmentData) => {
//   if (isSubmitting) return;
//   setIsSubmitting(true);

//   try {
//     if (!selectedPatient || !selectedPatient.patientId) {
//       throw new Error('No patient selected or patient ID missing');
//     }

//     if (!selectedDate) {
//       throw new Error('Please select a date');
//     }

//     if (!selectedTime) {
//       throw new Error('Please select a time');
//     }

//     // Properly format the date as YYYY-MM-DD
//     const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');

//     const sanitizedAppointmentData = {
//       patientId: selectedPatient.patientId,
//       date: formattedDate,
//       time: selectedTime,
//       type: 'consultation',
//       notes: appointmentData.reason || '' // Use empty string if reason is undefined
//     };

//     console.log('Sending appointment data:', sanitizedAppointmentData);

//     const res = await createAppointment(sanitizedAppointmentData);

//     if (res && res.error) {
//       throw new Error(res.error || 'Failed to create appointment');
//     }
  
//     toast.success('Appointment booked successfully!', {
//       position: "top-right",
//       autoClose: 3000,
//     });

//     handleClose();

//     const updatedAppointments = await getAppointments();
//     setAppointments(updatedAppointments);

//   } catch (error) {
//     console.error('Error booking appointment:', error);
//     toast.error(`Error booking appointment: ${error.message}`, {
//       position: "top-right",
//       autoClose: 5000,
//     });
//   } finally {
//     setIsSubmitting(false);
//   }
// };
//   const handleDateChange = (date) => {
//     setSelectedDate(date);
//     setSelectedTime(null); // Reset time when date changes
//   };

//   const handleTimeSelect = (time) => {
//     setSelectedTime(time);
//     appointmentForm.setValue('time', time);
//   };

//   const isTimeSlotBooked = (time) => {
//     if (!selectedDate) return false;

//     const selectedDateStr = selectedDate.toISOString().split('T')[0];
//     return appointments.some(appt => {
//       const apptDate = new Date(appt.date).toISOString().split('T')[0];
//       return apptDate === selectedDateStr && appt.time === time;
//     });
//   };

//   const tileDisabled = ({ date, view }) => {
//     // Disable dates in the past
//     if (view === 'month') {
//       return date < new Date(new Date().setHours(0, 0, 0, 0));
//     }
//   };

//   const tileClassName = ({ date, view }) => {
//     if (view === 'month') {
//       const dateStr = date.toISOString().split('T')[0];
//       const hasAppointments = appointments.some(appt => {
//         const apptDate = new Date(appt.date).toISOString().split('T')[0];
//         return apptDate === dateStr;
//       });

//       if (hasAppointments) {
//         return 'has-appointments';
//       }
//     }
//   };

//   useEffect(() => async () => {
//     const patientsData = await getPatientTable();
//     setPatients(patientsData);
//     console.log('Patients data fetched:', patientsData);
//   }, [patientsLength]);

//   // Helper component for form field errors
//   const FieldError = ({ error }) => (
//     error ? (
//       <Typography variant="small" color="red" className="mt-1 text-xs">
//         {error.message}
//       </Typography>
//     ) : null
//   );


//   const handleDelete = async (patientId) => {

//     console.log('Deleting patient with ID:', patientId);
//     if (!patientId) {
//       toast.error('Patient ID is missing');
//       return;
//     }

//     try {
//       const response = await axiosInstance.delete(`patients/${patientId}`);

//       toast.success('Patient deleted successfully!', {
//         position: "top-right",
//         autoClose: 3000,
//       });

//       // Refresh the patients list
//       const updatedPatients = await getPatientTable();
//       setPatients(updatedPatients);

//     } catch (error) {
//       console.error('Error deleting patient:', error);
//       toast.error(`Error deleting patient: ${error.message}`, {
//         position: "top-right",
//         autoClose: 5000,
//       });
//     }
//   }

//   return (
//     <div className="mt-12 mb-8 flex flex-col gap-12">
//       <ToastContainer />

//       <Card>
//         <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
//           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
//             <Typography variant="h6" color="white" className="w-full md:w-auto">
//               Patients
//             </Typography>
//             <div className="flex gap-2 w-full md:w-auto justify-end">
//               {/* Search Icon Input */}
//               <div className="relative">
//                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
//                   <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                     <circle cx="11" cy="11" r="8" />
//                     <line x1="21" y1="21" x2="16.65" y2="16.65" />
//                   </svg>
//                 </span>
//                 <Input
//                   placeholder="Search patients..."
//                   color="white"
//                   value={searchTerm}
//                   onChange={(e) => {
//                     setSearchTerm(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                   className="pl-9 pr-3 py-2 text-white bg-white bg-opacity-10 border border-white border-opacity-20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//                   style={{ minWidth: 200 }}
//                 />
//               </div>
//               {/* Filter Icon Dropdown */}
//               <div className="relative">
//                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
//                   <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                     <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
//                   </svg>
//                 </span>
//                 <select
//                   value={filterStatus}
//                   onChange={(e) => {
//                     setFilterStatus(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                   className="pl-9 pr-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//                   style={{ minWidth: 180 }}
//                 >
//                   <option value="all">All Patients</option>
//                   <option value="withAppointments">With Appointments</option>
//                   <option value="withoutAppointments">Without Appointments</option>
//                 </select>
//               </div>
//               <Button
//                 size="sm"
//                 color="white"
//                 variant="filled"
//                 onClick={handleCreateModalOpen}
//                 className="ml-2"
//               >
//                 Add New Patient
//               </Button>
//             </div>
//           </div>
//         </CardHeader>
//         <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
//           <table className="w-full min-w-[640px] table-auto">
//             <thead>
//               <tr>
//                 {["patient", "parents", "appointments status", "Date", "Take Appointment", "Actions"].map((el) => (
//                   <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
//                     <Typography
//                       variant="small"
//                       className="text-[11px] font-bold uppercase text-blue-gray-400"
//                     >
//                       {el}
//                     </Typography>
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {currentPatients.map((patient, key) => {
//                 const className = `py-3 px-5 ${key === patients.length - 1 ? "" : "border-b border-blue-gray-50"}`;
//                 return (
//                   <tr key={patient._id || key}>
//                     {/* Patient Column */}
//                     <td className={className}>
//                       <div className="flex items-center gap-4">
//                         <Avatar src={patient.img} alt={patient.firstName} size="sm" variant="rounded" />
//                         <div>
//                           <Typography variant="small" color="blue-gray" className="font-semibold">
//                             <span className="text-xs font-normal">first name :</span> {patient.firstName} <span className="text-xs font-normal">last name :</span> {patient.lastName}
//                           </Typography>
//                           <Typography className="text-xs font-normal text-blue-gray-500">
//                             Gender: {patient.gender || 'Not specified'}
//                           </Typography>
//                         </div>
//                       </div>
//                     </td>
//                     {/* Parents Column */}
//                     <td className={className}>
//                       <div className="flex items-center gap-4">
//                         <div>
//                           <Typography variant="small" color="blue-gray" className="font-semibold">
//                             {patient.parent.fullName || 'Not specified'}
//                           </Typography>
//                           <Typography className="text-xs font-normal text-blue-gray-500">
//                             {patient.parent.email || patient.email || 'No email'}
//                           </Typography>
//                         </div>
//                       </div>
//                     </td>
//                     {/* Appointment Status Column */}
//                     <td className={className}>
//                       <Typography className="text-xs font-semibold text-blue-gray-600">
//                         {patient.job && patient.job[0] ? patient.job[0] : 'Not specified'}
//                       </Typography>
//                       <Typography className="text-xs font-normal text-blue-gray-500">
//                         Status: {patient.appointments?.length > 0 ? 'Has appointments' : 'No appointments'}
//                       </Typography>
//                     </td>
//                     {/* Date Column */}
//                     <td className={className}>
//                       {patient.appointments && patient.appointments.length > 0 ? (
//                         <>
//                           <Typography className="text-xs font-semibold text-blue-gray-600">
//                             {patient.appointments[0].date}
//                           </Typography>
//                           <Typography className="text-xs font-semibold text-blue-gray-600">
//                             at: {patient.appointments[0].time}
//                           </Typography>
//                         </>
//                       ) : (
//                         <Typography className="text-xs font-normal text-blue-gray-400">
//                           No appointment
//                         </Typography>
//                       )}
//                     </td>
//                     {/* Take Appointment */}
//                     <td className={className}>
//                       <button
//                         onClick={() => handleOpen(patient)}
//                         className="text-xs font-normal text-blue-gray-500 underline ml-2 hover:text-blue-gray-700"
//                       >
//                         Get Appointment
//                       </button>
//                     </td>
//                     {/* Actions Column */}
//                     <td className={className}>
//                       <div className="flex gap-2">
//                         <IconButton
//                           variant="text"
//                           color="blue"
//                           size="sm"
//                           onClick={() => handleUpdateModalOpen(patient)}
//                           title="Edit"
//                         >
//                           <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                             <path d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6l11.293-11.293a1 1 0 000-1.414l-4.586-4.586a1 1 0 00-1.414 0L3 15v6z" />
//                           </svg>
//                         </IconButton>
//                         <IconButton
//                           variant="text"
//                           color="red"
//                           size="sm"
//                           onClick={() => handleDelete(patient._id)}
//                           title="Delete"
//                         >
//                           <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                             <path d="M6 18L18 6M6 6l12 12" />
//                           </svg>
//                         </IconButton>
//                         <IconButton
//                           variant="text"
//                           color="green"
//                           size="sm"
//                           onClick={() => handleViewDetails(patient)}
//                           title="View Details"
//                         >
//                           <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                             <circle cx="12" cy="12" r="10" />
//                             <circle cx="12" cy="12" r="4" />
//                           </svg>
//                         </IconButton>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </CardBody>
//         <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
//           <Typography variant="small" color="blue-gray" className="font-normal">
//             Showing {indexOfFirstPatient + 1} to {Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} entries
//           </Typography>
//           <div className="flex gap-2">
//             <Button
//               variant="outlined"
//               size="sm"
//               disabled={currentPage === 1}
//               onClick={() => paginate(currentPage - 1)}
//             >
//               Previous
//             </Button>
//             {Array.from({ length: Math.ceil(filteredPatients.length / patientsPerPage) }).map((_, index) => (
//               <IconButton
//                 key={index}
//                 variant={currentPage === index + 1 ? "filled" : "text"}
//                 size="sm"
//                 onClick={() => paginate(index + 1)}
//               >
//                 {index + 1}
//               </IconButton>
//             ))}
//             <Button
//               variant="outlined"
//               size="sm"
//               disabled={currentPage === Math.ceil(filteredPatients.length / patientsPerPage)}
//               onClick={() => paginate(currentPage + 1)}
//             >
//               Next
//             </Button>
//           </div>
//         </CardFooter>
//       </Card>

//       {/* Update Patient Modal */}
//       <UpdatePatientModal
//         open={updateModalOpen}
//         onClose={handleUpdateModalClose}
//         patient={patientToUpdate}
//         onPatientUpdated={handlePatientUpdated}
//       />

//       {/* Appointment Modal */}
//       <Dialog open={open} handler={handleClose} size="xl" className="h-screen overflow-auto">
//         <DialogHeader>Book Appointment</DialogHeader>
//         <form onSubmit={appointmentForm.handleSubmit(handleAppointmentSubmit)}>
//           <DialogBody className="flex flex-col gap-4">
//             {selectedPatient && (
//               <>
//                 <Typography variant="h6">Patient: {selectedPatient.name}</Typography>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Typography variant="h6" className="mb-2">Select Date</Typography>
//                     <Calendar
//                       onChange={handleDateChange}
//                       value={selectedDate}
//                       minDate={new Date()}
//                       tileDisabled={tileDisabled}
//                       tileClassName={tileClassName}
//                       className="border rounded-lg p-2 w-full"
//                     />
//                   </div>
//                   <div>
//                     <Typography variant="h6" className="mb-2">Available Time Slots</Typography>
//                     {selectedDate ? (
//                       <div className="grid grid-cols-3 gap-2">
//                         {TIME_SLOTS.map(time => (
//                           <Button
//                             key={time}
//                             variant={selectedTime === time ? "filled" : "outlined"}
//                             color={isTimeSlotBooked(time) ? "red" : selectedTime === time ? "blue" : "gray"}
//                             onClick={() => !isTimeSlotBooked(time) && handleTimeSelect(time)}
//                             disabled={isTimeSlotBooked(time)}
//                             className="p-2 text-sm"
//                           >
//                             {time}
//                             {isTimeSlotBooked(time) && (
//                               <span className="ml-1 text-xs">(Booked)</span>
//                             )}
//                           </Button>
//                         ))}
//                       </div>
//                     ) : (
//                       <Typography variant="small" color="gray">
//                         Please select a date first
//                       </Typography>
//                     )}
//                   </div>
//                 </div>
//                 <div>
//                   <Controller
//                     name="reason"
//                     control={appointmentForm.control}
//                     render={({ field, fieldState }) => (
//                       <>
//                         <Textarea
//                           {...field}
//                           label="Reason for Visit *"
//                           error={!!fieldState.error}
//                         />
//                         <FieldError error={fieldState.error} />
//                       </>
//                     )}
//                   />
//                 </div>
//               </>
//             )}
//           </DialogBody>
//           <DialogFooter className="flex justify-between">
//             <Button variant="outlined" color="red" onClick={handleClose} type="button">
//               Cancel
//             </Button>
//             <Button
//               variant="gradient"
//               color="green"
//               type="submit"
//               disabled={isSubmitting || !selectedDate || !selectedTime}
//               onClick={handleAppointmentSubmit}
//             >
//               {isSubmitting ? 'Booking...' : 'Book Appointment'}
//             </Button>
//           </DialogFooter>
//         </form>
//       </Dialog>

//       {/* Create Patient Modal */}
//       <Dialog open={createModalOpen} handler={handleCreateModalClose} size="xl" className="max-h-screen overflow-auto">
//         <DialogHeader className="flex justify-between items-center">
//           <div>
//             <Typography variant="h5">
//               {currentStep === 1 ? 'Parent Information' : 'Patient Information'}
//             </Typography>
//             <Typography variant="small" color="gray" className="font-normal">
//               Step {currentStep} of 2
//             </Typography>
//           </div>
//           <div className="flex gap-2">
//             <div className={`w-8 h-2 rounded-full ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
//             <div className={`w-8 h-2 rounded-full ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
//           </div>
//         </DialogHeader>
//         <DialogBody className="flex flex-col gap-4 max-h-96 overflow-y-auto">
//           {currentStep === 1 ? (
//             // Parent Information Step
//             <>
//               <Typography variant="h6" color="blue-gray" className="mb-2">
//                 Parent/Guardian Details
//               </Typography>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Controller
//                     name="fullName"
//                     control={parentForm.control}
//                     render={({ field, fieldState }) => (
//                       <>
//                         <Input
//                           {...field}
//                           label="Full Name *"
//                           error={!!fieldState.error}
//                         />
//                         <FieldError error={fieldState.error} />
//                       </>
//                     )}
//                   />
//                 </div>
//                 <div>
//                   <Controller
//                     name="email"
//                     control={parentForm.control}
//                     render={({ field, fieldState }) => (
//                       <>
//                         <Input
//                           {...field}
//                           label="Email Address *"
//                           type="email"
//                           error={!!fieldState.error}
//                         />
//                         <FieldError error={fieldState.error} />
//                       </>
//                     )}
//                   />
//                 </div>
//               </div>
//               <div>
//                 <Controller
//                   name="phoneNumber"
//                   control={parentForm.control}
//                   render={({ field, fieldState }) => (
//                     <>
//                       <Input
//                         {...field}
//                         label="Phone Number *"
//                         error={!!fieldState.error}
//                       />
//                       <FieldError error={fieldState.error} />
//                     </>
//                   )}
//                 />
//               </div>
//             </>
//           ) : (
//             // Patient Information Step
//             <form onSubmit={patientForm.handleSubmit(handleCreatePatient)}>
//               <Typography variant="h6" color="blue-gray" className="mb-4">
//                 Patient Details
//               </Typography>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <Controller
//                     name="firstName"
//                     control={patientForm.control}
//                     render={({ field, fieldState }) => (
//                       <>
//                         <Input
//                           {...field}
//                           label="First Name *"
//                           error={!!fieldState.error}
//                         />
//                         <FieldError error={fieldState.error} />
//                       </>
//                     )}
//                   />
//                 </div>
//                 <div>
//                   <Controller
//                     name="lastName"
//                     control={patientForm.control}
//                     render={({ field, fieldState }) => (
//                       <>
//                         <Input
//                           {...field}
//                           label="Last Name *"
//                           error={!!fieldState.error}
//                         />
//                         <FieldError error={fieldState.error} />
//                       </>
//                     )}
//                   />
//                 </div>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <Controller
//                     name="birthDate"
//                     control={patientForm.control}
//                     render={({ field, fieldState }) => (
//                       <>
//                         <Input
//                           {...field}
//                           label="Birth Date *"
//                           type="date"
//                           error={!!fieldState.error}
//                         />
//                         <FieldError error={fieldState.error} />
//                       </>
//                     )}
//                   />
//                 </div>
//                 <div>
//                   <Controller
//                     name="gender"
//                     control={patientForm.control}
//                     render={({ field, fieldState }) => (
//                       <>
//                         <select
//                           {...field}
//                           className={`w-full p-3 border rounded-md focus:outline-none ${fieldState.error
//                             ? 'border-red-500 focus:border-red-500'
//                             : 'border-gray-300 focus:border-blue-500'
//                             }`}
//                         >
//                           <option value="">Select Gender *</option>
//                           <option value="male">Male</option>
//                           <option value="female">Female</option>
//                         </select>
//                         <FieldError error={fieldState.error} />
//                       </>
//                     )}
//                   />
//                 </div>
//               </div>
//               {/* Summary of Parent Info */}
//               <div className="mt-4 p-4 bg-gray-50 rounded-lg">
//                 <Typography variant="small" color="gray" className="font-semibold mb-2">
//                   Parent Information Summary:
//                 </Typography>
//                 <Typography variant="small" color="gray">
//                   <strong>Name:</strong> {parentForm.watch('fullName')}<br />
//                   <strong>Email:</strong> {parentForm.watch('email')}<br />
//                   <strong>Phone:</strong> {parentForm.watch('phoneNumber')}
//                 </Typography>
//               </div>
//             </form>
//           )}
//         </DialogBody>
//         <DialogFooter className="flex justify-between">
//           <Button
//             variant="outlined"
//             color="red"
//             onClick={handleCreateModalClose}
//             type="button"
//           >
//             Cancel
//           </Button>
//           <div className="flex gap-2">
//             {currentStep === 2 && (
//               <Button
//                 variant="outlined"
//                 color="gray"
//                 onClick={handlePreviousStep}
//                 type="button"
//               >
//                 Previous
//               </Button>
//             )}
//             {currentStep === 1 ? (
//               <Button
//                 variant="gradient"
//                 color="blue"
//                 onClick={handleNextStep}
//                 type="button"
//               >
//                 Next
//               </Button>
//             ) : (
//               <Button
//                 variant="gradient"
//                 color="green"
//                 onClick={patientForm.handleSubmit(handleCreatePatient)}
//                 disabled={isSubmitting}
//                 type="button"
//               >
//                 {isSubmitting ? 'Creating...' : 'Create Patient'}
//               </Button>
//             )}
//           </div>
//         </DialogFooter>
//       </Dialog>
//     </div>
//   );
// }

// export default Patient;


