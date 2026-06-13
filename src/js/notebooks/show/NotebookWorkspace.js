import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faFileLines,
  faFloppyDisk,
  faNoteSticky,
  faPaperPlane,
  faPlug,
  faSliders,
  faTrash,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../../commons/AdminContent";
import Loader from "../../commons/Loader";
import {
  RETRIEVAL_K_DEFAULT,
  RETRIEVAL_K_MAX,
  RETRIEVAL_K_MIN,
  formatNumber,
  formatSeconds,
  formatTokensPerSecond,
  normalizedRetrievalK,
  renderMetric,
  renderNotebookNoteData,
  renderResponse,
  renderValue
} from "./helpers";

const renderSources = (sources = [], onDownloadSource, downloadingFileIds = []) => {
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
          const isDownloading = downloadingFileIds.includes(source.id);

          return (
            <button
              className="talalm-chat-source"
              disabled={isDownloading || !source.id}
              key={`notebook-source-${source.id}`}
              onClick={() => {
                onDownloadSource(source);
              }}
              type="button"
            >
              <FontAwesomeIcon icon={faFileLines} />
              <span className="min-w-0">
                <span className="talalm-chat-source-name text-break">{isDownloading ? "Downloading..." : label}</span>
                {detail ? (
                  <span className="talalm-chat-source-meta text-break">{detail}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const NotebookWorkspace = ({
  notebook,
  activeNotebookTab,
  activateNotebookTab,
  chatMessages,
  chatError,
  chatLogRef,
  isInferring,
  prompt,
  promptContextUsage,
  retrievalK,
  manualRetrieval,
  manualRetrievalFileIds,
  notebookFiles,
  setPrompt,
  setRetrievalK,
  setManualRetrieval,
  setManualRetrievalFileIds,
  handlePromptSubmit,
  openSaveNoteModal,
  setShowClearChatModal,
  notebookNotes,
  selectedNotebookNote,
  setSelectedNotebookNote,
  isNotesLoading,
  notesErrorMessage,
  togglingNoteIds,
  handleToggleNotebookNoteContext,
  openDeleteNoteModal,
  downloadingFileIds,
  onDownloadFile,
  navigate
}) => {
  return (
    <AdminContent
      title="Notebook"
      headerActions={[
        activeNotebookTab === "chat" ? (
          <button
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
            disabled={isInferring || (chatMessages.length === 0 && !prompt.trim())}
            key="clear-chat"
            onClick={() => {
              setShowClearChatModal(true);
            }}
            type="button"
          >
            <FontAwesomeIcon icon={faXmark} />
            <span>Clear</span>
          </button>
        ) : null
      ]}
    >
      <div className="talalm-notebook-workspace">
        <NotebookTabs activeNotebookTab={activeNotebookTab} activateNotebookTab={activateNotebookTab} />

        {activeNotebookTab === "chat" ? (
          <ChatPanel
            chatMessages={chatMessages}
            chatError={chatError}
            chatLogRef={chatLogRef}
            downloadingFileIds={downloadingFileIds}
            isInferring={isInferring}
            prompt={prompt}
            promptContextUsage={promptContextUsage}
            retrievalK={retrievalK}
            manualRetrieval={manualRetrieval}
            manualRetrievalFileIds={manualRetrievalFileIds}
            notebookFiles={notebookFiles}
            setPrompt={setPrompt}
            setRetrievalK={setRetrievalK}
            setManualRetrieval={setManualRetrieval}
            setManualRetrievalFileIds={setManualRetrievalFileIds}
            handlePromptSubmit={handlePromptSubmit}
            onDownloadFile={onDownloadFile}
            openSaveNoteModal={openSaveNoteModal}
          />
        ) : activeNotebookTab === "notes" ? (
          <NotesPanel
            notebookNotes={notebookNotes}
            selectedNotebookNote={selectedNotebookNote}
            setSelectedNotebookNote={setSelectedNotebookNote}
            isNotesLoading={isNotesLoading}
            notesErrorMessage={notesErrorMessage}
            togglingNoteIds={togglingNoteIds}
            handleToggleNotebookNoteContext={handleToggleNotebookNoteContext}
            openDeleteNoteModal={openDeleteNoteModal}
          />
        ) : (
          <ConfigPanel notebook={notebook} navigate={navigate} />
        )}
      </div>
    </AdminContent>
  );
};

const NotebookTabs = ({ activeNotebookTab, activateNotebookTab }) => {
  return (
    <div className="talalm-notebook-tabs" role="tablist" aria-label="Notebook sections">
      {[
        ["chat", faComments, "Chat"],
        ["notes", faNoteSticky, "Notes"],
        ["config", faSliders, "Config"]
      ].map(([tabKey, icon, label]) => {
        return (
          <button
            aria-selected={activeNotebookTab === tabKey}
            className={`talalm-notebook-tab${activeNotebookTab === tabKey ? " is-active" : ""}`}
            key={tabKey}
            onClick={() => {
              activateNotebookTab(tabKey);
            }}
            role="tab"
            type="button"
          >
            <FontAwesomeIcon icon={icon} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

const ChatPanel = ({
  chatMessages,
  chatError,
  chatLogRef,
  downloadingFileIds,
  isInferring,
  prompt,
  promptContextUsage,
  retrievalK,
  manualRetrieval,
  manualRetrievalFileIds,
  notebookFiles,
  setPrompt,
  setRetrievalK,
  setManualRetrieval,
  setManualRetrievalFileIds,
  handlePromptSubmit,
  onDownloadFile,
  openSaveNoteModal
}) => {
  const availableFiles = Array.isArray(notebookFiles) ? notebookFiles.filter((notebookFile) => {
    return notebookFile.status !== "failed";
  }) : [];

  return (
    <div className="talalm-chat-panel" role="tabpanel">
      <div className="talalm-chat-log" ref={chatLogRef}>
        {chatMessages.length === 0 ? (
          <div className="talalm-chat-empty text-muted">
            Send a prompt to chat with this notebook.
          </div>
        ) : (
          chatMessages.map((message, index) => {
            return (
              <ChatMessage
                downloadingFileIds={downloadingFileIds}
                key={`notebook-chat-message-${index}`}
                message={message}
                onDownloadFile={onDownloadFile}
                openSaveNoteModal={openSaveNoteModal}
              />
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
          <div className="form-check form-switch mb-3">
            <input
              checked={manualRetrieval}
              className="form-check-input"
              disabled={isInferring || availableFiles.length === 0}
              id="notebook-manual-retrieval"
              onChange={(event) => {
                setManualRetrieval(event.target.checked);
              }}
              type="checkbox"
            />
            <label className="form-check-label" htmlFor="notebook-manual-retrieval">
              Manual retrieval
            </label>
          </div>
          <div className="talalm-range-control">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <label className="form-label mb-0" htmlFor="notebook-retrieval-k">
                Context chunks
              </label>
              <input
                className="form-control form-control-sm talalm-range-value"
                disabled={isInferring || manualRetrieval}
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
              disabled={isInferring || manualRetrieval}
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
        <div className="talalm-chat-composer-footer">
          <div
            className={`talalm-context-meter talalm-context-meter-${promptContextUsage.level}`}
            title={`${promptContextUsage.remainingTokens.toLocaleString()} of ${promptContextUsage.contextWindow.toLocaleString()} context tokens left`}
          >
            {promptContextUsage.remainingPercent}% context left
          </div>
          <button className="btn btn-primary talalm-chat-send-button d-inline-flex align-items-center gap-2" disabled={isInferring || !prompt.trim()} type="submit">
            <FontAwesomeIcon icon={faPaperPlane} />
            <span>{isInferring ? "Sending..." : "Send"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

const ChatMessage = ({ message, downloadingFileIds, onDownloadFile, openSaveNoteModal }) => {
  const isUser = message.role === "user";

  return (
    <div className={`talalm-chat-row ${isUser ? "talalm-chat-row-user" : "talalm-chat-row-connector"}`}>
      <div className="talalm-chat-meta">
        {isUser ? "You" : "Notebook"}
      </div>
      <div className="talalm-chat-bubble">
        {!isUser ? (
          <div className="talalm-chat-bubble-actions">
            <button
              aria-label="Save response as note"
              className="btn btn-outline-secondary btn-sm talalm-icon-button"
              onClick={() => {
                openSaveNoteModal(message);
              }}
              title="Save response as note"
              type="button"
            >
              <FontAwesomeIcon icon={faFloppyDisk} />
            </button>
          </div>
        ) : null}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {renderResponse(message.content)}
        </ReactMarkdown>
        {!isUser ? renderSources(message.content?.sources, onDownloadFile, downloadingFileIds) : null}
        {!isUser && message.content?.details ? (
          <div className="talalm-chat-stats">
            <ChatStat label="Prompt" value={message.content.details.prompt_tokens} formatter={formatNumber} />
            <ChatStat label="Completion" value={message.content.details.completion_tokens} formatter={formatNumber} />
            <ChatStat label="Total" value={message.content.details.total_tokens} formatter={formatNumber} />
            <ChatStat label="Elapsed" value={message.content.details.elapsed_seconds} formatter={formatSeconds} />
            <ChatStat label="Tokens/sec" value={message.content.details.tokens_per_second} formatter={formatTokensPerSecond} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ChatStat = ({ label, value, formatter }) => {
  return (
    <div className="talalm-chat-stat">
      <span>{label}</span>
      <strong>{renderMetric(value, formatter)}</strong>
    </div>
  );
};

const NotesPanel = ({
  notebookNotes,
  selectedNotebookNote,
  setSelectedNotebookNote,
  isNotesLoading,
  notesErrorMessage,
  togglingNoteIds,
  handleToggleNotebookNoteContext,
  openDeleteNoteModal
}) => {
  return (
    <div className="talalm-notebook-notes-panel" role="tabpanel">
      {isNotesLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          {notesErrorMessage ? (
            <div className="alert alert-danger">
              {notesErrorMessage}
            </div>
          ) : null}

          {!notesErrorMessage && notebookNotes.length === 0 ? (
            <div className="talalm-empty-state">
              <FontAwesomeIcon icon={faNoteSticky} />
              <span>No notes.</span>
            </div>
          ) : null}

          {!notesErrorMessage && notebookNotes.length > 0 ? (
            <div className="talalm-notebook-notes-browser">
              <div className="talalm-notebook-note-list">
                {notebookNotes.map((notebookNote) => {
                  const isSelected = selectedNotebookNote?.id === notebookNote.id;
                  const isTogglingContext = togglingNoteIds.includes(notebookNote.id);

                  return (
                    <div className={`talalm-notebook-note-list-item${isSelected ? " is-active" : ""}`} key={notebookNote.id}>
                      <button
                        className="talalm-notebook-note-name-button"
                        onClick={() => {
                          setSelectedNotebookNote(notebookNote);
                        }}
                        type="button"
                      >
                        <span className="text-break">{notebookNote.name}</span>
                        {notebookNote.is_context ? (
                          <span className="talalm-notebook-note-context">Context</span>
                        ) : null}
                      </button>
                      <button
                        aria-checked={notebookNote.is_context === true}
                        aria-label={`${notebookNote.is_context ? "Remove" : "Add"} ${notebookNote.name} as context`}
                        className={`talalm-note-context-toggle${notebookNote.is_context ? " is-on" : ""}`}
                        disabled={isTogglingContext}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleNotebookNoteContext(notebookNote);
                        }}
                        role="switch"
                        title={notebookNote.is_context ? "Remove from context" : "Use as context"}
                        type="button"
                      >
                        <span />
                      </button>
                      <button
                        aria-label={`Delete ${notebookNote.name}`}
                        className="btn btn-outline-danger btn-sm talalm-icon-button"
                        disabled={isTogglingContext}
                        onClick={(event) => {
                          event.stopPropagation();
                          openDeleteNoteModal(notebookNote);
                        }}
                        title="Delete note"
                        type="button"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <article className="talalm-notebook-note">
                {selectedNotebookNote ? (
                  <React.Fragment>
                    <h2 className="talalm-notebook-note-title">{selectedNotebookNote.name}</h2>
                    <div className="talalm-notebook-note-body">
                      {renderNotebookNoteData(selectedNotebookNote.data)}
                    </div>
                  </React.Fragment>
                ) : (
                  <div className="talalm-empty-state">
                    <FontAwesomeIcon icon={faNoteSticky} />
                    <span>Select a note.</span>
                  </div>
                )}
              </article>
            </div>
          ) : null}
        </React.Fragment>
      )}
    </div>
  );
};

const ConfigPanel = ({ notebook, navigate }) => {
  return (
    <div className="talalm-notebook-config-panel" role="tabpanel">
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
        <div className="col-12">
          <button
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            disabled={!notebook.connector?.id}
            onClick={() => {
              navigate(`/connectors/${notebook.connector.id}`);
            }}
            type="button"
          >
            <FontAwesomeIcon icon={faPlug} />
            <span>Go to Connector</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotebookWorkspace;
