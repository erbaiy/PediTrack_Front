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
        toast.error('Failed to fetch data');
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
      toast.success('Patient created successfully');
      
      // Move to appointment scheduling with the new patient
      setAppointmentForm(prev => ({
        ...prev,
        patientId: newPatient._id
      }));
      setActiveStep(2);
    } catch (error) {
      toast.error('Failed to create patient');
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
        toast.success('Appointment updated');
      } else {
        // Create new appointment
        const created = await createAppointment(appointmentForm);
        setAppointments(prev => [...prev, created]);
        toast.success('Appointment created');
      }
      closeAllModals();
    } catch (error) {
      toast.error(`Failed to ${selectedAppointment ? 'update' : 'create'} appointment`);
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
      toast.success('Appointment deleted');
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error('Failed to delete appointment');
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
        <Typography variant="h5">Loading appointments...</Typography>
      </div>
    );
  }

  // Modal form steps
  const renderFormStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <Typography variant="h5" className="mb-4">Parent Information</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
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
                label="Phone Number"
                type="tel"
                value={parentForm.phoneNumber}
                onChange={(e) => setParentForm({...parentForm, phoneNumber: e.target.value})}
                required
              />
              <Input
                label="Address"
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
            <Typography variant="h5" className="mb-4">Patient Information</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={patientForm.firstName}
                onChange={(e) => setPatientForm({...patientForm, firstName: e.target.value})}
                required
              />
              <Input
                label="Last Name"
                value={patientForm.lastName}
                onChange={(e) => setPatientForm({...patientForm, lastName: e.target.value})}
                required
              />
              <Input
                type="date"
                label="Birth Date"
                value={patientForm.birthDate}
                onChange={(e) => setPatientForm({...patientForm, birthDate: e.target.value})}
                required
              />
              <Select
                label="Gender"
                value={patientForm.gender}
                onChange={(value) => setPatientForm({...patientForm, gender: value})}
                required
              >
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <Typography variant="h5" className="mb-4">Schedule Appointment</Typography>
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
                label="Time"
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
                <Option value="surgery">Surgery</Option>
              </Select>
              <Select
                label="Status"
                value={appointmentForm.status}
                onChange={(value) => setAppointmentForm({...appointmentForm, status: value})}
                required
              >
                <Option value="confirmed">Confirmed</Option>
                <Option value="pending">Pending</Option>
              </Select>
            </div>
            <div className="mt-4">
              <Typography variant="h6">Patient Details</Typography>
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
        <Typography variant="h3" className="font-bold">Appointments</Typography>
        <Button
          className="flex items-center gap-2"
          onClick={() => {
            setIsPatientModalOpen(true);
            setActiveStep(0);
          }}
        >
          <UserPlus size={18} /> New Patient & Appointment
        </Button>
      </div>

      {/* View Tabs */}
      <Tabs value={activeTab} className="mb-6">
        <TabsHeader>
          <Tab value="calendar" onClick={() => setActiveTab('calendar')}>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" /> Calendar
            </div>
          </Tab>
          <Tab value="list" onClick={() => setActiveTab('list')}>
            <div className="flex items-center gap-2">
              <List className="h-5 w-5" /> List View
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

  <Dialog open={isPatientModalOpen} handler={closeAllModals} size="xxl" className="max-w-xxl container mx-auto">
          <DialogHeader>
            <Stepper activeStep={activeStep} className="w-full">
          <Step onClick={() => setActiveStep(0)}>
            <User className="h-5 w-5" />
            <div className="absolute -bottom-[2.5rem] w-max text-center">
              <Typography variant="h6" color={activeStep === 0 ? "blue" : "gray"}>
            Parent Info
              </Typography>
            </div>
          </Step>
          <Step onClick={() => activeStep > 0 && setActiveStep(1)}>
            <User className="h-5 w-5" />
            <div className="absolute -bottom-[2.5rem] w-max text-center">
              <Typography variant="h6" color={activeStep === 1 ? "blue" : "gray"}>
            Patient Info
              </Typography>
            </div>
          </Step>
          <Step onClick={() => activeStep > 1 && setActiveStep(2)}>
            <Clock className="h-5 w-5" />
            <div className="absolute -bottom-[2.5rem] w-max text-center">
              <Typography variant="h6" color={activeStep === 2 ? "blue" : "gray"}>
            Appointment
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
            Back
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button
            variant="text"
            color="red"
            onClick={closeAllModals}
            className="mr-1"
              >
            Cancel
              </Button>
              <Button 
            type="submit"
            color="blue"
            className="flex items-center gap-2"
              >
            {activeStep === 0 ? 'Continue' : 
             activeStep === 1 ? 'Create Patient' : 
             selectedAppointment ? 'Update' : 'Create'} 
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
          <Typography variant="h5">Edit Appointment</Typography>
        </DialogHeader>
        <form onSubmit={handleSubmitAppointment}>
          <DialogBody className="space-y-4">
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
                label="Time"
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
                <Option value="surgery">Surgery</Option>
              </Select>
              <Select
                label="Status"
                value={appointmentForm.status}
                onChange={(value) => setAppointmentForm({...appointmentForm, status: value})}
                required
              >
                <Option value="confirmed">Confirmed</Option>
                <Option value="pending">Pending</Option>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-2 bg-blue-gray-50 rounded">
              <Avatar 
                src={patients.find(p => p._id === appointmentForm.patientId)?.img || '/img/team-2.jpeg'} 
                size="sm" 
              />
              <div>
                <Typography>
                  {patients.find(p => p._id === appointmentForm.patientId)?.firstName || 'Patient'} 
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
              onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
            />
          </DialogBody>
          <DialogFooter>
            <Button
              variant="text"
              color="red"
              onClick={closeAllModals}
              className="mr-1"
            >
              Cancel
            </Button>
            <Button type="submit" color="blue">
              Update Appointment
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} handler={() => setIsDeleteModalOpen(false)} size="sm">
        <DialogHeader>Confirm Deletion</DialogHeader>
        <DialogBody>
          Are you sure you want to delete this appointment? This action cannot be undone.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="blue-gray"
            onClick={() => setIsDeleteModalOpen(false)}
            className="mr-1"
          >
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete}>
            Delete
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
//   getPatientTable
// } from "@/data/appointmentsData";
// import AppointmentCalendar from "@/components/AppointmentCalendar";
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
//   Avatar
// } from "@material-tailwind/react";
// import { Calendar as CalendarIcon, List } from 'lucide-react';
// import dayjs from 'dayjs';

// const AppointmentsPage = () => {
//   const [appointments, setAppointments] = useState([]);
//   const [patients, setPatients] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDate, setCurrentDate] = useState(dayjs());
//   const [activeTab, setActiveTab] = useState('calendar');
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     date: dayjs().format('YYYY-MM-DD'),
//     time: '09:00',
//     type: 'consultation',
//     status: 'confirmed',
//     patientId: '',
//     notes: ''
//   });

//   // Fetch data
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

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (selectedAppointment) {
//         const updated = await updateAppointment(selectedAppointment._id, formData);
//         setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
//         toast.success('Appointment updated');
//       } else {
//         const created = await createAppointment(formData);
//         setAppointments(prev => [...prev, created]);
//         toast.success('Appointment created');
//       }
//       setIsModalOpen(false);
//     } catch (error) {
//       toast.error(`Failed to ${selectedAppointment ? 'update' : 'create'} appointment`);
//     }
//   };

//   // Handle appointment creation from calendar
//   const handleCreateAppointment = (date, time) => {
//     setSelectedAppointment(null);
//     setFormData({
//       date: date.format('YYYY-MM-DD'),
//       time,
//       type: 'consultation',
//       status: 'confirmed',
//       patientId: patients.length > 0 ? patients[0]._id : '',
//       notes: ''
//     });
//     setIsModalOpen(true);
//   };

//   // Handle appointment edit from calendar
//   const handleEditAppointment = (appointment) => {
//     setSelectedAppointment(appointment);
//     setFormData({
//       date: appointment.date,
//       time: appointment.time,
//       type: appointment.type,
//       status: appointment.status,
//       patientId: appointment.patientId,
//       notes: appointment.notes || ''
//     });
//     setIsModalOpen(true);
//   };

//   // Handle appointment deletion
//   const handleDelete = async () => {
//     try {
//       await deleteAppointment(selectedAppointment._id);
//       setAppointments(prev => prev.filter(a => a._id !== selectedAppointment._id));
//       toast.success('Appointment deleted');
//       setIsDeleteModalOpen(false);
//     } catch (error) {
//       toast.error('Failed to delete appointment');
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
//     <div className="container mx-auto px-4 py-6">
//       <div className="flex justify-between items-center mb-6">
//         <Typography variant="h3" className="font-bold">
//           Appointments
//         </Typography>
//       </div>

//       <Tabs value={activeTab} className="mb-6">
//         <TabsHeader>
//           <Tab value="calendar" onClick={() => setActiveTab('calendar')}>
//             <div className="flex items-center gap-2">
//               <CalendarIcon className="h-5 w-5" />
//               Calendar
//             </div>
//           </Tab>
//           <Tab value="list" onClick={() => setActiveTab('list')}>
//             <div className="flex items-center gap-2">
//               <List className="h-5 w-5" />
//               List View
//             </div>
//           </Tab>
//         </TabsHeader>
//       </Tabs>

//       {activeTab === 'calendar' ? (
//         <AppointmentCalendar
//           appointments={appointments}
//           patients={patients}
//           currentDate={currentDate}
//           onDateChange={setCurrentDate}
//           onCreateAppointment={handleCreateAppointment}
//           onEditAppointment={handleEditAppointment}
//         />
//       ) : (
//         <div className="bg-white rounded-lg shadow overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {appointments.map(appointment => {
//                 const patient = patients.find(p => p._id === appointment.patientId) || {};
//                 return (
//                   <tr key={appointment._id}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center gap-3">
//                         <Avatar src={patient.img} alt={patient.name} size="sm" />
//                         <div>
//                           <Typography variant="small" className="font-semibold">
//                             {patient.firstName} {patient.lastName}
//                           </Typography>
//                           <Typography variant="small" className="text-gray-600">
//                             {patient.email || 'No email'}
//                           </Typography>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {dayjs(appointment.date).format('MMM D, YYYY')}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">{appointment.time}</td>
//                     <td className="px-6 py-4 whitespace-nowrap capitalize">
//                       <Chip
//                         value={appointment.type}
//                         color="blue-gray"
//                         size="sm"
//                         variant="outlined"
//                       />
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <Chip
//                         value={appointment.status}
//                         color={
//                           appointment.status === 'confirmed' ? 'green' :
//                           appointment.status === 'pending' ? 'amber' : 'red'
//                         }
//                         size="sm"
//                       />
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <Button
//                         variant="text"
//                         color="blue"
//                         size="sm"
//                         onClick={() => handleEditAppointment(appointment)}
//                         className="mr-2"
//                       >
//                         Edit
//                       </Button>
//                       <Button
//                         variant="text"
//                         color="red"
//                         size="sm"
//                         onClick={() => {
//                           setSelectedAppointment(appointment);
//                           setIsDeleteModalOpen(true);
//                         }}
//                       >
//                         Delete
//                       </Button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Appointment Form Modal */}
//       <Dialog open={isModalOpen} handler={() => setIsModalOpen(false)} size="lg">
//         <DialogHeader>
//           {selectedAppointment ? 'Edit Appointment' : 'Create New Appointment'}
//         </DialogHeader>
//         <form onSubmit={handleSubmit}>
//           <DialogBody className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Input
//                 type="date"
//                 label="Date"
//                 name="date"
//                 value={formData.date}
//                 onChange={(e) => setFormData({...formData, date: e.target.value})}
//                 required
//               />
//               <Input
//                 type="time"
//                 label="Time"
//                 name="time"
//                 value={formData.time}
//                 onChange={(e) => setFormData({...formData, time: e.target.value})}
//                 required
//               />
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Select
//                 label="Type"
//                 name="type"
//                 value={formData.type}
//                 onChange={(value) => setFormData({...formData, type: value})}
//                 required
//               >
//                 <Option value="consultation">Consultation</Option>
//                 <Option value="vaccination">Vaccination</Option>
//                 <Option value="surgery">Surgery</Option>
//                 <Option value="checkup">Checkup</Option>
//               </Select>
              
//               <Select
//                 label="Status"
//                 name="status"
//                 value={formData.status}
//                 onChange={(value) => setFormData({...formData, status: value})}
//                 required
//               >
//                 <Option value="confirmed">Confirmed</Option>
//                 <Option value="pending">Pending</Option>
//                 <Option value="cancelled">Cancelled</Option>
//               </Select>
//             </div>
            
//             <Select
//               label="Patient"
//               name="patientId"
//               value={formData.patientId}
//               onChange={(value) => setFormData({...formData, patientId: value})}
//               required
//             >
//               {patients.map(patient => (
//                 <Option key={patient._id} value={patient._id}>
//                   {patient.firstName} {patient.lastName}
//                 </Option>
//               ))}
//             </Select>
            
//             <Textarea
//               label="Notes"
//               name="notes"
//               value={formData.notes}
//               onChange={(e) => setFormData({...formData, notes: e.target.value})}
//               rows={3}
//             />
//           </DialogBody>
//           <DialogFooter>
//             <Button
//               variant="text"
//               color="red"
//               onClick={() => setIsModalOpen(false)}
//               className="mr-1"
//             >
//               Cancel
//             </Button>
//             <Button type="submit" color="blue">
//               {selectedAppointment ? 'Update' : 'Create'}
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


// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import {
//   getAppointments,
//   createAppointment,
//   updateAppointment,
//   deleteAppointment,
//   getPatients
// } from "@/data/appointmentsData";
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
//   Typography
// } from "@material-tailwind/react";
// import { Calendar as CalendarIcon, List } from 'lucide-react';
// import dayjs from 'dayjs';
// import AppointmentCalendar from './dashboard/componet/AppointmentCalendar';

// const AppointmentsPage = () => {
//   const [appointments, setAppointments] = useState([]);
//   const [patients, setPatients] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentDate, setCurrentDate] = useState(dayjs());
//   const [activeTab, setActiveTab] = useState('calendar');
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     date: dayjs().format('YYYY-MM-DD'),
//     time: '09:00',
//     type: 'consultation',
//     status: 'confirmed',
//     patientId: '',
//     notes: ''
//   });

//   // Fetch data
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const [appts, pts] = await Promise.all([
//           getAppointments(),
//           getPatients()
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

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (selectedAppointment) {
//         const updated = await updateAppointment(selectedAppointment._id, formData);
//         setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
//         toast.success('Appointment updated');
//       } else {
//         const created = await createAppointment(formData);
//         setAppointments(prev => [...prev, created]);
//         toast.success('Appointment created');
//       }
//       setIsModalOpen(false);
//     } catch (error) {
//       toast.error(`Failed to ${selectedAppointment ? 'update' : 'create'} appointment`);
//     }
//   };

//   // Handle appointment creation from calendar
//   const handleCreateAppointment = (date, time) => {
//     setSelectedAppointment(null);
//     setFormData({
//       date: date.format('YYYY-MM-DD'),
//       time,
//       type: 'consultation',
//       status: 'confirmed',
//       patientId: '',
//       notes: ''
//     });
//     setIsModalOpen(true);
//   };

//   // Handle appointment edit from calendar
//   const handleEditAppointment = (appointment) => {
//     setSelectedAppointment(appointment);
//     setFormData({
//       date: appointment.date,
//       time: appointment.time,
//       type: appointment.type,
//       status: appointment.status,
//       patientId: appointment.patientId?._id || '',
//       notes: appointment.notes
//     });
//     setIsModalOpen(true);
//   };

//   // Handle appointment deletion
//   const handleDelete = async () => {
//     try {
//       await deleteAppointment(selectedAppointment._id);
//       setAppointments(prev => prev.filter(a => a._id !== selectedAppointment._id));
//       toast.success('Appointment deleted');
//       setIsDeleteModalOpen(false);
//     } catch (error) {
//       toast.error('Failed to delete appointment');
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
//     <div className=" mx-auto px-4 py-6">
//       <div className="flex justify-between items-center mb-6">
//         <Typography variant="h3" className="font-bold">
//           Appointments
//         </Typography>
//       </div>

//       <Tabs value={activeTab} className="mb-6">
//         <TabsHeader>
//           <Tab value="calendar" onClick={() => setActiveTab('calendar')}>
//             <div className="flex items-center gap-2">
//               <CalendarIcon className="h-5 w-5" />
//               Calendar
//             </div>
//           </Tab>
//           <Tab value="list" onClick={() => setActiveTab('list')}>
//             <div className="flex items-center gap-2">
//               <List className="h-5 w-5" />
//               List View
//             </div>
//           </Tab>
//         </TabsHeader>
//       </Tabs>

//       {activeTab === 'calendar' ? (
//         <AppointmentCalendar
//           appointments={appointments}
//           currentDate={currentDate}
//           onDateChange={setCurrentDate}
//           onCreateAppointment={handleCreateAppointment}
//           onEditAppointment={handleEditAppointment}
//         />
//       ) : (
//         <div className="bg-white rounded-lg shadow overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {appointments.map(appointment => (
//                 <tr key={appointment._id}>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {dayjs(appointment.date).format('MMM D, YYYY')}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">{appointment.time}</td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {appointment.patientId?.firstName} {appointment.patientId?.lastName}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap capitalize">
//                     <Chip
//                       value={appointment.type}
//                       color="blue-gray"
//                       size="sm"
//                       variant="outlined"
//                     />
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <Chip
//                       value={appointment.status}
//                       color={
//                         appointment.status === 'confirmed' ? 'green' :
//                         appointment.status === 'pending' ? 'amber' : 'red'
//                       }
//                       size="sm"
//                     />
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <Button
//                       variant="text"
//                       color="blue"
//                       size="sm"
//                       onClick={() => handleEditAppointment(appointment)}
//                       className="mr-2"
//                     >
//                       Edit
//                     </Button>
//                     <Button
//                       variant="text"
//                       color="red"
//                       size="sm"
//                       onClick={() => {
//                         setSelectedAppointment(appointment);
//                         setIsDeleteModalOpen(true);
//                       }}
//                     >
//                       Delete
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Appointment Form Modal */}
//       <Dialog open={isModalOpen} handler={() => setIsModalOpen(false)} size="lg">
//         <DialogHeader>
//           {selectedAppointment ? 'Edit Appointment' : 'Create New Appointment'}
//         </DialogHeader>
//         <form onSubmit={handleSubmit}>
//           <DialogBody className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Input
//                 type="date"
//                 label="Date"
//                 name="date"
//                 value={formData.date}
//                 onChange={(e) => setFormData({...formData, date: e.target.value})}
//                 required
//               />
//               <Input
//                 type="time"
//                 label="Time"
//                 name="time"
//                 value={formData.time}
//                 onChange={(e) => setFormData({...formData, time: e.target.value})}
//                 required
//               />
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <Select
//                 label="Type"
//                 name="type"
//                 value={formData.type}
//                 onChange={(value) => setFormData({...formData, type: value})}
//                 required
//               >
//                 <Option value="consultation">Consultation</Option>
//                 <Option value="vaccination">Vaccination</Option>
//                 <Option value="surgery">Surgery</Option>
//                 <Option value="checkup">Checkup</Option>
//               </Select>
              
//               <Select
//                 label="Status"
//                 name="status"
//                 value={formData.status}
//                 onChange={(value) => setFormData({...formData, status: value})}
//                 required
//               >
//                 <Option value="confirmed">Confirmed</Option>
//                 <Option value="pending">Pending</Option>
//                 <Option value="cancelled">Cancelled</Option>
//               </Select>
//             </div>
            
//             <Select
//               label="Patient"
//               name="patientId"
//               value={formData.patientId}
//               onChange={(value) => setFormData({...formData, patientId: value})}
//               required
//             >
//               <Option value="">Select Patient</Option>
//               {patients.map(patient => (
//                 <Option key={patient._id} value={patient._id}>
//                   {patient.firstName} {patient.lastName}
//                 </Option>
//               ))}
//             </Select>
            
//             <Textarea
//               label="Notes"
//               name="notes"
//               value={formData.notes}
//               onChange={(e) => setFormData({...formData, notes: e.target.value})}
//             />
//           </DialogBody>
//           <DialogFooter>
//             <Button
//               variant="text"
//               color="red"
//               onClick={() => setIsModalOpen(false)}
//               className="mr-1"
//             >
//               Cancel
//             </Button>
//             <Button type="submit" color="blue">
//               {selectedAppointment ? 'Update' : 'Create'}
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


// import React, { useState, useEffect } from 'react';
// import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

// const AppointmentCalendar = ({ appointments = [], onCreateAppointment, onEditAppointment }) => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [view, setView] = useState('week'); // 'week' or 'day'

//   // Sample appointments data - replace with your actual data
//   const sampleAppointments = [
//     {
//       id: 1,
//       patientName: "John Doe",
//       date: "2025-06-23",
//       time: "09:00",
//       duration: 30,
//       type: "consultation",
//       status: "confirmed",
//       notes: "Regular checkup"
//     },
//     {
//       id: 2,
//       patientName: "Jane Smith",
//       date: "2025-06-23",
//       time: "10:30",
//       duration: 45,
//       type: "vaccination",
//       status: "confirmed",
//       notes: "COVID vaccine"
//     },
//     {
//       id: 3,
//       patientName: "Bob Johnson",
//       date: "2025-06-24",
//       time: "14:00",
//       duration: 30,
//       type: "consultation",
//       status: "pending",
//       notes: "Follow-up visit"
//     },
//     {
//       id: 4,
//       patientName: "Alice Brown",
//       date: "2025-06-25",
//       time: "11:00",
//       duration: 60,
//       type: "surgery",
//       status: "confirmed",
//       notes: "Minor procedure"
//     },
//     {
//       id: 5,
//       patientName: "Jour de l'an hégire",
//       date: "2025-06-27",
//       time: "09:00",
//       duration: 120,
//       type: "holiday",
//       status: "confirmed",
//       notes: "Holiday event"
//     }
//   ];

//   const appointmentsData = appointments.length > 0 ? appointments : sampleAppointments;

//   // Time slots from 1 AM to 5 PM
//   const timeSlots = [];
//   for (let hour = 1; hour <= 17; hour++) {
//     timeSlots.push(`${hour}:00`);
//   }

//   // Get start of week (Sunday)
//   const getWeekStart = (date) => {
//     const d = new Date(date);
//     const day = d.getDay();
//     const diff = d.getDate() - day;
//     return new Date(d.setDate(diff));
//   };

//   // Get days of the week
//   const getWeekDays = () => {
//     const weekStart = getWeekStart(currentDate);
//     const days = [];
//     for (let i = 0; i < 7; i++) {
//       const day = new Date(weekStart);
//       day.setDate(weekStart.getDate() + i);
//       days.push(day);
//     }
//     return days;
//   };

//   // Format date for display
//   const formatDate = (date) => {
//     return date.toLocaleDateString('fr-FR', { 
//       weekday: 'short', 
//       day: 'numeric',
//       month: 'short'
//     }).toUpperCase();
//   };

//   // Get appointments for a specific date
//   const getAppointmentsForDate = (date) => {
//     const dateStr = date.toISOString().split('T')[0];
//     return appointmentsData.filter(apt => apt.date === dateStr);
//   };

//   // Convert time to minutes for positioning
//   const timeToMinutes = (timeStr) => {
//     const [hours, minutes] = timeStr.split(':').map(Number);
//     return hours * 60 + minutes;
//   };

//   // Get appointment style based on type
//   const getAppointmentStyle = (appointment) => {
//     const styles = {
//       consultation: 'bg-blue-100 border-l-4 border-blue-500 text-blue-800',
//       vaccination: 'bg-green-100 border-l-4 border-green-500 text-green-800',
//       surgery: 'bg-red-100 border-l-4 border-red-500 text-red-800',
//       holiday: 'bg-purple-100 border-l-4 border-purple-500 text-purple-800',
//       default: 'bg-gray-100 border-l-4 border-gray-500 text-gray-800'
//     };
//     return styles[appointment.type] || styles.default;
//   };

//   // Calculate position and height for appointment
//   const getAppointmentPosition = (appointment) => {
//     const startMinutes = timeToMinutes(appointment.time);
//     const startHour = Math.floor(startMinutes / 60);
    
//     // Position relative to 1 AM (start of our display)
//     const topPercent = ((startHour - 1) * 60 + (startMinutes % 60)) / (16 * 60) * 100;
//     const heightPercent = (appointment.duration || 30) / (16 * 60) * 100;
    
//     return {
//       top: `${topPercent}%`,
//       height: `${heightPercent}%`,
//       minHeight: '20px'
//     };
//   };

//   const navigateWeek = (direction) => {
//     const newDate = new Date(currentDate);
//     newDate.setDate(currentDate.getDate() + (direction * 7));
//     setCurrentDate(newDate);
//   };

//   const weekDays = getWeekDays();

//   return (
//     <div className="bg-white rounded-lg shadow-lg">
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 border-b">
//         <div className="flex items-center gap-4">
//           <h2 className="text-xl font-semibold">Agenda</h2>
//           <button
//             onClick={() => setCurrentDate(new Date())}
//             className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             Aujourd'hui
//           </button>
//         </div>
        
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => navigateWeek(-1)}
//             className="p-2 hover:bg-gray-100 rounded"
//           >
//             <ChevronLeft size={20} />
//           </button>
//           <span className="font-medium min-w-[120px] text-center">
//             {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
//           </span>
//           <button
//             onClick={() => navigateWeek(1)}
//             className="p-2 hover:bg-gray-100 rounded"
//           >
//             <ChevronRight size={20} />
//           </button>
//         </div>

//         <button
//           onClick={onCreateAppointment}
//           className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           <Plus size={16} />
//           Créer
//         </button>
//       </div>

//       {/* Calendar Grid */}
//       <div className="flex">
//         {/* Time column */}
//         <div className="w-16 border-r">
//           <div className="h-12 border-b"></div> {/* Header space */}
//           {timeSlots.map((time) => (
//             <div key={time} className="h-16 border-b border-gray-200 flex items-start justify-end pr-2 pt-1">
//               <span className="text-xs text-gray-500">{time}</span>
//             </div>
//           ))}
//         </div>

//         {/* Days columns */}
//         <div className="flex-1 grid grid-cols-7">
//           {weekDays.map((day, index) => {
//             const dayAppointments = getAppointmentsForDate(day);
//             const isToday = day.toDateString() === new Date().toDateString();
            
//             return (
//               <div key={index} className="border-r border-gray-200 relative">
//                 {/* Day header */}
//                 <div className={`h-12 border-b border-gray-200 flex flex-col items-center justify-center ${
//                   isToday ? 'bg-blue-50' : ''
//                 }`}>
//                   <div className="text-xs text-gray-600 font-medium">
//                     {formatDate(day).split(' ')[0]}
//                   </div>
//                   <div className={`text-lg font-semibold ${
//                     isToday ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center' : 'text-gray-900'
//                   }`}>
//                     {day.getDate()}
//                   </div>
//                 </div>

//                 {/* Time slots */}
//                 <div className="relative" style={{ height: `${timeSlots.length * 64}px` }}>
//                   {timeSlots.map((time, timeIndex) => (
//                     <div
//                       key={time}
//                       className="h-16 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
//                       onClick={() => onCreateAppointment && onCreateAppointment(day, time)}
//                     />
//                   ))}

//                   {/* Appointments */}
//                   {dayAppointments.map((appointment) => (
//                     <div
//                       key={appointment.id}
//                       className={`absolute left-1 right-1 p-1 rounded text-xs cursor-pointer hover:shadow-md transition-shadow ${getAppointmentStyle(appointment)}`}
//                       style={getAppointmentPosition(appointment)}
//                       onClick={() => onEditAppointment && onEditAppointment(appointment)}
//                     >
//                       <div className="font-medium truncate">
//                         {appointment.patientName}
//                       </div>
//                       <div className="text-xs opacity-75 truncate">
//                         {appointment.time} • {appointment.notes}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Example usage component
// const AppointmentCalendarDemo = () => {
//   const handleCreateAppointment = (date, time) => {
//     console.log('Create appointment for:', date, 'at', time);
//     // Here you would open your appointment creation modal
//   };

//   const handleEditAppointment = (appointment) => {
//     console.log('Edit appointment:', appointment);
//     // Here you would open your appointment edit modal
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <AppointmentCalendar
//         onCreateAppointment={handleCreateAppointment}
//         onEditAppointment={handleEditAppointment}
//       />
//     </div>
//   );
// };

// export default AppointmentCalendarDemo;