import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Switch,
  Typography,
  Chip,
} from "@material-tailwind/react";
import {
  useMaterialTailwindController,
  setOpenConfigurator,
  setSidenavColor,
  setSidenavType,
  setFixedNavbar,
} from "@/context";

function formatNumber(number, decPlaces) {
  decPlaces = Math.pow(10, decPlaces);

  const abbrev = ["K", "M", "B", "T"];

  for (let i = abbrev.length - 1; i >= 0; i--) {
    var size = Math.pow(10, (i + 1) * 3);

    if (size <= number) {
      number = Math.round((number * decPlaces) / size) / decPlaces;

      if (number == 1000 && i < abbrev.length - 1) {
        number = 1;
        i++;
      }

      number += abbrev[i];

      break;
    }
  }

  return number;
}

export function Configurator() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openConfigurator, sidenavColor, sidenavType, fixedNavbar } =
    controller;
  const [stars, setStars] = React.useState(0);

  const sidenavColors = {
    white: "from-gray-100 to-gray-100 border-gray-200",
    dark: "from-black to-black border-gray-200",
    green: "from-green-400 to-green-600",
    orange: "from-orange-400 to-orange-600",
    red: "from-red-400 to-red-600",
    pink: "from-pink-400 to-pink-600",
  };

  const colorNames = {
    white: "Blanc",
    dark: "Sombre",
    green: "Vert",
    orange: "Orange",
    red: "Rouge",
    pink: "Rose",
  };

  React.useEffect(() => {
    const stars = fetch(
      "https://api.github.com/repos/creativetimofficial/material-tailwind-dashboard-react"
    )
      .then((response) => response.json())
      .then((data) => setStars(formatNumber(data.stargazers_count, 1)));
  }, []);

  return (
    <aside
      className={`fixed top-0 right-0 z-50 h-screen w-96 bg-white px-2.5 shadow-lg transition-transform duration-300 ${
        openConfigurator ? "translate-x-0" : "translate-x-96"
      }`}
    >
      <div className="flex items-start justify-between px-6 pt-8 pb-6">
        <div>
          <Typography variant="h5" color="blue-gray">
            Configurateur du Tableau de Bord
          </Typography>
          <Typography className="font-normal text-blue-gray-600">
            Découvrez les options de votre tableau de bord.
          </Typography>
        </div>
        <IconButton
          variant="text"
          color="blue-gray"
          onClick={() => setOpenConfigurator(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="py-4 px-6">
        <div className="mb-12">
          <Typography variant="h6" color="blue-gray">
            Couleurs de la Barre Latérale
          </Typography>
          <Typography variant="small" color="gray" className="mt-1 mb-3">
            Choisissez une couleur pour votre barre latérale
          </Typography>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {Object.keys(sidenavColors).map((color) => (
              <div key={color} className="flex flex-col items-center gap-1">
                <span
                  className={`h-8 w-8 cursor-pointer rounded-full border-2 bg-gradient-to-br transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                    sidenavColors[color]
                  } ${
                    sidenavColor === color ? "border-black shadow-md scale-105" : "border-gray-300"
                  }`}
                  onClick={() => setSidenavColor(dispatch, color)}
                  title={colorNames[color]}
                />
                <Typography variant="small" className="text-xs text-gray-600">
                  {colorNames[color]}
                </Typography>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-12">
          <Typography variant="h6" color="blue-gray">
            Types de Barre Latérale
          </Typography>
          <Typography variant="small" color="gray" className="mt-1 mb-3">
            Choisissez parmi 3 types différents de barre latérale
          </Typography>
          <div className="mt-3 flex flex-col gap-2">
            <Button
              variant={sidenavType === "dark" ? "gradient" : "outlined"}
              onClick={() => setSidenavType(dispatch, "dark")}
              className="justify-start"
              size="sm"
            >
              🌙 Sombre
            </Button>
            <Button
              variant={sidenavType === "transparent" ? "gradient" : "outlined"}
              onClick={() => setSidenavType(dispatch, "transparent")}
              className="justify-start"
              size="sm"
            >
              ✨ Transparent
            </Button>
            <Button
              variant={sidenavType === "white" ? "gradient" : "outlined"}
              onClick={() => setSidenavType(dispatch, "white")}
              className="justify-start"
              size="sm"
            >
              ☀️ Blanc
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <hr className="border-blue-gray-50" />
        </div>

        <div className="mb-12">
          <Typography variant="h6" color="blue-gray">
            Barre de Navigation
          </Typography>
          <Typography variant="small" color="gray" className="mt-1 mb-3">
            Configurez le comportement de la barre de navigation
          </Typography>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Typography variant="small" color="blue-gray" className="font-medium">
                Barre Fixe
              </Typography>
              <Typography variant="small" color="gray">
                Maintenir la barre en haut
              </Typography>
            </div>
            <Switch
              checked={fixedNavbar}
              onChange={() => setFixedNavbar(dispatch, !fixedNavbar)}
              color="blue"
            />
          </div>
        </div>

        <div className="mb-8">
          <hr className="border-blue-gray-50" />
        </div>

        <div className="text-center">
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Centre de Soins Pédiatriques
          </Typography>
          <Typography variant="small" color="gray" className="mb-4">
            Système de gestion moderne et intuitif
          </Typography>
          <div className="flex justify-center gap-2 mb-4">
            <Chip
              value="v2.1.0"
              variant="gradient"
              color="blue"
              className="text-xs"
            />
            <Chip
              value="React"
              variant="outlined"
              color="blue"
              className="text-xs"
            />
          </div>
          <Typography variant="small" color="gray">
            Conçu avec ❤️ pour une meilleure expérience utilisateur
          </Typography>
        </div>
      </div>
    </aside>
  );
}

Configurator.displayName = "/src/widgets/layout/configurator.jsx";

export default Configurator;