import React from "react";
import AdminContent from "../../commons/AdminContent";

const statusBadgeClassName = (status) => {
  if (status === "success") {
    return "text-bg-success";
  }
  if (status === "failed") {
    return "text-bg-danger";
  }

  return "text-bg-secondary";
};

const BuildLogsPanel = ({
  buildLogRef,
  compileErrorMessage,
  compileJob,
  isDownloadingPdf,
  onOpenJobPdf
}) => {
  return (
    <AdminContent
      title="Build Logs"
      headerActions={[
        compileJob?.status === "success" ? (
          <button
            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
            disabled={isDownloadingPdf}
            key="open-pdf"
            onClick={onOpenJobPdf}
            type="button"
          >
            <span>{isDownloadingPdf ? "Opening..." : "Open Job PDF"}</span>
          </button>
        ) : null
      ].filter(Boolean)}
    >
      <div className="d-flex flex-column gap-3">
        {compileErrorMessage ? <div className="alert alert-danger mb-0">{compileErrorMessage}</div> : null}

        {compileJob ? (
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="talalm-label">Status</span>
            <span className={`badge ${statusBadgeClassName(compileJob.status)}`}>{compileJob.status.toUpperCase()}</span>
            {compileJob.status === "pending" ? <span className="text-muted">Compilation queued...</span> : null}
            {compileJob.status === "running" ? <span className="text-muted">Compiling...</span> : null}
            {compileJob.status === "success" ? <span className="text-muted">Compilation successful.</span> : null}
            {compileJob.status === "failed" ? <span className="text-muted">Compilation failed.</span> : null}
          </div>
        ) : (
          <div className="text-muted">No compile job has run yet.</div>
        )}

        {compileJob?.error_message ? <div className="alert alert-danger mb-0">{compileJob.error_message}</div> : null}

        <pre
          className="talalm-build-log mb-0 p-3"
          ref={buildLogRef}
          style={{ maxHeight: "18rem", overflowY: "auto", whiteSpace: "pre-wrap" }}
        >
          {compileJob?.logs || "Build logs will appear here after compilation starts."}
        </pre>
      </div>
    </AdminContent>
  );
};

export default BuildLogsPanel;
