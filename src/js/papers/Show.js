import React, { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChevronDown,
  faChevronRight,
  faDownload,
  faFileArrowUp,
  faFileLines,
  faFilePdf,
  faFolder,
  faFolderOpen,
  faFloppyDisk,
  faPlay,
  faRotate,
  faTerminal,
  faUpRightFromSquare,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import ConfirmationModal from "../commons/ConfirmationModal";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { destroySession } from "../services/AuthService";
import PaperService from "../services/PaperService";
import { formatByteSize } from "../notebooks/show/helpers";

const extensionFor = (paperFile) => {
  const value = paperFile?.path || paperFile?.filename || "";
  const index = value.lastIndexOf(".");
  return index >= 0 ? value.slice(index).toLowerCase() : "";
};

const languageFor = (paperFile) => {
  const extension = extensionFor(paperFile);
  if ([".cls", ".sty", ".tex"].includes(extension)) {
    return "latex";
  }
  if (extension === ".md") {
    return "markdown";
  }

  return "plaintext";
};

const fileTreeFor = (paperFiles) => {
  const root = [];

  paperFiles
    .slice()
    .sort((left, right) => left.path.localeCompare(right.path))
    .forEach((paperFile) => {
      const parts = paperFile.path.split("/").filter(Boolean);
      let level = root;
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const nodePath = parts.slice(0, index + 1).join("/");

        if (isFile) {
          level.push({
            id: paperFile.id,
            label: part,
            path: nodePath,
            type: "file",
            file: paperFile
          });
          return;
        }

        let folder = level.find((node) => node.type === "folder" && node.path === nodePath);
        if (!folder) {
          folder = {
            id: nodePath,
            label: part,
            path: nodePath,
            type: "folder",
            children: []
          };
          level.push(folder);
        }
        level = folder.children;
      });
    });

  return root;
};

const folderPathsFor = (paperFiles) => {
  const paths = new Set(["source", "assets"]);

  paperFiles.forEach((paperFile) => {
    const parts = paperFile.path.split("/").filter(Boolean);
    for (let index = 1; index < parts.length; index += 1) {
      paths.add(parts.slice(0, index).join("/"));
    }
  });

  return Array.from(paths).sort((left, right) => left.localeCompare(right));
};

const joinProjectPath = (folderPath, filePath) => {
  const cleanFolder = String(folderPath || "").trim().replace(/^\/+|\/+$/g, "");
  const cleanFile = String(filePath || "").trim().replace(/^\/+/g, "");
  return cleanFolder ? `${cleanFolder}/${cleanFile}` : cleanFile;
};

const AUTOSAVE_DELAY_MS = 2000;

const saveStatusLabelFor = (saveStatus) => {
  if (saveStatus === "saving") {
    return { className: "text-bg-info", label: "Saving..." };
  }
  if (saveStatus === "unsaved") {
    return { className: "text-bg-warning", label: "Unsaved changes" };
  }
  if (saveStatus === "save_failed") {
    return { className: "text-bg-danger", label: "Save failed" };
  }

  return { className: "text-bg-success", label: "Saved" };
};

const PaperShow = () => {
  const [paper, setPaper] = useState(null);
  const [paperFiles, setPaperFiles] = useState([]);
  const [selectedPaperFile, setSelectedPaperFile] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(["source", "assets"]));
  const [editorValue, setEditorValue] = useState("");
  const [loadedContent, setLoadedContent] = useState("");
  const [isSelectedFileEditable, setIsSelectedFileEditable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilesLoading, setIsFilesLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [compileJob, setCompileJob] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfAvailable, setPdfAvailable] = useState(false);
  const [lastKnownUpdatedAt, setLastKnownUpdatedAt] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [errorMessage, setErrorMessage] = useState("");
  const [filesErrorMessage, setFilesErrorMessage] = useState("");
  const [contentErrorMessage, setContentErrorMessage] = useState("");
  const [compileErrorMessage, setCompileErrorMessage] = useState("");
  const [pdfErrorMessage, setPdfErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [deletingFileIds, setDeletingFileIds] = useState([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("workspace");
  const [showDeletePaperModal, setShowDeletePaperModal] = useState(false);
  const [isDeletingPaper, setIsDeletingPaper] = useState(false);
  const [deletePaperErrorMessage, setDeletePaperErrorMessage] = useState("");
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [deleteFolderErrorMessage, setDeleteFolderErrorMessage] = useState("");
  const [uploadDestinationPath, setUploadDestinationPath] = useState("source");
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const buildLogRef = useRef(null);
  const pdfObjectUrlRef = useRef("");
  const autosaveTimerRef = useRef(null);
  const editorValueRef = useRef("");
  const loadedContentRef = useRef("");
  const selectedPaperFileRef = useRef(null);
  const lastKnownUpdatedAtRef = useRef(null);
  const savePromiseRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const fileTree = useMemo(() => fileTreeFor(paperFiles), [paperFiles]);
  const folderPaths = useMemo(() => folderPathsFor(paperFiles), [paperFiles]);
  const hasUnsavedChanges = selectedPaperFile && isSelectedFileEditable && editorValue !== loadedContent;
  const activeCompileJob = compileJob && ["pending", "running"].includes(compileJob.status);
  const monacoTheme = document.body.dataset.theme === "light" ? "light" : "vs-dark";

  useEffect(() => {
    editorValueRef.current = editorValue;
  }, [editorValue]);

  useEffect(() => {
    loadedContentRef.current = loadedContent;
  }, [loadedContent]);

  useEffect(() => {
    selectedPaperFileRef.current = selectedPaperFile;
  }, [selectedPaperFile]);

  useEffect(() => {
    lastKnownUpdatedAtRef.current = lastKnownUpdatedAt;
  }, [lastKnownUpdatedAt]);

  const handleAuthError = (error) => {
    if ([401, 403].includes(error.response?.status)) {
      destroySession();
      navigate("/login");
      return true;
    }

    return false;
  };

  const replacePdfUrl = (blob) => {
    if (pdfObjectUrlRef.current) {
      window.URL.revokeObjectURL(pdfObjectUrlRef.current);
    }

    const nextUrl = window.URL.createObjectURL(blob);
    pdfObjectUrlRef.current = nextUrl;
    setPdfUrl(nextUrl);
  };

  const clearPdfPreview = () => {
    if (pdfObjectUrlRef.current) {
      window.URL.revokeObjectURL(pdfObjectUrlRef.current);
      pdfObjectUrlRef.current = "";
    }

    setPdfUrl("");
    setPdfAvailable(false);
  };

  const refreshLatestPdf = ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsPdfLoading(true);
    }
    setPdfErrorMessage("");

    return PaperService.downloadLatestPdf(id)
      .then((response) => {
        replacePdfUrl(response.data);
        setPdfAvailable(true);
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        if (error.response?.status === 404) {
          clearPdfPreview();
          return;
        }

        setPdfErrorMessage(error.response?.data?.message || "Unable to load compiled PDF.");
      })
      .finally(() => {
        if (showLoading) {
          setIsPdfLoading(false);
        }
      });
  };

  const loadPaper = () => {
    setIsLoading(true);

    PaperService.fetchPaper(id)
      .then((response) => {
        setPaper(response.data);
        setErrorMessage("");
        if ((response.data.data || {}).latest_pdf_key) {
          refreshLatestPdf({ showLoading: false });
        } else {
          clearPdfPreview();
        }
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setErrorMessage(error.response?.data?.message || "Unable to load paper.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const loadPaperFiles = () => {
    setIsFilesLoading(true);

    return PaperService.fetchPaperFiles(id)
      .then((response) => {
        const records = response.data.records || [];
        setPaperFiles(records);
        setSelectedPaperFile((currentFile) => {
          return records.find((paperFile) => paperFile.id === currentFile?.id) || null;
        });
        setFilesErrorMessage("");
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setFilesErrorMessage(error.response?.data?.message || "Unable to load paper files.");
      })
      .finally(() => {
        setIsFilesLoading(false);
      });
  };

  const resetEditorState = () => {
    setEditorValue("");
    setLoadedContent("");
    setLastKnownUpdatedAt(null);
    setIsSelectedFileEditable(false);
    setContentErrorMessage("");
    setSaveMessage("");
    setSaveStatus("saved");
  };

  useEffect(() => {
    loadPaper();
    loadPaperFiles();
    setSelectedPaperFile(null);
    resetEditorState();
    setUploadErrorMessage("");
    setCompileJob(null);
    setCompileErrorMessage("");
    setPdfErrorMessage("");
    clearPdfPreview();
  }, [id]);

  useEffect(() => {
    return () => {
      if (pdfObjectUrlRef.current) {
        window.URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = "";
      }
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges || isSaving) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isSaving]);

  useEffect(() => {
    const handleInternalLinkClick = (event) => {
      if (!(hasUnsavedChanges || isSaving) || event.defaultPrevented || event.button !== 0) {
        return;
      }
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const anchor = event.target.closest?.("a[href]");
      if (!anchor) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        return;
      }

      const nextPath = url.hash ? url.hash.replace(/^#/, "") : `${url.pathname}${url.search}`;
      const currentPath = window.location.hash.replace(/^#/, "") || `${window.location.pathname}${window.location.search}`;
      if (!nextPath || nextPath === currentPath) {
        return;
      }

      event.preventDefault();
      saveSelectedFile({ showSuccess: false }).then((saved) => {
        if (saved) {
          navigate(nextPath);
          return;
        }

        const discard = window.confirm("You have unsaved changes. Do you want to discard them?");
        if (discard) {
          navigate(nextPath);
        }
      });
    };

    document.addEventListener("click", handleInternalLinkClick, true);
    return () => {
      document.removeEventListener("click", handleInternalLinkClick, true);
    };
  }, [hasUnsavedChanges, isSaving, navigate]);

  useEffect(() => {
    if (!activeCompileJob) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      PaperService.fetchCompileJob(id, compileJob.id)
        .then((response) => {
          setCompileJob(response.data);
          if (!["pending", "running"].includes(response.data.status)) {
            setIsCompiling(false);
          }
          if (response.data.status === "success") {
            refreshLatestPdf({ showLoading: false });
          }
          setCompileErrorMessage("");
        })
        .catch((error) => {
          if (handleAuthError(error)) {
            return;
          }

          setCompileErrorMessage(error.response?.data?.message || "Unable to refresh compile status.");
          setIsCompiling(false);
        });
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [id, compileJob?.id, activeCompileJob]);

  useEffect(() => {
    if (buildLogRef.current) {
      buildLogRef.current.scrollTop = buildLogRef.current.scrollHeight;
    }
  }, [compileJob?.logs]);

  const loadPaperFileContent = (paperFile) => {
    setSelectedPaperFile(paperFile);
    resetEditorState();
    setIsContentLoading(true);

    PaperService.fetchPaperFileContent(id, paperFile.id)
      .then((response) => {
        const payload = response.data;
        setSelectedPaperFile(payload.file);
        setIsSelectedFileEditable(payload.editable);
        setEditorValue(payload.content || "");
        setLoadedContent(payload.content || "");
        setLastKnownUpdatedAt(payload.file?.updated_at || null);
        setSaveStatus("saved");
        setContentErrorMessage(payload.editable ? "" : payload.message || "This file type cannot be edited.");
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setContentErrorMessage(error.response?.data?.message || "Unable to load file content.");
      })
      .finally(() => {
        setIsContentLoading(false);
      });
  };

  const saveSelectedFile = ({ showSuccess = true } = {}) => {
    const paperFile = selectedPaperFileRef.current;

    if (!paperFile || !isSelectedFileEditable) {
      return Promise.resolve(true);
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (savePromiseRef.current) {
      return savePromiseRef.current.then((saved) => {
        if (!saved) {
          return false;
        }
        if (editorValueRef.current !== loadedContentRef.current) {
          return saveSelectedFile({ showSuccess });
        }

        return true;
      });
    }

    const contentToSave = editorValueRef.current;
    if (contentToSave === loadedContentRef.current) {
      setSaveStatus("saved");
      return Promise.resolve(true);
    }

    setIsSaving(true);
    setSaveStatus("saving");
    setSaveMessage("");
    setContentErrorMessage("");

    const savePromise = PaperService.updatePaperFileContent(id, paperFile.id, {
      content: contentToSave,
      last_known_updated_at: lastKnownUpdatedAtRef.current
    })
      .then((response) => {
        const savedFile = response.data.file;
        setSelectedPaperFile(savedFile);
        setLoadedContent(contentToSave);
        setLastKnownUpdatedAt(savedFile?.updated_at || null);
        setSaveStatus(editorValueRef.current === contentToSave ? "saved" : "unsaved");
        setSaveMessage(showSuccess ? "Saved successfully." : "");
        loadPaperFiles();
        return true;
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return false;
        }

        const errors = error.response?.data;
        if (error.response?.status === 409) {
          setContentErrorMessage(errors?.message || "This file was changed elsewhere. Please reload before saving.");
        } else if (errors?.content || errors?.file) {
          setContentErrorMessage([...errors.content || [], ...errors.file || []].join(", "));
        } else {
          setContentErrorMessage(error.response?.data?.message || "Unable to save file content.");
        }
        setSaveStatus("save_failed");
        return false;
      })
      .finally(() => {
        setIsSaving(false);
        savePromiseRef.current = null;
      });

    savePromiseRef.current = savePromise;
    return savePromise;
  };

  useEffect(() => {
    if (!selectedPaperFile || !isSelectedFileEditable || isContentLoading) {
      return undefined;
    }

    if (editorValue === loadedContent) {
      if (!isSaving) {
        setSaveStatus("saved");
      }
      return undefined;
    }

    setSaveStatus((currentStatus) => currentStatus === "saving" ? currentStatus : "unsaved");
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      saveSelectedFile({ showSuccess: false });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [editorValue, loadedContent, selectedPaperFile?.id, isSelectedFileEditable, isContentLoading]);

  const compilePaper = async () => {
    if (hasUnsavedChanges || isSaving) {
      const saved = await saveSelectedFile({ showSuccess: false });
      if (!saved) {
        setCompileErrorMessage("Compilation canceled because the current file could not be saved.");
        return;
      }
    }

    setIsCompiling(true);
    setCompileErrorMessage("");

    PaperService.compilePaper(id)
      .then((response) => {
        setCompileJob(response.data);
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        const errors = error.response?.data;
        setCompileErrorMessage(errors?.files?.join(", ") || errors?.message || "Unable to start compilation.");
        setIsCompiling(false);
      });
  };

  const switchToPaperFile = async (paperFile) => {
    if (selectedPaperFile?.id === paperFile.id) {
      return;
    }

    if (hasUnsavedChanges || isSaving) {
      const saved = await saveSelectedFile({ showSuccess: false });
      if (!saved) {
        const discard = window.confirm("You have unsaved changes. Do you want to discard them?");
        if (!discard) {
          return;
        }
      }
    }

    loadPaperFileContent(paperFile);
  };

  const leavePaper = async () => {
    if (hasUnsavedChanges || isSaving) {
      const saved = await saveSelectedFile({ showSuccess: false });
      if (!saved) {
        const discard = window.confirm("You have unsaved changes. Do you want to discard them?");
        if (!discard) {
          return;
        }
      }
    }

    navigate("/papers");
  };

  const reloadSelectedFile = () => {
    if (selectedPaperFile) {
      loadPaperFileContent(selectedPaperFile);
    }
  };

  const openCompilePdf = () => {
    if (!compileJob || compileJob.status !== "success") {
      return;
    }

    setIsDownloadingPdf(true);
    setCompileErrorMessage("");

    PaperService.downloadCompileJobPdf(id, compileJob.id)
      .then((response) => {
        const url = window.URL.createObjectURL(response.data);
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 60_000);
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setCompileErrorMessage(error.response?.data?.message || "Unable to open compiled PDF.");
      })
      .finally(() => {
        setIsDownloadingPdf(false);
      });
  };

  const openLatestPdf = () => {
    if (!pdfAvailable || !pdfUrl) {
      return;
    }

    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const downloadLatestPdf = () => {
    if (!pdfAvailable || !pdfUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${paper?.name || "paper"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const openFolderPicker = () => {
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
      folderInputRef.current.click();
    }
  };

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    uploadFiles(files, { preserveRelativePath: false });
  };

  const handleFolderSelection = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    uploadFiles(files, { preserveRelativePath: true });
  };

  const uploadFiles = async (files, { preserveRelativePath = false } = {}) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadErrorMessage("");

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const relativePath = preserveRelativePath ? file.webkitRelativePath || file.name : file.name;
        const projectPath = joinProjectPath(uploadDestinationPath, relativePath);
        await PaperService.uploadPaperFile(id, file, {
          path: projectPath,
          onUploadProgress: (progressEvent) => {
            const fileProgress = progressEvent.total ? progressEvent.loaded / progressEvent.total : 1;
            const overallProgress = Math.round(((index + fileProgress) / files.length) * 100);
            setUploadProgress(overallProgress);
          }
        });
      }

      await loadPaperFiles();
    } catch (error) {
      if (handleAuthError(error)) {
        return;
      }

      const errors = error.response?.data;
      if (errors?.file || errors?.path) {
        setUploadErrorMessage([...errors.file || [], ...errors.path || []].join(", "));
      } else {
        setUploadErrorMessage(error.response?.data?.message || "Unable to upload paper file.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteFile = (paperFile) => {
    setDeletingFileIds((currentIds) => [...currentIds, paperFile.id]);
    setFilesErrorMessage("");

    PaperService.deletePaperFile(id, paperFile.id)
      .then(() => {
        if (selectedPaperFile?.id === paperFile.id) {
          setSelectedPaperFile(null);
          resetEditorState();
        }
        loadPaperFiles();
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setFilesErrorMessage(error.response?.data?.message || "Unable to delete paper file.");
      })
      .finally(() => {
        setDeletingFileIds((currentIds) => {
          return currentIds.filter((fileId) => fileId !== paperFile.id);
        });
      });
  };

  const openDeleteFolderModal = (folderNode) => {
    setFolderToDelete(folderNode);
    setDeleteFolderErrorMessage("");
  };

  const closeDeleteFolderModal = () => {
    if (isDeletingFolder) {
      return;
    }

    setFolderToDelete(null);
    setDeleteFolderErrorMessage("");
  };

  const deleteFolder = () => {
    if (!folderToDelete) {
      return;
    }

    setIsDeletingFolder(true);
    setDeleteFolderErrorMessage("");

    PaperService.deletePaperFolder(id, folderToDelete.path)
      .then(() => {
        if (selectedPaperFile?.path === folderToDelete.path || selectedPaperFile?.path?.startsWith(`${folderToDelete.path}/`)) {
          setSelectedPaperFile(null);
          resetEditorState();
        }
        setFolderToDelete(null);
        loadPaperFiles();
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setDeleteFolderErrorMessage(error.response?.data?.message || "Unable to delete folder.");
      })
      .finally(() => {
        setIsDeletingFolder(false);
      });
  };

  const openDeletePaperModal = () => {
    setDeletePaperErrorMessage("");
    setShowDeletePaperModal(true);
  };

  const closeDeletePaperModal = () => {
    if (isDeletingPaper) {
      return;
    }

    setShowDeletePaperModal(false);
    setDeletePaperErrorMessage("");
  };

  const deletePaper = () => {
    setIsDeletingPaper(true);
    setDeletePaperErrorMessage("");

    PaperService.deletePaper(id)
      .then(() => {
        setShowDeletePaperModal(false);
        navigate("/papers");
      })
      .catch((error) => {
        if (handleAuthError(error)) {
          return;
        }

        setDeletePaperErrorMessage(error.response?.data?.message || "Unable to delete paper.");
      })
      .finally(() => {
        setIsDeletingPaper(false);
      });
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders((currentFolders) => {
      const nextFolders = new Set(currentFolders);
      if (nextFolders.has(folderPath)) {
        nextFolders.delete(folderPath);
      } else {
        nextFolders.add(folderPath);
      }

      return nextFolders;
    });
  };

  const renderTreeNodes = (nodes, depth = 0) => {
    return nodes.map((node) => {
      const paddingLeft = `${depth * 1.1}rem`;

      if (node.type === "folder") {
        const isExpanded = expandedFolders.has(node.path);
        return (
          <React.Fragment key={node.id}>
            <div className="list-group-item d-flex align-items-center justify-content-between gap-2" style={{ paddingLeft }}>
              <button
                className="btn btn-link p-0 text-start text-decoration-none d-inline-flex align-items-center gap-2"
                onClick={() => {
                  toggleFolder(node.path);
                }}
                type="button"
              >
                <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} />
                <FontAwesomeIcon icon={isExpanded ? faFolderOpen : faFolder} />
                <span className="fw-semibold">{node.label}</span>
              </button>
              <button
                aria-label={`Delete ${node.path}`}
                className="btn btn-outline-danger btn-sm talalm-icon-button"
                onClick={() => {
                  openDeleteFolderModal(node);
                }}
                title="Delete folder"
                type="button"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
            {isExpanded ? renderTreeNodes(node.children, depth + 1) : null}
          </React.Fragment>
        );
      }

      const paperFile = node.file;
      const isSelected = selectedPaperFile?.id === paperFile.id;
      const isDeleting = deletingFileIds.includes(paperFile.id);
      return (
        <div className={`list-group-item ${isSelected ? "active" : ""}`} key={paperFile.id} style={{ paddingLeft }}>
          <div className="d-flex align-items-start justify-content-between gap-2">
            <button
              className={`btn btn-link p-0 text-start text-decoration-none ${isSelected ? "text-white" : ""}`}
              onClick={() => {
                switchToPaperFile(paperFile);
              }}
              type="button"
            >
              <div className="fw-semibold d-inline-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faFileLines} />
                <span>{node.label}</span>
              </div>
              <div className={isSelected ? "small text-white-50" : "small text-muted"}>
                {formatByteSize(paperFile.size)}
                {paperFile.content_type ? ` · ${paperFile.content_type}` : ""}
              </div>
            </button>
            <button
              aria-label={`Delete ${paperFile.filename}`}
              className={isSelected ? "btn btn-outline-light btn-sm talalm-icon-button" : "btn btn-outline-danger btn-sm talalm-icon-button"}
              disabled={isDeleting}
              onClick={() => {
                handleDeleteFile(paperFile);
              }}
              title="Delete file"
              type="button"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
      );
    });
  };

  const headerActions = [
    <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" key="back-papers" onClick={leavePaper} type="button">
      <FontAwesomeIcon icon={faArrowLeft} />
      <span>Back to Papers</span>
    </button>
  ];

  if (selectedPaperFile && isSelectedFileEditable) {
    headerActions.push(
      <button
        className="btn btn-primary d-inline-flex align-items-center gap-2"
        disabled={!hasUnsavedChanges || isSaving}
        key="save-file"
        onClick={() => saveSelectedFile()}
        type="button"
      >
        <FontAwesomeIcon icon={faFloppyDisk} />
        <span>{isSaving ? "Saving..." : "Save"}</span>
      </button>
    );
  }
  headerActions.push(
    <button
      className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
      disabled={isCompiling || activeCompileJob}
      key="compile-paper"
      onClick={compilePaper}
      type="button"
    >
      <FontAwesomeIcon icon={faPlay} />
      <span>{isCompiling || activeCompileJob ? "Compiling..." : "Compile"}</span>
    </button>
  );
  headerActions.push(
    <button
      className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
      disabled={isPdfLoading}
      key="refresh-pdf"
      onClick={() => refreshLatestPdf()}
      type="button"
    >
      <FontAwesomeIcon icon={faRotate} />
      <span>{isPdfLoading ? "Refreshing..." : "Refresh PDF"}</span>
    </button>
  );
  headerActions.push(
    <button
      className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
      disabled={!pdfAvailable || isPdfLoading}
      key="download-pdf"
      onClick={downloadLatestPdf}
      type="button"
    >
      <FontAwesomeIcon icon={faDownload} />
      <span>Download PDF</span>
    </button>
  );
  const saveStatusLabel = saveStatusLabelFor(saveStatus);

  return (
    <div className="d-flex flex-column gap-4">
      <PageHeader
        eyebrow="Writing"
        title={paper ? paper.name : "Paper"}
        actions={headerActions}
      />

      {isLoading ? (
        <AdminContent title={paper ? paper.name : "Paper"}>
          <Loader />
        </AdminContent>
      ) : (
        <React.Fragment>
          {errorMessage ? (
            <div className="alert alert-danger mb-0">
              {errorMessage}
            </div>
          ) : null}

          {paper ? (
            <div className="d-flex flex-column gap-4">
              <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    aria-selected={activeWorkspaceTab === "workspace"}
                    className={`nav-link d-inline-flex align-items-center gap-2 ${activeWorkspaceTab === "workspace" ? "active" : ""}`}
                    onClick={() => setActiveWorkspaceTab("workspace")}
                    role="tab"
                    type="button"
                  >
                    <FontAwesomeIcon icon={faFileLines} />
                    <span>Editor</span>
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    aria-selected={activeWorkspaceTab === "logs"}
                    className={`nav-link d-inline-flex align-items-center gap-2 ${activeWorkspaceTab === "logs" ? "active" : ""}`}
                    onClick={() => setActiveWorkspaceTab("logs")}
                    role="tab"
                    type="button"
                  >
                    <FontAwesomeIcon icon={faTerminal} />
                    <span>Build Logs</span>
                    {compileJob ? (
                      <span className={`badge ms-2 ${compileJob.status === "success" ? "text-bg-success" : compileJob.status === "failed" ? "text-bg-danger" : "text-bg-secondary"}`}>
                        {compileJob.status}
                      </span>
                    ) : null}
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    aria-selected={activeWorkspaceTab === "actions"}
                    className={`nav-link d-inline-flex align-items-center gap-2 ${activeWorkspaceTab === "actions" ? "active" : ""}`}
                    onClick={() => setActiveWorkspaceTab("actions")}
                    role="tab"
                    type="button"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Actions</span>
                  </button>
                </li>
              </ul>

              {activeWorkspaceTab === "workspace" ? (
                <div className="row g-4">
                  <div className="col-12 col-xl-2">
                <AdminContent
                  title="Files"
                  headerActions={[
                    <button
                      className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                      disabled={isUploading}
                      key="upload-file"
                      onClick={openFilePicker}
                      type="button"
                    >
                      <FontAwesomeIcon icon={faFileArrowUp} />
                      <span>{isUploading ? "Uploading..." : "Upload File"}</span>
                    </button>,
                    <button
                      className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                      disabled={isUploading}
                      key="upload-folder"
                      onClick={openFolderPicker}
                      type="button"
                    >
                      <FontAwesomeIcon icon={faFolderOpen} />
                      <span>Upload Folder</span>
                    </button>
                  ]}
                >
                  <input
                    className="d-none"
                    multiple
                    onChange={handleFileSelection}
                    ref={fileInputRef}
                    type="file"
                  />
                  <input
                    className="d-none"
                    directory=""
                    multiple
                    onChange={handleFolderSelection}
                    ref={folderInputRef}
                    type="file"
                    webkitdirectory=""
                  />

                  <div className="mb-3">
                    <label className="form-label" htmlFor="paper-upload-destination">
                      Upload destination
                    </label>
                    <select
                      className="form-control"
                      id="paper-upload-destination"
                      onChange={(event) => setUploadDestinationPath(event.target.value)}
                      value={uploadDestinationPath}
                    >
                      {folderPaths.map((folderPath) => (
                        <option key={folderPath} value={folderPath}>
                          {folderPath}
                        </option>
                      ))}
                      <option value="">Project root</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="paper-custom-upload-destination">
                      New folder path
                    </label>
                    <input
                      className="form-control"
                      id="paper-custom-upload-destination"
                      onChange={(event) => setUploadDestinationPath(event.target.value)}
                      placeholder="source/sections"
                      value={folderPaths.includes(uploadDestinationPath) || uploadDestinationPath === "" ? "" : uploadDestinationPath}
                    />
                    <div className="form-text">
                      Select an existing folder above, or type a new folder path here before uploading.
                    </div>
                  </div>

                  {uploadProgress !== null ? (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Uploading</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="progress">
                        <div
                          aria-valuemax="100"
                          aria-valuemin="0"
                          aria-valuenow={uploadProgress}
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {uploadErrorMessage ? (
                    <div className="alert alert-danger">
                      {uploadErrorMessage}
                    </div>
                  ) : null}

                  {filesErrorMessage ? (
                    <div className="alert alert-danger">
                      {filesErrorMessage}
                    </div>
                  ) : null}

                  {isFilesLoading ? (
                    <Loader />
                  ) : (
                    <React.Fragment>
                      {paperFiles.length === 0 ? (
                        <div className="talalm-empty-state">
                          <FontAwesomeIcon icon={faFolderOpen} />
                          <span>No files uploaded.</span>
                        </div>
                      ) : (
                        <div className="list-group">
                          {renderTreeNodes(fileTree)}
                        </div>
                      )}
                    </React.Fragment>
                  )}
                </AdminContent>
                  </div>

                  <div className="col-12 col-xl-5">
                <AdminContent title={selectedPaperFile ? selectedPaperFile.path : "Editor"}>
                  <div className="d-flex flex-column gap-3">
                    {selectedPaperFile && isSelectedFileEditable ? (
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className={`badge ${saveStatusLabel.className}`}>{saveStatusLabel.label}</span>
                        {saveMessage ? (
                          <span className="badge text-bg-success">{saveMessage}</span>
                        ) : null}
                        {saveStatus === "save_failed" ? (
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={reloadSelectedFile}
                            type="button"
                          >
                            Reload File
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {contentErrorMessage ? (
                      <div className={isSelectedFileEditable ? "alert alert-danger mb-0" : "alert alert-info mb-0"}>
                        {contentErrorMessage}
                      </div>
                    ) : null}

                    {!selectedPaperFile ? (
                      <div className="talalm-empty-state">
                        <FontAwesomeIcon icon={faFileLines} />
                        <span>Select a file to begin editing.</span>
                      </div>
                    ) : null}

                    {selectedPaperFile && isContentLoading ? (
                      <Loader />
                    ) : null}

                    {selectedPaperFile && isSelectedFileEditable && !isContentLoading ? (
                      <div className="border">
                        <Editor
                          height="64vh"
                          language={languageFor(selectedPaperFile)}
                          onChange={(value) => {
                            setEditorValue(value || "");
                            setSaveStatus("unsaved");
                            setSaveMessage("");
                          }}
                          options={{
                            lineNumbers: "on",
                            minimap: { enabled: true },
                            wordWrap: "on"
                          }}
                          theme={monacoTheme}
                          value={editorValue}
                        />
                      </div>
                    ) : null}
                  </div>
                </AdminContent>
                  </div>

                  <div className="col-12 col-xl-5">
                <AdminContent
                  title="PDF Preview"
                  headerActions={[
                    <button
                      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                      disabled={isPdfLoading}
                      key="refresh-pdf-panel"
                      onClick={() => refreshLatestPdf()}
                      type="button"
                    >
                      <FontAwesomeIcon icon={faRotate} />
                      <span>{isPdfLoading ? "Refreshing..." : "Refresh"}</span>
                    </button>,
                    <button
                      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                      disabled={!pdfAvailable || isPdfLoading}
                      key="download-pdf-panel"
                      onClick={downloadLatestPdf}
                      type="button"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                      <span>Download</span>
                    </button>,
                    <button
                      className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                      disabled={!pdfAvailable || isPdfLoading}
                      key="open-latest-pdf"
                      onClick={openLatestPdf}
                      type="button"
                    >
                      <FontAwesomeIcon icon={faUpRightFromSquare} />
                      <span>Open</span>
                    </button>
                  ]}
                >
                  <div className="d-flex flex-column gap-3">
                    {pdfErrorMessage ? (
                      <div className="alert alert-danger mb-0">
                        {pdfErrorMessage}
                      </div>
                    ) : null}

                    {activeCompileJob ? (
                      <div className="alert alert-info mb-0">Compilation in progress...</div>
                    ) : null}

                    {compileJob?.status === "failed" ? (
                      <div className="alert alert-danger mb-0">
                        Compilation failed. Review the build logs below.
                      </div>
                    ) : null}

                    {isPdfLoading ? (
                      <Loader />
                    ) : null}

                    {!isPdfLoading && !pdfAvailable ? (
                      <div className="talalm-empty-state">
                        <FontAwesomeIcon icon={faFilePdf} />
                        <span>No compiled PDF available.</span>
                        <span className="text-muted">Compile the project to generate a PDF.</span>
                      </div>
                    ) : null}

                    {!isPdfLoading && pdfAvailable && pdfUrl ? (
                      <div className="border bg-body-tertiary" style={{ minHeight: "64vh" }}>
                        <iframe
                          className="border-0 d-block w-100"
                          src={pdfUrl}
                          style={{ height: "64vh" }}
                          title="PDF Preview"
                        />
                      </div>
                    ) : null}
                  </div>
                </AdminContent>
                  </div>
                </div>
              ) : null}

              {activeWorkspaceTab === "logs" ? (
                <AdminContent
                  title="Build Logs"
                  headerActions={[
                    compileJob?.status === "success" ? (
                      <button
                        className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                        disabled={isDownloadingPdf}
                        key="open-pdf"
                        onClick={openCompilePdf}
                        type="button"
                      >
                        <span>{isDownloadingPdf ? "Opening..." : "Open Job PDF"}</span>
                      </button>
                    ) : null
                  ].filter(Boolean)}
                >
                  <div className="d-flex flex-column gap-3">
                    {compileErrorMessage ? (
                      <div className="alert alert-danger mb-0">
                        {compileErrorMessage}
                      </div>
                    ) : null}

                    {compileJob ? (
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="talalm-label">Status</span>
                        <span className={`badge ${compileJob.status === "success" ? "text-bg-success" : compileJob.status === "failed" ? "text-bg-danger" : "text-bg-secondary"}`}>
                          {compileJob.status.toUpperCase()}
                        </span>
                        {compileJob.status === "pending" ? (
                          <span className="text-muted">Compilation queued...</span>
                        ) : null}
                        {compileJob.status === "running" ? (
                          <span className="text-muted">Compiling...</span>
                        ) : null}
                        {compileJob.status === "success" ? (
                          <span className="text-muted">Compilation successful.</span>
                        ) : null}
                        {compileJob.status === "failed" ? (
                          <span className="text-muted">Compilation failed.</span>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-muted">No compile job has run yet.</div>
                    )}

                    {compileJob?.error_message ? (
                      <div className="alert alert-danger mb-0">
                        {compileJob.error_message}
                      </div>
                    ) : null}

                    <pre
                      className="talalm-build-log mb-0 p-3"
                      ref={buildLogRef}
                      style={{ maxHeight: "18rem", overflowY: "auto", whiteSpace: "pre-wrap" }}
                    >
                      {compileJob?.logs || "Build logs will appear here after compilation starts."}
                    </pre>
                  </div>
                </AdminContent>
              ) : null}

              {activeWorkspaceTab === "actions" ? (
                <AdminContent title="Actions">
                  <div className="d-flex flex-column gap-3">
                    {deletePaperErrorMessage ? (
                      <div className="alert alert-danger mb-0">
                        {deletePaperErrorMessage}
                      </div>
                    ) : null}

                    <div className="border border-danger p-3">
                      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                        <div>
                          <h2 className="h5 mb-2">Delete Paper</h2>
                          <p className="mb-0 text-muted">
                            Permanently delete this paper, its uploaded project files, compile jobs, build logs, and generated PDFs.
                          </p>
                        </div>
                        <button
                          className="btn btn-outline-danger d-inline-flex align-items-center gap-2 flex-shrink-0"
                          onClick={openDeletePaperModal}
                          type="button"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          <span>Delete Paper</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </AdminContent>
              ) : null}
            </div>
          ) : null}
        </React.Fragment>
      )}

      <ConfirmationModal
        content={`Delete "${paper?.name || "this paper"}" and all related files, build logs, and generated PDFs? This cannot be undone.`}
        header="Delete Paper"
        isLoading={isDeletingPaper}
        loadingContent="Deleting paper..."
        onPrimaryClicked={deletePaper}
        onSecondaryClicked={closeDeletePaperModal}
        show={showDeletePaperModal}
      />
      <ConfirmationModal
        content={deleteFolderErrorMessage || `Delete folder "${folderToDelete?.path || ""}" and all files inside it? This cannot be undone.`}
        header="Delete Folder"
        isLoading={isDeletingFolder}
        loadingContent="Deleting folder..."
        onPrimaryClicked={deleteFolder}
        onSecondaryClicked={closeDeleteFolderModal}
        show={Boolean(folderToDelete)}
      />
    </div>
  );
};

export default PaperShow;
