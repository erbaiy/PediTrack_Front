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
//   // Tooltip
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
//   DocumentTextIcon
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
//   ReferenceLine
// } from 'recharts';

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
//     case "Overweight": 
//     case "Obese": return "#f44336";
//     default: return "#9e9e9e";
//   }
// };

// // Custom hooks
// const useFormState = (initialState = {}) => {
//   const [formData, setFormData] = useState(initialState);
  
//   const updateField = useCallback((field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   }, []);
  
//   const resetForm = useCallback(() => {
//     setFormData(initialState);
//   }, [initialState]);
  
//   return [formData, updateField, resetForm, setFormData];
// };

// const useModalState = () => {
//   const [modals, setModals] = useState({
//     create: false,
//     edit: false,
//     delete: false,
//     view: false,
//     growth: false,
//     prescription: false,
//     viewPrescription: false,
//     deletePrescription: false,
//     uploadDocument: false,
//     deleteDocument: false
//   });
  
//   const openModal = useCallback((modalName) => {
//     setModals(prev => ({ ...prev, [modalName]: true }));
//   }, []);
  
//   const closeModal = useCallback((modalName) => {
//     setModals(prev => ({ ...prev, [modalName]: false }));
//   }, []);
  
//   return [modals, openModal, closeModal];
// };

// // Document management components
// const DOCUMENT_TYPE_ICONS = {
//   pdf: <div className="h-10 w-10 text-red-500">📄</div>,
//   jpg: <div className="h-10 w-10 text-blue-500">🖼️</div>,
//   jpeg: <div className="h-10 w-10 text-blue-500">🖼️</div>,
//   png: <div className="h-10 w-10 text-green-500">🖼️</div>,
//   doc: <div className="h-10 w-10 text-blue-600">📝</div>,
//   docx: <div className="h-10 w-10 text-blue-600">📝</div>,
//   xls: <div className="h-10 w-10 text-green-600">📊</div>,
//   xlsx: <div className="h-10 w-10 text-green-600">📊</div>,
//   default: <div className="h-10 w-10 text-gray-500">📁</div>,
// };

// const getFileIcon = (fileName) => {
//   if (!fileName) return DOCUMENT_TYPE_ICONS.default;
//   const extension = fileName.split('.').pop().toLowerCase();
//   return DOCUMENT_TYPE_ICONS[extension] || DOCUMENT_TYPE_ICONS.default;
// };

// const DocumentsTab = ({ 
//   documents, 
//   patientName, 
//   onUpload,
//   onDelete 
// }) => {
//   const groupedDocuments = useMemo(() => {
//     const groups = {};
//     documents.forEach(document => {
//       const year = new Date(document.createdAt).getFullYear();
//       if (!groups[year]) groups[year] = [];
//       groups[year].push(document);
//     });
//     return groups;
//   }, [documents]);

//   return (
//     <div className="px-4">
//       <div className="flex items-center justify-between mb-6">
//         <Typography variant="h4" color="blue-gray">
//           Patient Documents
//         </Typography>
//         <Button variant="gradient" onClick={onUpload}>
//           <PlusIcon className="h-4 w-4 mr-1" />
//           Upload Document
//         </Button>
//       </div>

//       {documents.length === 0 ? (
//         <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
//           <DocumentTextIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
//           <Typography variant="h5" color="blue-gray" className="mb-2">
//             No Documents Found
//           </Typography>
//           <Button variant="gradient" onClick={onUpload}>
//             Upload First Document
//           </Button>
//         </div>
//       ) : (
//         <div className="space-y-8">
//           {Object.entries(groupedDocuments)
//             .sort(([yearA], [yearB]) => yearB - yearA)
//             .map(([year, yearDocuments]) => (
//               <div key={year}>
//                 <Typography variant="h5" color="blue-gray" className="mb-4">
//                   {year}
//                 </Typography>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {yearDocuments.map((document) => (
//                     <Card key={document._id} className="border border-blue-gray-50 hover:shadow-md transition-shadow h-full flex flex-col">
//                       <CardBody className="flex flex-col items-center text-center p-6">
//                         <div className="mb-4">
//                           {getFileIcon(document.url)}
//                         </div>
//                         <Typography variant="h6" color="blue-gray" className="mb-2 truncate w-full">
//                           {document.title || document.url.split('/').pop()}
//                         </Typography>
//                         <Typography variant="small" className="text-blue-gray-500 mb-4">
//                           {formatDate(document.createdAt)}
//                         </Typography>
//                       </CardBody>
//                       <CardFooter className="flex justify-center gap-4 p-4 pt-0 mt-auto">
//                         <a 
//                           href={`${axiosInstance.defaults.baseURL}${document.url}`} 
//                           target="_blank" 
//                           rel="noopener noreferrer"
//                         >
//                           <Button variant="gradient" size="sm">
//                             <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
//                             Download
//                           </Button>
//                         </a>
//                         <Button 
//                           variant="outlined" 
//                           color="red" 
//                           size="sm"
//                           onClick={() => onDelete(document)}
//                         >
//                           <TrashIcon className="h-4 w-4 mr-1" />
//                           Delete
//                         </Button>
//                       </CardFooter>
//                     </Card>
//                   ))}
//                 </div>
//               </div>
//             ))}
//         </div>
//       )}
//     </div>
//   );
// };

// const DocumentUploadModal = ({ 
//   open, 
//   onClose, 
//   formData, 
//   setFormData, 
//   onSubmit, 
//   loading 
// }) => {
//   const handleFileChange = (e) => {
//     setFormData(prev => ({ 
//       ...prev, 
//       file: e.target.files[0] 
//     }));
//   };

//   return (
//     <Dialog open={open} handler={onClose} size="md">
//       <DialogHeader>Upload New Document</DialogHeader>
//       <DialogBody divider>
//         <div className="grid gap-6">
//           <Input
//             label="Document Title"
//             value={formData.title}
//             onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
//             required
//           />
          
//           <div>
//             <input
//               type="file"
//               className="block w-full text-sm text-gray-500
//                 file:mr-4 file:py-2 file:px-4
//                 file:rounded-full file:border-0
//                 file:text-sm file:font-semibold
//                 file:bg-blue-50 file:text-blue-700
//                 hover:file:bg-blue-100"
//               onChange={handleFileChange}
//               accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
//               required
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
//           disabled={!formData.title || !formData.file || loading}
//         >
//           {loading ? "Uploading..." : "Upload Document"}
//         </Button>
//       </DialogFooter>
//     </Dialog>
//   );
// };

// const DeleteDocumentModal = ({ 
//   open, 
//   onClose, 
//   document, 
//   onConfirm, 
//   loading 
// }) => (
//   <Dialog open={open} handler={onClose}>
//     <DialogHeader>Delete Document</DialogHeader>
//     <DialogBody divider>
//       <Typography variant="small" className="text-red-500">
//         Are you sure you want to delete "{document?.title}"?
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
//         {loading ? "Deleting..." : "Delete Document"}
//       </Button>
//     </DialogFooter>
//   </Dialog>
// );

// // GrowthTab component
// const GrowthTab = ({ patientId, patientName, patientAge }) => {
//   const [growthRecords, setGrowthRecords] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [growthForm, updateGrowthField] = useFormState({
//     height: "",
//     weight: "",
//     growthDate: ""
//   });
//   const [modals, setModals] = useState({ growth: false });

//   const isGrowthFormValid = useMemo(() => {
//     const { height, weight, growthDate } = growthForm;
//     return height && weight && growthDate;
//   }, [growthForm]);

//   const fetchGrowthRecords = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.get(`/growth-records/${patientId}`);
//       setGrowthRecords(response.data);
//     } catch (error) {
//       toast.error('Failed to load growth records');
//     } finally {
//       setLoading(false);
//     }
//   }, [patientId]);

//   useEffect(() => {
//     fetchGrowthRecords();
//   }, [fetchGrowthRecords]);

//   const addGrowthRecord = useCallback(async () => {
//     if (!isGrowthFormValid) return;
//     try {
//       setLoading(true);
//       const bmi = calculateBMI(growthForm.weight, growthForm.height);
//       await axiosInstance.post('/growth-records', {
//         patientId,
//         heightCm: parseFloat(growthForm.height),
//         weightKg: parseFloat(growthForm.weight),
//         date: new Date(growthForm.growthDate).toISOString(),
//         bmi: parseFloat(bmi)
//       });
//       fetchGrowthRecords();
//       setModals({ growth: false });
//       toast.success('Growth record added!');
//     } catch (error) {
//       toast.error('Failed to add record');
//     } finally {
//       setLoading(false);
//     }
//   }, [growthForm, isGrowthFormValid, patientId, fetchGrowthRecords]);

//   const deleteGrowthRecord = useCallback(async (recordId) => {
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/growth-records/${recordId}`);
//       setGrowthRecords(prev => prev.filter(r => r._id !== recordId));
//       toast.success('Record deleted!');
//     } catch (error) {
//       toast.error('Failed to delete record');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const handleOpenGrowthModal = () => setModals({ growth: true });
//   const handleCloseGrowthModal = () => setModals({ growth: false });

//   const chartData = useMemo(() => {
//     return growthRecords
//       .map(record => ({
//         date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
//         height: record.heightCm,
//         weight: record.weightKg,
//         bmi: parseFloat(record.bmi),
//       }))
//       .sort((a, b) => new Date(a.date) - new Date(b.date));
//   }, [growthRecords]);

//   return (
//     <div className="px-4">
//       <div className="flex items-center justify-between mb-6">
//         <Typography variant="h4" color="blue-gray">
//           Growth Tracking
//         </Typography>
//         <Button variant="gradient" onClick={handleOpenGrowthModal}>
//           <PlusIcon className="h-4 w-4 mr-1" />
//           Add Record
//         </Button>
//       </div>

//       {growthRecords.length > 0 ? (
//         <>
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
//             <Card className="p-4">
//               <Typography variant="h5" color="blue-gray" className="mb-4">
//                 Height & Weight
//               </Typography>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="date" />
//                     <YAxis yAxisId="left" />
//                     <YAxis yAxisId="right" orientation="right" />
//                     <Tooltip />
//                     <Legend />
//                     <Line yAxisId="left" type="monotone" dataKey="height" stroke="#8884d8" name="Height (cm)" />
//                     <Line yAxisId="right" type="monotone" dataKey="weight" stroke="#82ca9d" name="Weight (kg)" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </Card>
            
//             <Card className="p-4">
//               <Typography variant="h5" color="blue-gray" className="mb-4">
//                 BMI Trend
//               </Typography>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <AreaChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="date" />
//                     <YAxis />
//                     <Tooltip />
//                     <Area type="monotone" dataKey="bmi" stroke="#ff7300" fill="#ff7300" fillOpacity={0.3} name="BMI" />
//                   </AreaChart>
//                 </ResponsiveContainer>
//               </div>
//             </Card>
//           </div>
          
//           <Card>
//             <CardBody>
//               <div className="overflow-x-auto">
//                 <table className="w-full min-w-max">
//                   <thead>
//                     <tr>
//                       <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                         <Typography variant="small" color="blue-gray" className="font-normal">Date</Typography>
//                       </th>
//                       <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                         <Typography variant="small" color="blue-gray" className="font-normal">Height (cm)</Typography>
//                       </th>
//                       <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                         <Typography variant="small" color="blue-gray" className="font-normal">Weight (kg)</Typography>
//                       </th>
//                       <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                         <Typography variant="small" color="blue-gray" className="font-normal">BMI</Typography>
//                       </th>
//                       <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                         <Typography variant="small" color="blue-gray" className="font-normal">Category</Typography>
//                       </th>
//                       <th className="border-b border-blue-gray-100 bg-blue-gray-50/50 p-4">
//                         <Typography variant="small" color="blue-gray" className="font-normal">Actions</Typography>
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {growthRecords.map((record) => (
//                       <tr key={record._id}>
//                         <td className="p-4 border-b border-blue-gray-50">
//                           <Typography variant="small" color="blue-gray" className="font-normal">
//                             {formatDate(record.date)}
//                           </Typography>
//                         </td>
//                         <td className="p-4 border-b border-blue-gray-50">
//                           <Typography variant="small" color="blue-gray" className="font-normal">
//                             {record.heightCm}
//                           </Typography>
//                         </td>
//                         <td className="p-4 border-b border-blue-gray-50">
//                           <Typography variant="small" color="blue-gray" className="font-normal">
//                             {record.weightKg}
//                           </Typography>
//                         </td>
//                         <td className="p-4 border-b border-blue-gray-50">
//                           <Typography variant="small" color="blue-gray" className="font-normal">
//                             {record.bmi}
//                           </Typography>
//                         </td>
//                         <td className="p-4 border-b border-blue-gray-50">
//                           <Chip
//                             value={getBMICategory(record.bmi, patientAge)}
//                             color={getBMICategoryColor(getBMICategory(record.bmi, patientAge))}
//                             size="sm"
//                           />
//                         </td>
//                         <td className="p-4 border-b border-blue-gray-50">
//                           <Button 
//                             variant="text" 
//                             color="red"
//                             onClick={() => deleteGrowthRecord(record._id)}
//                             disabled={loading}
//                           >
//                             <TrashIcon className="h-4 w-4" />
//                           </Button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </CardBody>
//           </Card>
//         </>
//       ) : (
//         <div className="text-center py-12">
//           <ChartBarIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
//           <Typography variant="h5" color="blue-gray" className="mb-2">
//             No Growth Records
//           </Typography>
//           <Button variant="gradient" onClick={handleOpenGrowthModal}>
//             Add First Record
//           </Button>
//         </div>
//       )}

//       <Dialog open={modals.growth} handler={handleCloseGrowthModal}>
//         <DialogHeader>Add Growth Record</DialogHeader>
//         <DialogBody divider>
//           <div className="grid gap-6">
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Height (cm)"
//                 type="number"
//                 value={growthForm.height}
//                 onChange={(e) => updateGrowthField('height', e.target.value)}
//                 required
//               />
//               <Input
//                 label="Weight (kg)"
//                 type="number"
//                 value={growthForm.weight}
//                 onChange={(e) => updateGrowthField('weight', e.target.value)}
//                 required
//               />
//             </div>
//             <Input
//               label="Date"
//               type="date"
//               value={growthForm.growthDate}
//               onChange={(e) => updateGrowthField('growthDate', e.target.value)}
//               required
//             />
//           </div>
//         </DialogBody>
//         <DialogFooter>
//           <Button
//             variant="text"
//             color="red"
//             onClick={handleCloseGrowthModal}
//             className="mr-1"
//             disabled={loading}
//           >
//             Cancel
//           </Button>
//           <Button 
//             variant="gradient" 
//             color="green" 
//             onClick={addGrowthRecord}
//             disabled={!isGrowthFormValid || loading}
//           >
//             {loading ? "Adding..." : "Add Record"}
//           </Button>
//         </DialogFooter>
//       </Dialog>
//     </div>
//   );
// };

// // Main component
// export function PatientDetail() {
//   const { id } = useParams();
//   const { state } = useLocation();
//   const navigate = useNavigate();
  
//   const [activeTab, setActiveTab] = useState("overview");
//   const [selectedVaccination, setSelectedVaccination] = useState(null);
//   const [selectedPrescription, setSelectedPrescription] = useState(null);
//   const [vaccinations, setVaccinations] = useState(state?.vaccinations || []);
//   const [prescriptions, setPrescriptions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   // Document states
//   const [documents, setDocuments] = useState([]);
//   const [selectedDocument, setSelectedDocument] = useState(null);
//   const [documentForm, setDocumentForm] = useState({
//     title: "",
//     file: null,
//   });
  
//   // Form states
//   const [vaccinationForm, updateVaccinationField, resetVaccinationForm] = useFormState({
//     vaccine: "",
//     dueDate: "",
//     status: "pending",
//     dateAdministered: ""
//   });
  
//   const [prescriptionForm, setPrescriptionForm] = useState({
//     medication: "",
//     dosage: "",
//     frequency: "",
//     startDate: new Date().toISOString().split('T')[0],
//     endDate: "",
//     notes: ""
//   });
  
//   // Modal state
//   const [modals, openModal, closeModal] = useModalState();
  
//   // Patient data
//   const patient = state?.patient || {};
//   const patientData = useMemo(() => ({
//     name: `${patient.firstName} ${patient.lastName}`,
//     age: patient.age || "Not specified",
//     gender: patient.gender || "Not specified",
//     bloodType: patient.bloodType || "Not specified",
//     phoneNumber: patient.parent?.phoneNumber || "Not specified",
//     email: patient.parent?.email || "Not specified",
//     address: patient.parent?.address || "Not specified",
//     emergencyContact: patient.parent?.fullName || "Not specified",
//     allergies: patient.allergies || "None",
//     chronicConditions: patient.chronicConditions || "None",
//   }), [patient]);
  
//   // Validation
//   const isVaccinationFormValid = useMemo(() => (
//     vaccinationForm.vaccine.trim() !== "" &&
//     vaccinationForm.dueDate.trim() !== "" &&
//     (vaccinationForm.status !== "done" || vaccinationForm.dateAdministered.trim() !== "")
//   ), [vaccinationForm]);
  
//   const isPrescriptionFormValid = useMemo(() => (
//     prescriptionForm.medication.trim() !== "" &&
//     prescriptionForm.dosage.trim() !== "" &&
//     prescriptionForm.frequency.trim() !== "" &&
//     prescriptionForm.startDate.trim() !== ""
//   ), [prescriptionForm]);
  
//   // API functions
//   const fetchDocuments = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.get(`/documents/patient/${id}`);
//       setDocuments(response.data);
//     } catch (error) {
//       toast.error('Failed to load documents');
//     } finally {
//       setLoading(false);
//     }
//   }, [id]);
  
//   const uploadDocument = useCallback(async () => {
//     try {
//       setLoading(true);
//       const formData = new FormData();
//       formData.append('file', documentForm.file);
//       formData.append('patientId', id);
//       formData.append('title', documentForm.title);
      
//       await axiosInstance.post('/documents/upload', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
      
//       fetchDocuments();
//       closeModal('uploadDocument');
//       setDocumentForm({ title: "", file: null });
//       toast.success('Document uploaded!');
//     } catch (error) {
//       toast.error('Failed to upload document');
//     } finally {
//       setLoading(false);
//     }
//   }, [documentForm, id, fetchDocuments]);
  
//   const deleteDocument = useCallback(async () => {
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/documents/${selectedDocument._id}`);
//       setDocuments(prev => prev.filter(doc => doc._id !== selectedDocument._id));
//       closeModal('deleteDocument');
//       toast.success('Document deleted!');
//     } catch (error) {
//       toast.error('Failed to delete document');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedDocument]);
  
//   const fetchPrescriptions = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.get(`/prescriptions/${id}`);
//       setPrescriptions(response.data);
//     } catch (error) {
//       toast.error('Failed to load prescriptions');
//     } finally {
//       setLoading(false);
//     }
//   }, [id]);
  
//   const addPrescription = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.post('/prescriptions', {
//         patientId: id,
//         ...prescriptionForm
//       });
//       setPrescriptions(prev => [...prev, response.data]);
//       closeModal('prescription');
//       toast.success('Prescription added!');
//     } catch (error) {
//       toast.error('Failed to add prescription');
//     } finally {
//       setLoading(false);
//     }
//   }, [prescriptionForm, id]);
  
//   // Effects
//   useEffect(() => {
//     if (activeTab === "prescriptions") fetchPrescriptions();
//     if (activeTab === "documents") fetchDocuments();
//   }, [activeTab, fetchPrescriptions, fetchDocuments]);

//   // Early return for missing patient
//   if (!state?.patient) {
//     return (
//       <div className="p-4 text-center">
//         <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
//           Patient information not found
//         </Alert>
//         <Button onClick={() => navigate('/patients')} className="mt-4">
//           Return to patients list
//         </Button>
//       </div>
//     );
//   }
  
//   return (
//     <>
//       <Button variant="text" className="flex items-center gap-2 mt-4 ml-4" onClick={() => navigate(-1)}>
//         <ArrowLeftIcon className="h-5 w-5" /> Back
//       </Button>

//       <div className="relative mt-4 h-72 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-blue-700">
//         <div className="absolute inset-0 h-full w-full bg-gray-900/50" />
//       </div>

//       <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
//         <CardBody className="p-4">
//           <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
//             <div className="flex items-center gap-6">
//               <Avatar
//                 src={patient.img || "/img/default-avatar.jpg"}
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
//             <div className="w-96">
//               <Tabs value={activeTab}>
//                 <TabsHeader>
//                   <Tab value="overview" onClick={() => setActiveTab("overview")}>
//                     <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
//                     Overview
//                   </Tab>
//                   <Tab value="growth" onClick={() => setActiveTab("growth")}>
//                     <ChartBarIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
//                     Growth
//                   </Tab>
//                   <Tab value="prescriptions" onClick={() => setActiveTab("prescriptions")}>
//                     <DocumentTextIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
//                     Prescriptions
//                   </Tab>
//                   <Tab value="documents" onClick={() => setActiveTab("documents")}>
//                     <DocumentTextIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
//                     Documents
//                   </Tab>
//                 </TabsHeader>
//               </Tabs>
//             </div>
//           </div>

//           {/* Tab Content */}
//           {activeTab === "overview" && (
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//               <Card className="p-6">
//                 <Typography variant="h6" color="blue-gray" className="mb-4">
//                   Patient Information
//                 </Typography>
//                 <div className="space-y-4">
//                   {Object.entries(patientData).map(([key, value]) => (
//                     <div key={key} className="flex justify-between">
//                       <Typography variant="small" className="font-semibold text-blue-gray-500 capitalize">
//                         {key}:
//                       </Typography>
//                       <Typography variant="small" className="text-right">
//                         {value}
//                       </Typography>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
              
//               <Card className="p-6 col-span-2">
//                 <div className="flex justify-between items-center mb-4">
//                   <Typography variant="h6" color="blue-gray">
//                     Vaccinations
//                   </Typography>
//                   <Button variant="gradient" size="sm" onClick={() => openModal('create')}>
//                     <PlusIcon className="h-4 w-4 mr-1" /> Add
//                   </Button>
//                 </div>
//                 <div className="space-y-4">
//                   {vaccinations.map((vaccination) => (
//                     <div key={vaccination._id} className="flex justify-between items-center border-b pb-3">
//                       <div>
//                         <Typography className="font-semibold">{vaccination.vaccine}</Typography>
//                         <Typography variant="small" className="text-blue-gray-500">
//                           Due: {formatDate(vaccination.dueDate)}
//                         </Typography>
//                       </div>
//                       <Chip
//                         value={vaccination.status}
//                         color={getStatusColor(vaccination.status)}
//                         size="sm"
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//             </div>
//           )}

//           {activeTab === "growth" && (
//             <GrowthTab 
//               patientId={id}
//               patientName={patientData.name}
//               patientAge={parseInt(patientData.age) || 0}
//             />
//           )}

//           {activeTab === "prescriptions" && (
//             <div className="px-4">
//               <div className="flex items-center justify-between mb-6">
//                 <Typography variant="h4" color="blue-gray">
//                   Prescriptions
//                 </Typography>
//                 <Button variant="gradient" onClick={() => openModal('prescription')}>
//                   <PlusIcon className="h-4 w-4 mr-1" />
//                   Add Prescription
//                 </Button>
//               </div>
              
//               {prescriptions.length === 0 ? (
//                 <div className="text-center py-12">
//                   <DocumentTextIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
//                   <Typography variant="h5" color="blue-gray" className="mb-2">
//                     No Prescriptions
//                   </Typography>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {prescriptions.map((prescription) => (
//                     <Card key={prescription._id} className="border border-blue-gray-50">
//                       <CardBody className="p-4">
//                         <div className="flex justify-between items-center mb-4">
//                           <Typography variant="h5" color="blue-gray">
//                             {prescription.medication}
//                           </Typography>
//                           <Chip 
//                             value={prescription.status || "Active"} 
//                             color={prescription.status === "Completed" ? "green" : "blue"} 
//                             size="sm"
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <div className="flex justify-between">
//                             <Typography variant="small" className="font-semibold text-blue-gray-500">
//                               Dosage:
//                             </Typography>
//                             <Typography>{prescription.dosage}</Typography>
//                           </div>
//                           <div className="flex justify-between">
//                             <Typography variant="small" className="font-semibold text-blue-gray-500">
//                               Frequency:
//                             </Typography>
//                             <Typography>{prescription.frequency}</Typography>
//                           </div>
//                           <div className="flex justify-between">
//                             <Typography variant="small" className="font-semibold text-blue-gray-500">
//                               Start Date:
//                             </Typography>
//                             <Typography>{formatDate(prescription.startDate)}</Typography>
//                           </div>
//                         </div>
//                       </CardBody>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === "documents" && (
//             <DocumentsTab
//               documents={documents}
//               patientName={patientData.name}
//               onUpload={() => openModal('uploadDocument')}
//               onDelete={(doc) => {
//                 setSelectedDocument(doc);
//                 openModal('deleteDocument');
//               }}
//             />
//           )}
//         </CardBody>
//       </Card>

//       {/* Modals */}
//       <Dialog open={modals.create} handler={() => closeModal('create')}>
//         <DialogHeader>Add Vaccination</DialogHeader>
//         <DialogBody divider>
//           <div className="grid gap-6">
//             <Input
//               label="Vaccine Name"
//               value={vaccinationForm.vaccine}
//               onChange={(e) => updateVaccinationField('vaccine', e.target.value)}
//               required
//             />
//             <Input
//               label="Due Date"
//               type="date"
//               value={vaccinationForm.dueDate}
//               onChange={(e) => updateVaccinationField('dueDate', e.target.value)}
//               required
//             />
//             <Select
//               label="Status"
//               value={vaccinationForm.status}
//               onChange={(val) => updateVaccinationField('status', val)}
//             >
//               <Option value="pending">Pending</Option>
//               <Option value="done">Administered</Option>
//             </Select>
//             {vaccinationForm.status === "done" && (
//               <Input
//                 label="Administered Date"
//                 type="date"
//                 value={vaccinationForm.dateAdministered}
//                 onChange={(e) => updateVaccinationField('dateAdministered', e.target.value)}
//                 required
//               />
//             )}
//           </div>
//         </DialogBody>
//         <DialogFooter>
//           <Button
//             variant="text"
//             color="red"
//             onClick={() => closeModal('create')}
//             className="mr-1"
//           >
//             Cancel
//           </Button>
//           <Button 
//             variant="gradient" 
//             color="green" 
//             onClick={() => {
//               setVaccinations(prev => [...prev, {
//                 ...vaccinationForm,
//                 _id: Date.now().toString(),
//                 status: vaccinationForm.status
//               }]);
//               closeModal('create');
//               resetVaccinationForm();
//             }}
//             disabled={!isVaccinationFormValid}
//           >
//             Add Vaccination
//           </Button>
//         </DialogFooter>
//       </Dialog>

//       <Dialog open={modals.prescription} handler={() => closeModal('prescription')}>
//         <DialogHeader>Add Prescription</DialogHeader>
//         <DialogBody divider>
//           <div className="grid gap-6">
//             <Input
//               label="Medication"
//               value={prescriptionForm.medication}
//               onChange={(e) => setPrescriptionForm(prev => ({ ...prev, medication: e.target.value }))}
//               required
//             />
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Dosage"
//                 value={prescriptionForm.dosage}
//                 onChange={(e) => setPrescriptionForm(prev => ({ ...prev, dosage: e.target.value }))}
//                 required
//               />
//               <Input
//                 label="Frequency"
//                 value={prescriptionForm.frequency}
//                 onChange={(e) => setPrescriptionForm(prev => ({ ...prev, frequency: e.target.value }))}
//                 required
//               />
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <Input
//                 label="Start Date"
//                 type="date"
//                 value={prescriptionForm.startDate}
//                 onChange={(e) => setPrescriptionForm(prev => ({ ...prev, startDate: e.target.value }))}
//                 required
//               />
//               <Input
//                 label="End Date (Optional)"
//                 type="date"
//                 value={prescriptionForm.endDate}
//                 onChange={(e) => setPrescriptionForm(prev => ({ ...prev, endDate: e.target.value }))}
//               />
//             </div>
//             <Input
//               label="Notes (Optional)"
//               value={prescriptionForm.notes}
//               onChange={(e) => setPrescriptionForm(prev => ({ ...prev, notes: e.target.value }))}
//             />
//           </div>
//         </DialogBody>
//         <DialogFooter>
//           <Button
//             variant="text"
//             color="red"
//             onClick={() => closeModal('prescription')}
//             className="mr-1"
//           >
//             Cancel
//           </Button>
//           <Button 
//             variant="gradient" 
//             color="green" 
//             onClick={addPrescription}
//             disabled={!isPrescriptionFormValid || loading}
//           >
//             {loading ? "Adding..." : "Add Prescription"}
//           </Button>
//         </DialogFooter>
//       </Dialog>

//       <DocumentUploadModal
//         open={modals.uploadDocument}
//         onClose={() => closeModal('uploadDocument')}
//         formData={documentForm}
//         setFormData={setDocumentForm}
//         onSubmit={uploadDocument}
//         loading={loading}
//       />

//       <DeleteDocumentModal
//         open={modals.deleteDocument}
//         onClose={() => closeModal('deleteDocument')}
//         document={selectedDocument}
//         onConfirm={deleteDocument}
//         loading={loading}
//       />
//     </>
//   );
// }

// export default PatientDetail;















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
    
//     <BMICategoriesInfo />
//   </>
// );

// const BMICategoriesInfo = () => (
//   <div className="mt-8">
//     <Typography variant="h5" color="blue-gray" className="mb-4">
//       BMI Categories
//     </Typography>
//     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//       {BMI_CATEGORIES.map((category, index) => (
//         <Card key={index} className="border border-blue-gray-50">
//           <CardBody>
//             <Typography variant="h6" color={category.color}>
//               {category.name}
//             </Typography>
//             <Typography variant="small" className="text-blue-gray-500">
//               BMI {category.range}
//             </Typography>
//           </CardBody>
//         </Card>
//       ))}
//     </div>
//     <Typography variant="small" className="mt-4 text-blue-gray-500 italic">
//       Note: BMI categories may vary for children under 2 years old
//     </Typography>
//   </div>
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

// const AppointmentsList = ({ appointments }) => (
//   <div className="grid grid-cols-1 gap-6">
//     {appointments.map((appointment, index) => (
//       <Card key={index} className="border border-blue-gray-50">
//         <CardBody>
//           <div className="flex items-center justify-between">
//             <div>
//               <Typography variant="h5" color="blue-gray" className="mb-1">
//                 {appointment.name}
//               </Typography>
//               <Typography variant="small" className="text-blue-gray-500">
//                 {appointment.message}
//               </Typography>
//             </div>
//             <div className="text-right">
//               <Typography variant="h6" color="blue-gray">
//                 {appointment.time}
//               </Typography>
//               <Typography variant="small" className="text-blue-gray-500">
//                 {appointment.hour}
//               </Typography>
//             </div>
//           </div>
//         </CardBody>
//       </Card>
//     ))}
//   </div>
// );

// const EmptyAppointmentsState = ({ patientName }) => (
//   <div className="text-center py-12">
//     <CalendarDaysIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
//     <Typography variant="h5" color="blue-gray" className="mb-2">
//       No Appointments Found
//     </Typography>
//     <Typography variant="small" className="text-blue-gray-500">
//       No appointment records available for {patientName}
//     </Typography>
//   </div>
// );

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

// // Modal Components
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

// const ViewPrescriptionModal = ({ open, onClose, prescription }) => {
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
//     <Dialog open={open} handler={onClose} size="sm">
//       <DialogHeader>Prescription Details</DialogHeader>
//       <DialogBody divider>
//         <div className="space-y-4">
//           <div className="flex justify-between items-center">
//             <Typography variant="h5" color="blue-gray">
//               {prescription.medication}
//             </Typography>
//             <Chip value={status} color={statusColor} size="md" />
//           </div>
          
//           <div className="space-y-3">
//             <div className="flex justify-between">
//               <Typography variant="small" className="font-semibold text-blue-gray-500">
//                 Dosage:
//               </Typography>
//               <Typography>{prescription.dosage}</Typography>
//             </div>
            
//             <div className="flex justify-between">
//               <Typography variant="small" className="font-semibold text-blue-gray-500">
//                 Frequency:
//               </Typography>
//               <Typography>{prescription.frequency}</Typography>
//             </div>
            
//             <div className="flex justify-between">
//               <Typography variant="small" className="font-semibold text-blue-gray-500">
//                 Start Date:
//               </Typography>
//               <Typography>{formatDate(prescription.startDate)}</Typography>
//             </div>
            
//             {prescription.endDate && (
//               <div className="flex justify-between">
//                 <Typography variant="small" className="font-semibold text-blue-gray-500">
//                   End Date:
//                 </Typography>
//                 <Typography>{formatDate(prescription.endDate)}</Typography>
//               </div>
//             )}
            
//             {prescription.notes && (
//               <div>
//                 <Typography variant="small" className="font-semibold text-blue-gray-500">
//                   Notes:
//                 </Typography>
//                 <Typography className="mt-1">{prescription.notes}</Typography>
//               </div>
//             )}
//           </div>
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
//       <Button
//         variant="gradient"
//         onClick={() => onExportPDF(vaccination)}
//         className="mr-2"
//       >
//         <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
//         Export PDF
//       </Button>
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

// export default PatientDetail;

//             import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import Calendar from 'react-calendar';

// import {DocumentUploadModal,
//   DeleteDocumentModal,
//    DocumentsTab,
// } from './componet/tabs/DocumentsTab';

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
//   DocumentTextIcon
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
// import { getAppointments } from '@/data/appointmentsData';

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

// // Add TIME_SLOTS constant
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

// // Custom hooks
// const useFormState = (initialState = {}) => {
//   const [formData, setFormData] = useState(initialState);
  
//   const updateField = useCallback((field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   }, []);
  
//   const resetForm = useCallback(() => {
//     setFormData(initialState);
//   }, [initialState]);
  
//   return [formData, updateField, resetForm, setFormData];
// };

// const useModalState = () => {
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
  
//   const openModal = useCallback((modalName) => {
//     setModals(prev => ({ ...prev, [modalName]: true }));
//   }, []);
  
//   const closeModal = useCallback((modalName) => {
//     setModals(prev => ({ ...prev, [modalName]: false }));
//   }, []);
  
//   return [modals, openModal, closeModal];
// };

// // Main component
// export function PatientDetail() {
//   const { id } = useParams();
//   const { state } = useLocation();
//   const navigate = useNavigate();
  
//   // State management
//   const [activeTab, setActiveTab] = useState("overview");
//   const [selectedVaccination, setSelectedVaccination] = useState(null);
//   const [selectedPrescription, setSelectedPrescription] = useState(null);
//   const [vaccinations, setVaccinations] = useState(state?.vaccinations || []);
//   const [growthRecords, setGrowthRecords] = useState([]);
//   const [prescriptions, setPrescriptions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Document states
//   const [documents, setDocuments] = useState([]);
//   const [selectedDocument, setSelectedDocument] = useState(null);
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
//   const [appointment, setAppointment] = useState([]);
  
//   // Form state management
//   const [vaccinationForm, updateVaccinationField, resetVaccinationForm] = useFormState({
//     vaccine: "",
//     dueDate: "",
//     status: "pending",
//     dateAdministered: ""
//   });

//   const [growthForm, updateGrowthField, resetGrowthForm] = useFormState({
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

//   // Filter and sort state
//   const [filters, setFilters] = useState({
//     status: "all",
//     sortField: "dueDate",
//     sortDirection: "asc"
//   });
  
//   // Modal state
//   const [modals, openModal, closeModal] = useModalState();

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
//   const { patient, appointments = [] } = state;
  
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
//       name: appointment.doctor || "Medical Staff",
//       message: `Appointment for ${appointment.type || "check-up"}`,
//       time: appointment.date ? formatDate(appointment.date) : "No date specified",
//       hour: appointment.time ? appointment.time : "No time specified",
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
//       closeModal('uploadDocument');
//       setDocumentForm({ title: "", file: null });
//       toast.success('Document uploaded successfully!');
//     } catch (error) {
//       console.error('Error uploading document:', error);
//       toast.error('Failed to upload document');
//     } finally {
//       setLoading(false);
//     }
//   }, [documentForm, id, closeModal]);

//   const deleteDocument = useCallback(async () => {
//     if (!selectedDocument) return;
    
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/documents/${selectedDocument._id}`);
//       setDocuments(prev => prev.filter(doc => doc._id !== selectedDocument._id));
//       closeModal('deleteDocument');
//       toast.success('Document deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting document:', error);
//       toast.error('Failed to delete document');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedDocument, closeModal]);

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
//       closeModal('create');
//       resetVaccinationForm();
//       toast.success('Vaccination created successfully!');
//     } catch (error) {
//       console.error('Error creating vaccination:', error);
//       toast.error('Failed to create vaccination');
//     } finally {
//       setLoading(false);
//     }
//   }, [vaccinationForm, isVaccinationFormValid, id, closeModal, resetVaccinationForm]);
  
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
//       closeModal('edit');
//       toast.success('Vaccination updated successfully!');
//     } catch (error) {
//       console.error('Error updating vaccination:', error);
//       toast.error('Failed to update vaccination');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedVaccination, vaccinationForm, isVaccinationFormValid, closeModal]);
  
//   const deleteVaccination = useCallback(async () => {
//     if (!selectedVaccination) return;
    
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/vaccinations/${selectedVaccination._id}`);
//       setVaccinations(prev => prev.filter(v => v._id !== selectedVaccination._id));
//       closeModal('delete');
//       toast.success('Vaccination deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting vaccination:', error);
//       toast.error('Failed to delete vaccination');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedVaccination, closeModal]);
  
//   const addGrowthRecord = useCallback(async () => {
//     if (!isGrowthFormValid) return;
    
//     try {
//       setLoading(true);
//       const bmi = calculateBMI(growthForm.weight, growthForm.height);
//       const response = await axiosInstance.post('/growth-records', {
//         patientId: id,
//         heightCm: parseFloat(growthForm.height),
//         weightKg: parseFloat(growthForm.weight),
//         date: new Date(growthForm.growthDate).toISOString(),
//         bmi: parseFloat(bmi)
//       });
      
//       setGrowthRecords(prev => [...prev, response.data]);
//       closeModal('growth');
//       resetGrowthForm();
//       toast.success('Growth record added successfully!');
//     } catch (error) {
//       console.error('Error adding growth record:', error);
//       toast.error('Failed to add growth record');
//     } finally {
//       setLoading(false);
//     }
//   }, [growthForm, isGrowthFormValid, id, closeModal, resetGrowthForm]);
  
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
//       closeModal('prescription');
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
//   }, [prescriptionForm, isPrescriptionFormValid, id, closeModal]);

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
//       closeModal('prescription');
//       toast.success('Prescription updated successfully!');
//     } catch (error) {
//       console.error('Error updating prescription:', error);
//       toast.error('Failed to update prescription');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedPrescription, prescriptionForm, isPrescriptionFormValid, closeModal]);

//   const deletePrescription = useCallback(async () => {
//     if (!selectedPrescription) return;
    
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/prescriptions/${selectedPrescription._id}`);
//       setPrescriptions(prev => prev.filter(p => p._id !== selectedPrescription._id));
//       closeModal('deletePrescription');
//       toast.success('Prescription deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting prescription:', error);
//       toast.error('Failed to delete prescription');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedPrescription, closeModal]);

//   // Appointment handlers
//   const handleOpen = async (patientData) => {
//     setSelectedPatient(patientData);
//     openModal('appointment');
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
//       const appointmentsData = await getAppointments();
//       setAppointment(appointmentsData);
//     } catch (error) {
//       console.error('Error fetching appointments:', error);
//       toast.error('Failed to load appointment data');
//     }
//   };

//   const handleClose = () => {
//     closeModal('appointment');
//     setSelectedPatient(null);
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

//   const isTimeSlotBooked = (time) => {
//     if (!selectedDate) return false;
//     // This should check against your appointment data
//     // For now, returning false as placeholder
//     return false;
//   };

//   const tileDisabled = ({ date, view }) => {
//     return date < new Date().setHours(0, 0, 0, 0);
//   };

//   const tileClassName = ({ date, view }) => {
//     return '';
//   };

//   const handleAppointmentSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
    
//     try {
//       // Add your appointment submission logic here
//       console.log('Submitting appointment...', {
//         patient: selectedPatient,
//         date: selectedDate,
//         time: selectedTime,
//         reason: appointmentForm.reason
//       });
      
//       toast.success('Appointment booked successfully!');
//       handleClose();
//     } catch (error) {
//       console.error('Error booking appointment:', error);
//       toast.error('Failed to book appointment');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
  
//   // Event handlers
//   const handleOpenCreate = useCallback(() => {
//     resetVaccinationForm();
//     openModal('create');
//   }, [resetVaccinationForm, openModal]);
  
//   const handleOpenEdit = useCallback((vaccination) => {
//     setSelectedVaccination(vaccination);
//     updateVaccinationField('vaccine', vaccination.vaccine);
//     updateVaccinationField('dueDate', vaccination.dueDate.split('T')[0]);
//     updateVaccinationField('status', vaccination.status);
//     updateVaccinationField('dateAdministered', 
//       vaccination.dateAdministered ? vaccination.dateAdministered.split('T')[0] : ""
//     );
//     openModal('edit');
//   }, [updateVaccinationField, openModal]);
  
//   const handleOpenView = useCallback((vaccination) => {
//     setSelectedVaccination(vaccination);
//     openModal('view');
//   }, [openModal]);
  
//   const handleOpenDelete = useCallback((vaccination) => {
//     setSelectedVaccination(vaccination);
//     openModal('delete');
//   }, [openModal]);
  
//   const handleScheduleNext = useCallback((vaccination) => {
//     const nextDueDate = calculateNextDueDate(vaccination);
//     if (!nextDueDate) {
//       toast.warning('Cannot schedule next dose without administration date');
//       return;
//     }
    
//     updateVaccinationField('vaccine', vaccination.vaccine);
//     updateVaccinationField('dueDate', nextDueDate);
//     updateVaccinationField('status', "pending");
//     updateVaccinationField('dateAdministered', "");
//     openModal('create');
//   }, [updateVaccinationField, openModal]);
  
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
    
//     doc.save(`${patientData.name.replace(' ', '_')}_${vaccination.vaccine.replace(' ', '_')}.pdf`);
//   }, [patientData.name]);
  
//   const handleOpenAddPrescription = useCallback(() => {
//     setPrescriptionForm({
//       medication: "",
//       dosage: "",
//       frequency: "",
//       startDate: new Date().toISOString().split('T')[0],
//       endDate: "",
//       notes: ""
//     });
//     setSelectedPrescription(null);
//     openModal('prescription');
//   }, [openModal]);

//   const handleOpenEditPrescription = useCallback((prescription) => {
//     setSelectedPrescription(prescription);
//     setPrescriptionForm({
//       medication: prescription.medication,
//       dosage: prescription.dosage,
//       frequency: prescription.frequency,
//       startDate: prescription.startDate.split('T')[0],
//       endDate: prescription.endDate ? prescription.endDate.split('T')[0] : "",
//       notes: prescription.notes || ""
//     });
//     openModal('prescription');
//   }, [openModal]);

//   const handleOpenViewPrescription = useCallback((prescription) => {
//     setSelectedPrescription(prescription);
//     openModal('viewPrescription');
//   }, [openModal]);

//   const handleOpenDeletePrescription = useCallback((prescription) => {
//     setSelectedPrescription(prescription);
//     openModal('deletePrescription');
//   }, [openModal]);
  
//   const updateFilter = useCallback((field, value) => {
//     setFilters(prev => ({ ...prev, [field]: value }));
//   }, []);
  
//   const toggleSortDirection = useCallback(() => {
//     setFilters(prev => ({ 
//       ...prev, 
//       sortDirection: prev.sortDirection === "asc" ? "desc" : "asc" 
//     }));
//   }, []);
  
//   // Effects
//   useEffect(() => {
//     fetchGrowthRecords();
//   }, [fetchGrowthRecords]);
  
//   useEffect(() => {
//     if (activeTab === "prescriptions") {
//       fetchPrescriptions();
//     }
//   }, [activeTab, fetchPrescriptions]);

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
//             <OverviewTab 
//               patientData={patientData}
//               filteredVaccinations={filteredVaccinations}
//               processedAppointments={processedAppointments}
//               filters={filters}
//               updateFilter={updateFilter}
//               toggleSortDirection={toggleSortDirection}
//               handleOpenCreate={handleOpenCreate}
//               handleOpenView={handleOpenView}
//               handleOpenEdit={handleOpenEdit}
//               handleOpenDelete={handleOpenDelete}
//               handleScheduleNext={handleScheduleNext}
//               exportVaccinationPDF={exportVaccinationPDF}
//             />
//           )}

//           {activeTab === "vaccinations" && (
//             <VaccinationsTab
//               filteredVaccinations={filteredVaccinations}
//               filters={filters}
//               updateFilter={updateFilter}
//               toggleSortDirection={toggleSortDirection}
//               handleOpenCreate={handleOpenCreate}
//               handleOpenView={handleOpenView}
//               handleOpenEdit={handleOpenEdit}
//               handleOpenDelete={handleOpenDelete}
//             />
//           )}

//           {activeTab === "growth" && (
//             <GrowthTab
//               patientId={id}
//               patientName={`${patient.firstName} ${patient.lastName}`}
//               patientAge={parseInt(patient.age) || 0}
//             />
//           )}

//           {activeTab === "appointments" && (
//             <AppointmentsTab
//               processedAppointments={processedAppointments}
//               patientData={patientData}
//               onOpenAppointment={() => handleOpen(patientData)}
//             />
//           )}

//           {activeTab === "prescriptions" && (
//             <PrescriptionsTab
//               prescriptions={prescriptions}
//               patientName={patientData.name}
//               onAddPrescription={handleOpenAddPrescription}
//               onEditPrescription={handleOpenEditPrescription}
//               onDeletePrescription={handleOpenDeletePrescription}
//               onViewPrescription={handleOpenViewPrescription}
//             />
//           )}

//           {activeTab === "documents" && (
//             <DocumentsTab
//               documents={documents}
//               patientName={patientData.name}
//               onUpload={() => openModal('uploadDocument')}
//               onDelete={(doc) => {
//                 setSelectedDocument(doc);
//                 openModal('deleteDocument');
//               }}
//             />
//           )}
//         </CardBody>
//       </Card>

//       {/* Document Modals */}
//       <DocumentUploadModal
//         open={modals.uploadDocument}
//         onClose={() => closeModal('uploadDocument')}
//         formData={documentForm}
//         setFormData={setDocumentForm}
//         onSubmit={uploadDocument}
//         loading={loading}
//       />

//       <DeleteDocumentModal
//         open={modals.deleteDocument}
//         onClose={() => closeModal('deleteDocument')}
//         document={selectedDocument}
//         onConfirm={deleteDocument}
//         loading={loading}
//       />

//       {/* Vaccination Modals */}
//       <VaccinationModal
//         open={modals.create}
//         onClose={() => closeModal('create')}
//         title="Add New Vaccination"
//         formData={vaccinationForm}
//         updateField={updateVaccinationField}
//         onSubmit={createVaccination}
//         isValid={isVaccinationFormValid}
//         loading={loading}
//       />

//       <VaccinationModal
//         open={modals.edit}
//         onClose={() => closeModal('edit')}
//         title="Edit Vaccination Record"
//         formData={vaccinationForm}
//         updateField={updateVaccinationField}
//         onSubmit={updateVaccination}
//         isValid={isVaccinationFormValid}
//         loading={loading}
//         isEdit
//       />
    
//       <ViewVaccinationModal
//         open={modals.view}
//         onClose={() => closeModal('view')}
//         vaccination={selectedVaccination}
//         onScheduleNext={handleScheduleNext}
//         onExportPDF={exportVaccinationPDF}
//       />

//       <DeleteConfirmationModal
//         open={modals.delete}
//         onClose={() => closeModal('delete')}
//         vaccination={selectedVaccination}
//         onConfirm={deleteVaccination}
//         loading={loading}
//       />

//       {/* Prescription Modals */}
//       <PrescriptionModal
//         open={modals.prescription}
//         onClose={() => closeModal('prescription')}
//         formData={prescriptionForm}
//         setFormData={setPrescriptionForm}
//         onSubmit={selectedPrescription ? updatePrescription : addPrescription}
//         isValid={isPrescriptionFormValid}
//         loading={loading}
//         isEdit={!!selectedPrescription}
//         commonMedications={COMMON_MEDICATIONS}
//       />

//       <ViewPrescriptionModal
//         open={modals.viewPrescription}
//         onClose={() => closeModal('viewPrescription')}
//         prescription={selectedPrescription}
//       />

//       <DeletePrescriptionModal
//         open={modals.deletePrescription}
//         onClose={() => closeModal('deletePrescription')}
//         prescription={selectedPrescription}
//         onConfirm={deletePrescription}
//         loading={loading}
//       />

//       {/* Appointment Modal */}
//       <Dialog open={modals.appointment} handler={handleClose} size="xl" className="h-screen overflow-auto">
//         <DialogHeader>Book Appointment</DialogHeader>
//         <form onSubmit={handleAppointmentSubmit}>
//           <DialogBody className="flex flex-col gap-4">
//             {selectedPatient && (
//               <>
//                 <Typography variant="h6">Patient: {selectedPatient.name || patientData.name}</Typography>

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
//                   <Textarea
//                     value={appointmentForm.reason}
//                     onChange={(e) => setAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
//                     label="Reason for Visit *"
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
//             >
//               {isSubmitting ? 'Booking...' : 'Book Appointment'}
//             </Button>
//           </DialogFooter>
//         </form>
//       </Dialog>
//     </>
//   );
// }

// // Tab Components
// const OverviewTab = ({ 
//   patientData, 
//   filteredVaccinations, 
//   processedAppointments,
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
//   <>
//     <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
//       <VaccinationStatusCard
//         filteredVaccinations={filteredVaccinations}
//         filters={filters}
//         updateFilter={updateFilter}
//         toggleSortDirection={toggleSortDirection}
//         handleOpenCreate={handleOpenCreate}
//         handleOpenView={handleOpenView}
//         handleOpenEdit={handleOpenEdit}
//         handleOpenDelete={handleOpenDelete}
//         handleScheduleNext={handleScheduleNext}
//         exportVaccinationPDF={exportVaccinationPDF}
//       />
      
//       <PatientInfoCard patientData={patientData} />
      
//       <RecentActivitiesCard processedAppointments={processedAppointments} />
//     </div>
    
//     <VaccinationRecordsGrid
//       filteredVaccinations={filteredVaccinations}
//       handleOpenCreate={handleOpenCreate}
//       handleOpenView={handleOpenView}
//     />
//   </>
// );

// const VaccinationsTab = ({ 
//   filteredVaccinations, 
//   filters, 
//   updateFilter, 
//   toggleSortDirection, 
//   handleOpenCreate,
//   handleOpenView,
//   handleOpenEdit,
//   handleOpenDelete 
// }) => (
//   <div className="px-4">
//     <div className="flex items-center justify-between mb-6">
//       <Typography variant="h4" color="blue-gray">
//         Vaccination Management
//       </Typography>
//       <Button variant="gradient" onClick={handleOpenCreate}>
//         <PlusIcon className="h-4 w-4 mr-1" />
//         Add New Vaccination
//       </Button>
//     </div>
    
//     <FilterControls
//       filters={filters}
//       updateFilter={updateFilter}
//       toggleSortDirection={toggleSortDirection}
//     />
    
//     <VaccinationGrid
//       vaccinations={filteredVaccinations}
//       onView={handleOpenView}
//       onEdit={handleOpenEdit}
//       onDelete={handleOpenDelete}
//     />
//   </div>
// );

// const GrowthTab = ({
//   patientId,
//   patientName,
//   patientAge,
// }) => {
//   const [growthRecords, setGrowthRecords] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [growthForm, updateGrowthField, resetGrowthForm] = useFormState({
//     height: "",
//     weight: "",
//     growthDate: ""
//   });
//   const [modals, setModals] = useState({ growth: false });
//   const [error, setError] = useState(null);

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

//   const fetchGrowthRecords = useCallback(async () => {
//     try {
//       setLoading(true);
//       const response = await axiosInstance.get(`/growth-records/${patientId}`);
//       setGrowthRecords(response.data);
//       setError(null);
//     } catch (error) {
//       setError("Failed to load growth records");
//       toast.error("Failed to load growth records");
//     } finally {
//       setLoading(false);
//     }
//   }, [patientId]);

//   useEffect(() => {
//     fetchGrowthRecords();
//   }, [fetchGrowthRecords]);

//   const addGrowthRecord = useCallback(async () => {
//     if (!isGrowthFormValid) return;
//     try {
//       setLoading(true);
//       const bmi = calculateBMI(growthForm.weight, growthForm.height);
//       const response = await axiosInstance.post('/growth-records', {
//         patientId,
//         heightCm: parseFloat(growthForm.height),
//         weightKg: parseFloat(growthForm.weight),
//         date: new Date(growthForm.growthDate).toISOString(),
//         bmi: parseFloat(bmi)
//       });
      
//       setGrowthRecords(prev => [...prev, response.data]);
//       setModals({ growth: false });
//       resetGrowthForm();
//       toast.success('Growth record added successfully!');
//     } catch (error) {
//       toast.error('Failed to add growth record');
//     } finally {
//       setLoading(false);
//     }
//   }, [growthForm, isGrowthFormValid, patientId, resetGrowthForm]);

//   const deleteGrowthRecord = useCallback(async (recordId) => {
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/growth-records/${recordId}`);
//       setGrowthRecords(prev => prev.filter(record => record._id !== recordId));
//       toast.success('Growth record deleted successfully!');
//     } catch (error) {
//       toast.error('Failed to delete growth record');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const handleOpenGrowthModal = () => setModals({ growth: true });
//   const handleCloseGrowthModal = () => setModals({ growth: false });

//   return (
//     <div className="px-4">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <Typography variant="h4" color="blue-gray">
//             Growth Tracking
//           </Typography>
//           <Typography variant="small" className="text-blue-gray-500">
//             Monitor BMI and growth patterns over time
//           </Typography>
//         </div>
//         <Button variant="gradient" onClick={handleOpenGrowthModal}>
//           <PlusIcon className="h-4 w-4 mr-1" />
//           Add Growth Record
//         </Button>
//       </div>

//       {growthRecords && growthRecords.length > 0 ? (
//         <>
//           <GrowthCharts 
//             records={growthRecords} 
//             patientAge={patientAge}
//           />
          
//           <GrowthRecordsTable
//             records={growthRecords}
//             patientAge={patientAge}
//             onDelete={deleteGrowthRecord}
//             loading={loading}
//           />
//         </>
//       ) : (
//         <EmptyGrowthState
//           patientName={patientName}
//           onAddRecord={handleOpenGrowthModal}
//         />
//       )}

//       <GrowthModal
//         open={modals.growth}
//         onClose={handleCloseGrowthModal}
//         formData={growthForm}
//         updateField={updateGrowthField}
//         onSubmit={addGrowthRecord}
//         isValid={isGrowthFormValid}
//         loading={loading}
//         patientAge={patientAge}
//       />
//     </div>
//   );
// };

// const AppointmentsTab = ({ processedAppointments, patientData, onOpenAppointment }) => (
//   <div className="px-4">
//     <div className="mb-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <Typography variant="h4" color="blue-gray">
//             Appointment History
//           </Typography>
//           <Typography variant="small" className="text-blue-gray-500">
//             Past and upcoming appointments
//           </Typography>
//         </div>
//         <Button variant="gradient" onClick={onOpenAppointment}>
//           <PlusIcon className="h-4 w-4 mr-1" />
//           Book Appointment
//         </Button>
//       </div>
//     </div>
    
//     {processedAppointments.length > 0 ? (
//       <AppointmentsList appointments={processedAppointments} />
//     ) : (
//       <EmptyAppointmentsState patientName={patientData.name} />
//     )}
//   </div>
// );

// // Prescription Components
// const PrescriptionsTab = ({ 
//   prescriptions, 
//   patientName, 
//   onAddPrescription, 
//   onEditPrescription,
//   onDeletePrescription,
//   onViewPrescription
// }) => {
//   const groupedPrescriptions = useMemo(() => {
//     const groups = {};
//     prescriptions.forEach(prescription => {
//       const year = new Date(prescription.startDate).getFullYear();
//       if (!groups[year]) groups[year] = [];
//       groups[year].push(prescription);
//     });
//     return groups;
//   }, [prescriptions]);

//   return (
//     <div className="px-4">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <Typography variant="h4" color="blue-gray">
//             Prescription Management
//           </Typography>
//           <Typography variant="small" className="text-blue-gray-500">
//             Manage and track medication prescriptions
//           </Typography>
//         </div>
//         <Button variant="gradient" onClick={onAddPrescription}>
//           <PlusIcon className="h-4 w-4 mr-1" />
//           Add Prescription
//         </Button>
//       </div>

//       {prescriptions.length === 0 ? (
//         <EmptyPrescriptionsState 
//           patientName={patientName}
//           onAddPrescription={onAddPrescription}
//         />
//       ) : (
//         <div className="space-y-8">
//           {Object.entries(groupedPrescriptions)
//             .sort(([yearA], [yearB]) => yearB - yearA)
//             .map(([year, yearPrescriptions]) => (
//               <div key={year}>
//                 <Typography variant="h5" color="blue-gray" className="mb-4">
//                   {year}
//                 </Typography>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {yearPrescriptions
//                     .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
//                     .map((prescription) => (
//                       <PrescriptionCard
//                         key={prescription._id}
//                         prescription={prescription}
//                         onEdit={() => onEditPrescription(prescription)}
//                         onDelete={() => onDeletePrescription(prescription)}
//                         onView={() => onViewPrescription(prescription)}
//                       />
//                     ))}
//                 </div>
//               </div>
//             ))}
//         </div>
//       )}
//     </div>
//   );
// };

// const PrescriptionCard = ({ prescription, onEdit, onDelete, onView }) => {
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
  // Tooltip,
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

const PRESCRIPTION_STATUS = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled"
};

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

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
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

const getBMICategoryColor = (category) => {
  switch (category) {
    case "Normal": return "#4caf50";
    case "Underweight": return "#ff9800";
    case "Overweight": return "#f44336";
    case "Obese": return "#d32f2f";
    default: return "#9e9e9e";
  }
};

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

const GrowthCharts = ({ records, patientAge }) => {
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
  </>
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

const DocumentUploadModal = ({ 
  open, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  loading 
}) => (
  <Dialog open={open} handler={onClose}>
    <DialogHeader>Upload Document</DialogHeader>
    <DialogBody>
      <div className="space-y-4">
        <Input
          label="Document Title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />
        <div>
          <Typography variant="small" className="mb-2">
            Select File
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
        Cancel
      </Button>
      <Button 
        variant="gradient" 
        color="blue" 
        onClick={onSubmit}
        disabled={loading || !formData.title || !formData.file}
      >
        {loading ? "Uploading..." : "Upload Document"}
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
    <DialogHeader>Delete Document</DialogHeader>
    <DialogBody>
      <Typography variant="small" className="text-red-500">
        Are you sure you want to delete the document "{document?.title}"? 
        This action cannot be undone.
      </Typography>
    </DialogBody>
    <DialogFooter>
      <Button variant="text" onClick={onClose} className="mr-2">
        Cancel
      </Button>
      <Button 
        variant="gradient" 
        color="red" 
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? "Deleting..." : "Delete Document"}
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

// Main component
export function PatientDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // State management
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

  // Form state management
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

  // Appointment states
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
  
  // Appointment management states
  const [appointmentMode, setAppointmentMode] = useState('create');
  const [selectedAppointmentToEdit, setSelectedAppointmentToEdit] = useState(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Filter and sort state
  const [filters, setFilters] = useState({
    status: "all",
    sortField: "dueDate",
    sortDirection: "asc"
  });
  
  // Modal state
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
  const { patient } = state;
  
  // Patient data processing
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
      _id: appointment._id,
      name: appointment.doctor || "Medical Staff",
      message: `Appointment for ${appointment.type || "check-up"}`,
      time: appointment.date ? formatDate(appointment.date) : "No date specified",
      hour: appointment.time ? appointment.time : "No time specified",
      date: appointment.date,
      doctor: appointment.doctor,
      type: appointment.type,
      notes: appointment.notes,
      reason: appointment.reason || appointment.notes
    })),
    [patient.appointments]
  );

  // Filter and sort vaccinations
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

  // API functions
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/documents/patient/${id}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
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
      toast.success('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
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
      toast.success('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
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
  }, [id, state?.patient?._id]);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/appointments`);
      console.log('Fetched appointments:', response.data);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  // Vaccination API functions
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
      toast.success('Vaccination created successfully!');
    } catch (error) {
      console.error('Error creating vaccination:', error);
      toast.error('Failed to create vaccination');
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
      toast.success('Vaccination updated successfully!');
    } catch (error) {
      console.error('Error updating vaccination:', error);
      toast.error('Failed to update vaccination');
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
      toast.success('Vaccination deleted successfully!');
    } catch (error) {
      console.error('Error deleting vaccination:', error);
      toast.error('Failed to delete vaccination');
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
      toast.success('Growth record added successfully!');
    } catch (error) {
      console.error('Error adding growth record:', error);
      toast.error('Failed to add growth record');
    } finally {
      setLoading(false);
    }
  }, [growthForm, isGrowthFormValid, id]);
  
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
      setModals(prev => ({ ...prev, prescription: false }));
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
      setModals(prev => ({ ...prev, prescription: false }));
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
      setModals(prev => ({ ...prev, deletePrescription: false }));
      toast.success('Prescription deleted successfully!');
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast.error('Failed to delete prescription');
    } finally {
      setLoading(false);
    }
  }, [selectedPrescription]);

  // Appointment handlers
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
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointment data');
    }
  };

  const handleEditAppointment = (appointmentToEdit) => {
    setAppointmentMode('update');
    setSelectedAppointmentToEdit(appointmentToEdit);
    
    // Pre-fill form with existing data
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
      
      toast.success('Appointment deleted successfully!');
      
      // Refresh appointments
      await fetchAppointments();
      
      // Force refresh to show updated appointments
      window.location.reload();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
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
        toast.success('Appointment created successfully!');
      } else if (appointmentMode === 'update' && selectedAppointmentToEdit) {
        response = await axiosInstance.put(`/appointments/${selectedAppointmentToEdit._id}`, appointmentData);
        toast.success('Appointment updated successfully!');
      }

      if (response.status === 200 || response.status === 201) {
        setModals(prev => ({ ...prev, appointment: false }));
        
        // Refresh appointments
        await fetchAppointments();
        
        // Force refresh to show updated appointments
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Error processing appointment:', error);
      toast.error('Failed to process appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTimeSlotBooked = (time) => {
    if (!selectedDate) return false;
    
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    // Check if time slot is already booked
    const conflictingAppointment = appointments.find(appt => {
      const apptDate = new Date(appt.date).toISOString().split('T')[0];
      const isConflict = apptDate === selectedDateStr && appt.time === time;
      
      // Exclude current appointment when editing
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
    doc.text("VACCINATION RECORD", 105, 20, null, null, "center");
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Patient: ${patientData.name}`, 20, 40);
    doc.text(`Date of Birth: ${patientData.age}`, 20, 50);
    
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
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 150);
    doc.text("Official Vaccination Record - For Medical Use", 105, 160, null, null, "center");
    
    doc.setDrawColor(200);
    doc.rect(15, 15, 180, 150);
    
    doc.save(`${patientData.name.replace(' ', '_')}_${vaccination.vaccine.replace(' ', '_')}.pdf`);
  }, [patientData.name]);

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

  // Effects
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

  console.log('slected patient', selectedPatient);

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
            <div className="w-100 lg:w-1/3">
              <Tabs value={activeTab}>
                <TabsHeader>
                  <Tab value="overview" onClick={() => setActiveTab("overview")}>
                    <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Overview
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
                      toast.warning('Cannot schedule next dose without administration date');
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
                  Vaccination Management
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
                    Growth Tracking
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500">
                    Monitor BMI and growth patterns over time
                  </Typography>
                </div>
                <Button variant="gradient" onClick={() => setModals(prev => ({ ...prev, growth: true }))}>
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
                      Appointment Management
                    </Typography>
                    <Typography variant="small" className="text-blue-gray-500">
                      View, edit, and manage patient appointments
                    </Typography>
                  </div>
                  <Button variant="gradient" onClick={() => handleOpen(patientData)}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Book New Appointment
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
                            {appointment.name || 'Medical Appointment'}
                          </Typography>
                        </div>
                        <Chip value="Scheduled" color="blue" size="sm" />
                      </CardHeader>
                      <CardBody className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-blue-gray-500" />
                            <Typography variant="small" className="font-semibold text-blue-gray-500">
                              Date & Time:
                            </Typography>
                            <Typography>{appointment.time} at {appointment.hour}</Typography>
                          </div>
                          
                          {appointment.message && (
                            <div>
                              <Typography variant="small" className="font-semibold text-blue-gray-500">
                                Purpose:
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
                          Edit
                        </Button>
                        <Button 
                          variant="text" 
                          color="red" 
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment)}
                          className="flex items-center gap-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
                  <CalendarDaysIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
                  <Typography variant="h5" color="blue-gray" className="mb-2">
                    No Appointments Found
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500 mb-6 max-w-md mx-auto">
                    {patientData.name} doesn't have any appointments scheduled. Book the first appointment to get started.
                  </Typography>
                  <Button variant="gradient" onClick={() => handleOpen(patientData)}>
                    Book First Appointment
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
                    Prescription Management
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500">
                    Manage and track medication prescriptions
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
                  Add Prescription
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
                        {yearPrescriptions
                          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                          .map((prescription) => (
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
                    Document Management
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500">
                    Store and manage patient documents
                  </Typography>
                </div>
                <Button variant="gradient" onClick={() => setModals(prev => ({ ...prev, uploadDocument: true }))}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Upload Document
                </Button>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-16 bg-blue-gray-50/30 rounded-xl">
                  <DocumentTextIcon className="h-16 w-16 mx-auto text-blue-gray-300 mb-4" />
                  <Typography variant="h5" color="blue-gray" className="mb-2">
                    No Documents Found
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-500 mb-6 max-w-md mx-auto">
                    {patientData.name} doesn't have any documents yet. Upload the first document to get started.
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
                          Uploaded: {formatDate(document.createdAt)}
                        </Typography>
                      </CardBody>
                      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                        <Button 
                          variant="text" 
                          color="blue" 
                          size="sm"
                          onClick={() => window.open(document.fileUrl, '_blank')}
                        >
                          View
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
                          Delete
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

      {/* Document Modals */}
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

      {/* Vaccination Modals */}
      <VaccinationModal
        open={modals.create}
        onClose={() => setModals(prev => ({ ...prev, create: false }))}
        title="Add New Vaccination"
        formData={vaccinationForm}
        updateField={(field, value) => setVaccinationForm(prev => ({ ...prev, [field]: value }))}
        onSubmit={createVaccination}
        isValid={isVaccinationFormValid}
        loading={loading}
      />

      <VaccinationModal
        open={modals.edit}
        onClose={() => setModals(prev => ({ ...prev, edit: false }))}
        title="Edit Vaccination Record"
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
            toast.warning('Cannot schedule next dose without administration date');
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

      {/* Prescription Modals */}
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
      />

      <DeletePrescriptionModal
        open={modals.deletePrescription}
        onClose={() => setModals(prev => ({ ...prev, deletePrescription: false }))}
        prescription={selectedPrescription}
        onConfirm={deletePrescription}
        loading={loading}
      />

      {/* Growth Modal */}
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

      {/* Appointment Modal */}
        <Dialog open={modals.appointment} handler={handleClose} size="xl" className="h-screen overflow-auto">
          <DialogHeader>
            {appointmentMode === 'create' ? 'Book New Appointment' : 'Edit Appointment'}
          </DialogHeader>
          <form onSubmit={handleAppointmentSubmit}>
            <DialogBody className="flex flex-col gap-4">
          <Typography variant="small" color="gray">
            Please fill in the details for the appointment.
          </Typography>
          {(selectedPatient || patientData) && (
            <>
              <Typography variant="h6">
            Patient: {selectedPatient?.name || patientData.name}
              </Typography>

              {appointmentMode === 'update' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <Typography variant="small" color="blue-gray" className="font-semibold">
                Editing existing appointment
              </Typography>
            </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography variant="h6" className="mb-2">Select Date</Typography>
              {/* <input
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : (appointmentForm.date || '')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border rounded"
                required
              /> */}
              <Calendar
                      onChange={handleDateChange}
                      value={selectedDate}
                      minDate={new Date()}
                      tileDisabled={tileDisabled}
                      className="border rounded-lg p-2 w-full"
                    />
            </div>

            <div>
              <Typography variant="h6" className="mb-2">Available Time Slots</Typography>
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
                title={isBooked ? "Time slot already booked" : "Available"}
                  >
                {time}
                {isBooked && (
                  <span className="ml-1 text-xs">(Booked)</span>
                )}
                  </Button>
                );
              })}
                </div>
              ) : (
                <Typography variant="small" color="gray">
              Please select a date first
                </Typography>
              )}
            </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <Input
               
                label="Appointment Type"
                value={appointmentForm.type}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, type: e.target.value }))}
                placeholder="e.g., Consultation, Check-up, Follow-up"
              />
            </div>
              </div>

              <div> 

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
            color="neutral"
            type="submit"
            disabled={isSubmitting || !(selectedDate || appointmentForm.date) || !(selectedTime || appointmentForm.time)}
          >
            {isSubmitting 
              ? (appointmentMode === 'create' ? 'Booking...' : 'Updating...') 
              : (appointmentMode === 'create' ? 'Book Appointment' : 'Update Appointment')
            }
          </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* Appointment Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} handler={() => setDeleteConfirmOpen(false)}>
        <DialogHeader>Confirm Deletion</DialogHeader>
        <DialogBody>
          <Typography variant="small" className="text-red-500">
            Are you sure you want to delete this appointment? This action cannot be undone.
          </Typography>
          {appointmentToDelete && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <Typography variant="small" className="font-semibold">
                Appointment Details:
              </Typography>
              <Typography variant="small">
                Date: {appointmentToDelete.time}<br />
                Time: {appointmentToDelete.hour}<br />
                Purpose: {appointmentToDelete.message}
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
            Cancel
          </Button>
          <Button 
            variant="gradient" 
            color="red" 
            onClick={confirmDeleteAppointment}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Appointment"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default PatientDetail;







// // PatientDetail.jsx - Complete Refactored Version
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

// // Import our new components and utils
// import { PatientInfoCard } from './componet/PatientInfoCard';
// import { RecentActivitiesCard } from './componet/RecentActivitiesCard';
// import { FilterControls } from './componet/FilterControls';
// import { 
//   processPatientData, 
//   processAppointments, 
//   filterAndSortVaccinations,
//   formatDate,
//   calculateNextDueDate,
//   calculateBMI,
//   getBMICategory,
//   getBMICategoryColor,  
//   getStatusColor
// } from '../../utils/patientHelpers';
// import { 
//   STATUS_COLORS,
//   VACCINE_SCHEDULES,
//   BMI_CATEGORIES,
//   PRESCRIPTION_STATUS,
//   COMMON_MEDICATIONS,
//   TIME_SLOTS
// } from '../../constant/patientConstants';

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

// const PrescriptionCard = ({ prescription, onEdit, onDelete, onView }) => {
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

// // Modal Components
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
//       <Button
//         variant="gradient"
//         onClick={() => onExportPDF(vaccination)}
//         className="mr-2"
//       >
//         <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
//         Export PDF
//       </Button>
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

// // Main Component
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
//   const [appointments, setAppointments] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Form states
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
  
//   // Process patient data using helper functions
//   const { patient } = state;
//   const patientData = useMemo(() => processPatientData(patient), [patient]);
//   const patientAge = patient.age ? parseInt(patient.age) : 0;
//   const processedAppointments = useMemo(() => processAppointments(patient.appointments), [patient.appointments]);
  
//   // Filter and sort vaccinations
//   const filteredVaccinations = useMemo(() => 
//     filterAndSortVaccinations(vaccinations, filters), 
//     [vaccinations, filters]
//   );

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

//   // Helper functions
//   const updateFilter = useCallback((field, value) => {
//     setFilters(prev => ({ ...prev, [field]: value }));
//   }, []);
  
//   const toggleSortDirection = useCallback(() => {
//     setFilters(prev => ({ 
//       ...prev, 
//       sortDirection: prev.sortDirection === "asc" ? "desc" : "asc" 
//     }));
//   }, []);

//   const openModal = useCallback((modalName) => {
//     setModals(prev => ({ ...prev, [modalName]: true }));
//   }, []);

//   const closeModal = useCallback((modalName) => {
//     setModals(prev => ({ ...prev, [modalName]: false }));
//   }, []);

//   // API functions
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
//   }, []);
  
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
//       closeModal('create');
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
//   }, [vaccinationForm, isVaccinationFormValid, id, closeModal]);
  
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
//       closeModal('edit');
//       toast.success('Vaccination updated successfully!');
//     } catch (error) {
//       console.error('Error updating vaccination:', error);
//       toast.error('Failed to update vaccination');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedVaccination, vaccinationForm, isVaccinationFormValid, closeModal]);
  
//   const deleteVaccination = useCallback(async () => {
//     if (!selectedVaccination) return;
    
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/vaccinations/${selectedVaccination._id}`);
//       setVaccinations(prev => prev.filter(v => v._id !== selectedVaccination._id));
//       closeModal('delete');
//       toast.success('Vaccination deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting vaccination:', error);
//       toast.error('Failed to delete vaccination');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedVaccination, closeModal]);
  
//   const addGrowthRecord = useCallback(async () => {
//     if (!isGrowthFormValid) return;
    
//     try {
//       setLoading(true);
//       const bmi = calculateBMI(growthForm.weight, growthForm.height);
//       const response = await axiosInstance.post('/growth-records', {
//         patientId: id,
//         heightCm: parseFloat(growthForm.height),
//         weightKg: parseFloat(growthForm.weight),
//         date: new Date(growthForm.growthDate).toISOString(),
//         bmi: parseFloat(bmi)
//       });
      
//       setGrowthRecords(prev => [...prev, response.data]);
//       closeModal('growth');
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
//   }, [growthForm, isGrowthFormValid, id, closeModal]);
  
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
//       closeModal('prescription');
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
//   }, [prescriptionForm, isPrescriptionFormValid, id, closeModal]);

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
//       closeModal('prescription');
//       toast.success('Prescription updated successfully!');
//     } catch (error) {
//       console.error('Error updating prescription:', error);
//       toast.error('Failed to update prescription');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedPrescription, prescriptionForm, isPrescriptionFormValid, closeModal]);

//   const deletePrescription = useCallback(async () => {
//     if (!selectedPrescription) return;
    
//     try {
//       setLoading(true);
//       await axiosInstance.delete(`/prescriptions/${selectedPrescription._id}`);
//       setPrescriptions(prev => prev.filter(p => p._id !== selectedPrescription._id));
//       closeModal('deletePrescription');
//       toast.success('Prescription deleted successfully!');
//     } catch (error) {
//       console.error('Error deleting prescription:', error);
//       toast.error('Failed to delete prescription');
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedPrescription, closeModal]);

//   // Export PDF function
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
    
//     doc.save(`${patientData.name.replace(' ', '_')}_${vaccination.vaccine.replace(' ', '_')}.pdf`);
//   }, [patientData.name]);

//   // Appointment handlers
//   const handleOpen = async (patientData) => {
//     setSelectedPatient(patientData);
//     openModal('appointment');
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
//     } catch (error) {
//       console.error('Error fetching appointments:', error);
//       toast.error('Failed to load appointment data');
//     }
//   };

//   const handleEditAppointment = (appointmentToEdit) => {
//     setAppointmentMode('update');
//     setSelectedAppointmentToEdit(appointmentToEdit);
    
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
    
//     openModal('appointment');
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
      
//       await fetchAppointments();
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
//         closeModal('appointment');
//         await fetchAppointments();
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
    
//     const conflictingAppointment = appointments.find(appt => {
//       const apptDate = new Date(appt.date).toISOString().split('T')[0];
//       const isConflict = apptDate === selectedDateStr && appt.time === time;
      
//       if (appointmentMode === 'update' && selectedAppointmentToEdit) {
//         return isConflict && appt._id !== selectedAppointmentToEdit._id;
//       }
      
//       return isConflict;
//     });

//     return !!conflictingAppointment;
//   };

//   const handleClose = () => {
//     closeModal('appointment');
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
//                     openModal('create');
//                   }}
//                   handleOpenView={(vaccination) => {
//                     setSelectedVaccination(vaccination);
//                     openModal('view');
//                   }}
//                   handleOpenEdit={(vaccination) => {
//                     setSelectedVaccination(vaccination);
//                     setVaccinationForm({
//                       vaccine: vaccination.vaccine,
//                       dueDate: vaccination.dueDate.split('T')[0],
//                       status: vaccination.status,
//                       dateAdministered: vaccination.dateAdministered?.split('T')[0] || ""
//                     });
//                     openModal('edit');
//                   }}
//                   handleOpenDelete={(vaccination) => {
//                     setSelectedVaccination(vaccination);
//                     openModal('delete');
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
//                     openModal('create');
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
//                   openModal('create');
//                 }}
//                 handleOpenView={(vaccination) => {
//                   setSelectedVaccination(vaccination);
//                   openModal('view');
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
//                   openModal('create');
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
//                   openModal('view');
//                 }}
//                 onEdit={(vaccination) => {
//                   setSelectedVaccination(vaccination);
//                   setVaccinationForm({
//                     vaccine: vaccination.vaccine,
//                     dueDate: vaccination.dueDate.split('T')[0],
//                     status: vaccination.status,
//                     dateAdministered: vaccination.dateAdministered?.split('T')[0] || ""
//                   });
//                   openModal('edit');
//                 }}
//                 onDelete={(vaccination) => {
//                   setSelectedVaccination(vaccination);
//                   openModal('delete');
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
//                 <Button variant="gradient" onClick={() => openModal('growth')}>
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
//                   onAddRecord={() => openModal('growth')}
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
//                   openModal('prescription');
//                 }}>
//                   <PlusIcon className="h-4 w-4 mr-1" />
//                   Add Prescription
//                 </Button>
//               </div>

//               {prescriptions.length === 0 ? (
//                 <EmptyPrescriptionsState 
//                   patientName={patientData.name}
//                   onAddPrescription={() => openModal('prescription')}
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
//                         {yearPrescriptions
//                           .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
//                           .map((prescription) => (
//                             <PrescriptionCard
//                               key={prescription._id}
//                               prescription={prescription}
//                               onEdit={() => {
//                                 setSelectedPrescription(prescription);
//                                 setPrescriptionForm({
//                                   medication: prescription.medication,
//                                   dosage: prescription.dosage,
//                                   frequency: prescription.frequency,
//                                   startDate: prescription.startDate.split('T')[0],
//                                   endDate: prescription.endDate ? prescription.endDate.split('T')[0] : "",
//                                   notes: prescription.notes || ""
//                                 });
//                                 openModal('prescription');
//                               }}
//                               onDelete={() => {
//                                 setSelectedPrescription(prescription);
//                                 openModal('deletePrescription');
//                               }}
//                               onView={() => {
//                                 setSelectedPrescription(prescription);
//                                 openModal('viewPrescription');
//                               }}
//                             />
//                           ))}
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
//                 <Button variant="gradient" onClick={() => openModal('uploadDocument')}>
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
//                             openModal('deleteDocument');
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

//       {/* All Modals */}
//       <VaccinationModal
//         open={modals.create}
//         onClose={() => closeModal('create')}
//         title="Add New Vaccination"
//         formData={vaccinationForm}
//         updateField={(field, value) => setVaccinationForm(prev => ({ ...prev, [field]: value }))}
//         onSubmit={createVaccination}
//         isValid={isVaccinationFormValid}
//         loading={loading}
//       />

//       <VaccinationModal
//         open={modals.edit}
//         onClose={() => closeModal('edit')}
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
//         onClose={() => closeModal('view')}
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
//           openModal('create');
//         }}
//         onExportPDF={exportVaccinationPDF}
//       />

//       <DeleteConfirmationModal
//         open={modals.delete}
//         onClose={() => closeModal('delete')}
//         vaccination={selectedVaccination}
//         onConfirm={deleteVaccination}
//         loading={loading}
//       />

//       <PrescriptionModal
//         open={modals.prescription}
//         onClose={() => closeModal('prescription')}
//         formData={prescriptionForm}
//         setFormData={setPrescriptionForm}
//         onSubmit={selectedPrescription ? updatePrescription : addPrescription}
//         isValid={isPrescriptionFormValid}
//         loading={loading}
//         isEdit={!!selectedPrescription}
//         commonMedications={COMMON_MEDICATIONS}
//       />

//       <GrowthModal
//         open={modals.growth}
//         onClose={() => closeModal('growth')}
//         formData={growthForm}
//         updateField={(field, value) => setGrowthForm(prev => ({ ...prev, [field]: value }))}
//         onSubmit={addGrowthRecord}
//         isValid={isGrowthFormValid}
//         loading={loading}
//         patientAge={patientAge}
//       />

//       {/* Appointment Modal */}
//       <Dialog open={modals.appointment} handler={handleClose} size="xl" className="h-screen overflow-auto">
//         <DialogHeader>
//           {appointmentMode === 'create' ? 'Book New Appointment' : 'Edit Appointment'}
//         </DialogHeader>
//         <form onSubmit={handleAppointmentSubmit}>
//           <DialogBody className="flex flex-col gap-4">
//             <Typography variant="small" color="gray">
//               Please fill in the details for the appointment.
//             </Typography>
//             {(selectedPatient || patientData) && (
//               <>
//                 <Typography variant="h6">
//                   Patient: {selectedPatient?.name || patientData.name}
//                 </Typography>

//                 {appointmentMode === 'update' && (
//                   <div className="bg-blue-50 p-3 rounded-lg">
//                     <Typography variant="small" color="blue-gray" className="font-semibold">
//                       Editing existing appointment
//                     </Typography>
//                   </div>
//                 )}

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Typography variant="h6" className="mb-2">Select Date</Typography>
//                     <Calendar
//                       onChange={handleDateChange}
//                       value={selectedDate}
//                       minDate={new Date()}
//                       tileDisabled={tileDisabled}
//                       className="border rounded-lg p-2 w-full"
//                     />
//                   </div>

//                   <div>
//                     <Typography variant="h6" className="mb-2">Available Time Slots</Typography>
//                     {selectedDate || appointmentForm.date ? (
//                       <div className="grid grid-cols-3 gap-2">
//                         {TIME_SLOTS.map(time => {
//                           const isBooked = isTimeSlotBooked(time);
//                           const isCurrentSelected = selectedTime === time || appointmentForm.time === time;
                          
//                           return (
//                             <Button
//                               key={time}
//                               variant={isCurrentSelected ? "filled" : "outlined"}
//                               color={isBooked ? "red" : isCurrentSelected ? "black" : "gray"}
//                               onClick={() => !isBooked && handleTimeSelect(time)}
//                               disabled={isBooked}
//                               className="p-2 text-sm"
//                               title={isBooked ? "Time slot already booked" : "Available"}
//                             >
//                               {time}
//                               {isBooked && (
//                                 <span className="ml-1 text-xs">(Booked)</span>
//                               )}
//                             </Button>
//                           );
//                         })}
//                       </div>
//                     ) : (
//                       <Typography variant="small" color="gray">
//                         Please select a date first
//                       </Typography>
//                     )}
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Input
//                       label="Appointment Type"
//                       value={appointmentForm.type}
//                       onChange={(e) => setAppointmentForm(prev => ({ ...prev, type: e.target.value }))}
//                       placeholder="e.g., Consultation, Check-up, Follow-up"
//                     />
//                   </div>
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
//               color="neutral"
//               type="submit"
//               disabled={isSubmitting || !(selectedDate || appointmentForm.date) || !(selectedTime || appointmentForm.time)}
//             >
//               {isSubmitting 
//                 ? (appointmentMode === 'create' ? 'Booking...' : 'Updating...') 
//                 : (appointmentMode === 'create' ? 'Book Appointment' : 'Update Appointment')
//               }
//             </Button>
//           </DialogFooter>
//         </form>
//       </Dialog>

//       {/* Appointment Delete Confirmation Modal */}
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