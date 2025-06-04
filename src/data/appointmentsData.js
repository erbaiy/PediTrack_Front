

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
