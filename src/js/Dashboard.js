import React, { useEffect, useState } from "react";
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
import DashboardService from "./services/DashboardService";

const connectionTypeLabels = {
  local: "Local",
  openai: "OpenAI"
};

const metadataFor = (connector) => {
  const metadata = connector?.data?.metadata;
  return metadata && typeof metadata === "object" ? metadata : {};
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

const emptyDashboard = {
  summary: {
    notebooks_count: 0,
    active_notebooks_count: 0,
    connectors_count: 0,
    local_connectors_count: 0,
    openai_connectors_count: 0,
    active_files_count: 0,
    queued_files_count: 0,
    failed_files_count: 0,
    notebooks_without_files_count: 0,
    total_file_bytes: 0,
    needs_attention_count: 0
  },
  notebooks: [],
  connectors: [],
  attention_files: []
};

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(emptyDashboard);
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

    DashboardService.fetchDashboard()
      .then((response) => {
        setDashboard({
          ...emptyDashboard,
          ...response.data,
          summary: {
            ...emptyDashboard.summary,
            ...(response.data.summary || {})
          }
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
    const shouldPoll = dashboard.summary.queued_files_count > 0;
    if (!shouldPoll) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadDashboard({ silent: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dashboard.summary.queued_files_count]);

  const summary = dashboard.summary;

  const readinessIssues = [
    {
      label: "Files waiting for embeddings",
      value: summary.queued_files_count,
      tone: summary.queued_files_count > 0 ? "warning" : "success"
    },
    {
      label: "Failed files",
      value: summary.failed_files_count,
      tone: summary.failed_files_count > 0 ? "danger" : "success"
    },
    {
      label: "Notebooks without files",
      value: summary.notebooks_without_files_count,
      tone: summary.notebooks_without_files_count > 0 ? "warning" : "success"
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
                    <h2 className="talalm-stat-value">{formatNumber(summary.notebooks_count)}</h2>
                    <p className="mb-0 talalm-muted small">{formatNumber(summary.active_notebooks_count)} fully indexed</p>
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
                    <h2 className="talalm-stat-value">{formatNumber(summary.active_files_count)}</h2>
                    <p className="mb-0 talalm-muted small">{formatByteSize(summary.total_file_bytes)} monitored</p>
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
                    <h2 className="talalm-stat-value">{formatNumber(summary.needs_attention_count)}</h2>
                    <p className="mb-0 talalm-muted small">Queue, failures, and empty notebooks</p>
                  </div>
                  <span className={`badge talalm-badge-icon ${summary.failed_files_count > 0 ? "text-bg-danger" : "text-bg-warning"}`}>
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
                    <h2 className="talalm-stat-value">{formatNumber(summary.connectors_count)}</h2>
                    <p className="mb-0 talalm-muted small">{summary.local_connectors_count} local, {summary.openai_connectors_count} OpenAI</p>
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
                      {dashboard.notebooks.length > 0 ? (
                        dashboard.notebooks.map((row) => {
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
                                  <span className="badge text-bg-success">{row.file_summary.active} active</span>
                                  <span className="badge text-bg-warning">{row.file_summary.queued} queued</span>
                                  <span className="badge text-bg-danger">{row.file_summary.failed} failed</span>
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
                      {dashboard.connectors.length > 0 ? (
                        dashboard.connectors.map((row) => {
                          const metadata = metadataFor(row.connector);
                          const inference = metadata.inference || {};
                          const embeddings = metadata.embeddings || {};
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
                              <td>{formatNumber(row.notebooks_count)} notebooks</td>
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
                      {dashboard.attention_files.length > 0 ? (
                        dashboard.attention_files.map((file) => {
                          const notebook = file.notebook;
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
