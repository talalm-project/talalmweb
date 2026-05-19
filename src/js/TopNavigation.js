import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faRightFromBracket,
  faStar
} from "@fortawesome/free-solid-svg-icons";
import {
  getCurrentUser,
  logoutAndRedirect
} from "./services/AuthService";
import { getVisibleNavigationServices } from "./navigationServices";
import { useLocation, useNavigate } from "react-router-dom";

const PINNED_SERVICES_KEY = "ADMIN_PANEL_PINNED_SERVICES";

const formatRole = (role) => {
  if (!role) {
    return "User";
  }

  return role
    .split("_")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

const getDisplayName = (currentUser) => {
  if (!currentUser) {
    return "User";
  }

  const fullName = [
    currentUser.first_name,
    currentUser.last_name
  ].filter(Boolean).join(" ");

  return fullName || currentUser.username || currentUser.email || "User";
};

const readPinnedServices = () => {
  const savedValue = localStorage.getItem(PINNED_SERVICES_KEY);

  if (!savedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(savedValue);

    if (Array.isArray(parsedValue)) {
      return parsedValue;
    }
  } catch (error) {
    console.error("Unable to parse pinned services", error);
  }

  return [];
};

const matchesSearch = (service, normalizedSearch) => {
  if (!normalizedSearch) {
    return true;
  }

  const searchableText = [
    service.label,
    service.description,
    ...service.keywords
  ].join(" ").toLowerCase();

  return searchableText.includes(normalizedSearch);
};

export default TopNavigation = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pinnedServiceIds, setPinnedServiceIds] = useState(readPinnedServices);
  const currentUser = getCurrentUser();
  const navigationServices = getVisibleNavigationServices(currentUser);
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedSearch = searchValue.trim().toLowerCase();

  useEffect(() => {
    localStorage.setItem(PINNED_SERVICES_KEY, JSON.stringify(pinnedServiceIds));
  }, [pinnedServiceIds]);

  const filteredServices = navigationServices.filter((service) => {
    return matchesSearch(service, normalizedSearch);
  });

  const pinnedServices = navigationServices.filter((service) => {
    return pinnedServiceIds.includes(service.id);
  });

  const shouldShowSearchResults = isSearchFocused && normalizedSearch.length > 0;

  const togglePinnedService = (serviceId) => {
    setPinnedServiceIds((currentIds) => {
      if (currentIds.includes(serviceId)) {
        return currentIds.filter((id) => {
          return id !== serviceId;
        });
      }

      return [...currentIds, serviceId];
    });
  };

  const handleNavigate = (path) => {
    navigate(path);
    setSearchValue("");
    setIsSearchFocused(false);
  };

  return (
    <header className="top-navigation border-bottom border-secondary-subtle">
      <div className="container-fluid">
        <div className="top-navigation-content">
          <div className="top-navigation-search-shell">
            <div className="top-navigation-search">
              <span className="top-navigation-search-icon">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </span>
              <input
                type="search"
                className="form-control"
                placeholder="Search services"
                value={searchValue}
                onFocus={() => {
                  setIsSearchFocused(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    setIsSearchFocused(false);
                  }, 120);
                }}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                }}
              />
            </div>

            {shouldShowSearchResults ? (
              <div className="top-navigation-search-results shadow-lg">
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => {
                    const isPinned = pinnedServiceIds.includes(service.id);
                    const isActive = location.pathname === service.path;

                    return (
                      <button
                        type="button"
                        className={`top-navigation-service-result ${isActive ? "active" : ""}`}
                        key={service.id}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleNavigate(service.path);
                        }}
                      >
                        <span className="top-navigation-service-copy">
                          <span className="top-navigation-service-title">
                            <FontAwesomeIcon icon={service.icon} />
                            <span>{service.label}</span>
                          </span>
                          <span className="top-navigation-service-description">
                            {service.description}
                          </span>
                        </span>
                        <span
                          className={`top-navigation-star ${isPinned ? "pinned" : ""}`}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            togglePinnedService(service.id);
                          }}
                        >
                          <FontAwesomeIcon icon={faStar} />
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="top-navigation-empty-state">
                    No matching services found.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="top-navigation-actions">
            <div className="text-end top-navigation-user">
              <p className="mb-0 fw-semibold small">
                Welcome, {getDisplayName(currentUser)}
              </p>
              <small className="top-navigation-user-role">
                {formatRole(currentUser?.role)}
              </small>
            </div>

            <button
              type="button"
              className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
              onClick={() => {
                logoutAndRedirect();
              }}
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {pinnedServices.length > 0 ? (
          <div className="top-navigation-pinned-panel">
            <span className="top-navigation-pinned-label">
              Pinned
            </span>
            <div className="top-navigation-pinned-list">
              {pinnedServices.map((service) => {
                const isActive = location.pathname === service.path;

                return (
                  <button
                    type="button"
                    key={service.id}
                    className={`top-navigation-pinned-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      handleNavigate(service.path);
                    }}
                  >
                    <span className="top-navigation-pinned-copy">
                      <FontAwesomeIcon icon={service.icon} />
                      <span>{service.label}</span>
                    </span>
                    <span
                      className="top-navigation-star pinned"
                      onClick={(event) => {
                        event.stopPropagation();
                        togglePinnedService(service.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faStar} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
