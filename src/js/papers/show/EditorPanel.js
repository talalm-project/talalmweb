import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { latex } from "codemirror-lang-latex";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faRotate } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../../commons/AdminContent";
import Loader from "../../commons/Loader";
import { languageFor, saveStatusLabelFor } from "./helpers";

const editorSurfaceTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--talalm-surface-lowest)",
    color: "var(--talalm-text-strong)",
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace",
    fontSize: "0.88rem"
  },
  ".cm-scroller": {
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace",
    lineHeight: "1.55"
  },
  ".cm-content": {
    minHeight: "100%",
    padding: "0.85rem 0"
  },
  ".cm-gutters": {
    backgroundColor: "var(--talalm-surface-low)",
    color: "var(--talalm-text-muted)",
    borderRight: "1px solid var(--talalm-border)"
  },
  ".cm-activeLine": {
    backgroundColor: "var(--talalm-surface-high)"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--talalm-surface-high)",
    color: "var(--talalm-text-strong)"
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgba(124, 140, 255, 0.28)"
  },
  ".cm-cursor": {
    borderLeftColor: "var(--talalm-primary-bright)"
  },
  ".cm-tooltip": {
    border: "1px solid var(--talalm-border)",
    backgroundColor: "var(--talalm-surface)",
    color: "var(--talalm-text)"
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--talalm-primary)",
    color: "var(--talalm-primary-ink)"
  }
});

const EditorPanel = ({
  contentErrorMessage,
  editorValue,
  isContentLoading,
  isSelectedFileEditable,
  editorTheme,
  onChange,
  onReloadFile,
  saveMessage,
  saveStatus,
  selectedPaperFile
}) => {
  const saveStatusLabel = saveStatusLabelFor(saveStatus);
  const editorLanguage = languageFor(selectedPaperFile);
  const editorExtensions = useMemo(() => {
    const extensions = [
      EditorView.lineWrapping,
      editorSurfaceTheme
    ];

    if (editorLanguage === "latex") {
      extensions.unshift(latex({
        autoCloseTags: true,
        autoCloseBrackets: true,
        enableAutocomplete: true,
        enableLinting: true,
        enableTooltips: true,
        fileName: selectedPaperFile?.path || selectedPaperFile?.filename || "paper.tex"
      }));
    }

    return extensions;
  }, [editorLanguage, selectedPaperFile?.path, selectedPaperFile?.filename]);
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
            <CodeMirror
              basicSetup={{
                bracketMatching: true,
                closeBrackets: true,
                foldGutter: true,
                highlightActiveLine: true,
                highlightActiveLineGutter: true,
                lineNumbers: true,
                searchKeymap: true
              }}
              className="talalm-codemirror-editor"
              extensions={editorExtensions}
              height="100%"
              onChange={onChange}
              theme={editorTheme}
              value={editorValue}
            />
          </div>
        ) : null}
      </div>
    </AdminContent>
  );
};

export default EditorPanel;
