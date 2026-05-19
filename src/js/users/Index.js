import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPlus } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import Pagination from "../Pagination";
import PageHeader from "../commons/PageHeader";
import { statusToLabel } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
import { fetchUsers } from "../services/UserService";

const UsersIndex = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const loadUsers = (page = 1) => {
    setIsLoading(true);

    fetchUsers({ page })
      .then((response) => {
        setUsers(response.data.records || []);
        setCurrentPage(response.data.current_page || 1);
        setTotalPages(response.data.total_pages || 1);
        setErrorMessage("");
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          destroySession();
          navigate("/login");
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load users.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadUsers(currentPage);
  }, [currentPage]);

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Administration"
        title="Users"
      />

      <AdminContent
        title="User Directory"
        headerActions={[
          <Link className="btn btn-primary d-inline-flex align-items-center gap-2" key="create-user" to="/users/new">
            <FontAwesomeIcon icon={faPlus} />
            <span>Create User</span>
          </Link>
        ]}
        footer={(
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            handlePrevious={() => {
              setCurrentPage((page) => Math.max(page - 1, 1));
            }}
            handlePageClick={(page) => {
              setCurrentPage(page);
            }}
            handleNext={() => {
              setCurrentPage((page) => Math.min(page + 1, totalPages));
            }}
          />
        )}
      >
        {isLoading ? (
          <Loader />
        ) : (
          <React.Fragment>
            {errorMessage ? (
              <div className="alert alert-danger mb-3">
                {errorMessage}
              </div>
            ) : null}

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => {
                      return (
                        <tr key={user.id}>
                          <td className="fw-semibold">
                            {user.full_name}
                          </td>
                          <td>{user.email}</td>
                          <td className="text-capitalize">{user.role}</td>
                          <td>{statusToLabel(user.status)}</td>
                          <td className="text-end">
                            <Link className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" to={`/users/${user.id}`}>
                              <FontAwesomeIcon icon={faEye} />
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="text-center text-muted py-4" colSpan="5">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </React.Fragment>
        )}
      </AdminContent>
    </div>
  );
};

export default UsersIndex;
