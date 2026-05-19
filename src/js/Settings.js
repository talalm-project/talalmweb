import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faKey,
  faLock,
  faShieldHalved
} from "@fortawesome/free-solid-svg-icons";
import AdminContent from "./commons/AdminContent";
import PageHeader from "./commons/PageHeader";
import { getInputClassName, renderInputErrors } from "./helpers/AppHelper";
import { changePassword, destroySession } from "./services/AuthService";

const Settings = () => {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState({});
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});
    setPageError("");

    changePassword({
      password: password,
      password_confirmation: passwordConfirmation
    }).then(() => {
      destroySession();
      window.location.replace(`${window.location.pathname}${window.location.search}#/login`);
    }).catch((error) => {
      if (error.response?.status === 422) {
        setErrors(error.response.data);
      } else {
        setPageError(error.response?.data?.message || "Unable to change password.");
      }
      setIsLoading(false);
    });
  };

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        title="Settings"
      />

      <div className="row g-3">
        <div className="col-12">
          <AdminContent
            title={(
              <div className="d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faKey} />
                <span>Change Password</span>
              </div>
            )}
          >
            <form className="row g-3" onSubmit={handleSubmit}>
              {pageError ? (
                <div className="col-12">
                  <div className="alert alert-danger mb-0">
                    {pageError}
                  </div>
                </div>
              ) : null}

              <div className="col-12">
                <label className="form-label">
                  <FontAwesomeIcon icon={faLock} className="me-2" />
                  Password
                </label>
                <input
                  type="password"
                  className={getInputClassName(errors, "password")}
                  disabled={isLoading}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                  }}
                />
                {renderInputErrors(errors, "password")}
              </div>

              <div className="col-12">
                <label className="form-label">
                  <FontAwesomeIcon icon={faShieldHalved} className="me-2" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  className={getInputClassName(errors, "password_confirmation")}
                  disabled={isLoading}
                  value={passwordConfirmation}
                  onChange={(event) => {
                    setPasswordConfirmation(event.target.value);
                  }}
                />
                {renderInputErrors(errors, "password_confirmation")}
              </div>

              <div className="col-12 d-flex justify-content-end">
                <button
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                  disabled={isLoading}
                  type="submit"
                >
                  <FontAwesomeIcon icon={faArrowRightFromBracket} />
                  <span>{isLoading ? "Saving..." : "Change Password"}</span>
                </button>
              </div>
            </form>
          </AdminContent>
        </div>
      </div>
    </div>
  );
};

export default Settings;
