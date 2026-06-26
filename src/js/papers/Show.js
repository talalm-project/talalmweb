import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFloppyDisk,
  faPlay,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import AdminContent from "../commons/AdminContent";
import Loader from "../commons/Loader";
import PageHeader from "../commons/PageHeader";
import { destroySession } from "../services/AuthService";
import PaperService from "../services/PaperService";
import DeleteModals from "./show/DeleteModals";
import PaperWorkspace from "./show/PaperWorkspace";
import { AUTOSAVE_DELAY_MS, fileTreeFor, folderPathsFor, joinProjectPath } from "./show/helpers";

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
      className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
      key="delete-paper"
      onClick={openDeletePaperModal}
      type="button"
    >
      <FontAwesomeIcon icon={faTrash} />
      <span>Delete</span>
    </button>
  );

  return (
    <div className="d-flex flex-column gap-3 talalm-paper-show">
      <PageHeader eyebrow="Writing" title={paper ? paper.name : "Paper"} actions={headerActions} />

      {isLoading ? (
        <AdminContent title={paper ? paper.name : "Paper"}>
          <Loader />
        </AdminContent>
      ) : (
        <React.Fragment>
          {errorMessage ? <div className="alert alert-danger mb-0">{errorMessage}</div> : null}

          {paper ? (
            <PaperWorkspace
              activeCompileJob={activeCompileJob}
              activeWorkspaceTab={activeWorkspaceTab}
              buildLogRef={buildLogRef}
              compileErrorMessage={compileErrorMessage}
              compileJob={compileJob}
              contentErrorMessage={contentErrorMessage}
              deletingFileIds={deletingFileIds}
              editorValue={editorValue}
              expandedFolders={expandedFolders}
              fileInputRef={fileInputRef}
              fileTree={fileTree}
              filesErrorMessage={filesErrorMessage}
              folderInputRef={folderInputRef}
              folderPaths={folderPaths}
              isContentLoading={isContentLoading}
              isDownloadingPdf={isDownloadingPdf}
              isFilesLoading={isFilesLoading}
              isPdfLoading={isPdfLoading}
              isSelectedFileEditable={isSelectedFileEditable}
              isUploading={isUploading}
              monacoTheme={monacoTheme}
              onChangeEditorValue={(value) => {
                setEditorValue(value || "");
                setSaveStatus("unsaved");
                setSaveMessage("");
              }}
              onChangeTab={setActiveWorkspaceTab}
              onDeleteFile={handleDeleteFile}
              onDeleteFolder={openDeleteFolderModal}
              onDownloadPdf={downloadLatestPdf}
              onFileSelection={handleFileSelection}
              onFolderSelection={handleFolderSelection}
              onOpenFilePicker={openFilePicker}
              onOpenFolderPicker={openFolderPicker}
              onOpenJobPdf={openCompilePdf}
              onOpenPdf={openLatestPdf}
              onRefreshPdf={() => refreshLatestPdf()}
              onReloadFile={reloadSelectedFile}
              onSelectFile={switchToPaperFile}
              onToggleFolder={toggleFolder}
              onUploadDestinationChange={setUploadDestinationPath}
              paperFiles={paperFiles}
              pdfAvailable={pdfAvailable}
              pdfErrorMessage={pdfErrorMessage}
              pdfUrl={pdfUrl}
              saveMessage={saveMessage}
              saveStatus={saveStatus}
              selectedPaperFile={selectedPaperFile}
              uploadDestinationPath={uploadDestinationPath}
              uploadErrorMessage={uploadErrorMessage}
              uploadProgress={uploadProgress}
            />
          ) : null}
        </React.Fragment>
      )}

      <DeleteModals
        deleteFolder={deleteFolder}
        deleteFolderErrorMessage={deleteFolderErrorMessage}
        deletePaper={deletePaper}
        deletePaperErrorMessage={deletePaperErrorMessage}
        folderToDelete={folderToDelete}
        isDeletingFolder={isDeletingFolder}
        isDeletingPaper={isDeletingPaper}
        onCloseFolderModal={closeDeleteFolderModal}
        onClosePaperModal={closeDeletePaperModal}
        paper={paper}
        showDeletePaperModal={showDeletePaperModal}
      />
    </div>
  );
};

export default PaperShow;
