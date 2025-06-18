import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Avatar,
  Typography,
  Tabs, 
  TabsHeader,
  Tab,
  
  Button,
  Chip,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Alert
} from "@material-tailwind/react";

import {
  HomeIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  PencilIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from "@heroicons/react/24/solid";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';


// Constants
const STATUS_COLORS = {
  done: "green",
  pending: "orange",
  overdue: "red",
  default: "blue-gray"
};

const VACCINE_SCHEDULES = {
  "hepatitis b": { interval: 1, unit: "months" },
  "dtap": { interval: 2, unit: "months" },
  "mmr": { interval: 1, unit: "years" },
  default: { interval: 6, unit: "months" }
};

const BMI_CATEGORIES = [
  { name: "Underweight", range: "< 18.5", color: "red" },
  { name: "Normal", range: "18.5 - 24.9", color: "green" },
  { name: "Overweight", range: "25 - 29.9", color: "orange" },
  { name: "Obese", range: "≥ 30", color: "red" }
];

// Add prescription status constants
const PRESCRIPTION_STATUS = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled"
};

// Add common medications for autocomplete
const COMMON_MEDICATIONS = [
  "Amoxicillin",
  "Azithromycin",
  "Ibuprofen",
  "Acetaminophen",
  "Albuterol",
  "Cetirizine",
  "Loratadine",
  "Omeprazole",
  "Prednisone",
  "Dextromethorphan"
];

// Utility functions
const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.default;

const formatDate = (dateString) => {
  if (!dateString) return "Not administered";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const calculateNextDueDate = (vaccination) => {
  if (!vaccination.dateAdministered) return null;
  
  const administeredDate = new Date(vaccination.dateAdministered);
  const nextDueDate = new Date(administeredDate);
  const schedule = VACCINE_SCHEDULES[vaccination.vaccine.toLowerCase()] || VACCINE_SCHEDULES.default;
  
  if (schedule.unit === "years") {
    nextDueDate.setFullYear(nextDueDate.getFullYear() + schedule.interval);
  } else {
    nextDueDate.setMonth(nextDueDate.getMonth() + schedule.interval);
  }
  
  return nextDueDate.toISOString().split('T')[0];
};

const calculateBMI = (weight, height) => {
  if (!weight || !height || weight <= 0 || height <= 0) return 0;
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

const getBMICategory = (bmi, age) => {
  if (age < 2) return "N/A";
  if (bmi < 18.5) return "Underweight";
  if (bmi >= 18.5 && bmi < 25) return "Normal";
  if (bmi >= 25 && bmi < 30) return "Overweight";
  return "Obese";
};

// const getBMICategoryColor = (category) => {
//   switch (category) {
//     case "Normal": return "green";
//     case "Underweight": return "orange";
//     case "Overweight": 
//     case "Obese": return "red";
//     default: return "blue-gray";
//   }
// };

const getBMICategoryColor = (category) => {
  switch (category) {
    case "Normal": return "#4caf50";
    case "Underweight": return "#ff9800";
    case "Overweight": return "#f44336";
    case "Obese": return "#d32f2f";
    default: return "#9e9e9e";
  }
};

// Custom hooks
const useFormState = (initialState = {}) => {
  const [formData, setFormData] = useState(initialState);
  
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const resetForm = useCallback(() => {
    setFormData(initialState);
  }, [initialState]);
  
  return [formData, updateField, resetForm, setFormData];
};

const useModalState = () => {
  const [modals, setModals] = useState({
    create: false,
    edit: false,
    delete: false,
    view: false,
    growth: false,
    prescription: false,
    viewPrescription: false,
    deletePrescription: false
  });
  
  const openModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  }, []);
  
  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  }, []);
  
  return [modals, openModal, closeModal];
};

// Main component
export function PatientDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedVaccination, setSelectedVaccination] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [vaccinations, setVaccinations] = useState(state?.vaccinations || []);
  const [growthRecords, setGrowthRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state management
  const [vaccinationForm, updateVaccinationField, resetVaccinationForm] = useFormState({
    vaccine: "",
    dueDate: "",
    status: "pending",
    dateAdministered: ""
  });

  const [growthForm, updateGrowthField, resetGrowthForm] = useFormState({
    height: "",
    weight: "",
    growthDate: ""
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    notes: ""
  });

  // Growth form validation
  const isGrowthFormValid = useMemo(() => {
    const { height, weight, growthDate } = growthForm;
    return (
      height && weight && growthDate &&
      !isNaN(parseFloat(height)) &&
      !isNaN(parseFloat(weight)) &&
      parseFloat(height) > 0 &&
      parseFloat(weight) > 0
    );
  }, [growthForm]);
  
  // Prescription form validation
  const isPrescriptionFormValid = useMemo(() => {
    const { medication, dosage, frequency, startDate } = prescriptionForm;
    return (
      medication.trim() !== "" &&
      dosage.trim() !== "" &&
      frequency.trim() !== "" &&
      startDate.trim() !== ""
    );
  }, [prescriptionForm]);
  
  // Filter and sort state
  const [filters, setFilters] = useState({
    status: "all",
    sortField: "dueDate",
    sortDirection: "asc"
  });
  
  // Modal state
  const [modals, openModal, closeModal] = useModalState();
  
  // Validation
  // Vaccination form validation
  const isVaccinationFormValid = useMemo(() => {
    const { vaccine, dueDate, status, dateAdministered } = vaccinationForm;
    return (
      vaccine.trim() !== "" &&
      dueDate.trim() !== "" &&
      (status !== "done" || dateAdministered.trim() !== "")
    );
  }, [vaccinationForm]);

  // Handle case when accessed directly without state
  if (!state?.patient) {
    return (
      <div className="p-4 text-center">
        <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
          Patient information not found. Please navigate from the patients list.
        </Alert>
        <Button onClick={() => navigate('/patients')} className="mt-4">
          Return to patients list
        </Button>
      </div>
    );
  }
  
  // Process patient data
  const { patient, appointments = [] } = state;


  console.log('Patient data:', patient);

  const patientAge = patient.age ? parseInt(patient.age) : 0;
  
  const patientData = useMemo(() => ({
    name: `${patient.firstName} ${patient.lastName}`,
    avatar: patient.img || "/img/default-avatar.jpg",
    age: patient.age || "Not specified",
    gender: patient.gender || "Not specified",
    bloodType: patient.bloodType || "Not specified",
    phoneNumber: patient.parent?.phoneNumber || "Not specified",
    email: patient.parent?.email || "Not specified",
    address: patient.parent?.address || "Not specified",
    emergencyContact: patient.parent?.fullName || "Not specified",
    allergies: patient.allergies || "None specified",
    chronicConditions: patient.chronicConditions || "None specified",
  }), [patient]);
  
  // Process appointments data
  const processedAppointments = useMemo(() =>
    (patient.appointments || []).map(appointment => ({
      name: appointment.doctor || "Medical Staff",
      message: `Appointment for ${appointment.type || "check-up"}`,
      time: appointment.date ? formatDate(appointment.date) : "No date specified",
      hour: appointment.time
        ? appointment.time
        : "No time specified",
    })),
    [patient.appointments]
  );

  console.log('Processed appointments:', patient.appointments);
  // Filter and sort vaccinations
  const filteredVaccinations = useMemo(() => {
    let result = [...vaccinations];

    // Filter by status
    if (filters.status !== "all") {
      result = result.filter(v => v.status === filters.status);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortField) {
        case "vaccine":
          comparison = a.vaccine.localeCompare(b.vaccine);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "dueDate":
        default:
          comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
      }
      return filters.sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [vaccinations, filters]);
  
  // API calls
  const fetchGrowthRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/growth-records/${id}`);
     
      setGrowthRecords(response.data);
      setError(null);

       console.log('Growth records fetched:', response.data);
    } catch (error) {
      console.error('Error fetching growth records:', error);
      setError('Failed to load growth records');
      toast.error('Failed to load growth records');
    } finally {
      setLoading(false);
    }
  }, [id]);


  
  

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const patientId = id || state?.patient?._id;
      const response = await axiosInstance.get(`/prescriptions/${patientId}`);
      setPrescriptions(response.data);

    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  const createVaccination = useCallback(async () => {
    if (!isVaccinationFormValid) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.post('/vaccinations', {
        patientId: id,
        ...vaccinationForm,
        dueDate: new Date(vaccinationForm.dueDate).toISOString(),
        dateAdministered: vaccinationForm.status === 'done' 
          ? new Date(vaccinationForm.dateAdministered).toISOString() 
          : null
      });
      
      setVaccinations(prev => [...prev, response.data]);
      closeModal('create');
      resetVaccinationForm();
      toast.success('Vaccination created successfully!');
    } catch (error) {
      console.error('Error creating vaccination:', error);
      toast.error('Failed to create vaccination');
    } finally {
      setLoading(false);
    }
  }, [vaccinationForm, isVaccinationFormValid, id, closeModal, resetVaccinationForm]);
  
  const updateVaccination = useCallback(async () => {
    if (!selectedVaccination || !isVaccinationFormValid) return;
    
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/vaccinations/${selectedVaccination._id}`, {
        ...vaccinationForm,
        dueDate: new Date(vaccinationForm.dueDate).toISOString(),
        dateAdministered: vaccinationForm.status === 'done' 
          ? new Date(vaccinationForm.dateAdministered).toISOString() 
          : null
      });
      
      setVaccinations(prev =>
        prev.map(v => v._id === selectedVaccination._id ? response.data : v)
      );
      closeModal('edit');
      toast.success('Vaccination updated successfully!');
    } catch (error) {
      console.error('Error updating vaccination:', error);
      toast.error('Failed to update vaccination');
    } finally {
      setLoading(false);
    }
  }, [selectedVaccination, vaccinationForm, isVaccinationFormValid, closeModal]);
  
  const deleteVaccination = useCallback(async () => {
    if (!selectedVaccination) return;
    
    try {
      setLoading(true);
      await axiosInstance.delete(`/vaccinations/${selectedVaccination._id}`);
      setVaccinations(prev => prev.filter(v => v._id !== selectedVaccination._id));
      closeModal('delete');
      toast.success('Vaccination deleted successfully!');
    } catch (error) {
      console.error('Error deleting vaccination:', error);
      toast.error('Failed to delete vaccination');
    } finally {
      setLoading(false);
    }
  }, [selectedVaccination, closeModal]);
  
  const addGrowthRecord = useCallback(async () => {
    if (!isGrowthFormValid) return;
    
    try {
      setLoading(true);
      const bmi = calculateBMI(growthForm.weight, growthForm.height);
      const response = await axiosInstance.post('/growth-records', {
        patientId: id,
        heightCm: parseFloat(growthForm.height),
        weightKg: parseFloat(growthForm.weight),
        date: new Date(growthForm.growthDate).toISOString(),
        bmi: parseFloat(bmi)
      });
      
      setGrowthRecords(prev => [...prev, response.data]);
      closeModal('growth');
      resetGrowthForm();
      toast.success('Growth record added successfully!');
    } catch (error) {
      console.error('Error adding growth record:', error);
      toast.error('Failed to add growth record');
    } finally {
      setLoading(false);
    }
  }, [growthForm, isGrowthFormValid, id, closeModal, resetGrowthForm]);
  
  const deleteGrowthRecord = useCallback(async (recordId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/growth-records/${recordId}`);
      setGrowthRecords(prev => prev.filter(record => record._id !== recordId));
      toast.success('Growth record deleted successfully!');
    } catch (error) {
      console.error('Error deleting growth record:', error);
      toast.error('Failed to delete growth record');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Prescription API functions
  const addPrescription = useCallback(async () => {
    if (!isPrescriptionFormValid) return;
    
    try {
      setLoading(true);
      const payload = {
        patientId: id,
        ...prescriptionForm,
        status: prescriptionForm.endDate && new Date(prescriptionForm.endDate) < new Date() 
          ? PRESCRIPTION_STATUS.completed 
          : PRESCRIPTION_STATUS.active
      };
      
      const response = await axiosInstance.post('/prescriptions', payload);
      setPrescriptions(prev => [...prev, response.data]);
      closeModal('prescription');
      setPrescriptionForm({
        medication: "",
        dosage: "",
        frequency: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        notes: ""
      });
      toast.success('Prescription added successfully!');
    } catch (error) {
      console.error('Error adding prescription:', error);
      toast.error('Failed to add prescription');
    } finally {
      setLoading(false);
    }
  }, [prescriptionForm, isPrescriptionFormValid, id]);

  const updatePrescription = useCallback(async () => {
    if (!selectedPrescription || !isPrescriptionFormValid) return;
    
    try {
      setLoading(true);
      const payload = {
        ...prescriptionForm,
        status: prescriptionForm.endDate && new Date(prescriptionForm.endDate) < new Date() 
          ? PRESCRIPTION_STATUS.completed 
          : PRESCRIPTION_STATUS.active
      };
      
      const response = await axiosInstance.patch(`/prescriptions/${selectedPrescription._id}`, payload);
      setPrescriptions(prev => 
        prev.map(p => p._id === selectedPrescription._id ? response.data : p)
      );
      closeModal('prescription');
      toast.success('Prescription updated successfully!');
    } catch (error) {
      console.error('Error updating prescription:', error);
      toast.error('Failed to update prescription');
    } finally {
      setLoading(false);
    }
  }, [selectedPrescription, prescriptionForm, isPrescriptionFormValid]);

  const deletePrescription = useCallback(async () => {
    if (!selectedPrescription) return;
    
    try {
      setLoading(true);
      await axiosInstance.delete(`/prescriptions/${selectedPrescription._id}`);
      setPrescriptions(prev => prev.filter(p => p._id !== selectedPrescription._id));
      closeModal('deletePrescription');
      toast.success('Prescription deleted successfully!');
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast.error('Failed to delete prescription');
    } finally {
      setLoading(false);
    }
  }, [selectedPrescription]);

  
  // Event handlers
  const handleOpenCreate = useCallback(() => {
    resetVaccinationForm();
    openModal('create');
  }, [resetVaccinationForm, openModal]);
  
  const handleOpenEdit = useCallback((vaccination) => {
    setSelectedVaccination(vaccination);
    updateVaccinationField('vaccine', vaccination.vaccine);
    updateVaccinationField('dueDate', vaccination.dueDate.split('T')[0]);
    updateVaccinationField('status', vaccination.status);
    updateVaccinationField('dateAdministered', 
      vaccination.dateAdministered ? vaccination.dateAdministered.split('T')[0] : ""
    );
    openModal('edit');
  }, [updateVaccinationField, openModal]);
  
  const handleOpenView = useCallback((vaccination) => {
    setSelectedVaccination(vaccination);
    openModal('view');
  }, [openModal]);
  
  const handleOpenDelete = useCallback((vaccination) => {
    setSelectedVaccination(vaccination);
    openModal('delete');
  }, [openModal]);
  
  const handleScheduleNext = useCallback((vaccination) => {
    const nextDueDate = calculateNextDueDate(vaccination);
    if (!nextDueDate) {
      toast.warning('Cannot schedule next dose without administration date');
      return;
    }
    
    updateVaccinationField('vaccine', vaccination.vaccine);
    updateVaccinationField('dueDate', nextDueDate);
    updateVaccinationField('status', "pending");
    updateVaccinationField('dateAdministered', "");
    openModal('create');
  }, [updateVaccinationField, openModal]);
  
  const exportVaccinationPDF = useCallback((vaccination) => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(18);
    doc.setTextColor(40, 53, 147);
    doc.text("VACCINATION RECORD", 105, 20, null, null, "center");
    
    // Add patient info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Patient: ${patientData.name}`, 20, 40);
    doc.text(`Date of Birth: ${patientData.age}`, 20, 50);
    
    // Add vaccination details
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text(vaccination.vaccine, 20, 70);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Status: ${vaccination.status.toUpperCase()}`, 20, 85);
    doc.text(`Due Date: ${formatDate(vaccination.dueDate)}`, 20, 95);
    
    if (vaccination.dateAdministered) {
      doc.text(`Administered: ${formatDate(vaccination.dateAdministered)}`, 20, 105);
    }
    
    // Add footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 150);
    doc.text("Official Vaccination Record - For Medical Use", 105, 160, null, null, "center");
    
    // Add border
    doc.setDrawColor(200);
    doc.rect(15, 15, 180, 150);
    
    doc.save(`${patientData.name.replace(' ', '_')}_${vaccination.vaccine.replace(' ', '_')}.pdf`);
  }, [patientData.name]);
  
  const handleOpenAddPrescription = useCallback(() => {
    setPrescriptionForm({
      medication: "",
      dosage: "",
      frequency: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      notes: ""
    });
    setSelectedPrescription(null);
    openModal('prescription');
  }, [openModal]);

  const handleOpenEditPrescription = useCallback((prescription) => {
    setSelectedPrescription(prescription);
    setPrescriptionForm({
      medication: prescription.medication,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      startDate: prescription.startDate.split('T')[0],
      endDate: prescription.endDate ? prescription.endDate.split('T')[0] : "",
      notes: prescription.notes || ""
    });
    openModal('prescription');
  }, [openModal]);

  const handleOpenViewPrescription = useCallback((prescription) => {
    setSelectedPrescription(prescription);
    openModal('viewPrescription');
  }, [openModal]);

  const handleOpenDeletePrescription = useCallback((prescription) => {
    setSelectedPrescription(prescription);
    openModal('deletePrescription');
  }, [openModal]);
  
  const updateFilter = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const toggleSortDirection = useCallback(() => {
    setFilters(prev => ({ 
      ...prev, 
      sortDirection: prev.sortDirection === "asc" ? "desc" : "asc" 
    }));
  }, []);
  
  // Effects
  useEffect(() => {
    fetchGrowthRecords();
  }, [fetchGrowthRecords]);
  
  useEffect(() => {
    if (activeTab === "prescriptions") {
      fetchPrescriptions();
    }
  }, [activeTab, fetchPrescriptions]);


  
  // Early return for error state
  if (error) {
    return (
      <div className="p-4">
        <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <Button 
        variant="text" 
        className="flex items-center gap-2 mt-4 ml-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back
      </Button>

      <div className="relative mt-4 h-72 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>

      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <Avatar
                src={patientData.avatar}
                alt={patientData.name}
                size="xl"
                variant="rounded"
                className="rounded-lg shadow-lg shadow-blue-gray-500/40"
              />
              <div>
                <Typography variant="h5" color="blue-gray" className="mb-1">
                  {patientData.name}
                </Typography>
                <Typography variant="small" className="font-normal text-blue-gray-600">
                  {patientData.age} • {patientData.gender} • Blood Type: {patientData.bloodType}
                </Typography>
              </div>
            </div>
               <div className="w-96">
              <Tabs value={activeTab}>
                <TabsHeader>
                  <Tab value="overview" onClick={() => setActiveTab("overview")}>
                    <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Overview
                  </Tab>
                  {/* <Tab value="vaccinations" onClick={() => setActiveTab("vaccinations")}>
                    <ShieldCheckIcon className="-mt-0.5 mr-2 inline-block h-5 w-5" />
                    Vaccinations
                  </Tab> */}
                  <Tab value="growth" onClick={() => setActiveTab("growth")}>
                    <ChartBarIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Growth
                  </Tab>
                  <Tab value="appointments" onClick={() => setActiveTab("appointments")}>
                    <CalendarDaysIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Appointments
                  </Tab>
                  
                  <Tab value="prescriptions" onClick={() => setActiveTab("prescriptions")}>
                    <DocumentTextIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Prescriptions
                  </Tab>
                </TabsHeader>
              </Tabs>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <OverviewTab 
              patientData={patientData}
              filteredVaccinations={filteredVaccinations}
              processedAppointments={processedAppointments}
              filters={filters}
              updateFilter={updateFilter}
              toggleSortDirection={toggleSortDirection}
              handleOpenCreate={handleOpenCreate}
              handleOpenView={handleOpenView}
              handleOpenEdit={handleOpenEdit}
              handleOpenDelete={handleOpenDelete}
              handleScheduleNext={handleScheduleNext}
              exportVaccinationPDF={exportVaccinationPDF}
            />
          )}

          {/* {activeTab === "vaccinations" && (
            <VaccinationsTab
              filteredVaccinations={filteredVaccinations}
              filters={filters}
              updateFilter={updateFilter}
              toggleSortDirection={toggleSortDirection}
              handleOpenCreate={handleOpenCreate}
              handleOpenView={handleOpenView}
              handleOpenEdit={handleOpenEdit}
              handleOpenDelete={handleOpenDelete}
            />
          )} */}

          {activeTab === "growth" && (
            <GrowthTab
              patientId={id}
              patientName={`${patient.firstName} ${patient.lastName}`}
              patientAge={parseInt(patient.age) || 0}
            />
          )}

          {activeTab === "appointments" && (
            <AppointmentsTab
              processedAppointments={processedAppointments}
              patientData={patientData}
            />
          )}

          {activeTab === "prescriptions" && (
            <PrescriptionsTab
              prescriptions={prescriptions}
              patientName={patientData.name}
              onAddPrescription={handleOpenAddPrescription}
              onEditPrescription={handleOpenEditPrescription}
              onDeletePrescription={handleOpenDeletePrescription}
              onViewPrescription={handleOpenViewPrescription}
            />
          )}
        </CardBody>
      </Card>

      {/* Modals */}
      <VaccinationModal
        open={modals.create}
        onClose={() => closeModal('create')}
        title="Add New Vaccination"
        formData={vaccinationForm}
        updateField={updateVaccinationField}
        onSubmit={createVaccination}
        isValid={isVaccinationFormValid}
        loading={loading}
      />

      <VaccinationModal
        open={modals.edit}
        onClose={() => closeModal('edit')}
        title="Edit Vaccination Record"
        formData={vaccinationForm}
        updateField={updateVaccinationField}
        onSubmit={updateVaccination}
        isValid={isVaccinationFormValid}
        loading={loading}
        isEdit
      />
    
      <ViewVaccinationModal
        open={modals.view}
        onClose={() => closeModal('view')}
        vaccination={selectedVaccination}
        onScheduleNext={handleScheduleNext}
        onExportPDF={exportVaccinationPDF}
      />

      <DeleteConfirmationModal
        open={modals.delete}
        onClose={() => closeModal('delete')}
        vaccination={selectedVaccination}
        onConfirm={deleteVaccination}
        loading={loading}
      />

      <PrescriptionModal
        open={modals.prescription}
        onClose={() => closeModal('prescription')}
        formData={prescriptionForm}
        setFormData={setPrescriptionForm}
        onSubmit={selectedPrescription ? updatePrescription : addPrescription}
        isValid={isPrescriptionFormValid}
        loading={loading}
        isEdit={!!selectedPrescription}
        commonMedications={COMMON_MEDICATIONS}
      />

      <ViewPrescriptionModal
        open={modals.viewPrescription}
        onClose={() => closeModal('viewPrescription')}
        prescription={selectedPrescription}
      />

      <DeletePrescriptionModal
        open={modals.deletePrescription}
        onClose={() => closeModal('deletePrescription')}
        prescription={selectedPrescription}
        onConfirm={deletePrescription}
        loading={loading}
      />
    </>
  );
}

// New PrescriptionsTab component
const PrescriptionsTab = ({ 
  prescriptions, 
  patientName, 
  onAddPrescription, 
  onEditPrescription,
  onDeletePrescription,
  onViewPrescription
}) => {
  // Group prescriptions by year
  const groupedPrescriptions = useMemo(() => {
    const groups = {};
    prescriptions.forEach(prescription => {
      const year = new Date(prescription.startDate).getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(prescription);
    });
    return groups;
  }, [prescriptions]);

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography variant="h4" color="blue-gray">
            Prescription Management
          </Typography>
          <Typography variant="small" className="text-blue-gray-500">
            Manage and track medication prescriptions
          </Typography>
        </div>
        <Button variant="gradient" onClick={onAddPrescription}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Prescription
        </Button>
      </div>

      {prescriptions.length === 0 ? (
        <EmptyPrescriptionsState 
          patientName={patientName}
          onAddPrescription={onAddPrescription}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPrescriptions)
            .sort(([yearA], [yearB]) => yearB - yearA) // Sort years descending
            .map(([year, yearPrescriptions]) => (
              <div key={year}>
                <Typography variant="h5" color="blue-gray" className="mb-4">
                  {year}
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {yearPrescriptions
                    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate)) // Sort by date descending
                    .map((prescription) => (
                      <PrescriptionCard
                        key={prescription._id}
                        prescription={prescription}
                        onEdit={() => onEditPrescription(prescription)}
                        onDelete={() => onDeletePrescription(prescription)}
                        onView={() => onViewPrescription(prescription)}
                      />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

// New PrescriptionCard component
const PrescriptionCard = ({ prescription, onEdit, onDelete, onView }) => {
  const status = prescription.status || 
    (prescription.endDate && new Date(prescription.endDate) < new Date()
      ? PRESCRIPTION_STATUS.completed
      : PRESCRIPTION_STATUS.active);
  
  const statusColor = status === PRESCRIPTION_STATUS.active 
    ? "green" 
    : status === PRESCRIPTION_STATUS.completed 
      ? "blue" 
      : "red";

  return (
    <Card className="border border-blue-gray-50 hover:shadow-md transition-shadow">
      <CardHeader className="bg-blue-50 p-4 flex justify-between items-center">
        <Typography variant="h5" color="blue-gray">
          {prescription.medication}
        </Typography>
        <Chip value={status} color={statusColor} size="sm" />
      </CardHeader>
      <CardBody className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Typography variant="small" className="font-semibold text-blue-gray-500">
              Dosage:
            </Typography>
            <Typography>{prescription.dosage}</Typography>
          </div>
          
          <div className="flex justify-between">
            <Typography variant="small" className="font-semibold text-blue-gray-500">
              Frequency:
            </Typography>
            <Typography>{prescription.frequency}</Typography>
          </div>
          
          <div className="flex justify-between">
            <Typography variant="small" className="font-semibold text-blue-gray-500">
              Start Date:
            </Typography>
            <Typography>{formatDate(prescription.startDate)}</Typography>
          </div>
          
          {prescription.endDate && (
            <div className="flex justify-between">
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                End Date:
              </Typography>
              <Typography>{formatDate(prescription.endDate)}</Typography>
            </div>
          )}
          
          {prescription.notes && (
            <div>
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                Notes:
              </Typography>
              <Typography className="text-sm">{prescription.notes}</Typography>
            </div>
          )}
        </div>
      </CardBody>
      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
        <Button variant="text" size="sm" onClick={onView}>
          View
        </Button>
        <Button variant="text" color="blue" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="text" color="red" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

// New PrescriptionModal component
const PrescriptionModal = ({ 
  open, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  isValid, 
  loading, 
  isEdit,
  commonMedications
}) => {
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} handler={onClose} size="md">
      <DialogHeader>{isEdit ? "Edit Prescription" : "Add New Prescription"}</DialogHeader>
      <DialogBody divider>
        <div className="grid gap-6">
          <div>
            <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
              Medication *
            </Typography>
            <Input
              list="medications"
              value={formData.medication}
              onChange={(e) => handleInputChange('medication', e.target.value)}
              label="Medication Name"
            />
            <datalist id="medications">
              {commonMedications.map((med, index) => (
                <option key={index} value={med} />
              ))}
            </datalist>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
                Dosage *
              </Typography>
              <Input
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', e.target.value)}
                label="e.g., 500mg"
              />
            </div>
            
            <div>
              <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
                Frequency *
              </Typography>
              <Select
                value={formData.frequency}
                onChange={(val) => handleInputChange('frequency', val)}
                label="Select Frequency"
              >
                <Option value="Once daily">Once daily</Option>
                <Option value="Twice daily">Twice daily</Option>
                <Option value="Three times daily">Three times daily</Option>
                <Option value="Four times daily">Four times daily</Option>
                <Option value="As needed">As needed</Option>
                <Option value="Other">Other</Option>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
                Start Date *
              </Typography>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                label="Start Date"
              />
            </div>
            
            <div>
              <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
                End Date (Optional)
              </Typography>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                label="End Date"
                min={formData.startDate}
              />
            </div>
          </div>
          
          <div>
            <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
              Notes (Optional)
            </Typography>
            <Input
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              label="Additional instructions"
            />
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          variant="text"
          color="red"
          onClick={onClose}
          className="mr-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="gradient" 
          color="green" 
          onClick={onSubmit}
          disabled={!isValid || loading}
        >
          {loading ? "Saving..." : (isEdit ? "Update" : "Add Prescription")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

// New ViewPrescriptionModal component
const ViewPrescriptionModal = ({ open, onClose, prescription }) => {
  if (!prescription) return null;
  
  const status = prescription.status || 
    (prescription.endDate && new Date(prescription.endDate) < new Date()
      ? PRESCRIPTION_STATUS.completed
      : PRESCRIPTION_STATUS.active);
  
  const statusColor = status === PRESCRIPTION_STATUS.active 
    ? "green" 
    : status === PRESCRIPTION_STATUS.completed 
      ? "blue" 
      : "red";

  return (
    <Dialog open={open} handler={onClose} size="sm">
      <DialogHeader>Prescription Details</DialogHeader>
      <DialogBody divider>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Typography variant="h5" color="blue-gray">
              {prescription.medication}
            </Typography>
            <Chip value={status} color={statusColor} size="md" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                Dosage:
              </Typography>
              <Typography>{prescription.dosage}</Typography>
            </div>
            
            <div className="flex justify-between">
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                Frequency:
              </Typography>
              <Typography>{prescription.frequency}</Typography>
            </div>
            
            <div className="flex justify-between">
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                Start Date:
              </Typography>
              <Typography>{formatDate(prescription.startDate)}</Typography>
            </div>
            
            {prescription.endDate && (
              <div className="flex justify-between">
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  End Date:
                </Typography>
                <Typography>{formatDate(prescription.endDate)}</Typography>
              </div>
            )}
            
            {prescription.notes && (
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Notes:
                </Typography>
                <Typography className="mt-1">{prescription.notes}</Typography>
              </div>
            )}
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="gradient" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

// New DeletePrescriptionModal component
const DeletePrescriptionModal = ({ 
  open, 
  onClose, 
  prescription, 
  onConfirm, 
  loading 
}) => (
  <Dialog open={open} handler={onClose}>
    <DialogHeader>Delete Prescription</DialogHeader>
    <DialogBody divider>
      <Typography variant="small" className="text-red-500">
        Are you sure you want to delete the prescription for {prescription?.medication}? 
        This action cannot be undone.
      </Typography>
    </DialogBody>
    <DialogFooter>
      <Button
        variant="text"
        color="red"
        onClick={onClose}
        className="mr-1"
        disabled={loading}
      >
        Cancel
      </Button>
      <Button 
        variant="gradient" 
        color="red" 
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Deleting..." : "Delete Prescription"}
      </Button>
    </DialogFooter>
  </Dialog>
);

// New EmptyPrescriptionsState component
const EmptyPrescriptionsState = ({ patientName, onAddPrescription }) => (
  <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
    <DocumentTextIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
    <Typography variant="h5" color="blue-gray" className="mb-2">
      No Prescriptions Found
    </Typography>
    <Typography variant="small" className="text-blue-gray-500 mb-6 max-w-md mx-auto">
      {patientName} doesn't have any prescriptions yet. Add the first prescription to get started.
    </Typography>
    <Button variant="gradient" onClick={onAddPrescription}>
      Add First Prescription
    </Button>
  </div>
);

// Existing components below (OverviewTab, VaccinationsTab, GrowthTab, AppointmentsTab, etc.)
// ... rest of the existing components ...

// Sub-components for better organization
const OverviewTab = ({ 
  patientData, 
  filteredVaccinations, 
  processedAppointments,
  filters,
  updateFilter,
  toggleSortDirection,
  handleOpenCreate,
  handleOpenView,
  handleOpenEdit,
  handleOpenDelete,
  handleScheduleNext,
  exportVaccinationPDF 
}) => (
  <>
    <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
      {/* Vaccination Status */}
      <VaccinationStatusCard
        filteredVaccinations={filteredVaccinations}
        filters={filters}
        updateFilter={updateFilter}
        toggleSortDirection={toggleSortDirection}
        handleOpenCreate={handleOpenCreate}
        handleOpenView={handleOpenView}
        handleOpenEdit={handleOpenEdit}
        handleOpenDelete={handleOpenDelete}
        handleScheduleNext={handleScheduleNext}
        exportVaccinationPDF={exportVaccinationPDF}
      />
      
      {/* Patient Information */}
      <PatientInfoCard patientData={patientData} />
      
      {/* Recent Activities */}
      <RecentActivitiesCard processedAppointments={processedAppointments} />
    </div>
    
    {/* Vaccination Records Grid */}
    <VaccinationRecordsGrid
      filteredVaccinations={filteredVaccinations}
      handleOpenCreate={handleOpenCreate}
      handleOpenView={handleOpenView}
    />
  </>
);

const VaccinationsTab = ({ 
  filteredVaccinations, 
  filters, 
  updateFilter, 
  toggleSortDirection, 
  handleOpenCreate,
  handleOpenView,
  handleOpenEdit,
  handleOpenDelete 
}) => (
  <div className="px-4">
    <div className="flex items-center justify-between mb-6">
      <Typography variant="h4" color="blue-gray">
        Vaccination Management
      </Typography>
      <Button variant="gradient" onClick={handleOpenCreate}>
        <PlusIcon className="h-4 w-4 mr-1" />
        Add New Vaccination
      </Button>
    </div>
    
    <FilterControls
      filters={filters}
      updateFilter={updateFilter}
      toggleSortDirection={toggleSortDirection}
    />
    
    <VaccinationGrid
      vaccinations={filteredVaccinations}
      onView={handleOpenView}
      onEdit={handleOpenEdit}
      onDelete={handleOpenDelete}
    />
  </div>
);

const GrowthTab = ({
  patientId,
  patientName,
  patientAge,
}) => {
  const [growthRecords, setGrowthRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [growthForm, updateGrowthField, resetGrowthForm] = useFormState({
    height: "",
    weight: "",
    growthDate: ""
  });
  const [modals, setModals] = useState({ growth: false });
  const [error, setError] = useState(null);

  // Validation
  const isGrowthFormValid = useMemo(() => {
    const { height, weight, growthDate } = growthForm;
    return (
      height && weight && growthDate &&
      !isNaN(parseFloat(height)) &&
      !isNaN(parseFloat(weight)) &&
      parseFloat(height) > 0 &&
      parseFloat(weight) > 0
    );
  }, [growthForm]);

  // Fetch growth records
  const fetchGrowthRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/growth-records/${patientId}`);
      setGrowthRecords(response.data);
      setError(null);
    } catch (error) {
      setError("Failed to load growth records");
      toast.error("Failed to load growth records");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchGrowthRecords();
  }, [fetchGrowthRecords]);

  // Add growth record
  const addGrowthRecord = useCallback(async () => {
    if (!isGrowthFormValid) return;
    try {
      setLoading(true);
      const bmi = calculateBMI(growthForm.weight, growthForm.height);
      const response = await axiosInstance.post('/growth-records', {
        patientId,
        heightCm: parseFloat(growthForm.height),
        weightKg: parseFloat(growthForm.weight),
        date: new Date(growthForm.growthDate).toISOString(),
        
      });
      setGrowthRecords(prev => [...prev, response.data]);
      setModals({ growth: false });
      resetGrowthForm();
      toast.success('Growth record added successfully!');
    } catch (error) {
      toast.error('Failed to add growth record');
    } finally {
      setLoading(false);
    }
  }, [growthForm, isGrowthFormValid, patientId, resetGrowthForm]);

  // Delete growth record
  const deleteGrowthRecord = useCallback(async (recordId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/growth-records/${recordId}`);
      setGrowthRecords(prev => prev.filter(record => record._id !== recordId));
      toast.success('Growth record deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete growth record');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenGrowthModal = () => setModals({ growth: true });
  const handleCloseGrowthModal = () => setModals({ growth: false });

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography variant="h4" color="blue-gray">
            Growth Tracking
          </Typography>
          <Typography variant="small" className="text-blue-gray-500">
            Monitor BMI and growth patterns over time
          </Typography>
        </div>
        <Button variant="gradient" onClick={handleOpenGrowthModal}>
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Growth Record
        </Button>
      </div>

      {growthRecords && growthRecords.length > 0 ? (
        <>
          <GrowthCharts 
            records={growthRecords} 
            patientAge={patientAge}
          />
          
          <GrowthRecordsTable
            records={growthRecords}
            patientAge={patientAge}
            onDelete={deleteGrowthRecord}
            loading={loading}
          />
        </>
      ) : (
        <EmptyGrowthState
          patientName={patientName}
          onAddRecord={handleOpenGrowthModal}
        />
      )}

      <GrowthModal
        open={modals.growth}
        onClose={handleCloseGrowthModal}
        formData={growthForm}
        updateField={updateGrowthField}
        onSubmit={addGrowthRecord}
        isValid={isGrowthFormValid}
        loading={loading}
        patientAge={patientAge}
      />
    </div>
  );
};

const AppointmentsTab = ({ processedAppointments, patientData }) => (
  <div className="px-4">
    <div className="mb-6">
      <Typography variant="h4" color="blue-gray">
        Appointment History
      </Typography>
      <Typography variant="small" className="text-blue-gray-500">
        Past and upcoming appointments
      </Typography>
    </div>
    
    {processedAppointments.length > 0 ? (
      <AppointmentsList appointments={processedAppointments} />
    ) : (
      <EmptyAppointmentsState patientName={patientData.name} />
    )}
  </div>
);

// Helper Components
const VaccinationStatusCard = ({ 
  filteredVaccinations, 
  filters, 
  updateFilter, 
  toggleSortDirection, 
  handleOpenCreate,
  handleOpenView,
  handleOpenEdit,
  handleOpenDelete,
  handleScheduleNext,
  exportVaccinationPDF 
}) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <Typography variant="h6" color="blue-gray">
        Vaccination Status
      </Typography>
      <Button variant="gradient" size="sm" onClick={handleOpenCreate}>
        <PlusIcon className="h-4 w-4 mr-1" />
        Add Vaccination
      </Button>
    </div>
    
    <FilterControls
      filters={filters}
      updateFilter={updateFilter}
      toggleSortDirection={toggleSortDirection}
    />
    
    <div className="flex flex-col gap-12">
      {filteredVaccinations.map((vaccination, index) => (
        <VaccinationListItem
          key={vaccination._id || index}
          vaccination={vaccination}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onScheduleNext={handleScheduleNext}
          onExportPDF={exportVaccinationPDF}
        />
      ))}
    </div>
  </div>
);

// New GrowthCharts component
const GrowthCharts = ({ records, patientAge }) => {
  // Prepare chart data
  const chartData = useMemo(() => {
    return records
      .map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        height: record.heightCm,
        weight: record.weightKg,
        bmi: parseFloat(record.bmi),
        dateValue: new Date(record.date).getTime()
      }))
      .sort((a, b) => a.dateValue - b.dateValue);
  }, [records]);

  const bmiCategory = getBMICategory(
    chartData[chartData.length - 1]?.bmi || 0,
    patientAge
  );
  const bmiColor = getBMICategoryColor(bmiCategory);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      {/* Height & Weight Chart */}
      <div className="bg-white p-4 rounded-xl border border-blue-gray-50">
        <Typography variant="h5" color="blue-gray" className="mb-4">
          Height & Weight Trend
        </Typography>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" domain={['auto', 'auto']} />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={['auto', 'auto']}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'height' ? `${value} cm` : `${value} kg`,
                  name === 'height' ? 'Height' : 'Weight'
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="height"
                stroke="#8884d8"
                name="Height"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="weight"
                stroke="#82ca9d"
                name="Weight"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BMI Chart */}
      <div className="bg-white p-4 rounded-xl border border-blue-gray-50">
        <Typography variant="h5" color="blue-gray" className="mb-4">
          BMI Trend
        </Typography>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="bmiColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={bmiColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={bmiColor} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip formatter={(value) => [`${value}`, 'BMI']} />
              <Area
                type="monotone"
                dataKey="bmi"
                stroke={bmiColor}
                fillOpacity={1}
                fill="url(#bmiColor)"
                name="BMI"
                strokeWidth={2}
              />
              {patientAge >= 2 && (
                <>
                  <ReferenceLine y={18.5} stroke="#f57c00" strokeDasharray="3 3">
                    <Label value="Underweight" position="insideTopRight" />
                  </ReferenceLine>
                  <ReferenceLine y={25} stroke="#388e3c" strokeDasharray="3 3">
                    <Label value="Healthy" position="insideTopRight" />
                  </ReferenceLine>
                  <ReferenceLine y={30} stroke="#d32f2f" strokeDasharray="3 3">
                    <Label value="Overweight" position="insideTopRight" />
                  </ReferenceLine>
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Add to utility functions


const FilterControls = ({ filters, updateFilter, toggleSortDirection }) => (
  <div className="flex gap-2 mb-4">
    <Select
      label="Filter Status"
      value={filters.status}
      onChange={(val) => updateFilter('status', val)}
      size="sm"
    >
      <Option value="all">All</Option>
      <Option value="pending">Pending</Option>
      <Option value="done">Completed</Option>
      <Option value="overdue">Overdue</Option>
    </Select>
    
    <div className="flex items-center">
      <Select
        label="Sort By"
        value={filters.sortField}
        onChange={(val) => updateFilter('sortField', val)}
        size="sm"
      >
        <Option value="dueDate">Due Date</Option>
        <Option value="vaccine">Vaccine Name</Option>
        <Option value="status">Status</Option>
      </Select>
      <Button 
        variant="text" 
        size="sm"
        onClick={toggleSortDirection}
        className="ml-2"
      >
        {filters.sortDirection === "asc" ? (
          <ArrowUpIcon className="h-4 w-4" />
        ) : (
          <ArrowDownIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>
);

const VaccinationListItem = ({ 
  vaccination, 
  onView, 
  onEdit, 
  onDelete, 
  onScheduleNext, 
  onExportPDF 
}) => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <Typography className="block text-xs font-semibold uppercase text-blue-gray-500">
        {vaccination.vaccine}
      </Typography>
      <Menu>
        <MenuHandler>
          <Button variant="text" size="sm">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Button>
        </MenuHandler>
        <MenuList>
          <MenuItem onClick={() => onView(vaccination)}>
            View Details
          </MenuItem>
          <MenuItem onClick={() => onEdit(vaccination)}>
            Edit
          </MenuItem>
          <MenuItem onClick={() => onScheduleNext(vaccination)}>
            Schedule Next
          </MenuItem>
          <MenuItem onClick={() => onExportPDF(vaccination)}>
            <div className="flex items-center">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export PDF
            </div>
          </MenuItem>
          <MenuItem 
            onClick={() => onDelete(vaccination)}
            className="text-red-500"
          >
            Delete
          </MenuItem>
        </MenuList>
      </Menu>
    </div>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography className="text-sm font-normal text-blue-gray-500">
            Due Date: {formatDate(vaccination.dueDate)}
          </Typography>
          <Typography className="text-sm font-normal text-blue-gray-500">
            {vaccination.dateAdministered 
              ? `Administered: ${formatDate(vaccination.dateAdministered)}`
              : "Pending administration"
            }
          </Typography>
        </div>
        <Chip
          value={vaccination.status}
          color={getStatusColor(vaccination.status)}
          size="sm"
        />
      </div>
    </div>
  </div>
);

const PatientInfoCard = ({ patientData }) => (
  <div>
    <div className="mb-4 flex items-center justify-between">
      <Typography variant="h6" color="blue-gray">
        Patient Information
      </Typography>
      <Tooltip content="Edit Patient Info">
        <PencilIcon className="h-4 w-4 cursor-pointer text-blue-gray-500" />
      </Tooltip>
    </div>
    <Typography variant="small" className="mb-4 font-normal text-blue-gray-500">
      Medical records and contact information for {patientData.name}. Complete patient profile with emergency contacts and medical history.
    </Typography>
    
    <div className="space-y-4">
      {Object.entries({
        "full name": patientData.name,
        mobile: patientData.phoneNumber,
        email: patientData.email,
        location: patientData.address,
        "emergency contact": patientData.emergencyContact,
        allergies: patientData.allergies,
        "chronic conditions": patientData.chronicConditions,
      }).map(([key, value]) => (
        <div key={key} className="flex items-center gap-4">
          <Typography variant="small" className="w-48 font-semibold text-blue-gray-500">
            {key}:
          </Typography>
          <Typography variant="small" className="font-normal text-blue-gray-500">
            {value}
          </Typography>
        </div>
      ))}
    </div>
  </div>
);

const RecentActivitiesCard = ({ processedAppointments }) => (
  <div>
    <Typography variant="h6" color="blue-gray" className="mb-3">
      Recent Activities
    </Typography>
    <ul className="flex flex-col gap-4">
      {processedAppointments.length > 0 ? (
        processedAppointments.map((props, index) => (
          <Card key={index} className="border border-blue-gray-50">
            <CardBody className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-2 rounded-full">
                  <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    {props.name}
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500">
                    {props.message}
                  </Typography>
                </div>
                <div className="ml-auto text-right">
                  <Typography variant="small" className="text-blue-gray-500">
                    {props.time}
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500">
                    {props.hour}
                  </Typography>
                </div>
              </div>
            </CardBody>
          </Card>
        ))
      ) : (
        <Typography variant="small" className="text-blue-gray-500">
          No recent activities
        </Typography>
      )}
    </ul>
  </div>
);

const VaccinationRecordsGrid = ({ filteredVaccinations, handleOpenCreate, handleOpenView }) => (
  <div className="px-4 pb-4">
    <div className="flex items-center justify-between mb-2">
      <Typography variant="h6" color="blue-gray">
        Vaccination Records
      </Typography>
      <Button variant="text" size="sm" onClick={handleOpenCreate}>
        <PlusIcon className="h-4 w-4 mr-1" />
        Add Record
      </Button>
    </div>
    <Typography variant="small" className="font-normal text-blue-gray-500">
      Complete vaccination history and upcoming schedules
    </Typography>
    <div className="mt-6 grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-4">
      {filteredVaccinations.map((vaccination, index) => (
        <Card key={vaccination._id || index} color="transparent" shadow={false}>
          <CardHeader
            floated={false}
            color="gray"
            className="mx-0 mt-0 mb-4 h-64 xl:h-40 flex items-center justify-center bg-blue-50"
          >
            <ShieldCheckIcon className="h-16 w-16 text-blue-600" />
          </CardHeader>
          <CardBody className="py-0 px-1">
            <Typography variant="small" className="font-normal text-blue-gray-500">
              {vaccination.status === "done" ? "Completed" : "Pending"}
            </Typography>
            <Typography variant="h5" color="blue-gray" className="mt-1 mb-2">
              {vaccination.vaccine}
            </Typography>
            <Typography variant="small" className="font-normal text-blue-gray-500">
              Due: {formatDate(vaccination.dueDate)}
            </Typography>
          </CardBody>
          <CardFooter className="mt-6 flex items-center justify-between py-0 px-1">
            <Button 
              variant="outlined" 
              size="sm"
              onClick={() => handleOpenView(vaccination)}
            >
              View Details
            </Button>
            <div className="flex items-center">
              <Chip
                value={vaccination.status}
                color={getStatusColor(vaccination.status)}
                size="sm"
              />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  </div>
);

const VaccinationGrid = ({ vaccinations, onView, onEdit, onDelete }) => (
  <div className="mt-8">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {vaccinations.map((vaccination, index) => (
        <Card key={vaccination._id || index} className="border border-blue-gray-50">
          <CardHeader className="bg-blue-50 p-4 flex justify-between items-center">
            <Typography variant="h5" color="blue-gray">
              {vaccination.vaccine}
            </Typography>
            <Chip
              value={vaccination.status}
              color={getStatusColor(vaccination.status)}
              size="sm"
            />
          </CardHeader>
          <CardBody className="p-4">
            <div className="space-y-3">
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Due Date
                </Typography>
                <Typography>{formatDate(vaccination.dueDate)}</Typography>
              </div>
              
              {vaccination.dateAdministered && (
                <div>
                  <Typography variant="small" className="font-semibold text-blue-gray-500">
                    Administered
                  </Typography>
                  <Typography>{formatDate(vaccination.dateAdministered)}</Typography>
                </div>
              )}
              
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Status
                </Typography>
                <Typography className="capitalize">{vaccination.status}</Typography>
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-between p-4">
            <Button variant="outlined" onClick={() => onView(vaccination)}>
              View Details
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="text" 
                color="blue"
                onClick={() => onEdit(vaccination)}
              >
                Edit
              </Button>
              <Button 
                variant="text" 
                color="red"
                onClick={() => onDelete(vaccination)}
              >
                Delete
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  </div>
);

const GrowthRecordsTable = ({ records, patientAge, onDelete, loading }) => (
  <>
    <Card>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Date</Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Height (cm)</Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Weight (kg)</Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">BMI</Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Category</Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Actions</Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record._id || index}>
                  <td className="p-4 border-b border-blue-gray-50">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {formatDate(record.date)}
                    </Typography>
                  </td>
                  <td className="p-4 border-b border-blue-gray-50">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {record.heightCm}
                    </Typography>
                  </td>
                  <td className="p-4 border-b border-blue-gray-50">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {record.weightKg}
                    </Typography>
                  </td>
                  <td className="p-4 border-b border-blue-gray-50">
                    <Typography variant="small" color="blue-gray" className="font-normal">
                      {record.bmi}
                    </Typography>
                  </td>
                  <td className="p-4 border-b border-blue-gray-50">
                    <Chip
                      value={getBMICategory(record.bmi, patientAge)}
                      color={getBMICategoryColor(getBMICategory(record.bmi, patientAge))}
                      size="sm"
                    />
                  </td>
                  <td className="p-4 border-b border-blue-gray-50">
                    <Button 
                      variant="text" 
                      color="red"
                      onClick={() => onDelete(record._id)}
                      disabled={loading}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
    
    <BMICategoriesInfo />
  </>
);

const BMICategoriesInfo = () => (
  <div className="mt-8">
    <Typography variant="h5" color="blue-gray" className="mb-4">
      BMI Categories
    </Typography>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {BMI_CATEGORIES.map((category, index) => (
        <Card key={index} className="border border-blue-gray-50">
          <CardBody>
            <Typography variant="h6" color={category.color}>
              {category.name}
            </Typography>
            <Typography variant="small" className="text-blue-gray-500">
              BMI {category.range}
            </Typography>
          </CardBody>
        </Card>
      ))}
    </div>
    <Typography variant="small" className="mt-4 text-blue-gray-500 italic">
      Note: BMI categories may vary for children under 2 years old
    </Typography>
  </div>
);

const EmptyGrowthState = ({ patientName, onAddRecord }) => (
  <div className="text-center py-12">
    <ChartBarIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
    <Typography variant="h5" color="blue-gray" className="mb-2">
      No Growth Records Found
    </Typography>
    <Typography variant="small" className="text-blue-gray-500 mb-6">
      Start tracking {patientName}'s growth by adding a new record
    </Typography>
    <Button variant="gradient" onClick={onAddRecord}>
      Add First Growth Record
    </Button>
  </div>
);

const AppointmentsList = ({ appointments }) => (
  console.log(appointments),
  <div className="grid grid-cols-1 gap-6">
    {appointments.map((appointment, index) => (
      <Card key={index} className="border border-blue-gray-50">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h5" color="blue-gray" className="mb-1">
                {appointment.name}
              </Typography>
              <Typography variant="small" className="text-blue-gray-500">
                {appointment.message}
              </Typography>
            </div>
            <div className="text-right">
              <Typography variant="h6" color="blue-gray">
                {appointment.time}
              </Typography>
              <Typography variant="small" className="text-blue-gray-500">
                {appointment.hour}
              </Typography>
            </div>
          </div>
        </CardBody>
      </Card>
    ))}
  </div>
);

const EmptyAppointmentsState = ({ patientName }) => (
  <div className="text-center py-12">
    <CalendarDaysIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
    <Typography variant="h5" color="blue-gray" className="mb-2">
      No Appointments Found
    </Typography>
    <Typography variant="small" className="text-blue-gray-500">
      No appointment records available for {patientName}
    </Typography>
  </div>
);

// Modal Components
const VaccinationModal = ({ 
  open, 
  onClose, 
  title, 
  formData, 
  updateField, 
  onSubmit, 
  isValid, 
  loading, 
  isEdit = false 
}) => (
  <Dialog open={open} handler={onClose}>
    <DialogHeader>{title}</DialogHeader>
    <DialogBody divider>
      <div className="grid gap-6">
        <Input
          label="Vaccine Name"
          value={formData.vaccine}
          onChange={(e) => updateField('vaccine', e.target.value)}
          required
        />
        
        <Input
          label="Due Date"
          type="date"
          value={formData.dueDate}
          onChange={(e) => updateField('dueDate', e.target.value)}
          required
        />
        
        <Select
          label="Status"
          value={formData.status}
          onChange={(val) => updateField('status', val)}
        >
          <Option value="pending">Pending</Option>
          <Option value="done">Administered</Option>
        </Select>
        
        {formData.status === "done" && (
          <Input
            label="Date Administered"
            type="date"
            value={formData.dateAdministered}
            onChange={(e) => updateField('dateAdministered', e.target.value)}
            required={formData.status === "done"}
          />
        )}
      </div>
    </DialogBody>
    <DialogFooter>
      <Button
        variant="text"
        color="red"
        onClick={onClose}
        className="mr-1"
        disabled={loading}
      >
        Cancel
      </Button>
      <Button 
        variant="gradient" 
        color="green" 
        onClick={onSubmit}
        disabled={!isValid || loading}
      >
        {loading ? "Processing..." : (isEdit ? "Update" : "Create")}
      </Button>
    </DialogFooter>
  </Dialog>
);

const GrowthModal = ({ 
  open, 
  onClose, 
  formData, 
  updateField, 
  onSubmit, 
  isValid, 
  loading, 
  patientAge 
}) => {
  const calculatedBMI = useMemo(() => 
    calculateBMI(formData.weight, formData.height), 
    [formData.weight, formData.height]
  );
  
  const bmiCategory = useMemo(() => 
    getBMICategory(calculatedBMI, patientAge), 
    [calculatedBMI, patientAge]
  );

  return (
    <Dialog open={open} handler={onClose}>
      <DialogHeader>Add Growth Record</DialogHeader>
      <DialogBody divider>
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Height (cm)"
              type="number"
              value={formData.height}
              onChange={(e) => updateField('height', e.target.value)}
              required
              min="0"
              step="0.1"
            />
            
            <Input
              label="Weight (kg)"
              type="number"
              value={formData.weight}
              onChange={(e) => updateField('weight', e.target.value)}
              required
              min="0"
              step="0.1"
            />
          </div>
          
          <Input
            label="Date"
            type="date"
            value={formData.growthDate}
            onChange={(e) => updateField('growthDate', e.target.value)}
            required
          />
          
          {formData.height && formData.weight && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <Typography variant="h6" color="blue-gray">
                BMI Calculation
              </Typography>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="small" className="font-semibold text-blue-gray-500">
                    BMI Value:
                  </Typography>
                  <Typography variant="lead">
                    {calculatedBMI}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" className="font-semibold text-blue-gray-500">
                    Category:
                  </Typography>
                  <Chip
                    value={bmiCategory}
                    color={getBMICategoryColor(bmiCategory)}
                    size="md"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          variant="text"
          color="red"
          onClick={onClose}
          className="mr-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="gradient" 
          color="green" 
          onClick={onSubmit}
          disabled={!isValid || loading}
        >
          {loading ? "Adding..." : "Add Record"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

const ViewVaccinationModal = ({ 
  open, 
  onClose, 
  vaccination, 
  onScheduleNext, 
  onExportPDF 
}) => (
  <Dialog open={open} handler={onClose}>
    <DialogHeader>Vaccination Details</DialogHeader>
    <DialogBody divider>
      {vaccination && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <Typography variant="h6" color="blue-gray">
              {vaccination.vaccine}
            </Typography>
            <Chip
              value={vaccination.status}
              color={getStatusColor(vaccination.status)}
              size="md"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                Due Date:
              </Typography>
              <Typography>
                {formatDate(vaccination.dueDate)}
              </Typography>
            </div>
            
            {vaccination.dateAdministered && (
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Administered:
                </Typography>
                <Typography>
                  {formatDate(vaccination.dateAdministered)}
                </Typography>
              </div>
            )}
            
            <div>
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                Status:
              </Typography>
              <Typography>
                {vaccination.status.charAt(0).toUpperCase() + vaccination.status.slice(1)}
              </Typography>
            </div>
            
            {vaccination.notes && (
              <div className="col-span-2">
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Notes:
                </Typography>
                <Typography>
                  {vaccination.notes}
                </Typography>
              </div>
            )}
          </div>
          
          {vaccination.status === "done" && (
            <div className="mt-4">
              <Button 
                variant="gradient" 
                fullWidth
                onClick={() => onScheduleNext(vaccination)}
              >
                Schedule Next Dose
              </Button>
            </div>
          )}
        </div>
      )}
    </DialogBody>
    <DialogFooter>
      <Button
        variant="gradient"
        onClick={() => onExportPDF(vaccination)}
        className="mr-2"
      >
        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
        Export PDF
      </Button>
      <Button 
        variant="outlined" 
        onClick={onClose}
      >
        Close
      </Button>
    </DialogFooter>
  </Dialog>
);

const DeleteConfirmationModal = ({ 
  open, 
  onClose, 
  vaccination, 
  onConfirm, 
  loading 
}) => (
  <Dialog open={open} handler={onClose}>
    <DialogHeader>Delete Vaccination Record</DialogHeader>
    <DialogBody divider>
      <Typography variant="small" className="text-red-500">
        Are you sure you want to delete the vaccination record for {vaccination?.vaccine}? 
        This action cannot be undone.
      </Typography>
    </DialogBody>
    <DialogFooter>
      <Button
        variant="text"
        color="red"
        onClick={onClose}
        className="mr-1"
        disabled={loading}
      >
        Cancel
      </Button>
      <Button 
        variant="gradient" 
        color="red" 
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Deleting..." : "Delete"}
      </Button>
    </DialogFooter>
  </Dialog>
);

export default PatientDetail;





