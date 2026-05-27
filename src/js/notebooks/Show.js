import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faFloppyDisk, faPencil, faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import ConfirmationModal from "../commons/ConfirmationModal";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { contextWindowUsage } from "../helpers/ContextWindowHelper";
import { getInputClassName, renderInputErrors, statusToLabel } from "../helpers/AppHelper";
import { destroySession } from "../services/AuthService";
import NotebookService from "../services/NotebookService";
import NotebookFilesPanel from "./show/NotebookFilesPanel";
import NotebookWorkspace from "./show/NotebookWorkspace";
import {
  POLLED_NOTEBOOK_FILE_STATUSES,
  normalizedRetrievalK,
  parseDownloadFilename,
  renderResponse,
  saveBlob
} from "./show/helpers";

const emptyNotebookFileForm = {
  name: "",
  file: null
};

const emptyNotebookTitleForm = {
  title: ""
};

const emptyNotebookNoteForm = {
  name: ""
};

const NotebooksShow = () => {
  const [notebook, setNotebook] = useState(null);
  const [notebookFiles, setNotebookFiles] = useState([]);
  const [notebookNotes, setNotebookNotes] = useState([]);
  const [activeNotebookTab, setActiveNotebookTab] = useState("chat");
  const [chatMessages, setChatMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [retrievalK, setRetrievalK] = useState("5");
  const [chatError, setChatError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFilesLoading, setIsFilesLoading] = useState(true);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [isInferring, setIsInferring] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showSaveNoteModal, setShowSaveNoteModal] = useState(false);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const [downloadingFileIds, setDownloadingFileIds] = useState([]);
  const [togglingNoteIds, setTogglingNoteIds] = useState([]);
  const [isFilesPanelCollapsed, setIsFilesPanelCollapsed] = useState(false);
  const [selectedNotebookFile, setSelectedNotebookFile] = useState(null);
  const [selectedNotebookNote, setSelectedNotebookNote] = useState(null);
  const [selectedNotebookNoteForDelete, setSelectedNotebookNoteForDelete] = useState(null);
  const [selectedNoteMessage, setSelectedNoteMessage] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [notebookTitleForm, setNotebookTitleForm] = useState(emptyNotebookTitleForm);
  const [notebookTitleErrors, setNotebookTitleErrors] = useState({});
  const [notebookTitleErrorMessage, setNotebookTitleErrorMessage] = useState("");
  const [notebookNoteForm, setNotebookNoteForm] = useState(emptyNotebookNoteForm);
  const [notebookNoteErrors, setNotebookNoteErrors] = useState({});
  const [notebookNoteErrorMessage, setNotebookNoteErrorMessage] = useState("");
  const [notebookFileForm, setNotebookFileForm] = useState(emptyNotebookFileForm);
  const [notebookFileErrors, setNotebookFileErrors] = useState({});
  const [notebookFileErrorMessage, setNotebookFileErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filesErrorMessage, setFilesErrorMessage] = useState("");
  const [notesErrorMessage, setNotesErrorMessage] = useState("");
  const chatLogRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const promptContextUsage = contextWindowUsage(notebook?.connector, chatMessages, prompt, renderResponse);

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

  const loadNotebookNotes = () => {
    setIsNotesLoading(true);

    NotebookService.fetchNotebookNotes(id)
      .then((response) => {
        const records = response.data.records || [];
        setNotebookNotes(records);
        setSelectedNotebookNote((currentNote) => {
          return records.find((notebookNote) => notebookNote.id === currentNote?.id) || records[0] || null;
        });
        setNotesErrorMessage("");
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          destroySession();
          navigate("/login");
          return;
        }

        setNotesErrorMessage(error.response?.data?.message || "Unable to load notebook notes.");
      })
      .finally(() => {
        setIsNotesLoading(false);
      });
  };

  const activateNotebookTab = (tabKey) => {
    setActiveNotebookTab(tabKey);
    if (tabKey === "notes") {
      loadNotebookNotes();
    }
  };

  useEffect(() => {
    loadNotebook();
    loadNotebookFiles();
    setActiveNotebookTab("chat");
    setNotebookNotes([]);
    setSelectedNotebookNote(null);
    setNotesErrorMessage("");
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

  const openDeleteNoteModal = (notebookNote) => {
    setSelectedNotebookNoteForDelete(notebookNote);
    setShowDeleteNoteModal(true);
  };

  const closeDeleteNoteModal = () => {
    if (isDeletingNote) {
      return;
    }

    setSelectedNotebookNoteForDelete(null);
    setShowDeleteNoteModal(false);
  };

  const handleDeleteNotebookNote = () => {
    if (isDeletingNote || !selectedNotebookNoteForDelete || !notebook) {
      return;
    }

    const notebookNoteId = selectedNotebookNoteForDelete.id;
    setIsDeletingNote(true);
    setNotesErrorMessage("");

    NotebookService.deleteNotebookNote(notebook.id, notebookNoteId)
      .then(() => {
        const remainingNotes = notebookNotes.filter((notebookNote) => notebookNote.id !== notebookNoteId);
        setNotebookNotes(remainingNotes);
        if (selectedNotebookNote?.id === notebookNoteId) {
          setSelectedNotebookNote(remainingNotes[0] || null);
        }
        setShowDeleteNoteModal(false);
        setSelectedNotebookNoteForDelete(null);
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setNotesErrorMessage(error.response?.data?.message || "Unable to delete notebook note.");
        setShowDeleteNoteModal(false);
        setSelectedNotebookNoteForDelete(null);
      })
      .finally(() => {
        setIsDeletingNote(false);
      });
  };

  const handleToggleNotebookNoteContext = (notebookNote) => {
    if (!notebook || togglingNoteIds.includes(notebookNote.id)) {
      return;
    }

    setTogglingNoteIds((currentIds) => {
      return [...currentIds, notebookNote.id];
    });
    setNotesErrorMessage("");

    NotebookService.toggleNotebookNoteContext(notebook.id, notebookNote.id)
      .then((response) => {
        const updatedNote = response.data;
        setNotebookNotes((currentNotes) => {
          return currentNotes.map((currentNote) => {
            return currentNote.id === updatedNote.id ? updatedNote : currentNote;
          });
        });
        setSelectedNotebookNote((currentNote) => {
          return currentNote?.id === updatedNote.id ? updatedNote : currentNote;
        });
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setNotesErrorMessage(error.response?.data?.message || "Unable to update notebook note context.");
      })
      .finally(() => {
        setTogglingNoteIds((currentIds) => {
          return currentIds.filter((noteId) => noteId !== notebookNote.id);
        });
      });
  };

  const handleClearChat = () => {
    setChatMessages([]);
    setPrompt("");
    setChatError("");
    setShowClearChatModal(false);
  };

  const openTitleModal = () => {
    setNotebookTitleForm({ title: notebook?.title || "" });
    setNotebookTitleErrors({});
    setNotebookTitleErrorMessage("");
    setShowTitleModal(true);
  };

  const closeTitleModal = () => {
    if (isUpdatingTitle) {
      return;
    }

    setShowTitleModal(false);
    setNotebookTitleForm(emptyNotebookTitleForm);
    setNotebookTitleErrors({});
    setNotebookTitleErrorMessage("");
  };

  const handleNotebookTitleFormChange = (event) => {
    const { name, value } = event.target;

    setNotebookTitleForm((currentValues) => {
      return {
        ...currentValues,
        [name]: value
      };
    });
  };

  const handleUpdateNotebookTitle = (event) => {
    event.preventDefault();
    if (isUpdatingTitle || !notebook) {
      return;
    }

    setIsUpdatingTitle(true);
    setNotebookTitleErrors({});
    setNotebookTitleErrorMessage("");

    NotebookService.updateNotebook(notebook.id, { title: notebookTitleForm.title })
      .then((response) => {
        setNotebook(response.data);
        setShowTitleModal(false);
        setNotebookTitleForm(emptyNotebookTitleForm);
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        if (error.response?.status === 422) {
          setNotebookTitleErrors(error.response.data);
          return;
        }

        setNotebookTitleErrorMessage(error.response?.data?.message || "Unable to update notebook.");
      })
      .finally(() => {
        setIsUpdatingTitle(false);
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

  const openSaveNoteModal = (message) => {
    setSelectedNoteMessage(message);
    setNotebookNoteForm(emptyNotebookNoteForm);
    setNotebookNoteErrors({});
    setNotebookNoteErrorMessage("");
    setShowSaveNoteModal(true);
  };

  const closeSaveNoteModal = () => {
    if (isSavingNote) {
      return;
    }

    setShowSaveNoteModal(false);
    setSelectedNoteMessage(null);
    setNotebookNoteForm(emptyNotebookNoteForm);
    setNotebookNoteErrors({});
    setNotebookNoteErrorMessage("");
  };

  const handleNotebookNoteFormChange = (event) => {
    const { name, value } = event.target;

    setNotebookNoteForm((currentValues) => {
      return {
        ...currentValues,
        [name]: value
      };
    });
  };

  const handleCreateNotebookNote = (event) => {
    event.preventDefault();
    if (isSavingNote || !notebook || !selectedNoteMessage) {
      return;
    }

    const content = renderResponse(selectedNoteMessage.content);
    setIsSavingNote(true);
    setNotebookNoteErrors({});
    setNotebookNoteErrorMessage("");

    NotebookService.createNotebookNote(notebook.id, {
      name: notebookNoteForm.name,
      data: {
        content,
        response: selectedNoteMessage.content
      }
    })
      .then((response) => {
        setNotebookNotes((currentNotes) => {
          return [response.data, ...currentNotes];
        });
        setSelectedNotebookNote(response.data);
        setShowSaveNoteModal(false);
        setSelectedNoteMessage(null);
        setNotebookNoteForm(emptyNotebookNoteForm);
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        if (error.response?.status === 422) {
          setNotebookNoteErrors(error.response.data);
          return;
        }

        setNotebookNoteErrorMessage(error.response?.data?.message || "Unable to save notebook note.");
      })
      .finally(() => {
        setIsSavingNote(false);
      });
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
        title={(
          <span className="d-inline-flex align-items-center gap-2">
            <span className="text-break">{notebook.title}</span>
            <button
              aria-label="Edit notebook title"
              className="btn btn-outline-secondary btn-sm talalm-icon-button flex-shrink-0"
              onClick={openTitleModal}
              title="Edit notebook title"
              type="button"
            >
              <FontAwesomeIcon icon={faPencil} />
            </button>
          </span>
        )}
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
            <Link className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" to="/notebooks">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back</span>
            </Link>
          </div>
        ]}
      />

      <div className={`row g-4 align-items-stretch talalm-notebook-layout${isFilesPanelCollapsed ? " talalm-notebook-layout-files-collapsed" : ""}`}>
        <NotebookFilesPanel
          notebook={notebook}
          notebookFiles={notebookFiles}
          isFilesLoading={isFilesLoading}
          filesErrorMessage={filesErrorMessage}
          isFilesPanelCollapsed={isFilesPanelCollapsed}
          downloadingFileIds={downloadingFileIds}
          onCollapse={() => {
            setIsFilesPanelCollapsed(true);
          }}
          onExpand={() => {
            setIsFilesPanelCollapsed(false);
          }}
          onNewFile={openFileModal}
          onDownloadFile={handleDownloadFile}
          onDeleteFile={openDeleteFileModal}
          onAuthError={handleAuthError}
          onReindexCompleted={() => {
            loadNotebookFiles();
            loadNotebook();
          }}
          onReindexError={(error) => {
            setFilesErrorMessage(error.response?.data?.message || "Unable to reindex notebook files.");
          }}
        />

        <div className={isFilesPanelCollapsed ? "col-12 col-xl talalm-notebook-chat-column" : "col-12 col-xl-8 talalm-notebook-chat-column"}>
          <NotebookWorkspace
            notebook={notebook}
            activeNotebookTab={activeNotebookTab}
            activateNotebookTab={activateNotebookTab}
            chatMessages={chatMessages}
            chatError={chatError}
            chatLogRef={chatLogRef}
            isInferring={isInferring}
            prompt={prompt}
            promptContextUsage={promptContextUsage}
            retrievalK={retrievalK}
            setPrompt={setPrompt}
            setRetrievalK={setRetrievalK}
            handlePromptSubmit={handlePromptSubmit}
            openSaveNoteModal={openSaveNoteModal}
            setShowClearChatModal={setShowClearChatModal}
            notebookNotes={notebookNotes}
            selectedNotebookNote={selectedNotebookNote}
            setSelectedNotebookNote={setSelectedNotebookNote}
            isNotesLoading={isNotesLoading}
            notesErrorMessage={notesErrorMessage}
            togglingNoteIds={togglingNoteIds}
            handleToggleNotebookNoteContext={handleToggleNotebookNoteContext}
            openDeleteNoteModal={openDeleteNoteModal}
            navigate={navigate}
          />
        </div>
      </div>

      <Modal
        backdrop={isUpdatingTitle ? "static" : true}
        keyboard={!isUpdatingTitle}
        show={showTitleModal}
        onHide={closeTitleModal}
      >
        <form onSubmit={handleUpdateNotebookTitle}>
          <Modal.Header closeButton={!isUpdatingTitle}>
            <Modal.Title>Edit Notebook</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row g-3">
              {notebookTitleErrorMessage ? (
                <div className="col-12">
                  <div className="alert alert-danger mb-0">
                    {notebookTitleErrorMessage}
                  </div>
                </div>
              ) : null}

              <div className="col-12">
                <label className="form-label" htmlFor="notebook-title">
                  Name
                </label>
                <input
                  autoFocus
                  className={getInputClassName(notebookTitleErrors, "title")}
                  disabled={isUpdatingTitle}
                  id="notebook-title"
                  name="title"
                  onChange={handleNotebookTitleFormChange}
                  value={notebookTitleForm.title}
                />
                {renderInputErrors(notebookTitleErrors, "title")}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="d-inline-flex align-items-center gap-2"
              disabled={isUpdatingTitle || !notebookTitleForm.title.trim()}
              type="submit"
              variant="primary"
            >
              {isUpdatingTitle ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              ) : (
                <FontAwesomeIcon icon={faPencil} />
              )}
              <span>{isUpdatingTitle ? "Updating..." : "Update Notebook"}</span>
            </Button>
            <Button
              className="d-inline-flex align-items-center gap-2"
              disabled={isUpdatingTitle}
              onClick={closeTitleModal}
              type="button"
              variant="secondary"
            >
              <FontAwesomeIcon icon={faXmark} />
              <span>Close</span>
            </Button>
          </Modal.Footer>
        </form>
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

      <Modal
        backdrop={isSavingNote ? "static" : true}
        keyboard={!isSavingNote}
        show={showSaveNoteModal}
        onHide={closeSaveNoteModal}
        size="lg"
      >
        <form onSubmit={handleCreateNotebookNote}>
          <Modal.Header closeButton={!isSavingNote}>
            <Modal.Title>Save Response</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="row g-3">
              {notebookNoteErrorMessage ? (
                <div className="col-12">
                  <div className="alert alert-danger mb-0">
                    {notebookNoteErrorMessage}
                  </div>
                </div>
              ) : null}

              <div className="col-12">
                <label className="form-label" htmlFor="notebook-note-name">
                  Name
                </label>
                <input
                  autoFocus
                  className={getInputClassName(notebookNoteErrors, "name")}
                  disabled={isSavingNote}
                  id="notebook-note-name"
                  name="name"
                  onChange={handleNotebookNoteFormChange}
                  value={notebookNoteForm.name}
                />
                {renderInputErrors(notebookNoteErrors, "name")}
              </div>

              <div className="col-12">
                <div className="talalm-label mb-2">Preview</div>
                <div className="talalm-note-save-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedNoteMessage ? renderResponse(selectedNoteMessage.content) : ""}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className="d-inline-flex align-items-center gap-2"
              disabled={isSavingNote || !notebookNoteForm.name.trim()}
              type="submit"
              variant="primary"
            >
              {isSavingNote ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              ) : (
                <FontAwesomeIcon icon={faFloppyDisk} />
              )}
              <span>{isSavingNote ? "Saving..." : "Save Note"}</span>
            </Button>
            <Button
              className="d-inline-flex align-items-center gap-2"
              disabled={isSavingNote}
              onClick={closeSaveNoteModal}
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
        show={showDeleteNoteModal}
        isLoading={isDeletingNote}
        header="Delete Note"
        content={`Delete ${selectedNotebookNoteForDelete?.name || "this note"}?`}
        loadingContent="Deleting note..."
        onPrimaryClicked={handleDeleteNotebookNote}
        onSecondaryClicked={closeDeleteNoteModal}
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

      <ConfirmationModal
        show={showClearChatModal}
        isLoading={false}
        header="Clear Chat Context"
        content="Clear the current chat context and reset the prompt?"
        onPrimaryClicked={handleClearChat}
        onSecondaryClicked={() => {
          setShowClearChatModal(false);
        }}
      />
    </div>
  );
};

export default NotebooksShow;
