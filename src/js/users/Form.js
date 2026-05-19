import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { getInputClassName, renderInputErrors } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
import { createUser, fetchUser, updateUser } from "../services/UserService";

const UsersForm = () => {
  const [formValues, setFormValues] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "user",
    password: "",
    password_confirmation: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [pageError, setPageError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const updateFormValue = (key, value) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        [key]: value
      };
    });
  };

  const loadUser = () => {
    setIsBootstrapping(true);

    fetchUser(id)
      .then((response) => {
        setFormValues((currentValues) => {
          return {
            ...currentValues,
            email: response.data.email || "",
            first_name: response.data.first_name || "",
            last_name: response.data.last_name || "",
            role: response.data.role || "user"
          };
        });
        setPageError("");
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          destroySession();
          navigate("/login");
          return;
        }

        setPageError(error.response?.data?.message || "Unable to load user.");
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setPageError("");

    const payload = {
      email: formValues.email,
      first_name: formValues.first_name,
      last_name: formValues.last_name,
      role: formValues.role
    };

    if (!isEditing) {
      payload.password = formValues.password;
      payload.password_confirmation = formValues.password_confirmation;
    }

    const request = isEditing ? updateUser(id, payload) : createUser(payload);

    request
      .then((response) => {
        setErrors({});
        navigate(`/users/${response.data.id}`);
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          destroySession();
          navigate("/login");
          return;
        }

        if (error.response?.status === 422) {
          setErrors(error.response.data);
          setPageError("");
          return;
        }

        setPageError(error.response?.data?.message || "Unable to save user.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isEditing) {
      loadUser();
    }
  }, [id]);

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Administration"
        title={isEditing ? "Edit user" : "Create user"}
      />

      <AdminContent
        title={isEditing ? "Update User" : "New User"}
        headerActions={[
          <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" key="back-users" to={isEditing ? `/users/${id}` : "/users"}>
            <FontAwesomeIcon icon={faBan} />
            <span>Cancel</span>
          </Link>
        ]}
      >
        {isBootstrapping ? (
          <Loader />
        ) : (
          <form className="row g-3" onSubmit={handleSubmit}>
            {pageError ? (
              <div className="col-12">
                <div className="alert alert-danger mb-0">
                  {pageError}
                </div>
              </div>
            ) : null}

            <div className="col-12">
              <label className="form-label">First Name</label>
              <input
                className={getInputClassName(errors, "first_name")}
                disabled={isLoading}
                value={formValues.first_name}
                onChange={(event) => {
                  updateFormValue("first_name", event.target.value);
                }}
              />
              {renderInputErrors(errors, "first_name")}
            </div>

            <div className="col-12">
              <label className="form-label">Last Name</label>
              <input
                className={getInputClassName(errors, "last_name")}
                disabled={isLoading}
                value={formValues.last_name}
                onChange={(event) => {
                  updateFormValue("last_name", event.target.value);
                }}
              />
              {renderInputErrors(errors, "last_name")}
            </div>

            <div className="col-12">
              <label className="form-label">Email</label>
              <input
                className={getInputClassName(errors, "email")}
                disabled={isLoading}
                value={formValues.email}
                onChange={(event) => {
                  updateFormValue("email", event.target.value);
                }}
              />
              {renderInputErrors(errors, "email")}
            </div>

            <div className="col-12">
              <label className="form-label">Role</label>
              <select
                className={getInputClassName(errors, "role")}
                disabled={isLoading}
                value={formValues.role}
                onChange={(event) => {
                  updateFormValue("role", event.target.value);
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {renderInputErrors(errors, "role")}
            </div>

            {!isEditing ? (
              <React.Fragment>
                <div className="col-12">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className={getInputClassName(errors, "password")}
                    disabled={isLoading}
                    value={formValues.password}
                    onChange={(event) => {
                      updateFormValue("password", event.target.value);
                    }}
                  />
                  {renderInputErrors(errors, "password")}
                </div>

                <div className="col-12">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className={getInputClassName(errors, "password_confirmation")}
                    disabled={isLoading}
                    value={formValues.password_confirmation}
                    onChange={(event) => {
                      updateFormValue("password_confirmation", event.target.value);
                    }}
                  />
                  {renderInputErrors(errors, "password_confirmation")}
                </div>
              </React.Fragment>
            ) : null}

            <div className="col-12 d-flex justify-content-end gap-2">
              <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" to={isEditing ? `/users/${id}` : "/users"}>
                <FontAwesomeIcon icon={faBan} />
                <span>Cancel</span>
              </Link>
              <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={isLoading} type="submit">
                <FontAwesomeIcon icon={faFloppyDisk} />
                <span>{isLoading ? "Saving..." : isEditing ? "Update User" : "Create User"}</span>
              </button>
            </div>
          </form>
        )}
      </AdminContent>
    </div>
  );
};

export default UsersForm;
