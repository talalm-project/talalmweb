import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faEye, faFilter, faPlus, faRotateLeft, faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import Pagination from "../Pagination";
import { getInputClassName, renderInputErrors, statusToLabel } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
import ConnectorService from "../services/ConnectorService";
import NotebookService from "../services/NotebookService";

const NOTEBOOK_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" }
];

const emptyFilters = {
  query: "",
  status: ""
};

const emptyNotebookForm = {
  title: "",
  connector_id: ""
};

const NotebooksIndex = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [notebookForm, setNotebookForm] = useState(emptyNotebookForm);
  const [formErrors, setFormErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectorsLoading, setIsConnectorsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleAuthError = (error) => {
    if ([401, 403].includes(error.response?.status)) {
      destroySession();
      navigate("/login");
      return true;
    }

    return false;
  };

  const loadNotebooks = (page = currentPage, args = appliedFilters) => {
    setIsLoading(true);

    NotebookService.fetchNotebooks({
      page,
      query: args.query,
      status: args.status
    })
      .then((response) => {
        setNotebooks(response.data.records || []);
        setCurrentPage(response.data.current_page || 1);
        setTotalPages(response.data.total_pages || 1);
        setErrorMessage("");
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load notebooks.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const loadConnectors = () => {
    setIsConnectorsLoading(true);
    setModalErrorMessage("");

    ConnectorService.fetchConnectors()
      .then((response) => {
        const records = response.data.records || [];
        setConnectors(records);
        setNotebookForm((currentValues) => {
          return {
            ...currentValues,
            connector_id: currentValues.connector_id || records[0]?.id || ""
          };
        });
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setModalErrorMessage(error.response?.data?.message || "Unable to load connectors.");
      })
      .finally(() => {
        setIsConnectorsLoading(false);
      });
  };

  useEffect(() => {
    loadNotebooks(currentPage, appliedFilters);
  }, [currentPage, appliedFilters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => {
      return {
        ...currentFilters,
        [name]: value
      };
    });
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    setAppliedFilters({
      query: filters.query.trim(),
      status: filters.status
    });
  };

  const handleResetFilters = () => {
    setFilters(emptyFilters);
    setCurrentPage(1);
    setAppliedFilters(emptyFilters);
  };

  const handleNotebookFormChange = (event) => {
    const { name, value } = event.target;

    setNotebookForm((currentValues) => {
      return {
        ...currentValues,
        [name]: value
      };
    });
  };

  const openNewNotebookModal = () => {
    setNotebookForm(emptyNotebookForm);
    setFormErrors({});
    setModalErrorMessage("");
    setShowNewNotebookModal(true);
    loadConnectors();
  };

  const closeNewNotebookModal = () => {
    if (isSaving) {
      return;
    }

    setShowNewNotebookModal(false);
    setNotebookForm(emptyNotebookForm);
    setFormErrors({});
    setModalErrorMessage("");
  };

  const handleCreateNotebook = (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFormErrors({});
    setModalErrorMessage("");

    NotebookService.createNotebook({
      title: notebookForm.title,
      connector_id: notebookForm.connector_id
    })
      .then((response) => {
        setShowNewNotebookModal(false);
        setNotebookForm(emptyNotebookForm);
        navigate(`/notebooks/${response.data.id}`);
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        if (error.response?.status === 422) {
          setFormErrors(error.response.data);
          return;
        }

        setModalErrorMessage(error.response?.data?.message || "Unable to create notebook.");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Knowledge"
        title="Notebooks"
        actions={[
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" key="new-notebook" onClick={openNewNotebookModal} type="button">
            <FontAwesomeIcon icon={faPlus} />
            <span>New Notebook</span>
          </button>
        ]}
      />

      <AdminContent
        title="Notebook Directory"
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
        <form className="row g-3 align-items-end mb-4" onSubmit={handleFilterSubmit}>
          <div className="col-12 col-md-6 col-xl-5">
            <label className="form-label" htmlFor="notebook-query-filter">
              Search
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <FontAwesomeIcon icon={faSearch} />
              </span>
              <input
                className="form-control"
                id="notebook-query-filter"
                name="query"
                onChange={handleFilterChange}
                placeholder="Search by title or status"
                type="search"
                value={filters.query}
              />
            </div>
          </div>

          <div className="col-12 col-md-4 col-xl-3">
            <label className="form-label" htmlFor="notebook-status-filter">
              Status
            </label>
            <select
              className="form-select"
              id="notebook-status-filter"
              name="status"
              onChange={handleFilterChange}
              value={filters.status}
            >
              {NOTEBOOK_STATUSES.map((status) => {
                return (
                  <option key={status.value || "all"} value={status.value}>
                    {status.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="col-12 col-md-auto">
            <button className="btn btn-primary d-inline-flex align-items-center gap-2 me-2" type="submit">
              <FontAwesomeIcon icon={faFilter} />
              <span>Filter</span>
            </button>
            <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" onClick={handleResetFilters} type="button">
              <FontAwesomeIcon icon={faRotateLeft} />
              <span>Reset</span>
            </button>
          </div>
        </form>

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
                    <th>Title</th>
                    <th>Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notebooks.length > 0 ? (
                    notebooks.map((notebook) => {
                      return (
                        <tr key={notebook.id}>
                          <td className="fw-semibold">
                            <span className="d-inline-flex align-items-center gap-2">
                              <FontAwesomeIcon className="text-muted" icon={faBook} />
                              <span>{notebook.title}</span>
                            </span>
                          </td>
                          <td>{statusToLabel(notebook.status)}</td>
                          <td className="text-center">
                            <Link className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" to={`/notebooks/${notebook.id}`}>
                              <FontAwesomeIcon icon={faEye} />
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="text-center text-muted py-4" colSpan="3">
                        No notebooks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </React.Fragment>
        )}
      </AdminContent>

      <Modal show={showNewNotebookModal} onHide={closeNewNotebookModal}>
        <form onSubmit={handleCreateNotebook}>
          <Modal.Header closeButton={!isSaving}>
            <Modal.Title>New Notebook</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {isConnectorsLoading ? (
              <Loader />
            ) : (
              <div className="row g-3">
                {modalErrorMessage ? (
                  <div className="col-12">
                    <div className="alert alert-danger mb-0">
                      {modalErrorMessage}
                    </div>
                  </div>
                ) : null}

                <div className="col-12">
                  <label className="form-label" htmlFor="notebook-title">
                    Title
                  </label>
                  <input
                    className={getInputClassName(formErrors, "title")}
                    disabled={isSaving}
                    id="notebook-title"
                    name="title"
                    onChange={handleNotebookFormChange}
                    value={notebookForm.title}
                  />
                  {renderInputErrors(formErrors, "title")}
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="notebook-connector">
                    Connector
                  </label>
                  <select
                    className={`form-select ${formErrors.connector_id?.length > 0 ? "is-invalid" : ""}`}
                    disabled={isSaving || connectors.length === 0}
                    id="notebook-connector"
                    name="connector_id"
                    onChange={handleNotebookFormChange}
                    value={notebookForm.connector_id}
                  >
                    {connectors.length > 0 ? (
                      connectors.map((connector) => {
                        return (
                          <option key={connector.id} value={connector.id}>
                            {connector.name}
                          </option>
                        );
                      })
                    ) : (
                      <option value="">No connectors available</option>
                    )}
                  </select>
                  {renderInputErrors(formErrors, "connector_id")}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="d-inline-flex align-items-center gap-2"
              disabled={isSaving || isConnectorsLoading || connectors.length === 0}
              type="submit"
              variant="primary"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Create Notebook</span>
            </Button>
            <Button
              className="d-inline-flex align-items-center gap-2"
              disabled={isSaving}
              onClick={closeNewNotebookModal}
              type="button"
              variant="secondary"
            >
              <FontAwesomeIcon icon={faXmark} />
              <span>Close</span>
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default NotebooksIndex;
