    import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Avatar,
  Chip,
  IconButton
} from "@material-tailwind/react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import dayjs from 'dayjs';

const AppointmentList = ({ 
  appointments = [], 
  patients = [], 
  onEditAppointment, 
  onDeleteAppointment 
}) => {
  const getPatientInfo = (patientId) => {
    return patients.find(p => p.patientId === patientId) || {
      firstName: 'Unknown',
      lastName: 'Patient',
      img: '/img/team-2.jpeg'
    };
  };

  const getAppointmentColor = (type) => {
    const colors = {
      consultation: 'blue',
      vaccination: 'green',
      surgery: 'red',
      checkup: 'yellow'
    };
    return colors[type] || 'gray';
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateCompare = dayjs(a.date).diff(dayjs(b.date));
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  return (
    <Card className="shadow-none border rounded-lg">
      <CardHeader floated={false} shadow={false} className="p-4 border-b">
        <Typography variant="h5" className="font-medium">
          Appointments List
        </Typography>
      </CardHeader>
      
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max table-auto">
            <thead>
              <tr>
                <th className="border-b border-blue-gray-50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    Patient
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    Date & Time
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    Type
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    Status
                  </Typography>
                </th>
                <th className="border-b border-blue-gray-50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-bold">
                    Actions
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.map((appointment) => {
                const patient = getPatientInfo(appointment.patientId);
                const color = getAppointmentColor(appointment.type);
                const fullDate = dayjs(`${appointment.date} ${appointment.time}`).format('MMM D, YYYY h:mm A');

                return (
                  <tr key={appointment._id} className="hover:bg-blue-gray-50">
                    <td className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <Avatar src={patient.img} alt={patient.name} size="sm" />
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                      </div>
                    </td>
                    <td className="p-4 border-b">
                      <Typography variant="small" color="blue-gray" className="font-normal">
                        {fullDate}
                      </Typography>
                    </td>
                    <td className="p-4 border-b">
                      <Chip
                        variant="outlined"
                        size="sm"
                        value={appointment.type}
                        color={color}
                        className="capitalize"
                      />
                    </td>
                    <td className="p-4 border-b">
                      <Chip
                        size="sm"
                        value={appointment.status || 'pending'}
                        color={
                          appointment.status === 'confirmed' ? 'green' :
                          appointment.status === 'pending' ? 'amber' : 'red'
                        }
                        className="capitalize"
                      />
                    </td>
                    <td className="p-4 border-b">
                      <div className="flex gap-2">
                        <IconButton
                          variant="text"
                          size="sm"
                          color="blue-gray"
                          onClick={() => onEditAppointment(appointment)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          variant="text"
                          size="sm"
                          color="red"
                          onClick={() => onDeleteAppointment(appointment._id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {appointments.length === 0 && (
            <div className="p-8 text-center">
              <Typography color="gray" className="font-normal">
                No appointments found
              </Typography>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default AppointmentList;