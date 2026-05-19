import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faStethoscope
} from "@fortawesome/free-solid-svg-icons";
import AdminContent from "./commons/AdminContent";
import Loader from "./commons/Loader";
import PageHeader from "./commons/PageHeader";
import { fetchDoctor } from "./services/SystemService";

const titleize = (value) => {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => {
      return character.toUpperCase();
    });
};

const renderValue = (value) => {
  if (typeof value === "boolean") {
    return (
      <span className={`badge ${value ? "text-bg-success" : "text-bg-secondary"}`}>
        <FontAwesomeIcon icon={value ? faCircleCheck : faCircleXmark} className="me-1" />
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-muted">Not configured</span>;
  }

  return String(value);
};

const flattenPayload = (payload) => {
  if (!payload) {
    return [];
  }

  return [
    ["Application", "Name", payload.app?.name],
    ["Application", "Environment", payload.app?.env],
    ["Application", "API Prefix", payload.app?.api_prefix],
    ["Database", "Configured", payload.database?.configured],
    ["Database", "Driver", payload.database?.driver],
    ["Database", "Host", payload.database?.host],
    ["Database", "Port", payload.database?.port],
    ["Database", "Database", payload.database?.database],
    ["Storage", "Max Content Length MB", payload.storage?.max_content_length_mb],
    ["S3", "Bucket", payload.storage?.s3?.bucket],
    ["S3", "Region", payload.storage?.s3?.region],
    ["S3", "Endpoint", payload.storage?.s3?.endpoint],
    ["S3", "Prefix", payload.storage?.s3?.prefix],
    ["S3", "Public URL", payload.storage?.s3?.public_url],
    ["S3", "Presigned Expires In", payload.storage?.s3?.presigned_expires_in],
    ["S3", "ACL", payload.storage?.s3?.acl],
    ["S3", "Signature Version", payload.storage?.s3?.signature_version],
    ["S3", "Addressing Style", payload.storage?.s3?.addressing_style],
    ["S3", "Create Bucket", payload.storage?.s3?.create_bucket],
    ["S3", "Access Key Configured", payload.storage?.s3?.access_key_configured],
    ["S3", "Secret Key Configured", payload.storage?.s3?.secret_key_configured],
    ["S3", "Session Token Configured", payload.storage?.s3?.session_token_configured]
  ];
};

const ConfigTable = ({ rows }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Section</th>
            <th>Setting</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([section, key, value]) => {
            return (
              <tr key={`${section}-${key}`}>
                <td className="text-muted fw-semibold">{section}</td>
                <th className="fw-semibold">{titleize(key)}</th>
                <td>{renderValue(value)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Doctor = () => {
  const [payload, setPayload] = useState(null);
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctor()
      .then((response) => {
        setPayload(response.data);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          window.location.replace(`${window.location.pathname}${window.location.search}#/login`);
          return;
        }

        if (error.response?.status === 403) {
          window.location.replace(`${window.location.pathname}${window.location.search}#/dashboard`);
          return;
        }

        setPageError(error.response?.data?.message || "Unable to load system configuration.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="System"
        title="Doctor"
      />

      {pageError ? (
        <div className="alert alert-danger mb-0">
          {pageError}
        </div>
      ) : null}

      {payload ? (
        <AdminContent
          title={(
            <div className="d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faStethoscope} />
              <span>Configuration</span>
            </div>
          )}
        >
          <ConfigTable rows={flattenPayload(payload)} />
        </AdminContent>
      ) : null}
    </div>
  );
};

export default Doctor;
