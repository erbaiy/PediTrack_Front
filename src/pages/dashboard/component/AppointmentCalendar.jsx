import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr'; // Import français pour dayjs
import {
  Button,
  Typography,
  Card,
  CardHeader,
  CardBody,
  Chip,
  IconButton,
  Avatar
} from "@material-tailwind/react";

// Configuration de dayjs en français
dayjs.locale('fr');

const AppointmentCalendar = ({ 
  appointments = [], 
  patients = [],
  currentDate,
  onDateChange,
  onTimeSelect,
  onEditAppointment
}) => {

  console.log("data passed to child component", appointments, );

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h à 19h

  const getWeekDays = () => {
    const startOfWeek = dayjs(currentDate).startOf('week');
    return Array.from({ length: 7 }).map((_, i) => startOfWeek.add(i, 'day'));
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return appointments.filter(apt => 
      dayjs(apt.date).format('YYYY-MM-DD') === dateStr
    );
  };

  const getPatientInfo = (patientId) => {
    return patients.find(p => p.patientId === patientId) || {
      firstName: 'Patient',
      lastName: 'Inconnu',
      img: '/img/team-2.jpeg'
    };
  };

  const getAppointmentStyle = (type) => {
    const styles = {
      consultation: 'bg-blue-100 border-blue-300 text-blue-800',
      vaccination: 'bg-green-100 border-green-300 text-green-800',
      surgery: 'bg-red-100 border-red-300 text-red-800',
      checkup: 'bg-yellow-100 border-yellow-300 text-yellow-800'
    };
    return styles[type] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      cancelled: 'Annulé',
      completed: 'Terminé'
    };
    return statusTexts[status] || status;
  };

  const getTypeText = (type) => {
    const typeTexts = {
      consultation: 'Consultation',
      vaccination: 'Vaccination',
      surgery: 'Chirurgie',
      checkup: 'Contrôle'
    };
    return typeTexts[type] || type;
  };

  const calculateAppointmentPosition = (appointment) => {
    const [hours, minutes] = appointment.time.split(':').map(Number);
    const top = ((hours - 8) * 64) + (minutes / 60 * 64);
    const duration = appointment.duration || 60; // Par défaut 60 minutes
    
    return {
      top: `${top}px`,
      height: `${duration / 60 * 64}px`
    };
  };

  return (
    <Card className="shadow-none border rounded-lg">
      <CardHeader floated={false} shadow={false} className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Typography variant="h5" className="font-medium">
              {dayjs(currentDate).format('MMMM YYYY')}
            </Typography>
            
            <div className="flex items-center gap-2">
              <IconButton
                variant="text"
                size="sm"
                onClick={() => onDateChange(dayjs(currentDate).subtract(1, 'week'))}
              >
                <ChevronLeft className="h-5 w-5" />
              </IconButton>
              
              <Button
                variant="text"
                size="sm"
                className="px-3 py-1 text-sm"
                onClick={() => onDateChange(dayjs())}
              >
                Aujourd'hui
              </Button>
              
              <IconButton
                variant="text"
                size="sm"
                onClick={() => onDateChange(dayjs(currentDate).add(1, 'week'))}
              >
                <ChevronRight className="h-5 w-5" />
              </IconButton>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="p-0 overflow-auto">
        <div className="flex min-w-max">
          {/* Colonne des heures */}
          <div className="w-16 border-r">
            <div className="h-16 border-b"></div>
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b relative">
                <Typography 
                  variant="small" 
                  color="gray" 
                  className="absolute -top-2.5 right-2 text-xs"
                >
                  {hour === 12 ? '12h' : `${hour}h`}
                </Typography>
              </div>
            ))}
          </div>
          
          {/* Colonnes des jours */}
          {getWeekDays().map(day => {
            const isToday = day.isSame(dayjs(), 'day');
            const dayAppointments = getAppointmentsForDate(day);
            
            return (
              <div 
                key={day.format('DD-MM-YYYY')} 
                className={`flex-1 min-w-[180px] border-r ${isToday ? 'bg-blue-50' : ''}`}
              >
                {/* En-tête du jour */}
                <div className={`h-16 border-b flex flex-col items-center justify-center ${
                  isToday ? 'bg-blue-500 text-white' : ''
                }`}>
                  <Typography variant="small" className="font-medium">
                    {day.format('ddd')}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    className={`font-medium ${
                      isToday ? 'text-white' : day.day() === 0 ? 'text-red-500' : ''
                    }`}
                  >
                    {day.format('D')}
                  </Typography>
                </div>
                
                {/* Créneaux horaires et rendez-vous */}
                <div className="relative" style={{ height: `${hours.length * 64}px` }}>
                  {/* Créneaux horaires cliquables */}
                  {hours.map(hour => (
                    <div 
                      key={hour} 
                      className="h-16 border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => onTimeSelect(day, `${hour}:00`)}
                    />
                  ))}
                  
                  {/* Rendez-vous */}
                  {dayAppointments.map(appointment => {
                    const patient = getPatientInfo(appointment.patientId);
                    const position = calculateAppointmentPosition(appointment);
                    
                    return (
                      <div
                        key={appointment._id}
                        className={`absolute left-1 right-1 p-2 rounded border cursor-pointer shadow-sm hover:shadow-md transition-shadow ${getAppointmentStyle(appointment.type)}`}
                        style={position}
                        onClick={() => onEditAppointment(appointment)}
                      >
                        <div className="flex items-start gap-2 h-full">
                          <Avatar 
                            src={patient.img} 
                            alt={patient.name} 
                            size="sm"
                            className="mt-1"
                          />
                          <div className="flex-1 overflow-hidden">
                            <Typography variant="small" className="font-semibold truncate">
                              {patient.firstName} {patient.lastName}
                            </Typography>
                            <Typography variant="small" className="text-xs truncate">
                              {appointment.time} • {getTypeText(appointment.type)}
                            </Typography>
                            {appointment.status && (
                              <Chip
                                value={getStatusText(appointment.status)}
                                color={
                                  appointment.status === 'confirmed' ? 'green' :
                                  appointment.status === 'pending' ? 'amber' : 'red'
                                }
                                size="sm"
                                className="mt-1"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default AppointmentCalendar;





// import React from 'react';
// import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
// import dayjs from 'dayjs';
// import {
//   Button,
//   Typography,
//   Card,
//   CardHeader,
//   CardBody,
//   Chip,
//   IconButton,
//   Avatar
// } from "@material-tailwind/react";

// const AppointmentCalendar = ({ 
//   appointments = [], 
//   patients = [],
//   currentDate,
//   onDateChange,
//   onTimeSelect,
//   onEditAppointment
// }) => {



//   console.log("data passed to child component", appointments, );

//   const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM

//   const getWeekDays = () => {
//     const startOfWeek = dayjs(currentDate).startOf('week');
//     return Array.from({ length: 7 }).map((_, i) => startOfWeek.add(i, 'day'));
//   };

//   const getAppointmentsForDate = (date) => {
//     const dateStr = date.format('YYYY-MM-DD');
//     return appointments.filter(apt => 
//       dayjs(apt.date).format('YYYY-MM-DD') === dateStr
//     );
//   };

//   const getPatientInfo = (patientId) => {
//     return patients.find(p => p.patientId === patientId) || {
//       firstName: 'Unknown',
//       lastName: 'Patient',
//       img: '/img/team-2.jpeg'
//     };
//   };

//   const getAppointmentStyle = (type) => {
//     const styles = {
//       consultation: 'bg-blue-100 border-blue-300 text-blue-800',
//       vaccination: 'bg-green-100 border-green-300 text-green-800',
//       surgery: 'bg-red-100 border-red-300 text-red-800',
//       checkup: 'bg-yellow-100 border-yellow-300 text-yellow-800'
//     };
//     return styles[type] || 'bg-gray-100 border-gray-300 text-gray-800';
//   };

//   const calculateAppointmentPosition = (appointment) => {
//     const [hours, minutes] = appointment.time.split(':').map(Number);
//     const top = ((hours - 8) * 64) + (minutes / 60 * 64);
//     const duration = appointment.duration || 60; // Default to 60 minutes
    
//     return {
//       top: `${top}px`,
//       height: `${duration / 60 * 64}px`
//     };
//   };

//   return (
//     <Card className="shadow-none border rounded-lg">
//       <CardHeader floated={false} shadow={false} className="p-4 border-b">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//           <div className="flex items-center gap-4">
//             <Typography variant="h5" className="font-medium">
//               {dayjs(currentDate).format('MMMM YYYY')}
//             </Typography>
            
//             <div className="flex items-center gap-2">
//               <IconButton
//                 variant="text"
//                 size="sm"
//                 onClick={() => onDateChange(dayjs(currentDate).subtract(1, 'week'))}
//               >
//                 <ChevronLeft className="h-5 w-5" />
//               </IconButton>
              
//               <Button
//                 variant="text"
//                 size="sm"
//                 className="px-3 py-1 text-sm"
//                 onClick={() => onDateChange(dayjs())}
//               >
//                 Today
//               </Button>
              
//               <IconButton
//                 variant="text"
//                 size="sm"
//                 onClick={() => onDateChange(dayjs(currentDate).add(1, 'week'))}
//               >
//                 <ChevronRight className="h-5 w-5" />
//               </IconButton>
//             </div>
//           </div>
//         </div>
//       </CardHeader>
      
//       <CardBody className="p-0 overflow-auto">
//         <div className="flex min-w-max">
//           {/* Time column */}
//           <div className="w-16 border-r">
//             <div className="h-16 border-b"></div>
//             {hours.map(hour => (
//               <div key={hour} className="h-16 border-b relative">
//                 <Typography 
//                   variant="small" 
//                   color="gray" 
//                   className="absolute -top-2.5 right-2 text-xs"
//                 >
//                   {hour === 12 ? '12 PM' : `${hour % 12} ${hour < 12 ? 'AM' : 'PM'}`}
//                 </Typography>
//               </div>
//             ))}
//           </div>
          
//           {/* Day columns */}
//           {getWeekDays().map(day => {
//             const isToday = day.isSame(dayjs(), 'day');
//             const dayAppointments = getAppointmentsForDate(day);
            
//             return (
//               <div 
//                 key={day.format('DD-MM-YYYY')} 
//                 className={`flex-1 min-w-[180px] border-r ${isToday ? 'bg-blue-50' : ''}`}
//               >
//                 {/* Day header */}
//                 <div className={`h-16 border-b flex flex-col items-center justify-center ${
//                   isToday ? 'bg-blue-500 text-white' : ''
//                 }`}>
//                   <Typography variant="small" className="font-medium">
//                     {day.format('ddd')}
//                   </Typography>
//                   <Typography 
//                     variant="h6" 
//                     className={`font-medium ${
//                       isToday ? 'text-white' : day.day() === 0 ? 'text-red-500' : ''
//                     }`}
//                   >
//                     {day.format('D')}
//                   </Typography>
//                 </div>
                
//                 {/* Time slots and appointments */}
//                 <div className="relative" style={{ height: `${hours.length * 64}px` }}>
//                   {/* Clickable time slots */}
//                   {hours.map(hour => (
//                     <div 
//                       key={hour} 
//                       className="h-16 border-b hover:bg-gray-50 cursor-pointer"
//                       onClick={() => onTimeSelect(day, `${hour}:00`)}
//                     />
//                   ))}
                  
//                   {/* Appointments */}
//                   {dayAppointments.map(appointment => {
//                     const patient = getPatientInfo(appointment.patientId);
//                     const position = calculateAppointmentPosition(appointment);
                    
//                     return (
//                       <div
//                         key={appointment._id}
//                         className={`absolute left-1 right-1 p-2 rounded border cursor-pointer shadow-sm hover:shadow-md transition-shadow ${getAppointmentStyle(appointment.type)}`}
//                         style={position}
//                         onClick={() => onEditAppointment(appointment)}
//                       >
//                         <div className="flex items-start gap-2 h-full">
//                           <Avatar 
//                             src={patient.img} 
//                             alt={patient.name} 
//                             size="sm"
//                             className="mt-1"
//                           />
//                           <div className="flex-1 overflow-hidden">
//                             <Typography variant="small" className="font-semibold truncate">
//                               {patient.firstName} {patient.lastName}
//                             </Typography>
//                             <Typography variant="small" className="text-xs truncate">
//                               {appointment.time} • {appointment.type}
//                             </Typography>
//                             {appointment.status && (
//                               <Chip
//                                 value={appointment.status}
//                                 color={
//                                   appointment.status === 'confirmed' ? 'green' :
//                                   appointment.status === 'pending' ? 'amber' : 'red'
//                                 }
//                                 size="sm"
//                                 className="mt-1 capitalize"
//                               />
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </CardBody>
//     </Card>
//   );
// };

// export default AppointmentCalendar;

