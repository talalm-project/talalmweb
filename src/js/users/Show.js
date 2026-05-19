import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCheck, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import ConfirmationModal from "../commons/ConfirmationModal";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { statusToLabel } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
import { activateUser, deleteUser, fetchUser } from "../services/UserService";

const UsersShow = () => {
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActivateModalVisible, setIsActivateModalVisible] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const loadUser = () => {
    setIsLoading(true);

    fetchUser(id)
      .then((response) => {
        setUser(response.data);
        setErrorMessage("");
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          destroySession();
          navigate("/login");
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load user.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleDelete = () => {
    setIsDeleting(true);

    deleteUser(id)
      .then(() => {
        navigate("/users");
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          destroySession();
          navigate("/login");
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to delete user.");
        setIsDeleteModalVisible(false);
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  const handleActivate = () => {
    setIsActivating(true);

    activateUser(id)
      .then((response) => {
        setUser(response.data);
        setErrorMessage("");
        setIsActivateModalVisible(false);
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          destroySession();
          navigate("/login");
          return;
        }

        if (error.response?.status === 422) {
          setErrorMessage(error.response.data?.status?.join(", ") || "Unable to activate user.");
        } else {
          setErrorMessage(error.response?.data?.message || "Unable to activate user.");
        }
        setIsActivateModalVisible(false);
      })
      .finally(() => {
        setIsActivating(false);
      });
  };

  useEffect(() => {
    loadUser();
  }, [id]);

  const headerActions = [
    <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" key="back-users" to="/users">
      <FontAwesomeIcon icon={faArrowLeft} />
      <span>Back to Users</span>
    </Link>
  ];

  if (user) {
    if (user.status === "pending") {
      headerActions.push(
        <button
          className="btn btn-success d-inline-flex align-items-center gap-2"
          key="activate-user"
          onClick={() => {
            setIsActivateModalVisible(true);
          }}
          type="button"
        >
          <FontAwesomeIcon icon={faCheck} />
          <span>Activate</span>
        </button>
      );
    }

    headerActions.push(
      <Link className="btn btn-primary d-inline-flex align-items-center gap-2" key="edit-user" to={`/users/${id}/edit`}>
        <FontAwesomeIcon icon={faPenToSquare} />
        <span>Edit User</span>
      </Link>
    );
    headerActions.push(
      <button
        className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
        key="delete-user"
        onClick={() => {
          setIsDeleteModalVisible(true);
        }}
        type="button"
      >
        <FontAwesomeIcon icon={faTrash} />
        <span>Delete User</span>
      </button>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Administration"
        title="User details"
      />

      <AdminContent
        title={user ? user.full_name : "User"}
        headerActions={headerActions}
      >
        {isLoading ? (
          <Loader />
        ) : (
          <React.Fragment>
            {errorMessage ? (
              <div className="alert alert-danger">
                {errorMessage}
              </div>
            ) : null}

            {user ? (
              <div className="row g-3">
                <div className="col-12">
                  <div className="border rounded p-3 h-100 bg-light-subtle">
                    <div className="text-muted small text-uppercase mb-1">Email</div>
                    <div className="fw-semibold">{user.email}</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="border rounded p-3 h-100 bg-light-subtle">
                    <div className="text-muted small text-uppercase mb-1">Role</div>
                    <div className="text-capitalize fw-semibold">{user.role}</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="border rounded p-3 h-100 bg-light-subtle">
                    <div className="text-muted small text-uppercase mb-1">First Name</div>
                    <div className="fw-semibold">{user.first_name}</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="border rounded p-3 h-100 bg-light-subtle">
                    <div className="text-muted small text-uppercase mb-1">Last Name</div>
                    <div className="fw-semibold">{user.last_name}</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="border rounded p-3 h-100 bg-light-subtle">
                    <div className="text-muted small text-uppercase mb-1">Status</div>
                    {statusToLabel(user.status)}
                  </div>
                </div>
              </div>
            ) : null}
          </React.Fragment>
        )}
      </AdminContent>

      <ConfirmationModal
        show={isActivateModalVisible}
        isLoading={isActivating}
        header="Activate User"
        content={`Activate ${user?.full_name || "this user"}?`}
        onPrimaryClicked={handleActivate}
        onSecondaryClicked={() => {
          if (!isActivating) {
            setIsActivateModalVisible(false);
          }
        }}
      />

      <ConfirmationModal
        show={isDeleteModalVisible}
        isLoading={isDeleting}
        header="Delete User"
        content={`Delete ${user?.full_name || "this user"}? This action will archive the account.`}
        onPrimaryClicked={handleDelete}
        onSecondaryClicked={() => {
          if (!isDeleting) {
            setIsDeleteModalVisible(false);
          }
        }}
      />
    </div>
  );
};

export default UsersShow;
