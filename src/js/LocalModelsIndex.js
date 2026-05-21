import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faDiagramProject, faMicrochip } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "./commons/AdminContent";
import Loader from "./commons/Loader";
import PageHeader from "./commons/PageHeader";
import { fetchLocalModels } from "./services/SystemService";

const LocalModelsIndex = () => {
  const [models, setModels] = useState([]);
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLocalModels()
      .then((response) => {
        setModels(response.data || []);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          window.location.replace(`${window.location.pathname}${window.location.search}#/login`);
          return;
        }

        if (error.response?.status === 403) {
          window.location.replace(`${window.location.pathname}${window.location.search}#/dashboard`);
          return;
        }

        setPageError(error.response?.data?.message || "Unable to load local models.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  const modelTypeBadge = (type) => {
    if (type === "inference") {
      return (
        <span className="badge text-bg-primary d-inline-flex align-items-center gap-1">
          <FontAwesomeIcon icon={faBrain} />
          <span>Inference</span>
        </span>
      );
    }

    if (type === "embedding" || type === "embeddings") {
      return (
        <span className="badge text-bg-info d-inline-flex align-items-center gap-1">
          <FontAwesomeIcon icon={faDiagramProject} />
          <span>Embedding</span>
        </span>
      );
    }

    return <span className="badge text-bg-secondary">Not specified</span>;
  };

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="System"
        title="Local Models"
      />

      {pageError ? (
        <div className="alert alert-danger mb-0">
          {pageError}
        </div>
      ) : null}

      <AdminContent
        title={(
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faMicrochip} />
            <span>Available Models</span>
          </div>
        )}
      >
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {models.length > 0 ? (
                models.map((model, index) => {
                  return (
                    <tr key={`${model.name}-${model.path}-${index}`}>
                      <td className="fw-semibold">{model.name || "Unnamed model"}</td>
                      <td>{modelTypeBadge(model.type)}</td>
                      <td className="text-break">
                        <code>{model.path || "No path configured"}</code>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="text-center text-muted py-4" colSpan="3">
                    No local models found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminContent>
    </div>
  );
};

export default LocalModelsIndex;
