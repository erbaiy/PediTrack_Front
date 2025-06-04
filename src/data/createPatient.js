import axiosInstance from "@/api/axiosInstance";

export const createPatient = async (data) => { 
  try {
    const response = await axiosInstance.post("/patients", data);
        toast.success('Patient created successfully!', {
            position: "top-right",
            autoClose: 3000,
          });
    
    return response.data;
  } catch (error) {
    console.error("Error creating patient:", error);
    throw error;
  }
}
