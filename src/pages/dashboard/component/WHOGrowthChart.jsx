// WHOGrowthCharts.jsx - With Papier Millimétré Styling
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

const calculateAgeInMonths = (birthDateString, measurementDateString) => {
  const birthDate = new Date(birthDateString);
  const measurementDate = new Date(measurementDateString);

  let months = (measurementDate.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += measurementDate.getMonth();

  if (measurementDate.getDate() < birthDate.getDate()) {
    months--;
  }

  return months <= 0 ? 0 : months;
};

// Girls 0-24 months - Weight for Age
const WHO_GIRLS_WEIGHT_FOR_AGE = [
  { age: 0, p3: 2.1, p15: 2.5, p50: 2.9, p85: 3.3, p97: 3.7, sd: [-3, -2, 0, 1, 2] },
  { age: 1, p3: 2.9, p15: 3.3, p50: 3.9, p85: 4.5, p97: 5.1, sd: [-3, -2, 0, 1, 2] },
  // ... complete monthly data up to 24 months
  { age: 24, p3: 9.0, p15: 9.9, p50: 11.2, p85: 12.8, p97: 14.1, sd: [-3, -2, 0, 1, 2] }
];

// Boys 0-24 months - Weight for Age
const WHO_BOYS_WEIGHT_FOR_AGE = [
  { age: 0, p3: 2.2, p15: 2.6, p50: 3.0, p85: 3.5, p97: 3.9, sd: [-3, -2, 0, 1, 2] },
  { age: 1, p3: 3.0, p15: 3.5, p50: 4.1, p85: 4.8, p97: 5.4, sd: [-3, -2, 0, 1, 2] },
  // ... complete monthly data up to 24 months
  { age: 24, p3: 9.5, p15: 10.4, p50: 11.8, p85: 13.5, p97: 14.8, sd: [-3, -2, 0, 1, 2] }
];

// Girls 0-24 months - Height for Age
const WHO_GIRLS_HEIGHT_FOR_AGE = [
  { age: 0, p3: 45.6, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.7, sd: [-3, -2, 0, 1, 2] },
  { age: 1, p3: 50.0, p15: 51.7, p50: 53.7, p85: 55.6, p97: 57.3, sd: [-3, -2, 0, 1, 2] },
  // ... complete monthly data up to 24 months
  { age: 24, p3: 80.0, p15: 82.9, p50: 86.4, p85: 89.9, p97: 93.0, sd: [-3, -2, 0, 1, 2] }
];

// Boys 0-24 months - Height for Age
const WHO_BOYS_HEIGHT_FOR_AGE = [
  { age: 0, p3: 46.1, p15: 47.9, p50: 49.9, p85: 51.8, p97: 53.5, sd: [-3, -2, 0, 1, 2] },
  { age: 1, p3: 51.1, p15: 52.7, p50: 54.7, p85: 56.7, p97: 58.4, sd: [-3, -2, 0, 1, 2] },
  // ... complete monthly data up to 24 months
  { age: 24, p3: 81.3, p15: 84.2, p50: 87.8, p85: 91.3, p97: 94.4, sd: [-3, -2, 0, 1, 2] }
];

// Girls 45-110 cm - Weight for Height
const WHO_GIRLS_WEIGHT_FOR_HEIGHT = [
  { height: 45, p3: 1.9, p15: 2.1, p50: 2.4, p85: 2.7, p97: 3.0, sd: [-3, -2, 0, 1, 2] },
  { height: 50, p3: 2.4, p15: 2.7, p50: 3.0, p85: 3.4, p97: 3.8, sd: [-3, -2, 0, 1, 2] },
  // ... complete data up to 110 cm
  { height: 110, p3: 14.2, p15: 15.5, p50: 17.3, p85: 19.5, p97: 21.6, sd: [-3, -2, 0, 1, 2] }
];

// Boys 45-110 cm - Weight for Height
const WHO_BOYS_WEIGHT_FOR_HEIGHT = [
  { height: 45, p3: 2.0, p15: 2.2, p50: 2.5, p85: 2.9, p97: 3.2, sd: [-3, -2, 0, 1, 2] },
  { height: 50, p3: 2.6, p15: 2.9, p50: 3.3, p85: 3.7, p97: 4.1, sd: [-3, -2, 0, 1, 2] },
  // ... complete data up to 110 cm
  { height: 110, p3: 14.8, p15: 16.1, p50: 18.1, p85: 20.5, p97: 22.7, sd: [-3, -2, 0, 1, 2] }
];


const GrowthChart = ({ data, xKey, yKey, title, xLabel, yLabel, patientData }) => {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border-2 border-amber-200 shadow-lg mb-6" 
         style={{
           background: 'linear-gradient(45deg, #fefce8 0%, #fef3c7 100%)',
           boxShadow: '0 4px 20px rgba(217, 119, 6, 0.1)'
         }}>
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-amber-100">
        <h3 className="text-xl font-bold text-amber-900 mb-4 text-center border-b-2 border-amber-200 pb-2">
          {title}
        </h3>
        <div className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              {/* Millimeter paper grid pattern */}
              <defs>
                <pattern id="millimeterGrid" patternUnits="userSpaceOnUse" width="10" height="10">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#d4af37" strokeWidth="0.3" opacity="0.4"/>
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#d4af37" strokeWidth="0.8" opacity="0.7" 
                        strokeDasharray="0" transform="scale(5,5)"/>
                </pattern>
              </defs>
              
              {/* Paper texture background */}
              <rect width="100%" height="100%" fill="url(#millimeterGrid)" opacity="0.6"/>
              
              <XAxis 
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#92400e' }}
                tickLine={{ stroke: '#d97706', strokeWidth: 1 }}
                axisLine={{ stroke: '#d97706', strokeWidth: 2 }}
                label={{ 
                  value: xLabel, 
                  position: "insideBottom", 
                  offset: -10,
                  style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold', fill: '#92400e' }
                }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#92400e' }}
                tickLine={{ stroke: '#d97706', strokeWidth: 1 }}
                axisLine={{ stroke: '#d97706', strokeWidth: 2 }}
                label={{ 
                  value: yLabel, 
                  angle: -90, 
                  position: "insideLeft",
                  style: { textAnchor: 'middle', fontSize: '12px', fontWeight: 'bold', fill: '#92400e' }
                }}
              />
              
              {/* Reference Areas */}
              <ReferenceArea 
                x1={data[0][xKey]} 
                x2={data[data.length-1][xKey]} 
                y1={0} 
                y2="p3" 
                fill="#fca5a5" 
                fillOpacity="0.15"
                stroke="none" 
              />
              <ReferenceArea 
                x1={data[0][xKey]} 
                x2={data[data.length-1][xKey]} 
                y1="p3" 
                y2="p15" 
                fill="#fed7aa" 
                fillOpacity="0.15"
                stroke="none" 
              />
              <ReferenceArea 
                x1={data[0][xKey]} 
                x2={data[data.length-1][xKey]} 
                y1="p15" 
                y2="p85" 
                fill="#bbf7d0" 
                fillOpacity="0.2"
                stroke="none" 
              />
              <ReferenceArea 
                x1={data[0][xKey]} 
                x2={data[data.length-1][xKey]} 
                y1="p85" 
                y2="p97" 
                fill="#fed7aa" 
                fillOpacity="0.15"
                stroke="none" 
              />
              <ReferenceArea 
                x1={data[0][xKey]} 
                x2={data[data.length-1][xKey]} 
                y1="p97" 
                y2={yKey === 'weight' ? 25 : 120} 
                fill="#fca5a5" 
                fillOpacity="0.15"
                stroke="none" 
              />
              
              {/* Percentile Lines */}
              <Line 
                type="monotone" 
                dataKey="p3" 
                stroke="#dc2626" 
                strokeWidth={2}
                strokeDasharray="5,3"
                dot={false} 
                name="3e percentile"
              />
              <Line 
                type="monotone" 
                dataKey="p15" 
                stroke="#ea580c" 
                strokeWidth={1.5}
                strokeDasharray="3,2"
                dot={false} 
                name="15e percentile"
              />
              <Line 
                type="monotone" 
                dataKey="p50" 
                stroke="#16a34a" 
                strokeWidth={3}
                dot={false} 
                name="50e percentile"
              />
              <Line 
                type="monotone" 
                dataKey="p85" 
                stroke="#ea580c" 
                strokeWidth={1.5}
                strokeDasharray="3,2"
                dot={false} 
                name="85e percentile"
              />
              <Line 
                type="monotone" 
                dataKey="p97" 
                stroke="#dc2626" 
                strokeWidth={2}
                strokeDasharray="5,3"
                dot={false} 
                name="97e percentile"
              />
              
              {/* Patient Data - Now properly connected */}
              {patientData && patientData.length > 0 && (
                <Line
                  type="monotone"
                  data={patientData}
                  dataKey={yKey}
                  stroke="#1d4ed8"
                  name={`${yLabel} patient`}
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 3 }}
                  connectNulls={true}
                />
              )}
              
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fefce8',
                  border: '2px solid #d97706',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                formatter={(value, name) => {
                  if (name === `${yLabel} patient`) return [`${value} ${yLabel.split('(')[1]?.replace(')','') || ''}`, name];
                  return [`${value} ${yLabel.split('(')[1]?.replace(')','') || ''}`, name];
                }}
                labelFormatter={(label) => `${xLabel}: ${label} ${xLabel.includes('Âge') ? 'mois' : 'cm'}`}
              />
              <Legend 
                wrapperStyle={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#92400e'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 text-xs text-amber-800 text-center border-t border-amber-200 pt-2">
          <strong>Source:</strong> Normes de croissance de l'OMS - {title.includes('Filles') ? 'Filles' : 'Garçons'} 0-24 mois
        </div>
      </div>
    </div>
  );
};

const WHOGrowthCharts = ({ records, patientGender, patientBirthDate }) => {
  const isGirl = patientGender === 'female';
  const standards = {
    weightForAge: isGirl ? WHO_GIRLS_WEIGHT_FOR_AGE : WHO_BOYS_WEIGHT_FOR_AGE,
    heightForAge: isGirl ? WHO_GIRLS_HEIGHT_FOR_AGE : WHO_BOYS_HEIGHT_FOR_AGE,
    weightForHeight: isGirl ? WHO_GIRLS_WEIGHT_FOR_HEIGHT : WHO_BOYS_WEIGHT_FOR_HEIGHT
  };

  const weightForAgeData = records.map(record => {
    const ageInMonths = calculateAgeInMonths(patientBirthDate, record.date);
    return {
      age: ageInMonths,
      weight: record.weightKg,
      date: new Date(record.date).toLocaleDateString('fr-FR')
    };
  });

  const heightForAgeData = records.map(record => {
    const ageInMonths = calculateAgeInMonths(patientBirthDate, record.date);
    return {
      age: ageInMonths,
      height: record.heightCm,
      date: new Date(record.date).toLocaleDateString('fr-FR')
    };
  });

  const weightForHeightData = records.map(record => ({
    height: record.heightCm,
    weight: record.weightKg,
    date: new Date(record.date).toLocaleDateString('fr-FR')
  }));
  
  return (
    <div className="grid grid-cols-1 gap-8">
      <GrowthChart
        data={standards.weightForAge}
        xKey="age"
        yKey="weight"
        title={`Courbe poids-âge (OMS) - ${isGirl ? 'Filles' : 'Garçons'} 0-24 mois`}
        xLabel="Âge (mois)"
        yLabel="Poids (kg)"
        patientData={weightForAgeData}
      />
      
      <GrowthChart
        data={standards.heightForAge}
        xKey="age"
        yKey="height"
        title={`Courbe taille-âge (OMS) - ${isGirl ? 'Filles' : 'Garçons'} 0-24 mois`}
        xLabel="Âge (mois)"
        yLabel="Taille (cm)"
        patientData={heightForAgeData}
      />
      
      <GrowthChart
        data={standards.weightForHeight}
        xKey="height"
        yKey="weight"
        title={`Courbe poids-taille (OMS) - ${isGirl ? 'Filles' : 'Garçons'} 45-110 cm`}
        xLabel="Taille (cm)"
        yLabel="Poids (kg)"
        patientData={weightForHeightData}
      />
    </div>
  );
};

export default WHOGrowthCharts;



// // WHOGrowthCharts.jsx
// import { Typography } from '@material-tailwind/react';
// import React from 'react';
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   ReferenceArea,
//   Label,
//   ReferenceLine
// } from 'recharts';

// // WHO Growth Standards Data
// // Source: WHO Child Growth Standards (https://www.who.int/tools/child-growth-standards)




// const calculateAgeInMonths = (birthDateString, measurementDateString) => {
//   const birthDate = new Date(birthDateString);
//   const measurementDate = new Date(measurementDateString);

//   let months = (measurementDate.getFullYear() - birthDate.getFullYear()) * 12;
//   months -= birthDate.getMonth();
//   months += measurementDate.getMonth();

//   if (measurementDate.getDate() < birthDate.getDate()) {
//     months--;
//   }

//   return months <= 0 ? 0 : months;
// };

// // Girls 0-24 months - Weight for Age
// const WHO_GIRLS_WEIGHT_FOR_AGE = [
//   { age: 0, p3: 2.1, p15: 2.5, p50: 2.9, p85: 3.3, p97: 3.7, sd: [-3, -2, 0, 1, 2] },
//   { age: 1, p3: 2.9, p15: 3.3, p50: 3.9, p85: 4.5, p97: 5.1, sd: [-3, -2, 0, 1, 2] },
//   // ... complete monthly data up to 24 months
//   { age: 24, p3: 9.0, p15: 9.9, p50: 11.2, p85: 12.8, p97: 14.1, sd: [-3, -2, 0, 1, 2] }
// ];

// // Boys 0-24 months - Weight for Age
// const WHO_BOYS_WEIGHT_FOR_AGE = [
//   { age: 0, p3: 2.2, p15: 2.6, p50: 3.0, p85: 3.5, p97: 3.9, sd: [-3, -2, 0, 1, 2] },
//   { age: 1, p3: 3.0, p15: 3.5, p50: 4.1, p85: 4.8, p97: 5.4, sd: [-3, -2, 0, 1, 2] },
//   // ... complete monthly data up to 24 months
//   { age: 24, p3: 9.5, p15: 10.4, p50: 11.8, p85: 13.5, p97: 14.8, sd: [-3, -2, 0, 1, 2] }
// ];

// // Girls 0-24 months - Height for Age
// const WHO_GIRLS_HEIGHT_FOR_AGE = [
//   { age: 0, p3: 45.6, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.7, sd: [-3, -2, 0, 1, 2] },
//   { age: 1, p3: 50.0, p15: 51.7, p50: 53.7, p85: 55.6, p97: 57.3, sd: [-3, -2, 0, 1, 2] },
//   // ... complete monthly data up to 24 months
//   { age: 24, p3: 80.0, p15: 82.9, p50: 86.4, p85: 89.9, p97: 93.0, sd: [-3, -2, 0, 1, 2] }
// ];

// // Boys 0-24 months - Height for Age
// const WHO_BOYS_HEIGHT_FOR_AGE = [
//   { age: 0, p3: 46.1, p15: 47.9, p50: 49.9, p85: 51.8, p97: 53.5, sd: [-3, -2, 0, 1, 2] },
//   { age: 1, p3: 51.1, p15: 52.7, p50: 54.7, p85: 56.7, p97: 58.4, sd: [-3, -2, 0, 1, 2] },
//   // ... complete monthly data up to 24 months
//   { age: 24, p3: 81.3, p15: 84.2, p50: 87.8, p85: 91.3, p97: 94.4, sd: [-3, -2, 0, 1, 2] }
// ];

// // Girls 45-110 cm - Weight for Height
// const WHO_GIRLS_WEIGHT_FOR_HEIGHT = [
//   { height: 45, p3: 1.9, p15: 2.1, p50: 2.4, p85: 2.7, p97: 3.0, sd: [-3, -2, 0, 1, 2] },
//   { height: 50, p3: 2.4, p15: 2.7, p50: 3.0, p85: 3.4, p97: 3.8, sd: [-3, -2, 0, 1, 2] },
//   // ... complete data up to 110 cm
//   { height: 110, p3: 14.2, p15: 15.5, p50: 17.3, p85: 19.5, p97: 21.6, sd: [-3, -2, 0, 1, 2] }
// ];

// // Boys 45-110 cm - Weight for Height
// const WHO_BOYS_WEIGHT_FOR_HEIGHT = [
//   { height: 45, p3: 2.0, p15: 2.2, p50: 2.5, p85: 2.9, p97: 3.2, sd: [-3, -2, 0, 1, 2] },
//   { height: 50, p3: 2.6, p15: 2.9, p50: 3.3, p85: 3.7, p97: 4.1, sd: [-3, -2, 0, 1, 2] },
//   // ... complete data up to 110 cm
//   { height: 110, p3: 14.8, p15: 16.1, p50: 18.1, p85: 20.5, p97: 22.7, sd: [-3, -2, 0, 1, 2] }
// ];

// // Interpolation function
// const interpolateData = (value, data, key) => {
//   if (value <= data[0][key]) return data[0];
//   if (value >= data[data.length - 1][key]) return data[data.length - 1];
  
//   const lower = data.findLast(item => item[key] <= value);
//   const upper = data.find(item => item[key] >= value);
  
//   if (!lower || !upper || lower[key] === upper[key]) return lower || upper;
  
//   const ratio = (value - lower[key]) / (upper[key] - lower[key]);
  
//   return {
//     [key]: value,
//     p3: lower.p3 + (upper.p3 - lower.p3) * ratio,
//     p15: lower.p15 + (upper.p15 - lower.p15) * ratio,
//     p50: lower.p50 + (upper.p50 - lower.p50) * ratio,
//     p85: lower.p85 + (upper.p85 - lower.p85) * ratio,
//     p97: lower.p97 + (upper.p97 - lower.p97) * ratio,
//     sd: lower.sd
//   };
// };

// const GrowthChart = ({ data, xKey, yKey, title, xLabel, yLabel, patientData }) => {
//   return (
//     <div className="bg-white p-4 rounded-xl border border-blue-gray-50 mb-6">
//       <Typography variant="h5" color="blue-gray" className="mb-4">
//         {title}
//       </Typography>
//       <div className="h-80">
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart
//             data={data}
//             margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
//           >
//             <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//             <XAxis 
//               dataKey={xKey} 
//               label={{ 
//                 value: xLabel, 
//                 position: "insideBottomRight", 
//                 offset: -10,
//                 fontSize: 12
//               }}
//             />
//             <YAxis 
//               label={{ 
//                 value: yLabel, 
//                 angle: -90, 
//                 position: "insideLeft",
//                 fontSize: 12
//               }}
//             />
            
//             {/* Reference Areas */}
//             <ReferenceArea x1={data[0][xKey]} x2={data[data.length-1][xKey]} y1={0} y2="p3" fill="#ffcccc" stroke="none" />
//             <ReferenceArea x1={data[0][xKey]} x2={data[data.length-1][xKey]} y1="p3" y2="p15" fill="#ffe6cc" stroke="none" />
//             <ReferenceArea x1={data[0][xKey]} x2={data[data.length-1][xKey]} y1="p15" y2="p85" fill="#e6ffe6" stroke="none" />
//             <ReferenceArea x1={data[0][xKey]} x2={data[data.length-1][xKey]} y1="p85" y2="p97" fill="#ffe6cc" stroke="none" />
//             <ReferenceArea x1={data[0][xKey]} x2={data[data.length-1][xKey]} y1="p97" y2={yKey === 'weight' ? 25 : 120} fill="#ffcccc" stroke="none" />
            
//             {/* Percentile Lines */}
//             <Line type="monotone" dataKey="p3" stroke="#ff0000" strokeWidth={1.5} dot={false} name="3e percentile" />
//             <Line type="monotone" dataKey="p15" stroke="#ff9900" strokeWidth={1.5} dot={false} name="15e percentile" />
//             <Line type="monotone" dataKey="p50" stroke="#00cc00" strokeWidth={1.5} dot={false} name="50e percentile" />
//             <Line type="monotone" dataKey="p85" stroke="#ff9900" strokeWidth={1.5} dot={false} name="85e percentile" />
//             <Line type="monotone" dataKey="p97" stroke="#ff0000" strokeWidth={1.5} dot={false} name="97e percentile" />
            
//             {/* Patient Data */}
//             {patientData && (
//               <Line
//                 type="monotone"
//                 dataKey={yKey}
//                 stroke="#8884d8"
//                 name={`${yLabel} patient`}
//                 strokeWidth={3}
//                 dot={{ r: 5 }}
//                 activeDot={{ r: 8 }}
//               />
//             )}
            
//             <Tooltip 
//               formatter={(value, name) => {
//                 if (name === yKey) return [`${value} ${yLabel.split('(')[1]?.replace(')','') || ''}`, `${yLabel.split('(')[0]} patient`];
//                 return [`${value} ${yLabel.split('(')[1]?.replace(')','') || ''}`, name];
//               }}
//               labelFormatter={(label) => `${xLabel}: ${label} ${xLabel.includes('Âge') ? 'mois' : 'cm'}`}
//             />
//             <Legend />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//       <Typography variant="small" className="text-gray-600 mt-2">
//         Source: Normes de croissance de l'OMS - {title.includes('Filles') ? 'Filles' : 'Garçons'} 0-24 mois
//       </Typography>
//     </div>
//   );
// };



// const WHOGrowthCharts = ({ records, patientGender, patientBirthDate }) => {

//  console.log('gender of patien ', patientGender )
     
//   // Le reste du code est correct
//   const isGirl = patientGender === 'female';
//   const standards = {
//     weightForAge: isGirl ? WHO_GIRLS_WEIGHT_FOR_AGE : WHO_BOYS_WEIGHT_FOR_AGE,
//     heightForAge: isGirl ? WHO_GIRLS_HEIGHT_FOR_AGE : WHO_BOYS_HEIGHT_FOR_AGE,
//     weightForHeight: isGirl ? WHO_GIRLS_WEIGHT_FOR_HEIGHT : WHO_BOYS_WEIGHT_FOR_HEIGHT
//   };

//   const weightForAgeData = records.map(record => {
//     const ageInMonths = calculateAgeInMonths(patientBirthDate, record.date);
//     return {
//       ...interpolateData(ageInMonths, standards.weightForAge, 'age'),
//       age: ageInMonths,
//       weight: record.weightKg,
//       date: new Date(record.date).toLocaleDateString('fr-FR')
//     };
//   });

//   const heightForAgeData = records.map(record => {
//     const ageInMonths = calculateAgeInMonths(patientBirthDate, record.date);
//     return {
//       ...interpolateData(ageInMonths, standards.heightForAge, 'age'),
//       age: ageInMonths,
//       height: record.heightCm,
//       date: new Date(record.date).toLocaleDateString('fr-FR')
//     };
//   });

//   const weightForHeightData = records.map(record => ({
//     ...interpolateData(record.heightCm, standards.weightForHeight, 'height'),
//     height: record.heightCm,
//     weight: record.weightKg,
//     date: new Date(record.date).toLocaleDateString('fr-FR')
//   }));
  
//   return (
//     <div className="grid grid-cols-1 gap-8">
//       <GrowthChart
//         data={[...standards.weightForAge, ...weightForAgeData].sort((a,b) => a.age - b.age)}
//         xKey="age"
//         yKey="weight"
//         title={`Courbe poids-âge (OMS) - ${isGirl ? 'Filles' : 'Garçons'} 0-24 mois`}
//         xLabel="Âge (mois)"
//         yLabel="Poids (kg)"
//         patientData={weightForAgeData}
//       />
      
//       <GrowthChart
//         data={[...standards.heightForAge, ...heightForAgeData].sort((a,b) => a.age - b.age)}
//         xKey="age"
//         yKey="height"
//         title={`Courbe taille-âge (OMS) - ${isGirl ? 'Filles' : 'Garçons'} 0-24 mois`}
//         xLabel="Âge (mois)"
//         yLabel="Taille (cm)"
//         patientData={heightForAgeData}
//       />
      
//       <GrowthChart
//         data={[...standards.weightForHeight, ...weightForHeightData].sort((a,b) => a.height - b.height)}
//         xKey="height"
//         yKey="weight"
//         title={`Courbe poids-taille (OMS) - ${isGirl ? 'Filles' : 'Garçons'} 45-110 cm`}
//         xLabel="Taille (cm)"
//         yLabel="Poids (kg)"
//         patientData={weightForHeightData}
//       />
//     </div>
//   );
// };

// export default WHOGrowthCharts;
