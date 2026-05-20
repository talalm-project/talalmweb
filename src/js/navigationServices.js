import {
  faDashboard,
  faGears,
  faMicrochip,
  faPlug,
  faStethoscope,
  faUsers
} from "@fortawesome/free-solid-svg-icons";

export const navigationServices = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Monitor accounts, revenue, alerts, and current platform activity.",
    path: "/dashboard",
    icon: faDashboard,
    section: "main",
    keywords: ["overview", "operations", "analytics", "metrics"]
  },
  {
    id: "users",
    label: "Users",
    description: "Create, review, update, and archive administrator and member accounts.",
    path: "/users",
    icon: faUsers,
    section: "admin",
    adminOnly: true,
    keywords: ["accounts", "members", "roles", "access"]
  },
  {
    id: "connectors",
    label: "Connectors",
    description: "Browse model connectors and filter by name or connection type.",
    path: "/connectors",
    icon: faPlug,
    section: "main",
    keywords: ["models", "local", "openai", "providers"]
  },
  {
    id: "doctor",
    label: "Doctor",
    description: "Review sanitized backend configuration and environment wiring.",
    path: "/doctor",
    icon: faStethoscope,
    section: "admin",
    adminOnly: true,
    keywords: ["system", "configuration", "environment", "storage", "database"]
  },
  {
    id: "local-models",
    label: "Local Models",
    description: "Review GGUF models available on the backend file system.",
    path: "/local-models",
    icon: faMicrochip,
    section: "admin",
    adminOnly: true,
    keywords: ["models", "gguf", "manifest", "local"]
  },
  {
    id: "settings",
    label: "Settings",
    description: "Adjust admin preferences, access controls, and platform configuration.",
    path: "/settings",
    icon: faGears,
    section: "main",
    keywords: ["configuration", "preferences", "admin", "controls"]
  }
];

export const getVisibleNavigationServices = (currentUser) => {
  return navigationServices.filter((service) => {
    if (!service.adminOnly) {
      return true;
    }

    return currentUser?.role === "admin";
  });
};

export const getNavigationSections = (currentUser) => {
  const visibleServices = getVisibleNavigationServices(currentUser);

  return [
    {
      id: "main",
      label: null,
      services: visibleServices.filter((service) => {
        return service.section !== "admin";
      })
    },
    {
      id: "admin",
      label: "Admin",
      services: visibleServices.filter((service) => {
        return service.section === "admin";
      })
    }
  ].filter((section) => {
    return section.services.length > 0;
  });
};
