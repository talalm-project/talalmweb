import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faFileLines, faPlus } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { destroySession } from "../services/AuthService";
import PaperService from "../services/PaperService";
import CreatePaperModal from "./CreatePaperModal";

const PapersIndex = () => {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = (error) => {
    if ([401, 403].includes(error.response?.status)) {
      destroySession();
      navigate("/login");
      return true;
    }

    return false;
  };

  const loadPapers = () => {
    setIsLoading(true);

    PaperService.fetchPapers()
      .then((response) => {
        setPapers(response.data.records || []);
        setErrorMessage("");
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load papers.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const handlePaperCreated = () => {
    setShowCreateModal(false);
    loadPapers();
  };

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Writing"
        title="Papers"
        actions={[
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" key="add-paper" onClick={() => setShowCreateModal(true)} type="button">
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Paper</span>
          </button>
        ]}
      />

      <AdminContent title="Paper Directory">
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
                    <th className="text-center">Main File</th>
                    <th className="text-center">Compiler</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.length > 0 ? (
                    papers.map((paper) => {
                      return (
                        <tr key={paper.id}>
                          <td className="fw-semibold">
                            <span className="d-inline-flex align-items-center gap-2">
                              <FontAwesomeIcon className="text-muted" icon={faFileLines} />
                              <span>{paper.name}</span>
                            </span>
                          </td>
                          <td className="text-center">{paper.data?.main_file || "main.tex"}</td>
                          <td className="text-center">{paper.data?.compiler || "pdflatex"}</td>
                          <td className="text-center">
                            <Link className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2" to={`/papers/${paper.id}`}>
                              <FontAwesomeIcon icon={faEye} />
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="text-center text-muted py-4" colSpan="4">
                        No papers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </React.Fragment>
        )}
      </AdminContent>

      <CreatePaperModal
        onAuthError={handleAuthError}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePaperCreated}
        show={showCreateModal}
      />
    </div>
  );
};

export default PapersIndex;
