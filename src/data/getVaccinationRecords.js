import axiosInstance from "@/api/axiosInstance";

export const getVaccinationRecords = async () => {
    try {
        const response = await axiosInstance.get("/vaccinations");
        let data = response && response.data ? response.data : [];
        if (!Array.isArray(data)) {
            data = [data];
        }
        return data;
    } catch (error) {
        console.error("Error fetching vaccination records:", error);
        throw error;
    }
};  