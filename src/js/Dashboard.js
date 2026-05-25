import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faChartSimple,
  faCircleCheck,
  faDatabase,
  faExclamationTriangle,
  faEye,
  faFileCircleCheck,
  faFileLines,
  faMagnifyingGlassChart,
  faPlus,
  faRotate,
  faServer,
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import AdminContent from "./commons/AdminContent";
import Loader from "./commons/Loader";
import PageHeader from "./commons/PageHeader";
import { statusToLabel } from "./helpers/AppHelper";
import { destroySession } from "./services/AuthService";
import ConnectorService from "./services/ConnectorService";
import NotebookService from "./services/NotebookService";

const POLLED_FILE_STATUSES = ["pending", "uploading", "processing"];

const connectionTypeLabels = {
  local: "Local",
  openai: "OpenAI"
};

const safeRecords = (response) => {
  return response?.data?.records || [];
};

const metadataFor = (connector) => {
  const metadata = connector?.data?.metadata;
  return metadata && typeof metadata === "object" ? metadata : {};
};

const connectorById = (connectors) => {
  return connectors.reduce((records, connector) => {
    records[connector.id] = connector;
    return records;
  }, {});
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString();
};

const formatTokens = (value) => {
  if (!value) {
    return "n/a";
  }

  return formatNumber(value);
};

const formatConfiguredNumber = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") {
    return "n/a";
  }

  return `${formatNumber(value)}${suffix}`;
};

const formatByteSize = (value) => {
  if (value === null || value === undefined) {
    return "Unknown";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = Number(value);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const statusCount = (records, status) => {
  return records.filter((record) => record.status === status).length;
};

const filesForNotebook = (files, notebookId) => {
  return files.filter((file) => file.notebook_id === notebookId);
};

const fileStatusSummary = (files) => {
  return {
    active: statusCount(files, "active"),
    pending: files.filter((file) => POLLED_FILE_STATUSES.includes(file.status)).length,
    failed: statusCount(files, "failed")
  };
};

const notebookHealth = (notebook, files) => {
  if (notebook.status === "failed" || statusCount(files, "failed") > 0) {
    return "failed";
  }

  if (notebook.status === "processing" || files.some((file) => POLLED_FILE_STATUSES.includes(file.status))) {
    return "processing";
  }

  if (notebook.status === "active" && files.length > 0 && files.every((file) => file.status === "active")) {
    return "active";
  }

  return notebook.status || "pending";
};

const Dashboard = () => {
  const [connectors, setConnectors] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [notebookFiles, setNotebookFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleAuthError = (error) => {
    if ([401, 403].includes(error.response?.status)) {
      destroySession();
      navigate("/login");
      return true;
    }

    return false;
  };

  const loadDashboard = ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage("");

    Promise.all([
      ConnectorService.fetchConnectors(),
      NotebookService.fetchNotebooks({ page: 1 })
    ])
      .then(([connectorsResponse, notebooksResponse]) => {
        const connectorRecords = safeRecords(connectorsResponse);
        const firstNotebookRecords = safeRecords(notebooksResponse);
        const totalPages = notebooksResponse.data.total_pages || 1;
        const remainingNotebookPages = [];

        for (let page = 2; page <= totalPages; page += 1) {
          remainingNotebookPages.push(NotebookService.fetchNotebooks({ page }));
        }

        return Promise.all(remainingNotebookPages).then((pageResponses) => {
          const notebookRecords = [
            ...firstNotebookRecords,
            ...pageResponses.flatMap((response) => safeRecords(response))
          ];

          return Promise.all(
            notebookRecords
              .filter((notebook) => (notebook.files_count || 0) > 0)
              .map((notebook) => NotebookService.fetchNotebookFiles(notebook.id).then((response) => safeRecords(response)))
          ).then((filesResponses) => {
            setConnectors(connectorRecords);
            setNotebooks(notebookRecords);
            setNotebookFiles(filesResponses.flat());
          });
        });
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load dashboard.");
      })
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const shouldPoll = notebookFiles.some((file) => POLLED_FILE_STATUSES.includes(file.status));
    if (!shouldPoll) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [notebookFiles]);

  const dashboard = useMemo(() => {
    const connectorsById = connectorById(connectors);
    const activeFiles = statusCount(notebookFiles, "active");
    const failedFiles = statusCount(notebookFiles, "failed");
    const queuedFiles = notebookFiles.filter((file) => POLLED_FILE_STATUSES.includes(file.status)).length;
    const notebooksWithoutFiles = notebooks.filter((notebook) => (notebook.files_count || 0) === 0).length;
    const activeNotebooks = notebooks.filter((notebook) => notebookHealth(notebook, filesForNotebook(notebookFiles, notebook.id)) === "active").length;
    const totalBytes = notebookFiles.reduce((sum, file) => sum + Number(file.byte_size || 0), 0);
    const localConnectors = connectors.filter((connector) => connector.connection_type === "local").length;
    const openaiConnectors = connectors.filter((connector) => connector.connection_type === "openai").length;

    const notebookRows = notebooks.map((notebook) => {
      const files = filesForNotebook(notebookFiles, notebook.id);
      const connector = connectorsById[notebook.connector_id];
      const metadata = metadataFor(connector);
      return {
        notebook,
        files,
        connector,
        metadata,
        summary: fileStatusSummary(files),
        health: notebookHealth(notebook, files)
      };
    });

    const connectorRows = connectors.map((connector) => {
      const metadata = metadataFor(connector);
      return {
        connector,
        metadata,
        notebooksCount: notebooks.filter((notebook) => notebook.connector_id === connector.id).length
      };
    });

    const attentionFiles = notebookFiles
      .filter((file) => file.status === "failed" || POLLED_FILE_STATUSES.includes(file.status))
      .slice(0, 8);

    return {
      activeFiles,
      activeNotebooks,
      attentionFiles,
      connectorRows,
      failedFiles,
      localConnectors,
      notebookRows,
      notebooksWithoutFiles,
      openaiConnectors,
      queuedFiles,
      totalBytes
    };
  }, [connectors, notebooks, notebookFiles]);

  const readinessIssues = [
    {
      label: "Files waiting for embeddings",
      value: dashboard.queuedFiles,
      tone: dashboard.queuedFiles > 0 ? "warning" : "success"
    },
    {
      label: "Failed files",
      value: dashboard.failedFiles,
      tone: dashboard.failedFiles > 0 ? "danger" : "success"
    },
    {
      label: "Notebooks without files",
      value: dashboard.notebooksWithoutFiles,
      tone: dashboard.notebooksWithoutFiles > 0 ? "warning" : "success"
    }
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Research"
        title="Content dashboard"
        actions={[
          <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" disabled={isRefreshing} key="refresh-dashboard" onClick={() => loadDashboard({ silent: true })} type="button">
            <FontAwesomeIcon icon={faRotate} spin={isRefreshing} />
            <span>{isRefreshing ? "Refreshing" : "Refresh"}</span>
          </button>,
          <Link className="btn btn-outline-primary d-inline-flex align-items-center gap-2" key="new-connector" to="/connectors/new">
            <FontAwesomeIcon icon={faServer} />
            <span>Connector</span>
          </Link>,
          <Link className="btn btn-primary d-inline-flex align-items-center gap-2" key="new-notebook" to="/notebooks">
            <FontAwesomeIcon icon={faPlus} />
            <span>Notebook</span>
          </Link>
        ]}
      />

      {isLoading ? (
        <AdminContent title="Loading Research Workspace">
          <Loader />
        </AdminContent>
      ) : (
        <React.Fragment>
          {errorMessage ? (
            <div className="alert alert-danger mb-0">
              {errorMessage}
            </div>
          ) : null}

          <div className="row g-3">
            <div className="col-12 col-md-6 col-xl-3">
              <div className="talalm-panel talalm-stat-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="talalm-stat-label">Notebooks</p>
                    <h2 className="talalm-stat-value">{formatNumber(notebooks.length)}</h2>
                    <p className="mb-0 talalm-muted small">{formatNumber(dashboard.activeNotebooks)} fully indexed</p>
                  </div>
                  <span className="badge talalm-badge-icon text-bg-primary">
                    <FontAwesomeIcon icon={faBook} />
                  </span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <div className="talalm-panel talalm-stat-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="talalm-stat-label">Indexed Files</p>
                    <h2 className="talalm-stat-value">{formatNumber(dashboard.activeFiles)}</h2>
                    <p className="mb-0 talalm-muted small">{formatByteSize(dashboard.totalBytes)} monitored</p>
                  </div>
                  <span className="badge talalm-badge-icon text-bg-success">
                    <FontAwesomeIcon icon={faFileCircleCheck} />
                  </span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <div className="talalm-panel talalm-stat-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="talalm-stat-label">Needs Attention</p>
                    <h2 className="talalm-stat-value">{formatNumber(dashboard.queuedFiles + dashboard.failedFiles + dashboard.notebooksWithoutFiles)}</h2>
                    <p className="mb-0 talalm-muted small">Queue, failures, and empty notebooks</p>
                  </div>
                  <span className={`badge talalm-badge-icon ${dashboard.failedFiles > 0 ? "text-bg-danger" : "text-bg-warning"}`}>
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                  </span>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <div className="talalm-panel talalm-stat-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="talalm-stat-label">Connectors</p>
                    <h2 className="talalm-stat-value">{formatNumber(connectors.length)}</h2>
                    <p className="mb-0 talalm-muted small">{dashboard.localConnectors} local, {dashboard.openaiConnectors} OpenAI</p>
                  </div>
                  <span className="badge talalm-badge-icon text-bg-info">
                    <FontAwesomeIcon icon={faServer} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-8">
              <AdminContent
                title={(
                  <div className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faMagnifyingGlassChart} />
                    <span>Research Coverage</span>
                  </div>
                )}
              >
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Notebook</th>
                        <th>Connector</th>
                        <th>Files</th>
                        <th>Status</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.notebookRows.length > 0 ? (
                        dashboard.notebookRows.map((row) => {
                          return (
                            <tr key={row.notebook.id}>
                              <td>
                                <div className="fw-semibold text-break">{row.notebook.title}</div>
                                <div className="talalm-muted small">
                                  {row.notebook.embedding_config_id ? "Embedding config ready" : "Embedding config pending"}
                                </div>
                              </td>
                              <td>
                                <div>{row.connector?.name || "Missing connector"}</div>
                                <div className="talalm-muted small">
                                  {connectionTypeLabels[row.connector?.connection_type] || row.connector?.connection_type || "Unknown"}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-2">
                                  <span className="badge text-bg-success">{row.summary.active} active</span>
                                  <span className="badge text-bg-warning">{row.summary.pending} queued</span>
                                  <span className="badge text-bg-danger">{row.summary.failed} failed</span>
                                </div>
                              </td>
                              <td>{statusToLabel(row.health)}</td>
                              <td className="text-center">
                                <Link className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" to={`/notebooks/${row.notebook.id}`}>
                                  <FontAwesomeIcon icon={faEye} />
                                  <span>Open</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="text-center text-muted py-4" colSpan="5">
                            No notebooks found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AdminContent>
            </div>

            <div className="col-12 col-xl-4">
              <AdminContent
                title={(
                  <div className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faChartSimple} />
                    <span>Readiness Checks</span>
                  </div>
                )}
              >
                <div className="d-flex flex-column gap-3">
                  {readinessIssues.map((item) => {
                    return (
                      <div className="talalm-priority-item p-3 d-flex align-items-center justify-content-between gap-3" key={item.label}>
                        <div>
                          <div className="fw-semibold">{item.label}</div>
                          <div className="talalm-muted small">Research answers improve when this is zero.</div>
                        </div>
                        <span className={`badge talalm-badge-icon text-bg-${item.tone}`}>
                          {item.value > 0 ? <FontAwesomeIcon icon={faExclamationTriangle} /> : <FontAwesomeIcon icon={faCircleCheck} />}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </AdminContent>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-7">
              <AdminContent
                title={(
                  <div className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faDatabase} />
                    <span>Connector Capacity</span>
                  </div>
                )}
              >
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Connector</th>
                        <th>Inference</th>
                        <th>Embeddings</th>
                        <th>Chunking</th>
                        <th>Use</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.connectorRows.length > 0 ? (
                        dashboard.connectorRows.map((row) => {
                          const inference = row.metadata.inference || {};
                          const embeddings = row.metadata.embeddings || {};
                          const chunking = embeddings.chunking || {};
                          return (
                            <tr key={row.connector.id}>
                              <td>
                                <div className="fw-semibold text-break">{row.connector.name}</div>
                                <div className="talalm-muted small">{connectionTypeLabels[row.connector.connection_type] || row.connector.connection_type}</div>
                              </td>
                              <td>
                                <div>{inference.model?.name || row.connector.name}</div>
                                <div className="talalm-muted small">{formatTokens(inference.limits?.context_window_tokens)} ctx tokens</div>
                              </td>
                              <td>
                                <div>{embeddings.model?.name || row.connector.embedding_name || "Not configured"}</div>
                                <div className="talalm-muted small">{embeddings.model?.embedding_size || "n/a"} dimensions</div>
                              </td>
                              <td>
                                <div>{formatConfiguredNumber(chunking.chunk_size, " chars")}</div>
                                <div className="talalm-muted small">{formatConfiguredNumber(chunking.chunk_overlap)} overlap</div>
                              </td>
                              <td>{formatNumber(row.notebooksCount)} notebooks</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="text-center text-muted py-4" colSpan="5">
                            No connectors found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AdminContent>
            </div>

            <div className="col-12 col-xl-5">
              <AdminContent
                title={(
                  <div className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faFileLines} />
                    <span>Content Monitor</span>
                  </div>
                )}
              >
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>File</th>
                        <th>Status</th>
                        <th>Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.attentionFiles.length > 0 ? (
                        dashboard.attentionFiles.map((file) => {
                          const notebook = notebooks.find((record) => record.id === file.notebook_id);
                          return (
                            <tr key={file.id}>
                              <td>
                                <div className="fw-semibold text-break">{file.name}</div>
                                <div className="talalm-muted small text-break">
                                  {notebook?.title || file.filename}
                                </div>
                                {file.error_message ? (
                                  <div className="text-danger small text-break">{file.error_message}</div>
                                ) : null}
                              </td>
                              <td>{statusToLabel(file.status)}</td>
                              <td>{formatByteSize(file.byte_size)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="text-center text-muted py-4" colSpan="3">
                            No failed or queued files.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AdminContent>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default Dashboard;
