import React from "react";
import Editor from "@monaco-editor/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faRotate } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../../commons/AdminContent";
import Loader from "../../commons/Loader";
import { languageFor, saveStatusLabelFor } from "./helpers";

const EditorPanel = ({
  contentErrorMessage,
  editorValue,
  isContentLoading,
  isSelectedFileEditable,
  monacoTheme,
  onChange,
  onReloadFile,
  saveMessage,
  saveStatus,
  selectedPaperFile
}) => {
  const saveStatusLabel = saveStatusLabelFor(saveStatus);
  const headerActions = selectedPaperFile && isSelectedFileEditable ? [
    <span className={`badge ${saveStatusLabel.className}`} key="save-status">
      {saveStatusLabel.label}
    </span>,
    saveMessage ? (
      <span className="badge text-bg-success" key="save-message">
        {saveMessage}
      </span>
    ) : null,
    saveStatus === "save_failed" ? (
      <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2" key="reload-file" onClick={onReloadFile} type="button">
        <FontAwesomeIcon icon={faRotate} />
        <span>Reload</span>
      </button>
    ) : null
  ].filter(Boolean) : [];

  return (
    <AdminContent headerActions={headerActions} title={selectedPaperFile ? selectedPaperFile.path : "Editor"}>
      <div className="d-flex flex-column gap-3">
        {contentErrorMessage ? (
          <div className={isSelectedFileEditable ? "alert alert-danger mb-0" : "alert alert-info mb-0"}>
            {contentErrorMessage}
          </div>
        ) : null}

        {!selectedPaperFile ? (
          <div className="talalm-empty-state">
            <FontAwesomeIcon icon={faFileLines} />
            <span>Select a file to begin editing.</span>
          </div>
        ) : null}

        {selectedPaperFile && isContentLoading ? <Loader /> : null}

        {selectedPaperFile && isSelectedFileEditable && !isContentLoading ? (
          <div className="border talalm-paper-editor-shell">
            <Editor
              height="100%"
              language={languageFor(selectedPaperFile)}
              onChange={onChange}
              options={{
                lineNumbers: "on",
                minimap: { enabled: true },
                wordWrap: "on"
              }}
              theme={monacoTheme}
              value={editorValue}
            />
          </div>
        ) : null}
      </div>
    </AdminContent>
  );
};

export default EditorPanel;
