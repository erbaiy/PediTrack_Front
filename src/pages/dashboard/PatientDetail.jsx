// PatientDetail.jsx
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
  Alert,
  Textarea
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
  DocumentTextIcon,
  ClockIcon
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
  ReferenceLine,
  Label
} from 'recharts';
import Calendar from 'react-calendar';
import { getLogo } from '@/data/sitting';
import BMICategoryEditor from './componet/BMICategoryEditor';

const convertImageToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = reject;
    img.src = url;
  });
};

// Constantes traduites
const STATUS_COLORS = {
  done: "green",
  pending: "orange",
  overdue: "red",
  default: "blue-gray"
};

const VACCINE_SCHEDULES = {
  "hepatitis b": { interval: 1, unit: "mois" },
  "dtap": { interval: 2, unit: "mois" },
  "mmr": { interval: 1, unit: "années" },
  default: { interval: 6, unit: "mois" }
};

const BMI_CATEGORIES = [
  { name: "Insuffisance pondérale", range: "< 18.5", color: "red" },
  { name: "Poids normal", range: "18.5 - 24.9", color: "green" },
  { name: "Surpoids", range: "25 - 29.9", color: "orange" },
  { name: "Obésité", range: "≥ 30", color: "red" }
];

const PRESCRIPTION_STATUS = {
  active: "Active",
  completed: "Terminé",
  cancelled: "Annulé"
};

const COMMON_MEDICATIONS = [
  "Amoxicilline",
  "Azithromycine",
  "Ibuprofène",
  "Paracétamol",
  "Salbutamol",
  "Cétirizine",
  "Loratadine",
  "Oméprazole",
  "Prednisone",
  "Dextrométhorphane"
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

// Fonctions utilitaires
const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.default;

const formatDate = (dateString) => {
  if (!dateString) return "Non administré";
  return new Date(dateString).toLocaleDateString("fr-FR", {
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
  
  if (schedule.unit === "années") {
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
  if (bmi < 18.5) return "Insuffisance pondérale";
  if (bmi >= 18.5 && bmi < 25) return "Poids normal";
  if (bmi >= 25 && bmi < 30) return "Surpoids";
  return "Obésité";
};

const getBMICategoryColor = (category) => {
  switch (category) {
    case "Poids normal": return "#4caf50";
    case "Insuffisance pondérale": return "#ff9800";
    case "Surpoids": return "#f44336";
    case "Obésité": return "#d32f2f";
    default: return "#9e9e9e";
  }
};

// Composants d'aide traduits
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
        État des vaccinations
      </Typography>
      <Button variant="gradient" size="sm" onClick={handleOpenCreate}>
        <PlusIcon className="h-4 w-4 mr-1" />
        Ajouter une vaccination
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

const GrowthCharts = ({ records, patientAge }) => {
  const chartData = useMemo(() => {
    return records
      .map(record => ({
        date: new Date(record.date).toLocaleDateString('fr-FR', {
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
      <div className="bg-white p-4 rounded-xl border border-blue-gray-50">
        <Typography variant="h5" color="blue-gray" className="mb-4">
          Évolution taille et poids
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
                  name === 'height' ? 'Taille' : 'Poids'
                ]}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="height"
                stroke="#8884d8"
                name="Taille"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="weight"
                stroke="#82ca9d"
                name="Poids"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-blue-gray-50">
        <Typography variant="h5" color="blue-gray" className="mb-4">
          Évolution IMC
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
              <Tooltip formatter={(value) => [`${value}`, 'IMC']} />
              <Area
                type="monotone"
                dataKey="bmi"
                stroke={bmiColor}
                fillOpacity={1}
                fill="url(#bmiColor)"
                name="IMC"
                strokeWidth={2}
              />
              {patientAge >= 2 && (
                <>
                  <ReferenceLine y={18.5} stroke="#f57c00" strokeDasharray="3 3">
                    <Label value="Insuffisance" position="insideTopRight" />
                  </ReferenceLine>
                  <ReferenceLine y={25} stroke="#388e3c" strokeDasharray="3 3">
                    <Label value="Normal" position="insideTopRight" />
                  </ReferenceLine>
                  <ReferenceLine y={30} stroke="#d32f2f" strokeDasharray="3 3">
                    <Label value="Surpoids" position="insideTopRight" />
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

const FilterControls = ({ filters, updateFilter, toggleSortDirection }) => (
  <div className="flex gap-2 mb-4">
    <Select
      label="Filtrer par statut"
      value={filters.status}
      onChange={(val) => updateFilter('status', val)}
      size="sm"
    >
      <Option value="all">Tous</Option>
      <Option value="pending">En attente</Option>
      <Option value="done">Complété</Option>
      <Option value="overdue">En retard</Option>
    </Select>
    
    <div className="flex items-center">
      <Select
        label="Trier par"
        value={filters.sortField}
        onChange={(val) => updateFilter('sortField', val)}
        size="sm"
      >
        <Option value="dueDate">Date d'échéance</Option>
        <Option value="vaccine">Nom du vaccin</Option>
        <Option value="status">Statut</Option>
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
            Voir les détails
          </MenuItem>
          <MenuItem onClick={() => onEdit(vaccination)}>
            Modifier
          </MenuItem>
          <MenuItem onClick={() => onScheduleNext(vaccination)}>
            Planifier la prochaine
          </MenuItem>
          <MenuItem onClick={() => onExportPDF(vaccination)}>
            <div className="flex items-center">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Exporter PDF
            </div>
          </MenuItem>
          <MenuItem 
            onClick={() => onDelete(vaccination)}
            className="text-red-500"
          >
            Supprimer
          </MenuItem>
        </MenuList>
      </Menu>
    </div>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography className="text-sm font-normal text-blue-gray-500">
            Date d'échéance: {formatDate(vaccination.dueDate)}
          </Typography>
          <Typography className="text-sm font-normal text-blue-gray-500">
            {vaccination.dateAdministered 
              ? `Administré: ${formatDate(vaccination.dateAdministered)}`
              : "En attente d'administration"
            }
          </Typography>
        </div>
        <Chip
          value={vaccination.status === "done" ? "Complété" : vaccination.status === "pending" ? "En attente" : "En retard"}
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
        Informations du patient
      </Typography>
    </div>
    <Typography variant="small" className="mb-4 font-normal text-blue-gray-500">
      Dossiers médicaux et informations de contact pour {patientData.name}. Profil complet avec contacts d'urgence et antécédents médicaux.
    </Typography>
    
    <div className="space-y-4">
      {Object.entries({
        "nom complet": patientData.name,
        mobile: patientData.phoneNumber,
        email: patientData.email,
        adresse: patientData.address,
        "contact d'urgence": patientData.emergencyContact,
        allergies: patientData.allergies,
        "conditions chroniques": patientData.chronicConditions,
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
      Activités récentes
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
          Aucune activité récente
        </Typography>
      )}
    </ul>
  </div>
);

const VaccinationRecordsGrid = ({ filteredVaccinations, handleOpenCreate, handleOpenView }) => (
  <div className="px-4 pb-4">
    <div className="flex items-center justify-between mb-2">
      <Typography variant="h6" color="blue-gray">
        Carnet de vaccination
      </Typography>
      <Button variant="text" size="sm" onClick={handleOpenCreate}>
        <PlusIcon className="h-4 w-4 mr-1" />
        Ajouter un enregistrement
      </Button>
    </div>
    <Typography variant="small" className="font-normal text-blue-gray-500">
      Historique complet des vaccinations et calendrier à venir
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
              {vaccination.status === "done" ? "Complété" : "En attente"}
            </Typography>
            <Typography variant="h5" color="blue-gray" className="mt-1 mb-2">
              {vaccination.vaccine}
            </Typography>
            <Typography variant="small" className="font-normal text-blue-gray-500">
              Échéance: {formatDate(vaccination.dueDate)}
            </Typography>
          </CardBody>
          <CardFooter className="mt-6 flex items-center justify-between py-0 px-1">
            <Button 
              variant="outlined" 
              size="sm"
              onClick={() => handleOpenView(vaccination)}
            >
              Voir détails
            </Button>
            <div className="flex items-center">
              <Chip
                value={vaccination.status === "done" ? "Complété" : vaccination.status === "pending" ? "En attente" : "En retard"}
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
              value={vaccination.status === "done" ? "Complété" : vaccination.status === "pending" ? "En attente" : "En retard"}
              color={getStatusColor(vaccination.status)}
              size="sm"
            />
          </CardHeader>
          <CardBody className="p-4">
            <div className="space-y-3">
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Date d'échéance
                </Typography>
                <Typography>{formatDate(vaccination.dueDate)}</Typography>
              </div>
              
              {vaccination.dateAdministered && (
                <div>
                  <Typography variant="small" className="font-semibold text-blue-gray-500">
                    Administré
                  </Typography>
                  <Typography>{formatDate(vaccination.dateAdministered)}</Typography>
                </div>
              )}
              
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Statut
                </Typography>
                <Typography className="capitalize">
                  {vaccination.status === "done" ? "Complété" : vaccination.status === "pending" ? "En attente" : "En retard"}
                </Typography>
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-between p-4">
            <Button variant="outlined" onClick={() => onView(vaccination)}>
              Voir détails
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="text" 
                color="blue"
                onClick={() => onEdit(vaccination)}
              >
                Modifier
              </Button>
              <Button 
                variant="text" 
                color="red"
                onClick={() => onDelete(vaccination)}
              >
                Supprimer
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
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Taille (cm)</Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Poids (kg)</Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">IMC</Typography>
                </th>
                <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
                  <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Catégorie</Typography>
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
{/*     
    <div className="mt-8">
      <Typography variant="h5" color="blue-gray" className="mb-4">
        Catégories IMC
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {BMI_CATEGORIES.map((category, index) => (
          <Card key={index} className="border border-blue-gray-50">
            <CardBody>
              <Typography variant="h6" color={category.color}>
                {category.name}
              </Typography>
              <Typography variant="small" className="text-blue-gray-500">
                IMC {category.range}
              </Typography>
            </CardBody>
          </Card>
        ))}
      </div>
      <Typography variant="small" className="mt-4 text-blue-gray-500 italic">
        Note : Les catégories IMC peuvent varier pour les enfants de moins de 2 ans
      </Typography>
    </div> */}

    <BMICategoryEditor />
  </>
);

const EmptyGrowthState = ({ patientName, onAddRecord }) => (
  <div className="text-center py-12">
    <ChartBarIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
    <Typography variant="h5" color="blue-gray" className="mb-2">
      Aucun enregistrement de croissance
    </Typography>
    <Typography variant="small" className="text-blue-gray-500 mb-6">
      Commencez à suivre la croissance de {patientName} en ajoutant un nouvel enregistrement
    </Typography>
    <Button variant="gradient" onClick={onAddRecord}>
      Ajouter le premier enregistrement
    </Button>
  </div>
);

const PrescriptionCard = ({ prescription, onEdit, onDelete, onView, onExportPDF }) => {
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
              Posologie:
            </Typography>
            <Typography>{prescription.dosage}</Typography>
          </div>
          
          <div className="flex justify-between">
            <Typography variant="small" className="font-semibold text-blue-gray-500">
              Fréquence:
            </Typography>
            <Typography>{prescription.frequency}</Typography>
          </div>
          
          <div className="flex justify-between">
            <Typography variant="small" className="font-semibold text-blue-gray-500">
              Date de début:
            </Typography>
            <Typography>{formatDate(prescription.startDate)}</Typography>
          </div>
          
          {prescription.endDate && (
            <div className="flex justify-between">
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                Date de fin:
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
          Voir
        </Button>
        <Button 
          variant="text" 
          color="green" 
          size="sm" 
          onClick={() => onExportPDF(prescription)}
          className="flex items-center gap-1"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          Exporter PDF
        </Button>
        <Button variant="text" color="blue" size="sm" onClick={onEdit}>
          Modifier
        </Button>
        <Button variant="text" color="red" size="sm" onClick={onDelete}>
          Supprimer
        </Button>
      </CardFooter>
    </Card>
  );
};

const EmptyPrescriptionsState = ({ patientName, onAddPrescription }) => (
  <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
    <DocumentTextIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
    <Typography variant="h5" color="blue-gray" className="mb-2">
      Aucune prescription trouvée
    </Typography>
    <Typography variant="small" className="text-blue-gray-500 mb-6 max-w-md mx-auto">
      {patientName} n'a encore aucune prescription. Ajoutez la première pour commencer.
    </Typography>
    <Button variant="gradient" onClick={onAddPrescription}>
      Ajouter la première prescription
    </Button>
  </div>
);

const DocumentUploadModal = ({ 
  open, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  loading 
}) => (
  <Dialog open={open} handler={onClose}>
    <DialogHeader>Uploader un document</DialogHeader>
    <DialogBody>
      <div className="space-y-4">
        <Input
          label="Titre du document"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
        <div>
          <Typography variant="small" className="mb-2">
            Sélectionner un fichier
          </Typography>
          <input
            type="file"
            onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files[0] }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>  
    </DialogBody>
    <DialogFooter>
      <Button variant="text" onClick={onClose} className="mr-2">
        Annuler
      </Button>
      <Button 
        variant="gradient" 
        color="blue" 
        onClick={onSubmit}
        disabled={loading || !formData.title || !formData.file}
      >
        {loading ? "Téléchargement..." : "Uploader le document"}
      </Button>
    </DialogFooter>
  </Dialog>
);

const DeleteDocumentModal = ({ 
  open, 
  onClose, 
  document, 
  onConfirm, 
  loading 
}) => (
  <Dialog open={open} handler={onClose}>
    <DialogHeader>Supprimer un document</DialogHeader>
    <DialogBody>
      <Typography variant="small" className="text-red-500">
        Êtes-vous sûr de vouloir supprimer le document "{document?.title}" ? 
        Cette action est irréversible.
      </Typography>
    </DialogBody>
    <DialogFooter>
      <Button variant="text" onClick={onClose} className="mr-2">
        Annuler
      </Button>
      <Button 
        variant="gradient" 
        color="red" 
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Suppression..." : "Supprimer le document"}
      </Button>
    </DialogFooter>
  </Dialog>
);

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
      <DialogHeader>{isEdit ? "Modifier la prescription" : "Ajouter une nouvelle prescription"}</DialogHeader>
      <DialogBody divider>
        <div className="grid gap-6">
          <div>
            <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
              Médicament *
            </Typography>
            <Input
              list="medications"
              value={formData.medication}
              onChange={(e) => handleInputChange('medication', e.target.value)}
              label="Nom du médicament"
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
                Posologie *
              </Typography>
              <Input
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', e.target.value)}
                label="ex: 500mg"
              />
            </div>
            
            <div>
              <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
                Fréquence *
              </Typography>
              <Select
                value={formData.frequency}
                onChange={(val) => handleInputChange('frequency', val)}
                label="Sélectionner la fréquence"
              >
                <Option value="Une fois par jour">Une fois par jour</Option>
                <Option value="Deux fois par jour">Deux fois par jour</Option>
                <Option value="Trois fois par jour">Trois fois par jour</Option>
                <Option value="Quatre fois par jour">Quatre fois par jour</Option>
                <Option value="Au besoin">Au besoin</Option>
                <Option value="Autre">Autre</Option>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
                Date de début *
              </Typography>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                label="Date de début"
              />
            </div>
            
            <div>
              <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
                Date de fin (Optionnel)
              </Typography>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                label="Date de fin"
                min={formData.startDate}
              />
            </div>
          </div>
          
          <div>
            <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
              Notes (Optionnel)
            </Typography>
            <Input
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              label="Instructions supplémentaires"
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
          Annuler
        </Button>
        <Button 
          variant="gradient" 
          color="green" 
          onClick={onSubmit}
          disabled={!isValid || loading}
        >
          {loading ? "Enregistrement..." : (isEdit ? "Mettre à jour" : "Ajouter prescription")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

const ViewPrescriptionModal = ({ open, onClose, prescription, onExportPDF }) => {
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
    <Dialog open={open} handler={onClose} size="lg">
      <DialogHeader className="flex justify-between items-center">
        <div>Détails de la prescription</div>
        <Button 
          variant="gradient" 
          color="blue" 
          size="sm"
          onClick={() => onExportPDF(prescription)}
          className="flex items-center gap-1"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          Exporter PDF
        </Button>
      </DialogHeader>
      <DialogBody divider>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Typography variant="h4" color="blue-gray">
                {prescription.medication}
              </Typography>
              <Chip value={status} color={statusColor} size="md" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Posologie:
                </Typography>
                <Typography>{prescription.dosage}</Typography>
              </div>
              
              <div className="flex justify-between">
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Fréquence:
                </Typography>
                <Typography>{prescription.frequency}</Typography>
              </div>
              
              <div className="flex justify-between">
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Date de début:
                </Typography>
                <Typography>{formatDate(prescription.startDate)}</Typography>
              </div>
              
              {prescription.endDate && (
                <div className="flex justify-between">
                  <Typography variant="small" className="font-semibold text-blue-gray-500">
                    Date de fin:
                  </Typography>
                  <Typography>{formatDate(prescription.endDate)}</Typography>
                </div>
              )}
            </div>
          </div>
          
          {prescription.notes && (
            <div className="border-l pl-6">
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Notes supplémentaires
              </Typography>
              <div className="bg-blue-50 p-4 rounded-lg">
                <Typography className="whitespace-pre-line">
                  {prescription.notes}
                </Typography>
              </div>
            </div>
          )}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="gradient" onClick={onClose}>
          Fermer
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

const DeletePrescriptionModal = ({ 
  open, 
  onClose, 
  prescription, 
  onConfirm, 
  loading 
}) => (
  <Dialog open={open} handler={onClose}>
    <DialogHeader>Supprimer la prescription</DialogHeader>
    <DialogBody divider>
      <Typography variant="small" className="text-red-500">
        Êtes-vous sûr de vouloir supprimer la prescription pour {prescription?.medication} ? 
        Cette action est irréversible.
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
        Annuler
      </Button>
      <Button 
        variant="gradient" 
        color="red" 
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Suppression..." : "Supprimer la prescription"}
      </Button>
    </DialogFooter>
  </Dialog>
);

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
          label="Nom du vaccin"
          value={formData.vaccine}
          onChange={(e) => updateField('vaccine', e.target.value)}
          required
        />
        
        <Input
          label="Date d'échéance"
          type="date"
          value={formData.dueDate}
          onChange={(e) => updateField('dueDate', e.target.value)}
          required
        />
        
        <Select
          label="Statut"
          value={formData.status}
          onChange={(val) => updateField('status', val)}
        >
          <Option value="pending">En attente</Option>
          <Option value="done">Administré</Option>
        </Select>
        
        {formData.status === "done" && (
          <Input
            label="Date d'administration"
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
        Annuler
      </Button>
      <Button 
        variant="gradient" 
        color="green" 
        onClick={onSubmit}
        disabled={!isValid || loading}
      >
        {loading ? "Traitement..." : (isEdit ? "Mettre à jour" : "Créer")}
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
      <DialogHeader>Ajouter un enregistrement de croissance</DialogHeader>
      <DialogBody divider>
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Taille (cm)"
              type="number"
              value={formData.height}
              onChange={(e) => updateField('height', e.target.value)}
              required
              min="0"
              step="0.1"
            />
            
            <Input
              label="Poids (kg)"
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
                Calcul IMC
              </Typography>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="small" className="font-semibold text-blue-gray-500">
                    Valeur IMC:
                  </Typography>
                  <Typography variant="lead">
                    {calculatedBMI}
                  </Typography>
                </div>
                <div>
                  <Typography variant="small" className="font-semibold text-blue-gray-500">
                    Catégorie:
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
          Annuler
        </Button>
        <Button 
          variant="gradient" 
          color="green" 
          onClick={onSubmit}
          disabled={!isValid || loading}
        >
          {loading ? "Ajout..." : "Ajouter l'enregistrement"}
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
    <DialogHeader>Détails de la vaccination</DialogHeader>
    <DialogBody divider>
      {vaccination && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <Typography variant="h6" color="blue-gray">
              {vaccination.vaccine}
            </Typography>
            <Chip
              value={vaccination.status === "done" ? "Complété" : vaccination.status === "pending" ? "En attente" : "En retard"}
              color={getStatusColor(vaccination.status)}
              size="md"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                Date d'échéance:
              </Typography>
              <Typography>
                {formatDate(vaccination.dueDate)}
              </Typography>
            </div>
            
            {vaccination.dateAdministered && (
              <div>
                <Typography variant="small" className="font-semibold text-blue-gray-500">
                  Administré:
                </Typography>
                <Typography>
                  {formatDate(vaccination.dateAdministered)}
                </Typography>
              </div>
            )}
            
            <div>
              <Typography variant="small" className="font-semibold text-blue-gray-500">
                Statut:
              </Typography>
              <Typography>
                {vaccination.status === "done" ? "Complété" : vaccination.status === "pending" ? "En attente" : "En retard"}
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
                Planifier la prochaine dose
              </Button>
            </div>
          )}
        </div>
      )}
    </DialogBody>
    <DialogFooter>
      <Button 
        variant="text" 
        color="green" 
        size="sm" 
        onClick={() => onExportPDF(vaccination)}
        className="flex items-center gap-1"
      >
        <DocumentArrowDownIcon className="h-4 w-4" />
        Exporter PDF
      </Button>
      <Button 
        variant="outlined" 
        onClick={onClose}
      >
        Fermer
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
    <DialogHeader>Supprimer l'enregistrement de vaccination</DialogHeader>
    <DialogBody divider>
      <Typography variant="small" className="text-red-500">
        Êtes-vous sûr de vouloir supprimer l'enregistrement pour {vaccination?.vaccine} ? 
        Cette action est irréversible.
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
        Annuler
      </Button>
      <Button 
        variant="gradient" 
        color="red" 
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Suppression..." : "Supprimer"}
      </Button>
    </DialogFooter>
  </Dialog>
);

// Composant principal
export function PatientDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // Gestion des états
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedVaccination, setSelectedVaccination] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [vaccinations, setVaccinations] = useState(state?.vaccinations || []);
  const [growthRecords, setGrowthRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clinicLogo, setClinicLogo] = useState('/img/default-logo.png');

  const doctorLogo = async () => {
    try {
      const response = await getLogo();
      setClinicLogo(`http://localhost:3005/${response.logo}`);
    } catch (error) {
      console.error('Erreur lors de la récupération du logo:', error);
      setClinicLogo('/img/default-logo.png');
    }
  };

  useEffect(() => {
    doctorLogo();
  }, []);

  // Gestion des états des formulaires
  const [vaccinationForm, setVaccinationForm] = useState({
    vaccine: "",
    dueDate: "",
    status: "pending",
    dateAdministered: ""
  });

  const [growthForm, setGrowthForm] = useState({
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

  const [documentForm, setDocumentForm] = useState({
    title: "",
    file: null,
  });

  // États des rendez-vous
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({
    doctor: "",
    type: "",
    date: "",
    time: "",
    notes: "",
    reason: ""
  });
  const [appointments, setAppointments] = useState([]);
  
  // États de gestion des rendez-vous
  const [appointmentMode, setAppointmentMode] = useState('create');
  const [selectedAppointmentToEdit, setSelectedAppointmentToEdit] = useState(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Filtres et tris
  const [filters, setFilters] = useState({
    status: "all",
    sortField: "dueDate",
    sortDirection: "asc"
  });
  
  // États des modales
  const [modals, setModals] = useState({
    create: false,
    edit: false,
    delete: false,
    view: false,
    growth: false,
    prescription: false,
    viewPrescription: false,
    deletePrescription: false,
    appointment: false,
    uploadDocument: false,
    deleteDocument: false
  });

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

  const isPrescriptionFormValid = useMemo(() => {
    const { medication, dosage, frequency, startDate } = prescriptionForm;
    return (
      medication.trim() !== "" &&
      dosage.trim() !== "" &&
      frequency.trim() !== "" &&
      startDate.trim() !== ""
    );
  }, [prescriptionForm]);

  const isVaccinationFormValid = useMemo(() => {
    const { vaccine, dueDate, status, dateAdministered } = vaccinationForm;
    return (
      vaccine.trim() !== "" &&
      dueDate.trim() !== "" &&
      (status !== "done" || dateAdministered.trim() !== "")
    );
  }, [vaccinationForm]);

  // Gestion des cas d'erreur
  if (!state?.patient) {
    return (
      <div className="p-4 text-center">
        <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
          Informations patient introuvables. Veuillez naviguer depuis la liste des patients.
        </Alert>
        <Button onClick={() => navigate('/patients')} className="mt-4">
          Retour à la liste des patients
        </Button>
      </div>
    );
  }
  
  // Traitement des données du patient
  const { patient } = state;
  const patientAge = patient.age ? parseInt(patient.age) : 0;
  
  const patientData = useMemo(() => ({
    name: `${patient.firstName} ${patient.lastName}`,
    avatar: patient.img || "/img/default-avatar.jpg",
    age: patient.age || "Non spécifié",
    gender: patient.gender || "Non spécifié",
    bloodType: patient.bloodType || "Non spécifié",
    phoneNumber: patient.parent?.phoneNumber || "Non spécifié",
    email: patient.parent?.email || "Non spécifié",
    address: patient.parent?.address || "Non spécifié",
    emergencyContact: patient.parent?.fullName || "Non spécifié",
    allergies: patient.allergies || "Aucune spécifiée",
    chronicConditions: patient.chronicConditions || "Aucune spécifiée",
  }), [patient]);
  
  // Traitement des rendez-vous
  const processedAppointments = useMemo(() =>
    (patient.appointments || []).map(appointment => ({
      _id: appointment._id,
      name: appointment.doctor || "Personnel médical",
      message: `Rendez-vous pour ${appointment.type || "consultation"}`,
      time: appointment.date ? formatDate(appointment.date) : "Date non spécifiée",
      hour: appointment.time ? appointment.time : "Heure non spécifiée",
      date: appointment.date,
      doctor: appointment.doctor,
      type: appointment.type,
      notes: appointment.notes,
      reason: appointment.reason || appointment.notes
    })),
    [patient.appointments]
  );

  // Filtrage et tri des vaccinations
  const filteredVaccinations = useMemo(() => {
    let result = [...vaccinations];

    if (filters.status !== "all") {
      result = result.filter(v => v.status === filters.status);
    }

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

  // Fonctions API
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/documents/patient/${id}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      toast.error('Échec du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const uploadDocument = useCallback(async () => {
    if (!documentForm.title || !documentForm.file) return;
    
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', documentForm.file);
      formData.append('patientId', id);
      formData.append('title', documentForm.title);
      
      const response = await axiosInstance.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setDocuments(prev => [...prev, response.data]);
      setModals(prev => ({ ...prev, uploadDocument: false }));
      setDocumentForm({ title: "", file: null });
      toast.success('Document téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error);
      toast.error('Échec du téléchargement du document');
    } finally {
      setLoading(false);
    }
  }, [documentForm, id]);

  const deleteDocument = useCallback(async () => {
    if (!selectedDocument) return;
    
    try {
      setLoading(true);
      await axiosInstance.delete(`/documents/${selectedDocument._id}`);
      setDocuments(prev => prev.filter(doc => doc._id !== selectedDocument._id));
      setModals(prev => ({ ...prev, deleteDocument: false }));
      toast.success('Document supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      toast.error('Échec de la suppression du document');
    } finally {
      setLoading(false);
    }
  }, [selectedDocument]);

  const fetchGrowthRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/growth-records/${id}`);
      setGrowthRecords(response.data);
      setError(null);
    } catch (error) {
      console.error('Erreur lors de la récupération des enregistrements de croissance:', error);
      setError('Échec du chargement des enregistrements de croissance');
      toast.error('Échec du chargement des enregistrements de croissance');
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
      console.error('Erreur lors de la récupération des prescriptions:', error);
      toast.error('Échec du chargement des prescriptions');
    } finally {
      setLoading(false);
    }
  }, [id, state?.patient?._id]);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/appointments`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      toast.error('Échec du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  // Fonctions API pour les vaccinations
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
      setModals(prev => ({ ...prev, create: false }));
      setVaccinationForm({
        vaccine: "",
        dueDate: "",
        status: "pending",
        dateAdministered: ""
      });
      toast.success('Vaccination créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la vaccination:', error);
      toast.error('Échec de la création de la vaccination');
    } finally {
      setLoading(false);
    }
  }, [vaccinationForm, isVaccinationFormValid, id]);
  
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
      setModals(prev => ({ ...prev, edit: false }));
      toast.success('Vaccination mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la vaccination:', error);
      toast.error('Échec de la mise à jour de la vaccination');
    } finally {
      setLoading(false);
    }
  }, [selectedVaccination, vaccinationForm, isVaccinationFormValid]);
  
  const deleteVaccination = useCallback(async () => {
    if (!selectedVaccination) return;
    
    try {
      setLoading(true);
      await axiosInstance.delete(`/vaccinations/${selectedVaccination._id}`);
      setVaccinations(prev => prev.filter(v => v._id !== selectedVaccination._id));
      setModals(prev => ({ ...prev, delete: false }));
      toast.success('Vaccination supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de la vaccination:', error);
      toast.error('Échec de la suppression de la vaccination');
    } finally {
      setLoading(false);
    }
  }, [selectedVaccination]);
  
  const addGrowthRecord = useCallback(async () => {
    if (!isGrowthFormValid) return;
    
    try {
      setLoading(true);
      const bmi = calculateBMI(growthForm.weight, growthForm.height);
      const response = await axiosInstance.post('/growth-records', {
        patientId: id,
        heightCm: parseFloat(growthForm.height),
        weightKg: parseFloat(growthForm.weight),
        date: new Date(growthForm.growthDate).toISOString()
      });
      
      setGrowthRecords(prev => [...prev, response.data]);
      setModals(prev => ({ ...prev, growth: false }));
      setGrowthForm({
        height: "",
        weight: "",
        growthDate: ""
      });
      toast.success('Enregistrement de croissance ajouté avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'enregistrement de croissance:', error);
      toast.error('Échec de l\'ajout de l\'enregistrement de croissance');
    } finally {
      setLoading(false);
    }
  }, [growthForm, isGrowthFormValid, id]);
  
  const deleteGrowthRecord = useCallback(async (recordId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/growth-records/${recordId}`);
      setGrowthRecords(prev => prev.filter(record => record._id !== recordId));
      toast.success('Enregistrement de croissance supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'enregistrement de croissance:', error);
      toast.error('Échec de la suppression de l\'enregistrement de croissance');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fonctions API pour les prescriptions
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
      setModals(prev => ({ ...prev, prescription: false }));
      setPrescriptionForm({
        medication: "",
        dosage: "",
        frequency: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        notes: ""
      });
      toast.success('Prescription ajoutée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la prescription:', error);
      toast.error('Échec de l\'ajout de la prescription');
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
      setModals(prev => ({ ...prev, prescription: false }));
      toast.success('Prescription mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la prescription:', error);
      toast.error('Échec de la mise à jour de la prescription');
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
      setModals(prev => ({ ...prev, deletePrescription: false }));
      toast.success('Prescription supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de la prescription:', error);
      toast.error('Échec de la suppression de la prescription');
    } finally {
      setLoading(false);
    }
  }, [selectedPrescription]);

  // Gestion des rendez-vous
  const handleOpen = async (patientData) => {
    setSelectedPatient(patientData);
    setModals(prev => ({ ...prev, appointment: true }));
    setAppointmentMode('create');
    setSelectedAppointmentToEdit(null);
    setSelectedDate(null);
    setSelectedTime(null);

    setAppointmentForm({
      doctor: "",
      type: "",
      date: "",
      time: "",
      notes: "",
      reason: ""
    });

    try {
      await fetchAppointments();
      setSelectedPatient(patientData);
      setModals(prev => ({ ...prev, appointment: true }));
      setAppointmentMode('create');
      setSelectedAppointmentToEdit(null);
      setSelectedDate(null);
      setSelectedTime(null);
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      toast.error('Échec du chargement des données de rendez-vous');
    }
  };

  const handleEditAppointment = (appointmentToEdit) => {
    setAppointmentMode('update');
    setSelectedAppointmentToEdit(appointmentToEdit);
    
    const appointmentDate = new Date(appointmentToEdit.date);
    setSelectedDate(appointmentDate);
    setSelectedTime(appointmentToEdit.hour);
    
    setAppointmentForm({
      doctor: appointmentToEdit.doctor || "",
      type: appointmentToEdit.type || "",
      date: appointmentToEdit.date,
      time: appointmentToEdit.hour,
      notes: appointmentToEdit.notes || "",
      reason: appointmentToEdit.reason || appointmentToEdit.notes || ""
    });
    
    setModals(prev => ({ ...prev, appointment: true }));
  };

  const handleDeleteAppointment = (appointmentToDelete) => {
    setAppointmentToDelete(appointmentToDelete);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAppointment = async () => {
    try {
      setLoading(true);
      
      await axiosInstance.delete(`/appointments/${appointmentToDelete._id}`);
      
      toast.success('Rendez-vous supprimé avec succès !');
      
      await fetchAppointments();
      
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la suppression du rendez-vous:', error);
      toast.error('Échec de la suppression du rendez-vous');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const appointmentData = {
        patientId: selectedPatient?._id || patient._id,
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : appointmentForm.date,
        time: selectedTime || appointmentForm.time,
        reason: appointmentForm.reason,
        type: appointmentForm.type || 'consultation',
        doctor: appointmentForm.doctor || 'Dr. Default',
        notes: appointmentForm.notes || appointmentForm.reason
      };

      let response;
      if (appointmentMode === 'create') {
        response = await axiosInstance.post('/appointments', appointmentData);
        toast.success('Rendez-vous créé avec succès !');
      } else if (appointmentMode === 'update' && selectedAppointmentToEdit) {
        response = await axiosInstance.put(`/appointments/${selectedAppointmentToEdit._id}`, appointmentData);
        toast.success('Rendez-vous mis à jour avec succès !');
      }

      if (response.status === 200 || response.status === 201) {
        setModals(prev => ({ ...prev, appointment: false }));
        await fetchAppointments();
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Erreur lors du traitement du rendez-vous:', error);
      toast.error('Échec du traitement du rendez-vous');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTimeSlotBooked = (time) => {
    if (!selectedDate) return false;
    
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    const conflictingAppointment = appointments.find(appt => {
      const apptDate = new Date(appt.date).toISOString().split('T')[0];
      const isConflict = apptDate === selectedDateStr && appt.time === time;
      
      if (appointmentMode === 'update' && selectedAppointmentToEdit) {
        return isConflict && appt._id !== selectedAppointmentToEdit._id;
      }
      
      return isConflict;
    });

    return !!conflictingAppointment;
  };

  const exportVaccinationPDF = useCallback((vaccination) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40, 53, 147);
    doc.text("CARNET DE VACCINATION", 105, 20, null, null, "center");
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Patient: ${patientData.name}`, 20, 40);
    doc.text(`Date de naissance: ${patientData.age}`, 20, 50);
    
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text(vaccination.vaccine, 20, 70);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Statut: ${vaccination.status.toUpperCase()}`, 20, 85);
    doc.text(`Date d'échéance: ${formatDate(vaccination.dueDate)}`, 20, 95);
    
    if (vaccination.dateAdministered) {
      doc.text(`Administré: ${formatDate(vaccination.dateAdministered)}`, 20, 105);
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 20, 150);
    doc.text("Carnet de vaccination officiel - Usage médical", 105, 160, null, null, "center");
    
    doc.setDrawColor(200);
    doc.rect(15, 15, 180, 150);
    
    const safeName = (patientData.name || 'patient').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeVaccine = (vaccination.vaccine || 'vaccine').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeName}_${safeVaccine}.pdf`);
  }, [patientData.name]);

  // const exportPrescriptionPDF = useCallback(async (prescription) => {
  //   try {
  //     const doc = new jsPDF('p', 'mm', 'a4');
      
  //     // ... (le reste du code PDF reste identique mais avec des textes en français)
      
  //     doc.save(`prescription_${patientData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  //     toast.success('PDF de prescription généré avec succès !');
      
  //   } catch (error) {
  //     console.error('Erreur lors de la génération du PDF de prescription:', error);
  //     toast.error('Échec de la génération du PDF de prescription. Veuillez réessayer.');
  //   }
  // }, [patientData, formatDate, clinicLogo]);




// Updated exportPrescriptionPDF function
const exportPrescriptionPDF = useCallback(async (prescription) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const tealPrimary = [45, 150, 150];
    const tealSecondary = [70, 180, 180];
    const darkBlue = [25, 35, 85];
    const mediumGray = [150, 150, 150];
    const white = [255, 255, 255];
    const pageWidth = 210;
    const pageHeight = 297;

    // En-tête
    doc.setFillColor(...tealPrimary);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFillColor(...tealSecondary);
    for (let i = 0; i < 3; i++) {
      doc.ellipse(pageWidth - 20, 20 + (i * 5), 25 + (i * 3), 15 + (i * 2), 'F');
    }

    // Logo
    let logoAdded = false;
    if (clinicLogo && clinicLogo !== '/img/default-logo.png') {
      try {
        let logoBase64 = clinicLogo.startsWith('data:') ? clinicLogo : await convertImageToBase64(clinicLogo);
        doc.addImage(logoBase64, 'PNG', 8, 8, 20, 20);
        logoAdded = true;
      } catch {} 
    }
    if (!logoAdded) {
      doc.setFillColor(...white);
      doc.rect(17, 12, 2, 8, 'F');
      doc.rect(14, 15, 8, 2, 'F');
    }

    // Texte en-tête
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CENTRE MÉDICAL', 35, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SERVICES DE SANTÉ', 35, 25);

    // Infos médecin
    const doctorSectionY = 55;
    doc.setTextColor(...darkBlue);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Dr LISA BLOOM', pageWidth / 2, doctorSectionY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('ENDOCRINOLOGUE', pageWidth / 2, doctorSectionY + 8, { align: 'center' });
    doc.setFontSize(10);
    doc.text('ID N° 123456789', pageWidth / 2, doctorSectionY + 15, { align: 'center' });

    // Infos patient
    let currentY = doctorSectionY + 35;
    const createFormField = (label, value, x, y, width = 60) => {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(label, x, y);
      const labelWidth = doc.getTextWidth(label);
      doc.setLineWidth(0.3);
      doc.setDrawColor(...mediumGray);
      doc.line(x + labelWidth + 2, y + 1, x + labelWidth + width, y + 1);
      if (value) {
        doc.setFontSize(9);
        doc.text(value, x + labelWidth + 4, y - 1);
      }
    };
    createFormField('N°', '', 20, currentY, 50);
    createFormField('Date', new Date().toLocaleDateString('fr-FR'), 120, currentY, 50);
    currentY += 12;
    createFormField("Nom du patient", patientData.name || '', 20, currentY, 150);
    currentY += 12;
    createFormField('Date de naissance', '', 20, currentY, 40);
    createFormField('Âge', patientData.age?.toString() || '', 80, currentY, 25);
    createFormField('Sexe', patientData.gender || '', 130, currentY, 40);
    currentY += 25;

    // Section Rx
    doc.setFont('times', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(...darkBlue);
    doc.text('Rx :', 20, currentY);
    doc.setLineWidth(2);
    doc.setDrawColor(...tealPrimary);
    doc.line(20, currentY + 3, 55, currentY + 3);
    currentY += 25;

    // Détails prescription
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 127);
    doc.text(prescription.medication || 'Nom du médicament', 20, currentY);
    currentY += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${prescription.dosage || ''} - ${prescription.frequency || ''}`, 20, currentY);
    currentY += 20;

    // Instructions
    doc.setFontSize(11);
    doc.text('Prendre', 20, currentY);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...mediumGray);
    doc.line(40, currentY + 1, 120, currentY + 1);
    if (prescription.dosage) {
      doc.setFontSize(10);
      doc.text(prescription.dosage, 45, currentY - 1);
    }
    doc.setFontSize(11);
    doc.text('fois par', 125, currentY);
    const checkboxSize = 3.5;
    const checkboxY = currentY - 3;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.rect(155, checkboxY, checkboxSize, checkboxSize);
    doc.text('Jour', 162, currentY);
    doc.rect(180, checkboxY, checkboxSize, checkboxSize);
    doc.text('Semaine', 187, currentY);
    if (prescription.frequency?.toLowerCase().includes('jour')) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('✓', 156, currentY - 0.5);
    }
    currentY += 15;

    // Jours de la semaine
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Jours de la semaine', 20, currentY);
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    let dayX = 65;
    days.forEach((day) => {
      doc.rect(dayX, currentY - 3, checkboxSize, checkboxSize);
      doc.setFontSize(9);
      doc.text(day, dayX + 5, currentY);
      dayX += 22;
    });
    currentY += 15;

    // Fréquence (matin, midi, soir)
    doc.setFontSize(11);
    doc.text('Fréquence', 20, currentY);
    [
      { label: 'Matin', x: 60 },
      { label: 'Midi', x: 95 },
      { label: 'Soir', x: 125 }
    ].forEach(timing => {
      doc.rect(timing.x, currentY - 3, checkboxSize, checkboxSize);
      doc.setFontSize(9);
      doc.text(timing.label, timing.x + 5, currentY);
    });
    doc.setFontSize(11);
    doc.text('Heure de la prise', 155, currentY);
    doc.setLineWidth(0.3);
    doc.line(155, currentY + 1, 190, currentY + 1);
    currentY += 20;

    // Notes
    if (prescription.notes && prescription.notes.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Instructions spéciales :', 20, currentY);
      currentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const noteLines = doc.splitTextToSize(prescription.notes, 170);
      doc.text(noteLines, 20, currentY);
      currentY += noteLines.length * 5 + 5;
    }

    // Période de prescription
    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mediumGray);
    const startDate = prescription.startDate ? formatDate(prescription.startDate) : 'N/A';
    const endDate = prescription.endDate ? formatDate(prescription.endDate) : 'En cours';
    doc.text(`Période de prescription : ${startDate} - ${endDate}`, 20, currentY);

    // Signature
    currentY = Math.max(currentY + 20, 220);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text("Signature du médecin", 20, currentY);
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(20, currentY + 8, 80, currentY + 8);
    doc.text('Date', 120, currentY);
    doc.line(120, currentY + 8, 160, currentY + 8);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('fr-FR'), 125, currentY + 6);

    // Pied de page
    const footerY = pageHeight - 20;
    doc.setFillColor(...tealPrimary);
    doc.rect(0, footerY - 8, pageWidth, 20, 'F');
    doc.setTextColor(...white);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('123, Rue Exemple', 20, footerY);
    doc.text('NOM DE LA CLINIQUE MÉDICALE', pageWidth / 2, footerY, { align: 'center' });
    doc.text('+00 123 456 789', pageWidth - 20, footerY, { align: 'right' });

    // Filigrane
    doc.setTextColor(250, 250, 250);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    doc.text('Rx', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });

    // Enregistrer
    const safeName = (patientData.name || 'patient').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeMed = (prescription.medication || 'prescription').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`prescription_${safeName}_${safeMed}_${timestamp}.pdf`);
    toast.success('PDF de prescription généré avec succès !');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF de prescription :', error);
    toast.error('Échec de la génération du PDF de prescription. Veuillez réessayer.');
  }
}, [patientData, formatDate, clinicLogo]);


  const updateFilter = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const toggleSortDirection = useCallback(() => {
    setFilters(prev => ({ 
      ...prev, 
      sortDirection: prev.sortDirection === "asc" ? "desc" : "asc" 
    }));
  }, []);

  const handleClose = () => {
    setModals(prev => ({ ...prev, appointment: false }));
    setSelectedPatient(null);
    setAppointmentMode('create');
    setSelectedAppointmentToEdit(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setAppointmentForm({
      doctor: "",
      type: "",
      date: "",
      time: "",
      notes: "",
      reason: ""
    });
  };


  

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const tileDisabled = ({ date, view }) => {
    return date < new Date().setHours(0, 0, 0, 0);
  };

  // Effets
  useEffect(() => {
    fetchGrowthRecords();
    fetchPrescriptions();
    fetchAppointments();
  }, [fetchGrowthRecords, fetchPrescriptions, fetchAppointments]);
  
  useEffect(() => {
    if (activeTab === "documents") {
      fetchDocuments();
    }
  }, [activeTab, fetchDocuments]);

  // Gestion des erreurs
  if (error) {
    return (
      <div className="p-4">
        <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Réessayer
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
        Retour
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
                  {patientData.age} • {patientData.gender} • Groupe sanguin: {patientData.bloodType}
                </Typography>
              </div>
            </div>
            <div className="w-100 lg:w-1/3">
              <Tabs value={activeTab}>
                <TabsHeader>
                  <Tab value="overview" onClick={() => setActiveTab("overview")}>
                    <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Aperçu
                  </Tab>
                  <Tab value="documents" onClick={() => setActiveTab("documents")}>
                    <DocumentTextIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Documents
                  </Tab>
                  <Tab value="vaccinations" onClick={() => setActiveTab("vaccinations")}>
                    <ShieldCheckIcon className="-mt-0.5 mr-2 inline-block h-5 w-5" />
                    Vaccinations
                  </Tab>
                  <Tab value="growth" onClick={() => setActiveTab("growth")}>
                    <ChartBarIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Croissance
                  </Tab>
                  <Tab value="appointments" onClick={() => setActiveTab("appointments")}>
                    <CalendarDaysIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Rendez-vous
                  </Tab>
                  <Tab value="prescriptions" onClick={() => setActiveTab("prescriptions")}>
                    <DocumentTextIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Prescriptions
                  </Tab>
                </TabsHeader>
              </Tabs>
            </div>
          </div>

          {/* Contenu des onglets */}
          {activeTab === "overview" && (
            <div>
              <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
                <VaccinationStatusCard
                  filteredVaccinations={filteredVaccinations}
                  filters={filters}
                  updateFilter={updateFilter}
                  toggleSortDirection={toggleSortDirection}
                  handleOpenCreate={() => {
                    setVaccinationForm({
                      vaccine: "",
                      dueDate: "",
                      status: "pending",
                      dateAdministered: ""
                    });
                    setModals(prev => ({ ...prev, create: true }));
                  }}
                  handleOpenView={(vaccination) => {
                    setSelectedVaccination(vaccination);
                    setModals(prev => ({ ...prev, view: true }));
                  }}
                  handleOpenEdit={(vaccination) => {
                    setSelectedVaccination(vaccination);
                    setVaccinationForm({
                      vaccine: vaccination.vaccine,
                      dueDate: vaccination.dueDate.split('T')[0],
                      status: vaccination.status,
                      dateAdministered: vaccination.dateAdministered?.split('T')[0] || ""
                    });
                    setModals(prev => ({ ...prev, edit: true }));
                  }}
                  handleOpenDelete={(vaccination) => {
                    setSelectedVaccination(vaccination);
                    setModals(prev => ({ ...prev, delete: true }));
                  }}
                  handleScheduleNext={(vaccination) => {
                    const nextDueDate = calculateNextDueDate(vaccination);
                    if (!nextDueDate) {
                      toast.warning('Impossible de planifier la prochaine dose sans date d\'administration');
                      return;
                    }
                    
                    setVaccinationForm({
                      vaccine: vaccination.vaccine,
                      dueDate: nextDueDate,
                      status: "pending",
                      dateAdministered: ""
                    });
                    setModals(prev => ({ ...prev, create: true }));
                  }}
                  exportVaccinationPDF={exportVaccinationPDF}
                />
                
                <PatientInfoCard patientData={patientData} />
                
                <RecentActivitiesCard processedAppointments={processedAppointments} />
              </div>
              
              <VaccinationRecordsGrid
                filteredVaccinations={filteredVaccinations}
                handleOpenCreate={() => {
                  setVaccinationForm({
                    vaccine: "",
                    dueDate: "",
                    status: "pending",
                    dateAdministered: ""
                  });
                  setModals(prev => ({ ...prev, create: true }));
                }}
                handleOpenView={(vaccination) => {
                  setSelectedVaccination(vaccination);
                  setModals(prev => ({ ...prev, view: true }));
                }}
              />
            </div>
          )}

          {activeTab === "vaccinations" && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-6">
                <Typography variant="h4" color="blue-gray">
                  Gestion des vaccinations
                </Typography>
                <Button variant="gradient" onClick={() => {
                  setVaccinationForm({
                    vaccine: "",
                    dueDate: "",
                    status: "pending",
                    dateAdministered: ""
                  });
                  setModals(prev => ({ ...prev, create: true }));
                }}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Ajouter une nouvelle vaccination
                </Button>
              </div>
              
              <FilterControls
                filters={filters}
                updateFilter={updateFilter}
                toggleSortDirection={toggleSortDirection}
              />
              
              <VaccinationGrid
                vaccinations={filteredVaccinations}
                onView={(vaccination) => {
                  setSelectedVaccination(vaccination);
                  setModals(prev => ({ ...prev, view: true }));
                }}
                onEdit={(vaccination) => {
                  setSelectedVaccination(vaccination);
                  setVaccinationForm({
                    vaccine: vaccination.vaccine,
                    dueDate: vaccination.dueDate.split('T')[0],
                    status: vaccination.status,
                    dateAdministered: vaccination.dateAdministered?.split('T')[0] || ""
                  });
                  setModals(prev => ({ ...prev, edit: true }));
                }}
                onDelete={(vaccination) => {
                  setSelectedVaccination(vaccination);
                  setModals(prev => ({ ...prev, delete: true }));
                }}
              />
            </div>
          )}

          {activeTab === "growth" && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Typography variant="h4" color="blue-gray">
                    Suivi de croissance
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500">
                    Surveiller l'IMC et les modèles de croissance
                  </Typography>
                </div>
                <Button variant="gradient" onClick={() => setModals(prev => ({ ...prev, growth: true }))}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Ajouter un enregistrement
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
                  patientName={`${patient.firstName} ${patient.lastName}`}
                  onAddRecord={() => setModals(prev => ({ ...prev, growth: true }))}
                />
              )}
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="px-4">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h4" color="blue-gray">
                      Gestion des rendez-vous
                    </Typography>
                    <Typography variant="small" className="text-blue-gray-500">
                      Voir, modifier et gérer les rendez-vous des patients
                    </Typography>
                  </div>
                  <Button variant="gradient" onClick={() => handleOpen(patientData)}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Prendre un nouveau rendez-vous
                  </Button>
                </div>
              </div>
              
              {processedAppointments.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {processedAppointments.map((appointment) => (
                    <Card key={appointment._id} className="border border-blue-gray-50">
                      <CardHeader className="bg-blue-50 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                          <Typography variant="h5" color="blue-gray">
                            {appointment.name || 'Rendez-vous médical'}
                          </Typography>
                        </div>
                        <Chip value="Planifié" color="blue" size="sm" />
                      </CardHeader>
                      <CardBody className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-blue-gray-500" />
                            <Typography variant="small" className="font-semibold text-blue-gray-500">
                              Date & Heure:
                            </Typography>
                            <Typography>{appointment.time} à {appointment.hour}</Typography>
                          </div>
                          
                          {appointment.message && (
                            <div>
                              <Typography variant="small" className="font-semibold text-blue-gray-500">
                                Objectif:
                              </Typography>
                              <Typography variant="small">{appointment.message}</Typography>
                            </div>
                          )}
                        </div>
                      </CardBody>
                      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                        <Button 
                          variant="text" 
                          color="blue" 
                          size="sm"
                          onClick={() => handleEditAppointment(appointment)}
                          className="flex items-center gap-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Modifier
                        </Button>
                        <Button 
                          variant="text" 
                          color="red" 
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment)}
                          className="flex items-center gap-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
                  <CalendarDaysIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
                  <Typography variant="h5" color="blue-gray" className="mb-2">
                    Aucun rendez-vous trouvé
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500 mb-6 max-w-md mx-auto">
                    {patientData.name} n'a aucun rendez-vous prévu. Prenez le premier rendez-vous pour commencer.
                  </Typography>
                  <Button variant="gradient" onClick={() => handleOpen(patientData)}>
                    Prendre le premier rendez-vous
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Typography variant="h4" color="blue-gray">
                    Gestion des prescriptions
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500">
                    Gérer et suivre les prescriptions médicamenteuses
                  </Typography>
                </div>
                <Button variant="gradient" onClick={() => {
                  setPrescriptionForm({
                    medication: "",
                    dosage: "",
                    frequency: "",
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: "",
                    notes: ""
                  });
                  setSelectedPrescription(null);
                  setModals(prev => ({ ...prev, prescription: true }));
                }}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Ajouter une prescription
                </Button>
              </div>

              {prescriptions.length === 0 ? (
                <EmptyPrescriptionsState 
                  patientName={patientData.name}
                  onAddPrescription={() => setModals(prev => ({ ...prev, prescription: true }))}
                />
              ) : (
                <div className="space-y-8">
                  {Object.entries(
                    prescriptions.reduce((groups, prescription) => {
                      const year = new Date(prescription.startDate).getFullYear();
                      if (!groups[year]) groups[year] = [];
                      groups[year].push(prescription);
                      return groups;
                    }, {})
                  ).map(([year, yearPrescriptions]) => (
                    <div key={year}>
                      <Typography variant="h5" color="blue-gray" className="mb-4">
                        {year}
                      </Typography>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {yearPrescriptions.map((prescription) => (
                          <PrescriptionCard
                            key={prescription._id}
                            prescription={prescription}
                            onEdit={() => {
                              setSelectedPrescription(prescription);
                              setPrescriptionForm({
                                medication: prescription.medication,
                                dosage: prescription.dosage,
                                frequency: prescription.frequency,
                                startDate: prescription.startDate.split('T')[0],
                                endDate: prescription.endDate ? prescription.endDate.split('T')[0] : "",
                                notes: prescription.notes || ""
                              });
                              setModals(prev => ({ ...prev, prescription: true }));
                            }}
                            onDelete={() => {
                              setSelectedPrescription(prescription);
                              setModals(prev => ({ ...prev, deletePrescription: true }));
                            }}
                            onView={() => {
                              setSelectedPrescription(prescription);
                              setModals(prev => ({ ...prev, viewPrescription: true }));
                            }}
                            onExportPDF={exportPrescriptionPDF}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Typography variant="h4" color="blue-gray">
                    Gestion des documents
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500">
                    Stocker et gérer les documents des patients
                  </Typography>
                </div>
                <Button variant="gradient" onClick={() => setModals(prev => ({ ...prev, uploadDocument: true }))}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Uploader un document
                </Button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
                  <DocumentTextIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
                  <Typography variant="h5" color="blue-gray" className="mb-2">
                    Aucun document trouvé
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500 mb-6 max-w-md mx-auto">
                    {patientData.name} n'a encore aucun document. Uploader le premier document pour commencer.
                  </Typography>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map((document) => (
                    <Card key={document._id} className="border border-blue-gray-50">
                      <CardHeader className="bg-blue-50 p-4">
                        <div className="flex items-center justify-between">
                          <Typography variant="h6" color="blue-gray">
                            {document.title}
                          </Typography>
                          <Chip value="Document" color="blue" size="sm" />
                        </div>
                      </CardHeader>
                      <CardBody className="p-4">
                        <Typography variant="small" className="text-blue-gray-500">
                          Uploadé: {formatDate(document.createdAt)}
                        </Typography>
                      </CardBody>
                      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                        <Button 
  variant="text" 
  color="blue" 
  size="sm"
  onClick={() => navigate(`/dashboard/documents/${document._id}`)}
>
  Voir
</Button>
                        <Button 
                          variant="text" 
                          color="red" 
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document);
                            setModals(prev => ({ ...prev, deleteDocument: true }));
                          }}
                        >
                          Supprimer
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modales pour les documents */}
      <DocumentUploadModal
        open={modals.uploadDocument}
        onClose={() => setModals(prev => ({ ...prev, uploadDocument: false }))}
        formData={documentForm}
        setFormData={setDocumentForm}
        onSubmit={uploadDocument}
        loading={loading}
      />

      <DeleteDocumentModal
        open={modals.deleteDocument}
        onClose={() => setModals(prev => ({ ...prev, deleteDocument: false }))}
        document={selectedDocument}
        onConfirm={deleteDocument}
        loading={loading}
      />

      {/* Modales pour les vaccinations */}
      <VaccinationModal
        open={modals.create}
        onClose={() => setModals(prev => ({ ...prev, create: false }))}
        title="Ajouter une nouvelle vaccination"
        formData={vaccinationForm}
        updateField={(field, value) => setVaccinationForm(prev => ({ ...prev, [field]: value }))}
        onSubmit={createVaccination}
        isValid={isVaccinationFormValid}
        loading={loading}
      />

      <VaccinationModal
        open={modals.edit}
        onClose={() => setModals(prev => ({ ...prev, edit: false }))}
        title="Modifier l'enregistrement de vaccination"
        formData={vaccinationForm}
        updateField={(field, value) => setVaccinationForm(prev => ({ ...prev, [field]: value }))}
        onSubmit={updateVaccination}
        isValid={isVaccinationFormValid}
        loading={loading}
        isEdit
      />
    
      <ViewVaccinationModal
        open={modals.view}
        onClose={() => setModals(prev => ({ ...prev, view: false }))}
        vaccination={selectedVaccination}
        onScheduleNext={(vaccination) => {
          const nextDueDate = calculateNextDueDate(vaccination);
          if (!nextDueDate) {
            toast.warning('Impossible de planifier la prochaine dose sans date d\'administration');
            return;
          }
          
          setVaccinationForm({
            vaccine: vaccination.vaccine,
            dueDate: nextDueDate,
            status: "pending",
            dateAdministered: ""
          });
          setModals(prev => ({ ...prev, create: true }));
        }}
        onExportPDF={exportVaccinationPDF}
      />

      <DeleteConfirmationModal
        open={modals.delete}
        onClose={() => setModals(prev => ({ ...prev, delete: false }))}
        vaccination={selectedVaccination}
        onConfirm={deleteVaccination}
        loading={loading}
      />

      {/* Modales pour les prescriptions */}
      <PrescriptionModal
        open={modals.prescription}
        onClose={() => setModals(prev => ({ ...prev, prescription: false }))}
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
        onClose={() => setModals(prev => ({ ...prev, viewPrescription: false }))}
        prescription={selectedPrescription}
        onExportPDF={exportPrescriptionPDF}
      />

      <DeletePrescriptionModal
        open={modals.deletePrescription}
        onClose={() => setModals(prev => ({ ...prev, deletePrescription: false }))}
        prescription={selectedPrescription}
        onConfirm={deletePrescription}
        loading={loading}
      />

      {/* Modale pour la croissance */}
      <GrowthModal
        open={modals.growth}
        onClose={() => setModals(prev => ({ ...prev, growth: false }))}
        formData={growthForm}
        updateField={(field, value) => setGrowthForm(prev => ({ ...prev, [field]: value }))}
        onSubmit={addGrowthRecord}
        isValid={isGrowthFormValid}
        loading={loading}
        patientAge={patientAge}
      />

      {/* Modale pour les rendez-vous */}
      <Dialog open={modals.appointment} handler={handleClose} size="xl" className="h-screen overflow-auto">
        <DialogHeader>
          {appointmentMode === 'create' ? 'Prendre un nouveau rendez-vous' : 'Modifier le rendez-vous'}
        </DialogHeader>
        <form onSubmit={handleAppointmentSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <Typography variant="small" color="gray">
              Veuillez remplir les détails du rendez-vous.
            </Typography>
            {(selectedPatient || patientData) && (
              <>
                <Typography variant="h6">
                  Patient: {selectedPatient?.name || patientData.name}
                </Typography>

                {appointmentMode === 'update' && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Typography variant="small" color="blue-gray" className="font-semibold">
                      Modification d'un rendez-vous existant
                    </Typography>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography variant="h6" className="mb-2">Sélectionner une date</Typography>
                    <Calendar
                      onChange={handleDateChange}
                      value={selectedDate}
                      minDate={new Date()}
                      tileDisabled={tileDisabled}
                      className="border rounded-lg p-2 w-full"
                    />
                  </div>

                  <div>
                    <Typography variant="h6" className="mb-2">Créneaux horaires disponibles</Typography>
                    {selectedDate || appointmentForm.date ? (
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map(time => {
                          const isBooked = isTimeSlotBooked(time);
                          const isCurrentSelected = selectedTime === time || appointmentForm.time === time;
                          
                          return (
                            <Button
                              key={time}
                              variant={isCurrentSelected ? "filled" : "outlined"}
                              color={isBooked ? "red" : isCurrentSelected ? "black" : "gray"}
                              onClick={() => !isBooked && handleTimeSelect(time)}
                              disabled={isBooked}
                              className="p-2 text-sm"
                              title={isBooked ? "Créneau déjà réservé" : "Disponible"}
                            >
                              {time}
                              {isBooked && (
                                <span className="ml-1 text-xs">(Réservé)</span>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <Typography variant="small" color="gray">
                        Veuillez d'abord sélectionner une date
                      </Typography>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Type de rendez-vous"
                      value={appointmentForm.type}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, type: e.target.value }))}
                      placeholder="ex: Consultation, Contrôle, Suivi"
                    />
                  </div>
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
              color="neutral"
              type="submit"
              disabled={isSubmitting || !(selectedDate || appointmentForm.date) || !(selectedTime || appointmentForm.time)}
            >
              {isSubmitting 
                ? (appointmentMode === 'create' ? 'Réservation...' : 'Mise à jour...') 
                : (appointmentMode === 'create' ? 'Prendre rendez-vous' : 'Mettre à jour')
              }
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modale de confirmation de suppression de rendez-vous */}
      <Dialog open={deleteConfirmOpen} handler={() => setDeleteConfirmOpen(false)}>
        <DialogHeader>Confirmation de suppression</DialogHeader>
        <DialogBody>
          <Typography variant="small" className="text-red-500">
            Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.
          </Typography>
          {appointmentToDelete && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <Typography variant="small" className="font-semibold">
                Détails du rendez-vous:
              </Typography>
              <Typography variant="small">
                Date: {appointmentToDelete.time}<br />
                Heure: {appointmentToDelete.hour}<br />
                Objectif: {appointmentToDelete.message}
              </Typography>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="gray"
            onClick={() => setDeleteConfirmOpen(false)}
            className="mr-1"
          >
            Annuler
          </Button>
          <Button 
            variant="gradient" 
            color="red" 
            onClick={confirmDeleteAppointment}
            disabled={loading}
          >
            {loading ? "Suppression..." : "Supprimer le rendez-vous"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default PatientDetail;






// // english
//  PatientDetail.jsx
// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import {
//   Card,
//   CardBody,
//   CardHeader,
//   CardFooter,
//   Avatar,
//   Typography,
//   Tabs, 
//   TabsHeader,
//   Tab,
//   Button,
//   Chip,
//   Dialog,
//   DialogHeader,
//   DialogBody,
//   DialogFooter,
//   Input,
//   Select,
//   Option,
//   Menu,
//   MenuHandler,
//   MenuList,
//   MenuItem,
//   Alert,
//   // Tooltip,
//   Textarea
// } from "@material-tailwind/react";


// import {
//   HomeIcon,
//   ShieldCheckIcon,
//   ChartBarIcon,
//   CalendarDaysIcon,
//   PencilIcon,
//   ArrowLeftIcon,
//   PlusIcon,
//   TrashIcon,
//   EllipsisVerticalIcon,
//   ArrowDownIcon,
//   ArrowUpIcon,
//   DocumentArrowDownIcon,
//   ExclamationTriangleIcon,
//   DocumentTextIcon,
//   ClockIcon
// } from "@heroicons/react/24/solid";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import axiosInstance from '@/api/axiosInstance';
// import { toast } from 'react-toastify';
// import jsPDF from 'jspdf';
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   ReferenceLine,
//   Label
// } from 'recharts';
// import Calendar from 'react-calendar';
// import { getLogo } from '@/data/sitting';
// import { use } from 'react';


// // Add this at the top of your PatientDetail.jsx file, before the main component
// const convertImageToBase64 = (url) => {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.crossOrigin = 'anonymous';
    
//     img.onload = () => {
//       try {
//         const canvas = document.createElement('canvas');
//         const ctx = canvas.getContext('2d');
//         canvas.width = img.width;
//         canvas.height = img.height;
//         ctx.drawImage(img, 0, 0);
//         const dataURL = canvas.toDataURL('image/png');
//         resolve(dataURL);
//       } catch (error) {
//         reject(error);
//       }
//     };
    
//     img.onerror = reject;
//     img.src = url;
//   });
// };

// // Constants
// const STATUS_COLORS = {
//   done: "green",
//   pending: "orange",
//   overdue: "red",
//   default: "blue-gray"
// };

// const VACCINE_SCHEDULES = {
//   "hepatitis b": { interval: 1, unit: "months" },
//   "dtap": { interval: 2, unit: "months" },
//   "mmr": { interval: 1, unit: "years" },
//   default: { interval: 6, unit: "months" }
// };

// const BMI_CATEGORIES = [
//   { name: "Underweight", range: "< 18.5", color: "red" },
//   { name: "Normal", range: "18.5 - 24.9", color: "green" },
//   { name: "Overweight", range: "25 - 29.9", color: "orange" },
//   { name: "Obese", range: "≥ 30", color: "red" }
// ];

// const PRESCRIPTION_STATUS = {
//   active: "Active",
//   completed: "Completed",
//   cancelled: "Cancelled"
// };

// const COMMON_MEDICATIONS = [
//   "Amoxicillin",
//   "Azithromycin",
//   "Ibuprofen",
//   "Acetaminophen",
//   "Albuterol",
//   "Cetirizine",
//   "Loratadine",
//   "Omeprazole",
//   "Prednisone",
//   "Dextromethorphan"
// ];

// const TIME_SLOTS = [
//   "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
//   "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
// ];

// // Utility functions
// const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.default;

// const formatDate = (dateString) => {
//   if (!dateString) return "Not administered";
//   return new Date(dateString).toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//   });
// };

// const calculateNextDueDate = (vaccination) => {
//   if (!vaccination.dateAdministered) return null;
  
//   const administeredDate = new Date(vaccination.dateAdministered);
//   const nextDueDate = new Date(administeredDate);
//   const schedule = VACCINE_SCHEDULES[vaccination.vaccine.toLowerCase()] || VACCINE_SCHEDULES.default;
  
//   if (schedule.unit === "years") {
//     nextDueDate.setFullYear(nextDueDate.getFullYear() + schedule.interval);
//   } else {
//     nextDueDate.setMonth(nextDueDate.getMonth() + schedule.interval);
//   }
  
//   return nextDueDate.toISOString().split('T')[0];
// };

// const calculateBMI = (weight, height) => {
//   if (!weight || !height || weight <= 0 || height <= 0) return 0;
//   const heightInMeters = height / 100;
//   return (weight / (heightInMeters * heightInMeters)).toFixed(1);
// };

// const getBMICategory = (bmi, age) => {
//   if (age < 2) return "N/A";
//   if (bmi < 18.5) return "Underweight";
//   if (bmi >= 18.5 && bmi < 25) return "Normal";
//   if (bmi >= 25 && bmi < 30) return "Overweight";
//   return "Obese";
// };

// const getBMICategoryColor = (category) => {
//   switch (category) {
//     case "Normal": return "#4caf50";
//     case "Underweight": return "#ff9800";
//     case "Overweight": return "#f44336";
//     case "Obese": return "#d32f2f";
//     default: return "#9e9e9e";
//   }
// };

// // Helper Components
// const VaccinationStatusCard = ({ 
//   filteredVaccinations, 
//   filters, 
//   updateFilter, 
//   toggleSortDirection, 
//   handleOpenCreate,
//   handleOpenView,
//   handleOpenEdit,
//   handleOpenDelete,
//   handleScheduleNext,
//   exportVaccinationPDF 
// }) => (
//   <div>
//     <div className="flex items-center justify-between mb-3">
//       <Typography variant="h6" color="blue-gray">
//         Vaccination Status
//       </Typography>
//       <Button variant="gradient" size="sm" onClick={handleOpenCreate}>
//         <PlusIcon className="h-4 w-4 mr-1" />
//         Add Vaccination
//       </Button>
//     </div>
    
//     <FilterControls
//       filters={filters}
//       updateFilter={updateFilter}
//       toggleSortDirection={toggleSortDirection}
//     />
    
//     <div className="flex flex-col gap-12">
//       {filteredVaccinations.map((vaccination, index) => (
//         <VaccinationListItem
//           key={vaccination._id || index}
//           vaccination={vaccination}
//           onView={handleOpenView}
//           onEdit={handleOpenEdit}
//           onDelete={handleOpenDelete}
//           onScheduleNext={handleScheduleNext}
//           onExportPDF={exportVaccinationPDF}
//         />
//       ))}
//     </div>
//   </div>
// );

// const GrowthCharts = ({ records, patientAge }) => {
//   const chartData = useMemo(() => {
//     return records
//       .map(record => ({
//         date: new Date(record.date).toLocaleDateString('en-US', {
//           month: 'short',
//           day: 'numeric'
//         }),
//         height: record.heightCm,
//         weight: record.weightKg,
//         bmi: parseFloat(record.bmi),
//         dateValue: new Date(record.date).getTime()
//       }))
//       .sort((a, b) => a.dateValue - b.dateValue);
//   }, [records]);

//   const bmiCategory = getBMICategory(
//     chartData[chartData.length - 1]?.bmi || 0,
//     patientAge
//   );
//   const bmiColor = getBMICategoryColor(bmiCategory);

//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
//       <div className="bg-white p-4 rounded-xl border border-blue-gray-50">
//         <Typography variant="h5" color="blue-gray" className="mb-4">
//           Height & Weight Trend
//         </Typography>
//         <div className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart
//               data={chartData}
//               margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//             >
//               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//               <XAxis dataKey="date" />
//               <YAxis yAxisId="left" domain={['auto', 'auto']} />
//               <YAxis 
//                 yAxisId="right" 
//                 orientation="right" 
//                 domain={['auto', 'auto']}
//               />
//               <Tooltip 
//                 formatter={(value, name) => [
//                   name === 'height' ? `${value} cm` : `${value} kg`,
//                   name === 'height' ? 'Height' : 'Weight'
//                 ]}
//               />
//               <Legend />
//               <Line
//                 yAxisId="left"
//                 type="monotone"
//                 dataKey="height"
//                 stroke="#8884d8"
//                 name="Height"
//                 strokeWidth={2}
//                 dot={{ r: 4 }}
//                 activeDot={{ r: 6 }}
//               />
//               <Line
//                 yAxisId="right"
//                 type="monotone"
//                 dataKey="weight"
//                 stroke="#82ca9d"
//                 name="Weight"
//                 strokeWidth={2}
//                 dot={{ r: 4 }}
//                 activeDot={{ r: 6 }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       <div className="bg-white p-4 rounded-xl border border-blue-gray-50">
//         <Typography variant="h5" color="blue-gray" className="mb-4">
//           BMI Trend
//         </Typography>
//         <div className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             <AreaChart
//               data={chartData}
//               margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
//             >
//               <defs>
//                 <linearGradient id="bmiColor" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor={bmiColor} stopOpacity={0.8}/>
//                   <stop offset="95%" stopColor={bmiColor} stopOpacity={0.1}/>
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//               <XAxis dataKey="date" />
//               <YAxis domain={['auto', 'auto']} />
//               <Tooltip formatter={(value) => [`${value}`, 'BMI']} />
//               <Area
//                 type="monotone"
//                 dataKey="bmi"
//                 stroke={bmiColor}
//                 fillOpacity={1}
//                 fill="url(#bmiColor)"
//                 name="BMI"
//                 strokeWidth={2}
//               />
//               {patientAge >= 2 && (
//                 <>
//                   <ReferenceLine y={18.5} stroke="#f57c00" strokeDasharray="3 3">
//                     <Label value="Underweight" position="insideTopRight" />
//                   </ReferenceLine>
//                   <ReferenceLine y={25} stroke="#388e3c" strokeDasharray="3 3">
//                     <Label value="Healthy" position="insideTopRight" />
//                   </ReferenceLine>
//                   <ReferenceLine y={30} stroke="#d32f2f" strokeDasharray="3 3">
//                     <Label value="Overweight" position="insideTopRight" />
//                   </ReferenceLine>
//                 </>
//               )}
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// };

// const FilterControls = ({ filters, updateFilter, toggleSortDirection }) => (
//   <div className="flex gap-2 mb-4">
//     <Select
//       label="Filter Status"
//       value={filters.status}
//       onChange={(val) => updateFilter('status', val)}
//       size="sm"
//     >
//       <Option value="all">All</Option>
//       <Option value="pending">Pending</Option>
//       <Option value="done">Completed</Option>
//       <Option value="overdue">Overdue</Option>
//     </Select>
    
//     <div className="flex items-center">
//       <Select
//         label="Sort By"
//         value={filters.sortField}
//         onChange={(val) => updateFilter('sortField', val)}
//         size="sm"
//       >
//         <Option value="dueDate">Due Date</Option>
//         <Option value="vaccine">Vaccine Name</Option>
//         <Option value="status">Status</Option>
//       </Select>
//       <Button 
//         variant="text" 
//         size="sm"
//         onClick={toggleSortDirection}
//         className="ml-2"
//       >
//         {filters.sortDirection === "asc" ? (
//           <ArrowUpIcon className="h-4 w-4" />
//         ) : (
//           <ArrowDownIcon className="h-4 w-4" />
//         )}
//       </Button>
//     </div>
//   </div>
// );

// const VaccinationListItem = ({ 
//   vaccination, 
//   onView, 
//   onEdit, 
//   onDelete, 
//   onScheduleNext, 
//   onExportPDF 
// }) => (
//   <div>
//     <div className="flex justify-between items-center mb-4">
//       <Typography className="block text-xs font-semibold uppercase text-blue-gray-500">
//         {vaccination.vaccine}
//       </Typography>
//       <Menu>
//         <MenuHandler>
//           <Button variant="text" size="sm">
//             <EllipsisVerticalIcon className="h-5 w-5" />
//           </Button>
//         </MenuHandler>
//         <MenuList>
//           <MenuItem onClick={() => onView(vaccination)}>
//             View Details
//           </MenuItem>
//           <MenuItem onClick={() => onEdit(vaccination)}>
//             Edit
//           </MenuItem>
//           <MenuItem onClick={() => onScheduleNext(vaccination)}>
//             Schedule Next
//           </MenuItem>
//           <MenuItem onClick={() => onExportPDF(vaccination)}>
//             <div className="flex items-center">
//               <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
//               Export PDF
//             </div>
//           </MenuItem>
//           <MenuItem 
//             onClick={() => onDelete(vaccination)}
//             className="text-red-500"
//           >
//             Delete
//           </MenuItem>
//         </MenuList>
//       </Menu>
//     </div>
//     <div className="flex flex-col gap-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <Typography className="text-sm font-normal text-blue-gray-500">
//             Due Date: {formatDate(vaccination.dueDate)}
//           </Typography>
//           <Typography className="text-sm font-normal text-blue-gray-500">
//             {vaccination.dateAdministered 
//               ? `Administered: ${formatDate(vaccination.dateAdministered)}`
//               : "Pending administration"
//             }
//           </Typography>
//         </div>
//         <Chip
//           value={vaccination.status}
//           color={getStatusColor(vaccination.status)}
//           size="sm"
//         />
//       </div>
//     </div>
//   </div>
// );

// const PatientInfoCard = ({ patientData }) => (
//   <div>
//     <div className="mb-4 flex items-center justify-between">
//       <Typography variant="h6" color="blue-gray">
//         Patient Information
//       </Typography>
//       <Tooltip content="Edit Patient Info">
//         <PencilIcon className="h-4 w-4 cursor-pointer text-blue-gray-500" />
//       </Tooltip>
//     </div>
//     <Typography variant="small" className="mb-4 font-normal text-blue-gray-500">
//       Medical records and contact information for {patientData.name}. Complete patient profile with emergency contacts and medical history.
//     </Typography>
    
//     <div className="space-y-4">
//       {Object.entries({
//         "full name": patientData.name,
//         mobile: patientData.phoneNumber,
//         email: patientData.email,
//         location: patientData.address,
//         "emergency contact": patientData.emergencyContact,
//         allergies: patientData.allergies,
//         "chronic conditions": patientData.chronicConditions,
//       }).map(([key, value]) => (
//         <div key={key} className="flex items-center gap-4">
//           <Typography variant="small" className="w-48 font-semibold text-blue-gray-500">
//             {key}:
//           </Typography>
//           <Typography variant="small" className="font-normal text-blue-gray-500">
//             {value}
//           </Typography>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// const RecentActivitiesCard = ({ processedAppointments }) => (
//   <div>
//     <Typography variant="h6" color="blue-gray" className="mb-3">
//       Recent Activities
//     </Typography>
//     <ul className="flex flex-col gap-4">
//       {processedAppointments.length > 0 ? (
//         processedAppointments.map((props, index) => (
//           <Card key={index} className="border border-blue-gray-50">
//             <CardBody className="p-4">
//               <div className="flex items-center gap-4">
//                 <div className="bg-blue-50 p-2 rounded-full">
//                   <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
//                 </div>
//                 <div>
//                   <Typography variant="small" color="blue-gray" className="font-bold">
//                     {props.name}
//                   </Typography>
//                   <Typography variant="small" className="text-blue-gray-500">
//                     {props.message}
//                   </Typography>
//                 </div>
//                 <div className="ml-auto text-right">
//                   <Typography variant="small" className="text-blue-gray-500">
//                     {props.time}
//                   </Typography>
//                   <Typography variant="small" className="text-blue-gray-500">
//                     {props.hour}
//                   </Typography>
//                 </div>
//               </div>
//             </CardBody>
//           </Card>
//         ))
//       ) : (
//         <Typography variant="small" className="text-blue-gray-500">
//           No recent activities
//         </Typography>
//       )}
//     </ul>
//   </div>
// );

// const VaccinationRecordsGrid = ({ filteredVaccinations, handleOpenCreate, handleOpenView }) => (
//   <div className="px-4 pb-4">
//     <div className="flex items-center justify-between mb-2">
//       <Typography variant="h6" color="blue-gray">
//         Vaccination Records
//       </Typography>
//       <Button variant="text" size="sm" onClick={handleOpenCreate}>
//         <PlusIcon className="h-4 w-4 mr-1" />
//         Add Record
//       </Button>
//     </div>
//     <Typography variant="small" className="font-normal text-blue-gray-500">
//       Complete vaccination history and upcoming schedules
//     </Typography>
//     <div className="mt-6 grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-4">
//       {filteredVaccinations.map((vaccination, index) => (
//         <Card key={vaccination._id || index} color="transparent" shadow={false}>
//           <CardHeader
//             floated={false}
//             color="gray"
//             className="mx-0 mt-0 mb-4 h-64 xl:h-40 flex items-center justify-center bg-blue-50"
//           >
//             <ShieldCheckIcon className="h-16 w-16 text-blue-600" />
//           </CardHeader>
//           <CardBody className="py-0 px-1">
//             <Typography variant="small" className="font-normal text-blue-gray-500">
//               {vaccination.status === "done" ? "Completed" : "Pending"}
//             </Typography>
//             <Typography variant="h5" color="blue-gray" className="mt-1 mb-2">
//               {vaccination.vaccine}
//             </Typography>
//             <Typography variant="small" className="font-normal text-blue-gray-500">
//               Due: {formatDate(vaccination.dueDate)}
//             </Typography>
//           </CardBody>
//           <CardFooter className="mt-6 flex items-center justify-between py-0 px-1">
//             <Button 
//               variant="outlined" 
//               size="sm"
//               onClick={() => handleOpenView(vaccination)}
//             >
//               View Details
//             </Button>
//             <div className="flex items-center">
//               <Chip
//                 value={vaccination.status}
//                 color={getStatusColor(vaccination.status)}
//                 size="sm"
//               />
//             </div>
//           </CardFooter>
//         </Card>
//       ))}
//     </div>
//   </div>
// );

// const VaccinationGrid = ({ vaccinations, onView, onEdit, onDelete }) => (
//   <div className="mt-8">
//     <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
//       {vaccinations.map((vaccination, index) => (
//         <Card key={vaccination._id || index} className="border border-blue-gray-50">
//           <CardHeader className="bg-blue-50 p-4 flex justify-between items-center">
//             <Typography variant="h5" color="blue-gray">
//               {vaccination.vaccine}
//             </Typography>
//             <Chip
//               value={vaccination.status}
//               color={getStatusColor(vaccination.status)}
//               size="sm"
//             />
//           </CardHeader>
//           <CardBody className="p-4">
//             <div className="space-y-3">
//               <div>
//                 <Typography variant="small" className="font-semibold text-blue-gray-500">
//                   Due Date
//                 </Typography>
//                 <Typography>{formatDate(vaccination.dueDate)}</Typography>
//               </div>
              
//               {vaccination.dateAdministered && (
//                 <div>
//                   <Typography variant="small" className="font-semibold text-blue-gray-500">
//                     Administered
//                   </Typography>
//                   <Typography>{formatDate(vaccination.dateAdministered)}</Typography>
//                 </div>
//               )}
              
//               <div>
//                 <Typography variant="small" className="font-semibold text-blue-gray-500">
//                   Status
//                 </Typography>
//                 <Typography className="capitalize">{vaccination.status}</Typography>
//               </div>
//             </div>
//           </CardBody>
//           <CardFooter className="flex justify-between p-4">
//             <Button variant="outlined" onClick={() => onView(vaccination)}>
//               View Details
//             </Button>
//             <div className="flex gap-2">
//               <Button 
//                 variant="text" 
//                 color="blue"
//                 onClick={() => onEdit(vaccination)}
//               >
//                 Edit
//               </Button>
//               <Button 
//                 variant="text" 
//                 color="red"
//                 onClick={() => onDelete(vaccination)}
//               >
//                 Delete
//               </Button>
//             </div>
//           </CardFooter>
//         </Card>
//       ))}
//     </div>
//   </div>
// );

// const GrowthRecordsTable = ({ records, patientAge, onDelete, loading }) => (
//   <>
//     <Card>
//       <CardBody>
//         <div className="overflow-x-auto">
//           <table className="w-full min-w-max">
//             <thead>
//               <tr>
//                 <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                   <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Date</Typography>
//                 </th>
//                 <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                   <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Height (cm)</Typography>
//                 </th>
//                 <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                   <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Weight (kg)</Typography>
//                 </th>
//                 <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                   <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">BMI</Typography>
//                 </th>
//                 <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                   <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Category</Typography>
//                 </th>
//                 <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                   <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">Actions</Typography>
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {records.map((record, index) => (
//                 <tr key={record._id || index}>
//                   <td className="p-4 border-b border-blue-gray-50">
//                     <Typography variant="small" color="blue-gray" className="font-normal">
//                       {formatDate(record.date)}
//                     </Typography>
//                   </td>
//                   <td className="p-4 border-b border-blue-gray-50">
//                     <Typography variant="small" color="blue-gray" className="font-normal">
//                       {record.heightCm}
//                     </Typography>
//                   </td>
//                   <td className="p-4 border-b border-blue-gray-50">
//                     <Typography variant="small" color="blue-gray" className="font-normal">
//                       {record.weightKg}
//                     </Typography>
//                   </td>
//                   <td className="p-4 border-b border-blue-gray-50">
//                     <Typography variant="small" color="blue-gray" className="font-normal">
//                       {record.bmi}
//                     </Typography>
//                   </td>
//                   <td className="p-4 border-b border-blue-gray-50">
//                     <Chip
//                       value={getBMICategory(record.bmi, patientAge)}
//                       color={getBMICategoryColor(getBMICategory(record.bmi, patientAge))}
//                       size="sm"
//                     />
//                   </td>
//                   <td className="p-4 border-b border-blue-gray-50">
//                     <Button 
//                       variant="text" 
//                       color="red"
//                       onClick={() => onDelete(record._id)}
//                       disabled={loading}
//                     >
//                       <TrashIcon className="h-4 w-4" />
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </CardBody>
//     </Card>
    
//     <div className="mt-8">
//       <Typography variant="h5" color="blue-gray" className="mb-4">
//         BMI Categories
//       </Typography>
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         {BMI_CATEGORIES.map((category, index) => (
//           <Card key={index} className="border border-blue-gray-50">
//             <CardBody>
//               <Typography variant="h6" color={category.color}>
//                 {category.name}
//               </Typography>
//               <Typography variant="small" className="text-blue-gray-500">
//                 BMI {category.range}
//               </Typography>
//             </CardBody>
//           </Card>
//         ))}
//       </div>
//       <Typography variant="small" className="mt-4 text-blue-gray-500 italic">
//         Note: BMI categories may vary for children under 2 years old
//       </Typography>
//     </div>
//   </>
// );

// const EmptyGrowthState = ({ patientName, onAddRecord }) => (
//   <div className="text-center py-12">
//     <ChartBarIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
//     <Typography variant="h5" color="blue-gray" className="mb-2">
//       No Growth Records Found
//     </Typography>
//     <Typography variant="small" className="text-blue-gray-500 mb-6">
//       Start tracking {patientName}'s growth by adding a new record
//     </Typography>
//     <Button variant="gradient" onClick={onAddRecord}>
//       Add First Growth Record
//     </Button>
//   </div>
// );

// const PrescriptionCard = ({ prescription, onEdit, onDelete, onView, onExportPDF }) => {
//   const status = prescription.status || 
//     (prescription.endDate && new Date(prescription.endDate) < new Date()
//       ? PRESCRIPTION_STATUS.completed
//       : PRESCRIPTION_STATUS.active);

//   const statusColor = status === PRESCRIPTION_STATUS.active
//     ? "green"
//     : status === PRESCRIPTION_STATUS.completed
//       ? "blue"
//       : "red";

//   return (
//     <Card className="border border-blue-gray-50 hover:shadow-md transition-shadow">
//       <CardHeader className="bg-blue-50 p-4 flex justify-between items-center">
//         <Typography variant="h5" color="blue-gray">
//           {prescription.medication}
//         </Typography>
//         <Chip value={status} color={statusColor} size="sm" />
//       </CardHeader>
//       <CardBody className="p-4">
//         <div className="space-y-3">
//           <div className="flex justify-between">
//             <Typography variant="small" className="font-semibold text-blue-gray-500">
//               Dosage:
//             </Typography>
//             <Typography>{prescription.dosage}</Typography>
//           </div>
          
//           <div className="flex justify-between">
//             <Typography variant="small" className="font-semibold text-blue-gray-500">
//               Frequency:
//             </Typography>
//             <Typography>{prescription.frequency}</Typography>
//           </div>
          
//           <div className="flex justify-between">
//             <Typography variant="small" className="font-semibold text-blue-gray-500">
//               Start Date:
//             </Typography>
//             <Typography>{formatDate(prescription.startDate)}</Typography>
//           </div>
          
//           {prescription.endDate && (
//             <div className="flex justify-between">
//               <Typography variant="small" className="font-semibold text-blue-gray-500">
//                 End Date:
//               </Typography>
//               <Typography>{formatDate(prescription.endDate)}</Typography>
//             </div>
//           )}
          
//           {prescription.notes && (
//             <div>
//               <Typography variant="small" className="font-semibold text-blue-gray-500">
//                 Notes:
//               </Typography>
//               <Typography className="text-sm">{prescription.notes}</Typography>
//             </div>
//           )}
//         </div>
//       </CardBody>
//       <CardFooter className="flex justify-end gap-2 p-4 pt-0">
//         <Button variant="text" size="sm" onClick={onView}>
//           View
//         </Button>
//        <Button 
//   variant="text" 
//   color="green" 
//   size="sm" 
//   onClick={() => onExportPDF(prescription)}
//   className="flex items-center gap-1"
// >
//   <DocumentArrowDownIcon className="h-4 w-4" />
//   Export PDF
// </Button>

//         <Button variant="text" color="blue" size="sm" onClick={onEdit}>
//           Edit
//         </Button>
//         <Button variant="text" color="red" size="sm" onClick={onDelete}>
//           Delete
//         </Button>
//       </CardFooter>
//     </Card>
//   );
// };
// const EmptyPrescriptionsState = ({ patientName, onAddPrescription }) => (
//   <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
//     <DocumentTextIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
//     <Typography variant="h5" color="blue-gray" className="mb-2">
//       No Prescriptions Found
//     </Typography>
//     <Typography variant="small" className="text-blue-gray-500 mb-6 max-w-md mx-auto">
//       {patientName} doesn't have any prescriptions yet. Add the first prescription to get started.
//     </Typography>
//     <Button variant="gradient" onClick={onAddPrescription}>
//       Add First Prescription
//     </Button>
//   </div>
// );

// const DocumentUploadModal = ({ 
//   open, 
//   onClose, 
//   formData, 
//   setFormData, 
//   onSubmit, 
//   loading 
// }) => (
//   <Dialog open={open} handler={onClose}>
//     <DialogHeader>Upload Document</DialogHeader>
//     <DialogBody>
//       <div className="space-y-4">
//         <Input
//           label="Document Title"
//           value={formData.title}
//           onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
//           required
//         />
//         <div>
//           <Typography variant="small" className="mb-2">
//             Select File
//           </Typography>
//           <input
//             type="file"
//             onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files[0] }))}
//             className="w-full p-2 border rounded"
//             required
//           />
//         </div>
//       </div>  
//     </DialogBody>
//     <DialogFooter>
//       <Button variant="text" onClick={onClose} className="mr-2">
//         Cancel
//       </Button>
//       <Button 
//         variant="gradient" 
//         color="blue" 
//         onClick={onSubmit}
//         disabled={loading || !formData.title || !formData.file}
//       >
//         {loading ? "Uploading..." : "Upload Document"}
//       </Button>
//     </DialogFooter>
//   </Dialog>
// );

// const DeleteDocumentModal = ({ 
//   open, 
//   onClose, 
//   document, 
//   onConfirm, 
//   loading 
// }) => (
//   <Dialog open={open} handler={onClose}>
//     <DialogHeader>Delete Document</DialogHeader>
//     <DialogBody>
//       <Typography variant="small" className="text-red-500">
//         Are you sure you want to delete the document "{document?.title}"? 
//         This action cannot be undone.
//       </Typography>
//     </DialogBody>
//     <DialogFooter>
//       <Button variant="text" onClick={onClose} className="mr-2">
//         Cancel
//       </Button>
//       <Button 
//         variant="gradient" 
//         color="red" 
//         onClick={onConfirm}
//         disabled={loading}
//       >
//         {loading ? "Deleting..." : "Delete Document"}
//       </Button>
//     </DialogFooter>
//   </Dialog>
// );

// const PrescriptionModal = ({ 
//   open, 
//   onClose, 
//   formData, 
//   setFormData, 
//   onSubmit, 
//   isValid, 
//   loading, 
//   isEdit,
//   commonMedications
// }) => {
//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   return (
//     <Dialog open={open} handler={onClose} size="md">
//       <DialogHeader>{isEdit ? "Edit Prescription" : "Add New Prescription"}</DialogHeader>
//       <DialogBody divider>
//         <div className="grid gap-6">
//           <div>
//             <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
//               Medication *
//             </Typography>
//             <Input
//               list="medications"
//               value={formData.medication}
//               onChange={(e) => handleInputChange('medication', e.target.value)}
//               label="Medication Name"
//             />
//             <datalist id="medications">
//               {commonMedications.map((med, index) => (
//                 <option key={index} value={med} />
//               ))}
//             </datalist>
//           </div>
          
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
//                 Dosage *
//               </Typography>
//               <Input
//                 value={formData.dosage}
//                 onChange={(e) => handleInputChange('dosage', e.target.value)}
//                 label="e.g., 500mg"
//               />
//             </div>
            
//             <div>
//               <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
//                 Frequency *
//               </Typography>
//               <Select
//                 value={formData.frequency}
//                 onChange={(val) => handleInputChange('frequency', val)}
//                 label="Select Frequency"
//               >
//                 <Option value="Once daily">Once daily</Option>
//                 <Option value="Twice daily">Twice daily</Option>
//                 <Option value="Three times daily">Three times daily</Option>
//                 <Option value="Four times daily">Four times daily</Option>
//                 <Option value="As needed">As needed</Option>
//                 <Option value="Other">Other</Option>
//               </Select>
//             </div>
//           </div>
          
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
//                 Start Date *
//               </Typography>
//               <Input
//                 type="date"
//                 value={formData.startDate}
//                 onChange={(e) => handleInputChange('startDate', e.target.value)}
//                 label="Start Date"
//               />
//             </div>
            
//             <div>
//               <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
//                 End Date (Optional)
//               </Typography>
//               <Input
//                 type="date"
//                 value={formData.endDate}
//                 onChange={(e) => handleInputChange('endDate', e.target.value)}
//                 label="End Date"
//                 min={formData.startDate}
//               />
//             </div>
//           </div>
          
//           <div>
//             <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
//               Notes (Optional)
//             </Typography>
//             <Input
//               value={formData.notes}
//               onChange={(e) => handleInputChange('notes', e.target.value)}
//               label="Additional instructions"
//             />
//           </div>
//         </div>
//       </DialogBody>
//       <DialogFooter>
//         <Button
//           variant="text"
//           color="red"
//           onClick={onClose}
//           className="mr-1"
//           disabled={loading}
//         >
//           Cancel
//         </Button>
//         <Button 
//           variant="gradient" 
//           color="green" 
//           onClick={onSubmit}
//           disabled={!isValid || loading}
//         >
//           {loading ? "Saving..." : (isEdit ? "Update" : "Add Prescription")}
//         </Button>
//       </DialogFooter>
//     </Dialog>
//   );
// };

// const ViewPrescriptionModal = ({ open, onClose, prescription, onExportPDF }) => {
//   if (!prescription) return null;
  
//   const status = prescription.status || 
//     (prescription.endDate && new Date(prescription.endDate) < new Date()
//       ? PRESCRIPTION_STATUS.completed
//       : PRESCRIPTION_STATUS.active);

//   const statusColor = status === PRESCRIPTION_STATUS.active 
//     ? "green" 
//     : status === PRESCRIPTION_STATUS.completed 
//       ? "blue" 
//       : "red";

//   return (
//     <Dialog open={open} handler={onClose} size="lg">
//       <DialogHeader className="flex justify-between items-center">
//         <div>Prescription Details</div>
//         <Button 
//           variant="gradient" 
//           color="blue" 
//           size="sm"
//           onClick={() => onExportPDF(prescription)}
//           className="flex items-center gap-1"
//         >
//           <DocumentArrowDownIcon className="h-4 w-4" />
//           Export PDF
//         </Button>
//       </DialogHeader>
//       <DialogBody divider>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           <div className="space-y-4">
//             <div className="flex justify-between items-center">
//               <Typography variant="h4" color="blue-gray">
//                 {prescription.medication}
//               </Typography>
//               <Chip value={status} color={statusColor} size="md" />
//             </div>
            
//             <div className="space-y-3">
//               <div className="flex justify-between">
//                 <Typography variant="small" className="font-semibold text-blue-gray-500">
//                   Dosage:
//                 </Typography>
//                 <Typography>{prescription.dosage}</Typography>
//               </div>
              
//               <div className="flex justify-between">
//                 <Typography variant="small" className="font-semibold text-blue-gray-500">
//                   Frequency:
//                 </Typography>
//                 <Typography>{prescription.frequency}</Typography>
//               </div>
              
//               <div className="flex justify-between">
//                 <Typography variant="small" className="font-semibold text-blue-gray-500">
//                   Start Date:
//                 </Typography>
//                 <Typography>{formatDate(prescription.startDate)}</Typography>
//               </div>
              
//               {prescription.endDate && (
//                 <div className="flex justify-between">
//                   <Typography variant="small" className="font-semibold text-blue-gray-500">
//                     End Date:
//                   </Typography>
//                   <Typography>{formatDate(prescription.endDate)}</Typography>
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {prescription.notes && (
//             <div className="border-l pl-6">
//               <Typography variant="h6" color="blue-gray" className="mb-2">
//                 Additional Notes
//               </Typography>
//               <div className="bg-blue-50 p-4 rounded-lg">
//                 <Typography className="whitespace-pre-line">
//                   {prescription.notes}
//                 </Typography>
//               </div>
//             </div>
//           )}
//         </div>
//       </DialogBody>
//       <DialogFooter>
//         <Button variant="gradient" onClick={onClose}>
//           Close
//         </Button>
//       </DialogFooter>
//     </Dialog>
//   );
// };
// const DeletePrescriptionModal = ({ 
//   open, 
//   onClose, 
//   prescription, 
//   onConfirm, 
//   loading 
// }) => (
//   <Dialog open={open} handler={onClose}>
//     <DialogHeader>Delete Prescription</DialogHeader>
//     <DialogBody divider>
//       <Typography variant="small" className="text-red-500">
//         Are you sure you want to delete the prescription for {prescription?.medication}? 
//         This action cannot be undone.
//       </Typography>
//     </DialogBody>
//     <DialogFooter>
//       <Button
//         variant="text"
//         color="red"
//         onClick={onClose}
//         className="mr-1"
//         disabled={loading}
//       >
//         Cancel
//       </Button>
//       <Button 
//         variant="gradient" 
//         color="red" 
//         onClick={onConfirm}
//         disabled={loading}
//       >
//         {loading ? "Deleting..." : "Delete Prescription"}
//       </Button>
//     </DialogFooter>
//   </Dialog>
// );

// const VaccinationModal = ({ 
//   open, 
//   onClose, 
//   title, 
//   formData, 
//   updateField, 
//   onSubmit, 
//   isValid, 
//   loading, 
//   isEdit = false 
// }) => (
//   <Dialog open={open} handler={onClose}>
//     <DialogHeader>{title}</DialogHeader>
//     <DialogBody divider>
//       <div className="grid gap-6">
//         <Input
//           label="Vaccine Name"
//           value={formData.vaccine}
//           onChange={(e) => updateField('vaccine', e.target.value)}
//           required
//         />
        
//         <Input
//           label="Due Date"
//           type="date"
//           value={formData.dueDate}
//           onChange={(e) => updateField('dueDate', e.target.value)}
//           required
//         />
        
//         <Select
//           label="Status"
//           value={formData.status}
//           onChange={(val) => updateField('status', val)}
//         >
//           <Option value="pending">Pending</Option>
//           <Option value="done">Administered</Option>
//         </Select>
        
//         {formData.status === "done" && (
//           <Input
//             label="Date Administered"
//             type="date"
//             value={formData.dateAdministered}
//             onChange={(e) => updateField('dateAdministered', e.target.value)}
//             required={formData.status === "done"}
//           />
//         )}
//       </div>
//     </DialogBody>
//     <DialogFooter>
//       <Button
//         variant="text"
//         color="red"
//         onClick={onClose}
//         className="mr-1"
//         disabled={loading}
//       >
//         Cancel
//       </Button>
//       <Button 
//         variant="gradient" 
//         color="green" 
//         onClick={onSubmit}
//         disabled={!isValid || loading}
//       >
//         {loading ? "Processing..." : (isEdit ? "Update" : "Create")}
//       </Button>
//     </DialogFooter>
//   </Dialog>
// );

// const GrowthModal = ({ 
//   open, 
//   onClose, 
//   formData, 
//   updateField, 
//   onSubmit, 
//   isValid, 
//   loading, 
//   patientAge 
// }) => {
//   const calculatedBMI = useMemo(() => 
//     calculateBMI(formData.weight, formData.height), 
//     [formData.weight, formData.height]
//   );
  
//   const bmiCategory = useMemo(() => 
//     getBMICategory(calculatedBMI, patientAge), 
//     [calculatedBMI, patientAge]
//   );

//   return (
//     <Dialog open={open} handler={onClose}>
//       <DialogHeader>Add Growth Record</DialogHeader>
//       <DialogBody divider>
//         <div className="grid gap-6">
//           <div className="grid grid-cols-2 gap-4">
//             <Input
//               label="Height (cm)"
//               type="number"
//               value={formData.height}
//               onChange={(e) => updateField('height', e.target.value)}
//               required
//               min="0"
//               step="0.1"
//             />
            
//             <Input
//               label="Weight (kg)"
//               type="number"
//               value={formData.weight}
//               onChange={(e) => updateField('weight', e.target.value)}
//               required
//               min="0"
//               step="0.1"
//             />
//           </div>
          
//           <Input
//             label="Date"
//             type="date"
//             value={formData.growthDate}
//             onChange={(e) => updateField('growthDate', e.target.value)}
//             required
//           />
          
//           {formData.height && formData.weight && (
//             <div className="mt-4 p-4 bg-blue-50 rounded-lg">
//               <Typography variant="h6" color="blue-gray">
//                 BMI Calculation
//               </Typography>
//               <div className="mt-2 grid grid-cols-2 gap-4">
//                 <div>
//                   <Typography variant="small" className="font-semibold text-blue-gray-500">
//                     BMI Value:
//                   </Typography>
//                   <Typography variant="lead">
//                     {calculatedBMI}
//                   </Typography>
//                 </div>
//                 <div>
//                   <Typography variant="small" className="font-semibold text-blue-gray-500">
//                     Category:
//                   </Typography>
//                   <Chip
//                     value={bmiCategory}
//                     color={getBMICategoryColor(bmiCategory)}
//                     size="md"
//                   />
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </DialogBody>
//       <DialogFooter>
//         <Button
//           variant="text"
//           color="red"
//           onClick={onClose}
//           className="mr-1"
//           disabled={loading}
//         >
//           Cancel
//         </Button>
//         <Button 
//           variant="gradient" 
//           color="green" 
//           onClick={onSubmit}
//           disabled={!isValid || loading}
//         >
//           {loading ? "Adding..." : "Add Record"}
//         </Button>
//       </DialogFooter>
//     </Dialog>
//   );
// };

// const ViewVaccinationModal = ({ 
//   open, 
//   onClose, 
//   vaccination, 
//   onScheduleNext, 
//   onExportPDF 
// }) => (
//   <Dialog open={open} handler={onClose}>
//     <DialogHeader>Vaccination Details</DialogHeader>
//     <DialogBody divider>
//       {vaccination && (
//         <div className="space-y-4">
//           <div className="flex justify-between">
//             <Typography variant="h6" color="blue-gray">
//               {vaccination.vaccine}
//             </Typography>
//             <Chip
//               value={vaccination.status}
//               color={getStatusColor(vaccination.status)}
//               size="md"
//             />
//           </div>
          
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <Typography variant="small" className="font-semibold text-blue-gray-500">
//                 Due Date:
//               </Typography>
//               <Typography>
//                 {formatDate(vaccination.dueDate)}
//               </Typography>
//             </div>
            
//             {vaccination.dateAdministered && (
//               <div>
//                 <Typography variant="small" className="font-semibold text-blue-gray-500">
//                   Administered:
//                 </Typography>
//                 <Typography>
//                   {formatDate(vaccination.dateAdministered)}
//                 </Typography>
//               </div>
//             )}
            
//             <div>
//               <Typography variant="small" className="font-semibold text-blue-gray-500">
//                 Status:
//               </Typography>
//               <Typography>
//                 {vaccination.status.charAt(0).toUpperCase() + vaccination.status.slice(1)}
//               </Typography>
//             </div>
            
//             {vaccination.notes && (
//               <div className="col-span-2">
//                 <Typography variant="small" className="font-semibold text-blue-gray-500">
//                   Notes:
//                 </Typography>
//                 <Typography>
//                   {vaccination.notes}
//                 </Typography>
//               </div>
//             )}
//           </div>
          
//           {vaccination.status === "done" && (
//             <div className="mt-4">
//               <Button 
//                 variant="gradient" 
//                 fullWidth
//                 onClick={() => onScheduleNext(vaccination)}
//               >
//                 Schedule Next Dose
//               </Button>
//             </div>
//           )}
//         </div>
//       )}
//     </DialogBody>
//     <DialogFooter>
//      <Button 
//   variant="text" 
//   color="green" 
//   size="sm" 
//   onClick={() => onExportPDF(prescription)}
//   className="flex items-center gap-1"
// >
//   <DocumentArrowDownIcon className="h-4 w-4" />
//   Export PDF
// </Button>
//       <Button 
//         variant="outlined" 
//         onClick={onClose}
//       >
//         Close
//       </Button>
//     </DialogFooter>
//   </Dialog>
// );

// const DeleteConfirmationModal = ({ 
//   open, 
//   onClose, 
//   vaccination, 
//   onConfirm, 
//   loading 
// }) => (
//   <Dialog open={open} handler={onClose}>
//     <DialogHeader>Delete Vaccination Record</DialogHeader>
//     <DialogBody divider>
//       <Typography variant="small" className="text-red-500">
//         Are you sure you want to delete the vaccination record for {vaccination?.vaccine}? 
//         This action cannot be undone.
//       </Typography>
//     </DialogBody>
//     <DialogFooter>
//       <Button
//         variant="text"
//         color="red"
//         onClick={onClose}
//         className="mr-1"
//         disabled={loading}
//       >
//         Cancel
//       </Button>
//       <Button 
//         variant="gradient" 
//         color="red" 
//         onClick={onConfirm}
//         disabled={loading}
//       >
//         {loading ? "Deleting..." : "Delete"}
//       </Button>
//     </DialogFooter>
//   </Dialog>
// );













// // Main component
// export function PatientDetail() {
//   const { id } = useParams();
//   const { state } = useLocation();
//   const navigate = useNavigate();

  
//   // State management
//   const [activeTab, setActiveTab] = useState("overview");
//   const [selectedVaccination, setSelectedVaccination] = useState(null);
//   const [selectedPrescription, setSelectedPrescription] = useState(null);
//   const [selectedDocument, setSelectedDocument] = useState(null);
//   const [vaccinations, setVaccinations] = useState(state?.vaccinations || []);
//   const [growthRecords, setGrowthRecords] = useState([]);
//   const [prescriptions, setPrescriptions] = useState([]);
//   const [documents, setDocuments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);


    
//   const [clinicLogo, setClinicLogo] = useState('/img/default-logo.png');

//       const doctorLogo = async () => {
//         console.log('Fetching doctor logo...');
//     try {
    
//       const response = await getLogo();
//       console.log('Doctor logo fetched successfully:', response.logo);
//       setClinicLogo(`http://localhost:3005/${response.logo}`);
//     } catch (error) {
//       console.error('Error fetching clinic logo:', error);
//       setClinicLogo('/img/default-logo.png'); // Fallback logo
//     }
//   };

//   useEffect(() => {
//     doctorLogo();
//     console.log('Clinic logo set to:', clinicLogo);
//   }, []);
  
//   // Form state management
//   const [vaccinationForm, setVaccinationForm] = useState({
//     vaccine: "",
//     dueDate: "",
//     status: "pending",
//     dateAdministered: ""
//   });

//   const [growthForm, setGrowthForm] = useState({
//     height: "",
//     weight: "",
//     growthDate: ""
//   });

//   const [prescriptionForm, setPrescriptionForm] = useState({
//     medication: "",
//     dosage: "",
//     frequency: "",
//     startDate: new Date().toISOString().split('T')[0],
//     endDate: "",
//     notes: ""
//   });

//   const [documentForm, setDocumentForm] = useState({
//     title: "",
//     file: null,
//   });

//   // Appointment states
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [selectedTime, setSelectedTime] = useState(null);
//   const [appointmentForm, setAppointmentForm] = useState({
//     doctor: "",
//     type: "",
//     date: "",
//     time: "",
//     notes: "",
//     reason: ""
//   });
//   const [appointments, setAppointments] = useState([]);
  
//   // Appointment management states
//   const [appointmentMode, setAppointmentMode] = useState('create');
//   const [selectedAppointmentToEdit, setSelectedAppointmentToEdit] = useState(null);
//   const [appointmentToDelete, setAppointmentToDelete] = useState(null);
//   const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
//   // Filter and sort state
//   const [filters, setFilters] = useState({
//     status: "all",
//     sortField: "dueDate",
//     sortDirection: "asc"
//   });
  
//   // Modal state
//   const [modals, setModals] = useState({
//     create: false,
//     edit: false,
//     delete: false,
//     view: false,
//     growth: false,
//     prescription: false,
//     viewPrescription: false,
//     deletePrescription: false,
//     appointment: false,
//     uploadDocument: false,
//     deleteDocument: false
//   });

//   // Validation
//   const isGrowthFormValid = useMemo(() => {
//     const { height, weight, growthDate } = growthForm;
//     return (
//       height && weight && growthDate &&
//       !isNaN(parseFloat(height)) &&
//       !isNaN(parseFloat(weight)) &&
//       parseFloat(height) > 0 &&
//       parseFloat(weight) > 0
//     );
//   }, [growthForm]);

//   const isPrescriptionFormValid = useMemo(() => {
//     const { medication, dosage, frequency, startDate } = prescriptionForm;
//     return (
//       medication.trim() !== "" &&
//       dosage.trim() !== "" &&
//       frequency.trim() !== "" &&
//       startDate.trim() !== ""
//     );
//   }, [prescriptionForm]);

//   const isVaccinationFormValid = useMemo(() => {
//     const { vaccine, dueDate, status, dateAdministered } = vaccinationForm;
//     return (
//       vaccine.trim() !== "" &&
//       dueDate.trim() !== "" &&
//       (status !== "done" || dateAdministered.trim() !== "")
//     );
//   }, [vaccinationForm]);

//   // Handle case when accessed directly without state
//   if (!state?.patient) {
//     return (
//       <div className="p-4 text-center">
//         <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
//           Patient information not found. Please navigate from the patients list.
//         </Alert>
//         <Button onClick={() => navigate('/patients')} className="mt-4">
//           Return to patients list
//         </Button>
//       </div>
//     );
//   }
  
//   // Process patient data
//   const { patient } = state;


//   // Patient data processing
//   const patientAge = patient.age ? parseInt(patient.age) : 0;
  
//   const patientData = useMemo(() => ({
//     name: `${patient.firstName} ${patient.lastName}`,
//     avatar: patient.img || "/img/default-avatar.jpg",
//     age: patient.age || "Not specified",
//     gender: patient.gender || "Not specified",
//     bloodType: patient.bloodType || "Not specified",
//     phoneNumber: patient.parent?.phoneNumber || "Not specified",
//     email: patient.parent?.email || "Not specified",
//     address: patient.parent?.address || "Not specified",
//     emergencyContact: patient.parent?.fullName || "Not specified",
//     allergies: patient.allergies || "None specified",
//     chronicConditions: patient.chronicConditions || "None specified",
//   }), [patient]);
  
//   // Process appointments data
//   const processedAppointments = useMemo(() =>
//     (patient.appointments || []).map(appointment => ({
//       _id: appointment._id,
//       name: appointment.doctor || "Medical Staff",
//       message: `Appointment for ${appointment.type || "check-up"}`,
//       time: appointment.date ? formatDate(appointment.date) : "No date specified",
//       hour: appointment.time ? appointment.time : "No time specified",
//       date: appointment.date,
//       doctor: appointment.doctor,
//       type: appointment.type,
//       notes: appointment.notes,
//       reason: appointment.reason || appointment.notes
//     })),
//     [patient.appointments]
//   );

//   // Filter and sort vaccinations
//   const filteredVaccinations = useMemo(() => {
//     let result = [...vaccinations];

//     if (filters.status !== "all") {
//       result = result.filter(v => v.status === filters.status);
//     }

//     result.sort((a, b) => {
//       let comparison = 0;
//       switch (filters.sortField) {
//         case "vaccine":
//           comparison = a.vaccine.localeCompare(b.vaccine);
//           break;
//         case "status":
//           comparison = a.status.localeCompare(b.status);
//           break;
//         case "dueDate":
//         default:
//           comparison = new Date(a.dueDate) - new Date(b.dueDate);
//           break;
//       }
//       return filters.sortDirection === "asc" ? comparison : -comparison;
//     });

//     return result;
//   }, [vaccinations, filters]);

//   // API functions
//   const fetchDocuments = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.get(`/documents/patient/${id}`);
//       setDocuments(response.data);
//     } catch (error) {
//       console.error('Error fetching documents:', error);
//       toast.error('Failed to load documents');
//     } finally {
//       setLoading(false);
//     }
//   }, [id]);

//   const uploadDocument = useCallback(async () => {
//     if (!documentForm.title || !documentForm.file) return;
    
//     try {
//       setLoading(true);
//       const formData = new FormData();
//       formData.append('file', documentForm.file);
//       formData.append('patientId', id);
//       formData.append('title', documentForm.title);
      
//       const response = await axiosInstance.post('/documents/upload', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
      
//       setDocuments(prev => [...prev, response.data]);
//       setModals(prev => ({ ...prev, uploadDocument: false }));
//       setDocumentForm({ title: "", file: null });
//       toast.success('Document uploaded successfully!');
//     } catch (error) {
//       console.error('Error uploading document:', error);
//       toast.error('Failed to upload document');
//     } finally {
//       setLoading(false);
//     }
//   }, [documentForm, id]);

//   const deleteDocument = useCallback(async () => {
//     if (!selectedDocument) return;
    
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/documents/${selectedDocument._id}`);
//       setDocuments(prev => prev.filter(doc => doc._id !== selectedDocument._id));
//       setModals(prev => ({ ...prev, deleteDocument: false }));
//       toast.success('Document deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting document:', error);
//       toast.error('Failed to delete document');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedDocument]);

//   const fetchGrowthRecords = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.get(`/growth-records/${id}`);
//       setGrowthRecords(response.data);
//       setError(null);
//     } catch (error) {
//       console.error('Error fetching growth records:', error);
//       setError('Failed to load growth records');
//       toast.error('Failed to load growth records');
//     } finally {
//       setLoading(false);
//     }
//   }, [id]);

//   const fetchPrescriptions = useCallback(async () => {
//     try {
//       setLoading(true);
//       const patientId = id || state?.patient?._id;
//       const response = await axiosInstance.get(`/prescriptions/${patientId}`);
//       setPrescriptions(response.data);
//     } catch (error) {
//       console.error('Error fetching prescriptions:', error);
//       toast.error('Failed to load prescriptions');
//     } finally {
//       setLoading(false);
//     }
//   }, [id, state?.patient?._id]);

//     const baseURL = import.meta.env.VITE_API_BASE_URL;

//   const fetchAppointments = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.get(`/appointments`);
//       setAppointments(response.data);
//     } catch (error) {
//       console.error('Error fetching appointments:', error);
//       toast.error('Failed to load appointments');
//     } finally {
//       setLoading(false);
//     }
//   }, [id]);
  
//   // Vaccination API functions
//   const createVaccination = useCallback(async () => {
//     if (!isVaccinationFormValid) return;
    
//     try {
//       setLoading(true);
//       const response = await axiosInstance.post('/vaccinations', {
//         patientId: id,
//         ...vaccinationForm,
//         dueDate: new Date(vaccinationForm.dueDate).toISOString(),
//         dateAdministered: vaccinationForm.status === 'done' 
//           ? new Date(vaccinationForm.dateAdministered).toISOString() 
//           : null
//       });
      
//       setVaccinations(prev => [...prev, response.data]);
//       setModals(prev => ({ ...prev, create: false }));
//       setVaccinationForm({
//         vaccine: "",
//         dueDate: "",
//         status: "pending",
//         dateAdministered: ""
//       });
//       toast.success('Vaccination created successfully!');
//     } catch (error) {
//       console.error('Error creating vaccination:', error);
//       toast.error('Failed to create vaccination');
//     } finally {
//       setLoading(false);
//     }
//   }, [vaccinationForm, isVaccinationFormValid, id]);
  
//   const updateVaccination = useCallback(async () => {
//     if (!selectedVaccination || !isVaccinationFormValid) return;
    
//     try {
//       setLoading(true);
//       const response = await axiosInstance.put(`/vaccinations/${selectedVaccination._id}`, {
//         ...vaccinationForm,
//         dueDate: new Date(vaccinationForm.dueDate).toISOString(),
//         dateAdministered: vaccinationForm.status === 'done' 
//           ? new Date(vaccinationForm.dateAdministered).toISOString() 
//           : null
//       });
      
//       setVaccinations(prev =>
//         prev.map(v => v._id === selectedVaccination._id ? response.data : v)
//       );
//       setModals(prev => ({ ...prev, edit: false }));
//       toast.success('Vaccination updated successfully!');
//     } catch (error) {
//       console.error('Error updating vaccination:', error);
//       toast.error('Failed to update vaccination');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedVaccination, vaccinationForm, isVaccinationFormValid]);
  
//   const deleteVaccination = useCallback(async () => {
//     if (!selectedVaccination) return;
    
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/vaccinations/${selectedVaccination._id}`);
//       setVaccinations(prev => prev.filter(v => v._id !== selectedVaccination._id));
//       setModals(prev => ({ ...prev, delete: false }));
//       toast.success('Vaccination deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting vaccination:', error);
//       toast.error('Failed to delete vaccination');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedVaccination]);
  
//   const addGrowthRecord = useCallback(async () => {
//     if (!isGrowthFormValid) return;
    
//     try {
//       setLoading(true);
//       const bmi = calculateBMI(growthForm.weight, growthForm.height);
//       const response = await axiosInstance.post('/growth-records', {
//         patientId: id,
//         heightCm: parseFloat(growthForm.height),
//         weightKg: parseFloat(growthForm.weight),
//         date: new Date(growthForm.growthDate).toISOString()
//       });
      
//       setGrowthRecords(prev => [...prev, response.data]);
//       setModals(prev => ({ ...prev, growth: false }));
//       setGrowthForm({
//         height: "",
//         weight: "",
//         growthDate: ""
//       });
//       toast.success('Growth record added successfully!');
//     } catch (error) {
//       console.error('Error adding growth record:', error);
//       toast.error('Failed to add growth record');
//     } finally {
//       setLoading(false);
//     }
//   }, [growthForm, isGrowthFormValid, id]);
  
//   const deleteGrowthRecord = useCallback(async (recordId) => {
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/growth-records/${recordId}`);
//       setGrowthRecords(prev => prev.filter(record => record._id !== recordId));
//       toast.success('Growth record deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting growth record:', error);
//       toast.error('Failed to delete growth record');
//     } finally {
//       setLoading(false);
//     }
//   }, []);
  
//   // Prescription API functions
//   const addPrescription = useCallback(async () => {
//     if (!isPrescriptionFormValid) return;
    
//     try {
//       setLoading(true);
//       const payload = {
//         patientId: id,
//         ...prescriptionForm,
//         status: prescriptionForm.endDate && new Date(prescriptionForm.endDate) < new Date() 
//           ? PRESCRIPTION_STATUS.completed 
//           : PRESCRIPTION_STATUS.active
//       };
      
//       const response = await axiosInstance.post('/prescriptions', payload);
//       setPrescriptions(prev => [...prev, response.data]);
//       setModals(prev => ({ ...prev, prescription: false }));
//       setPrescriptionForm({
//         medication: "",
//         dosage: "",
//         frequency: "",
//         startDate: new Date().toISOString().split('T')[0],
//         endDate: "",
//         notes: ""
//       });
//       toast.success('Prescription added successfully!');
//     } catch (error) {
//       console.error('Error adding prescription:', error);
//       toast.error('Failed to add prescription');
//     } finally {
//       setLoading(false);
//     }
//   }, [prescriptionForm, isPrescriptionFormValid, id]);

//   const updatePrescription = useCallback(async () => {
//     if (!selectedPrescription || !isPrescriptionFormValid) return;
    
//     try {
//       setLoading(true);
//       const payload = {
//         ...prescriptionForm,
//         status: prescriptionForm.endDate && new Date(prescriptionForm.endDate) < new Date() 
//           ? PRESCRIPTION_STATUS.completed 
//           : PRESCRIPTION_STATUS.active
//       };
      
//       const response = await axiosInstance.patch(`/prescriptions/${selectedPrescription._id}`, payload);
//       setPrescriptions(prev => 
//         prev.map(p => p._id === selectedPrescription._id ? response.data : p)
//       );
//       setModals(prev => ({ ...prev, prescription: false }));
//       toast.success('Prescription updated successfully!');
//     } catch (error) {
//       console.error('Error updating prescription:', error);
//       toast.error('Failed to update prescription');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedPrescription, prescriptionForm, isPrescriptionFormValid]);

//   const deletePrescription = useCallback(async () => {
//     if (!selectedPrescription) return;
    
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/prescriptions/${selectedPrescription._id}`);
//       setPrescriptions(prev => prev.filter(p => p._id !== selectedPrescription._id));
//       setModals(prev => ({ ...prev, deletePrescription: false }));
//       toast.success('Prescription deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting prescription:', error);
//       toast.error('Failed to delete prescription');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedPrescription]);

//   // Appointment handlers
//   const handleOpen = async (patientData) => {
//     setSelectedPatient(patientData);
//     setModals(prev => ({ ...prev, appointment: true }));
//     setAppointmentMode('create');
//     setSelectedAppointmentToEdit(null);
//     setSelectedDate(null);
//     setSelectedTime(null);

//     setAppointmentForm({
//       doctor: "",
//       type: "",
//       date: "",
//       time: "",
//       notes: "",
//       reason: ""
//     });

//     try {
//       await fetchAppointments();
//       setSelectedPatient(patientData);
//       setModals(prev => ({ ...prev, appointment: true }));
//       setAppointmentMode('create');
//       setSelectedAppointmentToEdit(null);
//       setSelectedDate(null);
//       setSelectedTime(null);
//     } catch (error) {
//       console.error('Error fetching appointments:', error);
//       toast.error('Failed to load appointment data');
//     }
//   };

//   const handleEditAppointment = (appointmentToEdit) => {
//     setAppointmentMode('update');
//     setSelectedAppointmentToEdit(appointmentToEdit);
    
//     // Pre-fill form with existing data
//     const appointmentDate = new Date(appointmentToEdit.date);
//     setSelectedDate(appointmentDate);
//     setSelectedTime(appointmentToEdit.hour);
    
//     setAppointmentForm({
//       doctor: appointmentToEdit.doctor || "",
//       type: appointmentToEdit.type || "",
//       date: appointmentToEdit.date,
//       time: appointmentToEdit.hour,
//       notes: appointmentToEdit.notes || "",
//       reason: appointmentToEdit.reason || appointmentToEdit.notes || ""
//     });
    
//     setModals(prev => ({ ...prev, appointment: true }));
//   };

//   const handleDeleteAppointment = (appointmentToDelete) => {
//     setAppointmentToDelete(appointmentToDelete);
//     setDeleteConfirmOpen(true);
//   };

//   const confirmDeleteAppointment = async () => {
//     try {
//       setLoading(true);
      
//       await axiosInstance.delete(`/appointments/${appointmentToDelete._id}`);
      
//       toast.success('Appointment deleted successfully!');
      
//       // Refresh appointments
//       await fetchAppointments();
      
//       // Force refresh to show updated appointments
//       window.location.reload();
//     } catch (error) {
//       console.error('Error deleting appointment:', error);
//       toast.error('Failed to delete appointment');
//     } finally {
//       setLoading(false);
//       setDeleteConfirmOpen(false);
//       setAppointmentToDelete(null);
//     }
//   };

//   const handleAppointmentSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
    
//     try {
//       const appointmentData = {
//         patientId: selectedPatient?._id || patient._id,
//         date: selectedDate ? selectedDate.toISOString().split('T')[0] : appointmentForm.date,
//         time: selectedTime || appointmentForm.time,
//         reason: appointmentForm.reason,
//         type: appointmentForm.type || 'consultation',
//         doctor: appointmentForm.doctor || 'Dr. Default',
//         notes: appointmentForm.notes || appointmentForm.reason
//       };

//       let response;
//       if (appointmentMode === 'create') {
//         response = await axiosInstance.post('/appointments', appointmentData);
//         toast.success('Appointment created successfully!');
//       } else if (appointmentMode === 'update' && selectedAppointmentToEdit) {
//         response = await axiosInstance.put(`/appointments/${selectedAppointmentToEdit._id}`, appointmentData);
//         toast.success('Appointment updated successfully!');
//       }

//       if (response.status === 200 || response.status === 201) {
//         setModals(prev => ({ ...prev, appointment: false }));
        
//         // Refresh appointments
//         await fetchAppointments();
        
//         // Force refresh to show updated appointments
//         window.location.reload();
//       }
      
//     } catch (error) {
//       console.error('Error processing appointment:', error);
//       toast.error('Failed to process appointment');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const isTimeSlotBooked = (time) => {
//     if (!selectedDate) return false;
    
//     const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
//     // Check if time slot is already booked
//     const conflictingAppointment = appointments.find(appt => {
//       const apptDate = new Date(appt.date).toISOString().split('T')[0];
//       const isConflict = apptDate === selectedDateStr && appt.time === time;
      
//       // Exclude current appointment when editing
//       if (appointmentMode === 'update' && selectedAppointmentToEdit) {
//         return isConflict && appt._id !== selectedAppointmentToEdit._id;
//       }
      
//       return isConflict;
//     });

//     return !!conflictingAppointment;
//   };

//   const exportVaccinationPDF = useCallback((vaccination) => {
//     const doc = new jsPDF();

   
    
//     doc.setFontSize(18);
//     doc.setTextColor(40, 53, 147);
//     doc.text("VACCINATION RECORD", 105, 20, null, null, "center");
    
//     doc.setFontSize(12);
//     doc.setTextColor(0, 0, 0);
//     doc.text(`Patient: ${patientData.name}`, 20, 40);
//     doc.text(`Date of Birth: ${patientData.age}`, 20, 50);
    
//     doc.setFontSize(14);
//     doc.setTextColor(25, 118, 210);
//     doc.text(vaccination.vaccine, 20, 70);
    
//     doc.setFontSize(12);
//     doc.setTextColor(0, 0, 0);
//     doc.text(`Status: ${vaccination.status.toUpperCase()}`, 20, 85);
//     doc.text(`Due Date: ${formatDate(vaccination.dueDate)}`, 20, 95);
    
//     if (vaccination.dateAdministered) {
//       doc.text(`Administered: ${formatDate(vaccination.dateAdministered)}`, 20, 105);
//     }
    
//     doc.setFontSize(10);
//     doc.setTextColor(100);
//     doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 150);
//     doc.text("Official Vaccination Record - For Medical Use", 105, 160, null, null, "center");
    
//     doc.setDrawColor(200);
//     doc.rect(15, 15, 180, 150);
    
//     // Generate safe filename by replacing all non-alphanumeric characters with underscores
//     const safeName = (patientData.name || 'patient').replace(/[^a-z0-9]/gi, '_').toLowerCase();
//     const safeVaccine = (vaccination.vaccine || 'vaccine').replace(/[^a-z0-9]/gi, '_').toLowerCase();
//     doc.save(`${safeName}_${safeVaccine}.pdf`);
//   }, [patientData.name]);



// // Updated exportPrescriptionPDF function
// const exportPrescriptionPDF = useCallback(async (prescription) => {
//   try {
//     const doc = new jsPDF('p', 'mm', 'a4');
    
//     // Define colors
//     const tealPrimary = [45, 150, 150];
//     const tealSecondary = [70, 180, 180];
//     const darkBlue = [25, 35, 85];
//     const lightGray = [240, 240, 240];
//     const mediumGray = [150, 150, 150];
//     const white = [255, 255, 255];
    
//     // Page dimensions
//     const pageWidth = 210;
//     const pageHeight = 297;
    
//     // === HEADER SECTION ===
//     // Main header background with gradient effect
//     doc.setFillColor(...tealPrimary);
//     doc.rect(0, 0, pageWidth, 45, 'F');
    
//     // Add curved design elements
//     doc.setFillColor(...tealSecondary);
//     for (let i = 0; i < 3; i++) {
//       doc.ellipse(pageWidth - 20, 20 + (i * 5), 25 + (i * 3), 15 + (i * 2), 'F');
//     }
    
//     // === LOGO SECTION ===
//     let logoAdded = false;
    
//     if (clinicLogo && clinicLogo !== '/img/default-logo.png') {
//       try {
//         console.log('Attempting to load logo:', clinicLogo);
        
//         let logoBase64;
        
//         // If it's already a data URL (base64), use it directly
//         if (clinicLogo.startsWith('data:')) {
//           logoBase64 = clinicLogo;
//         } 
//         // If it's a URL, convert it to base64
//         else {
//           logoBase64 = await convertImageToBase64(clinicLogo);
//         }
        
//         // Add the logo to PDF
//         doc.addImage(logoBase64, 'PNG', 8, 8, 20, 20);
//         logoAdded = true;
//         console.log('Logo successfully added to PDF');
        
//       } catch (logoError) {
//         console.warn('Could not load logo:', logoError);
//         // Will use fallback below
//       }
//     }
    
//     // Fallback: Medical cross icon if no logo was added
//     if (!logoAdded) {
//       doc.setFillColor(...white);
//       doc.rect(17, 12, 2, 8, 'F'); // Vertical bar
//       doc.rect(14, 15, 8, 2, 'F'); // Horizontal bar
//       console.log('Using fallback medical cross icon');
//     }
    
//     // Header text
//     doc.setTextColor(...white);
//     doc.setFont('helvetica', 'bold');
//     doc.setFontSize(14);
//     doc.text('MEDICAL CENTER', 35, 18);
    
//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(9);
//     doc.text('HEALTHCARE SERVICES', 35, 25);
    
//     // === DOCTOR INFORMATION SECTION ===
//     const doctorSectionY = 55;
    
//     // Doctor name
//     doc.setTextColor(...darkBlue);
//     doc.setFont('helvetica', 'bold');
//     doc.setFontSize(22);
//     doc.text('MD LISA BLOOM', pageWidth/2, doctorSectionY, { align: 'center' });
    
//     // Specialty
//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(11);
//     doc.setTextColor(100, 100, 100);
//     doc.text('ENDOCRINE DOCTOR', pageWidth/2, doctorSectionY + 8, { align: 'center' });
    
//     // ID Number
//     doc.setFontSize(10);
//     doc.text('ID No. 123456789', pageWidth/2, doctorSectionY + 15, { align: 'center' });
    
//     // === PATIENT INFORMATION SECTION ===
//     let currentY = doctorSectionY + 35;
    
//     // Helper function to create form fields
//     const createFormField = (label, value, x, y, width = 60) => {
//       doc.setTextColor(0, 0, 0);
//       doc.setFont('helvetica', 'normal');
//       doc.setFontSize(10);
//       doc.text(label, x, y);
      
//       // Underline
//       const labelWidth = doc.getTextWidth(label);
//       doc.setLineWidth(0.3);
//       doc.setDrawColor(...mediumGray);
//       doc.line(x + labelWidth + 2, y + 1, x + labelWidth + width, y + 1);
      
//       // Value
//       if (value) {
//         doc.setFont('helvetica', 'normal');
//         doc.setFontSize(9);
//         doc.text(value, x + labelWidth + 4, y - 1);
//       }
//     };
    
//     // Serial number and Date row
//     createFormField('S. No', '', 20, currentY, 50);
//     createFormField('Date', new Date().toLocaleDateString('en-GB'), 120, currentY, 50);
    
//     currentY += 12;
    
//     // Patient's name (full width)
//     createFormField("Patient's Name", patientData.name || '', 20, currentY, 150);
    
//     currentY += 12;
    
//     // Date of birth, Age, Gender row
//     createFormField('Date of birth', '', 20, currentY, 40);
//     createFormField('Age', patientData.age?.toString() || '', 80, currentY, 25);
//     createFormField('Gender', patientData.gender || '', 130, currentY, 40);
    
//     currentY += 25;
    
//     // === RX SECTION ===
//     // Large decorative Rx
//     doc.setFont('times', 'bold');
//     doc.setFontSize(48);
//     doc.setTextColor(...darkBlue);
//     doc.text('Rx:', 20, currentY);
    
//     // Add decorative underline for Rx
//     doc.setLineWidth(2);
//     doc.setDrawColor(...tealPrimary);
//     doc.line(20, currentY + 3, 55, currentY + 3);
    
//     currentY += 25;
    
//     // === PRESCRIPTION DETAILS ===
//     // Medication name (prominent)
//     doc.setFont('helvetica', 'bold');
//     doc.setFontSize(16);
//     doc.setTextColor(220, 38, 127); // Pink/magenta
//     doc.text(prescription.medication || 'Medication Name', 20, currentY);
    
//     currentY += 12;
    
//     // Dosage and frequency
//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(12);
//     doc.setTextColor(0, 0, 0);
//     const dosageText = `${prescription.dosage || ''} - ${prescription.frequency || ''}`;
//     doc.text(dosageText, 20, currentY);
    
//     currentY += 20;
    
//     // === INSTRUCTION SECTION ===
//     // Take instructions
//     doc.setFontSize(11);
//     doc.text('Take', 20, currentY);
    
//     // Dosage field
//     doc.setLineWidth(0.3);
//     doc.setDrawColor(...mediumGray);
//     doc.line(35, currentY + 1, 120, currentY + 1);
//     if (prescription.dosage) {
//       doc.setFontSize(10);
//       doc.text(prescription.dosage, 40, currentY - 1);
//     }
    
//     doc.setFontSize(11);
//     doc.text('times per', 125, currentY);
    
//     // Day/Week checkboxes
//     const checkboxSize = 3.5;
//     const checkboxY = currentY - 3;
    
//     // Day checkbox
//     doc.setLineWidth(0.5);
//     doc.setDrawColor(0, 0, 0);
//     doc.rect(155, checkboxY, checkboxSize, checkboxSize);
//     doc.text('Day', 162, currentY);
    
//     // Week checkbox  
//     doc.rect(180, checkboxY, checkboxSize, checkboxSize);
//     doc.text('Week', 187, currentY);
    
//     // Check appropriate box based on frequency
//     if (prescription.frequency?.toLowerCase().includes('daily') || 
//         prescription.frequency?.toLowerCase().includes('day')) {
//       doc.setFont('helvetica', 'bold');
//       doc.setFontSize(8);
//       doc.text('✓', 156, currentY - 0.5);
//     }
    
//     currentY += 15;
    
//     // === DAYS OF WEEK SECTION ===
//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(11);
//     doc.text('Days of the week', 20, currentY);
    
//     const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
//     let dayX = 65;
    
//     days.forEach((day, index) => {
//       // Checkbox
//       doc.rect(dayX, currentY - 3, checkboxSize, checkboxSize);
      
//       // Day label
//       doc.setFontSize(9);
//       doc.text(day, dayX + 5, currentY);
      
//       dayX += 22;
//     });
    
//     currentY += 15;
    
//     // === FREQUENCY TIMING SECTION ===
//     doc.setFontSize(11);
//     doc.text('Frequency', 20, currentY);
    
//     const timings = [
//       { label: 'Morning', x: 60 },
//       { label: 'Noon', x: 95 },
//       { label: 'Night', x: 125 }
//     ];
    
//     timings.forEach(timing => {
//       doc.rect(timing.x, currentY - 3, checkboxSize, checkboxSize);
//       doc.setFontSize(9);
//       doc.text(timing.label, timing.x + 5, currentY);
//     });
    
//     // Hour/time field
//     doc.setFontSize(11);
//     doc.text('Hour/time of the day', 155, currentY);
//     doc.setLineWidth(0.3);
//     doc.line(155, currentY + 1, 190, currentY + 1);
    
//     currentY += 20;
    
//     // === ADDITIONAL NOTES ===
//     if (prescription.notes && prescription.notes.trim()) {
//       doc.setFont('helvetica', 'bold');
//       doc.setFontSize(11);
//       doc.text('Special Instructions:', 20, currentY);
      
//       currentY += 8;
      
//       doc.setFont('helvetica', 'normal');
//       doc.setFontSize(10);
//       const noteLines = doc.splitTextToSize(prescription.notes, 170);
//       doc.text(noteLines, 20, currentY);
//       currentY += noteLines.length * 5 + 5;
//     }
    
//     // === PRESCRIPTION PERIOD ===
//     currentY += 10;
//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(9);
//     doc.setTextColor(...mediumGray);
//     const startDate = prescription.startDate ? formatDate(prescription.startDate) : 'N/A';
//     const endDate = prescription.endDate ? formatDate(prescription.endDate) : 'Ongoing';
//     doc.text(`Prescription Period: ${startDate} - ${endDate}`, 20, currentY);
    
//     // === SIGNATURE SECTION ===
//     currentY = Math.max(currentY + 20, 220); // Ensure minimum space
    
//     doc.setTextColor(0, 0, 0);
//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(11);
//     doc.text("Doctor's Signature", 20, currentY);
    
//     // Signature line
//     doc.setLineWidth(0.5);
//     doc.setDrawColor(0, 0, 0);
//     doc.line(20, currentY + 8, 80, currentY + 8);
    
//     // Date line
//     doc.text('Date', 120, currentY);
//     doc.line(120, currentY + 8, 160, currentY + 8);
//     doc.setFontSize(9);
//     doc.text(new Date().toLocaleDateString('en-GB'), 125, currentY + 6);
    
//     // === FOOTER ===
//     const footerY = pageHeight - 20;
    
//     // Footer background
//     doc.setFillColor(...tealPrimary);
//     doc.rect(0, footerY - 8, pageWidth, 20, 'F');
    
//     // Footer content
//     doc.setTextColor(...white);
//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(9);
    
//     // Address
//     doc.text('123, Lorem Ipsum St.', 20, footerY);
    
//     // Clinic name (centered)
//     doc.text('MEDICAL CARE CLINIC NAME', pageWidth/2, footerY, { align: 'center' });
    
//     // Phone
//     doc.text('+00 123 456 789', pageWidth - 20, footerY, { align: 'right' });
    
//     // === DECORATIVE ELEMENTS ===
//     // Add subtle watermark
//     doc.setTextColor(250, 250, 250);
//     doc.setFont('helvetica', 'bold');
//     doc.setFontSize(60);
//     doc.text('Rx', pageWidth/2, pageHeight/2, { 
//       align: 'center',
//       angle: 45 
//     });
    
//     // === GENERATE AND SAVE ===
//     const safeName = (patientData.name || 'patient').replace(/[^a-z0-9]/gi, '_').toLowerCase();
//     const safeMed = (prescription.medication || 'prescription').replace(/[^a-z0-9]/gi, '_').toLowerCase();
//     const timestamp = new Date().toISOString().split('T')[0];
    
//     doc.save(`prescription_${safeName}_${safeMed}_${timestamp}.pdf`);
    
//     // Show success message
//     toast.success('Prescription PDF generated successfully!');
    
//   } catch (error) {
//     console.error('Error generating prescription PDF:', error);
//     toast.error('Failed to generate prescription PDF. Please try again.');
//   }
// }, [patientData, formatDate, clinicLogo]);



//   const updateFilter = useCallback((field, value) => {
//     setFilters(prev => ({ ...prev, [field]: value }));
//   }, []);
  
//   const toggleSortDirection = useCallback(() => {
//     setFilters(prev => ({ 
//       ...prev, 
//       sortDirection: prev.sortDirection === "asc" ? "desc" : "asc" 
//     }));
//   }, []);

//   const handleClose = () => {
//     setModals(prev => ({ ...prev, appointment: false }));
//     setSelectedPatient(null);
//     setAppointmentMode('create');
//     setSelectedAppointmentToEdit(null);
//     setSelectedDate(null);
//     setSelectedTime(null);
//     setAppointmentForm({
//       doctor: "",
//       type: "",
//       date: "",
//       time: "",
//       notes: "",
//       reason: ""
//     });
//   };

//   const handleDateChange = (date) => {
//     setSelectedDate(date);
//     setSelectedTime(null);
//   };

//   const handleTimeSelect = (time) => {
//     setSelectedTime(time);
//   };

//   const tileDisabled = ({ date, view }) => {
//     return date < new Date().setHours(0, 0, 0, 0);
//   };


   
//   // Effects
//   useEffect(() => {


//     fetchGrowthRecords();
//     fetchPrescriptions();
//     fetchAppointments();


//   }, [fetchGrowthRecords, fetchPrescriptions, fetchAppointments]);
  
//   useEffect(() => {
//     if (activeTab === "documents") {
//       fetchDocuments();
//     }
//   }, [activeTab, fetchDocuments]);

//   // Early return for error state
//   if (error) {
//     return (
//       <div className="p-4">
//         <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
//           {error}
//         </Alert>
//         <Button onClick={() => window.location.reload()} className="mt-4">
//           Retry
//         </Button>
//       </div>
//     );
//   }


//   return (
//     <>
//       <Button 
//         variant="text" 
//         className="flex items-center gap-2 mt-4 ml-4"
//         onClick={() => navigate(-1)}
//       >
//         <ArrowLeftIcon className="h-5 w-5" />
//         Back
//       </Button>

//       <div className="relative mt-4 h-72 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
//         <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
//       </div>

//       <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
//         <CardBody className="p-4">
//           <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
//             <div className="flex items-center gap-6">
//               <Avatar
//                 src={patientData.avatar}
//                 alt={patientData.name}
//                 size="xl"
//                 variant="rounded"
//                 className="rounded-lg shadow-lg shadow-blue-gray-500/40"
//               />
//               <div>
//                 <Typography variant="h5" color="blue-gray" className="mb-1">
//                   {patientData.name}
//                 </Typography>
//                 <Typography variant="small" className="font-normal text-blue-gray-600">
//                   {patientData.age} • {patientData.gender} • Blood Type: {patientData.bloodType}
//                 </Typography>
//               </div>
//             </div>
//             <div className="w-100 lg:w-1/3">
//               <Tabs value={activeTab}>
//                 <TabsHeader>
//                   <Tab value="overview" onClick={() => setActiveTab("overview")}>
//                     <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
//                     Overview
//                   </Tab>
//                   <Tab value="documents" onClick={() => setActiveTab("documents")}>
//                     <DocumentTextIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
//                     Documents
//                   </Tab>
//                   <Tab value="vaccinations" onClick={() => setActiveTab("vaccinations")}>
//                     <ShieldCheckIcon className="-mt-0.5 mr-2 inline-block h-5 w-5" />
//                     Vaccinations
//                   </Tab>
//                   <Tab value="growth" onClick={() => setActiveTab("growth")}>
//                     <ChartBarIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
//                     Growth
//                   </Tab>
//                   <Tab value="appointments" onClick={() => setActiveTab("appointments")}>
//                     <CalendarDaysIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
//                     Appointments
//                   </Tab>
//                   <Tab value="prescriptions" onClick={() => setActiveTab("prescriptions")}>
//                     <DocumentTextIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
//                     Prescriptions
//                   </Tab>
//                 </TabsHeader>
//               </Tabs>
//             </div>
//           </div>

//           {/* Tab Content */}
//           {activeTab === "overview" && (
//             <div>
//               <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
//                 <VaccinationStatusCard
//                   filteredVaccinations={filteredVaccinations}
//                   filters={filters}
//                   updateFilter={updateFilter}
//                   toggleSortDirection={toggleSortDirection}
//                   handleOpenCreate={() => {
//                     setVaccinationForm({
//                       vaccine: "",
//                       dueDate: "",
//                       status: "pending",
//                       dateAdministered: ""
//                     });
//                     setModals(prev => ({ ...prev, create: true }));
//                   }}
//                   handleOpenView={(vaccination) => {
//                     setSelectedVaccination(vaccination);
//                     setModals(prev => ({ ...prev, view: true }));
//                   }}
//                   handleOpenEdit={(vaccination) => {
//                     setSelectedVaccination(vaccination);
//                     setVaccinationForm({
//                       vaccine: vaccination.vaccine,
//                       dueDate: vaccination.dueDate.split('T')[0],
//                       status: vaccination.status,
//                       dateAdministered: vaccination.dateAdministered?.split('T')[0] || ""
//                     });
//                     setModals(prev => ({ ...prev, edit: true }));
//                   }}
//                   handleOpenDelete={(vaccination) => {
//                     setSelectedVaccination(vaccination);
//                     setModals(prev => ({ ...prev, delete: true }));
//                   }}
//                   handleScheduleNext={(vaccination) => {
//                     const nextDueDate = calculateNextDueDate(vaccination);
//                     if (!nextDueDate) {
//                       toast.warning('Cannot schedule next dose without administration date');
//                       return;
//                     }
                    
//                     setVaccinationForm({
//                       vaccine: vaccination.vaccine,
//                       dueDate: nextDueDate,
//                       status: "pending",
//                       dateAdministered: ""
//                     });
//                     setModals(prev => ({ ...prev, create: true }));
//                   }}
//                   exportVaccinationPDF={exportVaccinationPDF}
//                 />
                
//                 <PatientInfoCard patientData={patientData} />
                
//                 <RecentActivitiesCard processedAppointments={processedAppointments} />
//               </div>
              
//               <VaccinationRecordsGrid
//                 filteredVaccinations={filteredVaccinations}
//                 handleOpenCreate={() => {
//                   setVaccinationForm({
//                     vaccine: "",
//                     dueDate: "",
//                     status: "pending",
//                     dateAdministered: ""
//                   });
//                   setModals(prev => ({ ...prev, create: true }));
//                 }}
//                 handleOpenView={(vaccination) => {
//                   setSelectedVaccination(vaccination);
//                   setModals(prev => ({ ...prev, view: true }));
//                 }}
//               />
//             </div>
//           )}

//           {activeTab === "vaccinations" && (
//             <div className="px-4">
//               <div className="flex items-center justify-between mb-6">
//                 <Typography variant="h4" color="blue-gray">
//                   Vaccination Management
//                 </Typography>
//                 <Button variant="gradient" onClick={() => {
//                   setVaccinationForm({
//                     vaccine: "",
//                     dueDate: "",
//                     status: "pending",
//                     dateAdministered: ""
//                   });
//                   setModals(prev => ({ ...prev, create: true }));
//                 }}>
//                   <PlusIcon className="h-4 w-4 mr-1" />
//                   Add New Vaccination
//                 </Button>
//               </div>
              
//               <FilterControls
//                 filters={filters}
//                 updateFilter={updateFilter}
//                 toggleSortDirection={toggleSortDirection}
//               />
              
//               <VaccinationGrid
//                 vaccinations={filteredVaccinations}
//                 onView={(vaccination) => {
//                   setSelectedVaccination(vaccination);
//                   setModals(prev => ({ ...prev, view: true }));
//                 }}
//                 onEdit={(vaccination) => {
//                   setSelectedVaccination(vaccination);
//                   setVaccinationForm({
//                     vaccine: vaccination.vaccine,
//                     dueDate: vaccination.dueDate.split('T')[0],
//                     status: vaccination.status,
//                     dateAdministered: vaccination.dateAdministered?.split('T')[0] || ""
//                   });
//                   setModals(prev => ({ ...prev, edit: true }));
//                 }}
//                 onDelete={(vaccination) => {
//                   setSelectedVaccination(vaccination);
//                   setModals(prev => ({ ...prev, delete: true }));
//                 }}
//               />
//             </div>
//           )}

//           {activeTab === "growth" && (
//             <div className="px-4">
//               <div className="flex items-center justify-between mb-6">
//                 <div>
//                   <Typography variant="h4" color="blue-gray">
//                     Growth Tracking
//                   </Typography>
//                   <Typography variant="small" className="text-blue-gray-500">
//                     Monitor BMI and growth patterns over time
//                   </Typography>
//                 </div>
//                 <Button variant="gradient" onClick={() => setModals(prev => ({ ...prev, growth: true }))}>
//                   <PlusIcon className="h-4 w-4 mr-1" />
//                   Add Growth Record
//                 </Button>
//               </div>

//               {growthRecords && growthRecords.length > 0 ? (
//                 <>
//                   <GrowthCharts 
//                     records={growthRecords} 
//                     patientAge={patientAge}
//                   />
                  
//                   <GrowthRecordsTable
//                     records={growthRecords}
//                     patientAge={patientAge}
//                     onDelete={deleteGrowthRecord}
//                     loading={loading}
//                   />
//                 </>
//               ) : (
//                 <EmptyGrowthState
//                   patientName={`${patient.firstName} ${patient.lastName}`}
//                   onAddRecord={() => setModals(prev => ({ ...prev, growth: true }))}
//                 />
//               )}
//             </div>
//           )}

//           {activeTab === "appointments" && (
//             <div className="px-4">
//               <div className="mb-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <Typography variant="h4" color="blue-gray">
//                       Appointment Management
//                     </Typography>
//                     <Typography variant="small" className="text-blue-gray-500">
//                       View, edit, and manage patient appointments
//                     </Typography>
//                   </div>
//                   <Button variant="gradient" onClick={() => handleOpen(patientData)}>
//                     <PlusIcon className="h-4 w-4 mr-1" />
//                     Book New Appointment
//                   </Button>
//                 </div>
//               </div>
              
//               {processedAppointments.length > 0 ? (
//                 <div className="grid grid-cols-1 gap-6">
//                   {processedAppointments.map((appointment) => (
//                     <Card key={appointment._id} className="border border-blue-gray-50">
//                       <CardHeader className="bg-blue-50 p-4 flex justify-between items-center">
//                         <div className="flex items-center gap-3">
//                           <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
//                           <Typography variant="h5" color="blue-gray">
//                             {appointment.name || 'Medical Appointment'}
//                           </Typography>
//                         </div>
//                         <Chip value="Scheduled" color="blue" size="sm" />
//                       </CardHeader>
//                       <CardBody className="p-4">
//                         <div className="space-y-3">
//                           <div className="flex items-center gap-2">
//                             <ClockIcon className="h-4 w-4 text-blue-gray-500" />
//                             <Typography variant="small" className="font-semibold text-blue-gray-500">
//                               Date & Time:
//                             </Typography>
//                             <Typography>{appointment.time} at {appointment.hour}</Typography>
//                           </div>
                          
//                           {appointment.message && (
//                             <div>
//                               <Typography variant="small" className="font-semibold text-blue-gray-500">
//                                 Purpose:
//                               </Typography>
//                               <Typography variant="small">{appointment.message}</Typography>
//                             </div>
//                           )}
//                         </div>
//                       </CardBody>
//                       <CardFooter className="flex justify-end gap-2 p-4 pt-0">
//                         <Button 
//                           variant="text" 
//                           color="blue" 
//                           size="sm"
//                           onClick={() => handleEditAppointment(appointment)}
//                           className="flex items-center gap-1"
//                         >
//                           <PencilIcon className="h-4 w-4" />
//                           Edit
//                         </Button>
//                         <Button 
//                           variant="text" 
//                           color="red" 
//                           size="sm"
//                           onClick={() => handleDeleteAppointment(appointment)}
//                           className="flex items-center gap-1"
//                         >
//                           <TrashIcon className="h-4 w-4" />
//                           Delete
//                         </Button>
//                       </CardFooter>
//                     </Card>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
//                   <CalendarDaysIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
//                   <Typography variant="h5" color="blue-gray" className="mb-2">
//                     No Appointments Found
//                   </Typography>
//                   <Typography variant="small" className="text-blue-gray-500 mb-6 max-w-md mx-auto">
//                     {patientData.name} doesn't have any appointments scheduled. Book the first appointment to get started.
//                   </Typography>
//                   <Button variant="gradient" onClick={() => handleOpen(patientData)}>
//                     Book First Appointment
//                   </Button>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === "prescriptions" && (
//             <div className="px-4">
//               <div className="flex items-center justify-between mb-6">
//                 <div>
//                   <Typography variant="h4" color="blue-gray">
//                     Prescription Management
//                   </Typography>
                 
           
                   
//                   <Typography variant="small" className="text-blue-gray-500">
//                     Manage and track medication prescriptions
//                   </Typography>
//                 </div>
                


//                 <Button variant="gradient" onClick={() => {
//                   setPrescriptionForm({
//                     medication: "",
//                     dosage: "",
//                     frequency: "",
//                     startDate: new Date().toISOString().split('T')[0],
//                     endDate: "",
//                     notes: ""
//                   });
//                   setSelectedPrescription(null);
//                   setModals(prev => ({ ...prev, prescription: true }));
//                 }}>
//                   <PlusIcon className="h-4 w-4 mr-1" />
//                   Add Prescription
//                 </Button>
//               </div>

//               {prescriptions.length === 0 ? (
//                 <EmptyPrescriptionsState 
//                   patientName={patientData.name}
//                   onAddPrescription={() => setModals(prev => ({ ...prev, prescription: true }))}
//                 />
//               ) : (
//                 <div className="space-y-8">
//                   {Object.entries(
//                     prescriptions.reduce((groups, prescription) => {
//                       const year = new Date(prescription.startDate).getFullYear();
//                       if (!groups[year]) groups[year] = [];
//                       groups[year].push(prescription);
//                       return groups;
//                     }, {})
//                   ).map(([year, yearPrescriptions]) => (
//                     <div key={year}>
//                       <Typography variant="h5" color="blue-gray" className="mb-4">
//                         {year}
//                       </Typography>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {yearPrescriptions.map((prescription) => (
//                           <PrescriptionCard
//                             key={prescription._id}
//                             prescription={prescription}
//                             onEdit={() => {
//                               setSelectedPrescription(prescription);
//                               setPrescriptionForm({
//                                 medication: prescription.medication,
//                                 dosage: prescription.dosage,
//                                 frequency: prescription.frequency,
//         startDate: prescription.startDate.split('T')[0],
//         endDate: prescription.endDate ? prescription.endDate.split('T')[0] : "",
//         notes: prescription.notes || ""
//       });
//       setModals(prev => ({ ...prev, prescription: true }));
//     }}
//     onDelete={() => {
//       setSelectedPrescription(prescription);
//       setModals(prev => ({ ...prev, deletePrescription: true }));
//     }}
//     onView={() => {
//       setSelectedPrescription(prescription);
//       setModals(prev => ({ ...prev, viewPrescription: true }));
//     }}
//     onExportPDF={exportPrescriptionPDF}
//   />
// ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === "documents" && (
//             <div className="px-4">
//               <div className="flex items-center justify-between mb-6">
//                 <div>
//                   <Typography variant="h4" color="blue-gray">
//                     Document Management
//                   </Typography>
//                   <Typography variant="small" className="text-blue-gray-500">
//                     Store and manage patient documents
//                   </Typography>
//                 </div>
//                 <Button variant="gradient" onClick={() => setModals(prev => ({ ...prev, uploadDocument: true }))}>
//                   <PlusIcon className="h-4 w-4 mr-1" />
//                   Upload Document
//                 </Button>
//               </div>

//               {documents.length === 0 ? (
//                 <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
//                   <DocumentTextIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
//                   <Typography variant="h5" color="blue-gray" className="mb-2">
//                     No Documents Found
//                   </Typography>
//                   <Typography variant="small" className="text-blue-gray-500 mb-6 max-w-md mx-auto">
//                     {patientData.name} doesn't have any documents yet. Upload the first document to get started.
//                   </Typography>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {documents.map((document) => (
//                     <Card key={document._id} className="border border-blue-gray-50">
//                       <CardHeader className="bg-blue-50 p-4">
//                         <div className="flex items-center justify-between">
//                           <Typography variant="h6" color="blue-gray">
//                             {document.title}
//                           </Typography>
//                           <Chip value="Document" color="blue" size="sm" />
//                         </div>
//                       </CardHeader>
//                       <CardBody className="p-4">
//                         <Typography variant="small" className="text-blue-gray-500">
//                           Uploaded: {formatDate(document.createdAt)}
//                         </Typography>
//                       </CardBody>
//                       <CardFooter className="flex justify-end gap-2 p-4 pt-0">
//                         <Button 
//                           variant="text" 
//                           color="blue" 
//                           size="sm"
//                           onClick={() => window.open(document.fileUrl, '_blank')}
//                         >
//                           View
//                         </Button>
//                         <Button 
//                           variant="text" 
//                           color="red" 
//                           size="sm"
//                           onClick={() => {
//                             setSelectedDocument(document);
//                             setModals(prev => ({ ...prev, deleteDocument: true }));
//                           }}
//                         >
//                           Delete
//                         </Button>
//                       </CardFooter>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//         </CardBody>
//       </Card>

//       {/* Document Modals */}
//       <DocumentUploadModal
//         open={modals.uploadDocument}
//         onClose={() => setModals(prev => ({ ...prev, uploadDocument: false }))}
//         formData={documentForm}
//         setFormData={setDocumentForm}
//         onSubmit={uploadDocument}
//         loading={loading}
//       />

//       <DeleteDocumentModal
//         open={modals.deleteDocument}
//         onClose={() => setModals(prev => ({ ...prev, deleteDocument: false }))}
//         document={selectedDocument}
//         onConfirm={deleteDocument}
//         loading={loading}
//       />

//       {/* Vaccination Modals */}
//       <VaccinationModal
//         open={modals.create}
//         onClose={() => setModals(prev => ({ ...prev, create: false }))}
//         title="Add New Vaccination"
//         formData={vaccinationForm}
//         updateField={(field, value) => setVaccinationForm(prev => ({ ...prev, [field]: value }))}
//         onSubmit={createVaccination}
//         isValid={isVaccinationFormValid}
//         loading={loading}
//       />

//       <VaccinationModal
//         open={modals.edit}
//         onClose={() => setModals(prev => ({ ...prev, edit: false }))}
//         title="Edit Vaccination Record"
//         formData={vaccinationForm}
//         updateField={(field, value) => setVaccinationForm(prev => ({ ...prev, [field]: value }))}
//         onSubmit={updateVaccination}
//         isValid={isVaccinationFormValid}
//         loading={loading}
//         isEdit
//       />
    
//       <ViewVaccinationModal
//         open={modals.view}
//         onClose={() => setModals(prev => ({ ...prev, view: false }))}
//         vaccination={selectedVaccination}
//         onScheduleNext={(vaccination) => {
//           const nextDueDate = calculateNextDueDate(vaccination);
//           if (!nextDueDate) {
//             toast.warning('Cannot schedule next dose without administration date');
//             return;
//           }
          
//           setVaccinationForm({
//             vaccine: vaccination.vaccine,
//             dueDate: nextDueDate,
//             status: "pending",
//             dateAdministered: ""
//           });
//           setModals(prev => ({ ...prev, create: true }));
//         }}
//         onExportPDF={exportVaccinationPDF}
//       />

//       <DeleteConfirmationModal
//         open={modals.delete}
//         onClose={() => setModals(prev => ({ ...prev, delete: false }))}
//         vaccination={selectedVaccination}
//         onConfirm={deleteVaccination}
//         loading={loading}
//       />

//       {/* Prescription Modals */}
//       <PrescriptionModal
//         open={modals.prescription}
//         onClose={() => setModals(prev => ({ ...prev, prescription: false }))}
//         formData={prescriptionForm}
//         setFormData={setPrescriptionForm}
//         onSubmit={selectedPrescription ? updatePrescription : addPrescription}
//         isValid={isPrescriptionFormValid}
//         loading={loading}
//         isEdit={!!selectedPrescription}
//         commonMedications={COMMON_MEDICATIONS}
//       />

// <ViewPrescriptionModal
//   open={modals.viewPrescription}
//   onClose={() => setModals(prev => ({ ...prev, viewPrescription: false }))}
//   prescription={selectedPrescription}
//   onExportPDF={exportPrescriptionPDF}
// />
//       <DeletePrescriptionModal
//         open={modals.deletePrescription}
//         onClose={() => setModals(prev => ({ ...prev, deletePrescription: false }))}
//         prescription={selectedPrescription}
//         onConfirm={deletePrescription}
//         loading={loading}
//       />

//       {/* Growth Modal */}
//       <GrowthModal
//         open={modals.growth}
//         onClose={() => setModals(prev => ({ ...prev, growth: false }))}
//         formData={growthForm}
//         updateField={(field, value) => setGrowthForm(prev => ({ ...prev, [field]: value }))}
//         onSubmit={addGrowthRecord}
//         isValid={isGrowthFormValid}
//         loading={loading}
//         patientAge={patientAge}
//       />

//       {/* Appointment Modal */}
//         <Dialog open={modals.appointment} handler={handleClose} size="xl" className="h-screen overflow-auto">
//           <DialogHeader>
//             {appointmentMode === 'create' ? 'Book New Appointment' : 'Edit Appointment'}
//           </DialogHeader>
//           <form onSubmit={handleAppointmentSubmit}>
//             <DialogBody className="flex flex-col gap-4">
//           <Typography variant="small" color="gray">
//             Please fill in the details for the appointment.
//           </Typography>
//           {(selectedPatient || patientData) && (
//             <>
//               <Typography variant="h6">
//             Patient: {selectedPatient?.name || patientData.name}
//               </Typography>

//               {appointmentMode === 'update' && (
//             <div className="bg-blue-50 p-3 rounded-lg">
//               <Typography variant="small" color="blue-gray" className="font-semibold">
//                 Editing existing appointment
//               </Typography>
//             </div>
//               )}

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <Typography variant="h6" className="mb-2">Select Date</Typography>
//               {/* <input
//                 type="date"
//                 value={selectedDate ? selectedDate.toISOString().split('T')[0] : (appointmentForm.date || '')}
//                 onChange={(e) => setSelectedDate(new Date(e.target.value))}
//                 min={new Date().toISOString().split('T')[0]}
//                 className="w-full p-2 border rounded"
//                 required
//               /> */}
//               <Calendar
//                       onChange={handleDateChange}
//                       value={selectedDate}
//                       minDate={new Date()}
//                       tileDisabled={tileDisabled}
//                       className="border rounded-lg p-2 w-full"
//                     />
//             </div>

//             <div>
//               <Typography variant="h6" className="mb-2">Available Time Slots</Typography>
//               {selectedDate || appointmentForm.date ? (
//                 <div className="grid grid-cols-3 gap-2">
//               {TIME_SLOTS.map(time => {
//                 const isBooked = isTimeSlotBooked(time);
//                 const isCurrentSelected = selectedTime === time || appointmentForm.time === time;
                
//                 return (
//                   <Button
//                 key={time}
//                 variant={isCurrentSelected ? "filled" : "outlined"}
//                 color={isBooked ? "red" : isCurrentSelected ? "black" : "gray"}
//                 onClick={() => !isBooked && handleTimeSelect(time)}
//                 disabled={isBooked}
//                 className="p-2 text-sm"
//                 title={isBooked ? "Time slot already booked" : "Available"}
//                   >
//                 {time}
//                 {isBooked && (
//                   <span className="ml-1 text-xs">(Booked)</span>
//                 )}
//                   </Button>
//                 );
//               })}
//                 </div>
//               ) : (
//                 <Typography variant="small" color="gray">
//               Please select a date first
//                 </Typography>
//               )}
//             </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
//             <div>
//               <Input
               
//                 label="Appointment Type"
//                 value={appointmentForm.type}
//                 onChange={(e) => setAppointmentForm(prev => ({ ...prev, type: e.target.value }))}
//                 placeholder="e.g., Consultation, Check-up, Follow-up"
//               />
//             </div>
//               </div>

//               <div> 

//               </div>
//             </>
//           )}
//             </DialogBody>
//             <DialogFooter className="flex justify-between">
//           <Button variant="outlined" color="red" onClick={handleClose} type="button">
//             Cancel
//           </Button>
//           <Button
//             variant="gradient"
//             color="neutral"
//             type="submit"
//             disabled={isSubmitting || !(selectedDate || appointmentForm.date) || !(selectedTime || appointmentForm.time)}
//           >
//             {isSubmitting 
//               ? (appointmentMode === 'create' ? 'Booking...' : 'Updating...') 
//               : (appointmentMode === 'create' ? 'Book Appointment' : 'Update Appointment')
//             }
//           </Button>
//             </DialogFooter>
//           </form>
//         </Dialog>

//         {/* Appointment Delete Confirmation Modal */}
//       <Dialog open={deleteConfirmOpen} handler={() => setDeleteConfirmOpen(false)}>
//         <DialogHeader>Confirm Deletion</DialogHeader>
//         <DialogBody>
//           <Typography variant="small" className="text-red-500">
//             Are you sure you want to delete this appointment? This action cannot be undone.
//           </Typography>
//           {appointmentToDelete && (
//             <div className="mt-4 p-3 bg-gray-50 rounded-lg">
//               <Typography variant="small" className="font-semibold">
//                 Appointment Details:
//               </Typography>
//               <Typography variant="small">
//                 Date: {appointmentToDelete.time}<br />
//                 Time: {appointmentToDelete.hour}<br />
//                 Purpose: {appointmentToDelete.message}
//               </Typography>
//             </div>
//           )}
//         </DialogBody>
//         <DialogFooter>
//           <Button
//             variant="text"
//             color="gray"
//             onClick={() => setDeleteConfirmOpen(false)}
//             className="mr-1"
//           >
//             Cancel
//           </Button>
//           <Button 
//             variant="gradient" 
//             color="red" 
//             onClick={confirmDeleteAppointment}
//             disabled={loading}
//           >
//             {loading ? "Deleting..." : "Delete Appointment"}
//           </Button>
//         </DialogFooter>
//       </Dialog>
//     </>
//   );
// }

// export default PatientDetail;
