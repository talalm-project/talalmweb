import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFilePdf, faRotate, faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../../commons/AdminContent";
import Loader from "../../commons/Loader";

const PdfPreviewPanel = ({
  activeCompileJob,
  compileJob,
  isPdfLoading,
  onDownloadPdf,
  onOpenPdf,
  onRefreshPdf,
  pdfAvailable,
  pdfErrorMessage,
  pdfUrl
}) => {
  return (
    <AdminContent
      title="PDF Preview"
      headerActions={[
        <button
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          disabled={isPdfLoading}
          key="refresh-pdf-panel"
          onClick={onRefreshPdf}
          type="button"
        >
          <FontAwesomeIcon icon={faRotate} />
          <span>{isPdfLoading ? "Refreshing..." : "Refresh"}</span>
        </button>,
        <button
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
          disabled={!pdfAvailable || isPdfLoading}
          key="download-pdf-panel"
          onClick={onDownloadPdf}
          type="button"
        >
          <FontAwesomeIcon icon={faDownload} />
          <span>Download</span>
        </button>,
        <button
          className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
          disabled={!pdfAvailable || isPdfLoading}
          key="open-latest-pdf"
          onClick={onOpenPdf}
          type="button"
        >
          <FontAwesomeIcon icon={faUpRightFromSquare} />
          <span>Open</span>
        </button>
      ]}
    >
      <div className="d-flex flex-column gap-3">
        {pdfErrorMessage ? <div className="alert alert-danger mb-0">{pdfErrorMessage}</div> : null}
        {activeCompileJob ? <div className="alert alert-info mb-0">Compilation in progress...</div> : null}
        {compileJob?.status === "failed" ? (
          <div className="alert alert-danger mb-0">Compilation failed. Review the build logs below.</div>
        ) : null}
        {isPdfLoading ? <Loader /> : null}

        {!isPdfLoading && !pdfAvailable ? (
          <div className="talalm-empty-state">
            <FontAwesomeIcon icon={faFilePdf} />
            <span>No compiled PDF available.</span>
            <span className="text-muted">Compile the project to generate a PDF.</span>
          </div>
        ) : null}

        {!isPdfLoading && pdfAvailable && pdfUrl ? (
          <div className="border bg-body-tertiary talalm-paper-preview-shell">
            <iframe className="border-0 d-block w-100 h-100" src={pdfUrl} title="PDF Preview" />
          </div>
        ) : null}
      </div>
    </AdminContent>
  );
};

export default PdfPreviewPanel;
