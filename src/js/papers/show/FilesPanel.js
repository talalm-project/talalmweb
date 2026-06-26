import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faFileArrowUp,
  faFileLines,
  faFolder,
  faFolderOpen,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../../commons/AdminContent";
import Loader from "../../commons/Loader";
import { formatByteSize } from "../../notebooks/show/helpers";

const FileTreeNodes = ({
  nodes,
  depth = 0,
  deletingFileIds,
  expandedFolders,
  onDeleteFile,
  onDeleteFolder,
  onSelectFile,
  onToggleFolder,
  selectedPaperFile
}) => {
  return nodes.map((node) => {
    const paddingLeft = `${depth * 1.1}rem`;

    if (node.type === "folder") {
      const isExpanded = expandedFolders.has(node.path);
      return (
        <React.Fragment key={node.id}>
          <div className="list-group-item talalm-paper-file-node" style={{ paddingLeft }}>
            <button
              className="btn btn-link p-0 text-start text-decoration-none d-inline-flex align-items-center gap-2 talalm-paper-file-name"
              onClick={() => onToggleFolder(node.path)}
              type="button"
            >
              <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} />
              <FontAwesomeIcon icon={isExpanded ? faFolderOpen : faFolder} />
              <span className="fw-semibold text-truncate">{node.label}</span>
            </button>
            <button
              aria-label={`Delete ${node.path}`}
              className="btn btn-outline-danger btn-sm talalm-icon-button"
              onClick={() => onDeleteFolder(node)}
              title="Delete folder"
              type="button"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
          {isExpanded ? (
            <FileTreeNodes
              deletingFileIds={deletingFileIds}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              nodes={node.children}
              onDeleteFile={onDeleteFile}
              onDeleteFolder={onDeleteFolder}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              selectedPaperFile={selectedPaperFile}
            />
          ) : null}
        </React.Fragment>
      );
    }

    const paperFile = node.file;
    const isSelected = selectedPaperFile?.id === paperFile.id;
    const isDeleting = deletingFileIds.includes(paperFile.id);
    return (
      <div className={`list-group-item ${isSelected ? "active" : ""}`} key={paperFile.id} style={{ paddingLeft }}>
        <div className="talalm-paper-file-node align-items-start">
          <button
            className={`btn btn-link p-0 text-start text-decoration-none talalm-paper-file-name ${isSelected ? "text-white" : ""}`}
            onClick={() => onSelectFile(paperFile)}
            type="button"
          >
            <div className="fw-semibold d-inline-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faFileLines} />
              <span className="text-truncate">{node.label}</span>
            </div>
            <div className={isSelected ? "small text-white-50" : "small text-muted"}>
              {formatByteSize(paperFile.size)}
              {paperFile.content_type ? ` · ${paperFile.content_type}` : ""}
            </div>
          </button>
          <button
            aria-label={`Delete ${paperFile.filename}`}
            className={isSelected ? "btn btn-outline-light btn-sm talalm-icon-button" : "btn btn-outline-danger btn-sm talalm-icon-button"}
            disabled={isDeleting}
            onClick={() => onDeleteFile(paperFile)}
            title="Delete file"
            type="button"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>
    );
  });
};

const FilesPanel = ({
  deletingFileIds,
  expandedFolders,
  fileInputRef,
  fileTree,
  filesErrorMessage,
  folderInputRef,
  folderPaths,
  isFilesLoading,
  isUploading,
  onDeleteFile,
  onDeleteFolder,
  onFileSelection,
  onFolderSelection,
  onOpenFilePicker,
  onOpenFolderPicker,
  onSelectFile,
  onToggleFolder,
  onUploadDestinationChange,
  paperFiles,
  selectedPaperFile,
  uploadDestinationPath,
  uploadErrorMessage,
  uploadProgress
}) => {
  return (
    <AdminContent
      title="Files"
      headerActions={[
        <button
          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
          disabled={isUploading}
          key="upload-file"
          onClick={onOpenFilePicker}
          type="button"
        >
          <FontAwesomeIcon icon={faFileArrowUp} />
          <span>{isUploading ? "Uploading..." : "Upload File"}</span>
        </button>,
        <button
          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
          disabled={isUploading}
          key="upload-folder"
          onClick={onOpenFolderPicker}
          type="button"
        >
          <FontAwesomeIcon icon={faFolderOpen} />
          <span>Upload Folder</span>
        </button>
      ]}
    >
      <input className="d-none" multiple onChange={onFileSelection} ref={fileInputRef} type="file" />
      <input
        className="d-none"
        directory=""
        multiple
        onChange={onFolderSelection}
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
      />

      <div className="talalm-paper-files-panel">
        <div className="talalm-paper-upload-target">
          <div>
            <label className="form-label" htmlFor="paper-upload-destination">
              Upload destination
            </label>
            <select
              className="form-select form-select-sm"
              id="paper-upload-destination"
              onChange={(event) => onUploadDestinationChange(event.target.value)}
              value={uploadDestinationPath}
            >
              {folderPaths.map((folderPath) => (
                <option key={folderPath} value={folderPath}>
                  {folderPath}
                </option>
              ))}
              <option value="">Project root</option>
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="paper-custom-upload-destination">
              New folder path
            </label>
            <input
              className="form-control form-control-sm"
              id="paper-custom-upload-destination"
              onChange={(event) => onUploadDestinationChange(event.target.value)}
              placeholder="source/sections"
              value={folderPaths.includes(uploadDestinationPath) || uploadDestinationPath === "" ? "" : uploadDestinationPath}
            />
          </div>
        </div>

        {uploadProgress !== null ? (
          <div className="mb-3">
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>Uploading</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="progress">
              <div
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow={uploadProgress}
                className="progress-bar"
                role="progressbar"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {uploadErrorMessage ? <div className="alert alert-danger">{uploadErrorMessage}</div> : null}
        {filesErrorMessage ? <div className="alert alert-danger">{filesErrorMessage}</div> : null}

        {isFilesLoading ? (
          <Loader />
        ) : (
          <React.Fragment>
            {paperFiles.length === 0 ? (
              <div className="talalm-empty-state">
                <FontAwesomeIcon icon={faFolderOpen} />
                <span>No files uploaded.</span>
              </div>
            ) : (
              <div className="list-group">
                <FileTreeNodes
                  deletingFileIds={deletingFileIds}
                  expandedFolders={expandedFolders}
                  nodes={fileTree}
                  onDeleteFile={onDeleteFile}
                  onDeleteFolder={onDeleteFolder}
                  onSelectFile={onSelectFile}
                  onToggleFolder={onToggleFolder}
                  selectedPaperFile={selectedPaperFile}
                />
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </AdminContent>
  );
};

export default FilesPanel;
