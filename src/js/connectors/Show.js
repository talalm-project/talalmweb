import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircleInfo, faCloudArrowUp, faDiagramProject, faFlask, faPaperPlane, faPenToSquare, faServer } from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { destroySession } from "../services/AuthService";
import ConnectorService from "../services/ConnectorService";

const CONNECTION_TYPES = {
  local: "Local",
  "openai": "OpenAI"
};

const renderValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted">Not configured</span>;
  }

  return value;
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

const renderEmbeddingError = (payload) => {
  if (!payload) {
    return "";
  }

  if (payload.message) {
    return payload.message;
  }

  if (typeof payload === "string") {
    return payload;
  }

  return Object.entries(payload).map(([field, messages]) => {
    return `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`;
  }).join("; ");
};

const ConnectorsShow = () => {
  const [connector, setConnector] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [chatError, setChatError] = useState("");
  const [isInferring, setIsInferring] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [embeddingFile, setEmbeddingFile] = useState(null);
  const [isEmbeddingDragActive, setIsEmbeddingDragActive] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingError, setEmbeddingError] = useState("");
  const [embeddingRecords, setEmbeddingRecords] = useState([]);
  const chatLogRef = useRef(null);
  const embeddingFileInputRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const loadConnector = () => {
    setIsLoading(true);

    ConnectorService.fetchConnector(id)
      .then((response) => {
        setConnector(response.data);
        setErrorMessage("");
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          destroySession();
          navigate("/login");
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load connector.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadConnector();
  }, [id]);

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

  const handlePromptSubmit = (event) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isInferring || !connector) {
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

    ConnectorService.inferConnector(connector.id, { input: messages })
      .then((response) => {
        setChatMessages((currentMessages) => {
          return [
            ...currentMessages,
            {
              role: "connector",
              content: response.data
            }
          ];
        });
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setChatError(error.response?.data?.message || "Unable to test connector.");
      })
      .finally(() => {
        setIsInferring(false);
      });
  };

  const handleEmbeddingFileChange = (event) => {
    setEmbeddingFile(event.target.files?.[0] || null);
    setEmbeddingError("");
  };

  const handleEmbeddingDragOver = (event) => {
    event.preventDefault();
    if (isGeneratingEmbeddings) {
      return;
    }

    setIsEmbeddingDragActive(true);
  };

  const handleEmbeddingDragLeave = (event) => {
    event.preventDefault();
    setIsEmbeddingDragActive(false);
  };

  const handleEmbeddingDrop = (event) => {
    event.preventDefault();
    if (isGeneratingEmbeddings) {
      return;
    }

    setIsEmbeddingDragActive(false);
    setEmbeddingFile(event.dataTransfer.files?.[0] || null);
    setEmbeddingError("");
  };

  const handleGenerateEmbeddings = (event) => {
    event.preventDefault();
    if (!embeddingFile || isGeneratingEmbeddings || !connector) {
      return;
    }

    setIsGeneratingEmbeddings(true);
    setEmbeddingError("");
    setEmbeddingRecords([]);

    ConnectorService.generateEmbeddings(connector.id, embeddingFile)
      .then((response) => {
        setEmbeddingRecords(response.data.records || []);
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setEmbeddingError(renderEmbeddingError(error.response?.data) || "Unable to generate embeddings.");
      })
      .finally(() => {
        setIsGeneratingEmbeddings(false);
      });
  };

  const headerActions = [
    <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" key="back-connectors" to="/connectors">
      <FontAwesomeIcon icon={faArrowLeft} />
      <span>Back to Connectors</span>
    </Link>
  ];

  if (connector) {
    headerActions.push(
      <Link className="btn btn-primary d-inline-flex align-items-center gap-2" key="edit-connector" to={`/connectors/${id}/edit`}>
        <FontAwesomeIcon icon={faPenToSquare} />
        <span>Edit Connector</span>
      </Link>
    );
  }

  return (
    <div className="talalm-connector-show d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Models"
        title="Connector details"
        actions={headerActions}
      />

      <AdminContent
        title={(
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faServer} />
            <span>{connector?.name || "Connector"}</span>
          </div>
        )}
      >
        {isLoading ? (
          <Loader />
        ) : (
          <React.Fragment>
            {errorMessage ? (
              <div className="alert alert-danger">
                {errorMessage}
              </div>
            ) : null}

            {connector ? (
              <React.Fragment>
                <div className="talalm-tabs" role="tablist" aria-label="Connector sections">
                  <button
                    aria-controls="connector-details-panel"
                    aria-selected={activeTab === "details"}
                    className={`talalm-tab ${activeTab === "details" ? "active" : ""}`}
                    id="connector-details-tab"
                    onClick={() => {
                      setActiveTab("details");
                    }}
                    role="tab"
                    type="button"
                  >
                    <FontAwesomeIcon icon={faCircleInfo} />
                    <span>Details</span>
                  </button>
                  <button
                    aria-controls="connector-test-panel"
                    aria-selected={activeTab === "test"}
                    className={`talalm-tab ${activeTab === "test" ? "active" : ""}`}
                    id="connector-test-tab"
                    onClick={() => {
                      setActiveTab("test");
                    }}
                    role="tab"
                    type="button"
                  >
                    <FontAwesomeIcon icon={faFlask} />
                    <span>Test Inference</span>
                  </button>
                  <button
                    aria-controls="connector-embeddings-panel"
                    aria-selected={activeTab === "embeddings"}
                    className={`talalm-tab ${activeTab === "embeddings" ? "active" : ""}`}
                    id="connector-embeddings-tab"
                    onClick={() => {
                      setActiveTab("embeddings");
                    }}
                    role="tab"
                    type="button"
                  >
                    <FontAwesomeIcon icon={faDiagramProject} />
                    <span>Test Embeddings</span>
                  </button>
                </div>

                <div className="talalm-tab-content">
                  <div
                    aria-labelledby="connector-details-tab"
                    className={`talalm-tab-panel ${activeTab === "details" ? "" : "d-none"}`}
                    id="connector-details-panel"
                    role="tabpanel"
                  >
                    <div className="row g-3">
                      <div className="col-12">
                        <div className="talalm-detail-block">
                          <div className="talalm-label mb-1">Code</div>
                          <div className="talalm-detail-value">{renderValue(connector.code)}</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="talalm-detail-block">
                          <div className="talalm-label mb-1">Name</div>
                          <div className="talalm-detail-value">{renderValue(connector.name)}</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="talalm-detail-block">
                          <div className="talalm-label mb-1">Connection Type</div>
                          <div className="talalm-detail-value">{CONNECTION_TYPES[connector.connection_type] || connector.connection_type}</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="talalm-detail-block">
                          <div className="talalm-label mb-1">Local File Path</div>
                          <div className="talalm-detail-value text-break">{renderValue(connector.local_file_path)}</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="talalm-detail-block">
                          <div className="talalm-label mb-1">Embedding Name</div>
                          <div className="talalm-detail-value">{renderValue(connector.embedding_name)}</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="talalm-detail-block">
                          <div className="talalm-label mb-1">Embedding Local File Path</div>
                          <div className="talalm-detail-value text-break">{renderValue(connector.embedding_local_file_path)}</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="talalm-detail-block">
                          <div className="talalm-label mb-1">Data</div>
                          <pre className="talalm-json-block"><code>{JSON.stringify(connector.data || {}, null, 2)}</code></pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    aria-labelledby="connector-test-tab"
                    className={`talalm-tab-panel ${activeTab === "test" ? "" : "d-none"}`}
                    id="connector-test-panel"
                    role="tabpanel"
                  >
                    <div className="talalm-chat-panel">
                      <div className="talalm-chat-log" ref={chatLogRef}>
                        {chatMessages.length === 0 ? (
                          <div className="talalm-chat-empty text-muted">
                            Send a prompt to test this connector.
                          </div>
                        ) : (
                          chatMessages.map((message, index) => {
                            const isUser = message.role === "user";

                            return (
                              <div className={`talalm-chat-row ${isUser ? "talalm-chat-row-user" : "talalm-chat-row-connector"}`} key={`chat-message-${index}`}>
                                <div className="talalm-chat-meta">
                                  {isUser ? "You" : "Connector"}
                                </div>
                                <div className="talalm-chat-bubble">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {renderResponse(message.content)}
                                  </ReactMarkdown>
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
                            <div className="talalm-chat-meta">Connector</div>
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
                        <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={isInferring || !prompt.trim()} type="submit">
                          <FontAwesomeIcon icon={faPaperPlane} />
                          <span>{isInferring ? "Sending..." : "Send"}</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  <div
                    aria-labelledby="connector-embeddings-tab"
                    className={`talalm-tab-panel ${activeTab === "embeddings" ? "" : "d-none"}`}
                    id="connector-embeddings-panel"
                    role="tabpanel"
                  >
                    <form className="talalm-embeddings-panel" onSubmit={handleGenerateEmbeddings}>
                      <label className="form-label" htmlFor="connector-embedding-file">
                        Upload file
                      </label>
                      <button
                        className={`talalm-file-dropzone ${isEmbeddingDragActive ? "active" : ""}`}
                        disabled={isGeneratingEmbeddings}
                        onClick={() => {
                          embeddingFileInputRef.current?.click();
                        }}
                        onDragLeave={handleEmbeddingDragLeave}
                        onDragOver={handleEmbeddingDragOver}
                        onDrop={handleEmbeddingDrop}
                        type="button"
                      >
                        <FontAwesomeIcon icon={faCloudArrowUp} />
                        <span>{isGeneratingEmbeddings ? "Uploading file and generating embeddings..." : embeddingFile ? embeddingFile.name : "Drop file here or choose a file"}</span>
                      </button>
                      <input
                        accept=".txt,.pptx,.docx,.xlsx,.pdf"
                        className="d-none"
                        disabled={isGeneratingEmbeddings}
                        id="connector-embedding-file"
                        onChange={handleEmbeddingFileChange}
                        ref={embeddingFileInputRef}
                        type="file"
                      />
                      {isGeneratingEmbeddings ? (
                        <div className="alert alert-info d-flex align-items-center gap-2 mb-0" role="status">
                          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                          <span>Uploading file and generating embeddings...</span>
                        </div>
                      ) : null}
                      {embeddingError ? (
                        <div className="alert alert-danger mb-0">
                          {embeddingError}
                        </div>
                      ) : null}
                      <div className="d-flex justify-content-end">
                        <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={!embeddingFile || isGeneratingEmbeddings} type="submit">
                          <FontAwesomeIcon icon={faDiagramProject} />
                          <span>{isGeneratingEmbeddings ? "Generating..." : "Generate Embeddings"}</span>
                        </button>
                      </div>
                      {embeddingRecords.length > 0 ? (
                        <div className="talalm-embedding-results">
                          {embeddingRecords.map((record, index) => {
                            const metadata = record.metadata || {};
                            const embedding = record.embedding || [];

                            return (
                              <div className="talalm-embedding-record" key={`${metadata.chunk_index || index}-${metadata.source_name || "embedding"}`}>
                                <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                                  <div>
                                    <div className="talalm-label mb-1">Chunk</div>
                                    <div className="talalm-detail-value">{metadata.chunk_index ?? index}</div>
                                  </div>
                                  <div>
                                    <div className="talalm-label mb-1">Dimensions</div>
                                    <div className="talalm-detail-value">{Array.isArray(embedding) ? embedding.length : "n/a"}</div>
                                  </div>
                                  <div>
                                    <div className="talalm-label mb-1">Model</div>
                                    <div className="talalm-detail-value">{renderValue(metadata.model)}</div>
                                  </div>
                                </div>
                                <div className="talalm-label mb-1">Text</div>
                                <div className="talalm-embedding-text">{record.text}</div>
                                <div className="talalm-label mt-3 mb-1">Embedding</div>
                                <pre className="talalm-embedding-vector">{JSON.stringify(embedding, null, 2)}</pre>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </form>
                  </div>
                </div>
              </React.Fragment>
            ) : null}
          </React.Fragment>
        )}
      </AdminContent>
    </div>
  );
};

export default ConnectorsShow;
