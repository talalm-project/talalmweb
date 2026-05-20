import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPenToSquare, faServer } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { destroySession } from "../services/AuthService";
import ConnectorService from "../services/ConnectorService";

const CONNECTION_TYPES = {
  local: "Local",
  "open-ai": "OpenAI"
};

const renderValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted">Not configured</span>;
  }

  return value;
};

const ConnectorsShow = () => {
  const [connector, setConnector] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  const loadConnector = () => {
    setIsLoading(true);

    ConnectorService.fetchConnector(id)
      .then((response) => {
        setConnector(response.data);
        setErrorMessage("");
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          destroySession();
          navigate("/login");
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load connector.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadConnector();
  }, [id]);

  const headerActions = [
    <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" key="back-connectors" to="/connectors">
      <FontAwesomeIcon icon={faArrowLeft} />
      <span>Back to Connectors</span>
    </Link>
  ];

  if (connector) {
    headerActions.push(
      <Link className="btn btn-primary d-inline-flex align-items-center gap-2" key="edit-connector" to={`/connectors/${id}/edit`}>
        <FontAwesomeIcon icon={faPenToSquare} />
        <span>Edit Connector</span>
      </Link>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Models"
        title="Connector details"
        actions={headerActions}
      />

      <AdminContent
        title={(
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faServer} />
            <span>{connector?.name || "Connector"}</span>
          </div>
        )}
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

            {connector ? (
              <div className="row g-3">
                <div className="col-12">
                  <div className="talalm-detail-block">
                    <div className="talalm-label mb-1">Code</div>
                    <div className="talalm-detail-value">{renderValue(connector.code)}</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="talalm-detail-block">
                    <div className="talalm-label mb-1">Name</div>
                    <div className="talalm-detail-value">{renderValue(connector.name)}</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="talalm-detail-block">
                    <div className="talalm-label mb-1">Connection Type</div>
                    <div className="talalm-detail-value">{CONNECTION_TYPES[connector.connection_type] || connector.connection_type}</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="talalm-detail-block">
                    <div className="talalm-label mb-1">Local File Path</div>
                    <div className="talalm-detail-value text-break">{renderValue(connector.local_file_path)}</div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="talalm-detail-block">
                    <div className="talalm-label mb-1">Data</div>
                    <code>{JSON.stringify(connector.data || {})}</code>
                  </div>
                </div>
              </div>
            ) : null}
          </React.Fragment>
        )}
      </AdminContent>
    </div>
  );
};

export default ConnectorsShow;
