import React, { useEffect, useState } from "react";
import Login from "./Login";
import { AUTH_STATE_CHANGE_EVENT, getCurrentUser, isLoggedIn } from "./services/AuthService";
import Sidebar from "./Sidebar";
import TopNavigation from "./TopNavigation";
import {
  Navigate,
  Routes,
  Route
} from "react-router-dom";

import Dashboard from "./Dashboard";
import Doctor from "./Doctor";
import LocalModelsIndex from "./LocalModelsIndex";
import NotebooksIndex from "./notebooks/Index";
import NotebooksShow from "./notebooks/Show";
import Settings from "./Settings";
import ConnectorsForm from "./connectors/Form";
import ConnectorsIndex from "./connectors/Index";
import ConnectorsShow from "./connectors/Show";
import UsersIndex from "./users/Index";
import UsersShow from "./users/Show";
import UsersForm from "./users/Form";

const THEME_STORAGE_KEY = "TALALM_THEME";
const DEFAULT_THEME = "dark";

const readSavedTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return DEFAULT_THEME;
};

const PublicApp = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Login />}
      />
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

const AdminRoute = ({ children }) => {
  const currentUser = getCurrentUser();

  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AuthenticatedApp = ({ theme, onToggleTheme }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="app-main-section">
        <TopNavigation
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
        <main className="app-page-shell container-fluid px-3">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/login"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/settings"
              element={<Settings />}
            />
            <Route
              path="/connectors"
              element={<ConnectorsIndex />}
            />
            <Route
              path="/connectors/new"
              element={<ConnectorsForm />}
            />
            <Route
              path="/connectors/:id/edit"
              element={<ConnectorsForm />}
            />
            <Route
              path="/connectors/:id"
              element={<ConnectorsShow />}
            />
            <Route
              path="/notebooks"
              element={<NotebooksIndex />}
            />
            <Route
              path="/notebooks/:id"
              element={<NotebooksShow />}
            />
            <Route
              path="/doctor"
              element={(
                <AdminRoute>
                  <Doctor />
                </AdminRoute>
              )}
            />
            <Route
              path="/local-models"
              element={(
                <AdminRoute>
                  <LocalModelsIndex />
                </AdminRoute>
              )}
            />
            <Route
              path="/users"
              element={(
                <AdminRoute>
                  <UsersIndex />
                </AdminRoute>
              )}
            />
            <Route
              path="/users/new"
              element={(
                <AdminRoute>
                  <UsersForm />
                </AdminRoute>
              )}
            />
            <Route
              path="/users/:id"
              element={(
                <AdminRoute>
                  <UsersShow />
                </AdminRoute>
              )}
            />
            <Route
              path="/users/:id/edit"
              element={(
                <AdminRoute>
                  <UsersForm />
                </AdminRoute>
              )}
            />
            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [theme, setTheme] = useState(readSavedTheme);

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const syncAuthenticationState = () => {
      setAuthenticated(isLoggedIn());
    };

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthenticationState);
    window.addEventListener("storage", syncAuthenticationState);
    window.addEventListener("hashchange", syncAuthenticationState);

    return () => {
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthenticationState);
      window.removeEventListener("storage", syncAuthenticationState);
      window.removeEventListener("hashchange", syncAuthenticationState);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      return currentTheme === "dark" ? "light" : "dark";
    });
  };

  if (authenticated) {
    return (
      <AuthenticatedApp
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return <PublicApp />;
};

export default App;
