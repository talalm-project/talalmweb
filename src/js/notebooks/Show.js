import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChevronLeft, faChevronRight, faDownload, faFileLines, faPaperPlane, faPlug, faPlus, faSliders, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import ConfirmationModal from "../commons/ConfirmationModal";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { getInputClassName, renderInputErrors, statusToLabel } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
import NotebookService from "../services/NotebookService";

const CONNECTION_TYPES = {
  local: "Local",
  openai: "OpenAI"
};

const emptyNotebookFileForm = {
  name: "",
  file: null
};

const POLLED_NOTEBOOK_FILE_STATUSES = ["pending", "uploading", "processing"];
const DELETABLE_NOTEBOOK_FILE_STATUSES = ["pending", "active"];
const RETRIEVAL_K_MIN = 1;
const RETRIEVAL_K_MAX = 500;
const RETRIEVAL_K_DEFAULT = 5;

const parseDownloadFilename = (contentDisposition, fallback) => {
  const encodedMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] || fallback || "notebook-file";
};

const saveBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const renderValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted">Not configured</span>;
  }

  return value;
};

const formatByteSize = (value) => {
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

const renderResponse = (value) => {
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

const renderMetric = (value, formatter = (metricValue) => metricValue) => {
  if (value === null || value === undefined) {
    return "n/a";
  }

  return formatter(value);
};

const formatNumber = (value) => {
  return Number(value).toLocaleString();
};

const formatSeconds = (value) => {
  return `${Number(value).toFixed(2)}s`;
};

const formatTokensPerSecond = (value) => {
  return `${Number(value).toFixed(2)}/s`;
};

const normalizedRetrievalK = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return RETRIEVAL_K_DEFAULT;
  }

  return Math.min(RETRIEVAL_K_MAX, Math.max(RETRIEVAL_K_MIN, numericValue));
};

const renderSources = (sources = []) => {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  return (
    <div className="talalm-chat-sources">
      <div className="talalm-chat-sources-title">Sources</div>
      <div className="talalm-chat-sources-list">
        {sources.map((source) => {
          const label = source.name || source.filename || "Notebook file";
          const detail = source.filename && source.filename !== label ? source.filename : source.content_type;
          const SourceTag = source.url ? "a" : "span";
          const sourceLinkProps = source.url ? { href: source.url, rel: "noreferrer", target: "_blank" } : {};

          return (
            <SourceTag
              className={`talalm-chat-source${source.url ? "" : " talalm-chat-source-disabled"}`}
              key={`notebook-source-${source.id}`}
              {...sourceLinkProps}
            >
              <FontAwesomeIcon icon={faFileLines} />
              <span className="min-w-0">
                <span className="talalm-chat-source-name text-break">{label}</span>
                {detail ? (
                  <span className="talalm-chat-source-meta text-break">{detail}</span>
                ) : null}
              </span>
            </SourceTag>
          );
        })}
      </div>
    </div>
  );
};

const NotebooksShow = () => {
  const [notebook, setNotebook] = useState(null);
  const [notebookFiles, setNotebookFiles] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [retrievalK, setRetrievalK] = useState("5");
  const [chatError, setChatError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFilesLoading, setIsFilesLoading] = useState(true);
  const [isInferring, setIsInferring] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [downloadingFileIds, setDownloadingFileIds] = useState([]);
  const [isFilesPanelCollapsed, setIsFilesPanelCollapsed] = useState(false);
  const [selectedNotebookFile, setSelectedNotebookFile] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [notebookFileForm, setNotebookFileForm] = useState(emptyNotebookFileForm);
  const [notebookFileErrors, setNotebookFileErrors] = useState({});
  const [notebookFileErrorMessage, setNotebookFileErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filesErrorMessage, setFilesErrorMessage] = useState("");
  const chatLogRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const loadNotebook = () => {
    setIsLoading(true);

    NotebookService.fetchNotebook(id)
      .then((response) => {
        setNotebook(response.data);
        setErrorMessage("");
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          destroySession();
          navigate("/login");
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load notebook.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const loadNotebookFiles = ({ silent = false } = {}) => {
    if (!silent) {
      setIsFilesLoading(true);
    }

    NotebookService.fetchNotebookFiles(id)
      .then((response) => {
        setNotebookFiles(response.data.records || []);
        setFilesErrorMessage("");
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          destroySession();
          navigate("/login");
          return;
        }

        setFilesErrorMessage(error.response?.data?.message || "Unable to load notebook files.");
      })
      .finally(() => {
        if (!silent) {
          setIsFilesLoading(false);
        }
      });
  };

  useEffect(() => {
    loadNotebook();
    loadNotebookFiles();
  }, [id]);

  useEffect(() => {
    const shouldPollFiles = notebookFiles.some((notebookFile) => {
      return POLLED_NOTEBOOK_FILE_STATUSES.includes(notebookFile.status);
    });
    if (!shouldPollFiles) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadNotebookFiles({ silent: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [id, notebookFiles]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatMessages, isInferring]);

  const handleAuthError = (error) => {
    if ([401, 403].includes(error.response?.status)) {
      destroySession();
      navigate("/login");
      return true;
    }

    return false;
  };

  const handleDelete = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    NotebookService.deleteNotebook(id)
      .then(() => {
        navigate("/notebooks");
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to delete notebook.");
        setShowDeleteModal(false);
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  const openDeleteFileModal = (notebookFile) => {
    setSelectedNotebookFile(notebookFile);
    setShowDeleteFileModal(true);
  };

  const closeDeleteFileModal = () => {
    if (isDeletingFile) {
      return;
    }

    setSelectedNotebookFile(null);
    setShowDeleteFileModal(false);
  };

  const handleDeleteFile = () => {
    if (isDeletingFile || !selectedNotebookFile || !notebook) {
      return;
    }

    setIsDeletingFile(true);

    NotebookService.deleteNotebookFile(notebook.id, selectedNotebookFile.id)
      .then(() => {
        setShowDeleteFileModal(false);
        setSelectedNotebookFile(null);
        loadNotebookFiles();
        loadNotebook();
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setFilesErrorMessage(error.response?.data?.message || "Unable to delete notebook file.");
        setShowDeleteFileModal(false);
        setSelectedNotebookFile(null);
      })
      .finally(() => {
        setIsDeletingFile(false);
      });
  };

  const handleDownloadFile = (notebookFile) => {
    if (!notebook || downloadingFileIds.includes(notebookFile.id)) {
      return;
    }

    setDownloadingFileIds((currentIds) => {
      return [...currentIds, notebookFile.id];
    });

    NotebookService.downloadNotebookFile(notebook.id, notebookFile.id)
      .then((response) => {
        const filename = parseDownloadFilename(response.headers["content-disposition"], notebookFile.filename || notebookFile.name);
        saveBlob(response.data, filename);
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setFilesErrorMessage(error.response?.data?.message || "Unable to download notebook file.");
      })
      .finally(() => {
        setDownloadingFileIds((currentIds) => {
          return currentIds.filter((fileId) => fileId !== notebookFile.id);
        });
      });
  };

  const openFileModal = () => {
    setNotebookFileForm(emptyNotebookFileForm);
    setNotebookFileErrors({});
    setNotebookFileErrorMessage("");
    setShowFileModal(true);
  };

  const closeFileModal = () => {
    if (isUploadingFile) {
      return;
    }

    setShowFileModal(false);
    setNotebookFileForm(emptyNotebookFileForm);
    setNotebookFileErrors({});
    setNotebookFileErrorMessage("");
  };

  const handleNotebookFileFormChange = (event) => {
    const { name, value } = event.target;

    setNotebookFileForm((currentValues) => {
      return {
        ...currentValues,
        [name]: value
      };
    });
  };

  const handleNotebookFileChange = (event) => {
    setNotebookFileForm((currentValues) => {
      return {
        ...currentValues,
        file: event.target.files?.[0] || null
      };
    });
  };

  const handleCreateNotebookFile = (event) => {
    event.preventDefault();
    if (isUploadingFile) {
      return;
    }

    setIsUploadingFile(true);
    setNotebookFileErrors({});
    setNotebookFileErrorMessage("");

    NotebookService.createNotebookFile(notebook.id, notebookFileForm)
      .then(() => {
        setShowFileModal(false);
        setNotebookFileForm(emptyNotebookFileForm);
        loadNotebookFiles();
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        if (error.response?.status === 422) {
          setNotebookFileErrors(error.response.data);
          return;
        }

        setNotebookFileErrorMessage(error.response?.data?.message || "Unable to upload notebook file.");
      })
      .finally(() => {
        setIsUploadingFile(false);
      });
  };

  const handlePromptSubmit = (event) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isInferring || !notebook) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmedPrompt
    };

    setChatMessages((currentMessages) => {
      return [...currentMessages, userMessage];
    });
    setPrompt("");
    setChatError("");
    setIsInferring(true);

    const messages = [
      ...chatMessages.map((message) => {
        return {
          role: message.role === "user" ? "user" : "assistant",
          content: renderResponse(message.content)
        };
      }),
      {
        role: "user",
        content: trimmedPrompt
      }
    ];

    NotebookService.inferNotebook(notebook.id, { input: messages, k: normalizedRetrievalK(retrievalK) })
      .then((response) => {
        setChatMessages((currentMessages) => {
          return [
            ...currentMessages,
            {
              role: "notebook",
              content: response.data
            }
          ];
        });
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setChatError(error.response?.data?.message || "Unable to chat with notebook.");
      })
      .finally(() => {
        setIsInferring(false);
      });
  };

  if (isLoading) {
    return <Loader />;
  }

  if (errorMessage) {
    return (
      <div className="d-flex flex-column gap-4">
        <PageHeader
          eyebrow="Knowledge"
          title="Notebook"
          actions={[
            <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" key="back-notebooks" to="/notebooks">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back</span>
            </Link>
          ]}
        />

        <div className="alert alert-danger">
          {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="talalm-notebook-show d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Knowledge"
        title={notebook.title}
        actions={[
          <div className="d-inline-flex align-items-center gap-3" key="notebook-status">
            {statusToLabel(notebook.status)}
            <button
              className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
              onClick={() => {
                setShowDeleteModal(true);
              }}
              type="button"
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>Delete</span>
            </button>
            <button
              className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
              onClick={() => {
                setShowConfigModal(true);
              }}
              type="button"
            >
              <FontAwesomeIcon icon={faSliders} />
              <span>Config</span>
            </button>
            <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" to="/notebooks">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back</span>
            </Link>
          </div>
        ]}
      />

      <div className={`row g-4 align-items-stretch talalm-notebook-layout${isFilesPanelCollapsed ? " talalm-notebook-layout-files-collapsed" : ""}`}>
        <div className={isFilesPanelCollapsed ? "col-12 col-xl-auto talalm-notebook-files-column is-collapsed" : "col-12 col-xl-4 talalm-notebook-files-column"}>
          {isFilesPanelCollapsed ? (
            <div className="talalm-notebook-files-rail">
              <button
                aria-label="Expand files panel"
                className="btn btn-outline-secondary btn-sm talalm-icon-button"
                onClick={() => {
                  setIsFilesPanelCollapsed(false);
                }}
                title="Expand files"
                type="button"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              <FontAwesomeIcon icon={faFileLines} />
              <span>{notebookFiles.length}</span>
            </div>
          ) : (
            <AdminContent
              title="Files"
              headerActions={[
                <button
                  aria-label="Collapse files panel"
                  className="btn btn-outline-secondary btn-sm talalm-icon-button"
                  key="collapse-files"
                  onClick={() => {
                    setIsFilesPanelCollapsed(true);
                  }}
                  title="Collapse files"
                  type="button"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>,
                <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2" key="new-file" onClick={openFileModal} type="button">
                  <FontAwesomeIcon icon={faPlus} />
                  <span>New File</span>
                </button>
              ]}
            >
              <div className="talalm-notebook-files">
                {isFilesLoading ? (
                  <Loader />
                ) : (
                  <React.Fragment>
                    {filesErrorMessage ? (
                      <div className="alert alert-danger">
                        {filesErrorMessage}
                      </div>
                    ) : null}

                    {!filesErrorMessage && notebookFiles.length === 0 ? (
                      <div className="talalm-empty-state">
                        <FontAwesomeIcon icon={faFileLines} />
                        <span>No files.</span>
                      </div>
                    ) : null}

                    {!filesErrorMessage && notebookFiles.map((notebookFile) => {
                      return (
                        <div className="talalm-notebook-file" key={notebookFile.id}>
                          <div className="d-flex align-items-start justify-content-between gap-2">
                            <div className="min-w-0">
                              <div className="talalm-notebook-file-name text-break">
                                {notebookFile.name}
                              </div>
                              <div className="talalm-notebook-file-meta text-break">
                                {notebookFile.filename}
                              </div>
                            </div>
                            <div className="d-inline-flex align-items-center gap-2">
                              <div className="talalm-notebook-file-status">
                                {notebookFile.status === "processing" ? (
                                  <span className="talalm-notebook-file-processing" aria-label="Processing file vectors" role="status">
                                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                                  </span>
                                ) : null}
                                {statusToLabel(notebookFile.status)}
                              </div>
                              <button
                                aria-label={`Download ${notebookFile.name}`}
                                className="btn btn-outline-primary btn-sm talalm-icon-button"
                                disabled={downloadingFileIds.includes(notebookFile.id)}
                                onClick={() => {
                                  handleDownloadFile(notebookFile);
                                }}
                                title={downloadingFileIds.includes(notebookFile.id) ? "Downloading file" : "Download file"}
                                type="button"
                              >
                                <FontAwesomeIcon icon={faDownload} />
                              </button>
                              <button
                                aria-label={`Delete ${notebookFile.name}`}
                                className="btn btn-outline-danger btn-sm talalm-icon-button"
                                disabled={!DELETABLE_NOTEBOOK_FILE_STATUSES.includes(notebookFile.status)}
                                onClick={() => {
                                  openDeleteFileModal(notebookFile);
                                }}
                                title={
                                  DELETABLE_NOTEBOOK_FILE_STATUSES.includes(notebookFile.status)
                                    ? "Delete file"
                                    : "Only pending or active files can be deleted"
                                }
                                type="button"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                          <div className="talalm-notebook-file-meta mt-2">
                            {formatByteSize(notebookFile.byte_size)}
                            {notebookFile.content_type ? ` · ${notebookFile.content_type}` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                )}
              </div>
            </AdminContent>
          )}
        </div>

        <div className={isFilesPanelCollapsed ? "col-12 col-xl talalm-notebook-chat-column" : "col-12 col-xl-8 talalm-notebook-chat-column"}>
          <AdminContent title="Chat">
            <div className="talalm-chat-panel">
                  <div className="talalm-chat-log" ref={chatLogRef}>
                    {chatMessages.length === 0 ? (
                      <div className="talalm-chat-empty text-muted">
                        Send a prompt to chat with this notebook.
                      </div>
                    ) : (
                      chatMessages.map((message, index) => {
                        const isUser = message.role === "user";

                        return (
                          <div className={`talalm-chat-row ${isUser ? "talalm-chat-row-user" : "talalm-chat-row-connector"}`} key={`notebook-chat-message-${index}`}>
                            <div className="talalm-chat-meta">
                              {isUser ? "You" : "Notebook"}
                            </div>
                            <div className="talalm-chat-bubble">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {renderResponse(message.content)}
                              </ReactMarkdown>
                              {!isUser ? renderSources(message.content?.sources) : null}
                              {!isUser && message.content?.details ? (
                                <div className="talalm-chat-stats">
                                  <div className="talalm-chat-stat">
                                    <span>Prompt</span>
                                    <strong>{renderMetric(message.content.details.prompt_tokens, formatNumber)}</strong>
                                  </div>
                                  <div className="talalm-chat-stat">
                                    <span>Completion</span>
                                    <strong>{renderMetric(message.content.details.completion_tokens, formatNumber)}</strong>
                                  </div>
                                  <div className="talalm-chat-stat">
                                    <span>Total</span>
                                    <strong>{renderMetric(message.content.details.total_tokens, formatNumber)}</strong>
                                  </div>
                                  <div className="talalm-chat-stat">
                                    <span>Elapsed</span>
                                    <strong>{renderMetric(message.content.details.elapsed_seconds, formatSeconds)}</strong>
                                  </div>
                                  <div className="talalm-chat-stat">
                                    <span>Tokens/sec</span>
                                    <strong>{renderMetric(message.content.details.tokens_per_second, formatTokensPerSecond)}</strong>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {isInferring ? (
                      <div className="talalm-chat-row talalm-chat-row-connector">
                        <div className="talalm-chat-meta">Notebook</div>
                        <div className="talalm-chat-bubble talalm-chat-bubble-loading">
                          <span className="talalm-chat-loader" aria-label="Thinking" role="status">
                            <span />
                            <span />
                            <span />
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {chatError ? (
                    <div className="alert alert-danger mt-3 mb-0">
                      {chatError}
                    </div>
                  ) : null}

                  <form className="talalm-chat-composer mt-3" onSubmit={handlePromptSubmit}>
                    <div className="talalm-chat-retrieval">
                      <div className="talalm-range-control">
                        <div className="d-flex align-items-center justify-content-between gap-3">
                          <label className="form-label mb-0" htmlFor="notebook-retrieval-k">
                            Context chunks
                          </label>
                          <input
                            className="form-control form-control-sm talalm-range-value"
                            disabled={isInferring}
                            max={RETRIEVAL_K_MAX}
                            min={RETRIEVAL_K_MIN}
                            onBlur={() => {
                              setRetrievalK(String(normalizedRetrievalK(retrievalK)));
                            }}
                            onChange={(event) => {
                              setRetrievalK(event.target.value);
                            }}
                            step="1"
                            type="number"
                            value={retrievalK}
                          />
                        </div>
                        <input
                          className="form-range"
                          disabled={isInferring}
                          id="notebook-retrieval-k"
                          max={RETRIEVAL_K_MAX}
                          min={RETRIEVAL_K_MIN}
                          onChange={(event) => {
                            setRetrievalK(event.target.value);
                          }}
                          step="1"
                          type="range"
                          value={normalizedRetrievalK(retrievalK)}
                        />
                        <div className="talalm-range-bounds">
                          <span>Min {RETRIEVAL_K_MIN.toLocaleString()}</span>
                          <span>Default {RETRIEVAL_K_DEFAULT.toLocaleString()}</span>
                          <span>Max {RETRIEVAL_K_MAX.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <textarea
                      className="form-control"
                      disabled={isInferring}
                      onChange={(event) => {
                        setPrompt(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
                          handlePromptSubmit(event);
                        }
                      }}
                      placeholder="Write a prompt"
                      rows="3"
                      value={prompt}
                    />
                    <button className="btn btn-primary talalm-chat-send-button d-inline-flex align-items-center gap-2" disabled={isInferring || !prompt.trim()} type="submit">
                      <FontAwesomeIcon icon={faPaperPlane} />
                      <span>{isInferring ? "Sending..." : "Send"}</span>
                    </button>
                  </form>
            </div>
          </AdminContent>
        </div>
      </div>

      <Modal
        show={showConfigModal}
        onHide={() => {
          setShowConfigModal(false);
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Notebook Config
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-12">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">System Prompt</div>
                <div className="talalm-detail-value text-break">{renderValue(notebook.system_prompt)}</div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Code</div>
                <div className="talalm-detail-value">{renderValue(notebook.connector?.code)}</div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Name</div>
                <div className="talalm-detail-value">{renderValue(notebook.connector?.name)}</div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Connection Type</div>
                <div className="talalm-detail-value">
                  {CONNECTION_TYPES[notebook.connector?.connection_type] || renderValue(notebook.connector?.connection_type)}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Embedding Name</div>
                <div className="talalm-detail-value">{renderValue(notebook.connector?.embedding_name)}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Local File Path</div>
                <div className="talalm-detail-value text-break">{renderValue(notebook.connector?.local_file_path)}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Embedding Local File Path</div>
                <div className="talalm-detail-value text-break">{renderValue(notebook.connector?.embedding_local_file_path)}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="talalm-detail-block">
                <div className="talalm-label mb-1">Data</div>
                <pre className="talalm-json-block"><code>{JSON.stringify(notebook.connector?.data || {}, null, 2)}</code></pre>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="d-inline-flex align-items-center gap-2"
            disabled={!notebook.connector?.id}
            onClick={() => {
              navigate(`/connectors/${notebook.connector.id}`);
            }}
            type="button"
            variant="primary"
          >
            <FontAwesomeIcon icon={faPlug} />
            <span>Go to Connector</span>
          </Button>
          <Button
            className="d-inline-flex align-items-center gap-2"
            onClick={() => {
              setShowConfigModal(false);
            }}
            type="button"
            variant="secondary"
          >
            <FontAwesomeIcon icon={faXmark} />
            <span>Close</span>
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        backdrop={isUploadingFile ? "static" : true}
        keyboard={!isUploadingFile}
        show={showFileModal}
        onHide={closeFileModal}
      >
        <form onSubmit={handleCreateNotebookFile}>
          <Modal.Header closeButton={!isUploadingFile}>
            <Modal.Title>New File</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row g-3">
              {notebookFileErrorMessage ? (
                <div className="col-12">
                  <div className="alert alert-danger mb-0">
                    {notebookFileErrorMessage}
                  </div>
                </div>
              ) : null}

              {isUploadingFile ? (
                <div className="col-12">
                  <div className="alert alert-info d-flex align-items-center gap-2 mb-0" role="status">
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    <span>Uploading file to notebook...</span>
                  </div>
                </div>
              ) : null}

              <div className="col-12">
                <label className="form-label" htmlFor="notebook-file-name">
                  Name
                </label>
                <input
                  className={getInputClassName(notebookFileErrors, "name")}
                  disabled={isUploadingFile}
                  id="notebook-file-name"
                  name="name"
                  onChange={handleNotebookFileFormChange}
                  value={notebookFileForm.name}
                />
                {renderInputErrors(notebookFileErrors, "name")}
              </div>

              <div className="col-12">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <label className="form-label" htmlFor="notebook-file-upload">
                    File
                  </label>
                  <span className="form-text mt-0">Max 5 MB</span>
                </div>
                <input
                  accept=".docx,.xlsx,.txt,.pdf,.pptx"
                  className={getInputClassName(notebookFileErrors, "file")}
                  disabled={isUploadingFile}
                  id="notebook-file-upload"
                  onChange={handleNotebookFileChange}
                  type="file"
                />
                {renderInputErrors(notebookFileErrors, "file")}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="d-inline-flex align-items-center gap-2"
              disabled={isUploadingFile || !notebookFileForm.name.trim() || !notebookFileForm.file}
              type="submit"
              variant="primary"
            >
              {isUploadingFile ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              ) : (
                <FontAwesomeIcon icon={faPlus} />
              )}
              <span>{isUploadingFile ? "Uploading..." : "Create File"}</span>
            </Button>
            <Button
              className="d-inline-flex align-items-center gap-2"
              disabled={isUploadingFile}
              onClick={closeFileModal}
              type="button"
              variant="secondary"
            >
              <FontAwesomeIcon icon={faXmark} />
              <span>Close</span>
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ConfirmationModal
        show={showDeleteFileModal}
        isLoading={isDeletingFile}
        header="Delete File"
        content={`Delete ${selectedNotebookFile?.name || "this file"}? This will delete the file and its embeddings.`}
        loadingContent="Deleting file and associated assets..."
        onPrimaryClicked={handleDeleteFile}
        onSecondaryClicked={closeDeleteFileModal}
      />

      <ConfirmationModal
        show={showDeleteModal}
        isLoading={isDeleting}
        header="Delete Notebook"
        content={`Delete ${notebook.title}? This will delete the notebook and all associated assets.`}
        onPrimaryClicked={handleDelete}
        onSecondaryClicked={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
          }
        }}
      />
    </div>
  );
};

export default NotebooksShow;
