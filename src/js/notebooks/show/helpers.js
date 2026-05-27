import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const CONNECTION_TYPES = {
  local: "Local",
  openai: "OpenAI"
};

export const POLLED_NOTEBOOK_FILE_STATUSES = ["pending", "uploading", "processing"];
export const DELETABLE_NOTEBOOK_FILE_STATUSES = ["pending", "active"];
export const RETRIEVAL_K_MIN = 1;
export const RETRIEVAL_K_MAX = 500;
export const RETRIEVAL_K_DEFAULT = 5;

export const parseDownloadFilename = (contentDisposition, fallback) => {
  const encodedMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] || fallback || "notebook-file";
};

export const saveBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const renderValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted">Not configured</span>;
  }

  return value;
};

export const formatByteSize = (value) => {
  if (value === null || value === undefined) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = Number(value);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const renderResponse = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (value?.response) {
    return renderResponse(value.response);
  }

  if (value?.output_text) {
    return value.output_text;
  }

  const firstChoice = value?.choices?.[0];
  if (firstChoice?.message?.content) {
    return firstChoice.message.content;
  }
  if (firstChoice?.text) {
    return firstChoice.text;
  }

  const outputText = value?.output?.flatMap((item) => {
    return item.content || [];
  }).find((content) => {
    return content.type === "output_text" && content.text;
  });
  if (outputText) {
    return outputText.text;
  }

  return JSON.stringify(value, null, 2);
};

export const renderNotebookNoteData = (data) => {
  if (!data || Object.keys(data).length === 0) {
    return <span className="text-muted">No note content.</span>;
  }

  if (typeof data.content === "string") {
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content}</ReactMarkdown>;
  }

  if (Array.isArray(data.blocks)) {
    return data.blocks.map((block, index) => {
      const key = `notebook-note-block-${index}`;
      if (block.type === "heading") {
        return <h3 className="talalm-note-block-heading" key={key}>{block.text}</h3>;
      }
      if (block.type === "paragraph") {
        return <p key={key}>{block.text}</p>;
      }

      return <pre className="talalm-note-json" key={key}>{JSON.stringify(block, null, 2)}</pre>;
    });
  }

  return <pre className="talalm-note-json">{JSON.stringify(data, null, 2)}</pre>;
};

export const renderMetric = (value, formatter = (metricValue) => metricValue) => {
  if (value === null || value === undefined) {
    return "n/a";
  }

  return formatter(value);
};

export const formatNumber = (value) => {
  return Number(value).toLocaleString();
};

export const formatSeconds = (value) => {
  return `${Number(value).toFixed(2)}s`;
};

export const formatTokensPerSecond = (value) => {
  return `${Number(value).toFixed(2)}/s`;
};

export const normalizedRetrievalK = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return RETRIEVAL_K_DEFAULT;
  }

  return Math.min(RETRIEVAL_K_MAX, Math.max(RETRIEVAL_K_MIN, numericValue));
};
