import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faDownload, faFileLines, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../../commons/AdminContent";
import Loader from "../../commons/Loader";
import { statusToLabel } from "../../helpers/AppHelper";
import ReindexNotebookCommand from "./ReindexNotebookCommand";
import { DELETABLE_NOTEBOOK_FILE_STATUSES, formatByteSize } from "./helpers";

const NotebookFilesPanel = ({
  notebook,
  notebookFiles,
  isFilesLoading,
  filesErrorMessage,
  isFilesPanelCollapsed,
  downloadingFileIds,
  isInferring,
  manualRetrieval,
  manualRetrievalFileIds,
  setManualRetrievalFileIds,
  onCollapse,
  onExpand,
  onNewFile,
  onDownloadFile,
  onDeleteFile,
  onAuthError,
  onReindexCompleted,
  onReindexError
}) => {
  const selectableFiles = notebookFiles.filter((notebookFile) => {
    return notebookFile.status !== "failed";
  });
  const selectedManualRetrievalCount = manualRetrievalFileIds.filter((fileId) => {
    return selectableFiles.some((notebookFile) => {
      return notebookFile.id === fileId;
    });
  }).length;

  const toggleManualRetrievalFile = (fileId) => {
    setManualRetrievalFileIds((currentIds) => {
      if (currentIds.includes(fileId)) {
        return currentIds.filter((currentId) => {
          return currentId !== fileId;
        });
      }

      return [...currentIds, fileId];
    });
  };

  return (
    <div className={isFilesPanelCollapsed ? "col-12 col-xl-auto talalm-notebook-files-column is-collapsed" : "col-12 col-xl-4 talalm-notebook-files-column"}>
      {isFilesPanelCollapsed ? (
        <div className="talalm-notebook-files-rail">
          <button
            aria-label="Expand files panel"
            className="btn btn-outline-secondary btn-sm talalm-icon-button"
            onClick={onExpand}
            title="Expand files"
            type="button"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          <FontAwesomeIcon icon={faFileLines} />
          <span>{manualRetrieval ? selectedManualRetrievalCount : notebookFiles.length}</span>
        </div>
      ) : (
        <AdminContent
          title="Files"
          headerActions={[
            <button
              aria-label="Collapse files panel"
              className="btn btn-outline-secondary btn-sm talalm-icon-button"
              key="collapse-files"
              onClick={onCollapse}
              title="Collapse files"
              type="button"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>,
            <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2" key="new-file" onClick={onNewFile} type="button">
              <FontAwesomeIcon icon={faPlus} />
              <span>New File</span>
            </button>
          ]}
        >
          <div className="talalm-notebook-files">
            {isFilesLoading ? (
              <Loader />
            ) : (
              <React.Fragment>
                {filesErrorMessage ? (
                  <div className="alert alert-danger">
                    {filesErrorMessage}
                  </div>
                ) : null}

                {!filesErrorMessage && notebookFiles.length === 0 ? (
                  <div className="talalm-empty-state">
                    <FontAwesomeIcon icon={faFileLines} />
                    <span>No files.</span>
                  </div>
                ) : null}

                {!filesErrorMessage && notebookFiles.map((notebookFile) => {
                  return (
                    <div className="talalm-notebook-file" key={notebookFile.id}>
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="min-w-0">
                          <div className="talalm-notebook-file-name text-break">
                            {notebookFile.name}
                          </div>
                          <div className="talalm-notebook-file-meta text-break">
                            {notebookFile.filename}
                          </div>
                        </div>
                        <div className="d-inline-flex align-items-center gap-2">
                          <div className="talalm-notebook-file-status">
                            {notebookFile.status === "processing" ? (
                              <span className="talalm-notebook-file-processing" aria-label="Processing file vectors" role="status">
                                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                              </span>
                            ) : null}
                            {statusToLabel(notebookFile.status)}
                          </div>
                          <button
                            aria-label={`Download ${notebookFile.name}`}
                            className="btn btn-outline-primary btn-sm talalm-icon-button"
                            disabled={downloadingFileIds.includes(notebookFile.id)}
                            onClick={() => {
                              onDownloadFile(notebookFile);
                            }}
                            title={downloadingFileIds.includes(notebookFile.id) ? "Downloading file" : "Download file"}
                            type="button"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                          <button
                            aria-label={`Delete ${notebookFile.name}`}
                            className="btn btn-outline-danger btn-sm talalm-icon-button"
                            disabled={!DELETABLE_NOTEBOOK_FILE_STATUSES.includes(notebookFile.status)}
                            onClick={() => {
                              onDeleteFile(notebookFile);
                            }}
                            title={
                              DELETABLE_NOTEBOOK_FILE_STATUSES.includes(notebookFile.status)
                                ? "Delete file"
                                : "Only pending or active files can be deleted"
                            }
                            type="button"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                      <div className="talalm-notebook-file-meta mt-2">
                        {formatByteSize(notebookFile.byte_size)}
                        {notebookFile.content_type ? ` · ${notebookFile.content_type}` : ""}
                      </div>
                      {manualRetrieval && notebookFile.status !== "failed" ? (
                        <div className="form-check form-switch talalm-notebook-file-context-toggle">
                          <input
                            checked={manualRetrievalFileIds.includes(notebookFile.id)}
                            className="form-check-input"
                            disabled={isInferring}
                            id={`notebook-file-context-${notebookFile.id}`}
                            onChange={() => {
                              toggleManualRetrievalFile(notebookFile.id);
                            }}
                            type="checkbox"
                          />
                          <label className="form-check-label" htmlFor={`notebook-file-context-${notebookFile.id}`}>
                            Include in context
                          </label>
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                <div className="talalm-notebook-files-footer">
                  <ReindexNotebookCommand
                    disabled={isFilesLoading}
                    fileCount={notebookFiles.length}
                    notebook={notebook}
                    onAuthError={onAuthError}
                    onCompleted={onReindexCompleted}
                    onError={onReindexError}
                  />
                </div>
              </React.Fragment>
            )}
          </div>
        </AdminContent>
      )}
    </div>
  );
};

export default NotebookFilesPanel;
