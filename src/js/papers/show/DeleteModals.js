import React from "react";
import ConfirmationModal from "../../commons/ConfirmationModal";

const DeleteModals = ({
  deleteFolder,
  deleteFolderErrorMessage,
  deletePaper,
  folderToDelete,
  isDeletingFolder,
  isDeletingPaper,
  onCloseFolderModal,
  onClosePaperModal,
  paper,
  showDeletePaperModal
}) => {
  return (
    <React.Fragment>
      <ConfirmationModal
        content={`Delete "${paper?.name || "this paper"}" and all related files, build logs, and generated PDFs? This cannot be undone.`}
        header="Delete Paper"
        isLoading={isDeletingPaper}
        loadingContent="Deleting paper..."
        onPrimaryClicked={deletePaper}
        onSecondaryClicked={onClosePaperModal}
        show={showDeletePaperModal}
      />
      <ConfirmationModal
        content={deleteFolderErrorMessage || `Delete folder "${folderToDelete?.path || ""}" and all files inside it? This cannot be undone.`}
        header="Delete Folder"
        isLoading={isDeletingFolder}
        loadingContent="Deleting folder..."
        onPrimaryClicked={deleteFolder}
        onSecondaryClicked={onCloseFolderModal}
        show={Boolean(folderToDelete)}
      />
    </React.Fragment>
  );
};

export default DeleteModals;
