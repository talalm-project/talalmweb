import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPaperPlane, faPenToSquare, faServer } from "@fortawesome/free-solid-svg-icons";
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

const ConnectorsShow = () => {
  const [connector, setConnector] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [chatError, setChatError] = useState("");
  const [isInferring, setIsInferring] = useState(false);
  const chatLogRef = useRef(null);
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
    <div className="d-flex flex-column gap-4">
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
                    <div className="talalm-label mb-1">Data</div>
                    <code>{JSON.stringify(connector.data || {})}</code>
                  </div>
                </div>
              </div>
            ) : null}
          </React.Fragment>
        )}
      </AdminContent>

      {connector ? (
        <AdminContent title="Test Connector">
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
                        <ReactMarkdown>
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
                            <div className="talalm-chat-stat">
                              <span>Finish</span>
                              <strong>{renderMetric(message.content.details.finish_reason)}</strong>
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
                  if (event.key === "Enter" && !event.shiftKey) {
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
        </AdminContent>
      ) : null}
    </div>
  );
};

export default ConnectorsShow;
