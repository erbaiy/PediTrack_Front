import axiosInstance from "@/api/axiosInstance";

export const getPatientTable = async () => {
  try {
    const res = await axiosInstance.get("/patients");
    console.log("Patients:", res.data);
    const patients = Array.isArray(res.data) ? res.data :  []; // fallback

    return patients.map((patient) => ({
      img: "/img/team-2.jpeg",
      name: `${patient.firstName} ${patient.lastName}`,
      email: patient.gender,
      job: ["still Not spicify"], // Replace if real names are available
      hasRendezvous: false,
      date:patient.birthDate?patient.birthDate: "Not specified",
    }));
  } catch (err) {
    console.error("Failed to fetch patients:", err);
    return [];
  }
};

//   [
//   {
//     img: "/img/team-2.jpeg",
//     name: "John Michael",
//     email: "john@creative-tim.com",
//     job: ["Manager", "Organization"],
//     online: true,
//     date: "23/04/18",
//   },
//   {
//     img: "/img/team-1.jpeg",
//     name: "Alexa Liras",
//     email: "alexa@creative-tim.com",
//     job: ["Programator", "Developer"],
//     online: false,
//     date: "11/01/19",
//   },
//   {
//     img: "/img/team-4.jpeg",
//     name: "Laurent Perrier",
//     email: "laurent@creative-tim.com",
//     job: ["Executive", "Projects"],
//     online: true,
//     date: "19/09/17",
//   },
//   {
//     img: "/img/team-3.jpeg",
//     name: "Michael Levi",
//     email: "michael@creative-tim.com",
//     job: ["Programator", "Developer"],
//     online: true,
//     date: "24/12/08",
//   },
//   {
//     img: "/img/bruce-mars.jpeg",
//     name: "Bruce Mars",
//     email: "bruce@creative-tim.com",
//     job: ["Manager", "Executive"],
//     online: false,
//     date: "04/10/21",
//   },
//   {
//     img: "/img/team-2.jpeg",
//     name: "Alexander",
//     email: "alexander@creative-tim.com",
//     job: ["Programator", "Developer"],
//     online: false,
//     date: "14/09/20",
//   },
// ];

// export default authorsTableData;
