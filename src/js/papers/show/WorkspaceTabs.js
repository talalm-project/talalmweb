import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines, faTerminal, faTrash } from "@fortawesome/free-solid-svg-icons";

const statusBadgeClassName = (status) => {
  if (status === "success") {
    return "text-bg-success";
  }
  if (status === "failed") {
    return "text-bg-danger";
  }

  return "text-bg-secondary";
};

const WorkspaceTabs = ({ activeTab, compileJob, onChange }) => {
  return (
    <ul className="nav nav-tabs" role="tablist">
      <li className="nav-item" role="presentation">
        <button
          aria-selected={activeTab === "workspace"}
          className={`nav-link d-inline-flex align-items-center gap-2 ${activeTab === "workspace" ? "active" : ""}`}
          onClick={() => onChange("workspace")}
          role="tab"
          type="button"
        >
          <FontAwesomeIcon icon={faFileLines} />
          <span>Editor</span>
        </button>
      </li>
      <li className="nav-item" role="presentation">
        <button
          aria-selected={activeTab === "logs"}
          className={`nav-link d-inline-flex align-items-center gap-2 ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => onChange("logs")}
          role="tab"
          type="button"
        >
          <FontAwesomeIcon icon={faTerminal} />
          <span>Build Logs</span>
          {compileJob ? (
            <span className={`badge ms-2 ${statusBadgeClassName(compileJob.status)}`}>
              {compileJob.status}
            </span>
          ) : null}
        </button>
      </li>
      <li className="nav-item" role="presentation">
        <button
          aria-selected={activeTab === "actions"}
          className={`nav-link d-inline-flex align-items-center gap-2 ${activeTab === "actions" ? "active" : ""}`}
          onClick={() => onChange("actions")}
          role="tab"
          type="button"
        >
          <FontAwesomeIcon icon={faTrash} />
          <span>Actions</span>
        </button>
      </li>
    </ul>
  );
};

export default WorkspaceTabs;
