

import axiosInstance from "@/api/axiosInstance";

export const getAppointments = async (data) => { 
  try {
    const response = await axiosInstance.get("/appointments"); 
    console.log("response", response.data);   
    return response.data;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
}

export const createAppointment = async (data) => {
  try {
    const response = await axiosInstance.post("/appointments", data);
    console.log("response", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
}


export const updateAppointment = async (id, data) => {
  try {
    const response = await axiosInstance.put(`/appointments/${id}`, data);
    console.log("response", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw error;
  }
}
export const deleteAppointment = async (id) => {
  try {
    const response = await axiosInstance.delete(`/appointments/${id}`);
    console.log("response", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting appointment:", error);
    throw error;
  }
}


// import axiosInstance from "@/api/axiosInstance";

// export const getAppointments = async () => {
//   try {
//     const response = await axiosInstance.get('/appointments');
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching appointments:', error);
//     throw error;
//   }
// };

// export const createAppointment = async (appointmentData) => {
//   try {
//     const response = await axiosInstance.post('/appointments', appointmentData);
//     return response.data;
//   } catch (error) {
//     console.error('Error creating appointment:', error);
//     throw error;
//   }
// };

// export const updateAppointment = async (id, appointmentData) => {
//   try {
//     const response = await axiosInstance.put(`/appointments/${id}`, appointmentData);
//     return response.data;
//   } catch (error) {
//     console.error('Error updating appointment:', error);
//     throw error;
//   }
// };

// export const deleteAppointment = async (id) => {
//   try {
//     const response = await axiosInstance.delete(`/appointments/${id}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error deleting appointment:', error);
//     throw error;
//   }
// };

// export const getPatients = async () => {
//   try {
//     const response = await axiosInstance.get('/patients');
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching patients:', error);
//     throw error;
//   }
// };