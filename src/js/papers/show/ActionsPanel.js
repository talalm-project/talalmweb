import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../../commons/AdminContent";

const ActionsPanel = ({ deletePaperErrorMessage, onDeletePaper }) => {
  return (
    <AdminContent title="Actions">
      <div className="d-flex flex-column gap-3">
        {deletePaperErrorMessage ? <div className="alert alert-danger mb-0">{deletePaperErrorMessage}</div> : null}

        <div className="border border-danger p-3">
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div>
              <h2 className="h5 mb-2">Delete Paper</h2>
              <p className="mb-0 text-muted">
                Permanently delete this paper, its uploaded project files, compile jobs, build logs, and generated PDFs.
              </p>
            </div>
            <button
              className="btn btn-outline-danger d-inline-flex align-items-center gap-2 flex-shrink-0"
              onClick={onDeletePaper}
              type="button"
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>Delete Paper</span>
            </button>
          </div>
        </div>
      </div>
    </AdminContent>
  );
};

export default ActionsPanel;
