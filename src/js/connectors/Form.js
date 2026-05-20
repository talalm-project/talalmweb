import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faEye, faEyeSlash, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { getInputClassName, renderInputErrors } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
import ConnectorService from "../services/ConnectorService";
import { fetchLocalModels } from "../services/SystemService";

const CONNECTION_TYPES = [
  { value: "local", label: "Local" },
  { value: "open-ai", label: "OpenAI" }
];

const ConnectorsForm = () => {
  const [formValues, setFormValues] = useState({
    code: "",
    name: "",
    connection_type: "local",
    local_file_path: "",
    api_key: "",
    data: {}
  });
  const [localModels, setLocalModels] = useState([]);
  const [selectedLocalModelPath, setSelectedLocalModelPath] = useState("");
  const [originalConnectionType, setOriginalConnectionType] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [pageError, setPageError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const isLocal = formValues.connection_type === "local";
  const isOpenAi = formValues.connection_type === "open-ai";
  const apiKeyRequired = isOpenAi && (!isEditing || originalConnectionType !== "open-ai");

  const updateFormValue = (key, value) => {
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        [key]: value
      };
    });
  };

  const handleAuthError = (error) => {
    if ([401, 403].includes(error.response?.status)) {
      destroySession();
      navigate("/login");
      return true;
    }

    return false;
  };

  const applyLocalModel = (path, models = localModels) => {
    const localModel = models.find((model) => {
      return model.path === path;
    });

    setSelectedLocalModelPath(path);
    setFormValues((currentValues) => {
      return {
        ...currentValues,
        name: localModel?.name || "",
        local_file_path: localModel?.path || "",
        api_key: ""
      };
    });
  };

  const loadForm = () => {
    setIsBootstrapping(true);
    setPageError("");

    const requests = [fetchLocalModels()];
    if (isEditing) {
      requests.push(ConnectorService.fetchConnector(id));
    }

    Promise.all(requests)
      .then(([localModelsResponse, connectorResponse]) => {
        const models = localModelsResponse.data || [];
        setLocalModels(models);

        if (!connectorResponse) {
          return;
        }

        const connector = connectorResponse.data;
        setOriginalConnectionType(connector.connection_type || "local");
        setFormValues((currentValues) => {
          return {
            ...currentValues,
            code: connector.code || "",
            name: connector.name || "",
            connection_type: connector.connection_type || "local",
            local_file_path: connector.local_file_path || "",
            api_key: "",
            data: connector.data || {}
          };
        });

        if (connector.connection_type === "local") {
          const localModel = models.find((model) => {
            return model.path === connector.local_file_path;
          });
          setSelectedLocalModelPath(localModel?.path || "");
        }
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setPageError(error.response?.data?.message || "Unable to load connector.");
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  };

  const handleConnectionTypeChange = (event) => {
    const connectionType = event.target.value;

    setFormValues((currentValues) => {
      return {
        ...currentValues,
        connection_type: connectionType,
        name: connectionType === "local" ? "" : currentValues.name,
        local_file_path: "",
        api_key: connectionType === "local" ? "" : currentValues.api_key
      };
    });
    setSelectedLocalModelPath("");
    setErrors({});
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setPageError("");

    const payload = {
      code: formValues.code,
      name: formValues.name,
      connection_type: formValues.connection_type,
      data: formValues.data || {}
    };

    if (isLocal) {
      payload.local_file_path = formValues.local_file_path;
      payload.api_key = null;
    }

    if (isOpenAi) {
      payload.local_file_path = null;
      if (!isEditing || formValues.api_key) {
        payload.api_key = formValues.api_key;
      }
    }

    const request = isEditing
      ? ConnectorService.updateConnector(id, payload)
      : ConnectorService.createConnector(payload);

    request
      .then(() => {
        setErrors({});
        navigate("/connectors");
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        if (error.response?.status === 422) {
          setErrors(error.response.data);
          setPageError("");
          return;
        }

        setPageError(error.response?.data?.message || "Unable to save connector.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadForm();
  }, [id]);

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Models"
        title={isEditing ? "Edit connector" : "Create connector"}
      />

      <AdminContent
        title={isEditing ? "Update Connector" : "New Connector"}
        headerActions={[
          <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" key="back-connectors" to="/connectors">
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
              <label className="form-label">Code</label>
              <input
                className={getInputClassName(errors, "code")}
                disabled={isLoading}
                value={formValues.code}
                onChange={(event) => {
                  updateFormValue("code", event.target.value);
                }}
              />
              {renderInputErrors(errors, "code")}
            </div>

            <div className="col-12">
              <label className="form-label">Connection Type</label>
              <select
                className="form-select"
                disabled={isLoading}
                value={formValues.connection_type}
                onChange={handleConnectionTypeChange}
              >
                {CONNECTION_TYPES.map((type) => {
                  return (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  );
                })}
              </select>
              {renderInputErrors(errors, "connection_type")}
            </div>

            {isLocal ? (
              <React.Fragment>
                <div className="col-12">
                  <label className="form-label">Local Model</label>
                  <select
                    className="form-select"
                    disabled={isLoading || localModels.length === 0}
                    value={selectedLocalModelPath}
                    onChange={(event) => {
                      applyLocalModel(event.target.value);
                    }}
                  >
                    <option value="">Select a local model</option>
                    {localModels.map((model) => {
                      return (
                        <option key={model.path} value={model.path}>
                          {model.name}
                        </option>
                      );
                    })}
                  </select>
                  {localModels.length === 0 ? (
                    <div className="form-text text-warning">
                      No local models are available in the backend manifest.
                    </div>
                  ) : null}
                </div>

                <div className="col-12">
                  <label className="form-label">Name</label>
                  <input
                    className={getInputClassName(errors, "name")}
                    disabled
                    value={formValues.name}
                  />
                  {renderInputErrors(errors, "name")}
                </div>

                <div className="col-12">
                  <label className="form-label">Local File Path</label>
                  <input
                    className={getInputClassName(errors, "local_file_path")}
                    disabled
                    value={formValues.local_file_path}
                  />
                  {renderInputErrors(errors, "local_file_path")}
                </div>
              </React.Fragment>
            ) : null}

            {isOpenAi ? (
              <React.Fragment>
                <div className="col-12">
                  <label className="form-label">Model Name</label>
                  <input
                    className={getInputClassName(errors, "name")}
                    disabled={isLoading}
                    value={formValues.name}
                    onChange={(event) => {
                      updateFormValue("name", event.target.value);
                    }}
                  />
                  {renderInputErrors(errors, "name")}
                </div>

                <div className="col-12">
                  <label className="form-label">API Key</label>
                  <div className="input-group">
                    <input
                      className={getInputClassName(errors, "api_key")}
                      disabled={isLoading}
                      required={apiKeyRequired}
                      type={showApiKey ? "text" : "password"}
                      value={formValues.api_key}
                      onChange={(event) => {
                        updateFormValue("api_key", event.target.value);
                      }}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      disabled={isLoading}
                      onClick={() => {
                        setShowApiKey((currentValue) => !currentValue);
                      }}
                      type="button"
                    >
                      <FontAwesomeIcon icon={showApiKey ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  {isEditing && originalConnectionType === "open-ai" ? (
                    <div className="form-text">
                      Leave blank to keep the existing API key.
                    </div>
                  ) : null}
                  {renderInputErrors(errors, "api_key")}
                </div>
              </React.Fragment>
            ) : null}

            <div className="col-12 d-flex justify-content-end gap-2">
              <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" to="/connectors">
                <FontAwesomeIcon icon={faBan} />
                <span>Cancel</span>
              </Link>
              <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={isLoading} type="submit">
                <FontAwesomeIcon icon={faFloppyDisk} />
                <span>{isLoading ? "Saving..." : isEditing ? "Update Connector" : "Create Connector"}</span>
              </button>
            </div>
          </form>
        )}
      </AdminContent>
    </div>
  );
};

export default ConnectorsForm;
