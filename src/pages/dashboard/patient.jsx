

import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Avatar,
  Chip,
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
import UpdatePatientModal from './componet/UpdatePatientModal'; 

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
import PatientDetailsModal from "./componet/PatientDetailsModal";
import { useNavigate } from "react-router-dom";
import { getVaccinationRecords } from "@/data/getVaccinationRecords";


// Validation schemas
const parentInfoSchema = Yup.object().shape({
  fullName: Yup.string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  email: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email must not exceed 254 characters')
    .lowercase()
    .trim(),
  phoneNumber: Yup.string()
    .required('Phone number is required')
    .matches(/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .trim()
});

const patientInfoSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  birthDate: Yup.date()
    .required('Birth date is required')
    .max(new Date(), 'Birth date cannot be in the future')
    .min(new Date('1900-01-01'), 'Birth date cannot be before 1900'),
  gender: Yup.string()
    .required('Gender is required')
    .oneOf(['male', 'female'], 'Please select a valid gender'),
});

const appointmentSchema = Yup.object().shape({
  date: Yup.date()
    .required('Date is required')
    .min(new Date(), 'Appointment date cannot be in the past'),
  time: Yup.string()
    .required('Time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time'),
  reason: Yup.string()
    .required('Reason for visit is required')
    .min(5, 'Reason must be at least 5 characters')
    .max(500, 'Reason must not exceed 500 characters')
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


const navigate = useNavigate();

const handleViewDetails = async (patient) => {
  console.log('Navigating to:', `/patients/details/${patient._id}`);
  const vaccinations = await getVaccinationRecords();
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
    toast.success('Patient list refreshed');
  } catch (error) {
    console.error('Error refreshing patient list:', error);
    toast.error('Failed to refresh patient list');
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
      toast.error('Failed to load appointment data');
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
        toast.error('Please fix the errors in the parent information form');
        return;
      }
      setCurrentStep(2);
      toast.success('Parent information validated successfully');
    } catch (error) {
      toast.error('Validation error occurred');
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

      if (!response.ok) {
        throw new Error('Failed to create patient');
      }

      toast.success('Patient created successfully!', {
        position: "top-right",
        autoClose: 3000,
      });

      handleCreateModalClose();

      const updatedPatients = await getPatientTable();
      setPatients(updatedPatients);

    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error(`Error creating patient: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleAppointmentSubmit = async (appointmentData) => {
  //   console.log('selectedpatient:', selectedPatient);
  //   console.log('Submitting appointment data:', appointmentData);
  //   // if (isSubmitting) return;

  //   // setIsSubmitting(true);

  //   console.log("submitting data:", appointmentData);

  //   try {
  //     console.log('Submitting appointment data:', appointmentData);
  //     const sanitizedAppointmentData = {
  //       patientId: selectedPatient.patientId, // Assuming patientId is available in selectedPatient
  //       date: selectedDate,
  //       time: selectedTime,
  //       type: sanitizeInput(appointmentData.reason)
  //     };
  //     const res = await createAppointment(sanitizedAppointmentData);

  //     toast.success('Appointment booked successfully!', {
  //       position: "top-right",
  //       autoClose: 3000,
  //     });

  //     handleClose();

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



 const handleAppointmentSubmit = async (appointmentData) => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    if (!selectedPatient || !selectedPatient.patientId) {
      throw new Error('No patient selected or patient ID missing');
    }

    const formattedDate = selectedDate.toISOString().split('T')[0];

    const sanitizedAppointmentData = {
      patientId: selectedPatient.patientId,
      date: formattedDate,
      time: selectedTime,
      type: 'consultation', // Fixed: lowercase 'type' and set default value
      notes: sanitizeInput(appointmentData.reason) // Using reason as notes
    };

    console.log('Sending appointment data:', sanitizedAppointmentData);

    const res = await createAppointment(sanitizedAppointmentData);

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to create appointment');
    }

    toast.success('Appointment booked successfully!', {
      position: "top-right",
      autoClose: 3000,
    });

    handleClose();

    const updatedAppointments = await getAppointments();
    setAppointments(updatedAppointments);

  } catch (error) {
    console.error('Error booking appointment:', error);
    toast.error(`Error booking appointment: ${error.message}`, {
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

  useEffect(() => async () => {
    const patientsData = await getPatientTable();
    setPatients(patientsData);
    console.log('Patients data fetched:', patientsData);
  }, []);

  // Helper component for form field errors
  const FieldError = ({ error }) => (
    error ? (
      <Typography variant="small" color="red" className="mt-1 text-xs">
        {error.message}
      </Typography>
    ) : null
  );


  const handleDelete = async (patientId) => {

    console.log('Deleting patient with ID:', patientId);
    if (!patientId) {
      toast.error('Patient ID is missing');
      return;
    }

    try {
      const response = await axiosInstance.delete(`patients/${patientId}`);

      toast.success('Patient deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
      });

      // Refresh the patients list
      const updatedPatients = await getPatientTable();
      setPatients(updatedPatients);

    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error(`Error deleting patient: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  }

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <ToastContainer />

      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6 flex justify-between items-center">
          <Typography variant="h6" color="white">
            Patients Table
          </Typography>
          <Button
            size="sm"
            color="white"
            variant="filled"
            onClick={handleCreateModalOpen}
          >
            Add New Patient
          </Button>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["patient", "parents", "appointments status", "Date", "Take Appointment", "Actions"].map((el) => (
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
  {patients.map((patient, key) => {
    // Use 'patient' instead of destructuring to avoid confusion
    const className = `py-3 px-5 ${key === patients.length - 1 ? "" : "border-b border-blue-gray-50"}`;
    
    return (
      <tr key={patient._id || key}>
        {/* Patient Column */}


        {/* Patient Column */}
<td className={className}>
  <div className="flex items-center gap-4">
    <Avatar src={patient.img} alt={patient.firstName} size="sm" variant="rounded" />
    <div>
      <Typography variant="small" color="blue-gray" className="font-semibold">
       <span className="text-xs font-normal">first name :</span> {patient.firstName} <span className="text-xs font-normal">last name :</span> {patient.lastName} {/* Changed from patient.name */}
      </Typography>
      <Typography className="text-xs font-normal text-blue-gray-500">
        Gender: {patient.gender || 'Not specified'}
      </Typography>
    </div>
  </div>
</td>
        {/* <td className={className}>
          <div className="flex items-center gap-4">
            <Avatar src={patient.img} alt={patient.name} size="sm" variant="rounded" />
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold">
                {patient.name}
              </Typography>
              <Typography className="text-xs font-normal text-blue-gray-500">
                Gender: {patient.gender || 'Not specified'}
              </Typography>
            </div>
          </div>
        </td> */}

        {/* Parents Column */}
        <td className={className}>
          <div className="flex items-center gap-4">
      
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold">
                {patient.parent.fullName || 'Not specified'}
              </Typography>
              <Typography className="text-xs font-normal text-blue-gray-500">
                {patient.parent.email || patient.email || 'No email'}
              </Typography>
            </div>
          </div>
        </td>

        {/* Appointment Status Column */}
        <td className={className}>
          <Typography className="text-xs font-semibold text-blue-gray-600">
            {patient.job && patient.job[0] ? patient.job[0] : 'Not specified'}
          </Typography>
          <Typography className="text-xs font-normal text-blue-gray-500">
            Status: {patient.appointments.typw ? 'Has appointments' : 'No appointments'}
          </Typography>
        </td>

       

       
     <td className={className}>
          {patient.appointments && patient.appointments.length > 0 ? (
            <>
              <Typography className="text-xs font-semibold text-blue-gray-600">
                {patient.appointments[0].date}
              </Typography>
              <Typography className="text-xs font-semibold text-blue-gray-600">
                at: {patient.appointments[0].time}
              </Typography>
            </>
          ) : (
            <Typography className="text-xs font-normal text-blue-gray-400">
              No appointment
            </Typography>
          )}
        </td>

 {/* Online Status and Get Appointment */}
        <td className={className}>
         
          <button
            onClick={() => handleOpen(patient)} // Now passing the correct patient object
            className="text-xs font-normal text-blue-gray-500 underline ml-2 hover:text-blue-gray-700"
          >
            Get Appointment
          </button>
        </td>
        {/* Actions Column */}
        
<td className={className}>
  <div className="flex gap-2">
    <Button
      variant="text"
      color="blue"
      size="sm"
      className="text-xs font-semibold text-blue-gray-600"
      onClick={() => handleUpdateModalOpen(patient)}
    >
      Edit
    </Button>
    <Button
      variant="text"
      color="red"
      size="sm"
      className="text-xs font-semibold text-blue-gray-600"
      onClick={() => handleDelete(patient._id)}
    >
      Delete
    </Button>
<Button
  variant="text"
  color="green"
  size="sm"
  className="text-xs font-semibold text-blue-gray-600"
  onClick={() => handleViewDetails(patient)}
>
  View Details
</Button>

  </div>
</td>
      </tr>
    );
  })}
</tbody>
          </table>
        </CardBody>
      </Card>

      {/* Update Patient Modal */}
<UpdatePatientModal
  open={updateModalOpen}
  onClose={handleUpdateModalClose}
  patient={patientToUpdate}
  onPatientUpdated={handlePatientUpdated}
/>

{/* <PatientDetailsModal
  open={detailsModalOpen}
  onClose={handleViewDetailsClose}
  patient={patientToView}
/> */}
      

      {/* Appointment Modal */}
      <Dialog open={open} handler={handleClose} size="xl" className="h-screen overflow-auto">
        <DialogHeader>Book Appointment</DialogHeader>
        <form onSubmit={appointmentForm.handleSubmit(handleAppointmentSubmit)}>
          <DialogBody className="flex flex-col gap-4">
            {selectedPatient && (
              <>
                <Typography variant="h6">Patient: {selectedPatient.name}</Typography>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography variant="h6" className="mb-2">Select Date</Typography>
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
                    <Typography variant="h6" className="mb-2">Available Time Slots</Typography>
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
                              <span className="ml-1 text-xs">(Booked)</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Typography variant="small" color="gray">
                        Please select a date first
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
                          label="Reason for Visit *"
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
              Cancel
            </Button>
            <Button
              variant="gradient"
              color="green"
              type="submit"
              disabled={isSubmitting || !selectedDate || !selectedTime}

              onClick={handleAppointmentSubmit}
            >

              {isSubmitting ? 'Booking...' : 'Book Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Create Patient Modal */}
      <Dialog open={createModalOpen} handler={handleCreateModalClose} size="xl" className="max-h-screen overflow-auto">
        <DialogHeader className="flex justify-between items-center">
          <div>
            <Typography variant="h5">
              {currentStep === 1 ? 'Parent Information' : 'Patient Information'}
            </Typography>
            <Typography variant="small" color="gray" className="font-normal">
              Step {currentStep} of 2
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
                Parent/Guardian Details
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
                          label="Full Name *"
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
                          label="Email Address *"
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
                        label="Phone Number *"
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
                Patient Details
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
                          label="First Name *"
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
                          label="Last Name *"
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
                          label="Birth Date *"
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
                          <option value="">Select Gender *</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
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
                  Parent Information Summary:
                </Typography>
                <Typography variant="small" color="gray">
                  <strong>Name:</strong> {parentForm.watch('fullName')}<br />
                  <strong>Email:</strong> {parentForm.watch('email')}<br />
                  <strong>Phone:</strong> {parentForm.watch('phoneNumber')}
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
            Cancel
          </Button>

          <div className="flex gap-2">
            {currentStep === 2 && (
              <Button
                variant="outlined"
                color="gray"
                onClick={handlePreviousStep}
                type="button"
              >
                Previous
              </Button>
            )}

            {currentStep === 1 ? (
              <Button
                variant="gradient"
                color="blue"
                onClick={handleNextStep}
                type="button"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="gradient"
                color="green"
                onClick={patientForm.handleSubmit(handleCreatePatient)}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? 'Creating...' : 'Create Patient'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </Dialog>

    </div>
  );
}

export default Patient;


