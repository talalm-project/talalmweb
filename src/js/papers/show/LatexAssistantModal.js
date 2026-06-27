import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCheck,
  faCopy,
  faFileLines,
  faNoteSticky,
  faPaperPlane,
  faRotateLeft,
  faWandMagicSparkles,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import Loader from "../../commons/Loader";
import { statusToLabel } from "../../helpers/AppHelper";
import { formatByteSize } from "../../notebooks/show/helpers";
import NotebookService from "../../services/NotebookService";
import PaperService from "../../services/PaperService";

const LatexAssistantModal = ({ onAuthError, paperId, show, onClose }) => {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState("");
  const [notebookFiles, setNotebookFiles] = useState([]);
  const [notebookNotes, setNotebookNotes] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(false);
  const [isLoadingNotebookContext, setIsLoadingNotebookContext] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const selectedNotebook = useMemo(() => {
    return notebooks.find((notebook) => notebook.id === selectedNotebookId) || null;
  }, [notebooks, selectedNotebookId]);

  useEffect(() => {
    if (!show) {
      return undefined;
    }

    let isCurrent = true;
    setIsLoadingNotebooks(true);
    setErrorMessage("");
    setCopyMessage("");

    loadAllNotebooks()
      .then((records) => {
        if (!isCurrent) {
          return;
        }

        setNotebooks(records);
        setSelectedNotebookId((currentId) => {
          return records.some((notebook) => notebook.id === currentId) ? currentId : records[0]?.id || "";
        });
      })
      .catch((error) => {
        if (onAuthError(error)) {
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load notebooks.");
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingNotebooks(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [show]);

  useEffect(() => {
    if (!show || !selectedNotebookId) {
      setNotebookFiles([]);
      setNotebookNotes([]);
      setSelectedFileIds([]);
      setSelectedNoteIds([]);
      return undefined;
    }

    let isCurrent = true;
    setIsLoadingNotebookContext(true);
    setErrorMessage("");
    setCopyMessage("");
    setChatMessages([]);
    setSelectedFileIds([]);
    setSelectedNoteIds([]);

    Promise.all([
      NotebookService.fetchNotebookFiles(selectedNotebookId),
      NotebookService.fetchNotebookNotes(selectedNotebookId)
    ])
      .then(([filesResponse, notesResponse]) => {
        if (!isCurrent) {
          return;
        }

        setNotebookFiles(filesResponse.data.records || []);
        setNotebookNotes(notesResponse.data.records || []);
      })
      .catch((error) => {
        if (onAuthError(error)) {
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load notebook files and notes.");
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingNotebookContext(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [show, selectedNotebookId]);

  const handleClose = () => {
    if (isGenerating) {
      return;
    }

    onClose();
  };

  const toggleFile = (fileId) => {
    setSelectedFileIds((currentIds) => toggleId(currentIds, fileId));
  };

  const toggleNote = (noteId) => {
    setSelectedNoteIds((currentIds) => toggleId(currentIds, noteId));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || !selectedNotebook) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedPrompt
    };

    setIsGenerating(true);
    setErrorMessage("");
    setCopyMessage("");
    setChatMessages((currentMessages) => [...currentMessages, userMessage]);

    PaperService.runLatexSupportInference(paperId, {
      user_prompt: promptWithSessionHistory(trimmedPrompt, chatMessages),
      connector_id: selectedNotebook.connector_id,
      notebook_id: selectedNotebook.id,
      notebook_file_ids: selectedFileIds,
      notebook_note_ids: selectedNoteIds
    })
      .then((response) => {
        const content = response.data.content || "";
        const message = response.data.message || "";
        setPrompt("");
        setChatMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content,
            message
          }
        ]);
      })
      .catch((error) => {
        if (onAuthError(error)) {
          return;
        }

        const errors = error.response?.data || {};
        setErrorMessage(errorMessageFor(errors) || "Unable to generate LaTeX.");
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl" dialogClassName="talalm-latex-assistant-modal">
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton={!isGenerating}>
          <Modal.Title className="d-inline-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            <span>LaTeX Assistant</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="talalm-latex-assistant">
            {errorMessage ? (
              <div className="alert alert-danger mb-0" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <div className="talalm-latex-assistant-section">
              <label className="form-label" htmlFor="paper-latex-assistant-notebook">
                Notebook
              </label>
              {isLoadingNotebooks ? (
                <Loader />
              ) : (
                <div className="input-group">
                  <span className="input-group-text">
                    <FontAwesomeIcon icon={faBook} />
                  </span>
                  <select
                    className="form-select"
                    disabled={isGenerating || notebooks.length === 0}
                    id="paper-latex-assistant-notebook"
                    onChange={(event) => setSelectedNotebookId(event.target.value)}
                    value={selectedNotebookId}
                  >
                    {notebooks.length === 0 ? (
                      <option value="">No notebooks available</option>
                    ) : null}
                    {notebooks.map((notebook) => (
                      <option key={notebook.id} value={notebook.id}>
                        {notebook.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedNotebookId ? (
              <div className="talalm-latex-assistant-grid">
                <ReferenceList
                  emptyIcon={faFileLines}
                  emptyText="No notebook files."
                  isLoading={isLoadingNotebookContext}
                  items={notebookFiles}
                  selectedIds={selectedFileIds}
                  title="Files"
                  type="file"
                  onToggle={toggleFile}
                />
                <ReferenceList
                  emptyIcon={faNoteSticky}
                  emptyText="No notebook notes."
                  isLoading={isLoadingNotebookContext}
                  items={notebookNotes}
                  selectedIds={selectedNoteIds}
                  title="Notes"
                  type="note"
                  onToggle={toggleNote}
                />
              </div>
            ) : null}

            {chatMessages.length > 0 ? (
              <div className="talalm-latex-assistant-section">
                <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                  <div className="talalm-label">Session</div>
                  <button
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                    disabled={isGenerating}
                    onClick={() => {
                      setChatMessages([]);
                      setCopyMessage("");
                    }}
                    type="button"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="talalm-latex-chat-history">
                  {chatMessages.map((message) => (
                    <ChatMessage
                      copyMessage={copyMessage}
                      key={message.id}
                      message={message}
                      onCopy={(value) => {
                        copyText(value)
                          .then(() => {
                            setCopyMessage("Copied.");
                          })
                          .catch(() => {
                            setCopyMessage("Unable to copy.");
                          });
                      }}
                    />
                  ))}
                  {isGenerating ? (
                    <div className="talalm-latex-chat-message talalm-latex-chat-message-assistant">
                      <div className="talalm-latex-chat-meta">Assistant</div>
                      <div className="text-muted">Generating...</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="talalm-latex-assistant-section">
              <label className="form-label" htmlFor="paper-latex-assistant-prompt">
                Prompt
              </label>
              <textarea
                className="form-control"
                disabled={isGenerating || !selectedNotebookId}
                id="paper-latex-assistant-prompt"
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
                    handleSubmit(event);
                  }
                }}
                placeholder="Describe the LaTeX you need"
                rows="4"
                value={prompt}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="d-inline-flex align-items-center gap-2"
            disabled={isGenerating || !selectedNotebookId || !prompt.trim()}
            type="submit"
            variant="primary"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
            <span>{isGenerating ? "Generating..." : "Generate"}</span>
          </Button>
          <Button
            className="d-inline-flex align-items-center gap-2"
            disabled={isGenerating}
            onClick={handleClose}
            type="button"
            variant="secondary"
          >
            <FontAwesomeIcon icon={faXmark} />
            <span>Close</span>
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

const ChatMessage = ({ copyMessage, message, onCopy }) => {
  const isAssistant = message.role === "assistant";
  return (
    <div className={`talalm-latex-chat-message ${isAssistant ? "talalm-latex-chat-message-assistant" : "talalm-latex-chat-message-user"}`}>
      <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
        <div className="talalm-latex-chat-meta">{isAssistant ? "Assistant" : "You"}</div>
        {isAssistant && message.content ? (
          <button
            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
            onClick={() => onCopy(message.content)}
            type="button"
          >
            <FontAwesomeIcon icon={copyMessage === "Copied." ? faCheck : faCopy} />
            <span>Copy</span>
          </button>
        ) : null}
      </div>
      {isAssistant ? (
        <pre className="talalm-latex-assistant-output mb-0">
          <code>{message.content || message.message}</code>
        </pre>
      ) : (
        <div className="talalm-latex-chat-prompt text-break">{message.content}</div>
      )}
    </div>
  );
};

const ReferenceList = ({ emptyIcon, emptyText, isLoading, items, onToggle, selectedIds, title, type }) => {
  return (
    <div className="talalm-latex-assistant-section">
      <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
        <div className="talalm-label">{title}</div>
        <span className="badge text-bg-secondary">{selectedIds.length} selected</span>
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <div className="talalm-latex-reference-list">
          {items.length === 0 ? (
            <div className="talalm-empty-state">
              <FontAwesomeIcon icon={emptyIcon} />
              <span>{emptyText}</span>
            </div>
          ) : null}

          {items.map((item) => {
            const isFailedFile = type === "file" && item.status === "failed";
            const isSelected = selectedIds.includes(item.id);
            return (
              <div className="talalm-latex-reference-item" key={item.id}>
                <div className="min-w-0">
                  <div className="fw-semibold text-break">{labelFor(item, type)}</div>
                  <div className="small text-muted text-break">{detailFor(item, type)}</div>
                  {type === "file" ? (
                    <div className="mt-1">{statusToLabel(item.status)}</div>
                  ) : null}
                </div>
                <div className="form-check form-switch m-0">
                  <input
                    aria-label={`${isSelected ? "Disable" : "Enable"} ${labelFor(item, type)}`}
                    checked={isSelected}
                    className="form-check-input"
                    disabled={isFailedFile}
                    onChange={() => onToggle(item.id)}
                    type="checkbox"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const loadAllNotebooks = async () => {
  const firstResponse = await NotebookService.fetchNotebooks({ page: 1 });
  const firstRecords = firstResponse.data.records || [];
  const totalPages = firstResponse.data.total_pages || 1;
  if (totalPages <= 1) {
    return firstRecords;
  }

  const restResponses = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_entry, index) => {
      return NotebookService.fetchNotebooks({ page: index + 2 });
    })
  );

  return restResponses.reduce((records, response) => {
    return [...records, ...(response.data.records || [])];
  }, firstRecords);
};

const toggleId = (ids, id) => {
  if (ids.includes(id)) {
    return ids.filter((currentId) => currentId !== id);
  }

  return [...ids, id];
};

const labelFor = (item, type) => {
  if (type === "note") {
    return item.name || "Notebook note";
  }

  return item.name || item.filename || "Notebook file";
};

const detailFor = (item, type) => {
  if (type === "note") {
    return noteSummary(item.data);
  }

  return [
    item.filename,
    formatByteSize(item.byte_size),
    item.content_type
  ].filter(Boolean).join(" · ");
};

const noteSummary = (data) => {
  if (!data) {
    return "No note content.";
  }
  if (typeof data === "string") {
    return data;
  }
  if (typeof data.content === "string") {
    return data.content;
  }
  if (typeof data.text === "string") {
    return data.text;
  }
  if (Array.isArray(data.blocks)) {
    return `${data.blocks.length} note blocks`;
  }

  return "Structured note";
};

const errorMessageFor = (errors) => {
  if (typeof errors.message === "string") {
    return errors.message;
  }

  return Object.entries(errors)
    .flatMap(([field, messages]) => {
      if (!Array.isArray(messages)) {
        return [];
      }

      return messages.map((message) => `${field}: ${message}`);
    })
    .join(", ");
};

const promptWithSessionHistory = (prompt, messages) => {
  const history = messages
    .filter((message) => message.content)
    .map((message) => {
      if (message.role === "assistant") {
        return `Assistant LaTeX:\n\\begin{verbatim}\n${message.content}\n\\end{verbatim}`;
      }

      return `User request:\n${message.content}`;
    });

  if (history.length === 0) {
    return prompt;
  }

  return [
    "Use the session history below to answer this follow-up. Return the complete revised LaTeX snippet, not a diff.",
    ...history,
    `Current user request:\n${prompt}`,
  ].join("\n\n");
};

const copyText = (value) => {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }

  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export default LatexAssistantModal;
