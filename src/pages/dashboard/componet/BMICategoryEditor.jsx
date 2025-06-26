import React, { useState, useEffect } from 'react';
import { Card, CardBody, Typography, Button, Input, Select, Option } from "@material-tailwind/react";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

const BMI_CATEGORIES_DEFAULT = [
  { name: "Insuffisance pondérale", range: "< 18.5", color: "red" },
  { name: "Poids normal", range: "18.5 - 24.9", color: "green" },
  { name: "Surpoids", range: "25 - 29.9", color: "orange" },
  { name: "Obésité", range: "≥ 30", color: "red" }
];

const COLOR_OPTIONS = [
  { value: "red", label: "Rouge" },
  { value: "orange", label: "Orange" },
  { value: "amber", label: "Ambre" },
  { value: "yellow", label: "Jaune" },
  { value: "lime", label: "Lime" },
  { value: "green", label: "Vert" },
  { value: "emerald", label: "Émeraude" },
  { value: "teal", label: "Sarcelle" },
  { value: "cyan", label: "Cyan" },
  { value: "sky", label: "Bleu ciel" },
  { value: "blue", label: "Bleu" },
  { value: "indigo", label: "Indigo" },
  { value: "violet", label: "Violet" },
  { value: "purple", label: "Pourpre" },
  { value: "fuchsia", label: "Fuchsia" },
  { value: "pink", label: "Rose" },
  { value: "rose", label: "Rosé" },
];

const BMICategoryEditor = () => {
  // Charger les catégories depuis le stockage local ou utiliser les valeurs par défaut
  const [bmiCategories, setBmiCategories] = useState(() => {
    const savedCategories = localStorage.getItem('bmiCategories');
    return savedCategories ? JSON.parse(savedCategories) : BMI_CATEGORIES_DEFAULT;
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategories, setEditingCategories] = useState([...bmiCategories]);

  // Sauvegarder dans le stockage local quand les catégories changent
  useEffect(() => {
    localStorage.setItem('bmiCategories', JSON.stringify(bmiCategories));
  }, [bmiCategories]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditingCategories([...bmiCategories]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingCategories([...bmiCategories]);
  };

  const handleSave = () => {
    setBmiCategories([...editingCategories]);
    setIsEditing(false);
  };

  const handleCategoryChange = (index, field, value) => {
    const updated = [...editingCategories];
    updated[index] = { ...updated[index], [field]: value };
    setEditingCategories(updated);
  };

  const resetToDefault = () => {
    setBmiCategories([...BMI_CATEGORIES_DEFAULT]);
    setIsEditing(false);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h5" color="blue-gray">
          Catégories IMC
        </Typography>
        
        {!isEditing ? (
          <Button variant="outlined" color="blue" size="sm" onClick={handleEdit}>
            <PencilIcon className="h-4 w-4 mr-1" />
            Personnaliser
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outlined" color="red" size="sm" onClick={handleCancel}>
              <XMarkIcon className="h-4 w-4 mr-1" />
              Annuler
            </Button>
            <Button variant="filled" color="green" size="sm" onClick={handleSave}>
              <CheckIcon className="h-4 w-4 mr-1" />
              Enregistrer
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {isEditing ? (
          // Mode édition
          editingCategories.map((category, index) => (
            <Card key={index} className="border border-blue-gray-100 bg-blue-gray-50/50">
              <CardBody className="p-4 space-y-3">
                <div>
                  <Typography variant="small" className="mb-1 text-blue-gray-600">
                    Nom de la catégorie
                  </Typography>
                  <Input
                    value={category.name}
                    onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                    size="sm"
                    labelProps={{ className: "hidden" }}
                  />
                </div>
                
                <div>
                  <Typography variant="small" className="mb-1 text-blue-gray-600">
                    Plage IMC
                  </Typography>
                  <Input
                    value={category.range}
                    onChange={(e) => handleCategoryChange(index, 'range', e.target.value)}
                    size="sm"
                    labelProps={{ className: "hidden" }}
                  />
                </div>
                
                <div>
                  <Typography variant="small" className="mb-1 text-blue-gray-600">
                    Couleur
                  </Typography>
                  <Select
                    value={category.color}
                    onChange={(value) => handleCategoryChange(index, 'color', value)}
                    size="sm"
                    labelProps={{ className: "hidden" }}
                  >
                    {COLOR_OPTIONS.map((color) => (
                      <Option key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: `var(--${color.value}-500)` }}
                          ></div>
                          {color.label}
                        </div>
                      </Option>
                    ))}
                  </Select>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          // Mode affichage
          bmiCategories.map((category, index) => (
            <Card key={index} className="border border-blue-gray-50 transition-all hover:shadow-md">
              <CardBody className="p-4">
                <Typography variant="h6" className={`text-${category.color}-600`}>
                  {category.name}
                </Typography>
                <Typography variant="small" className="text-blue-gray-500">
                  IMC {category.range}
                </Typography>
              </CardBody>
            </Card>
          ))
        )}
      </div>
      
      {isEditing && (
        <div className="flex justify-end mb-4">
          <Button variant="text" color="blue" size="sm" onClick={resetToDefault}>
            Réinitialiser aux valeurs par défaut
          </Button>
        </div>
      )}
      
      <Typography variant="small" className="text-blue-gray-500 italic">
        Note : Les catégories IMC peuvent varier pour les enfants de moins de 2 ans
      </Typography>
    </div>
  );
};

export default BMICategoryEditor;