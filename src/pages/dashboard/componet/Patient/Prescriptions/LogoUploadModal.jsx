// Composant React avec gestion d'erreurs améliorée - Interface en Français
import React, { useState, useRef } from 'react';
import {
  Button,
  Typography,
  Input,
  Card,
  CardBody,
  Alert
} from "@material-tailwind/react";
import {
  CloudArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/solid";
import { uploadLogo } from '@/data/sitting';

const LogoUploadPage = ({
  onSubmit,
  loading = false,
  title = "Télécharger le Logo",
  description = "Téléchargez un nouveau logo pour votre organisation"
}) => {
  const [logoForm, setLogoForm] = useState({
    file: null,
    name: "",
    description: ""
  });
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    console.log('Validation du fichier:', file);
    
    if (!file) {
      return "Aucun fichier fourni";
    }
    
    if (!(file instanceof File)) {
      return "Objet fichier invalide";
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
    
    console.log('Type de fichier:', file.type);
    console.log('Taille du fichier:', file.size);
    
    if (!allowedTypes.includes(file.type)) {
      return "Veuillez télécharger un fichier image valide (JPEG, PNG, SVG, WebP ou GIF)";
    }
    if (file.size > maxSize) {
      return "La taille du fichier doit être inférieure à 5MB";
    }
    if (file.size === 0) {
      return "Le fichier semble être vide";
    }
    return null;
  };

  const handleFileSelect = (file) => {
    console.log('Fichier sélectionné:', file);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError("");
    setLogoForm(prev => ({ ...prev, file }));
    
    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.onerror = () => setError("Échec de la lecture du fichier");
    reader.readAsDataURL(file);
    
    // Remplir automatiquement le nom si vide
    if (!logoForm.name) {
      const fileName = file.name.split('.')[0];
      setLogoForm(prev => ({ ...prev, name: fileName }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    setLogoForm(prev => ({ ...prev, file: null }));
    setPreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Réinitialiser les erreurs précédentes
    setError("");
    
    // Valider le formulaire
    if (!logoForm.file) {
      setError("Veuillez sélectionner un fichier à télécharger");
      return;
    }
    
    if (!logoForm.name.trim()) {
      setError("Veuillez entrer un nom pour le logo");
      return;
    }
    
    // Valider l'objet fichier
    if (!(logoForm.file instanceof File)) {
      setError("Fichier invalide sélectionné. Veuillez sélectionner un nouveau fichier.");
      return;
    }
    
    // Validation finale du fichier
    const validationError = validateFile(logoForm.file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    console.log("Soumission du formulaire logo:", {
      file: logoForm.file,
      name: logoForm.name,
      description: logoForm.description,
      fileDetails: {
        name: logoForm.file.name,
        size: logoForm.file.size,
        type: logoForm.file.type,
        lastModified: logoForm.file.lastModified
      }
    });
    
    setIsUploading(true);
    
    try {
      const result = await uploadLogo(logoForm);
      console.log('Téléchargement réussi:', result);
      
      // Réinitialiser le formulaire en cas de succès
      setLogoForm({ file: null, name: "", description: "" });
      setPreview(null);
      setError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Appeler onSubmit du parent si fourni
      if (onSubmit) {
        onSubmit(result);
      }
      
    } catch (error) {
      console.error('Échec du téléchargement:', error);
      
      // Définir un message d'erreur convivial
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          setError(data.message || "Requête incorrecte. Veuillez vérifier votre fichier et réessayer.");
        } else if (status === 413) {
          setError("Fichier trop volumineux. Veuillez sélectionner un fichier plus petit.");
        } else if (status === 415) {
          setError("Type de fichier non pris en charge. Veuillez sélectionner un fichier image valide.");
        } else {
          setError(`Échec du téléchargement: ${data.message || 'Erreur inconnue'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        setError("Timeout du téléchargement. Veuillez réessayer avec un fichier plus petit.");
      } else {
        setError("Échec du téléchargement du logo. Veuillez vérifier votre connexion et réessayer.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const isFormValid = logoForm.file && logoForm.name.trim() && !error && !isUploading;

  return (
    <div className="max-w-xxl mx-auto p-6">
      <Typography variant="h3" color="blue-gray" className="mb-2">
        {title}
      </Typography>
      <Typography variant="small" className="text-blue-gray-500 font-normal mb-6">
        {description}
      </Typography>

      {error && (
        <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />} className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Typography variant="h6" color="blue-gray">
            Fichier Logo *
          </Typography>
          {!logoForm.file ? (
            <Card
              className={`border-2 border-dashed cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-blue-gray-200 hover:border-blue-300 hover:bg-blue-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardBody className="text-center py-12">
                <CloudArrowUpIcon className="h-16 w-16 mx-auto text-blue-gray-400 mb-4" />
                <Typography variant="h6" color="blue-gray" className="mb-2">
                  Déposez votre logo ici ou cliquez pour parcourir
                </Typography>
                <Typography variant="small" className="text-blue-gray-500 mb-4">
                  Formats pris en charge: JPEG, PNG, SVG, WebP, GIF (Max 5MB)
                </Typography>
                <Button variant="outlined" size="sm">
                  Choisir un Fichier
                </Button>
              </CardBody>
            </Card>
          ) : (
            <Card className="border border-blue-gray-200">
              <CardBody className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Aperçu du logo"
                        className="w-20 h-20 object-contain rounded-lg border border-blue-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-blue-gray-50 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-blue-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <Typography variant="h6" color="blue-gray">
                      {logoForm.file.name}
                    </Typography>
                    <Typography variant="small" className="text-blue-gray-500">
                      {(logoForm.file.size / 1024 / 1024).toFixed(2)} MB • {logoForm.file.type}
                    </Typography>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <Typography variant="small" className="text-green-500">
                        Fichier validé avec succès
                      </Typography>
                    </div>
                  </div>
                  <Button
                    variant="text"
                    color="red"
                    size="sm"
                    onClick={removeFile}
                    className="p-2"
                    disabled={isUploading}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif"
            className="hidden"
          />
        </div>

        <div className="grid gap-4">
          <div>
            <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
              Nom du Logo *
            </Typography>
            <Input
              value={logoForm.name}
              onChange={(e) => setLogoForm(prev => ({ ...prev, name: e.target.value }))}
              label="Entrez le nom du logo"
              placeholder="ex: Logo de l'Entreprise, Logo de la Marque"
              disabled={isUploading}
            />
          </div>
          <div>
            <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
              Description (Optionnel)
            </Typography>
            <Input
              value={logoForm.description}
              onChange={(e) => setLogoForm(prev => ({ ...prev, description: e.target.value }))}
              label="Entrez la description"
              placeholder="Brève description de l'utilisation du logo"
              disabled={isUploading}
            />
          </div>
        </div>

        <Card className="bg-blue-50 border border-blue-200">
          <CardBody className="p-4">
            <Typography variant="h6" color="blue-gray" className="mb-2">
              Directives de Téléchargement
            </Typography>
            <ul className="text-sm text-blue-gray-600 space-y-1">
              <li>• Utilisez des images haute résolution pour une meilleure qualité</li>
              <li>• Le format SVG est recommandé pour la mise à l'échelle</li>
              <li>• Assurez-vous que le logo a un arrière-plan transparent si nécessaire</li>
              <li>• Taille maximale du fichier: 5MB</li>
              <li>• Formats pris en charge: JPEG, PNG, SVG, WebP, GIF</li>
            </ul>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            variant="gradient"
            color="blue"
            type="submit"
            disabled={!isFormValid}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Téléchargement...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4" />
                Télécharger le Logo
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LogoUploadPage;




// // Fixed React component with better error handling
// import React, { useState, useRef } from 'react';
// import {
//   Button,
//   Typography,
//   Input,
//   Card,
//   CardBody,
//   Alert
// } from "@material-tailwind/react";
// import {
//   CloudArrowUpIcon,
//   PhotoIcon,
//   XMarkIcon,
//   ExclamationTriangleIcon,
//   CheckCircleIcon
// } from "@heroicons/react/24/solid";
// import { uploadLogo } from '@/data/sitting';

// const LogoUploadPage = ({
//   onSubmit,
//   loading = false,
//   title = "Upload Logo",
//   description = "Upload a new logo for your organization"
// }) => {
//   const [logoForm, setLogoForm] = useState({
//     file: null,
//     name: "",
//     description: ""
//   });
//   const [preview, setPreview] = useState(null);
//   const [dragActive, setDragActive] = useState(false);
//   const [error, setError] = useState("");
//   const [isUploading, setIsUploading] = useState(false);
//   const fileInputRef = useRef(null);

//   const validateFile = (file) => {
//     console.log('Validating file:', file);
    
//     if (!file) {
//       return "No file provided";
//     }
    
//     if (!(file instanceof File)) {
//       return "Invalid file object";
//     }

//     const maxSize = 5 * 1024 * 1024; // 5MB
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
    
//     console.log('File type:', file.type);
//     console.log('File size:', file.size);
    
//     if (!allowedTypes.includes(file.type)) {
//       return "Please upload a valid image file (JPEG, PNG, SVG, WebP, or GIF)";
//     }
//     if (file.size > maxSize) {
//       return "File size must be less than 5MB";
//     }
//     if (file.size === 0) {
//       return "File appears to be empty";
//     }
//     return null;
//   };

//   const handleFileSelect = (file) => {
//     console.log('File selected:', file);
    
//     const validationError = validateFile(file);
//     if (validationError) {
//       setError(validationError);
//       return;
//     }
    
//     setError("");
//     setLogoForm(prev => ({ ...prev, file }));
    
//     // Create preview
//     const reader = new FileReader();
//     reader.onload = (e) => setPreview(e.target.result);
//     reader.onerror = () => setError("Failed to read file");
//     reader.readAsDataURL(file);
    
//     // Auto-fill name if empty
//     if (!logoForm.name) {
//       const fileName = file.name.split('.')[0];
//       setLogoForm(prev => ({ ...prev, name: fileName }));
//     }
//   };

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);
    
//     const files = e.dataTransfer.files;
//     if (files && files[0]) {
//       handleFileSelect(files[0]);
//     }
//   };

//   const handleInputChange = (e) => {
//     const files = e.target.files;
//     if (files && files[0]) {
//       handleFileSelect(files[0]);
//     }
//   };

//   const removeFile = () => {
//     setLogoForm(prev => ({ ...prev, file: null }));
//     setPreview(null);
//     setError("");
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Reset previous errors
//     setError("");
    
//     // Validate form
//     if (!logoForm.file) {
//       setError("Please select a file to upload");
//       return;
//     }
    
//     if (!logoForm.name.trim()) {
//       setError("Please enter a name for the logo");
//       return;
//     }
    
//     // Validate file object
//     if (!(logoForm.file instanceof File)) {
//       setError("Invalid file selected. Please select a new file.");
//       return;
//     }
    
//     // Final file validation
//     const validationError = validateFile(logoForm.file);
//     if (validationError) {
//       setError(validationError);
//       return;
//     }
    
//     console.log("Submitting logo form:", {
//       file: logoForm.file,
//       name: logoForm.name,
//       description: logoForm.description,
//       fileDetails: {
//         name: logoForm.file.name,
//         size: logoForm.file.size,
//         type: logoForm.file.type,
//         lastModified: logoForm.file.lastModified
//       }
//     });
    
//     setIsUploading(true);
    
//     try {
//       const result = await uploadLogo(logoForm);
//       console.log('Upload successful:', result);
      
//       // Reset form on success
//       setLogoForm({ file: null, name: "", description: "" });
//       setPreview(null);
//       setError("");
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
      
//       // Call parent onSubmit if provided
//       if (onSubmit) {
//         onSubmit(result);
//       }
      
//     } catch (error) {
//       console.error('Upload failed:', error);
      
//       // Set user-friendly error message
//       if (error.response) {
//         const status = error.response.status;
//         const data = error.response.data;
        
//         if (status === 400) {
//           setError(data.message || "Bad request. Please check your file and try again.");
//         } else if (status === 413) {
//           setError("File too large. Please select a smaller file.");
//         } else if (status === 415) {
//           setError("Unsupported file type. Please select a valid image file.");
//         } else {
//           setError(`Upload failed: ${data.message || 'Unknown error'}`);
//         }
//       } else if (error.code === 'ECONNABORTED') {
//         setError("Upload timeout. Please try again with a smaller file.");
//       } else {
//         setError("Failed to upload logo. Please check your connection and try again.");
//       }
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const isFormValid = logoForm.file && logoForm.name.trim() && !error && !isUploading;

//   return (
//     <div className="max-w-xxl mx-auto p-6">
//       <Typography variant="h3" color="blue-gray" className="mb-2">
//         {title}
//       </Typography>
//       <Typography variant="small" className="text-blue-gray-500 font-normal mb-6">
//         {description}
//       </Typography>

//       {error && (
//         <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />} className="mb-4">
//           {error}
//         </Alert>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div>
//           <Typography variant="h6" color="blue-gray">
//             Logo File *
//           </Typography>
//           {!logoForm.file ? (
//             <Card
//               className={`border-2 border-dashed cursor-pointer transition-all duration-200 ${
//                 dragActive
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-blue-gray-200 hover:border-blue-300 hover:bg-blue-gray-50'
//               }`}
//               onDragEnter={handleDrag}
//               onDragLeave={handleDrag}
//               onDragOver={handleDrag}
//               onDrop={handleDrop}
//               onClick={() => fileInputRef.current?.click()}
//             >
//               <CardBody className="text-center py-12">
//                 <CloudArrowUpIcon className="h-16 w-16 mx-auto text-blue-gray-400 mb-4" />
//                 <Typography variant="h6" color="blue-gray" className="mb-2">
//                   Drop your logo here or click to browse
//                 </Typography>
//                 <Typography variant="small" className="text-blue-gray-500 mb-4">
//                   Supports: JPEG, PNG, SVG, WebP, GIF (Max 5MB)
//                 </Typography>
//                 <Button variant="outlined" size="sm">
//                   Choose File
//                 </Button>
//               </CardBody>
//             </Card>
//           ) : (
//             <Card className="border border-blue-gray-200">
//               <CardBody className="p-4">
//                 <div className="flex items-center gap-4">
//                   <div className="flex-shrink-0">
//                     {preview ? (
//                       <img
//                         src={preview}
//                         alt="Logo preview"
//                         className="w-20 h-20 object-contain rounded-lg border border-blue-gray-200"
//                       />
//                     ) : (
//                       <div className="w-20 h-20 bg-blue-gray-50 rounded-lg flex items-center justify-center">
//                         <PhotoIcon className="h-8 w-8 text-blue-gray-400" />
//                       </div>
//                     )}
//                   </div>
//                   <div className="flex-grow">
//                     <Typography variant="h6" color="blue-gray">
//                       {logoForm.file.name}
//                     </Typography>
//                     <Typography variant="small" className="text-blue-gray-500">
//                       {(logoForm.file.size / 1024 / 1024).toFixed(2)} MB • {logoForm.file.type}
//                     </Typography>
//                     <div className="flex items-center gap-1 mt-1">
//                       <CheckCircleIcon className="h-4 w-4 text-green-500" />
//                       <Typography variant="small" className="text-green-500">
//                         File validated successfully
//                       </Typography>
//                     </div>
//                   </div>
//                   <Button
//                     variant="text"
//                     color="red"
//                     size="sm"
//                     onClick={removeFile}
//                     className="p-2"
//                     disabled={isUploading}
//                   >
//                     <XMarkIcon className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </CardBody>
//             </Card>
//           )}
//           <input
//             ref={fileInputRef}
//             type="file"
//             onChange={handleInputChange}
//             accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif"
//             className="hidden"
//           />
//         </div>

//         <div className="grid gap-4">
//           <div>
//             <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
//               Logo Name *
//             </Typography>
//             <Input
//               value={logoForm.name}
//               onChange={(e) => setLogoForm(prev => ({ ...prev, name: e.target.value }))}
//               label="Enter logo name"
//               placeholder="e.g., Company Logo, Brand Logo"
//               disabled={isUploading}
//             />
//           </div>
//           <div>
//             <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
//               Description (Optional)
//             </Typography>
//             <Input
//               value={logoForm.description}
//               onChange={(e) => setLogoForm(prev => ({ ...prev, description: e.target.value }))}
//               label="Enter description"
//               placeholder="Brief description of the logo usage"
//               disabled={isUploading}
//             />
//           </div>
//         </div>

//         <Card className="bg-blue-50 border border-blue-200">
//           <CardBody className="p-4">
//             <Typography variant="h6" color="blue-gray" className="mb-2">
//               Upload Guidelines
//             </Typography>
//             <ul className="text-sm text-blue-gray-600 space-y-1">
//               <li>• Use high-resolution images for best quality</li>
//               <li>• SVG format is recommended for scalability</li>
//               <li>• Ensure the logo has transparent background if needed</li>
//               <li>• Maximum file size: 5MB</li>
//               <li>• Supported formats: JPEG, PNG, SVG, WebP, GIF</li>
//             </ul>
//           </CardBody>
//         </Card>

//         <div className="flex justify-end gap-2">
//           <Button
//             variant="gradient"
//             color="blue"
//             type="submit"
//             disabled={!isFormValid}
//             className="flex items-center gap-2"
//           >
//             {isUploading ? (
//               <>
//                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                 Uploading...
//               </>
//             ) : (
//               <>
//                 <CloudArrowUpIcon className="h-4 w-4" />
//                 Upload Logo
//               </>
//             )}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default LogoUploadPage;





// // import React, { useState, useRef } from 'react';
// // import {
// //   Button,
// //   Typography,
// //   Input,
// //   Card,
// //   CardBody,
// //   Alert
// // } from "@material-tailwind/react";
// // import {
// //   CloudArrowUpIcon,
// //   PhotoIcon,
// //   XMarkIcon,
// //   ExclamationTriangleIcon,
// //   CheckCircleIcon
// // } from "@heroicons/react/24/solid";
// // import { uploadLogo } from '@/data/sitting';

// // const LogoUploadPage = ({
// //   onSubmit,
// //   loading = false,
// //   title = "Upload Logo",
// //   description = "Upload a new logo for your organization"
// // }) => {
// //   const [logoForm, setLogoForm] = useState({
// //     file: null,
// //     name: "",
// //     description: ""
// //   });
// //   const [preview, setPreview] = useState(null);
// //   const [dragActive, setDragActive] = useState(false);
// //   const [error, setError] = useState("");
// //   const fileInputRef = useRef(null);

// //   const validateFile = (file) => {
// //     const maxSize = 5 * 1024 * 1024;
// //     const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
// //     if (!allowedTypes.includes(file.type)) {
// //       return "Please upload a valid image file (JPEG, PNG, SVG, or WebP)";
// //     }
// //     if (file.size > maxSize) {
// //       return "File size must be less than 5MB";
// //     }
// //     return null;
// //   };

// //   const handleFileSelect = (file) => {
// //     const validationError = validateFile(file);
// //     if (validationError) {
// //       setError(validationError);
// //       return;
// //     }
// //     setError("");
// //     setLogoForm(prev => ({ ...prev, file }));
// //     const reader = new FileReader();
// //     reader.onload = (e) => setPreview(e.target.result);
// //     reader.readAsDataURL(file);
// //     if (!logoForm.name) {
// //       const fileName = file.name.split('.')[0];
// //       setLogoForm(prev => ({ ...prev, name: fileName }));
// //     }
// //   };

// //   const handleDrag = (e) => {
// //     e.preventDefault();
// //     e.stopPropagation();
// //     if (e.type === "dragenter" || e.type === "dragover") {
// //       setDragActive(true);
// //     } else if (e.type === "dragleave") {
// //       setDragActive(false);
// //     }
// //   };

// //   const handleDrop = (e) => {
// //     e.preventDefault();
// //     e.stopPropagation();
// //     setDragActive(false);
// //     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
// //       handleFileSelect(e.dataTransfer.files[0]);
// //     }
// //   };

// //   const handleInputChange = (e) => {
// //     if (e.target.files && e.target.files[0]) {
// //       handleFileSelect(e.target.files[0]);
// //     }
// //   };

// //   const removeFile = () => {
// //     setLogoForm(prev => ({ ...prev, file: null }));
// //     setPreview(null);
// //     setError("");
// //     if (fileInputRef.current) {
// //       fileInputRef.current.value = '';
// //     }
// //   };

// // const handleSubmit = async (e) => {
// //   e.preventDefault();
// //   if (!logoForm.file) {
// //     setError("Please select a file to upload");
// //     return;
// //   }
// //   if (!logoForm.name.trim()) {
// //     setError("Please enter a name for the logo");
// //     return;
// //   }
  
// //   // Add this validation
// //   if (!(logoForm.file instanceof File)) {
// //     setError("Invalid file selected");
// //     return;
// //   }
  
// //   console.log("Submitting logo form:", logoForm);
// //   console.log("File details:", logoForm.file); // Add this to debug
  
// //   try {
// //     await uploadLogo(logoForm);
// //     setLogoForm({ file: null, name: "", description: "" });
// //     setPreview(null);
// //     setError("");
// //     if (fileInputRef.current) fileInputRef.current.value = '';
// //   } catch (error) {
// //     setError("Failed to upload logo. Please try again.");
// //   }
// // };

// //   const isFormValid = logoForm.file && logoForm.name.trim() && !error;

// //   return (
// //     <div className="max-w-xxl mx-auto p-6 ">
// //       <Typography variant="h3" color="blue-gray" className="mb-2">
// //         {title}
// //       </Typography>
// //       <Typography variant="small" className="text-blue-gray-500 font-normal mb-6">
// //         {description}
// //       </Typography>

// //       {error && (
// //         <Alert color="red" icon={<ExclamationTriangleIcon className="h-6 w-6" />}>
// //           {error}
// //         </Alert>
// //       )}

// //       <form onSubmit={handleSubmit} className="space-y-6">
// //         <div>
// //           <Typography variant="h6" color="blue-gray">
// //             Logo File *
// //           </Typography>
// //           {!logoForm.file ? (
// //             <Card
// //               className={`border-2 border-dashed cursor-pointer transition-all duration-200 ${
// //                 dragActive
// //                   ? 'border-blue-500 bg-blue-50'
// //                   : 'border-blue-gray-200 hover:border-blue-300 hover:bg-blue-gray-50'
// //               }`}
// //               onDragEnter={handleDrag}
// //               onDragLeave={handleDrag}
// //               onDragOver={handleDrag}
// //               onDrop={handleDrop}
// //               onClick={() => fileInputRef.current?.click()}
// //             >
// //               <CardBody className="text-center py-12">
// //                 <CloudArrowUpIcon className="h-16 w-16 mx-auto text-blue-gray-400 mb-4" />
// //                 <Typography variant="h6" color="blue-gray" className="mb-2">
// //                   Drop your logo here or click to browse
// //                 </Typography>
// //                 <Typography variant="small" className="text-blue-gray-500 mb-4">
// //                   Supports: JPEG, PNG, SVG, WebP (Max 5MB)
// //                 </Typography>
// //                 <Button variant="outlined" size="sm">
// //                   Choose File
// //                 </Button>
// //               </CardBody>
// //             </Card>
// //           ) : (
// //             <Card className="border border-blue-gray-200">
// //               <CardBody className="p-4">
// //                 <div className="flex items-center gap-4">
// //                   <div className="flex-shrink-0">
// //                     {preview ? (
// //                       <img
// //                         src={preview}
// //                         alt="Logo preview"
// //                         className="w-20 h-20 object-contain rounded-lg border border-blue-gray-200"
// //                       />
// //                     ) : (
// //                       <div className="w-20 h-20 bg-blue-gray-50 rounded-lg flex items-center justify-center">
// //                         <PhotoIcon className="h-8 w-8 text-blue-gray-400" />
// //                       </div>
// //                     )}
// //                   </div>
// //                   <div className="flex-grow">
// //                     <Typography variant="h6" color="blue-gray">
// //                       {logoForm.file.name}
// //                     </Typography>
// //                     <Typography variant="small" className="text-blue-gray-500">
// //                       {(logoForm.file.size / 1024 / 1024).toFixed(2)} MB
// //                     </Typography>
// //                     <div className="flex items-center gap-1 mt-1">
// //                       <CheckCircleIcon className="h-4 w-4 text-green-500" />
// //                       <Typography variant="small" className="text-green-500">
// //                         File validated successfully
// //                       </Typography>
// //                     </div>
// //                   </div>
// //                   <Button
// //                     variant="text"
// //                     color="red"
// //                     size="sm"
// //                     onClick={removeFile}
// //                     className="p-2"
// //                   >
// //                     <XMarkIcon className="h-4 w-4" />
// //                   </Button>
// //                 </div>
// //               </CardBody>
// //             </Card>
// //           )}
// //           <input
// //             ref={fileInputRef}
// //             type="file"
// //             onChange={handleInputChange}
// //             accept="image/jpeg,image/png,image/svg+xml,image/webp"
// //             className="hidden"
// //           />
// //         </div>

// //         <div className="grid gap-4">
// //           <div>
// //             <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
// //               Logo Name *
// //             </Typography>
// //             <Input
// //               value={logoForm.name}
// //               onChange={(e) => setLogoForm(prev => ({ ...prev, name: e.target.value }))}
// //               label="Enter logo name"
// //               placeholder="e.g., Company Logo, Brand Logo"
// //             />
// //           </div>
// //           <div>
// //             <Typography variant="small" className="mb-2 font-semibold text-blue-gray-500">
// //               Description (Optional)
// //             </Typography>
// //             <Input
// //               value={logoForm.description}
// //               onChange={(e) => setLogoForm(prev => ({ ...prev, description: e.target.value }))}
// //               label="Enter description"
// //               placeholder="Brief description of the logo usage"
// //             />
// //           </div>
// //         </div>

// //         <Card className="bg-blue-50 border border-blue-200">
// //           <CardBody className="p-4">
// //             <Typography variant="h6" color="blue-gray" className="mb-2">
// //               Upload Guidelines
// //             </Typography>
// //             <ul className="text-sm text-blue-gray-600 space-y-1">
// //               <li>• Use high-resolution images for best quality</li>
// //               <li>• SVG format is recommended for scalability</li>
// //               <li>• Ensure the logo has transparent background if needed</li>
// //               <li>• Maximum file size: 5MB</li>
// //               <li>• Supported formats: JPEG, PNG, SVG, WebP</li>
// //             </ul>
// //           </CardBody>
// //         </Card>

// //         <div className="flex justify-end gap-2">
// //           <Button
// //             variant="gradient"
// //             color="blue"
// //             type="submit"
// //             disabled={!isFormValid || loading}
// //             className="flex items-center gap-2"
// //           >
// //             {loading ? (
// //               <>
// //                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
// //                 Uploading...
// //               </>
// //             ) : (
// //               <>
// //                 <CloudArrowUpIcon className="h-4 w-4" />
// //                 Upload Logo
// //               </>
// //             )}
// //           </Button>
// //         </div>
// //       </form>
// //     </div>
// //   );
// // };

// // export default LogoUploadPage;
