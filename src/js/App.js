import React, { useEffect, useState } from "react";
import Login from "./Login";
import { AUTH_STATE_CHANGE_EVENT, isLoggedIn } from "./services/AuthService";
import Sidebar from "./Sidebar";
import TopNavigation from "./TopNavigation";
import {
  Navigate,
  Routes,
  Route
} from "react-router-dom";

import Dashboard from "./Dashboard";
import Home from "./Home";
import Settings from "./Settings";
import UsersIndex from "./users/Index";
import UsersShow from "./users/Show";
import UsersForm from "./users/Form";

const PublicApp = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
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

const AuthenticatedApp = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="app-main-section">
        <TopNavigation />
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
              path="/users"
              element={<UsersIndex />}
            />
            <Route
              path="/users/new"
              element={<UsersForm />}
            />
            <Route
              path="/users/:id"
              element={<UsersShow />}
            />
            <Route
              path="/users/:id/edit"
              element={<UsersForm />}
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

  if (authenticated) {
    return <AuthenticatedApp />;
  }

  return <PublicApp />;
};

export default App;
