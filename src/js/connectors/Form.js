import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { getInputClassName, renderInputErrors } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
import ConnectorService from "../services/ConnectorService";
import { fetchLocalModels } from "../services/SystemService";

const DEFAULT_CONTEXT_WINDOW_MIN = 512;
const DEFAULT_CONTEXT_WINDOW_MAX = 4096;
const DEFAULT_CONTEXT_WINDOW_RECOMMENDED = 4096;

const ConnectorsForm = () => {
  const [formValues, setFormValues] = useState({
    code: "",
    name: "",
    local_file_path: "",
    embedding_local_file_path: "",
    embedding_name: "",
    data: {}
  });
  const [localModels, setLocalModels] = useState([]);
  const [selectedLocalModelPath, setSelectedLocalModelPath] = useState("");
  const [selectedEmbeddingModelPath, setSelectedEmbeddingModelPath] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [pageError, setPageError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const inferenceLocalModels = localModels.filter((model) => !model.type || model.type === "inference");
  const embeddingLocalModels = localModels.filter((model) => model.type === "embedding" || model.type === "embeddings");
  const selectedLocalModel = inferenceLocalModels.find((model) => model.path === selectedLocalModelPath);
  const contextWindowMin = selectedLocalModel?.context_window_min || DEFAULT_CONTEXT_WINDOW_MIN;
  const contextWindowMax = selectedLocalModel?.context_window_max || DEFAULT_CONTEXT_WINDOW_MAX;
  const contextWindowRecommended = selectedLocalModel?.context_window_recommended || DEFAULT_CONTEXT_WINDOW_RECOMMENDED;
  const contextWindowValue = Number(formValues.data?.model_options?.n_ctx || contextWindowRecommended);

  const updateFormValue = (key, value) => {
    setFormValues((currentValues) => ({ ...currentValues, [key]: value }));
  };

  const updateModelOption = (key, value) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      data: {
        ...(currentValues.data || {}),
        model_options: {
          ...((currentValues.data || {}).model_options || {}),
          [key]: value
        }
      }
    }));
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
    const localModel = models.find((model) => model.path === path);

    setSelectedLocalModelPath(path);
    setFormValues((currentValues) => ({
      ...currentValues,
      name: localModel?.name || "",
      local_file_path: localModel?.path || "",
      data: {
        ...(currentValues.data || {}),
        model_options: {
          ...((currentValues.data || {}).model_options || {}),
          n_ctx: localModel?.context_window_recommended || DEFAULT_CONTEXT_WINDOW_RECOMMENDED
        }
      }
    }));
  };

  const applyEmbeddingModel = (path, models = localModels) => {
    const embeddingModel = models.find((model) => model.path === path);

    setSelectedEmbeddingModelPath(path);
    setFormValues((currentValues) => ({
      ...currentValues,
      embedding_name: embeddingModel?.name || "",
      embedding_local_file_path: embeddingModel?.path || ""
    }));
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
        setFormValues((currentValues) => ({
          ...currentValues,
          code: connector.code || "",
          name: connector.name || "",
          local_file_path: connector.local_file_path || "",
          embedding_local_file_path: connector.embedding_local_file_path || "",
          embedding_name: connector.embedding_name || "",
          data: connector.data || {}
        }));

        const localModel = models.find((model) => model.path === connector.local_file_path);
        const embeddingModel = models.find((model) => model.path === connector.embedding_local_file_path);
        setSelectedLocalModelPath(localModel?.path || "");
        setSelectedEmbeddingModelPath(embeddingModel?.path || "");
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

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setPageError("");

    const payload = {
      code: formValues.code,
      name: formValues.name,
      local_file_path: formValues.local_file_path,
      embedding_local_file_path: formValues.embedding_local_file_path,
      embedding_name: formValues.embedding_name,
      data: {
        ...(formValues.data || {}),
        model_options: {
          ...((formValues.data || {}).model_options || {}),
          n_ctx: contextWindowValue
        }
      }
    };

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
      <PageHeader eyebrow="Models" title={isEditing ? "Edit connector" : "Create connector"} />

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
                <div className="alert alert-danger mb-0">{pageError}</div>
              </div>
            ) : null}

            <div className="col-12">
              <label className="form-label">Code</label>
              <input
                className={getInputClassName(errors, "code")}
                disabled={isLoading}
                value={formValues.code}
                onChange={(event) => updateFormValue("code", event.target.value)}
              />
              {renderInputErrors(errors, "code")}
            </div>

            <div className="col-12">
              <label className="form-label">Local Model</label>
              <select
                className="form-select"
                disabled={isLoading || inferenceLocalModels.length === 0}
                value={selectedLocalModelPath}
                onChange={(event) => applyLocalModel(event.target.value)}
              >
                <option value="">Select a local model</option>
                {inferenceLocalModels.map((model) => (
                  <option key={model.path} value={model.path}>
                    {model.name}
                  </option>
                ))}
              </select>
              {inferenceLocalModels.length === 0 ? (
                <div className="form-text text-warning">No local inference models are available in the backend manifest.</div>
              ) : null}
            </div>

            <div className="col-12">
              <label className="form-label">Name</label>
              <input className={getInputClassName(errors, "name")} disabled value={formValues.name} />
              {renderInputErrors(errors, "name")}
            </div>

            <div className="col-12">
              <label className="form-label">Local File Path</label>
              <input className={getInputClassName(errors, "local_file_path")} disabled value={formValues.local_file_path} />
              {renderInputErrors(errors, "local_file_path")}
            </div>

            <div className="col-12">
              <div className="talalm-range-control">
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <label className="form-label mb-0" htmlFor="connector-context-window">Context Window</label>
                  <input
                    className="form-control form-control-sm talalm-range-value"
                    disabled={isLoading || !formValues.local_file_path}
                    max={contextWindowMax}
                    min={contextWindowMin}
                    onChange={(event) => updateModelOption("n_ctx", Number(event.target.value))}
                    type="number"
                    value={contextWindowValue}
                  />
                </div>
                <input
                  className="form-range"
                  disabled={isLoading || !formValues.local_file_path}
                  id="connector-context-window"
                  max={contextWindowMax}
                  min={contextWindowMin}
                  onChange={(event) => updateModelOption("n_ctx", Number(event.target.value))}
                  step="128"
                  type="range"
                  value={contextWindowValue}
                />
                <div className="talalm-range-bounds">
                  <span>Min {contextWindowMin.toLocaleString()}</span>
                  <span>Recommended {contextWindowRecommended.toLocaleString()}</span>
                  <span>Max {contextWindowMax.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="col-12">
              <label className="form-label">Embedding Model</label>
              <select
                className="form-select"
                disabled={isLoading || embeddingLocalModels.length === 0}
                value={selectedEmbeddingModelPath}
                onChange={(event) => applyEmbeddingModel(event.target.value)}
              >
                <option value="">Select an embedding model</option>
                {embeddingLocalModels.map((model) => (
                  <option key={model.path} value={model.path}>
                    {model.name}
                  </option>
                ))}
              </select>
              {embeddingLocalModels.length === 0 ? (
                <div className="form-text text-warning">No local embedding models are available in the backend manifest.</div>
              ) : null}
            </div>

            <div className="col-12">
              <label className="form-label">Embedding Name</label>
              <input className={getInputClassName(errors, "embedding_name")} disabled value={formValues.embedding_name} />
              {renderInputErrors(errors, "embedding_name")}
            </div>

            <div className="col-12">
              <label className="form-label">Embedding Local File Path</label>
              <input
                className={getInputClassName(errors, "embedding_local_file_path")}
                disabled
                value={formValues.embedding_local_file_path}
              />
              {renderInputErrors(errors, "embedding_local_file_path")}
            </div>

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
