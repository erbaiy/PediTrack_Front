import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/solid";
import { Home, Profile, Tables, Notifications } from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";
import ForgotPassword from "./pages/auth/forget-password";
import ResetPassword from "./pages/auth/reset-password";
import Patient from "./pages/dashboard/patient";
import PatientDetail from "./pages/dashboard/PatientDetail";
import Families from "./pages/dashboard/familes";
import { UsersIcon } from "@heroicons/react/24/solid";
import AppointmentsPage from "./pages/appointmentsPage";
import AppointmentManagement from "./pages/appointmentsPage";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
      },
      {
        path: '/patients/details/:id',
        element: <PatientDetail />,
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "profile",
        path: "/profile",
        element: <Profile />,
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "patients",
        path: "/patients",
        element: <Patient />,
      },
      {
        icon: <UsersIcon {...icon} />,
        name: "families",
        path: "/families",
        element: <Families />,
      },
      {
        icon: <InformationCircleIcon {...icon} />,
        name: "notifications",
        path: "/notifications",
        element: <Notifications />,
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "appointment calendar",
        path: "/appointment-calendar",
        element: <AppointmentManagement />,
      },
    ],
  },
  {
    title: "auth pages",
    layout: "auth",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "sign in",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "sign up",
        path: "/sign-up",
        element: <SignUp />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "forget password",
        path: "/forget-password",
        element: <ForgotPassword />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "reset password",
        path: "/reset-password",
        element: <ResetPassword />,
      },
    ],
  },
];

export default routes;
