import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faFilter, faRotateLeft, faSearch } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import Pagination from "../Pagination";
import { statusToLabel } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
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

const NotebooksIndex = () => {
  const [notebooks, setNotebooks] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

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
        if ([401, 403].includes(error.response?.status)) {
          destroySession();
          navigate("/login");
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load notebooks.");
      })
      .finally(() => {
        setIsLoading(false);
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

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Knowledge"
        title="Notebooks"
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
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="text-center text-muted py-4" colSpan="2">
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
    </div>
  );
};

export default NotebooksIndex;
