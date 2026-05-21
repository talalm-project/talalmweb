import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faClock, faPlug, faXmark } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { statusToLabel } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
import NotebookService from "../services/NotebookService";

const CONNECTION_TYPES = {
  local: "Local",
  openai: "OpenAI"
};

const renderValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted">Not configured</span>;
  }

  return value;
};

const NotebooksShow = () => {
  const [notebook, setNotebook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();

  const loadNotebook = () => {
    setIsLoading(true);

    NotebookService.fetchNotebook(id)
      .then((response) => {
        setNotebook(response.data);
        setErrorMessage("");
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          destroySession();
          navigate("/login");
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load notebook.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadNotebook();
  }, [id]);

  if (isLoading) {
    return <Loader />;
  }

  if (errorMessage) {
    return (
      <div className="d-flex flex-column gap-4">
        <PageHeader
          eyebrow="Knowledge"
          title="Notebook"
          actions={[
            <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" key="back-notebooks" to="/notebooks">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back</span>
            </Link>
          ]}
        />

        <div className="alert alert-danger">
          {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Knowledge"
        title={notebook.title}
        actions={[
          <div className="d-inline-flex align-items-center gap-3" key="notebook-status">
            {statusToLabel(notebook.status)}
            <button
              className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
              onClick={() => {
                setShowConnectorModal(true);
              }}
              type="button"
            >
              <FontAwesomeIcon icon={faPlug} />
              <span>Connector</span>
            </button>
            <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" to="/notebooks">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back</span>
            </Link>
          </div>
        ]}
      />

      {notebook.status === "pending" ? (
        <AdminContent title="Processing">
          <div className="d-flex align-items-center gap-3 py-4">
            <div className="spinner-border text-primary" role="status" aria-hidden="true" />
            <div>
              <div className="fw-semibold">
                Preparing notebook
              </div>
              <div className="text-muted">
                The system is still processing this notebook.
              </div>
            </div>
          </div>
        </AdminContent>
      ) : (
        <AdminContent title="Notebook">
          <div className="d-flex align-items-center gap-2 text-muted">
            <FontAwesomeIcon icon={faClock} />
            <span>Notebook is ready.</span>
          </div>
        </AdminContent>
      )}

      <Modal
        show={showConnectorModal}
        onHide={() => {
          setShowConnectorModal(false);
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Connector Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Code</div>
                <div className="talalm-detail-value">{renderValue(notebook.connector?.code)}</div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Name</div>
                <div className="talalm-detail-value">{renderValue(notebook.connector?.name)}</div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Connection Type</div>
                <div className="talalm-detail-value">
                  {CONNECTION_TYPES[notebook.connector?.connection_type] || renderValue(notebook.connector?.connection_type)}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Embedding Name</div>
                <div className="talalm-detail-value">{renderValue(notebook.connector?.embedding_name)}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Local File Path</div>
                <div className="talalm-detail-value text-break">{renderValue(notebook.connector?.local_file_path)}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Embedding Local File Path</div>
                <div className="talalm-detail-value text-break">{renderValue(notebook.connector?.embedding_local_file_path)}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Data</div>
                <pre className="talalm-json-block"><code>{JSON.stringify(notebook.connector?.data || {}, null, 2)}</code></pre>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="d-inline-flex align-items-center gap-2"
            disabled={!notebook.connector?.id}
            onClick={() => {
              navigate(`/connectors/${notebook.connector.id}`);
            }}
            type="button"
            variant="primary"
          >
            <FontAwesomeIcon icon={faPlug} />
            <span>Go to Connector</span>
          </Button>
          <Button
            className="d-inline-flex align-items-center gap-2"
            onClick={() => {
              setShowConnectorModal(false);
            }}
            type="button"
            variant="secondary"
          >
            <FontAwesomeIcon icon={faXmark} />
            <span>Close</span>
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NotebooksShow;
