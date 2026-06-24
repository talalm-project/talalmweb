import React from "react";
import Editor from "@monaco-editor/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines } from "@fortawesome/free-solid-svg-icons";
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

  return (
    <AdminContent title={selectedPaperFile ? selectedPaperFile.path : "Editor"}>
      <div className="d-flex flex-column gap-3">
        {selectedPaperFile && isSelectedFileEditable ? (
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className={`badge ${saveStatusLabel.className}`}>{saveStatusLabel.label}</span>
            {saveMessage ? <span className="badge text-bg-success">{saveMessage}</span> : null}
            {saveStatus === "save_failed" ? (
              <button className="btn btn-outline-secondary btn-sm" onClick={onReloadFile} type="button">
                Reload File
              </button>
            ) : null}
          </div>
        ) : null}

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
          <div className="border">
            <Editor
              height="64vh"
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
