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

import { useEffect, useState } from "react";
import { getPatientTable } from "@/data/patientTable";

export function Patient() {

  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleOpen = (patient) => {
    setSelectedPatient(patient);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPatient(null);
  };


  const [patients, setPatients] = useState([]);

  useEffect(() => {
    getPatientTable().then(setPatients);
  }, []);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
          <Typography variant="h6" color="white">
            Patients Table
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {["patient", "parents", "appointments status", "birthDate", "actions"].map((el) => (
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
              {patients.map(({ img, name, email, job, online, date }, key) => {
                const className = `py-3 px-5 ${key === patients.length - 1 ? "" : "border-b border-blue-gray-50"}`;
                return (
                  <tr key={key}>
                    <td className={className}>
                      <div className="flex items-center gap-4">
                        <Avatar src={img} alt={name} size="sm" variant="rounded" />
                        <div>
                          <Typography variant="small" color="blue-gray" className="font-semibold">
                            {name}
                          </Typography>
                          <Typography className="text-xs font-normal text-blue-gray-500">
                            {email}
                          </Typography>
                        </div>
                      </div>
                    </td>
                    <td className={className}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {job[0]}
                      </Typography>
                      <Typography className="text-xs font-normal text-blue-gray-500">
                        {job[1]}
                      </Typography>
                    </td>
                    <td className={className}>
                      <Chip
                        variant="gradient"
                        color={online ? "green" : "blue-gray"}
                        value={online ? "online" : "offline"}
                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                      />
                      <button
                        onClick={() => handleOpen({ name, email })}
                        className="text-xs font-normal text-blue-gray-500 underline ml-2"
                      >
                        Get Appointment
                      </button>
                    </td>
                    <td className={className}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {date}
                      </Typography>
                    </td>
                    <td className={className}>
                      <Typography as="a" href="#" className="text-xs font-semibold text-blue-gray-600">
                        Edit
                      </Typography>
                      <Typography as="a" href="#" className="text-xs font-semibold text-blue-gray-600 ml-2">
                        Delete
                      </Typography>
                      <Typography as="a" href="#" className="text-xs font-semibold text-blue-gray-600 ml-2">
                        View
                      </Typography>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Fullscreen Appointment Modal */}
      <Dialog open={open} handler={handleClose} size="xl" className="h-screen overflow-auto">
        <DialogHeader>Book Appointment</DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          {selectedPatient && (
            <>
              <Typography variant="h6">Patient: {selectedPatient.name}</Typography>
              <Input label="Doctor" />
              <Input label="Date" type="date" />
              <Input label="Time" type="time" />
              <Textarea label="Reason for Visit" />
            </>
          )}
        </DialogBody>
        <DialogFooter className="flex justify-between">
          <Button variant="outlined" color="red" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="gradient" color="green" onClick={() => alert("Appointment Saved")}>
            Save Appointment
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );




}




export default Patient;
