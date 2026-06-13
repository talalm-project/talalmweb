import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faFilter, faPlus, faRotateLeft, faSearch, faServer } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { destroySession } from "../services/AuthService";
import ConnectorService from "../services/ConnectorService";

const ConnectorsIndex = () => {
  const [connectors, setConnectors] = useState([]);
  const [filters, setFilters] = useState({
    name: ""
  });
  const [appliedFilters, setAppliedFilters] = useState({
    name: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const loadConnectors = (args = appliedFilters) => {
    setIsLoading(true);

    ConnectorService.fetchConnectors(args)
      .then((response) => {
        setConnectors(response.data.records || []);
        setErrorMessage("");
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          destroySession();
          navigate("/login");
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load connectors.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadConnectors(appliedFilters);
  }, [appliedFilters]);

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
    setAppliedFilters({
      name: filters.name.trim()
    });
  };

  const handleResetFilters = () => {
    const emptyFilters = {
      name: ""
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Models"
        title="Connectors"
        actions={[
          <Link className="btn btn-primary d-inline-flex align-items-center gap-2" key="new-connector" to="/connectors/new">
            <FontAwesomeIcon icon={faPlus} />
            <span>New Connector</span>
          </Link>
        ]}
      />

      <AdminContent title="Connector Directory">
        <form className="row g-3 align-items-end mb-4" onSubmit={handleFilterSubmit}>
          <div className="col-12 col-md-6 col-xl-5">
            <label className="form-label" htmlFor="connector-name-filter">
              Name
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <FontAwesomeIcon icon={faSearch} />
              </span>
              <input
                className="form-control"
                id="connector-name-filter"
                name="name"
                onChange={handleFilterChange}
                placeholder="Search by connector name"
                type="search"
                value={filters.name}
              />
            </div>
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
                    <th>Name</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {connectors.length > 0 ? (
                    connectors.map((connector) => {
                      return (
                        <tr key={connector.id}>
                          <td className="fw-semibold">
                            <span className="d-inline-flex align-items-center gap-2">
                              <FontAwesomeIcon className="text-muted" icon={faServer} />
                              <span>{connector.name}</span>
                            </span>
                          </td>
                          <td className="text-center">
                            <Link className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" to={`/connectors/${connector.id}`}>
                              <FontAwesomeIcon icon={faEye} />
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="text-center text-muted py-4" colSpan="2">
                        No connectors found.
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

export default ConnectorsIndex;
