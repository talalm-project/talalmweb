import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faFileLines,
  faFolderOpen,
  faPlus,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { joinProjectPath } from "./helpers";

const CreateFileModal = ({
  destinationPath,
  errorMessage,
  folderPaths,
  isCreating,
  onClose,
  onCreate,
  onDestinationPathChange,
  show
}) => {
  const [filename, setFilename] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const customDestination = folderPaths.includes(destinationPath) || destinationPath === "" ? "" : destinationPath;
  const filenameError = hasSubmitted && filename.trim().length === 0 ? "Enter a file name." : "";
  const previewPath = useMemo(() => {
    return joinProjectPath(destinationPath, filename || "filename.tex");
  }, [destinationPath, filename]);

  useEffect(() => {
    if (show) {
      setHasSubmitted(false);
    } else {
      setFilename("");
      setHasSubmitted(false);
    }
  }, [show]);

  const handleClose = () => {
    if (isCreating) {
      return;
    }

    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setHasSubmitted(true);
    if (filename.trim().length === 0) {
      return;
    }

    onCreate({
      filename,
      destinationPath
    });
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!isCreating}>
          <Modal.Title className="d-inline-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faFileLines} />
            <span>New File</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            {errorMessage ? (
              <div className="col-12">
                <div className="alert alert-danger mb-0" role="alert">
                  {errorMessage}
                </div>
              </div>
            ) : null}

            <div className="col-md-7">
              <label className="form-label" htmlFor="paper-new-file-destination">
                Destination
              </label>
              <select
                className="form-select"
                disabled={isCreating}
                id="paper-new-file-destination"
                onChange={(event) => onDestinationPathChange(event.target.value)}
                value={folderPaths.includes(destinationPath) || destinationPath === "" ? destinationPath : customDestination}
              >
                <option value="">Project root</option>
                {folderPaths.map((folderPath) => (
                  <option key={folderPath} value={folderPath}>
                    {folderPath}
                  </option>
                ))}
                {customDestination ? <option value={customDestination}>{customDestination}</option> : null}
              </select>
            </div>

            <div className="col-md-5">
              <label className="form-label" htmlFor="paper-new-file-custom-destination">
                New folder
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <FontAwesomeIcon icon={faFolderOpen} />
                </span>
                <input
                  className="form-control"
                  disabled={isCreating}
                  id="paper-new-file-custom-destination"
                  onChange={(event) => onDestinationPathChange(event.target.value)}
                  placeholder="source/sections"
                  value={customDestination}
                />
              </div>
              <div className="form-text">Leave empty to use the selected destination.</div>
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="paper-new-file-name">
                File name
              </label>
              <input
                autoFocus
                aria-describedby={filenameError ? "paper-new-file-name-help paper-new-file-name-error" : "paper-new-file-name-help"}
                aria-invalid={filenameError ? "true" : "false"}
                className={`form-control ${filenameError ? "is-invalid" : ""}`}
                disabled={isCreating}
                id="paper-new-file-name"
                onChange={(event) => setFilename(event.target.value)}
                placeholder="main.tex"
                value={filename}
              />
              <div className="form-text" id="paper-new-file-name-help">
                Use a file name such as main.tex, references.bib, or a nested path such as sections/intro.tex.
              </div>
              {filenameError ? <div className="invalid-feedback" id="paper-new-file-name-error">{filenameError}</div> : null}
            </div>

            <div className="col-12">
              <div className="talalm-new-file-suggestions" aria-label="File name suggestions">
                {["main.tex", "introduction.tex", "references.bib"].map((suggestion) => (
                  <button
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                    disabled={isCreating}
                    key={suggestion}
                    onClick={() => setFilename(suggestion)}
                    type="button"
                  >
                    <FontAwesomeIcon icon={faFileLines} />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="col-12">
              <div className="talalm-new-file-preview d-flex align-items-start gap-2">
                <FontAwesomeIcon icon={faCheck} />
                <div className="min-w-0">
                  <div className="small text-muted">File will be created at</div>
                  <div className="fw-semibold text-break">{previewPath}</div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="d-inline-flex align-items-center gap-2"
            disabled={isCreating || filename.trim().length === 0}
            type="submit"
            variant="primary"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{isCreating ? "Creating..." : "Create"}</span>
          </Button>
          <Button
            className="d-inline-flex align-items-center gap-2"
            disabled={isCreating}
            onClick={handleClose}
            type="button"
            variant="secondary"
          >
            <FontAwesomeIcon icon={faXmark} />
            <span>Cancel</span>
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default CreateFileModal;
