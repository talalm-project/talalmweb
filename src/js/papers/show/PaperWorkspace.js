import React from "react";
import BuildLogsPanel from "./BuildLogsPanel";
import EditorPanel from "./EditorPanel";
import FilesPanel from "./FilesPanel";
import PdfPreviewPanel from "./PdfPreviewPanel";
import WorkspaceTabs from "./WorkspaceTabs";

const PaperWorkspace = ({
  activeCompileJob,
  activeWorkspaceTab,
  buildLogRef,
  compileErrorMessage,
  compileJob,
  contentErrorMessage,
  deletingFileIds,
  editorValue,
  expandedFolders,
  fileInputRef,
  fileTree,
  filesErrorMessage,
  folderInputRef,
  folderPaths,
  isContentLoading,
  isDownloadingPdf,
  isFilesLoading,
  isPdfLoading,
  isSelectedFileEditable,
  isUploading,
  monacoTheme,
  onChangeEditorValue,
  onChangeTab,
  onDeleteFile,
  onDeleteFolder,
  onDownloadPdf,
  onFileSelection,
  onFolderSelection,
  onOpenFilePicker,
  onOpenFolderPicker,
  onOpenJobPdf,
  onOpenPdf,
  onRefreshPdf,
  onReloadFile,
  onSelectFile,
  onToggleFolder,
  onUploadDestinationChange,
  paperFiles,
  pdfAvailable,
  pdfErrorMessage,
  pdfUrl,
  saveMessage,
  saveStatus,
  selectedPaperFile,
  uploadDestinationPath,
  uploadErrorMessage,
  uploadProgress
}) => {
  return (
    <div className="d-flex flex-column talalm-paper-workspace">
      <WorkspaceTabs activeTab={activeWorkspaceTab} compileJob={compileJob} onChange={onChangeTab} />

      {activeWorkspaceTab === "workspace" ? (
        <div className="talalm-paper-workspace-grid">
          <div className="talalm-paper-files-column">
            <FilesPanel
              deletingFileIds={deletingFileIds}
              expandedFolders={expandedFolders}
              fileInputRef={fileInputRef}
              fileTree={fileTree}
              filesErrorMessage={filesErrorMessage}
              folderInputRef={folderInputRef}
              folderPaths={folderPaths}
              isFilesLoading={isFilesLoading}
              isUploading={isUploading}
              onDeleteFile={onDeleteFile}
              onDeleteFolder={onDeleteFolder}
              onFileSelection={onFileSelection}
              onFolderSelection={onFolderSelection}
              onOpenFilePicker={onOpenFilePicker}
              onOpenFolderPicker={onOpenFolderPicker}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              onUploadDestinationChange={onUploadDestinationChange}
              paperFiles={paperFiles}
              selectedPaperFile={selectedPaperFile}
              uploadDestinationPath={uploadDestinationPath}
              uploadErrorMessage={uploadErrorMessage}
              uploadProgress={uploadProgress}
            />
          </div>

          <div className="talalm-paper-editor-column">
            <EditorPanel
              contentErrorMessage={contentErrorMessage}
              editorValue={editorValue}
              isContentLoading={isContentLoading}
              isSelectedFileEditable={isSelectedFileEditable}
              monacoTheme={monacoTheme}
              onChange={onChangeEditorValue}
              onReloadFile={onReloadFile}
              saveMessage={saveMessage}
              saveStatus={saveStatus}
              selectedPaperFile={selectedPaperFile}
            />
          </div>

          <div className="talalm-paper-preview-column">
            <PdfPreviewPanel
              activeCompileJob={activeCompileJob}
              compileJob={compileJob}
              isPdfLoading={isPdfLoading}
              onDownloadPdf={onDownloadPdf}
              onOpenPdf={onOpenPdf}
              onRefreshPdf={onRefreshPdf}
              pdfAvailable={pdfAvailable}
              pdfErrorMessage={pdfErrorMessage}
              pdfUrl={pdfUrl}
            />
          </div>
        </div>
      ) : null}

      {activeWorkspaceTab === "logs" ? (
        <BuildLogsPanel
          buildLogRef={buildLogRef}
          compileErrorMessage={compileErrorMessage}
          compileJob={compileJob}
          isDownloadingPdf={isDownloadingPdf}
          onOpenJobPdf={onOpenJobPdf}
        />
      ) : null}

    </div>
  );
};

export default PaperWorkspace;
