import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,

} from "@/data/appointmentsData";

import { getPatientTable } from "@/data/patientTable";
import { createPatient } from "@/data/createPatient";
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
  Chip,
  Tabs,
  TabsHeader,
  Tab,
  Avatar,
  Stepper,
  Step,
  Typography
} from "@material-tailwind/react";
import { 
  Calendar as CalendarIcon, 
  List,
  UserPlus,
  Clock,
  User,
  Check
} from 'lucide-react';
import dayjs from 'dayjs';
import AppointmentCalendar from './dashboard/componet/AppointmentCalendar';
import AppointmentList from './dashboard/componet/appointmentList';

const AppointmentsPage = () => {
  // State management
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  
  // Form states
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const [parentForm, setParentForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });

  const [patientForm, setPatientForm] = useState({
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
    patientId: '',
    notes: ''
  });

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appts, pts] = await Promise.all([
          getAppointments(),
          getPatientTable()
        ]);
        setAppointments(appts);
        setPatients(pts);
      } catch (error) {
        toast.error('Échec du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle parent and patient creation
  const handleCreatePatient = async () => {
    try {
      // First create the parent
      const parentData = {
        fullName: parentForm.fullName,
        email: parentForm.email,
        phoneNumber: parentForm.phoneNumber,

        address: parentForm.address, // Optional, can be added later
        role: 'parent'
      };

      // Then create the patient with parent reference
      const patientData = {
        ...patientForm,
        parentId: parent._id, // This should come from parent creation
      
          fullName: parentForm.fullName,
          email: parentForm.email,
          phoneNumber: parentForm.phoneNumber,
          address: parentForm.address,
          role: 'parent'
      };

      const newPatient = await createPatient(patientData);
      setPatients(prev => [...prev, newPatient]);
      toast.success('Patient créé avec succès');
      
      // Move to appointment scheduling with the new patient
      setAppointmentForm(prev => ({
        ...prev,
        patientId: newPatient._id
      }));
      setActiveStep(2);
    } catch (error) {
      toast.error('Échec de la création du patient');
      console.error('Error creating patient:', error);
    }
  };

  // Handle appointment creation/update
  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    try {
      if (selectedAppointment) {
        // Update existing appointment
        const updated = await updateAppointment(selectedAppointment._id, appointmentForm);
        setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
        toast.success('Rendez-vous mis à jour');
      } else {
        // Create new appointment
        const created = await createAppointment(appointmentForm);
        setAppointments(prev => [...prev, created]);
        toast.success('Rendez-vous créé');
      }
      closeAllModals();
    } catch (error) {
      toast.error(`Échec de ${selectedAppointment ? 'mise à jour' : 'création'} du rendez-vous`);
      console.error('Error:', error);
    }
  };

  // Calendar time slot selection
  const handleCalendarTimeSelect = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setAppointmentForm(prev => ({
      ...prev,
      date: date.format('YYYY-MM-DD'),
      time
    }));
    setIsPatientModalOpen(true);
    setActiveStep(0); // Start with parent info
  };

  // Edit appointment handler
  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentForm({
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      patientId: appointment.patientId,
      notes: appointment.notes || ''
    });
    setIsModalOpen(true);
  };

  // Delete appointment handler
  const handleDelete = async () => {
    console.log('Deleting appointment:', selectedAppointment);
    try {
      await deleteAppointment(selectedAppointment);
      setAppointments(prev => prev.filter(a => a._id !== selectedAppointment));
      toast.success('Rendez-vous supprimé');
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error('Échec de la suppression du rendez-vous');
    }
  };

  // Reset all modal states
  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsPatientModalOpen(false);
    setIsDeleteModalOpen(false);
    setActiveStep(0);
    setSelectedAppointment(null);
    // Reset forms
    setParentForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      address: ''
    });
    setPatientForm({
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: ''
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Typography variant="h5">Chargement des rendez-vous...</Typography>
      </div>
    );
  }

  // Modal form steps
  const renderFormStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <Typography variant="h5" className="mb-4">Informations du Parent</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom Complet"
                value={parentForm.fullName}
                onChange={(e) => setParentForm({...parentForm, fullName: e.target.value})}
                required
              />
              <Input
                type="email"
                label="Email"
                value={parentForm.email}
                onChange={(e) => setParentForm({...parentForm, email: e.target.value})}
                required
              />
              <Input
                label="Numéro de Téléphone"
                type="tel"
                value={parentForm.phoneNumber}
                onChange={(e) => {
                  let value = e.target.value;
                  if (!value.startsWith("+212")) {
                    value = "+212" + value.replace(/^\+?212?/, "");
                  }
                  setParentForm({...parentForm, phoneNumber: value});
                }}
                required
                icon={<span className="text-gray-500">+212</span>}
                inputProps={{
                  maxLength: 13,
                  pattern: "\\+212[0-9]{9}"
                }}
              />
              <Input
                label="Adresse"
                value={parentForm.address}
                onChange={(e) => setParentForm({...parentForm, address: e.target.value})}
                required
              />
            </div>
          </>
        );
      case 1:
        return (
          <>
            <Typography variant="h5" className="mb-4">Informations du Patient</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={patientForm.firstName}
                onChange={(e) => setPatientForm({...patientForm, firstName: e.target.value})}
                required
              />
              <Input
                label="Nom de Famille"
                value={patientForm.lastName}
                onChange={(e) => setPatientForm({...patientForm, lastName: e.target.value})}
                required
              />
              <Input
                type="date"
                label="Date de Naissance"
                value={patientForm.birthDate}
                onChange={(e) => setPatientForm({...patientForm, birthDate: e.target.value})}
                required
              />
              <Select
                label="Sexe"
                value={patientForm.gender}
                onChange={(value) => setPatientForm({...patientForm, gender: value})}
                required
              >
                <Option value="male">Masculin</Option>
                <Option value="female">Féminin</Option>
              </Select>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <Typography variant="h5" className="mb-4">Planifier le Rendez-vous</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Date"
                value={appointmentForm.date}
                onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                required
              />
              <Input
                type="time"
                label="Heure"
                value={appointmentForm.time}
                onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                required
              />
              <Select
                label="Type"
                value={appointmentForm.type}
                onChange={(value) => setAppointmentForm({...appointmentForm, type: value})}
                required
              >
                <Option value="consultation">Consultation</Option>
                <Option value="vaccination">Vaccination</Option>
                <Option value="surgery">Chirurgie</Option>
              </Select>
              <Select
                label="Statut"
                value={appointmentForm.status}
                onChange={(value) => setAppointmentForm({...appointmentForm, status: value})}
                required
              >
                <Option value="confirmed">Confirmé</Option>
                <Option value="pending">En attente</Option>
              </Select>
            </div>
            <div className="mt-4">
              <Typography variant="h6">Détails du Patient</Typography>
              <div className="p-4 bg-gray-50 rounded-lg mt-2">
                <Typography>
                  {patientForm.firstName} {patientForm.lastName}
                </Typography>
                <Typography variant="small">
                  Parent: {parentForm.fullName}
                </Typography>
              </div>
            </div>
            <Textarea
              label="Notes"
              value={appointmentForm.notes}
              onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h3" className="font-bold">Rendez-vous</Typography>
        <Button
          className="flex items-center gap-2"
          onClick={() => {
            setIsPatientModalOpen(true);
            setActiveStep(0);
          }}
        >
          <UserPlus size={18} /> Nouveau Patient & Rendez-vous
        </Button>
      </div>

      {/* View Tabs */}
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

      {/* Calendar View */}
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
      {/* List View */}
     {activeTab === 'list' && (
  <AppointmentList
    appointments={appointments}
    patients={patients}
    onEditAppointment={handleEditAppointment} 
    onDeleteAppointment={(appointment) => {
      setSelectedAppointment(appointment);
      setIsDeleteModalOpen(true);
    }}
  />
)}

   {/* Multi-step Patient + Appointment Modal */}

        <Dialog open={isPatientModalOpen} handler={closeAllModals} size="xxl" className="p-12">
          <DialogHeader>
            <Stepper activeStep={activeStep} className="w-full">
          <Step onClick={() => setActiveStep(0)}>
            <User className="h-5 w-5" />
            <div className="absolute -bottom-[2.5rem] w-max text-center">
              <Typography variant="h6" color={activeStep === 0 ? "blue" : "gray"}>
            Info Parent
              </Typography>
            </div>
          </Step>
          <Step onClick={() => activeStep > 0 && setActiveStep(1)}>
            <User className="h-5 w-5" />
            <div className="absolute -bottom-[2.5rem] w-max text-center">
              <Typography variant="h6" color={activeStep === 1 ? "blue" : "gray"}>
            Info Patient
              </Typography>
            </div>
          </Step>
          <Step onClick={() => activeStep > 1 && setActiveStep(2)}>
            <Clock className="h-5 w-5" />
            <div className="absolute -bottom-[2.5rem] w-max text-center">
              <Typography variant="h6" color={activeStep === 2 ? "blue" : "gray"}>
            Rendez-vous
              </Typography>
            </div>
          </Step>
            </Stepper>
          </DialogHeader>

          <form onSubmit={
            activeStep < 2 
          ? (e) => { 
              e.preventDefault(); 
              if (activeStep === 1) {
            handleCreatePatient();
              } else {
            setActiveStep(activeStep + 1); 
              }
            } 
          : handleSubmitAppointment
          }>
            <DialogBody className="space-y-4">
          {renderFormStep()}
            </DialogBody>
            <DialogFooter>
          <div className="flex justify-between w-full">
            {activeStep > 0 ? (
              <Button
            variant="text"
            onClick={() => setActiveStep(activeStep - 1)}
            className="mr-1"
              >
            Retour
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button
            variant="text"
            color="red"
            onClick={closeAllModals}
            className="mr-1"
              >
            Annuler
              </Button>
              <Button 
            type="submit"
            color="blue"
            className="flex items-center gap-2"
              >
            {activeStep === 0 ? 'Continuer' : 
             activeStep === 1 ? 'Créer Patient' : 
             selectedAppointment ? 'Mettre à jour' : 'Créer'} 
            <Check size={18} />
              </Button>
            </div>
          </div>
            </DialogFooter>
          </form>
        </Dialog>

        {/* Edit Appointment Modal */}
        <Dialog open={isModalOpen} handler={closeAllModals} size="lg">
          <DialogHeader>
            <Typography variant="h5">Modifier le Rendez-vous</Typography>
          </DialogHeader>
          <form onSubmit={handleSubmitAppointment}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Date"
                  value={appointmentForm.date ? dayjs(appointmentForm.date).format("YYYY-MM-DD") : ""}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                  required
                />

                <Input
                  type="time"
                  label="Heure"
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                  required
                />
                <Select
                  label="Type"
                  value={appointmentForm.type || ""}
                  onChange={(value) => setAppointmentForm({ ...appointmentForm, type: value })}
                  required
                >
                  <Option value="consultation">Consultation</Option>
                  <Option value="vaccination">Vaccination</Option>
                  <Option value="surgery">Chirurgie</Option>
                </Select>
                <Select
                  label="Statut"
                  value={appointmentForm.status || ""}
                  onChange={(value) => setAppointmentForm({ ...appointmentForm, status: value })}
                  required
                >
                  <Option value="confirmed">Confirmé</Option>
                  <Option value="pending">En attente</Option>
                  <Option value="cancelled">Annulé</Option>
                  <Option value="completed">Terminé</Option>
                </Select>
              </div>
              <div className="flex items-center gap-3 p-2 bg-blue-gray-50 rounded">
                <Avatar
                  src={patients.find(p => p._id === appointmentForm.patientId)?.img || '/img/team-2.jpeg'}
                  size="sm"
                />
                <div>
                  <Typography>
                    {patients.find(p => p._id === appointmentForm.patientId)?.firstName || 'Patient'}{" "}
                    {patients.find(p => p._id === appointmentForm.patientId)?.lastName || ''}
                  </Typography>
                  <Typography variant="small">
                    Parent: {patients.find(p => p._id === appointmentForm.patientId)?.parent?.fullName || ''}
                  </Typography>
                </div>
              </div>
              <Textarea
                label="Notes"
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
              />
            </DialogBody>
            <DialogFooter>
              <Button
                variant="text"
                color="red"
                onClick={closeAllModals}
                className="mr-1"
              >
                Annuler
              </Button>
              <Button type="submit" color="blue">
                Mettre à jour le Rendez-vous
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} handler={() => setIsDeleteModalOpen(false)} size="sm">
        <DialogHeader>Confirmer la Suppression</DialogHeader>
        <DialogBody>
          Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action ne peut pas être annulée.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="blue-gray"
            onClick={() => setIsDeleteModalOpen(false)}
            className="mr-1"
          >
            Annuler
          </Button>
          <Button color="red" onClick={handleDelete}>
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


